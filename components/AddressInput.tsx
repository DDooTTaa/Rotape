"use client";

import { useState, useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string;
          addressType: string;
          bname: string;
          buildingName: string;
          zonecode: string;
          roadAddress: string;
          jibunAddress: string;
        }) => void;
        width?: string;
        height?: string;
      }) => {
        open: () => void;
      };
    };
  }
}

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function AddressInput({
  value,
  onChange,
  placeholder = "주소를 검색하세요",
  className = "",
  required = false,
}: AddressInputProps) {
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // 기존 주소에서 기본주소와 상세주소 분리
  // 구분자 " | " 를 사용하여 분리 (기본주소 | 상세주소)
  useEffect(() => {
    if (value) {
      const separator = " | ";
      const separatorIndex = value.indexOf(separator);
      
      if (separatorIndex > 0) {
        // 구분자가 있으면 명확하게 분리
        const base = value.substring(0, separatorIndex).trim();
        const detail = value.substring(separatorIndex + separator.length).trim();
        setBaseAddress(base);
        setDetailAddress(detail);
      } else {
        // 구분자가 없으면 전체를 기본주소로 간주
        // (기존 데이터 호환성을 위해)
        setBaseAddress(value.trim());
        setDetailAddress("");
      }
    } else {
      setBaseAddress("");
      setDetailAddress("");
    }
  }, [value]);

  const handleAddressSearch = () => {
    if (!isScriptLoaded || !window.daum) {
      alert("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    // 현재 상세주소를 저장 (클로저 문제 방지)
    const currentDetailAddress = detailAddress;

    new window.daum.Postcode({
      oncomplete: (data) => {
        // 사용자가 선택한 주소 타입에 따라 주소 선택
        // addressType: "R" = 도로명주소, "J" = 지번주소
        let fullAddress = "";
        
        if (data.addressType === "R") {
          // 도로명주소 선택 시
          fullAddress = data.roadAddress || data.address;
          let extraAddress = "";
          
          // 참고항목 추가 (법정동명, 건물명)
          if (data.bname !== "" && !fullAddress.includes(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName !== "" && !fullAddress.includes(data.buildingName)) {
            extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
          }
          if (extraAddress !== "") {
            fullAddress += ` (${extraAddress})`;
          }
        } else {
          // 지번주소 선택 시
          fullAddress = data.jibunAddress || data.address;
        }

        // 기본주소 설정
        setBaseAddress(fullAddress);
        
        // 상세주소가 있으면 구분자와 함께 저장, 없으면 기본주소만 저장
        const finalAddress = currentDetailAddress ? `${fullAddress} | ${currentDetailAddress}` : fullAddress;
        onChange(finalAddress);
      },
      width: "100%",
      height: "100%",
    }).open();
  };

  const handleDetailAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const detail = e.target.value.trim();
    setDetailAddress(detail);
    
    // 기본주소와 상세주소를 구분자로 결합
    if (!baseAddress) {
      // 기본주소가 없으면 상세주소만 저장하지 않음
      return;
    }
    
    const fullAddress = detail ? `${baseAddress} | ${detail}` : baseAddress;
    onChange(fullAddress);
  };

  return (
    <>
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="lazyOnload"
        onLoad={() => setIsScriptLoaded(true)}
      />
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={baseAddress}
            placeholder={placeholder}
            className={`flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary cursor-pointer ${className}`}
            onClick={handleAddressSearch}
            required={required}
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:opacity-90 transition whitespace-nowrap"
          >
            주소 검색
          </button>
        </div>
        <input
          type="text"
          value={detailAddress}
          onChange={handleDetailAddressChange}
          placeholder="상세주소를 입력하세요 (예: 101호, 2층)"
          className={`w-full px-4 py-2 rounded-lg bg-gray-100 text-gray-800 border-2 border-primary/30 focus:border-primary ${className}`}
        />
      </div>
    </>
  );
}


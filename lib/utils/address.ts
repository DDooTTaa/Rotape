/**
 * 주소를 표시용으로 포맷팅합니다.
 * 저장된 주소의 구분자 " | " 를 공백으로 변환하여 자연스럽게 표시합니다.
 */
export function formatAddressForDisplay(address: string | undefined | null): string {
  if (!address) return "";
  // 구분자 " | " 를 공백으로 변환
  return address.replace(/\s*\|\s*/g, " ");
}

/**
 * 주소에서 기본주소(도로명주소)만 추출합니다.
 */
export function getBaseAddress(address: string | undefined | null): string {
  if (!address) return "";
  const separator = " | ";
  const separatorIndex = address.indexOf(separator);
  if (separatorIndex > 0) {
    return address.substring(0, separatorIndex);
  }
  return address;
}

/**
 * 주소에서 상세주소만 추출합니다.
 */
export function getDetailAddress(address: string | undefined | null): string {
  if (!address) return "";
  const separator = " | ";
  const separatorIndex = address.indexOf(separator);
  if (separatorIndex > 0) {
    return address.substring(separatorIndex + separator.length);
  }
  return "";
}



"use client";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4 py-4">
      <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">약관 동의</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="닫기"
          >
            <svg
              className="w-5 h-5 md:w-6 md:h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <div className="space-y-6 mb-6 text-sm md:text-base text-gray-700">
          {/* 서비스 이용약관 */}
          <section>
            <h3 className="text-lg md:text-xl font-bold text-primary mb-3">제1조 (서비스 이용약관)</h3>
            <div className="space-y-2 leading-relaxed">
              <p><strong>1. 목적</strong></p>
              <p className="ml-4">본 약관은 Rotape(이하 &quot;회사&quot;)가 제공하는 로테이션 소개팅 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
              
              <p><strong>2. 서비스의 내용</strong></p>
              <p className="ml-4">회사는 로테이션 소개팅 행사를 주최하고, 이용자가 행사에 참여할 수 있도록 지원서 접수 및 관리 서비스를 제공합니다.</p>
              
              <p><strong>3. 이용자의 의무</strong></p>
              <ul className="ml-4 list-disc list-inside space-y-1">
                <li>이용자는 본인의 실제 정보를 정확하게 제공해야 합니다.</li>
                <li>타인의 정보를 도용하거나 허위 정보를 제공해서는 안 됩니다.</li>
                <li>서비스 이용 중 다른 이용자에게 피해를 주는 행위를 해서는 안 됩니다.</li>
                <li>행사 당일 무단 불참 시 향후 서비스 이용에 제한이 있을 수 있습니다.</li>
              </ul>
              
              <p><strong>4. 회사의 권리와 의무</strong></p>
              <ul className="ml-4 list-disc list-inside space-y-1">
                <li>회사는 이용자의 지원서를 검토하고 승인/거절할 권리가 있습니다.</li>
                <li>회사는 서비스의 원활한 운영을 위해 필요한 조치를 취할 수 있습니다.</li>
                <li>부적절한 행위를 한 이용자에 대해서는 서비스 이용을 제한할 수 있습니다.</li>
              </ul>
            </div>
          </section>

          {/* 개인정보 처리방침 */}
          <section>
            <h3 className="text-lg md:text-xl font-bold text-primary mb-3">제2조 (개인정보 처리방침)</h3>
            <div className="space-y-2 leading-relaxed">
              <p><strong>1. 수집하는 개인정보 항목</strong></p>
              <ul className="ml-4 list-disc list-inside space-y-1">
                <li>필수항목: 이름, 성별, 생년월일, 연락처, 프로필 사진, 직업, 자기소개, 이상형, 연애에 있어서 더 중요한 가치</li>
                <li>자동 수집 항목: IP 주소, 쿠키, 접속 로그, 기기 정보</li>
              </ul>
              
              <p><strong>2. 개인정보의 수집 및 이용 목적</strong></p>
              <ul className="ml-4 list-disc list-inside space-y-1">
                <li>서비스 제공 및 행사 운영</li>
                <li>이용자 식별 및 본인 확인</li>
                <li>행사 참가자 매칭 및 관리</li>
                <li>서비스 개선 및 신규 서비스 개발</li>
              </ul>
              
              <p><strong>3. 개인정보의 보유 및 이용 기간</strong></p>
              <p className="ml-4">회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 삭제합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.</p>
              
              <p><strong>4. 개인정보의 제3자 제공</strong></p>
              <p className="ml-4">회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 행사 참가를 위해 동일 행사 참가자에게는 프로필 정보가 공개될 수 있습니다.</p>
              
              <p><strong>5. 개인정보의 파기</strong></p>
              <p className="ml-4">회원 탈퇴 시 수집된 개인정보는 즉시 파기되며, 파기 절차 및 방법은 회사 내부 방침에 따릅니다.</p>
            </div>
          </section>

          {/* 기타 */}
          <section>
            <h3 className="text-lg md:text-xl font-bold text-primary mb-3">제3조 (기타)</h3>
            <div className="space-y-2 leading-relaxed">
              <p><strong>1. 약관의 변경</strong></p>
              <p className="ml-4">본 약관은 관련 법령의 변경 또는 서비스 정책 변경에 따라 수정될 수 있으며, 변경 시 사전 공지합니다.</p>
              
              <p><strong>2. 분쟁 해결</strong></p>
              <p className="ml-4">서비스 이용과 관련하여 발생한 분쟁은 대한민국 법률에 따라 해결합니다.</p>
              
              <p><strong>3. 연락처</strong></p>
              <p className="ml-4">서비스 이용과 관련한 문의사항은 서비스 내 고객센터를 통해 문의해주세요.</p>
            </div>
          </section>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-[#0d4a1a] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}







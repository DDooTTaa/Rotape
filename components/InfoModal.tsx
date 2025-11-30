"use client";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InfoModal({ isOpen, onClose }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4 py-4">
      <div className="bg-white border-2 border-primary/20 rounded-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg md:text-2xl font-bold title-glow">
            안녕하세요. Rotape입니다.
          </h2>
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

        <div className="space-y-6 text-gray-700">
          {/* Rotape 소개 */}
          <section className="mb-6">
            <div className="bg-gradient-to-r from-primary/10 to-[#0d4a1a]/10 rounded-xl p-5 border border-primary/20 mb-4">
              <h3 className="text-xl md:text-2xl font-bold mb-3 flex items-center gap-2">
                <span className="text-2xl">🎞️</span>
                Rotape
              </h3>
              <p className="text-base md:text-lg leading-relaxed text-gray-700">
                <span className="font-semibold text-primary">Rotape</span>는 &quot;수많은 순간 속 한 컷의 인연을 테이프처럼&quot; 이라는 컨셉으로 만들어진 <span className="font-semibold text-primary">로테이션 소개팅 서비스</span>입니다.
              </p>
              <p className="text-sm md:text-base mt-3 text-gray-600 leading-relaxed">
                여러 순간을 담아낼 수 있는 영화 테이프처럼, 여러 사람과의 만남을 통해 진정한 인연을 찾을 수 있도록 도와드립니다.
              </p>
            </div>
          </section>

          {/* 로테이션 소개팅 설명 */}
          <section>
            <h3 className="text-xl md:text-2xl font-bold mb-3 flex items-center gap-2">
              <span className="text-2xl">💫</span>
              <span className="bg-gradient-to-r from-primary to-[#0d4a1a] bg-clip-text text-transparent">로테이션 소개팅이란?</span>
            </h3>
            <div className="space-y-3 text-sm md:text-base">
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="font-semibold text-primary mb-2">🔄 로테이션 소개팅</p>
                <p className="leading-relaxed">
                  여러 명의 참가자가 일정 시간마다 자리를 바꿔가며 대화를 나누는 방식입니다. 짧은 시간 동안 여러 사람과 만나볼 수 있어요!
                </p>
              </div>
              <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                <p className="font-semibold text-primary mb-2">✨ 이런 점이 좋아요</p>
                <ul className="space-y-2 list-disc list-inside leading-relaxed">
                  <li>한 번에 여러 분과 만나볼 수 있어 시간을 효율적으로 활용할 수 있어요</li>
                  <li>다양한 매력을 가진 분들을 한 자리에서 만날 수 있는 기회예요</li>
                  <li>부담스럽지 않은 분위기에서 자연스럽게 대화를 나눌 수 있어요</li>
                  <li>서로의 중요한 가치를 통해 인연을 찾을 수 있어요</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 이용 방법 */}
          <section>
            <h3 className="text-xl md:text-2xl font-bold text-primary mb-3 flex items-center gap-2">
              <span className="text-2xl">📝</span>
              이용 방법
            </h3>
            <div className="space-y-3 text-sm md:text-base">
              {[
                { step: 1, title: "행사 신청", desc: "참여하고 싶은 행사를 선택하고 지원서를 작성하세요." },
                { step: 2, title: "승인 대기", desc: "운영자가 지원서를 검토하고 승인합니다." },
                { step: 3, title: "로테이션 참여", desc: "행사 당일 로테이션에 참여하여 여러 사람과 만나보세요." },
                { step: 4, title: "이후에는?", desc: "서로 관심을 보인 상대와 인연을 이어 가세요. 저희가 도와드릴게요!" },
              ].map((item) => (
                <div className="flex gap-3" key={item.step}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                    {item.step}
                  </span>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
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


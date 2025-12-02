import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center px-4">
        <div className="text-center max-w-2xl w-full">
          <div className="mb-8 px-4">
            <Image
              src="/logo.png"
              alt="Rotape"
              width={200}
              height={80}
              priority
              className="h-auto mx-auto mb-6 w-[150px] md:w-[200px] max-w-full"
            />
          </div>
          
          <h1 className="text-6xl md:text-9xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800 mb-4 px-4">
            페이지를 찾을 수 없습니다
          </h2>
          <p className="text-base md:text-lg text-gray-600 mb-8 px-4">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              홈으로 가기
            </Link>
          </div>
        </div>
      </div>
  );
}


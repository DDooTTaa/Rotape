import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-deep-green text-foreground">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Rotape</h1>
        <div className="text-center space-y-4">
          <Link
            href="/participant"
            className="block bg-primary text-deep-green px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            참가자로 시작하기
          </Link>
          <Link
            href="/admin"
            className="block bg-primary text-deep-green px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            운영자로 시작하기
          </Link>
        </div>
      </div>
    </main>
  );
}


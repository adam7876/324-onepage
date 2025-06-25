import Link from "next/link";

export default function Page() {
  return (
    <main className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <Link href="/admin" className="bg-black text-white px-6 py-3 rounded font-bold text-lg hover:bg-gray-800 transition mb-8 shadow-lg">登入後台</Link>
      <div className="text-gray-400 text-sm">（前台功能請直接點選商品）</div>
    </main>
  );
}

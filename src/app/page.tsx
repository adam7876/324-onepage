import ProductList from "../modules/frontend/ProductList";
import Link from "next/link";

export default function Page() {
  return (
    <main className="p-8">
      <div className="mb-6 flex justify-end">
        <Link href="/admin/orders" className="bg-black text-white px-4 py-2 rounded font-bold hover:bg-gray-800 transition">後台訂單管理</Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">商品列表</h1>
      <ProductList />
    </main>
  );
}

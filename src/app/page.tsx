import ProductList from "../modules/frontend/ProductList";

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">商品列表</h1>
      <ProductList />
    </main>
  );
}

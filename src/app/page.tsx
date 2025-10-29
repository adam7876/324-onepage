"use client";
import { Suspense } from "react";
import ProductList from "../modules/frontend/ProductList";

function PageContent() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">商品列表</h1>
      <ProductList />
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>載入中...</p>
        </div>
      </div>
    }>
      <PageContent />
    </Suspense>
  );
}

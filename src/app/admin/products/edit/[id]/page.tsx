"use client";
import { useParams } from "next/navigation";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow">
        <h1 className="text-2xl font-bold mb-4">編輯商品</h1>
        <div>商品 ID：{id}</div>
        <div className="mt-4 text-gray-500">（編輯頁開發中...）</div>
      </div>
    </div>
  );
} 
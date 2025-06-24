"use client";
import { useState } from "react";
import Image from "next/image";

export interface ProductFormData {
  name: string;
  price: string;
  description?: string;
  sizes?: string;
  colors?: string;
  image?: File | null;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  loading?: boolean;
  error?: string;
  onSubmit: (data: ProductFormData) => void;
  submitText?: string;
}

export default function ProductForm({ initialData, loading, error, onSubmit, submitText = "送出" }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(initialData || {
    name: "",
    price: "",
    description: "",
    sizes: "",
    colors: "",
    image: null,
  });

  const [preview, setPreview] = useState<string | null>(initialData?.image ? URL.createObjectURL(initialData.image) : null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "image" && files) {
      setForm(f => ({ ...f, image: files[0] }));
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded p-6 mb-8 max-w-2xl mx-auto space-y-4 shadow">
      <h2 className="text-lg font-bold mb-2">{submitText === "送出" ? "新增商品" : "編輯商品"}</h2>
      <div>
        <label className="block mb-1">商品名稱</label>
        <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block mb-1">價格</label>
        <input type="number" name="price" value={form.price} onChange={handleChange} className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block mb-1">描述</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded px-3 py-2" />
      </div>
      <div>
        <label className="block mb-1">尺寸（逗號分隔）</label>
        <input type="text" name="sizes" value={form.sizes} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="如 S, M, L" />
      </div>
      <div>
        <label className="block mb-1">顏色（逗號分隔）</label>
        <input type="text" name="colors" value={form.colors} onChange={handleChange} className="w-full border rounded px-3 py-2" placeholder="如 白色, 黑色" />
      </div>
      <div>
        <label className="block mb-1">商品圖片</label>
        <div className="flex items-center gap-4">
          <button type="button" className="px-3 py-1 bg-gray-200 rounded font-bold" onClick={() => document.getElementById('product-image-input')?.click()}>
            選擇圖片
          </button>
          <input
            id="product-image-input"
            type="file"
            name="image"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          {preview && (
            <Image src={preview} alt="預覽" width={80} height={80} className="w-20 h-20 object-cover rounded border" />
          )}
        </div>
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button type="submit" className="w-full py-2 bg-black text-white rounded font-bold" disabled={loading}>
        {loading ? "處理中..." : submitText}
      </button>
    </form>
  );
} 
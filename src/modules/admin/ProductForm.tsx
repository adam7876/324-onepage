"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export interface ProductFormData {
  name: string;
  price: string;
  description?: string;
  sizes?: string;
  colors?: string;
  images?: File[];
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
    images: [],
  });
  const [previews, setPreviews] = useState<string[]>([]);

  // 預覽初始化（編輯時）
  useEffect(() => {
    if (initialData && Array.isArray(initialData.images)) {
      setPreviews(initialData.images.map(f => URL.createObjectURL(f)));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "images" && files) {
      let newFiles = Array.from(files);
      if ((form.images?.length || 0) + newFiles.length > 20) {
        alert("最多只能上傳20張圖片");
        newFiles = newFiles.slice(0, 20 - (form.images?.length || 0));
      }
      setForm(f => ({ ...f, images: [...(f.images || []), ...newFiles] }));
      setPreviews(p => [...p, ...newFiles.map(f => URL.createObjectURL(f))]);
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // 刪除單張圖片
  const handleRemoveImage = (idx: number) => {
    setForm(f => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }));
    setPreviews(p => p.filter((_, i) => i !== idx));
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
        <div>
          <button type="button" className="px-3 py-1 bg-gray-200 rounded font-bold" onClick={() => document.getElementById('product-images-input')?.click()}>
            選擇圖片（可多選，最多20張）
          </button>
          <input
            id="product-images-input"
            type="file"
            name="images"
            accept="image/*"
            multiple
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {previews.map((src, idx) => (
              <div key={idx} className="relative group">
                <Image src={src} alt={`預覽${idx+1}`} width={80} height={80} className="w-20 h-20 object-cover rounded border" />
                <button type="button" className="absolute top-0 right-0 bg-black bg-opacity-60 text-white text-xs rounded px-1 py-0.5 opacity-80 group-hover:opacity-100" onClick={() => handleRemoveImage(idx)}>✕</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <button type="submit" className="w-full py-2 bg-black text-white rounded font-bold" disabled={loading}>
        {loading ? "處理中..." : submitText}
      </button>
    </form>
  );
} 
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import { db } from "../../../firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    sizes: "",
    colors: "",
    image: null as File | null,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // 權限驗證
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("admin_login") !== "1") {
      router.replace("/admin/login");
    }
  }, [router]);

  // 取得商品列表
  useEffect(() => {
    async function fetchProducts() {
      const querySnapshot = await getDocs(collection(db, "products"));
      const items: Product[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(items);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("確定要刪除這個商品嗎？")) return;
    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target;
    const name = target.name;
    if (name === "image" && target instanceof HTMLInputElement && target.files) {
      setForm(f => ({ ...f, image: target.files![0] }));
    } else {
      setForm(f => ({ ...f, [name]: target.value }));
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.name || !form.price) {
      setFormError("請填寫商品名稱與價格");
      return;
    }
    setFormLoading(true);
    let imageUrl = "";
    if (form.image) {
      try {
        const storage = getStorage();
        const imgRef = ref(storage, `products/${Date.now()}_${form.image.name}`);
        await uploadBytes(imgRef, form.image);
        imageUrl = await getDownloadURL(imgRef);
      } catch {
        setFormError("圖片上傳失敗");
        setFormLoading(false);
        return;
      }
    }
    const sizes = form.sizes.split(",").map(s => s.trim()).filter(Boolean);
    const colors = form.colors.split(",").map(c => c.trim()).filter(Boolean);
    const newProduct = {
      name: form.name,
      price: Number(form.price),
      description: form.description,
      images: imageUrl ? [imageUrl] : [],
      sizes,
      colors,
    };
    const docRef = await addDoc(collection(db, "products"), newProduct);
    setProducts(prev => [
      { id: docRef.id, ...newProduct },
      ...prev,
    ]);
    setShowForm(false);
    setForm({ name: "", price: "", description: "", sizes: "", colors: "", image: null });
    setFormLoading(false);
  };

  if (loading) return <div className="text-center py-12 text-lg">載入中...</div>;

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8 tracking-widest">商品管理</h1>
      <div className="mb-6 flex justify-end">
        <button className="bg-black text-white px-4 py-2 rounded font-bold" onClick={() => setShowForm(f => !f)}>
          {showForm ? "取消新增" : "＋新增商品"}
        </button>
      </div>
      {showForm && (
        <form onSubmit={handleAddProduct} className="bg-white border rounded p-6 mb-8 max-w-2xl mx-auto space-y-4 shadow">
          <h2 className="text-lg font-bold mb-2">新增商品</h2>
          <div>
            <label className="block mb-1">商品名稱</label>
            <input type="text" name="name" value={form.name} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block mb-1">價格</label>
            <input type="number" name="price" value={form.price} onChange={handleFormChange} className="w-full border rounded px-3 py-2" required />
          </div>
          <div>
            <label className="block mb-1">描述</label>
            <textarea name="description" value={form.description} onChange={handleFormChange} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block mb-1">尺寸（逗號分隔）</label>
            <input type="text" name="sizes" value={form.sizes} onChange={handleFormChange} className="w-full border rounded px-3 py-2" placeholder="如 S, M, L" />
          </div>
          <div>
            <label className="block mb-1">顏色（逗號分隔）</label>
            <input type="text" name="colors" value={form.colors} onChange={handleFormChange} className="w-full border rounded px-3 py-2" placeholder="如 白色, 黑色" />
          </div>
          <div>
            <label className="block mb-1">商品圖片</label>
            <input type="file" name="image" accept="image/*" onChange={handleFormChange} className="w-full" />
          </div>
          {formError && <div className="text-red-500 text-sm mb-2">{formError}</div>}
          <button type="submit" className="w-full py-2 bg-black text-white rounded font-bold" disabled={formLoading}>
            {formLoading ? "上傳中..." : "送出"}
          </button>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">名稱</th>
              <th className="border px-4 py-2">價格</th>
              <th className="border px-4 py-2">描述</th>
              <th className="border px-4 py-2">圖片數</th>
              <th className="border px-4 py-2">尺寸</th>
              <th className="border px-4 py-2">顏色</th>
              <th className="border px-4 py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="border px-2 py-1 font-mono text-xs">{p.id}</td>
                <td className="border px-2 py-1">{p.name}</td>
                <td className="border px-2 py-1">NT$ {p.price.toLocaleString()}</td>
                <td className="border px-2 py-1 max-w-xs truncate">{p.description}</td>
                <td className="border px-2 py-1 text-center">{p.images?.length ?? 0}</td>
                <td className="border px-2 py-1">{(p.sizes ?? []).join(", ")}</td>
                <td className="border px-2 py-1">{(p.colors ?? []).join(", ")}</td>
                <td className="border px-2 py-1">
                  <button className="text-blue-600 mr-2" onClick={() => router.push(`/admin/products/edit/${p.id}`)}>編輯</button>
                  <button className="text-red-600" onClick={() => handleDelete(p.id)}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
} 
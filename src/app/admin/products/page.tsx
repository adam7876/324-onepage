"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import { db } from "../../../firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ProductForm, { ProductFormData } from "@/modules/admin/ProductForm";
import Link from "next/link";
import Image from "next/image";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/firebase/firebaseConfig";

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
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // 權限驗證
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/admin/login");
      }
    });
    return () => unsubscribe();
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

  if (loading) return <div className="text-center py-12 text-lg">載入中...</div>;

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8 tracking-widest">商品管理</h1>
      <div className="flex gap-2 mb-4">
        <Link href="/admin" className="px-4 py-2 rounded bg-gray-100 text-black font-bold hover:bg-gray-200">回主控台</Link>
        <Link href="/" className="px-4 py-2 rounded bg-gray-100 text-black font-bold hover:bg-gray-200">回首頁</Link>
      </div>
      <div className="mb-6 flex justify-between items-center">
        <button className="bg-black text-white px-4 py-2 rounded font-bold" onClick={() => setShowForm(f => !f)}>
          {showForm ? "取消新增" : "＋新增商品"}
        </button>
      </div>
      {showForm && (
        <ProductForm
          initialData={{ name: "", price: "", description: "", sizes: "", colors: "", images: [], externalOrderUrl: "" }}
          loading={formLoading}
          error={formError}
          submitText="送出"
          onSubmit={async (form: ProductFormData) => {
            setFormError("");
            if (!form.name || !form.price) {
              setFormError("請填寫商品名稱與價格");
              return;
            }
            setFormLoading(true);
            const imageUrls: string[] = [];
            if (form.images && form.images.length > 0) {
              try {
                const storage = getStorage();
                for (const file of form.images) {
                  const imgRef = ref(storage, `products/${Date.now()}_${file.name}`);
                  await uploadBytes(imgRef, file);
                  const url = await getDownloadURL(imgRef);
                  imageUrls.push(url);
                }
              } catch {
                setFormError("圖片上傳失敗");
                setFormLoading(false);
                return;
              }
            }
            const sizes = (form.sizes || "").split(",").map(s => s.trim()).filter(Boolean);
            const colors = (form.colors || "").split(",").map(c => c.trim()).filter(Boolean);
            const newProduct = {
              name: form.name,
              price: Number(form.price),
              description: form.description,
              images: imageUrls,
              sizes,
              colors,
              externalOrderUrl: form.externalOrderUrl || "",
            };
            const docRef = await addDoc(collection(db, "products"), newProduct);
            setProducts(prev => [
              { id: docRef.id, ...newProduct },
              ...prev,
            ]);
            setShowForm(false);
            setFormLoading(false);
          }}
        />
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">名稱</th>
              <th className="border px-4 py-2">價格</th>
              <th className="border px-4 py-2">描述</th>
              <th className="border px-4 py-2">主圖</th>
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
                <td className="border px-2 py-1 text-center">
                  {p.images && p.images[0] ? (
                    <Image src={p.images[0]} alt={p.name} width={64} height={64} className="w-16 h-16 object-cover rounded mx-auto" />
                  ) : (
                    <span className="text-gray-400">無圖片</span>
                  )}
                </td>
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
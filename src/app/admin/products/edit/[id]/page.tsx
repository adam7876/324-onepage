"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ProductForm, { ProductFormData } from "@/modules/admin/ProductForm";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [initialData, setInitialData] = useState<ProductFormData | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInitialData({
          name: data.name || "",
          price: String(data.price ?? ""),
          description: data.description || "",
          sizes: (data.sizes || []).join(", "),
          colors: (data.colors || []).join(", "),
          images: Array.isArray(data.images) ? data.images : [],
        });
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-lg">載入中...</div>;
  if (!initialData) return <div className="text-center py-12 text-gray-400">找不到商品</div>;

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">編輯商品</h1>
        <ProductForm
          initialData={initialData}
          loading={formLoading}
          error={formError}
          submitText="更新"
          onSubmit={async (form: ProductFormData) => {
            setFormError("");
            setFormLoading(true);
            const imageUrls: string[] = Array.isArray(form.images) ? form.images.filter(i => typeof i === 'string') : [];
            if (form.images && form.images.length > 0) {
              try {
                const storage = getStorage();
                for (const file of form.images) {
                  if (typeof file === 'string') continue; // 已有網址
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
            const updateData = {
              name: form.name,
              price: Number(form.price),
              description: form.description,
              sizes,
              colors,
              images: imageUrls,
            };
            await updateDoc(doc(db, "products", id), updateData);
            setFormLoading(false);
            alert("商品已更新！");
            router.push("/admin/products");
          }}
        />
      </div>
    </div>
  );
} 
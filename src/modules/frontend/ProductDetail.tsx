"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/firestore";
import { Button } from "../../components/ui/button";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  // 結帳表單欄位
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !name || !email || !phone || !address) return;
    setSubmitting(true);
    const orderRef = await addDoc(collection(db, "orders"), {
      name,
      email,
      phone,
      address,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
      },
      total: product.price,
      status: "待匯款",
      createdAt: Timestamp.now(),
    });
    setOrderId(orderRef.id);
    setSubmitting(false);
    setShowModal(true);
  };

  if (loading) return <div className="text-center py-12 text-lg">載入中...</div>;
  if (!product) return <div className="text-center py-12 text-gray-400">找不到商品</div>;

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full max-w-xs h-96 object-cover rounded bg-gray-100"
            />
          ) : (
            <div className="w-full max-w-xs h-96 flex items-center justify-center bg-gray-100 rounded text-gray-400">
              無圖片
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <div className="text-xl font-bold text-gray-900 mb-4">NT$ {product.price.toLocaleString()}</div>
          <div className="text-gray-700 mb-6 min-h-[3em]">{product.description || "—"}</div>
        </div>
      </div>
      {/* 結帳表單 */}
      <form onSubmit={handleSubmit} className="mt-12 max-w-lg mx-auto bg-gray-50 p-6 rounded border space-y-4">
        <h2 className="text-lg font-bold mb-2">直接結帳</h2>
        <div>
          <label className="block mb-1">收件人姓名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">電話</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block mb-1">收件地址</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <Button type="submit" className="w-full py-4 text-lg font-bold" disabled={submitting}>
          {submitting ? "送出中..." : `購買 NT$ ${product.price.toLocaleString()}`}
        </Button>
      </form>
      {/* 匯款資訊 Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg text-center relative">
            <div className="text-green-600 text-4xl mb-2">✓</div>
            <div className="text-xl font-bold mb-2">已經收到您的訂單</div>
            <div className="mb-4">訂單編號：<span className="font-mono text-pink-600">{orderId}</span></div>
            <div className="bg-gray-50 p-4 rounded border mb-4 text-left">
              <div className="font-bold mb-2">匯款資訊（範例）</div>
              <div>銀行名稱：台灣銀行</div>
              <div>分行：台北分行</div>
              <div>戶名：王小明</div>
              <div>帳號：123-456-789012</div>
              <div className="text-red-500 mt-2">請於 3 日內完成匯款，並保留收據以利對帳。</div>
            </div>
            <Button className="w-full mt-2" onClick={() => setShowModal(false)}>
              關閉
            </Button>
          </div>
        </div>
      )}
    </section>
  );
} 
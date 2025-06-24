"use client";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { db, firebaseReady } from "../../firebase/firestore";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export default function Checkout() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
    
    // 等待 Firebase 初始化完成
    firebaseReady.then(() => {
      setFirebaseInitialized(true);
      console.log("Firebase 初始化完成，可以送出訂單");
    }).catch((error) => {
      console.error("Firebase 初始化失敗:", error);
      setError("系統初始化失敗，請重新整理頁面");
    });
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !address || cart.length === 0) return;
    
    if (!firebaseInitialized) {
      setError("系統正在初始化，請稍後再試");
      return;
    }
    
    setSubmitting(true);
    setError("");
    
    try {
      // 確保 Firebase 連接正常
      await firebaseReady;
      
      if (!db) {
        throw new Error("Firebase 連接失敗");
      }

      const orderData = {
        name,
        phone,
        address,
        cart,
        total,
        status: "待匯款",
        createdAt: Timestamp.now(),
      };

      console.log("正在送出訂單:", orderData);
      
      const docRef = await addDoc(collection(db, "orders"), orderData);
      console.log("訂單已建立，ID:", docRef.id);
      
      setSuccess(true);
      localStorage.removeItem("cart");
      setTimeout(() => router.push("/"), 3000);
      
    } catch (err) {
      console.error("訂單送出失敗:", err);
      setError(err instanceof Error ? err.message : "訂單送出失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  if (success)
    return (
      <div className="text-center py-16 text-xl text-green-600">
        訂單已送出，請依下方匯款資訊完成付款！<br />3 秒後自動返回首頁。
      </div>
    );

  if (cart.length === 0)
    return <div className="text-center py-12 text-gray-400">購物車目前沒有商品</div>;

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8 tracking-widest">結帳</h2>
      <div className="mb-8">
        <div className="font-bold mb-2">購物清單</div>
        <ul className="mb-2">
          {cart.map((item) => (
            <li key={item.id} className="flex justify-between items-center py-1">
              <span>{item.name} x {item.quantity}</span>
              <span>NT$ {item.price.toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <div className="text-right font-bold">總金額：NT$ {total.toLocaleString()}</div>
      </div>
      
      {!firebaseInitialized && (
        <div className="mb-4 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          系統初始化中，請稍候...
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
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
        <Button 
          type="submit" 
          className="w-full py-4 text-lg font-bold" 
          disabled={submitting || !firebaseInitialized}
        >
          {submitting ? "送出中..." : !firebaseInitialized ? "系統初始化中..." : "送出訂單"}
        </Button>
      </form>
      <div className="bg-gray-50 p-4 rounded border">
        <div className="font-bold mb-2">匯款資訊（範例）</div>
        <div>銀行名稱：台灣銀行</div>
        <div>分行：台北分行</div>
        <div>戶名：王小明</div>
        <div>帳號：123-456-789012</div>
        <div className="text-red-500 mt-2">請於 3 日內完成匯款，並保留收據以利對帳。</div>
      </div>
    </section>
  );
} 
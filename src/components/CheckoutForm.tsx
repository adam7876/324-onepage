import { useState } from "react";
import { Button } from "./ui/button";
import { db } from "../firebase/firestore";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import type { CartItem } from "./CartInline";

interface CheckoutFormProps {
  cart: CartItem[];
  onSuccess?: () => void;
}

export default function CheckoutForm({ cart, onSuccess }: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [shipping, setShipping] = useState("7-11 超商取貨");
  const [payment, setPayment] = useState("銀行匯款");
  const [orderId, setOrderId] = useState("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || cart.length === 0) {
      setError("請填寫完整資訊並確認購物車有商品");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const orderRef = await addDoc(collection(db, "orders"), {
        name,
        email,
        phone,
        address,
        shipping,
        payment,
        items: cart,
        total,
        status: payment === "銀行匯款" ? "待匯款" : "待付款",
        createdAt: Timestamp.now(),
      });
      setOrderId(orderRef.id);
      setSuccess(true);
      localStorage.removeItem("cart");
      if (onSuccess) onSuccess();
    } catch {
      setError("訂單送出失敗，請稍後再試");
    }
    setSubmitting(false);
  };

  if (success)
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg text-center relative border-2 border-green-400">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <div className="text-2xl font-bold mb-4 text-green-700">訂單成立</div>
          <div className="mb-2 text-lg">感謝您的訂購！</div>
          <div className="mb-2">訂單編號：<span className="font-mono text-pink-600">{orderId}</span></div>
          <div className="mb-2">物流方式：<span className="font-bold">{shipping}</span></div>
          <div className="mb-2">付款方式：<span className="font-bold">{payment}</span></div>
          {payment === "銀行匯款" && (
            <div className="bg-gray-50 p-4 rounded border mb-4 text-left inline-block mt-4">
              <div className="font-bold mb-2">匯款資訊</div>
              <div>銀行名稱：台灣銀行</div>
              <div>分行：台北分行</div>
              <div>戶名：王小明</div>
              <div>帳號：123-456-789012</div>
              <div className="text-red-500 mt-2">請於 3 日內完成匯款，並保留收據以利對帳。</div>
            </div>
          )}
          {payment !== "銀行匯款" && (
            <div className="bg-gray-50 p-4 rounded border mb-4 text-left inline-block mt-4">
              <div className="font-bold mb-2">付款說明</div>
              <div>此為模擬付款，請等待後台通知。</div>
            </div>
          )}
          <Button className="w-full mt-4" onClick={() => { setSuccess(false); if (onSuccess) onSuccess(); }}>
            關閉
          </Button>
        </div>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded p-6 mt-6 max-w-lg mx-auto space-y-4 shadow">
      <h2 className="text-lg font-bold mb-2">結帳資訊</h2>
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
      <div>
        <label className="block mb-1">物流方式</label>
        <select
          value={shipping}
          onChange={e => setShipping(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="7-11 超商取貨">7-11 超商取貨</option>
          <option value="全家超商取貨">全家超商取貨</option>
          <option value="宅配到府">宅配到府</option>
          <option value="店到店">店到店</option>
        </select>
      </div>
      <div>
        <label className="block mb-1">付款方式</label>
        <select
          value={payment}
          onChange={e => setPayment(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          <option value="銀行匯款">銀行匯款</option>
          <option value="模擬付款">模擬付款</option>
        </select>
      </div>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <Button type="submit" className="w-full py-3 text-lg font-bold" disabled={submitting}>
        {submitting ? "送出中..." : `送出訂單（NT$ ${total.toLocaleString()}）`}
      </Button>
    </form>
  );
} 
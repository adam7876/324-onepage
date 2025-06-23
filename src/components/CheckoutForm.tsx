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
      await addDoc(collection(db, "orders"), {
        name,
        email,
        phone,
        address,
        items: cart,
        total,
        status: "待匯款",
        createdAt: Timestamp.now(),
      });
      setSuccess(true);
      localStorage.removeItem("cart");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("訂單送出失敗，請稍後再試");
    }
    setSubmitting(false);
  };

  if (success)
    return (
      <div className="bg-green-50 border border-green-300 rounded p-6 text-center my-6">
        <div className="text-2xl text-green-700 mb-2">✓ 訂單已送出！</div>
        <div className="mb-2">請於 3 日內完成匯款，並保留收據以利對帳。</div>
        <div className="text-sm text-gray-500">（如需匯款資訊請聯絡客服）</div>
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
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <Button type="submit" className="w-full py-3 text-lg font-bold" disabled={submitting}>
        {submitting ? "送出中..." : `送出訂單（NT$ ${total.toLocaleString()}）`}
      </Button>
    </form>
  );
} 
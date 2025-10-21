"use client";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { db } from "../firebase/firestore";
import { collection, addDoc, Timestamp, getDocs, limit, query, runTransaction, doc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebase/firebaseConfig";
import type { CartItem } from "./CartInline";

interface CheckoutFormProps {
  cart: CartItem[];
  onSuccess?: (info: { orderId: string; shipping: string; payment: string }) => void;
}

export default function CheckoutForm({ cart, onSuccess }: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [shipping, setShipping] = useState("7-11 超商取貨");
  const [payment, setPayment] = useState("銀行匯款");
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [firebaseReady, setFirebaseReady] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // 產生數字訂單編號：YYYYMMDD + 三位數遞增序號
  const generateOrderNumber = async (): Promise<string> => {
    const now = new Date();
    const yyyy = String(now.getFullYear());
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateKey = `${yyyy}${mm}${dd}`;

    const seqRef = doc(db, 'counters', `order-${dateKey}`);
    const seq = await runTransaction(db, async (tx) => {
      const snap = await tx.get(seqRef);
      const current = snap.exists() ? (snap.data().seq as number) : 0;
      const next = current + 1;
      if (snap.exists()) {
        tx.update(seqRef, { seq: next });
      } else {
        tx.set(seqRef, { seq: next, date: dateKey });
      }
      return next;
    });

    return `${dateKey}${String(seq).padStart(3, '0')}`;
  };

  useEffect(() => {
    console.log("CheckoutForm 已載入，檢查 Firebase 狀態...");
    
    // 監聽 Auth 狀態變化，這表示 Firebase 已初始化
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, () => {
      console.log("Firebase Auth 狀態已確認，Firebase 已初始化");
      // 無論是否登入，Auth 狀態的觸發都表示 Firebase 已準備好
      setFirebaseReady(true);
    });

    // 備用檢查：如果 Auth 狀態沒有觸發，用測試查詢來確認
    const fallbackCheck = setTimeout(async () => {
      if (!firebaseReady) {
        try {
          console.log("執行備用檢查，測試 Firestore 連接...");
          const testQuery = query(collection(db, "products"), limit(1));
          await getDocs(testQuery);
          console.log("Firestore 連接測試成功");
          setFirebaseReady(true);
        } catch (error) {
          console.error("Firestore 連接測試失敗:", error);
          // 如果還是失敗，3秒後再試一次
          setTimeout(() => setFirebaseReady(true), 3000);
        }
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearTimeout(fallbackCheck);
    };
  }, [firebaseReady]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("表單送出開始...");
    
    if (!name || !email || !phone || !address || cart.length === 0) {
      setError("請填寫完整資訊並確認購物車有商品");
      return;
    }
    
    if (!firebaseReady) {
      setError("系統正在初始化，請稍後再試");
      return;
    }
    
    setSubmitting(true);
    setError("");
    
    try {
      console.log("準備建立訂單...");
      const newOrderNumber = await generateOrderNumber();
      // 將 cart 內每個商品的 undefined 欄位補成空字串或預設值
      const cleanCart = cart.map(item => ({
        ...item,
        name: item.name ?? "",
        price: item.price ?? 0,
        quantity: item.quantity ?? 1,
        imageUrl: item.imageUrl ?? "",
      }));
      const orderData = {
        orderNumber: newOrderNumber,
        name: name ?? "",
        email: email ?? "",
        phone: phone ?? "",
        address: address ?? "",
        shipping: shipping ?? "",
        payment: payment ?? "",
        customerNotes: customerNotes ?? "",
        items: cleanCart,
        total: total ?? 0,
        amountExpected: total ?? 0,
        paymentStatus: "未請款", // 未請款 | 已請款 | 已付款 | 付款失敗 | 已退款
        paymentRequestedAt: null as unknown as Timestamp | null,
        paidAt: null as unknown as Timestamp | null,
        tradeNo: "",
        status: payment === "銀行匯款" ? "待匯款" : payment === "LINE Pay" ? "待付款" : "待付款",
        createdAt: Timestamp.now(),
      };
      
      console.log("正在送出訂單到 Firebase:", orderData);
      
      const orderRef = await addDoc(collection(db, "orders"), orderData);
      console.log("訂單建立成功！ID:", orderRef.id);
      
      // 如果是 LINE Pay，重導向到付款頁面
      if (payment === "LINE Pay") {
        try {
          const response = await fetch('/api/payment/linepay/request', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ orderNumber: newOrderNumber }),
          });
          
          const result = await response.json();
          
          if (result.success && result.paymentUrl) {
            // 重導向到 LINE Pay 付款頁面
            window.location.href = result.paymentUrl;
            return;
          } else {
            setError(`LINE Pay 付款請求失敗：${result.error || '未知錯誤'}`);
            return;
          }
        } catch (linePayError) {
          console.error("LINE Pay 請求失敗:", linePayError);
          setError("LINE Pay 付款請求失敗，請稍後再試");
          return;
        }
      }
      
      setOrderId(newOrderNumber);
      setOrderNumber(newOrderNumber);
      setSuccess(true);
      localStorage.removeItem("cart");
      if (onSuccess) onSuccess({ orderId: newOrderNumber, shipping, payment });
      
    } catch (err) {
      console.error("訂單送出失敗，詳細錯誤:", err);
      setError(`訂單送出失敗：${err instanceof Error ? err.message : "未知錯誤"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (success)
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg text-center relative border-2 border-green-400">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <div className="text-2xl font-bold mb-4 text-green-700">訂單成立</div>
          <div className="mb-2 text-lg">感謝您的訂購！</div>
          <div className="mb-2">訂單編號：<span className="font-mono text-pink-600">{orderNumber}</span></div>
          <div className="mb-2">物流方式：<span className="font-bold">{shipping}</span></div>
          <div className="mb-2">付款方式：<span className="font-bold">{payment}</span></div>
          {payment === "銀行匯款" && (
            <div className="bg-gray-50 p-4 rounded border mb-4 text-left inline-block mt-4">
              <div className="font-bold mb-2">匯款資訊</div>
              <div>銀行名稱：🔥 測試銀行</div>
              <div>分行：🔥 測試分行</div>
              <div>戶名：🔥 測試用戶</div>
              <div>帳號：🔥 測試帳號</div>
              <div className="text-red-500 mt-2">請於 3 日內完成匯款，並保留收據以利對帳。</div>
              <div className="text-blue-600 mt-2 font-bold">🔥 修改測試：匯款後請回傳匯款帳號後五碼至 axikorea@gmail.com</div>
              {/* 調試資訊 */}
              <div className="text-xs text-gray-500 mt-2">DEBUG: payment = {payment}</div>
              <div className="text-red-600 mt-2 font-bold text-lg">🔥 這是測試訊息 - 如果你看到這行，表示快取已清除！</div>
            </div>
          )}
          {payment === "LINE Pay" && (
            <div className="bg-gray-50 p-4 rounded border mb-4 text-left inline-block mt-4">
              <div className="font-bold mb-2">付款說明</div>
              <div>LINE Pay 付款已完成，商品將於 1-3 個工作天內出貨。</div>
            </div>
          )}
          <Button className="w-full mt-4" onClick={() => { setSuccess(false); if (onSuccess) onSuccess({ orderId, shipping, payment }); }}>
            關閉
          </Button>
        </div>
      </div>
    );

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded p-6 mt-6 max-w-lg mx-auto space-y-4 shadow">
      <h2 className="text-lg font-bold mb-2">結帳資訊</h2>
      
      {!firebaseReady && (
        <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          🔄 系統初始化中，請稍候...
        </div>
      )}
      
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
          <option value="324 店取">324 店取</option>
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
          <option value="LINE Pay">LINE Pay</option>
        </select>
      </div>
      <div>
        <label className="block mb-1">其他備註（選填）</label>
        <textarea
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
          placeholder="如有尺寸備註、送禮需求、收件時段等可填寫"
        />
      </div>
      {error && (
        <div className="text-red-500 text-sm mb-2 p-2 bg-red-50 border border-red-200 rounded">
          ❌ {error}
        </div>
      )}
      <Button 
        type="submit" 
        className="w-full py-3 text-lg font-bold" 
        disabled={submitting || !firebaseReady}
      >
        {submitting ? "🔄 送出中..." : !firebaseReady ? "⏳ 系統初始化中..." : `送出訂單（NT$ ${total.toLocaleString()}）`}
      </Button>
    </form>
  );
}
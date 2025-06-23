//
import { Button } from "./ui/button";
import Image from "next/image";
import CheckoutForm from "./CheckoutForm";
import { useCart } from "./CartContext";
import { useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  size?: string;
  color?: string;
  quantity: number;
}

export default function CartInline() {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [orderInfo, setOrderInfo] = useState<null | {
    orderId: string;
    shipping: string;
    payment: string;
  }>(null);

  if (orderInfo) {
    // 訂單完成視窗
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg text-center relative border-2 border-green-400">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <div className="text-2xl font-bold mb-4 text-green-700">訂單成立</div>
          <div className="mb-2 text-lg">感謝您的訂購！</div>
          <div className="mb-2">訂單編號：<span className="font-mono text-pink-600">{orderInfo.orderId}</span></div>
          <div className="mb-2">物流方式：<span className="font-bold">{orderInfo.shipping}</span></div>
          <div className="mb-2">付款方式：<span className="font-bold">{orderInfo.payment}</span></div>
          {orderInfo.payment === "銀行匯款" && (
            <div className="bg-gray-50 p-4 rounded border mb-4 text-left inline-block mt-4">
              <div className="font-bold mb-2">匯款資訊</div>
              <div>銀行名稱：台灣銀行</div>
              <div>分行：台北分行</div>
              <div>戶名：王小明</div>
              <div>帳號：123-456-789012</div>
              <div className="text-red-500 mt-2">請於 3 日內完成匯款，並保留收據以利對帳。</div>
            </div>
          )}
          {orderInfo.payment !== "銀行匯款" && (
            <div className="bg-gray-50 p-4 rounded border mb-4 text-left inline-block mt-4">
              <div className="font-bold mb-2">付款說明</div>
              <div>此為模擬付款，請等待後台通知。</div>
            </div>
          )}
          <Button className="w-full mt-4" onClick={() => { setOrderInfo(null); clearCart(); }}>
            關閉
          </Button>
        </div>
      </div>
    );
  }

  if (cart.length === 0)
    return <div className="text-center py-6 text-gray-400">購物車目前沒有商品</div>;

  return (
    <div className="my-8 bg-gray-100 rounded p-4">
      <div className="font-bold mb-2">購物車內容</div>
      <div className="flex flex-col gap-4">
        {cart.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 border-b pb-2">
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={48}
                height={48}
                className="w-12 h-12 object-cover rounded bg-gray-200"
                style={{ objectFit: "cover" }}
              />
            )}
            <div className="flex-1">
              <div>{item.name}</div>
              <div className="text-sm text-gray-600">
                {item.size && <>尺寸：{item.size}　</>}
                {item.color && <>顏色：{item.color}</>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span>數量：</span>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1 text-center"
                />
              </div>
            </div>
            <div className="font-bold text-lg">NT$ {(item.price * item.quantity).toLocaleString()}</div>
            <Button variant="outline" onClick={() => removeItem(idx)}>
              移除
            </Button>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="text-xl font-bold">總金額：NT$ {total.toLocaleString()}</div>
      </div>
      <CheckoutForm cart={cart} onSuccess={(info) => setOrderInfo(info)} />
    </div>
  );
} 
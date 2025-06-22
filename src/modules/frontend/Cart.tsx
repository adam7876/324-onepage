"use client";
import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import Image from "next/image";

interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  size?: string;
  color?: string;
}

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // 載入 localStorage
  useEffect(() => {
    const stored = localStorage.getItem("cart");
    if (stored) setCart(JSON.parse(stored));
  }, []);

  // 同步 localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const updateQuantity = (id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0)
    return <div className="text-center py-12 text-gray-400">購物車目前沒有商品</div>;

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8 tracking-widest">購物車</h2>
      <div className="flex flex-col gap-6">
        {cart.map((item) => (
          <div key={item.id} className="flex gap-4 items-center border-b pb-4">
            {item.imageUrl && (
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={96}
                height={96}
                className="w-24 h-24 object-cover rounded bg-gray-100"
                style={{ objectFit: "cover" }}
              />
            )}
            <div className="flex-1">
              <div className="font-medium text-base mb-1">{item.name}</div>
              <div className="text-gray-700 mb-2">NT$ {item.price.toLocaleString()}</div>
              <div className="text-sm text-gray-600 mb-1">
                {item.size && <>尺寸：{item.size}　</>}
                {item.color && <>顏色：{item.color}</>}
              </div>
              <div className="flex items-center gap-2">
                <span>數量：</span>
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1 text-center"
                />
              </div>
            </div>
            <Button variant="outline" onClick={() => removeItem(item.id)}>
              移除
            </Button>
          </div>
        ))}
      </div>
      <div className="flex justify-between items-center mt-8">
        <div className="text-xl font-bold">總金額：NT$ {total.toLocaleString()}</div>
        <Button className="px-8 py-3 text-lg font-bold" asChild>
          <a href="/checkout">前往結帳</a>
        </Button>
      </div>
    </section>
  );
} 
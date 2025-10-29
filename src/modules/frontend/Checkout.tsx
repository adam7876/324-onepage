"use client";
import { Suspense } from "react";
import CheckoutForm from "../../components/CheckoutForm";
import { useCart } from "../../components/CartContext";

function CheckoutContent() {
  const { cart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        購物車目前沒有商品
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8 tracking-widest">結帳</h2>
      <CheckoutForm cart={cart} onSuccess={() => {}} />
    </section>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>載入中...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
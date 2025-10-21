"use client";
import CheckoutForm from "../../components/CheckoutForm";
import { useCart } from "../../components/CartContext";

export default function Checkout() {
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
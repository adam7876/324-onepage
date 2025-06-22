"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firestore";
import { Button } from "../../components/ui/button";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  quantity: number;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

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

  const addToCart = () => {
    if (!product) return;
    const stored = localStorage.getItem("cart");
    let cart = stored ? JSON.parse(stored) : [];
    const exist = cart.find((item: CartItem) => item.id === product.id);
    if (exist) {
      cart = cart.map((item: CartItem) =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: 1,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    router.push("/cart");
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
          <Button className="w-full py-6 text-lg font-bold" onClick={addToCart}>
            加入購物車
          </Button>
        </div>
      </div>
    </section>
  );
} 
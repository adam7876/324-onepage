"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firestore";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const querySnapshot = await getDocs(collection(db, "products"));
      const items: Product[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(items);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (loading) return <div>載入中...</div>;
  if (products.length === 0) return <div>目前沒有商品</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <div key={product.id} className="border rounded p-4 flex flex-col items-center">
          {product.imageUrl && (
            <img src={product.imageUrl} alt={product.name} className="w-32 h-32 object-cover mb-2" />
          )}
          <div className="font-bold text-lg mb-1">{product.name}</div>
          <div className="text-gray-600">${product.price}</div>
        </div>
      ))}
    </div>
  );
} 
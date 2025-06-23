"use client";
import { Card, CardContent } from "../../components/ui/card";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firestore";
import Link from "next/link";
import Image from "next/image";

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

  if (loading) return <div className="text-center py-12 text-lg">載入中...</div>;
  if (products.length === 0) return <div className="text-center py-12 text-gray-400">目前沒有商品</div>;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-bold mb-8 tracking-widest">IN STOCK</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <Link href={`/product/${product.id}`} className="block w-full h-full" key={product.id}>
            <Card className="shadow-none border hover:shadow-lg transition-shadow duration-200 bg-white cursor-pointer">
              <CardContent className="flex flex-col items-center p-4">
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={400}
                    height={288}
                    className="w-full h-72 object-cover rounded mb-4 bg-gray-100"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div className="w-full h-72 flex items-center justify-center bg-gray-100 rounded mb-4 text-gray-400">
                    無圖片
                  </div>
                )}
                <div className="font-medium text-base text-center mb-1 line-clamp-2 min-h-[2.5em]">{product.name}</div>
                <div className="text-lg font-bold text-gray-900">NT$ {product.price.toLocaleString()}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
} 
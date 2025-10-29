"use client";
import { Card, CardContent } from "../../components/ui/card";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import type { LogisticsInfo } from "../../types";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  images?: string[];
}

export default function ProductList() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<LogisticsInfo | null>(null);

  // 處理 PayNow 回調的門市資訊
  useEffect(() => {
    const storeId = searchParams.get('storeid');
    const storeName = searchParams.get('storename');
    const storeAddress = searchParams.get('storeaddress');

    if (storeId && storeName) {
      const storeInfo: LogisticsInfo = {
        storeId,
        storeName,
        storeAddress: storeAddress || '',
        logisticsStatus: 'pending'
      };
      
      setSelectedStore(storeInfo);
      
      // 清除 URL 參數
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      console.log('PayNow 回調門市資訊已設定:', storeInfo);
    } else {
      console.log('PayNow 回調參數檢查:', { storeId, storeName, storeAddress });
    }
  }, [searchParams]);

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
                {product.imageUrl || (Array.isArray(product.images) && product.images[0]) ? (
                  <Image
                    src={product.imageUrl || (Array.isArray(product.images) && product.images[0]) || "/no-image.png"}
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
      
      {/* 顯示已選擇的門市資訊 */}
      {selectedStore && (
        <div className="mt-12 p-6 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-bold text-green-800 mb-4">✅ 已選擇取貨門市</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">門市名稱</p>
              <p className="font-semibold text-green-700">{selectedStore.storeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">門市代號</p>
              <p className="font-semibold text-green-700">{selectedStore.storeId}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">門市地址</p>
              <p className="font-semibold text-green-700">{selectedStore.storeAddress}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-700">
              💡 門市選擇已完成！現在可以前往商品頁面進行結帳。
            </p>
          </div>
        </div>
      )}
    </section>
  );
} 
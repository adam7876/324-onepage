"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firestore";
import Image from "next/image";
import { useCart } from "../../components/CartContext";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  images?: string[];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  // 商品選項
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  // 多圖主圖 index
  const [mainImgIdx, setMainImgIdx] = useState(0);

  const { addToCart } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
        // 預設選第一個尺寸/顏色
        const data = docSnap.data();
        if (data.sizes && Array.isArray(data.sizes) && data.sizes.length > 0) {
          setSize(data.sizes[0]);
        } else {
          setSize("");
        }
        if (data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
          setColor(data.colors[0]);
        } else {
          setColor("");
        }
        setMainImgIdx(0); // 切換商品時重設主圖
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) return <div className="text-center py-12 text-lg">載入中...</div>;
  if (!product) return <div className="text-center py-12 text-gray-400">找不到商品</div>;

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* 主圖區 */}
          {Array.isArray(product?.images) && product.images.length > 0 ? (
            <div className="relative w-full max-w-xs h-96 flex items-center justify-center">
              {/* 左箭頭 */}
              {product.images.length > 1 && (
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 group select-none"
                  onClick={() => setMainImgIdx(i => (i - 1 + product.images!.length) % product.images!.length)}
                  aria-label="上一張"
                  style={{ outline: 'none' }}
                >
                  <span className="text-3xl font-extrabold text-gray-500 opacity-60 group-hover:opacity-100 group-hover:text-blue-600 drop-shadow-lg transition select-none">{'<'}</span>
                </button>
              )}
              <Image
                src={product.images[mainImgIdx]}
                alt={product.name}
                width={320}
                height={384}
                className="w-full max-w-xs h-96 object-cover rounded bg-gray-100"
                style={{ objectFit: "cover" }}
              />
              {/* 右箭頭 */}
              {product.images.length > 1 && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 group select-none"
                  onClick={() => setMainImgIdx(i => (i + 1) % product.images!.length)}
                  aria-label="下一張"
                  style={{ outline: 'none' }}
                >
                  <span className="text-3xl font-extrabold text-gray-500 opacity-60 group-hover:opacity-100 group-hover:text-blue-600 drop-shadow-lg transition select-none">{'>'}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="w-full max-w-xs h-96 flex items-center justify-center bg-gray-100 rounded text-gray-400">
              無圖片
            </div>
          )}
          {/* 小圖預覽區 */}
          {Array.isArray(product?.images) && product.images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto max-w-xs">
              {product.images.map((img, idx) => (
                <button
                  key={img}
                  className={`border rounded ${mainImgIdx === idx ? 'border-blue-600' : 'border-gray-200'} p-0.5 bg-white transition hover:border-blue-400`}
                  style={{ minWidth: 48 }}
                  onClick={() => setMainImgIdx(idx)}
                  aria-label={`預覽圖${idx+1}`}
                >
                  <Image src={img} alt={`預覽${idx+1}`} width={48} height={48} className="w-12 h-12 object-cover rounded" />
                </button>
              ))}
            </div>
          )}
          {/* 324官網按鈕 */}
          <a
            href="https://www.shop2000.com.tw/324"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-bold shadow-lg hover:from-blue-600 hover:to-indigo-700 hover:scale-105 transition-all text-center tracking-widest"
          >
            324官網
          </a>
        </div>
        {/*
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <div className="text-xl font-bold text-gray-900 mb-4">NT$ {product.price.toLocaleString()}</div>
          <div className="text-gray-700 mb-6 min-h-[3em]">{product.description || "—"}</div>
          商品選項、購物車、已選購內容等區塊暫時隱藏
        </div>
        <div className="my-8 bg-gray-100 rounded p-4">...</div>
        <div className="mt-4 max-w-lg mx-auto">...</div>
        <CartInline />
        */}
      </div>
    </section>
  );
} 
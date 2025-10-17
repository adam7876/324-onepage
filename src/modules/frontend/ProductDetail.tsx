"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firestore";
import Image from "next/image";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
// ===== 以下為購物功能相關 import，暫時隱藏，日後可直接解除註解恢復 =====
import { Button } from "../../components/ui/button";
import CartInline from "../../components/CartInline";
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
  externalOrderUrl?: string;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  // 控制是否顯示外部下單按鈕（預設關閉，保留程式碼供未來啟用）
  const SHOW_EXTERNAL_ORDER = false;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  // 商品選項
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  // 多圖主圖 index
  const [mainImgIdx, setMainImgIdx] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

  // ===== 以下為購物功能相關 hook，暫時隱藏，日後可直接解除註解恢復 =====
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

  const hasImages = Array.isArray(product.images) && product.images && product.images.length > 0;
  const hasMultiImages = Array.isArray(product.images) && product.images && product.images.length > 1;

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* 主圖區（使用 Swiper 輪播） */}
          {hasImages ? (
            <div className="w-full flex justify-center items-center">
              <Swiper
                modules={[Navigation]}
                spaceBetween={16}
                slidesPerView={1}
                className="w-full max-w-xl"
                style={{ minHeight: '200px' }}
                onSlideChange={swiper => setMainImgIdx(swiper.activeIndex)}
                onSwiper={swiper => (swiperRef.current = swiper)}
                navigation={false}
              >
                {product.images!.map((img, idx) => (
                  <SwiperSlide key={img}>
                    <Image
                      src={img}
                      alt={product.name}
                      width={800}
                      height={800}
                      className="object-contain max-w-full max-h-[500px] mx-auto"
                      style={{ objectFit: "contain" }}
                      priority={idx === mainImgIdx}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <div className="w-full max-w-xs h-96 flex items-center justify-center bg-gray-100 rounded text-gray-400">
              無圖片
            </div>
          )}
          {/* 圖片索引顯示 */}
          {hasMultiImages && (
            <div className="w-full flex items-center justify-center gap-4 mt-4 text-base font-bold tracking-widest text-gray-700 select-none">
              {/* 左箭頭 */}
              <button
                type="button"
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition disabled:opacity-30"
                onClick={() => swiperRef.current?.slidePrev()}
                disabled={mainImgIdx === 0}
                aria-label="上一張"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              {/* 數字顯示 */}
              <span>{String(mainImgIdx + 1).padStart(2, '0')} / {String(product.images!.length).padStart(2, '0')}</span>
              {/* 右箭頭 */}
              <button
                type="button"
                className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-200 transition disabled:opacity-30"
                onClick={() => swiperRef.current?.slideNext()}
                disabled={mainImgIdx === product.images!.length - 1}
                aria-label="下一張"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          )}
          {/* 324官網按鈕（暫時關閉：以 SHOW_EXTERNAL_ORDER 控制） */}
          {SHOW_EXTERNAL_ORDER && product.externalOrderUrl && (
            <a
              href={product.externalOrderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-8 px-8 py-3 rounded-full bg-[#880000] text-white text-lg font-bold shadow-lg hover:scale-105 transition-all text-center tracking-widest"
            >
              編號官網下單
            </a>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <div className="text-xl font-bold text-gray-900 mb-4">NT$ {product.price.toLocaleString()}</div>
          <div className="text-gray-700 mb-6 min-h-[3em]">{product.description || "—"}</div>
          <div className="space-y-4">
            {Array.isArray(product.sizes) && product.sizes.length > 0 && (
              <div>
                <label className="block mb-1">尺寸</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  {product.sizes.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}
            {Array.isArray(product.colors) && product.colors.length > 0 && (
              <div>
                <label className="block mb-1">顏色</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  {product.colors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block mb-1">數量</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                className="w-24 border rounded px-3 py-2"
              />
            </div>
            <Button
              className="w-full py-3 text-lg font-bold"
              onClick={() => {
                if (!product) return;
                addToCart({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrl: Array.isArray(product.images) && product.images[0] ? product.images[0] : product.imageUrl,
                  size: size || undefined,
                  color: color || undefined,
                  quantity,
                });
              }}
            >
              加入購物車
            </Button>
          </div>
          <div className="mt-6">
            <CartInline />
          </div>
        </div>
      </div>
    </section>
  );
} 
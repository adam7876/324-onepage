"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firestore";
import { Button } from "../../components/ui/button";
import Image from "next/image";
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
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  // 商品選項
  const [quantity, setQuantity] = useState(1);
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

  // 加入購物車
  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      size,
      color,
      quantity,
    });
    alert("已加入購物車！");
  };

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
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 group"
                  onClick={() => setMainImgIdx(i => (i - 1 + product.images!.length) % product.images!.length)}
                  aria-label="上一張"
                >
                  <span className="text-2xl text-gray-500 opacity-60 group-hover:opacity-100 group-hover:text-black transition select-none">&#8592;</span>
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 group"
                  onClick={() => setMainImgIdx(i => (i + 1) % product.images!.length)}
                  aria-label="下一張"
                >
                  <span className="text-2xl text-gray-500 opacity-60 group-hover:opacity-100 group-hover:text-black transition select-none">&#8594;</span>
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
                  className={`border rounded ${mainImgIdx === idx ? 'border-black' : 'border-gray-200'} p-0.5 bg-white`}
                  style={{ minWidth: 48 }}
                  onClick={() => setMainImgIdx(idx)}
                  aria-label={`預覽圖${idx+1}`}
                >
                  <Image src={img} alt={`預覽${idx+1}`} width={48} height={48} className="w-12 h-12 object-cover rounded" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
          <div className="text-xl font-bold text-gray-900 mb-4">NT$ {product.price.toLocaleString()}</div>
          <div className="text-gray-700 mb-6 min-h-[3em]">{product.description || "—"}</div>
          {/* 商品選項 */}
          <div className="flex gap-4 mb-4">
            <div>
              <label className="block text-sm mb-1">尺寸</label>
              <select value={size} onChange={e => setSize(e.target.value)} className="border rounded px-2 py-1">
                {(product.sizes ?? []).length === 0 && <option value="">無尺寸</option>}
                {(product.sizes ?? []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">顏色</label>
              <select value={color} onChange={e => setColor(e.target.value)} className="border rounded px-2 py-1">
                {(product.colors ?? []).length === 0 && <option value="">無顏色</option>}
                {(product.colors ?? []).map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">數量</label>
              <div className="flex items-center gap-1">
                <Button type="button" size="sm" variant="outline" onClick={() => setQuantity(q => Math.max(1, q - 1))}>-</Button>
                <span className="px-2 w-8 text-center">{quantity}</span>
                <Button type="button" size="sm" variant="outline" onClick={() => setQuantity(q => q + 1)}>+</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 已選購內容區塊 */}
      <div className="my-8 bg-gray-100 rounded p-4">
        <div className="font-bold mb-2">目前已經選購</div>
        <div className="flex items-center gap-4">
          {Array.isArray(product?.images) && product.images.length > 0 && product.images[mainImgIdx] && (
            <Image
              src={product.images[mainImgIdx]}
              alt={product.name}
              width={64}
              height={64}
              className="w-16 h-16 object-cover rounded bg-gray-200"
              style={{ objectFit: "cover" }}
            />
          )}
          <div className="flex-1">
            <div>{product.name}</div>
            <div className="text-sm text-gray-600">尺寸：{size}　顏色：{color}</div>
            <div className="text-sm text-gray-600">數量：{quantity}</div>
          </div>
          <div className="font-bold text-lg">NT$ {(product.price * quantity).toLocaleString()}</div>
        </div>
      </div>
      {/* 加入購物車按鈕 */}
      <div className="mt-4 max-w-lg mx-auto">
        <Button className="w-full py-4 text-lg font-bold" onClick={handleAddToCart}>
          加入購物車
        </Button>
      </div>
      {/* 即時購物車內容 */}
      <CartInline />
      {/* 已移除訂單 Modal，購物車式不再需要 */}
    </section>
  );
} 
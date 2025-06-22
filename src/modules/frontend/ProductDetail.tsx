"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firestore";
import { Button } from "../../components/ui/button";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  // 商品選項
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");

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
      }
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  // 加入購物車
  const handleAddToCart = () => {
    if (!product) return;
    const cartRaw = localStorage.getItem("cart");
    const cart: Array<{
      id: string;
      name: string;
      price: number;
      imageUrl?: string;
      size?: string;
      color?: string;
      quantity: number;
    }> = cartRaw ? JSON.parse(cartRaw) : [];
    // 判斷同商品同尺寸顏色是否已存在
    const idx = cart.findIndex((item) => item.id === product.id && item.size === size && item.color === color);
    if (idx > -1) {
      cart[idx].quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        size,
        color,
        quantity,
      });
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    alert("已加入購物車！");
  };

  if (loading) return <div className="text-center py-12 text-lg">載入中...</div>;
  if (!product) return <div className="text-center py-12 text-gray-400">找不到商品</div>;

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 flex items-center justify-center">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              width={320}
              height={384}
              className="w-full max-w-xs h-96 object-cover rounded bg-gray-100"
              style={{ objectFit: "cover" }}
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
          {product.imageUrl && (
            <Image
              src={product.imageUrl}
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
      {/* 已移除訂單 Modal，購物車式不再需要 */}
    </section>
  );
} 
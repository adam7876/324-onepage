import ProductDetail from "../../../modules/frontend/ProductDetail";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase/firestore";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  // 伺服器端抓取商品名稱
  let title = "324.SAMiSA | 324 一頁式";
  let description = "324.SAMiSA 商品詳情頁";
  try {
    const docRef = doc(db, "products", params.id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.name) {
        title = data.name + " | 324.SAMiSA";
        description = (data.description || "324.SAMiSA 商品詳情頁");
      }
    }
  } catch {}
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: "324.SAMiSA",
      type: "website",
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
    },
  };
}

export default function ProductDetailPage() {
  return <ProductDetail />;
} 
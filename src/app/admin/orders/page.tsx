"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Order {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  shipping: string;
  payment: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: { seconds: number; nanoseconds: number };
  // 預留欄位
  paymentStatus?: string;
  logisticsStatus?: string;
  logisticsNo?: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const router = useRouter();

  // 權限驗證
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace("/admin/login");
    });
    return () => unsubscribe();
  }, [router]);

  // 取得訂單列表
  useEffect(() => {
    async function fetchOrders() {
      let q = collection(db, "orders");
      // 目前僅支援前端搜尋過濾
      const querySnapshot = await getDocs(q);
      const items: Order[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(items.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)));
      setLoading(false);
    }
    fetchOrders();
  }, []);

  // 搜尋過濾
  const filtered = orders.filter(o => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      o.id.toLowerCase().includes(keyword) ||
      o.email?.toLowerCase().includes(keyword) ||
      o.phone?.toLowerCase().includes(keyword)
    );
  });

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8 tracking-widest">訂單管理</h1>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          placeholder="搜尋 Email、電話或訂單編號"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-80"
        />
        <Button onClick={() => router.push("/admin/products")} className="bg-gray-100 text-black font-bold">商品管理</Button>
      </div>
      {loading ? (
        <div className="text-center py-12 text-lg">載入中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">訂單編號</th>
                <th className="border px-4 py-2">收件人</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">電話</th>
                <th className="border px-4 py-2">金額</th>
                <th className="border px-4 py-2">狀態</th>
                <th className="border px-4 py-2">物流</th>
                <th className="border px-4 py-2">付款</th>
                <th className="border px-4 py-2">建立時間</th>
                <th className="border px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center py-8 text-gray-400">查無訂單</td></tr>
              )}
              {filtered.map((o) => (
                <>
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1 font-mono text-xs">{o.id}</td>
                    <td className="border px-2 py-1">{o.name}</td>
                    <td className="border px-2 py-1">{o.email}</td>
                    <td className="border px-2 py-1">{o.phone}</td>
                    <td className="border px-2 py-1">NT$ {o.total?.toLocaleString()}</td>
                    <td className="border px-2 py-1">{o.status}</td>
                    <td className="border px-2 py-1">{o.shipping}</td>
                    <td className="border px-2 py-1">{o.payment}</td>
                    <td className="border px-2 py-1 font-mono text-xs">{o.createdAt ? new Date(o.createdAt.seconds * 1000).toLocaleString() : ""}</td>
                    <td className="border px-2 py-1">
                      <Button size="sm" variant="outline" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                        {expanded === o.id ? "收合" : "明細"}
                      </Button>
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr>
                      <td colSpan={10} className="bg-gray-50 border-t p-4">
                        <div className="mb-2 font-bold">商品明細</div>
                        <ul className="mb-2">
                          {o.items?.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 py-1">
                              {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded" />}
                              <span>{item.name}</span>
                              <span className="text-gray-400">x{item.quantity}</span>
                              <span className="ml-auto">NT$ {item.price?.toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mb-2">收件地址：{o.address}</div>
                        <div className="mb-2">物流方式：{o.shipping}</div>
                        <div className="mb-2">付款方式：{o.payment}</div>
                        {/* 預留金流、物流、狀態欄位 */}
                        <div className="mb-2">金流狀態：{o.paymentStatus ?? "-"}</div>
                        <div className="mb-2">物流狀態：{o.logisticsStatus ?? "-"}</div>
                        <div className="mb-2">物流單號：{o.logisticsNo ?? "-"}</div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
} 
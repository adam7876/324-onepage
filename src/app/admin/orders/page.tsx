"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dayjs from "dayjs";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface LogisticsInfo {
  storeId: string;
  storeName: string;
  storeAddress: string;
  storePhone?: string;
  logisticsNo?: string;
  logisticsStatus?: 'pending' | 'shipped' | 'delivered' | 'returned';
  shippedAt?: { seconds: number; nanoseconds: number };
  deliveredAt?: { seconds: number; nanoseconds: number };
}

interface Order {
  id: string;
  orderNumber?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  shipping: string;
  payment: string;
  customerNotes?: string;
  items: OrderItem[];
  total: number;
  amountExpected?: number;
  paymentStatus?: string;
  paymentRequestedAt?: { seconds: number; nanoseconds: number } | null;
  paidAt?: { seconds: number; nanoseconds: number } | null;
  tradeNo?: string;
  status: string;
  createdAt: { seconds: number; nanoseconds: number };
  // 7-11 店到店物流資訊
  logisticsInfo?: LogisticsInfo;
}

// 訂單狀態選項
const ORDER_STATUS = [
  "待付款",
  "已付款",
  "待出貨",
  "已出貨",
  "已完成",
  "已取消",
  "退款中",
  "已退款",
] as const;
type OrderStatus = typeof ORDER_STATUS[number];

// 狀態顏色配置
const getStatusColor = (status: string) => {
  switch (status) {
    case "待付款":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "已付款":
      return "bg-green-100 text-green-800 border-green-200";
    case "待出貨":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "已出貨":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "已完成":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "已取消":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "退款中":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "已退款":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [statusSaving, setStatusSaving] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterOrderNumber, setFilterOrderNumber] = useState("");
  const [filterId, setFilterId] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterPhone, setFilterPhone] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const router = useRouter();

  // 權限驗證
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) router.replace("/admin/login");
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  // 取得訂單列表
  useEffect(() => {
    async function fetchOrders() {
      const q = collection(db, "orders");
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

  // 多條件過濾
  const filtered = orders.filter(o => {
    // 關鍵字搜尋（原本的）
    const keyword = search.trim().toLowerCase();
    if (keyword && !(
      o.id.toLowerCase().includes(keyword) ||
      (o.orderNumber || '').toLowerCase().includes(keyword) ||
      o.email?.toLowerCase().includes(keyword) ||
      o.phone?.toLowerCase().includes(keyword)
    )) return false;
    // 狀態
    if (filterStatus.length > 0 && !filterStatus.includes(o.status)) return false;
    // 新的訂單編號
    if (filterOrderNumber && !(o.orderNumber || '').toLowerCase().includes(filterOrderNumber.trim().toLowerCase())) return false;
    // 訂單編號
    if (filterId && !o.id.toLowerCase().includes(filterId.trim().toLowerCase())) return false;
    // Email
    if (filterEmail && !o.email?.toLowerCase().includes(filterEmail.trim().toLowerCase())) return false;
    // 電話
    if (filterPhone && !o.phone?.includes(filterPhone.trim())) return false;
    // 收件人
    if (filterName && !o.name?.toLowerCase().includes(filterName.trim().toLowerCase())) return false;
    // 建立日期區間
    if (filterDateStart) {
      const start = dayjs(filterDateStart).startOf('day');
      const orderDate = dayjs.unix(o.createdAt?.seconds ?? 0);
      if (orderDate.isBefore(start)) return false;
    }
    if (filterDateEnd) {
      const end = dayjs(filterDateEnd).endOf('day');
      const orderDate = dayjs.unix(o.createdAt?.seconds ?? 0);
      if (orderDate.isAfter(end)) return false;
    }
    // 金額範圍
    if (filterAmountMin && o.total < Number(filterAmountMin)) return false;
    if (filterAmountMax && o.total > Number(filterAmountMax)) return false;
    return true;
  });

  // 批次刪除函數
  const handleBatchDelete = async () => {
    if (selectedOrders.length === 0) return;
    
    setBatchDeleting(true);
    try {
      const deletePromises = selectedOrders.map(orderId => 
        deleteDoc(doc(db, "orders", orderId))
      );
      await Promise.all(deletePromises);
      
      // 更新本地狀態
      setOrders(prev => prev.filter(order => !selectedOrders.includes(order.id)));
      setSelectedOrders([]);
      alert(`成功刪除 ${selectedOrders.length} 筆訂單`);
    } catch (error) {
      console.error("批次刪除失敗:", error);
      alert("刪除失敗，請稍後再試");
    } finally {
      setBatchDeleting(false);
    }
  };

  // 全選/取消全選
  const handleSelectAll = () => {
    if (selectedOrders.length === filtered.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filtered.map(order => order.id));
    }
  };

  if (!authChecked) {
    return <div className="text-center py-24 text-lg">權限驗證中...</div>;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex gap-2 mb-4">
        <Link href="/admin" className="px-4 py-2 rounded bg-gray-100 text-black font-bold hover:bg-gray-200">回主控台</Link>
        <Link href="/" className="px-4 py-2 rounded bg-gray-100 text-black font-bold hover:bg-gray-200">回首頁</Link>
      </div>
      <h1 className="text-2xl font-bold mb-8 tracking-widest">訂單管理</h1>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <input
          type="text"
          placeholder="搜尋 Email、電話、訂單編號"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full md:w-80"
        />
        <div className="flex gap-2">
          {selectedOrders.length > 0 && (
            <Button 
              onClick={handleBatchDelete} 
              disabled={batchDeleting}
              className="bg-red-500 text-white font-bold hover:bg-red-600"
            >
              {batchDeleting ? "刪除中..." : `刪除選中 (${selectedOrders.length})`}
            </Button>
          )}
          <Button onClick={() => router.push("/admin/products")} className="bg-gray-100 text-black font-bold">商品管理</Button>
        </div>
      </div>
      {/* 多條件搜尋表單 */}
      <div className="mb-4">
        <button
          className="mb-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
          onClick={() => setShowFilters(v => !v)}
          type="button"
        >
          {showFilters ? "收合搜尋條件" : "展開更多搜尋條件"}
        </button>
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-gray-50 p-4 rounded border mb-2">
            <div>
              <label className="block text-xs mb-1">狀態</label>
              <div className="flex gap-2 items-center">
                <select
                  multiple
                  className="border rounded px-2 py-1 w-full"
                  value={filterStatus}
                  onChange={e => setFilterStatus(Array.from(e.target.selectedOptions, o => o.value))}
                >
                  {ORDER_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {filterStatus.length > 0 && (
                  <button
                    type="button"
                    className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setFilterStatus([])}
                  >清除</button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs mb-1">訂單編號</label>
              <input className="border rounded px-2 py-1 w-full" value={filterOrderNumber} onChange={e => setFilterOrderNumber(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">文件ID</label>
              <input className="border rounded px-2 py-1 w-full" value={filterId} onChange={e => setFilterId(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">Email</label>
              <input className="border rounded px-2 py-1 w-full" value={filterEmail} onChange={e => setFilterEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">電話</label>
              <input className="border rounded px-2 py-1 w-full" value={filterPhone} onChange={e => setFilterPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">收件人</label>
              <input className="border rounded px-2 py-1 w-full" value={filterName} onChange={e => setFilterName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">建立日期（起）</label>
              <input type="date" className="border rounded px-2 py-1 w-full" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">建立日期（迄）</label>
              <input type="date" className="border rounded px-2 py-1 w-full" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">金額（最小）</label>
              <input type="number" className="border rounded px-2 py-1 w-full" value={filterAmountMin} onChange={e => setFilterAmountMin(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs mb-1">金額（最大）</label>
              <input type="number" className="border rounded px-2 py-1 w-full" value={filterAmountMax} onChange={e => setFilterAmountMax(e.target.value)} />
            </div>
          </div>
        )}
      </div>
      {loading ? (
        <div className="text-center py-12 text-lg">載入中...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === filtered.length && filtered.length > 0}
                    onChange={handleSelectAll}
                    className="mr-2"
                  />
                  選擇
                </th>
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
                <tr><td colSpan={9} className="text-center py-8 text-gray-400">查無訂單</td></tr>
              )}
              {filtered.map((o) => (
                <>
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(o.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(prev => [...prev, o.id]);
                          } else {
                            setSelectedOrders(prev => prev.filter(id => id !== o.id));
                          }
                        }}
                      />
                    </td>
                    <td className="border px-2 py-1 font-mono text-xs">{o.orderNumber || '-'}</td>
                    <td className="border px-2 py-1">{o.name}</td>
                    <td className="border px-2 py-1">{o.email}</td>
                    <td className="border px-2 py-1">{o.phone}</td>
                    <td className="border px-2 py-1">NT$ {o.total?.toLocaleString()}</td>
                    <td className="border px-2 py-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(o.status)}`}>
                          {o.status}
                        </span>
                        <select
                          className="border rounded px-2 py-1 bg-white text-sm"
                          value={o.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value as OrderStatus;
                            setStatusSaving(o.id);
                            setStatusError(null);
                            setStatusSuccess(null);
                            try {
                              await updateDoc(doc(db, "orders", o.id), { status: newStatus });
                              setOrders((prev) => prev.map((ord) => ord.id === o.id ? { ...ord, status: newStatus } : ord));
                              setStatusSuccess(o.id);
                              setTimeout(() => setStatusSuccess(null), 1200);
                            } catch {
                              setStatusError(o.id);
                              setTimeout(() => setStatusError(null), 2000);
                            } finally {
                              setStatusSaving(null);
                            }
                          }}
                        >
                          {ORDER_STATUS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      {statusSaving === o.id && <span className="ml-2 text-xs text-blue-500">儲存中...</span>}
                      {statusSuccess === o.id && <span className="ml-2 text-xs text-green-600">✔</span>}
                      {statusError === o.id && <span className="ml-2 text-xs text-red-500">儲存失敗</span>}
                    </td>
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
                              {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded" />} {/* eslint-disable-line @next/next/no-img-element */}
                              <span>{item.name}</span>
                              <span className="text-gray-400">x{item.quantity}</span>
                              <span className="ml-auto">NT$ {item.price?.toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mb-2">新訂單編號：{o.orderNumber || '-'}</div>
                        <div className="mb-2">收件地址：{o.address}</div>
                        <div className="mb-2">物流方式：{o.shipping}</div>
                        <div className="mb-2">付款方式：{o.payment}</div>
                        <div className="mb-2">顧客備註：{o.customerNotes || '-'}</div>
                        {/* 預留金流、物流、狀態欄位 */}
                        <div className="mb-2">金流狀態：{o.paymentStatus ?? "-"}</div>
                        <div className="mb-2">請款時間：{o.paymentRequestedAt ? new Date(o.paymentRequestedAt.seconds * 1000).toLocaleString() : '-'}</div>
                        <div className="mb-2">付款時間：{o.paidAt ? new Date(o.paidAt.seconds * 1000).toLocaleString() : '-'}</div>
                        <div className="mb-2">金流交易編號：{o.tradeNo || '-'}</div>
                        <div className="mb-2">物流狀態：{o.logisticsInfo?.logisticsStatus ?? "-"}</div>
                        <div className="mb-2">物流單號：{o.logisticsInfo?.logisticsNo ?? "-"}</div>
                        {o.logisticsInfo && (
                          <>
                            <div className="mb-2">門市代號：{o.logisticsInfo.storeId}</div>
                            <div className="mb-2">門市名稱：{o.logisticsInfo.storeName}</div>
                            <div className="mb-2">門市地址：{o.logisticsInfo.storeAddress}</div>
                            {o.logisticsInfo.storePhone && (
                              <div className="mb-2">門市電話：{o.logisticsInfo.storePhone}</div>
                            )}
                          </>
                        )}
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
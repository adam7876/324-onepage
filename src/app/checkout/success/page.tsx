"use client";
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { Button } from '@/components/ui/button';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const transactionId = searchParams.get('transactionId');
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      fetchOrderData();
    } else {
      setLoading(false);
    }
  }, [orderNumber]);

  const fetchOrderData = async () => {
    try {
      // 根據訂單編號查詢訂單（需要遍歷所有訂單找到對應的）
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('orderNumber', '==', orderNumber));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const orderDoc = querySnapshot.docs[0];
        setOrderData({ id: orderDoc.id, ...orderDoc.data() });
      }
    } catch (error) {
      console.error('取得訂單資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>正在確認付款狀態...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-green-700 mb-4">付款成功！</h1>
        
        {orderData && (
          <div className="text-left bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-bold mb-2">訂單資訊</h3>
            <p><strong>訂單編號：</strong>{orderData.orderNumber}</p>
            <p><strong>交易編號：</strong>{transactionId || '處理中'}</p>
            <p><strong>付款狀態：</strong>已付款</p>
            <p><strong>總金額：</strong>NT$ {orderData.total?.toLocaleString()}</p>
            <p><strong>收件人：</strong>{orderData.name}</p>
            <p><strong>聯絡電話：</strong>{orderData.phone}</p>
            <p><strong>收件地址：</strong>{orderData.address}</p>
            {orderData.customerNotes && (
              <p><strong>備註：</strong>{orderData.customerNotes}</p>
            )}
          </div>
        )}

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-blue-800 mb-2">後續處理</h3>
          <p className="text-blue-700 text-sm">
            我們已收到您的付款，商品將於 1-3 個工作天內出貨。
            如有任何問題，請聯繫客服。
          </p>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            回到首頁
          </Button>
          <Button 
            onClick={() => window.location.href = '/cart'}
            variant="outline"
            className="w-full"
          >
            繼續購物
          </Button>
        </div>
      </div>
    </div>
  );
}

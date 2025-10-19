"use client";
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function CheckoutCancelledPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-orange-500 text-6xl mb-4">⚠</div>
        <h1 className="text-2xl font-bold text-orange-700 mb-4">付款已取消</h1>
        
        <div className="text-gray-600 mb-6">
          <p className="mb-2">您已取消此次付款</p>
          {orderNumber && (
            <p className="text-sm">訂單編號：{orderNumber}</p>
          )}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-blue-800 mb-2">後續處理</h3>
          <p className="text-blue-700 text-sm">
            您的訂單已保留，如需完成付款，請重新進入結帳流程。
          </p>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={() => window.location.href = '/cart'}
            className="w-full"
          >
            重新結帳
          </Button>
          <Button 
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="w-full"
          >
            回到首頁
          </Button>
        </div>
      </div>
    </div>
  );
}

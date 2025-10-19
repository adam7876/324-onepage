"use client";
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function CheckoutFailedPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const reason = searchParams.get('reason');

  const getErrorMessage = (reason: string | null) => {
    switch (reason) {
      case 'cancelled':
        return '付款已取消';
      case 'failed':
        return '付款失敗';
      case 'timeout':
        return '付款逾時';
      case 'no_order_id':
        return '訂單資訊錯誤';
      case 'system_error':
        return '系統錯誤';
      default:
        return '付款處理失敗';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="text-red-500 text-6xl mb-4">✗</div>
        <h1 className="text-2xl font-bold text-red-700 mb-4">付款失敗</h1>
        
        <div className="text-gray-600 mb-6">
          <p className="mb-2">{getErrorMessage(reason)}</p>
          {orderNumber && (
            <p className="text-sm">訂單編號：{orderNumber}</p>
          )}
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">建議處理方式</h3>
          <ul className="text-yellow-700 text-sm text-left space-y-1">
            <li>• 檢查網路連線是否穩定</li>
            <li>• 確認 LINE Pay 帳戶餘額充足</li>
            <li>• 重新嘗試付款</li>
            <li>• 或選擇其他付款方式</li>
          </ul>
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

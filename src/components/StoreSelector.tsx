/**
 * 7-11 門市選擇元件
 * 整合 PayNow 門市選擇功能
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { LogisticsInfo } from '@/types';

interface StoreSelectorProps {
  onStoreSelected: (storeInfo: LogisticsInfo) => void;
  selectedStore?: LogisticsInfo | null;
  disabled?: boolean;
}


export default function StoreSelector({ onStoreSelected, selectedStore, disabled = false }: StoreSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 處理 PayNow 回調
  useEffect(() => {
    // 監聽來自 PayNow 回調的訊息
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'PAYNOW_STORE_SELECTED') {
        const storeInfo: LogisticsInfo = {
          storeId: event.data.storeInfo.storeId,
          storeName: event.data.storeInfo.storeName,
          storeAddress: event.data.storeInfo.storeAddress || '',
          logisticsStatus: 'pending'
        };
        
        onStoreSelected(storeInfo);
        console.log('收到 PayNow 門市選擇訊息:', storeInfo);
      }
    };

    window.addEventListener('message', handleMessage);

    // 清理事件監聽器
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onStoreSelected]);

  const handleSelectStore = async () => {
    if (disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // 開啟新視窗進行門市選擇
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/paynow/choose-store';
      form.target = 'paynow-store-selector'; // 指定視窗名稱
      
      const orderNumberInput = document.createElement('input');
      orderNumberInput.type = 'hidden';
      orderNumberInput.name = 'orderNumber';
      orderNumberInput.value = `TEMP_${Date.now()}`;
      
      form.appendChild(orderNumberInput);
      document.body.appendChild(form);
      
      // 開啟新視窗
      const popup = window.open('', 'paynow-store-selector', 'width=800,height=600,scrollbars=yes,resizable=yes');
      if (popup) {
        form.submit();
        document.body.removeChild(form);
        
        // 監聽視窗關閉事件
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            setIsLoading(false);
          }
        }, 1000);
      } else {
        throw new Error('無法開啟新視窗，請檢查瀏覽器彈出視窗設定');
      }
      
    } catch (err) {
      console.error('門市選擇錯誤:', err);
      setError(err instanceof Error ? err.message : '門市選擇失敗');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700">
        選擇取貨門市
      </div>
      
      {selectedStore ? (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-800">已選擇門市</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectStore}
                disabled={disabled || isLoading}
                className="text-xs"
              >
                重新選擇
              </Button>
            </div>
            <div className="text-sm text-green-700">
              <div className="font-medium">{selectedStore.storeName}</div>
              <div className="text-xs text-gray-600">門市代號: {selectedStore.storeId}</div>
              {selectedStore.storeAddress && (
                <div className="text-xs text-gray-600">{selectedStore.storeAddress}</div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 border-gray-200">
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              請選擇 7-11 便利商店作為取貨門市
            </div>
            <Button
              onClick={handleSelectStore}
              disabled={disabled || isLoading}
              className="w-full"
            >
              {isLoading ? '載入中...' : '選擇門市'}
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

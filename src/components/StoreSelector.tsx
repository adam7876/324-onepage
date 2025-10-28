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

interface PayNowStoreResponse {
  success: boolean;
  storeId?: string;
  storeName?: string;
  storeAddress?: string;
  error?: string;
}

export default function StoreSelector({ onStoreSelected, selectedStore, disabled = false }: StoreSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 處理 PayNow 回調
  useEffect(() => {
    const handlePayNowCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const storeId = urlParams.get('store_id');
      const storeName = urlParams.get('store_name');
      const storeAddress = urlParams.get('store_address');

      if (storeId && storeName) {
        const storeInfo: LogisticsInfo = {
          storeId,
          storeName,
          storeAddress: storeAddress || '',
          logisticsStatus: 'pending'
        };
        
        onStoreSelected(storeInfo);
        
        // 清除 URL 參數
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    };

    handlePayNowCallback();
  }, [onStoreSelected]);

  const handleSelectStore = async () => {
    if (disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      // 跳轉到 PayNow 門市選擇頁面
      const response = await fetch('/api/paynow/choose-store', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumber: `TEMP_${Date.now()}` // 臨時訂單編號
        })
      });

      const result = await response.json();

      if (result.success && result.redirectUrl) {
        // 跳轉到 PayNow 門市選擇頁面
        window.location.href = result.redirectUrl;
      } else {
        throw new Error(result.error || '無法開啟門市選擇頁面');
      }
    } catch (err) {
      console.error('門市選擇錯誤:', err);
      setError(err instanceof Error ? err.message : '門市選擇失敗');
    } finally {
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

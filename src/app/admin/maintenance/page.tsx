"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { User } from "firebase/auth";

interface CleanupStats {
  emailVerifications: {
    expired: number;
    used: number;
  };
  gameTokens: {
    expired: number;
    used: number;
  };
  gameHistory: {
    old: number;
  };
  totalToClean?: number;
  totalCleaned?: number;
}

export default function MaintenancePage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingData, setCheckingData] = useState(false);
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null);
  const [lastCleanup, setLastCleanup] = useState<CleanupStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/admin/login");
        return;
      }
      setUser(user);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, [router]);

  // 檢查需要清理的資料
  const checkCleanupData = async () => {
    setCheckingData(true);
    try {
      const response = await fetch('/api/admin/cleanup');
      const data = await response.json();
      
      if (data.success) {
        setCleanupStats(data.data);
      } else {
        alert(`檢查失敗：${data.message}`);
      }
    } catch (error) {
      console.error('檢查清理資料失敗:', error);
      alert('檢查失敗，請稍後再試');
    } finally {
      setCheckingData(false);
    }
  };

  // 執行清理
  const performCleanup = async () => {
    if (!confirm('確定要執行資料清理嗎？此操作無法復原！')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminKey: 'cleanup-324-games'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setLastCleanup(data.data);
        setCleanupStats(null);
        alert(`清理成功！${data.message}`);
      } else {
        alert(`清理失敗：${data.message}`);
      }
    } catch (error) {
      console.error('執行清理失敗:', error);
      alert('清理失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (!authChecked) {
    return <div className="text-center py-24 text-lg">權限驗證中...</div>;
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🧹 資料庫維護</h1>
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
        </div>

        {/* 說明區塊 */}
        <Card className="p-6 mb-8 bg-blue-50">
          <h2 className="text-xl font-bold mb-4 text-blue-800">📋 自動清理說明</h2>
          <div className="space-y-2 text-blue-700">
            <p>• <strong>Email 驗證記錄</strong>：清理過期驗證碼（10分鐘後）和已使用記錄（1天後）</p>
            <p>• <strong>遊戲令牌</strong>：清理過期令牌（10分鐘後）和已使用令牌（1天後）</p>
            <p>• <strong>遊戲歷史</strong>：清理90天前的舊記錄（保留近期資料做分析）</p>
            <p>• <strong>遊戲配置</strong>：不會被清理（重要設定資料）</p>
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 檢查資料 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">🔍 檢查待清理資料</h2>
            
            <Button 
              onClick={checkCleanupData} 
              disabled={checkingData}
              className="w-full mb-4"
            >
              {checkingData ? '檢查中...' : '🔍 檢查資料量'}
            </Button>

            {cleanupStats && (
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <div className="font-semibold text-gray-700 mb-2">📧 Email 驗證記錄</div>
                  <div className="text-sm space-y-1">
                    <div>過期記錄：<span className="font-bold text-red-600">{cleanupStats.emailVerifications.expired}</span> 筆</div>
                    <div>已使用記錄：<span className="font-bold text-orange-600">{cleanupStats.emailVerifications.used}</span> 筆</div>
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="font-semibold text-gray-700 mb-2">🎟️ 遊戲令牌</div>
                  <div className="text-sm space-y-1">
                    <div>過期令牌：<span className="font-bold text-red-600">{cleanupStats.gameTokens.expired}</span> 筆</div>
                    <div>已使用令牌：<span className="font-bold text-orange-600">{cleanupStats.gameTokens.used}</span> 筆</div>
                  </div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="font-semibold text-gray-700 mb-2">📈 遊戲歷史</div>
                  <div className="text-sm">
                    <div>90天前記錄：<span className="font-bold text-yellow-600">{cleanupStats.gameHistory.old}</span> 筆</div>
                  </div>
                </div>

                <div className="bg-gray-100 rounded-lg p-3 mt-4">
                  <div className="font-bold text-lg text-center">
                    總計需清理：<span className="text-red-600">{cleanupStats.totalToClean || 0}</span> 筆記錄
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* 執行清理 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">🚀 執行清理</h2>
            
            <Button 
              onClick={performCleanup} 
              disabled={loading || !cleanupStats || (cleanupStats.totalToClean || 0) === 0}
              variant="destructive"
              className="w-full mb-4"
            >
              {loading ? '清理中...' : '🧹 執行清理'}
            </Button>

            {cleanupStats && (cleanupStats.totalToClean || 0) === 0 && (
              <div className="text-center text-green-600 font-semibold">
                ✅ 目前沒有需要清理的資料
              </div>
            )}

            {lastCleanup && (
              <div className="space-y-3">
                <div className="font-semibold text-green-700 mb-2">✅ 上次清理結果</div>
                
                <div className="border border-green-200 rounded-lg p-3 bg-green-50">
                  <div className="text-sm space-y-1">
                    <div>📧 Email 驗證：{lastCleanup.emailVerifications.expired + lastCleanup.emailVerifications.used} 筆</div>
                    <div>🎟️ 遊戲令牌：{lastCleanup.gameTokens.expired + lastCleanup.gameTokens.used} 筆</div>
                    <div>📈 遊戲歷史：{lastCleanup.gameHistory.old} 筆</div>
                  </div>
                  <div className="border-t border-green-300 pt-2 mt-2">
                    <div className="font-bold text-green-800">
                      總共清理：{lastCleanup.totalCleaned} 筆記錄
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* 建議維護頻率 */}
        <Card className="p-6 mt-8 bg-yellow-50">
          <h2 className="text-xl font-bold mb-4 text-yellow-800">💡 維護建議</h2>
          <div className="space-y-2 text-yellow-700">
            <p>• <strong>每週執行一次</strong>：定期清理可避免資料累積過多</p>
            <p>• <strong>監控資料量</strong>：如果遊戲使用頻繁，可考慮更頻繁的清理</p>
            <p>• <strong>備份重要資料</strong>：清理前確保重要的遊戲統計資料已備份</p>
            <p>• <strong>未來可考慮</strong>：使用 Firebase Functions 實現自動定期清理</p>
          </div>
        </Card>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, collection, query, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firestore";
import { app } from "@/firebase/firebaseConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRewardDescription } from "@/lib/game-utils";
import { Card } from "@/components/ui/card";
import type { User } from "firebase/auth";

interface GameRewardConfig {
  type: 'coupon' | 'discount' | 'freeShipping';
  value: number;
  description: string;
}

interface GameStats {
  todayTotal: number;
  todayWins: number;
  todayEmails: string[];
}

export default function GameManagement() {
  const [authChecked, setAuthChecked] = useState(false);
  const [, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameStats, setGameStats] = useState<GameStats>({
    todayTotal: 0,
    todayWins: 0,
    todayEmails: []
  });
  const [saving, setSaving] = useState(false);
  const [rewardConfig, setRewardConfig] = useState<GameRewardConfig>({
    type: 'coupon',
    value: 30,
    description: '30元折價券'
  });
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
      loadRewardConfig();
      loadGameStats();
    });
    return () => unsubscribe();
  }, [router]);

  const loadRewardConfig = async () => {
    try {
      const docRef = doc(db, 'gameConfig', 'reward');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as GameRewardConfig;
        setRewardConfig(data);
      }
    } catch (error) {
      console.error('載入獎品配置失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadGameStats = async () => {
    try {
      const gameHistoryQuery = query(collection(db, 'gameHistory'));
      const snapshot = await getDocs(gameHistoryQuery);
      
      const today = new Date();
      const todayRecords = snapshot.docs.filter(doc => {
        const data = doc.data();
        const playedAt = data.playedAt?.toDate();
        if (!playedAt) return false;
        
        return playedAt.getDate() === today.getDate() &&
               playedAt.getMonth() === today.getMonth() &&
               playedAt.getFullYear() === today.getFullYear();
      });

      const todayEmails = [...new Set(todayRecords.map(doc => doc.data().email))];
      const todayWins = todayRecords.filter(doc => doc.data().result === 'win').length;

      setGameStats({
        todayTotal: todayRecords.length,
        todayWins,
        todayEmails
      });
    } catch (error) {
      console.error('載入遊戲統計失敗:', error);
    }
  };

  const saveRewardConfig = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'gameConfig', 'reward');
      await setDoc(docRef, rewardConfig);
      alert('獎品配置保存成功！');
    } catch (error) {
      console.error('保存獎品配置失敗:', error);
      alert('保存失敗，請稍後再試');
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (type: 'coupon' | 'discount' | 'freeShipping') => {
    setRewardConfig(prev => ({
      ...prev,
      type,
      description: formatRewardDescription(type, prev.value)
    }));
  };

  const handleValueChange = (value: number) => {
    setRewardConfig(prev => ({
      ...prev,
      value,
      description: formatRewardDescription(prev.type, value)
    }));
  };

  if (!authChecked || loading) {
    return <div className="text-center py-24 text-lg">載入中...</div>;
  }

  return (
    <section className="max-w-4xl mx-auto px-4 py-16">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">🎮 遊戲管理</h1>
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
        </div>

        {/* 今日統計 */}
        <div className="mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">📊 今日遊戲統計</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{gameStats.todayTotal}</div>
                <div className="text-sm text-gray-600">總遊戲次數</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{gameStats.todayWins}</div>
                <div className="text-sm text-gray-600">中獎次數</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{gameStats.todayEmails.length}</div>
                <div className="text-sm text-gray-600">參與用戶</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-500">
                中獎率：{gameStats.todayTotal > 0 ? ((gameStats.todayWins / gameStats.todayTotal) * 100).toFixed(1) : 0}%
              </div>
              <Button 
                onClick={loadGameStats} 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                🔄 重新整理
              </Button>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* 獎品設定 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">🎁 獎品設定</h2>
            
            <div className="space-y-6">
              {/* 獎品類型選擇 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  獎品類型
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleTypeChange('coupon')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      rewardConfig.type === 'coupon'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    💰 回饋金
                  </button>
                  <button
                    onClick={() => handleTypeChange('discount')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      rewardConfig.type === 'discount'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📊 折扣優惠
                  </button>
                  <button
                    onClick={() => handleTypeChange('freeShipping')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      rewardConfig.type === 'freeShipping'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🚚 免運券
                  </button>
                </div>
              </div>

              {/* 數值設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {rewardConfig.type === 'coupon' 
                    ? '折價金額 (元)'
                    : rewardConfig.type === 'freeShipping'
                      ? '免運券張數 (張)'
                      : '折扣 (折)'}
                </label>
                <Input
                  type="number"
                  value={rewardConfig.value}
                  onChange={(e) => handleValueChange(Number(e.target.value))}
                  placeholder={rewardConfig.type === 'coupon' ? '請輸入金額' : rewardConfig.type === 'freeShipping' ? '請輸入張數' : '請輸入折數'}
                  min={1}
                  max={rewardConfig.type === 'coupon' ? 1000 : 99}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {rewardConfig.type === 'coupon' 
                    ? '建議範圍：1-1000元' 
                    : rewardConfig.type === 'freeShipping'
                      ? '建議範圍：1-99張'
                      : '建議範圍：1-99折 (例如：85代表85折)'
                  }
                </p>
              </div>

              {/* 預覽 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">預覽</h3>
                <div className="bg-green-100 border border-green-300 rounded-lg p-3">
                  <p className="text-green-800 font-bold">
                    🎁 {rewardConfig.description}
                  </p>
                </div>
              </div>

              {/* 保存按鈕 */}
              <Button 
                onClick={saveRewardConfig}
                disabled={saving}
                className="w-full"
              >
                {saving ? '保存中...' : '💾 保存設定'}
              </Button>
            </div>
          </Card>

          {/* 遊戲狀態 */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6 text-gray-800">🎯 遊戲狀態</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✂️</span>
                  <div>
                    <p className="font-medium text-gray-800">猜拳遊戲</p>
                    <p className="text-sm text-gray-600">與電腦猜拳，贏了拿獎品</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  啟用中
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🎰</span>
                  <div>
                    <p className="font-medium text-gray-800">骰子比大小</p>
                    <p className="text-sm text-gray-600">擲骰子比大小，點數大就贏</p>
                  </div>
                </div>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  啟用中
                </span>
              </div>

              <div className="border-t border-gray-200 pt-4 mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">遊戲規則</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 每位用戶每天只能玩一次</li>
                  <li>• 需要Email驗證才能遊玩</li>
                  <li>• 獲勝即可獲得設定的獎品</li>
                  <li>• 平手可以重新遊玩</li>
                  <li>• 獎品可在結帳時使用</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        {/* 統計資訊 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-800">📊 遊戲統計</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">-</p>
              <p className="text-sm text-gray-600">今日遊玩次數</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">-</p>
              <p className="text-sm text-gray-600">獲獎次數</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">-</p>
              <p className="text-sm text-gray-600">累計遊玩</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">-</p>
              <p className="text-sm text-gray-600">獲獎率</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            * 統計功能將在後續版本中提供
          </p>
        </div>
      </div>
    </section>
  );
}

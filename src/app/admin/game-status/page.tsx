"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase/firebaseConfig';
import { getGameStatus, setGameStatus, toggleGameStatus, GameStatus } from '../../../lib/game-status-service';

export default function GameStatusPage() {
  const [user, setUser] = useState<any>(null);
  const [gameStatus, setGameStatusState] = useState<GameStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // 檢查認證狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 載入遊戲狀態
  useEffect(() => {
    if (user) {
      loadGameStatus();
    }
  }, [user]);

  const loadGameStatus = async () => {
    try {
      const status = await getGameStatus();
      setGameStatusState(status);
    } catch (error) {
      console.error('載入遊戲狀態失敗:', error);
      setMessage('載入遊戲狀態失敗');
    }
  };

  const handleToggleStatus = async () => {
    try {
      setSaving(true);
      const newStatus = await toggleGameStatus();
      setGameStatusState(newStatus);
      setMessage(`遊戲已${newStatus.isOpen ? '開啟' : '關閉'}`);
    } catch (error) {
      console.error('切換遊戲狀態失敗:', error);
      setMessage('切換遊戲狀態失敗');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMessage = async (field: 'maintenanceTitle' | 'maintenanceMessage', value: string) => {
    if (!gameStatus) return;
    
    try {
      setSaving(true);
      const updatedStatus = {
        ...gameStatus,
        [field]: value,
        lastUpdated: new Date(),
      };
      await setGameStatus(updatedStatus);
      setGameStatusState(updatedStatus);
      setMessage('訊息已更新');
    } catch (error) {
      console.error('更新訊息失敗:', error);
      setMessage('更新訊息失敗');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">請先登入</h1>
          <p className="text-gray-600">您需要登入才能管理遊戲狀態</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">🎮 遊戲狀態管理</h1>
          
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('失敗') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}>
              {message}
            </div>
          )}

          {gameStatus && (
            <div className="space-y-6">
              {/* 遊戲開關 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">遊戲開關</h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      目前狀態：<span className={`font-bold ${gameStatus.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                        {gameStatus.isOpen ? '🟢 開放中' : '🔴 關閉中'}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      最後更新：{gameStatus.lastUpdated.toLocaleString('zh-TW')}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleStatus}
                    disabled={saving}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      gameStatus.isOpen
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {saving ? '處理中...' : gameStatus.isOpen ? '關閉遊戲' : '開啟遊戲'}
                  </button>
                </div>
              </div>

              {/* 休息日設定 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">休息日設定</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      休息日標題
                    </label>
                    <input
                      type="text"
                      value={gameStatus.maintenanceTitle}
                      onChange={(e) => handleUpdateMessage('maintenanceTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="例如：🎠 遊樂園休息日 🎠"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      休息日訊息
                    </label>
                    <textarea
                      value={gameStatus.maintenanceMessage}
                      onChange={(e) => handleUpdateMessage('maintenanceMessage', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="例如：今日為遊樂園休息日，請明天再來！"
                    />
                  </div>
                </div>
              </div>

              {/* 預覽 */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">預覽效果</h2>
                <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {gameStatus.maintenanceTitle}
                    </h3>
                    <p className="text-lg text-gray-600">
                      {gameStatus.maintenanceMessage}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href="/admin"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← 返回管理後台
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

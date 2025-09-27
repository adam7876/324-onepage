"use client";

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../../firebase/firebaseConfig';
import { getGameStatus, setGameStatus, toggleGameStatus, GameStatus } from '../../../lib/game-status-service';
import { getPasswordConfig, updatePassword, PasswordConfig } from '../../../lib/password-service';
import { getGameSwitchConfig, updateGameSwitch, GameSwitchConfig } from '../../../lib/game-switch-service';

export default function GameStatusPage() {
  const [user, setUser] = useState<User | null>(null);
  const [gameStatus, setGameStatusState] = useState<GameStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [tempTitle, setTempTitle] = useState('');
  const [tempMessage, setTempMessage] = useState('');
  const [tempHint, setTempHint] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [passwordConfig, setPasswordConfig] = useState<PasswordConfig | null>(null);
  const [gameSwitchConfig, setGameSwitchConfig] = useState<GameSwitchConfig | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // 檢查認證狀態並載入遊戲狀態
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // 同時載入所有設定
        try {
          const [status, passwordConfig, gameSwitchConfig] = await Promise.all([
            getGameStatus(),
            getPasswordConfig(),
            getGameSwitchConfig()
          ]);
          
          setGameStatusState(status);
          setTempTitle(status.maintenanceTitle);
          setTempMessage(status.maintenanceMessage);
          setTempHint(status.maintenanceHint);
          
          setPasswordConfig(passwordConfig);
          setGameSwitchConfig(gameSwitchConfig);
        } catch (error) {
          console.error('載入設定失敗:', error);
          setMessage('載入設定失敗');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


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

  // 防抖動存檔函數
  const debouncedSave = (() => {
    let timeoutId: NodeJS.Timeout;
    return (field: 'maintenanceTitle' | 'maintenanceMessage' | 'maintenanceHint', value: string) => {
      clearTimeout(timeoutId);
      setIsEditing(true);
      timeoutId = setTimeout(async () => {
        if (!gameStatus) return;
        
        try {
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
          setIsEditing(false);
        }
      }, 1000); // 1秒後存檔
    };
  })();

  const handleTitleChange = (value: string) => {
    setTempTitle(value);
    debouncedSave('maintenanceTitle', value);
  };

  const handleMessageChange = (value: string) => {
    setTempMessage(value);
    debouncedSave('maintenanceMessage', value);
  };

  const handleHintChange = (value: string) => {
    setTempHint(value);
    debouncedSave('maintenanceHint', value);
  };

  // 更新密碼
  const handlePasswordUpdate = async () => {
    if (!newPassword.trim()) {
      setMessage('請輸入新密碼');
      return;
    }

    setPasswordSaving(true);
    try {
      await updatePassword(newPassword);
      setMessage('密碼更新成功');
      setNewPassword('');
      // 重新載入密碼設定
      const updatedConfig = await getPasswordConfig();
      setPasswordConfig(updatedConfig);
    } catch (error) {
      console.error('更新密碼失敗:', error);
      setMessage('密碼更新失敗');
    } finally {
      setPasswordSaving(false);
    }
  };

  // 更新遊戲開關
  const handleGameSwitchToggle = async (gameType: keyof Omit<GameSwitchConfig, 'lastUpdated'>) => {
    if (!gameSwitchConfig) return;

    try {
      const newValue = !gameSwitchConfig[gameType];
      await updateGameSwitch(gameType, newValue);
      
      // 更新本地狀態
      setGameSwitchConfig({
        ...gameSwitchConfig,
        [gameType]: newValue,
        lastUpdated: new Date(),
      });
      
      setMessage(`${gameType === 'wheel' ? '幸運轉盤' : 
                   gameType === 'rockPaperScissors' ? '猜拳遊戲' : '骰子遊戲'} ${newValue ? '已開啟' : '已關閉'}`);
    } catch (error) {
      console.error('更新遊戲開關失敗:', error);
      setMessage('更新遊戲開關失敗');
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
                    disabled={saving || isEditing}
                    className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                      gameStatus.isOpen
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    } ${(saving || isEditing) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {saving ? '處理中...' : isEditing ? '編輯中...' : gameStatus.isOpen ? '關閉遊戲' : '開啟遊戲'}
                  </button>
                </div>
              </div>

              {/* 密碼管理 */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">🔐 密碼管理</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      目前密碼
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={passwordConfig?.password || ''}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                      <span className="text-sm text-gray-500">
                        最後更新：{passwordConfig?.lastUpdated.toLocaleString('zh-TW')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新密碼
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="輸入新密碼"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handlePasswordUpdate}
                        disabled={passwordSaving || !newPassword.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {passwordSaving ? '更新中...' : '更新密碼'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 個別遊戲開關 */}
              <div className="bg-green-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">🎮 個別遊戲開關</h2>
                <div className="space-y-4">
                  {/* 幸運轉盤 */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">🎡 幸運轉盤</h3>
                      <p className="text-sm text-gray-600">轉動轉盤，停在綠色區域就能獲得獎品</p>
                    </div>
                    <button
                      onClick={() => handleGameSwitchToggle('wheel')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        gameSwitchConfig?.wheel
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {gameSwitchConfig?.wheel ? '關閉' : '開啟'}
                    </button>
                  </div>

                  {/* 猜拳遊戲 */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">✂️ 猜拳遊戲</h3>
                      <p className="text-sm text-gray-600">與電腦猜拳，贏了拿獎品</p>
                    </div>
                    <button
                      onClick={() => handleGameSwitchToggle('rockPaperScissors')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        gameSwitchConfig?.rockPaperScissors
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {gameSwitchConfig?.rockPaperScissors ? '關閉' : '開啟'}
                    </button>
                  </div>

                  {/* 骰子遊戲 */}
                  <div className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div>
                      <h3 className="font-semibold text-gray-800">🎲 骰子遊戲</h3>
                      <p className="text-sm text-gray-600">擲骰子比大小，點數大就贏</p>
                    </div>
                    <button
                      onClick={() => handleGameSwitchToggle('dice')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        gameSwitchConfig?.dice
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {gameSwitchConfig?.dice ? '關閉' : '開啟'}
                    </button>
                  </div>
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
                      value={tempTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="例如：🎠 遊樂園休息日 🎠"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      休息日訊息
                    </label>
                    <textarea
                      value={tempMessage}
                      onChange={(e) => handleMessageChange(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="例如：今日為遊樂園休息日，請下次再來！"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      提示內容
                    </label>
                    <input
                      type="text"
                      value={tempHint}
                      onChange={(e) => handleHintChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="例如：💡 提示：請下次再來遊玩，每次都有新的機會！"
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
                      {tempTitle}
                    </h3>
                    <p className="text-lg text-gray-600 mb-4">
                      {tempMessage}
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-800 text-sm">
                        {tempHint}
                      </p>
                    </div>
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

"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firestore';
import { GAME_CONFIG } from '../../lib/game-config';
import { isValidEmail } from '../../lib/game-utils';
import { getGameStatus, GameStatus } from '../../lib/game-status-service';

interface GameRewardConfig {
  type: 'coupon' | 'discount';
  value: number;
  description: string;
}

export default function GamesPage() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [step, setStep] = useState<'select' | 'email' | 'verify' | 'play'>('select');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [rewardConfig, setRewardConfig] = useState<GameRewardConfig>(GAME_CONFIG.reward);
  const [isPWA, setIsPWA] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // 載入遊戲狀態
  useEffect(() => {
    const loadGameStatus = async () => {
      try {
        const status = await getGameStatus();
        setGameStatus(status);
        console.log('遊戲狀態載入成功:', status);
      } catch (error) {
        console.error('載入遊戲狀態失敗:', error);
        // 使用預設狀態
        setGameStatus({
          isOpen: true,
          maintenanceMessage: '今日為遊樂園休息日，請明天再來！',
          maintenanceTitle: '🎠 遊樂園休息日 🎠',
          maintenanceHint: '💡 提示：請明天再來遊玩，每天都有新的機會！',
          lastUpdated: new Date(),
        });
      } finally {
        setLoadingStatus(false);
      }
    };

    loadGameStatus();
  }, []);

  // 載入獎品配置
  useEffect(() => {
    const loadRewardConfig = async () => {
      try {
        console.log('🔄 開始載入獎品配置...');
        const docRef = doc(db, 'gameConfig', 'reward');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as GameRewardConfig;
          console.log('✅ 從 Firestore 載入獎品配置成功:', data);
          setRewardConfig(data);
        } else {
          console.log('⚠️ Firestore 中沒有獎品配置，使用預設值:', GAME_CONFIG.reward);
          setRewardConfig(GAME_CONFIG.reward);
        }
      } catch (error) {
        console.error('❌ 載入獎品配置失敗:', error);
        console.log('🔄 使用預設配置:', GAME_CONFIG.reward);
        setRewardConfig(GAME_CONFIG.reward);
      }
    };
    
    loadRewardConfig();
  }, []);

  // 偵測 PWA 模式
  useEffect(() => {
    const checkPWA = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      // iOS Safari 特有的 standalone 屬性
      const isInApp = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsPWA(isStandalone || isInApp);
    };
    
    checkPWA();
    window.addEventListener('resize', checkPWA);
    
    return () => window.removeEventListener('resize', checkPWA);
  }, []);

  // 選擇遊戲
  const handleGameSelect = (gameId: string) => {
    setSelectedGame(gameId);
    setStep('email');
  };

  // 發送驗證碼
  const handleSendVerification = async () => {
    if (!isValidEmail(email)) {
      setError('請輸入有效的Email地址');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/games/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

        if (data.success) {
          setMessage(`${data.message}\n\n驗證碼：${data.code}`);
          setStep('verify');
        } else {
        setError(data.message || '發送失敗，請稍後再試');
      }
    } catch {
      setError('發送失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  // 驗證碼確認
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('請輸入6位數驗證碼');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/games/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
          gameType: selectedGame,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 跳轉到獨立遊戲頁面
        const gameUrl = `/play/${selectedGame}?token=${data.data.token}`;
        
        // 檢測是否為移動設備
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
          // 移動設備直接在當前頁面跳轉
          window.location.href = gameUrl;
        } else {
          // 桌面設備開新視窗
          window.open(gameUrl, '_blank', 'noopener,noreferrer');
          
          // 重置狀態
          setStep('select');
          setEmail('');
          setVerificationCode('');
        }
        setSelectedGame('');
        setMessage('遊戲視窗已開啟，請前往遊戲視窗進行遊戲！');
      } else {
        setError(data.message || '驗證失敗，請重試');
      }
    } catch {
      setError('驗證失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const selectedGameInfo = GAME_CONFIG.games.find(g => g.id === selectedGame);

  // 載入中
  if (loadingStatus) {
    return (
      <div className="min-h-screen relative py-12 pb-32 flex items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  // 遊戲關閉時顯示休息日頁面
  if (gameStatus && !gameStatus.isOpen) {
    return (
      <div className="min-h-screen relative py-12 pb-32" style={{ minHeight: '100dvh' }}>
        {/* 背景圖片 */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/backgrounds/games-bg.jpg"
            alt="遊戲背景"
            fill
            className="object-cover"
            priority
          />
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8">
          {/* 休息日標題 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-2xl">
              {gameStatus.maintenanceTitle}
            </h1>
            <p className="text-xl md:text-2xl text-white drop-shadow-xl">
              {gameStatus.maintenanceMessage}
            </p>
          </div>

          {/* 休息日內容 */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
            <div className="text-center">
              <div className="text-8xl mb-6">🎠</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                遊樂園暫時休息
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                我們正在進行維護，請稍後再來遊玩！
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                  {gameStatus.maintenanceHint}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative py-12 pb-32" style={{ minHeight: '100dvh' }}>
      {/* 背景圖片 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/backgrounds/games-bg.jpg"
          alt="遊戲背景"
          fill
          className="object-cover"
          priority
        />
        {/* 移除背景遮罩，保持原圖色彩 */}
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-8">
        {/* 頁面標題 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            324遊樂園🎠
          </h1>
          <p className="text-lg text-gray-800">
            每天一次機會，玩遊戲領回饋金！
          </p>
        </div>

        {/* 遊戲規則說明 */}
        <div className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 遊戲規則</h2>
          <div className={`grid gap-6 ${isPWA ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
            <div>
              <h3 className="font-semibold text-purple-800 mb-2 ">參與方式</h3>
              <ul className="space-y-2 text-gray-900 ">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  每天限玩一次
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  需要Email驗證
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✅</span>
                  獲得折價券可用於購物
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-purple-800 mb-2 ">獎品內容</h3>
              <div className="p-4">
                <div className="text-center">
                  <div className="text-2xl mb-2">🎁</div>
                  <div className="font-bold text-lg text-orange-900 ">
                    {rewardConfig ? rewardConfig.description : '30元折價券'}
                  </div>
                  <div className="text-sm text-orange-800 mt-1 ">
                    獲勝即可獲得
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 訊息顯示 - 只在非驗證碼頁面顯示 */}
        {message && step !== 'verify' && (
          <div className="text-green-800 px-4 py-3 mb-6 ">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="text-red-800 px-4 py-3 mb-6 ">
            ❌ {error}
          </div>
        )}

        {/* 遊戲選擇 */}
        {step === 'select' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center ">
              選擇您想玩的遊戲
            </h2>
            <div className={`grid gap-6 ${isPWA ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {GAME_CONFIG.games.filter(game => game.enabled).map((game) => (
                <div
                  key={game.id}
                  onClick={() => handleGameSelect(game.id)}
                  className="relative bg-white/95 backdrop-blur-sm rounded-xl p-6 cursor-pointer hover:shadow-xl transform hover:scale-105 transition-all overflow-hidden group"
                >
                  {/* 遊戲圖標 */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-16 h-16">
                      <Image
                        src={game.icon}
                        alt={game.name}
                        fill
                        className="object-contain"
                        onError={(e) => {
                          // 如果圖片載入失敗，顯示emoji
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'block';
                          }
                        }}
                      />
                      <div 
                        className="text-4xl text-center w-full h-full flex items-center justify-center hidden"
                        style={{ display: 'none' }}
                      >
                        {game.emoji}
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 text-center text-gray-800">{game.name}</h3>
                  <p className="text-center text-gray-600">{game.description}</p>
                  
                  {/* 裝飾效果 */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email輸入 */}
        {step === 'email' && selectedGameInfo && (
          <div className="p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Image
                  src={selectedGameInfo.icon}
                  alt={selectedGameInfo.name}
                  width={64}
                  height={64}
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">{selectedGameInfo.name}</h2>
              <p className="text-gray-600 mt-2">請輸入您的Email以獲取驗證碼</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email地址
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="請輸入您的Email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  返回選擇
                </button>
                <button
                  onClick={handleSendVerification}
                  disabled={loading || !email}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '發送中...' : '發送驗證碼'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 驗證碼輸入 */}
        {step === 'verify' && selectedGameInfo && (
          <div className="p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Image
                  src={selectedGameInfo.icon}
                  alt={selectedGameInfo.name}
                  width={64}
                  height={64}
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">輸入驗證碼</h2>
              <p className="text-gray-600 mt-2">
                請輸入下方顯示的驗證碼
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  6位數驗證碼
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="請輸入6位數驗證碼"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500 text-center text-lg tracking-widest"
                  disabled={loading}
                  maxLength={6}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep('email')}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  返回修改
                </button>
                <button
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '驗證中...' : '開始遊戲'}
                </button>
              </div>
            </div>

            {/* 驗證碼顯示在下方 */}
            {message && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-green-700 mb-2">您的驗證碼：</div>
                  <div className="text-2xl font-bold text-green-800 tracking-widest">
                    {message.split('驗證碼：')[1]}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={handleSendVerification}
                disabled={loading}
                className="text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50"
              >
                重新發送驗證碼
              </button>
            </div>
          </div>
        )}

      </div>
      </div>
  );
}
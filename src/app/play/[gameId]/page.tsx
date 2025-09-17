"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { GAME_CONFIG } from '../../../lib/game-config';
import WheelGame from '../../../components/games/WheelGame';
import DiceGame from '../../../components/games/DiceGame';
import ScratchGame from '../../../components/games/ScratchGame';
import RockPaperScissorsGame from '../../../components/games/RockPaperScissorsGame';
import DiceBattleGame from '../../../components/games/DiceBattleGame';
import type { GameResult } from '../../../lib/game-types';

export default function PlayGamePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const gameId = params.gameId as string;
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gameData, setGameData] = useState<{email: string; gameType: string; createdAt: Date; expiresAt: Date} | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // 驗證token和遊戲類型
  useEffect(() => {
    const validateAccess = async () => {
      // 檢查參數
      if (!gameId || !token) {
        setError('遊戲連結無效');
        setLoading(false);
        return;
      }

      // 檢查遊戲類型
      const game = GAME_CONFIG.games.find(g => g.id === gameId && g.enabled);
      if (!game) {
        setError('遊戲不存在或已停用');
        setLoading(false);
        return;
      }

      try {
        // 驗證token
        const response = await fetch('/api/games/validate-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, gameType: gameId }),
        });

        const data = await response.json();

        if (data.success) {
          setGameData(data.data);
          setLoading(false);
        } else {
          setError(data.message || 'Token驗證失敗');
          setLoading(false);
        }
      } catch {
        setError('連接失敗，請重試');
        setLoading(false);
      }
    };

    validateAccess();
  }, [gameId, token]);

  // 處理遊戲完成
  const handleGameComplete = async (result: GameResult) => {
    setGameResult(result);

    // 提交遊戲結果到後端
    try {
      await fetch('/api/games/submit-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          gameType: gameId,
          result,
        }),
      });
    } catch (error) {
      console.error('提交遊戲結果失敗:', error);
    }
  };

  // 渲染遊戲元件
  const renderGame = () => {
    if (!gameData) return null;

    switch (gameId) {
      case 'wheel':
        return <WheelGame onComplete={handleGameComplete} />;
      case 'dice':
        return <DiceGame onComplete={handleGameComplete} />;
      case 'scratch':
        return <ScratchGame onComplete={handleGameComplete} />;
      case 'rock-paper-scissors':
        return <RockPaperScissorsGame 
          token={token || ''} 
          onComplete={(result, reward) => {
            const gameResult = {
              success: true,
              result,
              reward: reward ? {
                type: 'coupon' as const,
                name: reward.name,
                value: reward.value,
                code: `GAME${Date.now()}`
              } : undefined,
              message: result === 'win' ? '恭喜獲獎！' : '感謝參與！'
            };
            handleGameComplete(gameResult);
          }} 
        />;
      case 'dice-battle':
        return <DiceBattleGame 
          token={token || ''} 
          onComplete={(result, reward) => {
            const gameResult = {
              success: true,
              result,
              reward: reward ? {
                type: 'coupon' as const,
                name: reward.name,
                value: reward.value,
                code: `GAME${Date.now()}`
              } : undefined,
              message: result === 'win' ? '恭喜獲獎！' : '感謝參與！'
            };
            handleGameComplete(gameResult);
          }}
        />;
      default:
        return <div>未知的遊戲類型</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-900 drop-shadow-lg">
          <div className="text-4xl mb-4">🎮</div>
          <div className="text-xl">載入遊戲中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-900 drop-shadow-lg">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl mb-4">{error}</div>
          <div className="text-sm">
            請返回遊戲中心重新開始
          </div>
        </div>
      </div>
    );
  }

  if (gameResult) {
    const currentDateTime = new Date().toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 max-w-md w-full text-center">
          {gameResult.result === 'win' ? (
            <div>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-700 mb-4 drop-shadow-md">
                恭喜中獎！
              </h2>
              
              {/* 獎品顯示區域 - 供截圖使用 */}
              <div className="bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-orange-300 rounded-xl p-6 mb-6 shadow-lg">
                <div className="text-orange-600 text-sm font-medium mb-2">
                  324遊樂園🎠 中獎證明
                </div>
                <div className="text-orange-900 font-bold text-xl mb-3">
                  {gameResult.reward?.name || '回饋金'}
                </div>
                <div className="text-orange-700 text-lg font-semibold mb-3">
                  恭喜獲得獎品！
                </div>
                <div className="border-t border-orange-300 pt-3">
                  <div className="text-orange-600 text-sm">
                    中獎時間：{currentDateTime}
                  </div>
                </div>
              </div>

              {/* 截圖提示 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-blue-800 font-semibold mb-2">
                  📸 請截圖保存此頁面
                </div>
                <div className="text-blue-700 text-sm">
                  請對此頁面進行截圖並保存<br/>
                  購物時出示截圖即可享有優惠<br/>
                  ※ 每張截圖僅限使用一次
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-4 drop-shadow-md">
                很遺憾！
              </h2>
              <p className="text-gray-600 mb-6">
                這次沒有中獎，明天再來試試運氣吧！
              </p>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-4">
            遊戲結束，可以關閉此視窗了
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 遊戲標題 - 已移除，讓遊戲組件自己處理 */}

      {/* 遊戲內容 */}
      <div className="container mx-auto px-4">
        {renderGame()}
      </div>
    </div>
  );
}

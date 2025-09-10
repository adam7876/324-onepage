"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { GAME_CONFIG } from '../../../lib/game-config';
import WheelGame from '../../../components/games/WheelGame';
import DiceGame from '../../../components/games/DiceGame';
import ScratchGame from '../../../components/games/ScratchGame';
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
      default:
        return <div>未知的遊戲類型</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">🎮</div>
          <div className="text-xl">載入遊戲中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 to-pink-400">
        <div className="text-center text-white">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-xl mb-4">{error}</div>
          <div className="text-sm opacity-75">
            請返回遊戲中心重新開始
          </div>
        </div>
      </div>
    );
  }

  if (gameResult) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 to-pink-400 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          {gameResult.result === 'win' ? (
            <div>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                恭喜中獎！
              </h2>
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-semibold text-lg">
                  {gameResult.reward?.name}
                </p>
                {gameResult.reward?.code && (
                  <div className="mt-3">
                    <p className="text-sm text-green-700 mb-2">優惠券代碼：</p>
                    <div className="bg-white border border-green-300 rounded px-3 py-2 font-mono text-lg">
                      {gameResult.reward.code}
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(gameResult.reward!.code)}
                      className="mt-2 text-sm text-green-600 hover:text-green-700"
                    >
                      點擊複製代碼
                    </button>
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-sm">
                請保存好您的優惠券代碼，可在購物時使用！
              </p>
            </div>
          ) : (
            <div>
              <div className="text-6xl mb-4">😔</div>
              <h2 className="text-2xl font-bold text-gray-600 mb-4">
                很可惜，沒有中獎
              </h2>
              <p className="text-gray-600">
                謝謝您的參與，明天再來試試運氣吧！
              </p>
            </div>
          )}
          
          <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
            遊戲結束，可以關閉此視窗了
          </div>
        </div>
      </div>
    );
  }

  const gameInfo = GAME_CONFIG.games.find(g => g.id === gameId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-400">
      {/* 遊戲標題 */}
      <div className="text-center py-8 text-white">
        <div className="text-4xl mb-2">{gameInfo?.emoji}</div>
        <h1 className="text-2xl font-bold">{gameInfo?.name}</h1>
        <p className="opacity-90">{gameInfo?.description}</p>
      </div>

      {/* 遊戲內容 */}
      <div className="container mx-auto px-4">
        {renderGame()}
      </div>
    </div>
  );
}

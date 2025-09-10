"use client";

import { useState } from 'react';
import { drawReward } from '../../lib/game-utils';
import type { GameResult } from '../../lib/game-types';

interface DiceGameProps {
  onComplete: (result: GameResult) => void;
}

export default function DiceGame({ onComplete }: DiceGameProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [dice1, setDice1] = useState(1);
  const [dice2, setDice2] = useState(1);
  const [showResult, setShowResult] = useState(false);

  const dicefaces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  const handleRoll = async () => {
    if (isRolling || hasPlayed) return;

    setIsRolling(true);
    setShowResult(false);
    
    // 骰子滾動動畫
    const rollInterval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
    }, 100);

    // 2秒後停止滾動
    setTimeout(() => {
      clearInterval(rollInterval);
      
      // 抽獎決定結果
      const reward = drawReward();
      
      // 根據結果設定骰子點數
      let finalDice1, finalDice2;
      
      if (reward.type === 'coupon') {
        // 中獎：顯示雙6
        finalDice1 = 6;
        finalDice2 = 6;
      } else {
        // 未中獎：隨機但不是雙6
        do {
          finalDice1 = Math.floor(Math.random() * 6) + 1;
          finalDice2 = Math.floor(Math.random() * 6) + 1;
        } while (finalDice1 === 6 && finalDice2 === 6);
      }

      setDice1(finalDice1);
      setDice2(finalDice2);
      setIsRolling(false);
      setShowResult(true);
      setHasPlayed(true);

      // 準備結果
      const result: GameResult = {
        success: true,
        result: reward.type === 'coupon' ? 'win' : 'lose',
        message: reward.type === 'coupon' ? '雙6！恭喜中獎！' : '很可惜，沒有雙6',
      };

      if (reward.type === 'coupon') {
        result.reward = {
          type: 'coupon',
          name: reward.name,
          value: reward.value,
          code: '', // 將在後端生成
        };
      }

      // 延遲一下讓用戶看清結果
      setTimeout(() => {
        onComplete(result);
      }, 2000);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px]">
      {/* 遊戲說明 */}
      <div className="text-center mb-8 text-white">
        <h2 className="text-2xl font-bold mb-4">🎲 幸運骰子</h2>
        <p className="text-lg opacity-90">擲出雙6獲得大獎！</p>
      </div>

      {/* 骰子容器 */}
      <div className="flex gap-8 mb-8">
        {/* 骰子1 */}
        <div className={`w-32 h-32 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-6xl transition-transform duration-100 ${
          isRolling ? 'animate-bounce' : 'hover:scale-105'
        }`}>
          {dicefaces[dice1 - 1]}
        </div>

        {/* 骰子2 */}
        <div className={`w-32 h-32 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-6xl transition-transform duration-100 ${
          isRolling ? 'animate-bounce' : 'hover:scale-105'
        }`}>
          {dicefaces[dice2 - 1]}
        </div>
      </div>

      {/* 結果顯示 */}
      {showResult && (
        <div className="text-center mb-6">
          <div className="text-white text-2xl font-bold">
            {dice1 === 6 && dice2 === 6 ? (
              <div className="text-yellow-300">
                🎉 雙6！恭喜中獎！🎉
              </div>
            ) : (
              <div>
                點數：{dice1} + {dice2} = {dice1 + dice2}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 開始按鈕 */}
      <button
        onClick={handleRoll}
        disabled={isRolling || hasPlayed}
        className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isRolling ? '🎲 擲骰中...' : hasPlayed ? '✅ 已完成' : '🎮 擲骰子！'}
      </button>

      {/* 規則說明 */}
      <div className="mt-8 text-center text-white opacity-75">
        <p className="text-sm">擲出雙6（⚅⚅）即可獲得獎品</p>
        <p className="text-xs mt-1">其他點數組合為謝謝參與</p>
      </div>
    </div>
  );
}

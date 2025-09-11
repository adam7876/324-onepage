"use client";

import { useState } from 'react';
import { drawReward } from '../../lib/game-utils';
import { GAME_CONFIG } from '../../lib/game-config';
import type { GameResult } from '../../lib/game-types';

interface WheelGameProps {
  onComplete: (result: GameResult) => void;
}

export default function WheelGame({ onComplete }: WheelGameProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [rotation, setRotation] = useState(0);

  const handleSpin = async () => {
    if (isSpinning || hasPlayed) return;

    setIsSpinning(true);
    
    // 抽獎決定結果
    const reward = drawReward();
    
    // 由於已簡化為單一獎品，直接設定結果
    const segments = 6; // 固定6個區域
    const segmentAngle = 360 / segments;
    const rewardIndex = reward.type === 'coupon' ? 0 : 1; // 獎品在第一個位置
    
    // 計算目標角度（多轉幾圈增加視覺效果）
    const extraSpins = 5; // 額外轉5圈
    const targetAngle = extraSpins * 360 + (rewardIndex * segmentAngle) + (segmentAngle / 2);
    
    setRotation(prev => prev + targetAngle);

    // 等待動畫完成
    setTimeout(() => {
      setIsSpinning(false);
      setHasPlayed(true);

      // 準備結果
      const result: GameResult = {
        success: true,
        result: reward.type === 'coupon' ? 'win' : 'lose',
        message: reward.type === 'coupon' ? '恭喜中獎！' : '謝謝參與！',
      };

      if (reward.type === 'coupon') {
        result.reward = {
          type: 'coupon',
          name: reward.description || '獎品',
          value: reward.value,
          code: '', // 將在後端生成
        };
      }

      // 延遲一下讓用戶看清結果
      setTimeout(() => {
        onComplete(result);
      }, 1500);
    }, 3000); // 3秒轉盤動畫
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px]">
      {/* 轉盤容器 */}
      <div className="relative mb-8">
        {/* 指針 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-b-[40px] border-transparent border-b-red-500 drop-shadow-lg"></div>
        </div>

        {/* 轉盤 */}
        <div 
          className={`w-80 h-80 rounded-full relative overflow-hidden border-8 border-white shadow-2xl transition-transform duration-3000 ease-out ${
            isSpinning ? 'animate-spin-slow' : ''
          }`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '3s' : '0s'
          }}
        >
          {/* 轉盤區域 */}
          {[
            { type: 'coupon', description: GAME_CONFIG.reward.description, value: GAME_CONFIG.reward.value, probability: 0.5 },
            { type: 'none', description: '謝謝參與', value: 0, probability: 0.5 },
            { type: 'coupon', description: GAME_CONFIG.reward.description, value: GAME_CONFIG.reward.value, probability: 0.5 },
            { type: 'none', description: '謝謝參與', value: 0, probability: 0.5 },
            { type: 'coupon', description: GAME_CONFIG.reward.description, value: GAME_CONFIG.reward.value, probability: 0.5 },
            { type: 'none', description: '謝謝參與', value: 0, probability: 0.5 },
          ].map((reward, index) => {
            const segmentAngle = 360 / 6;
            const startAngle = index * segmentAngle;
            
            // 顏色配置
            const colors = [
              'bg-gradient-to-br from-yellow-400 to-yellow-600',
              'bg-gradient-to-br from-green-400 to-green-600', 
              'bg-gradient-to-br from-blue-400 to-blue-600',
              'bg-gradient-to-br from-purple-400 to-purple-600',
              'bg-gradient-to-br from-gray-400 to-gray-600',
            ];

            return (
              <div
                key={index}
                className={`absolute w-full h-full ${colors[index % colors.length]}`}
                style={{
                  clipPath: `polygon(50% 50%, ${
                    50 + 50 * Math.cos((startAngle - 90) * Math.PI / 180)
                  }% ${
                    50 + 50 * Math.sin((startAngle - 90) * Math.PI / 180)
                  }%, ${
                    50 + 50 * Math.cos((startAngle + segmentAngle - 90) * Math.PI / 180)
                  }% ${
                    50 + 50 * Math.sin((startAngle + segmentAngle - 90) * Math.PI / 180)
                  }%)`
                }}
              >
                {/* 獎品文字 */}
                <div 
                  className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm text-center"
                  style={{
                    transform: `rotate(${startAngle + segmentAngle / 2}deg)`,
                    transformOrigin: '50% 50%'
                  }}
                >
                  <div className="transform -translate-y-16">
                    <div className="text-xl mb-1">
                      {reward.type === 'coupon' ? '🎁' : '😔'}
                    </div>
                    <div className="text-xs leading-tight">
                      {reward.description || '獎品'}
                    </div>
                    {reward.type === 'coupon' && (
                      <div className="text-xs opacity-90">
                        {(reward.probability * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 中心圓圈 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center text-2xl font-bold text-gray-700 shadow-lg">
            🎯
          </div>
        </div>
      </div>

      {/* 開始按鈕 */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || hasPlayed}
        className="px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isSpinning ? '🎲 轉動中...' : hasPlayed ? '✅ 已完成' : '🎮 開始轉盤！'}
      </button>

      {/* 說明文字 */}
      <div className="mt-6 text-center text-white opacity-90">
        <p className="text-lg">點擊按鈕轉動轉盤</p>
        <p className="text-sm">看看您的運氣如何！</p>
      </div>
    </div>
  );
}

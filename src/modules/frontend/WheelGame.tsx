"use client";

import { useState } from 'react';
import { formatRewardDescription } from '@/lib/game-utils';

interface WheelGameProps {
  onComplete: (result: { success: boolean; result: 'win' | 'lose'; reward?: { type: 'coupon' | 'discount' | 'freeShipping'; name: string; value: number; code: string }; message: string }) => Promise<void>;
  rewardConfig?: {
    type: 'coupon' | 'discount' | 'freeShipping';
    value: number;
    description: string;
  };
}

export default function WheelGame({ onComplete, rewardConfig }: WheelGameProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  // 三戰兩勝狀態
  const [playerWins, setPlayerWins] = useState(0);
  const [aixiWins, setAixiWins] = useState(0);
  const [round, setRound] = useState(1);
  const [finalMessage, setFinalMessage] = useState<string | null>(null);

  // 固定轉盤配置 - 8格，交替成功失敗
  const sections = [
    { angle: 0, type: 'win', color: '#F5F5DC' },     // 12點方向 - 玩家勝（米色）
    { angle: 45, type: 'lose', color: '#801815' },   // 1:30方向 - 艾希勝（酒紅色）
    { angle: 90, type: 'win', color: '#F5F5DC' },    // 3點方向 - 玩家勝（米色）
    { angle: 135, type: 'lose', color: '#801815' },  // 4:30方向 - 艾希勝
    { angle: 180, type: 'win', color: '#F5F5DC' },   // 6點方向 - 玩家勝（米色）
    { angle: 225, type: 'lose', color: '#801815' },  // 7:30方向 - 艾希勝
    { angle: 270, type: 'win', color: '#F5F5DC' },   // 9點方向 - 玩家勝（米色）
    { angle: 315, type: 'lose', color: '#801815' },  // 10:30方向 - 艾希勝
  ];

  // 根據指針角度判斷結果
  const getResultByAngle = (angle: number) => {
    // 正規化角度到 0-360 範圍
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    // 找到最接近的區塊
    for (let i = 0; i < sections.length; i++) {
      const currentSection = sections[i];
      const nextSection = sections[(i + 1) % sections.length];
      
      // 處理跨越 0 度的情況
      if (currentSection.angle > nextSection.angle) {
        if (normalizedAngle >= currentSection.angle || normalizedAngle < nextSection.angle) {
          return currentSection;
        }
      } else {
        if (normalizedAngle >= currentSection.angle && normalizedAngle < nextSection.angle) {
          return currentSection;
        }
      }
    }
    
    // 預設返回第一個區塊
    return sections[0];
  };

  const startSpin = () => {
    if (isSpinning) return;
    // 若系列賽已結束則不再旋轉
    if (playerWins >= 2 || aixiWins >= 2) return;
    
    console.log('🎡 開始旋轉指針');
    setIsSpinning(true);
    
    // 隨機選擇指針角度
    const randomAngle = Math.random() * 360; // 0~360 隨機停點
    const extraSpins = 5 + Math.floor(Math.random() * 6); // 5~10 整數圈，避免分數圈視覺誤差
    const finalAngle = (extraSpins * 360) + randomAngle;
    console.log('🎡 extraSpins(whole):', extraSpins, 'randomAngle:', randomAngle.toFixed(2), 'finalAngle:', finalAngle.toFixed(2), 'finalAngle%360:', (finalAngle % 360).toFixed(2));
    
    // 根據最終角度判斷結果
    const resultSection = getResultByAngle(finalAngle);
    
    console.log('🎡 隨機角度:', randomAngle);
    console.log('🎡 最終角度:', finalAngle);
    console.log('🎡 指針指向區塊:', resultSection);
    console.log('🎡 預期結果:', resultSection.type);
    console.log('🎡 預期顏色:', resultSection.color);
    
    // 設置 CSS 變數
    document.documentElement.style.setProperty('--final-rotation', `${finalAngle}deg`);
    
    // 7 秒後動畫完成 - 與 CSS 動畫完全同步
    setTimeout(() => {
      
      // 使用預先計算的結果
      const result = resultSection.type as 'win' | 'lose';
      
      // 更新局數比分
      if (result === 'win') {
        setPlayerWins(prev => prev + 1);
      } else {
        setAixiWins(prev => prev + 1);
      }
      setRound(prev => prev + 1);

      const playerWillWinSeries = result === 'win' && playerWins + 1 >= 2;
      const aixiWillWinSeries = result === 'lose' && aixiWins + 1 >= 2;

      // 系列賽結束時顯示結果並延遲約 2.5 秒再跳轉
      if (playerWillWinSeries || aixiWillWinSeries) {
        const finalIsWin = playerWillWinSeries;
        const message = finalIsWin
          ? `系列賽結束：你 2 勝，獲得 ${formatRewardDescription(rewardConfig?.type ?? 'coupon', rewardConfig?.value || 0)}！`
          : '系列賽結束：艾希 2 勝，這次沒領到獎勵，期待下次更棒的結果 ❤️';
        setFinalMessage(message);
        setTimeout(async () => {
          const gameResult = {
            success: true,
            result: finalIsWin ? 'win' as const : 'lose' as const,
            reward: finalIsWin ? {
              type: (rewardConfig?.type ?? 'coupon') as 'coupon' | 'discount' | 'freeShipping',
              name: formatRewardDescription(rewardConfig?.type ?? 'coupon', rewardConfig?.value || 0),
              value: rewardConfig?.value || 0,
              code: `WHEEL-${Date.now()}`
            } : undefined,
            message
          };
          await onComplete(gameResult);
          // 在跳轉前最後一刻移除動畫 class，避免視覺跳動
          setIsSpinning(false);
        }, 2500);
      } else {
        // 非系列賽結束：稍後再移除動畫 class，避免動畫結束瞬間的來源切換造成「再轉一下」視覺
        setTimeout(() => {
          setIsSpinning(false);
        }, 400);
      }
    }, 7000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🎡 幸運轉盤</h2>
        <div className="mb-6 p-4 bg-white/80 rounded-lg shadow-lg">
          <p className="text-lg font-bold text-gray-800 mb-2">第 {round} 回合</p>
          <div className="flex justify-center space-x-8">
            <div className="text-center">
              <p className="text-sm text-gray-600">你</p>
              <p className="text-2xl font-bold text-blue-600">{playerWins}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">艾希</p>
              <p className="text-2xl font-bold text-red-600">{aixiWins}</p>
            </div>
          </div>
        </div>
        
        <div className="relative flex justify-center">
          {/* 固定轉盤 */}
          <div className="w-80 h-80 relative">
            {/* 使用 conic-gradient 創建固定轉盤 */}
            <div 
              className="w-full h-full rounded-full border-8 border-gray-800 shadow-2xl"
              style={{
                background: `conic-gradient(
                  ${sections[0].color} 0deg 45deg,
                  ${sections[1].color} 45deg 90deg,
                  ${sections[2].color} 90deg 135deg,
                  ${sections[3].color} 135deg 180deg,
                  ${sections[4].color} 180deg 225deg,
                  ${sections[5].color} 225deg 270deg,
                  ${sections[6].color} 270deg 315deg,
                  ${sections[7].color} 315deg 360deg
                )`
              }}
            />
            
            {/* 中心圓圈 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border-2 border-white shadow-lg z-10">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
            </div>
            
            {/* 旋轉指針 - 從中心向外 */}
            <div 
              className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none ${isSpinning ? 'pointer-spinning' : ''}`}
              style={{
                transformOrigin: 'center center',
                transform: 'translate(-50%, -50%) rotate(var(--final-rotation, 0deg))'
              }}
            >
              <div className="relative">
                {/* 指針主體 - 長而尖的白色指針，底部在圓心，尖端朝外 */}
                <div 
                  className="absolute"
                  style={{
                    width: '0',
                    height: '0',
                    borderLeft: '5.6px solid transparent',
                    borderRight: '5.6px solid transparent',
                    borderTop: '98px solid white',
                    transform: 'translate(-50%, 0%)',
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          {isSpinning ? (
            <div className="text-xl font-bold text-purple-600 animate-pulse">
              🎯 轉動中...
              <div className="text-sm text-gray-600 mt-2">請稍候，結果即將揭曉...</div>
            </div>
          ) : (
            <button
              onClick={startSpin}
              disabled={isSpinning}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-6 rounded-full text-lg hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🎯 開始下一局
            </button>
          )}
        </div>

        {finalMessage && (
          <div className="mt-4 text-gray-800 font-semibold">{finalMessage}</div>
        )}
        
        {/* 圖例 - 適中大小 */}
        <div className="mt-6 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded shadow-md" style={{ backgroundColor: '#F5F5DC' }}></div>
            <span className="text-sm font-medium text-gray-700">米色 = 你勝 (50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded shadow-md" style={{ backgroundColor: '#801815' }}></div>
            <span className="text-sm font-medium text-gray-700">酒紅 = 艾希勝 (50%)</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .pointer-spinning {
          animation: spin 7s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards;
          animation-fill-mode: forwards;
          animation-iteration-count: 1;
        }
        
        /* 移除 finished 類別以避免二次套用 transform 造成跳動 */
        
        @keyframes spin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--final-rotation, 1800deg));
          }
        }
      `}</style>
    </div>
  );
}
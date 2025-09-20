"use client";

import { useState } from 'react';

interface WheelGameProps {
  onComplete: (result: { success: boolean; result: 'win' | 'lose'; reward?: { type: 'coupon'; name: string; value: number; code: string }; message: string }) => Promise<void>;
  rewardConfig?: {
    type: 'coupon' | 'discount';
    value: number;
    description: string;
  };
}

export default function WheelGame({ onComplete, rewardConfig }: WheelGameProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [pointerAngle, setPointerAngle] = useState(0);

  // 固定轉盤配置 - 8格，交替成功失敗
  const sections = [
    { angle: 0, type: 'win', color: '#FF8C00' },     // 12點方向 - 成功
    { angle: 45, type: 'lose', color: '#FF69B4' },   // 1:30方向 - 失敗
    { angle: 90, type: 'win', color: '#FF8C00' },    // 3點方向 - 成功
    { angle: 135, type: 'lose', color: '#FF69B4' },  // 4:30方向 - 失敗
    { angle: 180, type: 'win', color: '#FF8C00' },   // 6點方向 - 成功
    { angle: 225, type: 'lose', color: '#FF69B4' },  // 7:30方向 - 失敗
    { angle: 270, type: 'win', color: '#FF8C00' },   // 9點方向 - 成功
    { angle: 315, type: 'lose', color: '#FF69B4' },  // 10:30方向 - 失敗
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
    
    console.log('🎡 開始旋轉指針');
    setIsSpinning(true);
    
    // 隨機選擇指針角度
    const randomAngle = Math.random() * 360;
    const extraSpins = 5 + Math.random() * 5; // 5-10 圈
    const finalAngle = (extraSpins * 360) + randomAngle;
    
    // 根據最終角度判斷結果
    const resultSection = getResultByAngle(finalAngle);
    
    console.log('🎡 隨機角度:', randomAngle);
    console.log('🎡 最終角度:', finalAngle);
    console.log('🎡 指針指向區塊:', resultSection);
    console.log('🎡 預期結果:', resultSection.type);
    console.log('🎡 預期顏色:', resultSection.color);
    
    // 保存指針角度
    setPointerAngle(finalAngle);
    
    // 設置 CSS 變數
    document.documentElement.style.setProperty('--final-rotation', `${finalAngle}deg`);
    
    // 6.8 秒後停止 - 比 CSS 動畫稍早，避免二次轉動
    setTimeout(() => {
      setIsSpinning(false);
      
      // 使用預先計算的結果
      const result = resultSection.type as 'win' | 'lose';
      
      // 延遲 2 秒後顯示結果
      setTimeout(async () => {
        const gameResult = {
          success: true,
          result,
          reward: result === 'win' ? {
            type: 'coupon' as const,
            name: rewardConfig?.description || '回饋金',
            value: rewardConfig?.value || 0,
            code: `WHEEL-${Date.now()}`
          } : undefined,
          message: result === 'win' ? `恭喜中獎！獲得 ${rewardConfig?.description || '回饋金'}！` : '很遺憾，這次沒有中獎。'
        };
        await onComplete(gameResult);
      }, 2000);
    }, 6800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">🎡 幸運轉盤</h2>
        
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
                transform: isSpinning ? 'translate(-50%, -50%)' : `translate(-50%, -50%) rotate(${pointerAngle}deg)`,
                transformOrigin: 'center center'
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
              🎯 開始轉動
            </button>
          )}
        </div>
        
        {/* 圖例 - 適中大小 */}
        <div className="mt-6 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded shadow-md" style={{ backgroundColor: '#FF8C00' }}></div>
            <span className="text-sm font-medium text-gray-700">橙色 = 成功 (50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded shadow-md" style={{ backgroundColor: '#FF69B4' }}></div>
            <span className="text-sm font-medium text-gray-700">亮粉色 = 失敗 (50%)</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .pointer-spinning {
          animation: spin 7s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          animation-fill-mode: forwards;
          animation-iteration-count: 1;
        }
        
        @keyframes spin {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          70% {
            transform: translate(-50%, -50%) rotate(calc(var(--final-rotation, 1800deg) * 0.8));
          }
          100% {
            transform: translate(-50%, -50%) rotate(var(--final-rotation, 1800deg));
          }
        }
      `}</style>
    </div>
  );
}
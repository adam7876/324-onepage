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
  const [finalRotation, setFinalRotation] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // 最簡單的配置 - 8格，交替成功失敗
  const sections = [
    { index: 0, type: 'win', color: '#FF8C00' },   // 成功
    { index: 1, type: 'lose', color: '#FF69B4' },  // 失敗
    { index: 2, type: 'win', color: '#FF8C00' },   // 成功
    { index: 3, type: 'lose', color: '#FF69B4' },  // 失敗
    { index: 4, type: 'win', color: '#FF8C00' },   // 成功
    { index: 5, type: 'lose', color: '#FF69B4' },  // 失敗
    { index: 6, type: 'win', color: '#FF8C00' },   // 成功
    { index: 7, type: 'lose', color: '#FF69B4' },  // 失敗
  ];

  const startSpin = () => {
    if (isSpinning) return;
    
    console.log('🎡 開始旋轉轉盤');
    setIsSpinning(true);
    
    // 1. 先隨機選擇目標索引
    const targetIndex = Math.floor(Math.random() * 8);
    const targetSection = sections[targetIndex];
    
    // 2. 計算轉盤需要旋轉的角度
    // 每格45度，指針在12點方向，轉盤順時針旋轉
    const targetAngle = targetIndex * 45; // 0, 45, 90, 135, 180, 225, 270, 315
    const extraSpins = 5 + Math.random() * 5; // 5-10 圈
    const finalRotation = (extraSpins * 360) + targetAngle;
    
    console.log('🎡 目標索引:', targetIndex);
    console.log('🎡 目標角度:', targetAngle);
    console.log('🎡 最終旋轉角度:', finalRotation);
    console.log('🎡 預期結果:', targetSection.type);
    console.log('🎡 預期顏色:', targetSection.color);
    
    // 保存結果
    setSelectedIndex(targetIndex);
    setFinalRotation(finalRotation);
    
    // 設置 CSS 變數
    document.documentElement.style.setProperty('--final-rotation', `${finalRotation}deg`);
    
    // 4 秒後停止
    setTimeout(() => {
      setIsSpinning(false);
      
      // 2 秒後顯示結果
      setTimeout(async () => {
        const result = targetSection.type as 'win' | 'lose';
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
    }, 4000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">🎡 幸運轉盤</h2>
        
        <div className="relative flex justify-center">
          {/* 最簡單的轉盤設計 */}
          <div className="relative">
            <div 
              className={`w-80 h-80 rounded-full border-8 border-gray-800 relative overflow-hidden shadow-2xl ${isSpinning ? 'wheel-spinning' : ''}`}
              style={{ 
                transformOrigin: 'center center',
                transform: isSpinning ? 'none' : `rotate(${finalRotation}deg)`
              }}
            >
              {/* 使用 conic-gradient 創建轉盤 */}
              <div 
                className="w-full h-full"
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
              
              {/* 標籤 - 簡單直接 */}
              {sections.map((section, index) => {
                const angle = index * 45 + 22.5; // 每格中心角度
                const radians = (angle * Math.PI) / 180;
                const radius = 100;
                const x = 50 + (radius * Math.sin(radians)) / 3.2;
                const y = 50 - (radius * Math.cos(radians)) / 3.2;
                
                return (
                  <div
                    key={index}
                    className="absolute text-white font-bold text-sm pointer-events-none"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      zIndex: 20
                    }}
                  >
                    <div>索引{index}</div>
                    <div className="text-xs">{section.type === 'win' ? '勝' : '敗'}</div>
                  </div>
                );
              })}
              
              {/* 中心圓圈 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border-2 border-white shadow-lg z-10">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            
            {/* 固定指針 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <div 
                className="absolute"
                style={{
                  width: '0',
                  height: '0',
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderTop: '120px solid white',
                  transform: 'translate(-50%, -100%)',
                  filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                }}
              />
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          {isSpinning ? (
            <div className="text-xl font-bold text-purple-600 animate-pulse">
              🎯 轉動中...
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
        
        {/* 圖例 */}
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
        .wheel-spinning {
          animation: spin 4s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards;
          animation-fill-mode: forwards;
          animation-iteration-count: 1;
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(var(--final-rotation, 1800deg));
          }
        }
      `}</style>
    </div>
  );
}
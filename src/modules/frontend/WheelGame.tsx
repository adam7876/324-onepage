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
  const [animationKey, setAnimationKey] = useState(0);

  // 轉盤配置 - 8格，4格成功4格失敗，深紅色失敗，黃色成功
  const wheelSections = [
    { id: 1, type: 'lose', color: '#8B0000', label: '失敗' },   // 深紅色 - 失敗
    { id: 2, type: 'win', color: '#FFD700', label: '成功' },    // 黃色 - 成功
    { id: 3, type: 'lose', color: '#8B0000', label: '失敗' },   // 深紅色 - 失敗
    { id: 4, type: 'win', color: '#FFD700', label: '成功' },    // 黃色 - 成功
    { id: 5, type: 'lose', color: '#8B0000', label: '失敗' },   // 深紅色 - 失敗
    { id: 6, type: 'win', color: '#FFD700', label: '成功' },    // 黃色 - 成功
    { id: 7, type: 'lose', color: '#8B0000', label: '失敗' },   // 深紅色 - 失敗
    { id: 8, type: 'win', color: '#FFD700', label: '成功' },    // 黃色 - 成功
  ];

  const startSpin = () => {
    if (isSpinning) return;
    
    console.log('🎡 開始旋轉轉盤');
    setIsSpinning(true);
    
    // 計算精確停格角度 - 確保停在格子中心
    const extraSpins = 5 + Math.random() * 5; // 5-10 圈
    const sectionCenters = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5]; // 每格中心角度
    const randomSection = Math.floor(Math.random() * 8);
    const targetAngle = sectionCenters[randomSection];
    const finalRotation = (extraSpins * 360) + (360 - targetAngle); // 反向計算，讓指針指向目標
    
    console.log('🎡 旋轉角度:', finalRotation);
    console.log('🎡 目標格子:', randomSection, '結果:', wheelSections[randomSection].type);
    
    // 設置 CSS 變數用於動畫
    document.documentElement.style.setProperty('--final-rotation', `${finalRotation}deg`);
    
    // 強制重新渲染動畫
    setAnimationKey(prev => prev + 1);
    
    // 3 秒後停止並判斷結果
    setTimeout(() => {
      setIsSpinning(false);
      
      // 使用預先計算的結果
      const result = wheelSections[randomSection].type as 'win' | 'lose';
      
      // 延遲 3 秒後顯示結果，讓用戶有時間看到結果
      setTimeout(async () => {
        const gameResult = {
          success: true,
          result,
          reward: result === 'win' ? {
            type: 'coupon' as const,
            name: rewardConfig?.description || '獎品',
            value: rewardConfig?.value || 0,
            code: `WHEEL-${Date.now()}`
          } : undefined,
          message: result === 'win' ? `恭喜中獎！獲得 ${rewardConfig?.description || '獎品'}！` : '很遺憾，這次沒有中獎。'
        };
        await onComplete(gameResult);
      }, 1000);
    }, 3000);
  };

  // 移除分離的開始畫面，直接顯示轉盤和按鈕

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">🎡 幸運轉盤</h2>
        
        <div className="relative">
          {/* 轉盤 */}
          <div 
            key={animationKey}
            className={`w-80 h-80 rounded-full border-8 border-gray-800 relative overflow-hidden shadow-2xl ${isSpinning ? 'wheel-spinning' : ''}`}
            style={{ 
              transformOrigin: 'center'
            }}
          >
            {/* 使用 conic-gradient 創建轉盤 */}
            <div 
              className="w-full h-full"
              style={{
                background: `conic-gradient(
                  ${wheelSections[0].color} 0deg 45deg,
                  ${wheelSections[1].color} 45deg 90deg,
                  ${wheelSections[2].color} 90deg 135deg,
                  ${wheelSections[3].color} 135deg 180deg,
                  ${wheelSections[4].color} 180deg 225deg,
                  ${wheelSections[5].color} 225deg 270deg,
                  ${wheelSections[6].color} 270deg 315deg,
                  ${wheelSections[7].color} 315deg 360deg
                )`
              }}
            />
            
            {/* 中心圓圈 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gray-800 rounded-full border-4 border-white shadow-lg flex items-center justify-center z-10">
              <div className="text-white font-bold text-xl">324</div>
            </div>
          </div>
          
          {/* 指針 - 向下指向轉盤中心 */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-12 border-r-12 border-b-24 border-l-transparent border-r-transparent border-b-red-500 shadow-lg"></div>
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
        
        {/* 圖例 - 適中大小 */}
        <div className="mt-6 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded shadow-md" style={{ backgroundColor: '#FFD700' }}></div>
            <span className="text-sm font-medium text-gray-700">黃色 = 成功 (50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded shadow-md" style={{ backgroundColor: '#8B0000' }}></div>
            <span className="text-sm font-medium text-gray-700">深紅色 = 失敗 (50%)</span>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .wheel-spinning {
          animation: spin 3s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards;
        }
        
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          70% {
            transform: rotate(calc(var(--final-rotation, 1800deg) * 0.8));
          }
          100% {
            transform: rotate(var(--final-rotation, 1800deg));
          }
        }
      `}</style>
    </div>
  );
}

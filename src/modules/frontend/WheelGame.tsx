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
  const [rotation, setRotation] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);

  // 轉盤配置 - 8格，4格成功4格失敗，使用您提供的色彩
  const wheelSections = [
    { id: 1, type: 'win', color: '#8B7355', label: '成功' },    // 橄欖綠
    { id: 2, type: 'lose', color: '#FF8C00', label: '失敗' },   // 橘色
    { id: 3, type: 'win', color: '#FF69B4', label: '成功' },    // 粉紅色
    { id: 4, type: 'lose', color: '#8B7355', label: '失敗' },   // 橄欖綠
    { id: 5, type: 'win', color: '#FFD700', label: '成功' },    // 黃色
    { id: 6, type: 'lose', color: '#FF69B4', label: '失敗' },   // 粉紅色
    { id: 7, type: 'win', color: '#FF8C00', label: '成功' },    // 橘色
    { id: 8, type: 'lose', color: '#20B2AA', label: '失敗' },   // 藍綠色
  ];

  const startSpin = () => {
    if (isSpinning) return;
    
    console.log('🎡 開始旋轉轉盤');
    setIsSpinning(true);
    setGameStarted(true);
    
    // 計算隨機旋轉角度
    // 每格 45 度，加上多圈旋轉增加戲劇效果
    const extraSpins = 5 + Math.random() * 5; // 5-10 圈
    const randomAngle = Math.random() * 360;
    const finalRotation = (extraSpins * 360) + randomAngle;
    
    console.log('🎡 旋轉角度:', finalRotation);
    setRotation(finalRotation);
    
    // 3 秒後停止並判斷結果
    setTimeout(() => {
      setIsSpinning(false);
      
      // 計算最終位置（0-360度）
      const finalAngle = finalRotation % 360;
      const sectionIndex = Math.floor(finalAngle / 45);
      const result = wheelSections[sectionIndex].type as 'win' | 'lose';
      
      // 延遲 1 秒後顯示結果
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

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🎡 幸運轉盤</h2>
            <p className="text-lg text-gray-700 mb-6">
              轉動轉盤，停在綠色區域就能獲得獎品！
            </p>
            
            {rewardConfig && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-orange-300 rounded-xl p-4 mb-6 max-w-md mx-auto">
                <div className="text-orange-800 font-semibold text-lg">
                  🎁 獎品：{rewardConfig.description}
                </div>
                <div className="text-orange-600 text-sm mt-1">
                  50% 機率獲得獎品
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={startSpin}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-full text-xl hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all shadow-lg"
          >
            🎯 開始轉動
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">🎡 幸運轉盤</h2>
        
        <div className="relative">
          {/* 轉盤 */}
          <div 
            className="w-80 h-80 rounded-full border-8 border-gray-800 relative overflow-hidden shadow-2xl"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
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
          
          {/* 指針 */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 z-20">
            <div className="w-0 h-0 border-l-10 border-r-10 border-b-20 border-l-transparent border-r-transparent border-b-yellow-400 shadow-lg"></div>
          </div>
        </div>
        
        <div className="mt-8">
          {isSpinning ? (
            <div className="text-2xl font-bold text-purple-600 animate-pulse">
              🎯 轉動中...
            </div>
          ) : (
            <div className="text-xl text-gray-600">
              等待結果...
            </div>
          )}
        </div>
        
        {/* 圖例 */}
        <div className="mt-8 flex justify-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8B7355' }}></div>
            <span className="text-sm text-gray-600">成功 (50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF8C00' }}></div>
            <span className="text-sm text-gray-600">失敗 (50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

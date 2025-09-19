"use client";

import { useState } from 'react';

interface WheelGameProps {
  onComplete: (result: { result: 'win' | 'lose'; reward?: { type: 'coupon' | 'discount'; value: number; description: string } }) => Promise<void>;
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

  // 轉盤配置 - 8格，4格成功4格失敗
  const wheelSections = [
    { id: 1, type: 'win', color: '#10B981', label: '成功' },
    { id: 2, type: 'lose', color: '#EF4444', label: '失敗' },
    { id: 3, type: 'win', color: '#10B981', label: '成功' },
    { id: 4, type: 'lose', color: '#EF4444', label: '失敗' },
    { id: 5, type: 'win', color: '#10B981', label: '成功' },
    { id: 6, type: 'lose', color: '#EF4444', label: '失敗' },
    { id: 7, type: 'win', color: '#10B981', label: '成功' },
    { id: 8, type: 'lose', color: '#EF4444', label: '失敗' },
  ];

  const startSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setGameStarted(true);
    
    // 計算隨機旋轉角度
    // 每格 45 度，加上多圈旋轉增加戲劇效果
    const baseRotation = Math.random() * 360;
    const extraSpins = 5 + Math.random() * 5; // 5-10 圈
    const finalRotation = rotation + baseRotation + (extraSpins * 360);
    
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
        await onComplete({
          result,
          reward: result === 'win' ? rewardConfig : undefined
        });
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
            className="w-80 h-80 rounded-full border-8 border-gray-800 relative overflow-hidden shadow-2xl transition-transform duration-3000 ease-out"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          >
            {wheelSections.map((section, index) => {
              const angle = (360 / wheelSections.length) * index;
              return (
                <div
                  key={section.id}
                  className="absolute w-full h-full"
                  style={{
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: 'center'
                  }}
                >
                  <div
                    className="w-1/2 h-1/2 absolute top-0 left-1/2 transform -translate-x-1/2"
                    style={{
                      background: `conic-gradient(from 0deg, ${section.color} 0deg, ${section.color} 45deg, transparent 45deg)`,
                      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'
                    }}
                  />
                </div>
              );
            })}
            
            {/* 中心圓圈 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gray-800 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
              <div className="text-white font-bold text-lg">324</div>
            </div>
          </div>
          
          {/* 指針 */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-16 border-l-transparent border-r-transparent border-b-yellow-400 shadow-lg"></div>
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
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">成功 (50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-600">失敗 (50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

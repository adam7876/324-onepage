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

  // 完全重新設計的轉盤配置 - 使用明確的邏輯
  const wheelSections = [
    { id: 0, type: 'win', color: '#FF8C00', label: '成功', angle: 0 },    // 0° - 橙色成功
    { id: 1, type: 'lose', color: '#FF69B4', label: '失敗', angle: 45 },   // 45° - 亮粉色失敗
    { id: 2, type: 'win', color: '#FF8C00', label: '成功', angle: 90 },    // 90° - 橙色成功
    { id: 3, type: 'lose', color: '#FF69B4', label: '失敗', angle: 135 },  // 135° - 亮粉色失敗
    { id: 4, type: 'win', color: '#FF8C00', label: '成功', angle: 180 },   // 180° - 橙色成功
    { id: 5, type: 'lose', color: '#FF69B4', label: '失敗', angle: 225 },  // 225° - 亮粉色失敗
    { id: 6, type: 'win', color: '#FF8C00', label: '成功', angle: 270 },   // 270° - 橙色成功
    { id: 7, type: 'lose', color: '#FF69B4', label: '失敗', angle: 315 },  // 315° - 亮粉色失敗
  ];

  const startSpin = () => {
    if (isSpinning) return;
    
    console.log('🎡 開始旋轉轉盤');
    setIsSpinning(true);
    
    // 完全重新設計的轉盤邏輯 - 使用明確的角度計算
    // 1. 先隨機選擇目標格子
    const targetIndex = Math.floor(Math.random() * 8);
    const targetSection = wheelSections[targetIndex];
    
    // 2. 計算轉盤需要旋轉的角度
    // 指針固定在12點方向，轉盤需要旋轉讓目標格子對準指針
    const targetAngle = targetSection.angle; // 目標格子的角度
    const extraSpins = 5 + Math.random() * 5; // 5-10 圈
    const finalRotation = (extraSpins * 360) + targetAngle;
    
    console.log('🎡 目標格子索引:', targetIndex);
    console.log('🎡 目標格子配置:', targetSection);
    console.log('🎡 目標角度:', targetAngle);
    console.log('🎡 最終旋轉角度:', finalRotation);
    console.log('🎡 預期結果:', targetSection.type);
    console.log('🎡 預期顏色:', targetSection.color);
    
    // 保存最終旋轉角度
    setFinalRotation(finalRotation);
    
    // 設置 CSS 變數用於動畫
    document.documentElement.style.setProperty('--final-rotation', `${finalRotation}deg`);
    
    // 4 秒後停止並判斷結果
    setTimeout(() => {
      setIsSpinning(false);
      
      // 使用預先計算的結果
      const result = targetSection.type as 'win' | 'lose';
      
      // 延遲 2 秒後顯示結果，讓用戶有時間看到結果
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
    }, 4000); // 延長到4秒確保動畫完成
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">🎡 幸運轉盤</h2>
        
        <div className="relative flex justify-center">
          {/* 完全重新設計的 SVG 轉盤 */}
          <div className="relative">
            <svg 
              width="320" 
              height="320" 
              viewBox="0 0 320 320"
              className={`${isSpinning ? 'wheel-spinning' : ''}`}
              style={{ 
                transformOrigin: 'center center',
                transform: isSpinning ? 'none' : `rotate(${finalRotation}deg)`
              }}
            >
              {/* 轉盤背景圓圈 */}
              <circle cx="160" cy="160" r="150" fill="none" stroke="#374151" strokeWidth="8"/>
              
              {/* 8個扇形區域 */}
              {wheelSections.map((section, index) => {
                const startAngle = section.angle;
                const endAngle = section.angle + 45;
                const radius = 150;
                const centerX = 160;
                const centerY = 160;
                
                // 計算扇形路徑
                const startAngleRad = (startAngle * Math.PI) / 180;
                const endAngleRad = (endAngle * Math.PI) / 180;
                
                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);
                
                const largeArcFlag = 45 > 180 ? 1 : 0;
                
                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');
                
                return (
                  <g key={index}>
                    <path
                      d={pathData}
                      fill={section.color}
                      stroke="#374151"
                      strokeWidth="2"
                    />
                    {/* 標籤文字 */}
                    <text
                      x={centerX + (radius * 0.7) * Math.cos(((startAngle + endAngle) / 2) * Math.PI / 180)}
                      y={centerY + (radius * 0.7) * Math.sin(((startAngle + endAngle) / 2) * Math.PI / 180)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-white font-bold text-sm pointer-events-none"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                    >
                      <tspan x={centerX + (radius * 0.7) * Math.cos(((startAngle + endAngle) / 2) * Math.PI / 180)} dy="-8">索引{index}</tspan>
                      <tspan x={centerX + (radius * 0.7) * Math.cos(((startAngle + endAngle) / 2) * Math.PI / 180)} dy="12" className="text-xs">
                        {section.color === '#FF8C00' ? '橙' : '粉'}
                      </tspan>
                      <tspan x={centerX + (radius * 0.7) * Math.cos(((startAngle + endAngle) / 2) * Math.PI / 180)} dy="12" className="text-xs">
                        {section.type === 'win' ? '勝' : '敗'}
                      </tspan>
                    </text>
                  </g>
                );
              })}
              
              {/* 中心圓圈 */}
              <circle cx="160" cy="160" r="24" fill="#374151" stroke="white" strokeWidth="4"/>
              <circle cx="160" cy="160" r="8" fill="white"/>
              <circle cx="160" cy="160" r="4" fill="#1e40af"/>
            </svg>
            
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
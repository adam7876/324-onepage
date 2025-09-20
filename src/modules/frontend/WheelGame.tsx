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
  const [finalRotation, setFinalRotation] = useState(0);

  // 轉盤配置 - 8格，4格成功4格失敗，橙色成功、亮粉色失敗
  // 根據實際視覺效果修正：90°-135° 是亮粉色，應該是失敗
  const wheelSections = [
    { id: 1, type: 'lose', color: '#FF69B4', label: '失敗' },   // 索引0: 0°-45° - 亮粉色失敗
    { id: 2, type: 'win', color: '#FF8C00', label: '成功' },    // 索引1: 45°-90° - 橙色成功
    { id: 3, type: 'lose', color: '#FF69B4', label: '失敗' },   // 索引2: 90°-135° - 亮粉色失敗 ✅
    { id: 4, type: 'win', color: '#FF8C00', label: '成功' },    // 索引3: 135°-180° - 橙色成功
    { id: 5, type: 'lose', color: '#FF69B4', label: '失敗' },   // 索引4: 180°-225° - 亮粉色失敗
    { id: 6, type: 'win', color: '#FF8C00', label: '成功' },    // 索引5: 225°-270° - 橙色成功
    { id: 7, type: 'lose', color: '#FF69B4', label: '失敗' },   // 索引6: 270°-315° - 亮粉色失敗
    { id: 8, type: 'win', color: '#FF8C00', label: '成功' },    // 索引7: 315°-360° - 橙色成功
  ];

  const startSpin = () => {
    if (isSpinning) return;
    
    console.log('🎡 開始旋轉轉盤');
    setIsSpinning(true);
    
    // 計算精確停格角度 - 確保指針指向格子中心
    const extraSpins = 5 + Math.random() * 5; // 5-10 圈
    const randomSection = Math.floor(Math.random() * 8);
    // 每格45度，計算目標格子的中心角度
    // conic-gradient 從0度開始，指針在12點方向
    const targetAngle = randomSection * 45 + 22.5; // 每格中心角度
    // 指針固定在12點方向，轉盤需要轉到讓目標格子對準指針
    // 由於指針在12點方向，需要讓目標格子轉到指針位置
    const calculatedRotation = (extraSpins * 360) + targetAngle; // 正向計算，讓目標格子轉到指針位置
    
    console.log('🎡 目標格子索引:', randomSection);
    console.log('🎡 目標格子配置:', wheelSections[randomSection]);
    console.log('🎡 中心角度:', targetAngle);
    console.log('🎡 最終旋轉角度:', calculatedRotation);
    console.log('🎡 預期結果:', wheelSections[randomSection].type);
    console.log('🎡 預期顏色:', wheelSections[randomSection].color);
    
    // 保存最終旋轉角度
    setFinalRotation(calculatedRotation);
    
    // 設置 CSS 變數用於動畫
    document.documentElement.style.setProperty('--final-rotation', `${calculatedRotation}deg`);
    
    // 強制重新渲染動畫
    setAnimationKey(prev => prev + 1);
    
    // 4 秒後停止並判斷結果
    setTimeout(() => {
      setIsSpinning(false);
      
      // 使用預先計算的結果
      const result = wheelSections[randomSection].type as 'win' | 'lose';
      
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

  // 移除分離的開始畫面，直接顯示轉盤和按鈕

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">🎡 幸運轉盤</h2>
        
        <div className="relative flex justify-center">
          {/* 轉盤 */}
          <div 
            key={animationKey}
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
            
            {/* 除錯：在每個格子上標示索引和顏色 */}
            {wheelSections.map((section, index) => {
              const angle = index * 45 + 22.5; // 每格中心角度
              const radians = (angle * Math.PI) / 180;
              const radius = 120; // 距離中心的距離
              const x = 50 + (radius * Math.sin(radians)) / 3.2; // 調整位置
              const y = 50 - (radius * Math.cos(radians)) / 3.2; // 調整位置
              
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
                  <div className="text-xs">{section.color === '#FF8C00' ? '橙' : '粉'}</div>
                  <div className="text-xs">{section.type === 'win' ? '勝' : '敗'}</div>
                </div>
              );
            })}
            
            {/* 中心軸心 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border-2 border-white shadow-lg z-10">
              {/* 中心小圓點 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-blue-800 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* 長指針 - 底部固定在圓心，尖端朝外指向轉盤邊緣 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
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

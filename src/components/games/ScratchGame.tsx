"use client";

import { useState, useRef, useEffect } from 'react';
import { drawReward } from '../../lib/game-utils';
import type { GameResult } from '../../lib/game-types';

interface ScratchGameProps {
  onComplete: (result: GameResult) => void;
}

export default function ScratchGame({ onComplete }: ScratchGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [reward, setReward] = useState<{type: string; name: string; value?: number} | null>(null);
  const [showResult, setShowResult] = useState(false);

  // 初始化刮刮樂
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 設定canvas尺寸
    canvas.width = 300;
    canvas.height = 200;

    // 繪製刮刮層
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 添加刮刮層紋理
    ctx.fillStyle = '#999999';
    for (let i = 0; i < 100; i++) {
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2, 2
      );
    }

    // 添加文字提示
    ctx.fillStyle = '#666666';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('刮開我！', canvas.width / 2, canvas.height / 2);

    // 抽獎決定結果
    const drawnReward = drawReward();
    setReward(drawnReward);
  }, []);

  // 處理刮擦
  const handleScratch = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hasPlayed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 設定橡皮擦效果
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fill();

    // 計算刮開的百分比
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const percent = (transparent / (pixels.length / 4)) * 100;
    setScratchedPercent(percent);

    // 如果刮開超過30%，顯示結果
    if (percent > 30 && !showResult) {
      setShowResult(true);
      setHasPlayed(true);

      // 準備結果
      if (!reward) return;
      
      const result: GameResult = {
        success: true,
        result: reward.type === 'coupon' ? 'win' : 'lose',
        message: reward.type === 'coupon' ? '恭喜中獎！' : '謝謝參與！',
      };

      if (reward.type === 'coupon') {
        result.reward = {
          type: 'coupon',
          name: reward.name,
          value: reward.value || 0,
          code: '', // 將在後端生成
        };
      }

      // 延遲一下讓用戶看清結果
      setTimeout(() => {
        onComplete(result);
      }, 2000);
    }
  };

  // 處理觸控設備
  const handleTouchScratch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (hasPlayed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // 設定橡皮擦效果
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fill();

    // 與滑鼠事件相同的百分比計算邏輯
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const percent = (transparent / (pixels.length / 4)) * 100;
    setScratchedPercent(percent);

    if (percent > 30 && !showResult) {
      setShowResult(true);
      setHasPlayed(true);

      if (!reward) return;

      const result: GameResult = {
        success: true,
        result: reward.type === 'coupon' ? 'win' : 'lose',
        message: reward.type === 'coupon' ? '恭喜中獎！' : '謝謝參與！',
      };

      if (reward.type === 'coupon') {
        result.reward = {
          type: 'coupon',
          name: reward.name,
          value: reward.value || 0,
          code: '',
        };
      }

      setTimeout(() => {
        onComplete(result);
      }, 2000);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px]">
      {/* 遊戲說明 */}
      <div className="text-center mb-8 text-white">
        <h2 className="text-2xl font-bold mb-4">🎪 刮刮樂</h2>
        <p className="text-lg opacity-90">用手指或滑鼠刮開銀色區域，發現驚喜！</p>
      </div>

      {/* 刮刮樂卡片 */}
      <div className="relative mb-8">
        {/* 背景結果 */}
        <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
          {reward && (
            <div className="text-center">
              <div className="text-4xl mb-4">
                {reward.type === 'coupon' ? '🎁' : '😔'}
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {reward.name}
              </div>
              {reward.type === 'coupon' && (
                <div className="text-lg text-purple-600 mt-2">
                  價值 ${reward.value}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 刮刮層 */}
        <canvas
          ref={canvasRef}
          className="rounded-2xl shadow-2xl cursor-pointer"
          onMouseDown={() => setIsScratching(true)}
          onMouseUp={() => setIsScratching(false)}
          onMouseMove={(e) => isScratching && handleScratch(e)}
          onMouseLeave={() => setIsScratching(false)}
          onTouchStart={() => setIsScratching(true)}
          onTouchEnd={() => setIsScratching(false)}
          onTouchMove={handleTouchScratch}
        />
      </div>

      {/* 進度顯示 */}
      <div className="mb-6 text-center text-white">
        <div className="text-lg">
          已刮開：{scratchedPercent.toFixed(0)}%
        </div>
        <div className="w-64 h-2 bg-white/30 rounded-full mt-2">
          <div 
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(scratchedPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* 結果顯示 */}
      {showResult && reward && (
        <div className="text-center mb-6 text-white">
          <div className="text-2xl font-bold">
            {reward.type === 'coupon' ? (
              <div className="text-yellow-300">
                🎉 恭喜中獎！🎉
              </div>
            ) : (
              <div>
                謝謝參與！
              </div>
            )}
          </div>
        </div>
      )}

      {/* 提示文字 */}
      <div className="text-center text-white opacity-75">
        {hasPlayed ? (
          <p className="text-lg">✅ 遊戲完成</p>
        ) : (
          <div>
            <p className="text-lg">用滑鼠或手指刮開銀色區域</p>
            <p className="text-sm mt-1">刮開30%以上即可揭曉結果</p>
          </div>
        )}
      </div>
    </div>
  );
}

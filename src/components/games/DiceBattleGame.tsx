"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getRewardConfig } from '../../lib/game-utils';
import { GAME_CONFIG, type RewardType } from '../../lib/game-config';

interface DiceBattleGameProps {
  token: string;
  onComplete: (result: 'win' | 'lose', reward?: { name: string; value: number; type: string }) => void;
}

export default function DiceBattleGame({ token, onComplete }: DiceBattleGameProps) {
  // token 參數暫時不使用，但保留以供未來擴展
  console.log('Game token:', token);
  const [playerDice, setPlayerDice] = useState<number | null>(null);
  const [computerDice, setComputerDice] = useState<number | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [rewardConfig, setRewardConfig] = useState<RewardType>(GAME_CONFIG.reward);

  useEffect(() => {
    // 載入獎品配置
    getRewardConfig().then(setRewardConfig);
  }, []);

  const rollDice = (): number => {
    return Math.floor(Math.random() * 6) + 1;
  };

  // 創建 3D 骰子組件
  const Dice3D = ({ isRolling, value }: { isRolling: boolean; value: number }) => {
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    const diceStyle: React.CSSProperties = {
      position: 'relative',
      width: '80px',
      height: '80px',
      transformStyle: 'preserve-3d',
      perspective: '1000px',
      margin: '0 auto',
      animation: isRolling ? 'diceRoll 0.2s linear infinite' : 'none',
    };

    const faceStyle: React.CSSProperties = {
      position: 'absolute',
      width: '80px',
      height: '80px',
      background: 'white',
      border: '2px solid #333',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '40px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      backfaceVisibility: 'hidden',
    };

    // 根據骰子值決定顯示哪一面
    const getFaceTransform = (faceValue: number) => {
      const transforms = [
        'rotateY(0deg) translateZ(40px)',      // 1
        'rotateY(90deg) translateZ(40px)',     // 2
        'rotateY(180deg) translateZ(40px)',    // 3
        'rotateY(-90deg) translateZ(40px)',    // 4
        'rotateX(90deg) translateZ(40px)',     // 5
        'rotateX(-90deg) translateZ(40px)',    // 6
      ];
      return transforms[faceValue - 1] || transforms[0];
    };

    return (
      <>
        <div style={diceStyle}>
          <div style={{...faceStyle, transform: getFaceTransform(value)}}>
            {diceEmojis[value - 1]}
          </div>
        </div>
        <style jsx>{`
          @keyframes diceRoll {
            0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
            25% { transform: rotateX(90deg) rotateY(90deg) rotateZ(45deg); }
            50% { transform: rotateX(180deg) rotateY(180deg) rotateZ(90deg); }
            75% { transform: rotateX(270deg) rotateY(270deg) rotateZ(135deg); }
            100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(180deg); }
          }
        `}</style>
      </>
    );
  };

  const handleRoll = async () => {
    if (hasPlayed) return;

    setIsRolling(true);
    setPlayerDice(null);
    setComputerDice(null);
    setResult(null);

    // 模擬擲骰子動畫
    const rollAnimation = setInterval(() => {
      setPlayerDice(rollDice());
      setComputerDice(rollDice());
    }, 100);

    setTimeout(() => {
      clearInterval(rollAnimation);
      
      const finalPlayerDice = rollDice();
      const finalComputerDice = rollDice();
      
      setPlayerDice(finalPlayerDice);
      setComputerDice(finalComputerDice);
      setIsRolling(false);

      let gameResult: 'win' | 'lose' | 'draw';
      if (finalPlayerDice > finalComputerDice) {
        gameResult = 'win';
      } else if (finalPlayerDice < finalComputerDice) {
        gameResult = 'lose';
      } else {
        gameResult = 'draw';
      }

      setResult(gameResult);

      // 如果是平手，允許再玩一次
      if (gameResult === 'draw') {
        setTimeout(() => {
          setPlayerDice(null);
          setComputerDice(null);
          setResult(null);
          // 平手不設定hasPlayed，讓用戶可以繼續
        }, 3000); // 增加顯示時間
        return;
      }

      // 只有分出勝負才設定hasPlayed
      setHasPlayed(true);

      // 提交結果
      const reward = gameResult === 'win' && rewardConfig ? {
        name: rewardConfig.description,
        value: rewardConfig.value,
        type: rewardConfig.type
      } : undefined;

      setTimeout(() => {
        onComplete(gameResult, reward);
      }, 4000); // 增加延遲讓用戶看清結果
    }, 2000);
  };

  const getResultMessage = () => {
    if (!result) return '';
    if (result === 'win') return '🎉 你贏了！';
    if (result === 'lose') return '😔 你輸了...';
    return '🤝 平手，再來一次！';
  };

  const getResultColor = () => {
    if (result === 'win') return 'text-green-600';
    if (result === 'lose') return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* 響應式背景圖片 */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/backgrounds/dice-battle-bg.jpg"
          alt="骰子比大小背景"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      <div className="relative z-10 p-8 max-w-md w-full text-center">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/games/dice-battle-icon.png"
            alt="骰子比大小"
            width={64}
            height={64}
            className="mb-4"
            priority
            unoptimized
          />
          <h1 className="text-3xl font-bold text-gray-900 drop-shadow-lg">
            骰子比大小
          </h1>
        </div>

        {!hasPlayed && !isRolling && result !== 'draw' && (
          <>
            <p className="text-lg text-gray-600 mb-8">
              擲出骰子，點數比電腦大就贏！
            </p>
            <div className="mb-8">
              <div className="text-8xl mb-4">🎲</div>
              <button
                onClick={handleRoll}
                className="bg-gradient-to-br from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white font-bold py-4 px-8 rounded-xl transform hover:scale-105 transition-all shadow-lg text-lg"
              >
                🎲 擲骰子
              </button>
            </div>
            <p className="text-sm text-gray-500">
              贏了可獲得：{rewardConfig?.description || '載入中...'}
            </p>
          </>
        )}

        {(isRolling || result === 'draw') && !hasPlayed && (
          <div className="mb-8">
            <p className="text-xl text-gray-700 mb-6">
              {isRolling ? '擲骰子中...' : '平手，再來一次！'}
            </p>
            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <div className="mb-2">
                  <Dice3D isRolling={isRolling} value={playerDice} />
                </div>
                <p className="font-bold text-gray-700">你</p>
                {playerDice && <p className="text-2xl font-bold text-blue-600">{playerDice}</p>}
              </div>
              <div className="text-4xl text-gray-400">VS</div>
              <div className="text-center">
                <div className="mb-2">
                  <Dice3D isRolling={isRolling} value={computerDice} />
                </div>
                <p className="font-bold text-gray-700">電腦</p>
                {computerDice && <p className="text-2xl font-bold text-red-600">{computerDice}</p>}
              </div>
            </div>
            
            {result === 'draw' && !isRolling && (
              <button
                onClick={handleRoll}
                className="mt-6 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl transform hover:scale-105 transition-all shadow-lg"
              >
                🎲 再來一次
              </button>
            )}
          </div>
        )}

        {result && hasPlayed && (
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-8 mb-6">
              <div className="text-center">
                <div className="mb-2">
                  <Dice3D isRolling={false} value={playerDice} />
                </div>
                <p className="font-bold text-gray-700">你</p>
                <p className="text-3xl font-bold text-blue-600">{playerDice}</p>
              </div>
              <div className="text-4xl text-gray-400">VS</div>
              <div className="text-center">
                <div className="mb-2">
                  <Dice3D isRolling={false} value={computerDice} />
                </div>
                <p className="font-bold text-gray-700">電腦</p>
                <p className="text-3xl font-bold text-red-600">{computerDice}</p>
              </div>
            </div>
            
            <div className={`text-2xl font-bold mb-4 ${getResultColor()}`}>
              {getResultMessage()}
            </div>

            {result === 'win' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-bold">
                  🎁 恭喜獲得：{rewardConfig?.description || '獎品'}
                </p>
              </div>
            )}

            {result === 'lose' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-red-800">
                  😔 很遺憾，這次沒有獲得獎品
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

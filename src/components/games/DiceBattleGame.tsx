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
  const [showingResult, setShowingResult] = useState(false);
  
  // 3戰2勝制相關狀態
  const [currentRound, setCurrentRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    // 載入獎品配置
    getRewardConfig().then(setRewardConfig);
  }, []);

  const rollDice = (): number => {
    return Math.floor(Math.random() * 6) + 1;
  };

  // 獲取骰子 emoji
  const getDiceEmoji = (value: number): string => {
    const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return diceEmojis[value - 1] || diceEmojis[0];
  };

  const handleRoll = async () => {
    if (hasPlayed || gameFinished) return;

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
      setShowingResult(true); // 開始顯示結果階段

      // 讓用戶看到最終的骰子點數，然後顯示結果
      setTimeout(() => {
        let roundResult: 'win' | 'lose' | 'draw';
        if (finalPlayerDice > finalComputerDice) {
          roundResult = 'win';
        } else if (finalPlayerDice < finalComputerDice) {
          roundResult = 'lose';
        } else {
          roundResult = 'draw';
        }

        setResult(roundResult);
        
        // 更新分數
        if (roundResult === 'win') {
          setPlayerScore(prev => prev + 1);
        } else if (roundResult === 'lose') {
          setComputerScore(prev => prev + 1);
        }
        
        // 檢查是否有人已經獲勝
        const newPlayerScore = roundResult === 'win' ? playerScore + 1 : playerScore;
        const newComputerScore = roundResult === 'lose' ? computerScore + 1 : computerScore;
        
        if (newPlayerScore >= 2 || newComputerScore >= 2) {
          // 遊戲結束
          setGameFinished(true);
          setHasPlayed(true);
          
          setTimeout(() => {
            if (newPlayerScore >= 2) {
              onComplete('win', {
                name: rewardConfig.description,
                value: rewardConfig.value,
                type: rewardConfig.type
              });
            } else {
              onComplete('lose');
            }
          }, 3000); // 增加結果顯示時間
        } else {
          // 繼續下一回合（包括平手）
          setTimeout(() => {
            setCurrentRound(prev => prev + 1);
            setPlayerDice(null);
            setComputerDice(null);
            setResult(null);
            setShowingResult(false);
          }, 3000); // 增加結果顯示時間
        }
      }, 2000); // 給用戶更多時間看到最終的骰子點數
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

        {/* 分數顯示 */}
        {!gameFinished && (
          <div className="mb-6 p-4 bg-white/80 rounded-lg shadow-lg">
            <p className="text-lg font-bold text-gray-800 mb-2">第 {currentRound} 回合</p>
            <div className="flex justify-center space-x-8">
              <div className="text-center">
                <p className="text-sm text-gray-600">你</p>
                <p className="text-2xl font-bold text-blue-600">{playerScore}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">電腦</p>
                <p className="text-2xl font-bold text-red-600">{computerScore}</p>
              </div>
            </div>
          </div>
        )}

        {!hasPlayed && !isRolling && result !== 'draw' && !gameFinished && (
          <>
            <p className="text-lg text-gray-600 mb-8">
              擲出骰子，點數比電腦大就贏！(3戰2勝)
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

        {(isRolling || showingResult || result === 'draw') && !hasPlayed && (
          <div className="mb-8">
            <p className="text-xl text-gray-700 mb-6">
              {isRolling ? '擲骰子中...' : showingResult ? '結果揭曉...' : '平手，再來一次！'}
            </p>
            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <div className="mb-2">
                  <div className={`text-6xl transition-all duration-300 ${isRolling ? 'dice-bounce' : ''}`}>
                    {playerDice ? getDiceEmoji(playerDice) : '⚀'}
                  </div>
                </div>
                <p className="font-bold text-gray-700">你</p>
                {playerDice && <p className="text-2xl font-bold text-blue-600">{playerDice}</p>}
              </div>
              <div className="text-4xl text-gray-400">VS</div>
              <div className="text-center">
                <div className="mb-2">
                  <div className={`text-6xl transition-all duration-300 ${isRolling ? 'dice-bounce' : ''}`}>
                    {computerDice ? getDiceEmoji(computerDice) : '⚀'}
                  </div>
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
                  <div className="text-6xl">
                    {playerDice ? getDiceEmoji(playerDice) : '⚀'}
                  </div>
                </div>
                <p className="font-bold text-gray-700">你</p>
                <p className="text-3xl font-bold text-blue-600">{playerDice}</p>
              </div>
              <div className="text-4xl text-gray-400">VS</div>
              <div className="text-center">
                <div className="mb-2">
                  <div className="text-6xl">
                    {computerDice ? getDiceEmoji(computerDice) : '⚀'}
                  </div>
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
      
      <style jsx>{`
        .dice-bounce {
          animation: diceBounce 1.0s ease-in-out infinite;
        }
        
        @keyframes diceBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
      `}</style>
    </div>
  );
}

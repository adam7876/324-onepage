"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getRewardConfig } from '../../lib/game-utils';
import { GAME_CONFIG, type RewardType } from '../../lib/game-config';

interface RockPaperScissorsGameProps {
  token: string;
  onComplete: (result: 'win' | 'lose', reward?: { name: string; value: number; type: string }) => void;
}

type Choice = 'rock' | 'paper' | 'scissors';

const choices: { id: Choice; name: string; emoji: string }[] = [
  { id: 'rock', name: '石頭', emoji: '✊🏻' },
  { id: 'paper', name: '布', emoji: '🖐🏻' },
  { id: 'scissors', name: '剪刀', emoji: '✌🏻' }
];

export default function RockPaperScissorsGame({ token, onComplete }: RockPaperScissorsGameProps) {
  // token 參數暫時不使用，但保留以供未來擴展
  console.log('Game token:', token);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [rewardConfig, setRewardConfig] = useState<RewardType>(GAME_CONFIG.reward);
  
  // 3戰2勝制相關狀態
  const [currentRound, setCurrentRound] = useState(1);
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);
  const [gameFinished, setGameFinished] = useState(false);

  useEffect(() => {
    // 載入獎品配置
    getRewardConfig().then(setRewardConfig);
  }, []);

  const getRandomChoice = (): Choice => {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex].id;
  };

  const determineWinner = (player: Choice, computer: Choice): 'win' | 'lose' | 'draw' => {
    if (player === computer) return 'draw';
    
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'win';
    }
    
    return 'lose';
  };

  // 清空所有狀態的函數
  const resetRound = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setIsPlaying(false);
  };

  const handleChoice = async (choice: Choice) => {
    if (hasPlayed || gameFinished || isPlaying) return;

    // 第一步：用戶出拳
    setPlayerChoice(choice);
    setComputerChoice(null);
    setResult(null);
    setIsPlaying(true);

    // 第二步：電腦思考 (1.5秒)
    setTimeout(() => {
      const computer = getRandomChoice();
      setComputerChoice(computer);
      
      // 第三步：顯示結果 (1秒後)
      setTimeout(() => {
        const roundResult = determineWinner(choice, computer);
        setResult(roundResult);
        setIsPlaying(false);
        
        // 更新分數
        let newPlayerScore = playerScore;
        let newComputerScore = computerScore;
        
        if (roundResult === 'win') {
          newPlayerScore = playerScore + 1;
          setPlayerScore(newPlayerScore);
        } else if (roundResult === 'lose') {
          newComputerScore = computerScore + 1;
          setComputerScore(newComputerScore);
        }
        
        // 檢查是否有人已經獲勝
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
          }, 3000);
        } else {
          // 繼續下一回合（包括平手）
          setTimeout(() => {
            setCurrentRound(prev => prev + 1);
            resetRound(); // 使用統一的清空函數
          }, 3000);
        }
      }, 1000); // 給用戶時間看到電腦的出拳
    }, 1500); // 電腦思考時間
  };

  const getChoiceEmoji = (choice: Choice) => {
    return choices.find(c => c.id === choice)?.emoji || '';
  };

  const getChoiceName = (choice: Choice) => {
    return choices.find(c => c.id === choice)?.name || '';
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
          src="/images/backgrounds/rps-bg.jpg"
          alt="猜拳遊戲背景"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
      <div className="relative z-10 p-8 max-w-md w-full text-center">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/games/rps-icon.png"
            alt="猜拳遊戲"
            width={64}
            height={64}
            className="mb-4"
            priority
            unoptimized
          />
          <h1 className="text-3xl font-bold text-gray-900 drop-shadow-lg">
            猜拳遊戲
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

        {!hasPlayed && !isPlaying && !gameFinished && (
          <>
            <p className="text-lg text-gray-600 mb-8">
              選擇你的出拳，與電腦一較高下！(3戰2勝)
            </p>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoice(choice.id)}
                  className="bg-gradient-to-br from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600 text-white rounded-xl p-6 transform hover:scale-105 transition-all shadow-lg"
                >
                  <div className="text-4xl mb-2">{choice.emoji}</div>
                  <div className="font-bold">{choice.name}</div>
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500">
              贏了可獲得：{rewardConfig?.description || '載入中...'}
            </p>
          </>
        )}

        {isPlaying && (
          <div className="mb-8">
            <p className="text-xl text-gray-700 mb-6">猜拳中...</p>
            <div className="flex justify-center items-center space-x-8">
              <div className="text-center">
                <div className="text-6xl mb-2">
                  {getChoiceEmoji(playerChoice!)}
                </div>
                <p className="font-bold text-gray-700">你</p>
              </div>
              <div className="text-4xl text-gray-400">VS</div>
              <div className="text-center">
                <div className={`text-6xl mb-2 ${!computerChoice ? 'thinking-animation' : ''}`}>
                  {computerChoice ? getChoiceEmoji(computerChoice) : '🤔'}
                </div>
                <p className="font-bold text-gray-700">電腦</p>
              </div>
            </div>
          </div>
        )}

        {/* 回合結果顯示（不顯示手勢圖示） */}
        {result && !gameFinished && !isPlaying && (
          <div className="mb-8">
            <div className={`text-2xl font-bold mb-4 ${getResultColor()}`}>
              {getResultMessage()}
            </div>
            <p className="text-gray-600">準備下一回合...</p>
          </div>
        )}

        {/* 遊戲結束結果顯示 */}
        {gameFinished && hasPlayed && (
          <div className="mb-8">
            <div className="flex justify-center items-center space-x-8 mb-6">
              <div className="text-center">
                <div className="text-6xl mb-2">{getChoiceEmoji(playerChoice!)}</div>
                <p className="font-bold text-gray-700">{getChoiceName(playerChoice!)}</p>
              </div>
              <div className="text-4xl text-gray-400">VS</div>
              <div className="text-center">
                <div className="text-6xl mb-2">{getChoiceEmoji(computerChoice!)}</div>
                <p className="font-bold text-gray-700">{getChoiceName(computerChoice!)}</p>
              </div>
            </div>
            
            <div className={`text-2xl font-bold mb-4 ${getResultColor()}`}>
              {getResultMessage()}
            </div>

            {/* 顯示最終分數 */}
            <div className="mb-4 p-4 bg-white/80 rounded-lg shadow-lg">
              <p className="text-lg font-bold text-gray-800 mb-2">最終結果</p>
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
        .thinking-animation {
          animation: thinking 1s ease-in-out infinite;
        }
        
        @keyframes thinking {
          0%, 100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(-5deg);
          }
          75% {
            transform: rotate(5deg);
          }
        }
      `}</style>
    </div>
  );
}

"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getRewardConfig } from '../../lib/game-utils';
import type { RewardType } from '../../lib/game-config';

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
  const [rewardConfig, setRewardConfig] = useState<RewardType | null>(null);

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

  const handleChoice = async (choice: Choice) => {
    if (hasPlayed) return;

    setPlayerChoice(choice);
    setIsPlaying(true);

    // 延遲顯示電腦選擇，增加緊張感
    setTimeout(() => {
      const computer = getRandomChoice();
      setComputerChoice(computer);
      
      const gameResult = determineWinner(choice, computer);
      setResult(gameResult);

      // 如果是平手，允許再玩一次
      if (gameResult === 'draw') {
        setTimeout(() => {
          setPlayerChoice(null);
          setComputerChoice(null);
          setResult(null);
          setIsPlaying(false);
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
    }, 1500);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/images/games/rps-icon.png"
            alt="猜拳遊戲"
            width={64}
            height={64}
            className="mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-800">
            猜拳遊戲
          </h1>
        </div>

        {!hasPlayed && !isPlaying && (
          <>
            <p className="text-lg text-gray-600 mb-8">
              選擇你的出拳，與電腦一較高下！
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
                <div className="text-6xl mb-2">{playerChoice ? getChoiceEmoji(playerChoice) : '❓'}</div>
                <p className="font-bold text-gray-700">你</p>
              </div>
              <div className="text-4xl text-gray-400">VS</div>
              <div className="text-center">
                <div className="text-6xl mb-2">{computerChoice ? getChoiceEmoji(computerChoice) : '❓'}</div>
                <p className="font-bold text-gray-700">電腦</p>
              </div>
            </div>
          </div>
        )}

        {result && hasPlayed && (
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

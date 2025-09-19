// 遊戲系統配置
export const GAME_CONFIG = {
  // 基本設定
  enabled: true,
  dailyLimit: 1,
  tokenExpiryHours: 24,
  
  // Email設定
  email: {
    enabled: true,
    codeExpiry: 10, // 10分鐘
  },

  // 遊戲列表
  games: [
    // 舊遊戲暫時停用但保留程式碼
    {
      id: 'wheel',
      name: '幸運轉盤',
      description: '轉動轉盤，停在綠色區域就能獲得獎品！',
      emoji: '🎡',
      icon: '/images/games/wheel-icon.png',
      background: '/images/backgrounds/wheel-bg.jpg',
      enabled: true,
    },
    {
      id: 'dice',
      name: '幸運骰子',
      description: '擲出雙6獲得大獎！',
      emoji: '🎲',
      icon: '/images/games/dice-icon.png',
      background: '/images/backgrounds/dice-bg.jpg',
      enabled: false, // 暫時停用
    },
    {
      id: 'scratch',
      name: '刮刮樂',
      description: '刮開卡片，發現驚喜！',
      emoji: '🎪',
      icon: '/images/games/scratch-icon.png',
      background: '/images/backgrounds/scratch-bg.jpg',
      enabled: false, // 暫時停用
    },
    // 新遊戲
    {
      id: 'rock-paper-scissors',
      name: '猜拳遊戲',
      description: '與電腦猜拳，贏了拿獎品！',
      emoji: '✂️',
      icon: '/images/games/rps-icon.png',
      background: '/images/backgrounds/rps-bg.jpg',
      enabled: true,
    },
    {
      id: 'dice-battle',
      name: '骰子比大小',
      description: '擲骰子比大小，點數大就贏！',
      emoji: '🎰',
      icon: '/images/games/dice-battle-icon.png',
      background: '/images/backgrounds/dice-battle-bg.jpg',
      enabled: true,
    },
  ],

  // 獎品配置 - 簡化為管理者可設定的單一獎品
  reward: {
    type: 'coupon' as 'coupon' | 'discount', // 'coupon' 或 'discount'
    value: 30, // 回饋金金額或折扣百分比
    description: '回饋金 30 元', // 獎品描述
  },
} as const;

export type GameType = typeof GAME_CONFIG.games[number]['id'];
export type RewardType = typeof GAME_CONFIG.reward | {
  type: 'none';
  value: 0;
  description: string;
};

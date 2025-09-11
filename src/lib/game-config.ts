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
    {
      id: 'wheel',
      name: '幸運轉盤',
      description: '轉動轉盤，看看你的運氣如何！',
      emoji: '🎯',
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
      enabled: true,
    },
    {
      id: 'scratch',
      name: '刮刮樂',
      description: '刮開卡片，發現驚喜！',
      emoji: '🎪',
      icon: '/images/games/scratch-icon.png',
      background: '/images/backgrounds/scratch-bg.jpg',
      enabled: true,
    },
  ],

  // 獎品配置
  rewards: [
    { name: '50元折價券', value: 50, probability: 0.08, type: 'coupon' },   // 8%
    { name: '30元折價券', value: 30, probability: 0.12, type: 'coupon' },   // 12%
    { name: '20元折價券', value: 20, probability: 0.15, type: 'coupon' },   // 15%
    { name: '10元折價券', value: 10, probability: 0.25, type: 'coupon' },   // 25%
    { name: '謝謝參與', value: 0, probability: 0.40, type: 'none' },        // 40%
  ],
} as const;

export type GameType = typeof GAME_CONFIG.games[number]['id'];
export type RewardType = typeof GAME_CONFIG.rewards[number];

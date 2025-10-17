// 遊戲系統配置
export const GAME_CONFIG = {
  // 基本設定
  enabled: true,
  dailyLimit: 1,
  tokenExpiryHours: 24,
  
  // 遊戲狀態設定
  gameStatus: {
    isOpen: true, // 遊戲是否開放
    maintenanceMessage: '今日為遊樂園休息日，請下次再來！', // 休息日訊息
    maintenanceTitle: '🎠 遊樂園休息日 🎠', // 休息日標題
  },
  
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
    // 已移除未使用的 dice 與 scratch 遊戲
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
    type: 'discount' as 'coupon' | 'discount' | 'freeShipping',
    value: 75,
    description: '75折優惠',
  },
} as const;

export type GameType = typeof GAME_CONFIG.games[number]['id'];
export type RewardType = typeof GAME_CONFIG.reward | {
  type: 'none';
  value: 0;
  description: string;
};

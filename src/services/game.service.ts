/**
 * 遊戲服務層
 * 統一管理遊戲相關邏輯
 */

export interface GameResult {
  success: boolean;
  result: 'win' | 'lose' | 'draw';
  message: string;
  reward?: {
    type: string;
    name: string;
    value: number;
    code?: string;
  };
}

export interface GameService {
  generateRandomChoice(): 'rock' | 'paper' | 'scissors';
  determineWinner(player: 'rock' | 'paper' | 'scissors', computer: 'rock' | 'paper' | 'scissors'): 'win' | 'lose' | 'draw';
  rollDice(): number;
  getDiceEmoji(value: number): string;
  drawReward(): { type: string; description: string; value: number };
}

class GameServiceImpl implements GameService {
  private readonly choices: { id: 'rock' | 'paper' | 'scissors'; name: string; emoji: string }[] = [
    { id: 'rock', name: '石頭', emoji: '✊🏻' },
    { id: 'paper', name: '布', emoji: '🖐🏻' },
    { id: 'scissors', name: '剪刀', emoji: '✌🏻' }
  ];

  private readonly diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

  generateRandomChoice(): 'rock' | 'paper' | 'scissors' {
    const randomIndex = Math.floor(Math.random() * this.choices.length);
    return this.choices[randomIndex].id;
  }

  determineWinner(player: 'rock' | 'paper' | 'scissors', computer: 'rock' | 'paper' | 'scissors'): 'win' | 'lose' | 'draw' {
    if (player === computer) return 'draw';
    
    if (
      (player === 'rock' && computer === 'scissors') ||
      (player === 'paper' && computer === 'rock') ||
      (player === 'scissors' && computer === 'paper')
    ) {
      return 'win';
    }
    
    return 'lose';
  }

  rollDice(): number {
    return Math.floor(Math.random() * 6) + 1;
  }

  getDiceEmoji(value: number): string {
    return this.diceEmojis[value - 1] || this.diceEmojis[0];
  }

  drawReward(): { type: string; description: string; value: number } {
    // 簡化的抽獎邏輯，實際應該從後端獲取
    const rewards = [
      { type: 'coupon', description: '優惠券', value: 100 },
      { type: 'product', description: '商品', value: 200 }
    ];
    
    const randomIndex = Math.floor(Math.random() * rewards.length);
    return rewards[randomIndex];
  }

  private logGameAction(action: string, data: unknown): void {
    console.log(`Game ${action}:`, {
      action,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

// 單例模式
export const gameService = new GameServiceImpl();

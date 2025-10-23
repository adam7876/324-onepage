/**
 * 購物車服務層
 * 統一管理購物車相關邏輯
 */

import type { CartItem, CartService } from '../types';

class CartServiceImpl implements CartService {
  private cart: CartItem[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      // 檢查是否在瀏覽器環境
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('cart');
        if (stored) {
          this.cart = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
      this.cart = [];
    }
  }

  private saveToStorage(): void {
    try {
      // 檢查是否在瀏覽器環境
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('cart', JSON.stringify(this.cart));
      }
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  }

  getCart(): CartItem[] {
    return [...this.cart];
  }

  addToCart(item: CartItem): void {
    const existingItem = this.cart.find(cartItem => 
      cartItem.id === item.id && 
      cartItem.size === item.size && 
      cartItem.color === item.color
    );

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.cart.push({ ...item });
    }

    this.saveToStorage();
    this.logCartAction('add', item);
  }

  updateQuantity(id: string, quantity: number): void {
    const item = this.cart.find(cartItem => cartItem.id === id);
    if (item) {
      if (quantity <= 0) {
        this.removeItem(id);
      } else {
        item.quantity = quantity;
        this.saveToStorage();
        this.logCartAction('update', item);
      }
    }
  }

  removeItem(id: string): void {
    const item = this.cart.find(cartItem => cartItem.id === id);
    if (item) {
      this.cart = this.cart.filter(cartItem => cartItem.id !== id);
      this.saveToStorage();
      this.logCartAction('remove', item);
    }
  }

  clearCart(): void {
    this.cart = [];
    this.saveToStorage();
    this.logCartAction('clear', null);
  }

  getTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  logCartAction(action: string, data: unknown): void {
    console.log(`Cart ${action}:`, {
      action,
      data,
      cartSize: this.cart.length,
      total: this.getTotal(),
      timestamp: new Date().toISOString()
    });
  }
}

// 單例模式
export const cartService = new CartServiceImpl();

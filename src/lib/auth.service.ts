/**
 * 身份驗證服務
 * 統一管理身份驗證相關邏輯
 */

import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '../firebase/firebaseConfig';
import { securityService } from '../services/security.service';

export interface AuthService {
  signIn(email: string, password: string): Promise<boolean>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  isAdmin(): boolean;
  onAuthStateChange(callback: (user: User | null) => void): () => void;
}

class AuthServiceImpl implements AuthService {
  private auth = getAuth(app);
  private currentUser: User | null = null;

  constructor() {
    // 監聽身份驗證狀態變化
    onAuthStateChanged(this.auth, (user) => {
      this.currentUser = user;
      if (user) {
        securityService.logSecurityEvent('user_authenticated', {
          uid: user.uid,
          email: user.email
        });
      } else {
        securityService.logSecurityEvent('user_signed_out', {});
      }
    });
  }

  async signIn(email: string, password: string): Promise<boolean> {
    try {
      securityService.logSecurityEvent('sign_in_attempt', { email });
      
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      this.currentUser = userCredential.user;
      
      // 檢查是否為管理員
      const isAdmin = await this.checkAdminStatus(userCredential.user);
      
      securityService.logSecurityEvent('sign_in_success', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        isAdmin
      });
      
      return true;
    } catch (error) {
      securityService.logSecurityEvent('sign_in_failed', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async signOut(): Promise<void> {
    try {
      securityService.logSecurityEvent('sign_out_attempt', {
        uid: this.currentUser?.uid
      });
      
      await signOut(this.auth);
      this.currentUser = null;
      
      securityService.logSecurityEvent('sign_out_success', {});
    } catch (error) {
      securityService.logSecurityEvent('sign_out_failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAdmin(): boolean {
    // 這裡可以檢查用戶的 admin 標記
    // 目前簡化為檢查特定 email
    if (!this.currentUser?.email) return false;
    
    const adminEmails = [
      'admin@324.com',
      'axikorea@gmail.com'
    ];
    
    return adminEmails.includes(this.currentUser.email);
  }

  onAuthStateChange(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(this.auth, callback);
  }

  private async checkAdminStatus(_user: User): Promise<boolean> {
    // 這裡可以從 Firestore 檢查用戶的 admin 狀態
    // 目前簡化為檢查 email
    return this.isAdmin();
  }
}

// 單例模式
export const authService = new AuthServiceImpl();

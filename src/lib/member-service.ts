/**
 * 會員服務 - 處理會員驗證和查詢
 */

import { doc, getDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/firestore';

// 會員資料介面
export interface Member {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'vip' | 'suspended';
  joinDate: string;
  gameHistory: {
    lastPlayed: string | null;
    totalPlays: number;
  };
  updatedAt: string;
  importedAt?: string;
}

// 會員驗證結果
export interface MemberValidationResult {
  valid: boolean;
  member?: Member;
  message: string;
  code?: 'NOT_FOUND' | 'INACTIVE' | 'SUSPENDED' | 'PLAYED_TODAY' | 'VALID';
}

/**
 * 根據 email 查詢會員
 */
export async function getMemberByEmail(email: string): Promise<Member | null> {
  try {
    // 正規化 email
    const normalizedEmail = email.toLowerCase().trim();
    
    // 使用 email 作為文件 ID（移除特殊字元）
    const docId = normalizedEmail.replace(/[.@]/g, '_');
    
    console.log(`🔍 查詢會員: ${normalizedEmail} (docId: ${docId})`);
    
    const memberDoc = await getDoc(doc(db, 'members', docId));
    
    if (memberDoc.exists()) {
      const memberData = memberDoc.data() as Omit<Member, 'id'>;
      return {
        id: memberDoc.id,
        ...memberData
      };
    }
    
    console.log(`❌ 找不到會員: ${normalizedEmail}`);
    return null;
  } catch (error) {
    console.error('查詢會員失敗:', error);
    return null;
  }
}

/**
 * 驗證會員是否可以玩遊戲
 */
export async function validateMemberForGame(email: string): Promise<MemberValidationResult> {
  try {
    // 1. 查詢會員
    const member = await getMemberByEmail(email);
    
    if (!member) {
      return {
        valid: false,
        message: '此 Email 不是我們的會員，請先成為會員後再來玩遊戲！',
        code: 'NOT_FOUND'
      };
    }

    // 2. 檢查會員狀態
    if (member.status === 'inactive') {
      return {
        valid: false,
        member,
        message: '您的會員狀態為非啟用狀態，請聯繫客服',
        code: 'INACTIVE'
      };
    }

    if (member.status === 'suspended') {
      return {
        valid: false,
        member,
        message: '您的會員帳號已被暫停，請聯繫客服',
        code: 'SUSPENDED'
      };
    }

    // 3. 檢查今日是否已經玩過
    const playedToday = await checkMemberPlayedToday(email);
    
    if (playedToday) {
      return {
        valid: false,
        member,
        message: `親愛的 ${member.name}，您今天已經玩過遊戲了！明天再來試試運氣吧 🎮`,
        code: 'PLAYED_TODAY'
      };
    }

    // 4. 驗證通過
    return {
      valid: true,
      member,
      message: `歡迎 ${member.name}！選擇您要玩的遊戲吧 🎯`,
      code: 'VALID'
    };

  } catch (error) {
    console.error('會員驗證失敗:', error);
    return {
      valid: false,
      message: '系統錯誤，請稍後再試',
      code: 'NOT_FOUND'
    };
  }
}

/**
 * 檢查會員今日是否已經玩過遊戲
 */
export async function checkMemberPlayedToday(email: string): Promise<boolean> {
  try {
    // 查詢遊戲歷史
    const gameHistoryQuery = query(
      collection(db, 'gameHistory'),
      where('email', '==', email.toLowerCase().trim())
    );

    const gameHistorySnapshot = await getDocs(gameHistoryQuery);
    
    // 檢查是否有今天的記錄
    const todayPlayRecord = gameHistorySnapshot.docs.find(doc => {
      const playedAt = doc.data().playedAt?.toDate();
      if (!playedAt) return false;
      
      // 使用台灣時區檢查是否為今天
      const playedDate = new Date(playedAt);
      const today = new Date();
      
      // 轉換為台灣時間 (UTC+8)
      const taiwanOffset = 8 * 60; // 台灣時區偏移（分鐘）
      const playedTaiwanTime = new Date(playedDate.getTime() + taiwanOffset * 60 * 1000);
      const todayTaiwanTime = new Date(today.getTime() + taiwanOffset * 60 * 1000);
      
      const isSameDay = playedTaiwanTime.getUTCDate() === todayTaiwanTime.getUTCDate() &&
                        playedTaiwanTime.getUTCMonth() === todayTaiwanTime.getUTCMonth() &&
                        playedTaiwanTime.getUTCFullYear() === todayTaiwanTime.getUTCFullYear();
      
      return isSameDay;
    });

    return !!todayPlayRecord;
  } catch (error) {
    console.error('檢查遊戲記錄失敗:', error);
    return false;
  }
}

/**
 * 取得會員統計
 */
export async function getMemberStatistics() {
  try {
    // 查詢所有會員
    const membersSnapshot = await getDocs(collection(db, 'members'));
    
    const stats = {
      total: 0,
      active: 0,
      inactive: 0,
      vip: 0,
      suspended: 0
    };

    membersSnapshot.docs.forEach(doc => {
      const member = doc.data() as Member;
      stats.total++;
      
      switch (member.status) {
        case 'active':
          stats.active++;
          break;
        case 'inactive':
          stats.inactive++;
          break;
        case 'vip':
          stats.vip++;
          break;
        case 'suspended':
          stats.suspended++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error('查詢會員統計失敗:', error);
    return null;
  }
}

/**
 * 搜尋會員（供管理後台使用）
 */
export async function searchMembers(searchTerm: string, limit: number = 20): Promise<Member[]> {
  try {
    // 注意：這是簡單的實作，實際應用可能需要更複雜的搜尋
    const membersSnapshot = await getDocs(collection(db, 'members'));
    
    const searchLower = searchTerm.toLowerCase();
    const results: Member[] = [];

    membersSnapshot.docs.forEach(doc => {
      const member = { id: doc.id, ...doc.data() } as Member;
      
      if (
        member.email.toLowerCase().includes(searchLower) ||
        member.name.toLowerCase().includes(searchLower)
      ) {
        results.push(member);
      }
    });

    return results.slice(0, limit);
  } catch (error) {
    console.error('搜尋會員失敗:', error);
    return [];
  }
}

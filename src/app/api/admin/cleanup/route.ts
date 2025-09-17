import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/firestore';

// 清理結果統計
interface CleanupStats {
  emailVerifications: {
    expired: number;
    used: number;
  };
  gameTokens: {
    expired: number;
    used: number;
  };
  gameHistory: {
    old: number;
  };
  totalCleaned: number;
}

export async function POST(request: NextRequest) {
  try {
    // 簡單的驗證 - 在實際環境中應該有更嚴格的身份驗證
    const { adminKey } = await request.json();
    if (adminKey !== 'cleanup-324-games') {
      return NextResponse.json({
        success: false,
        message: '無效的管理員金鑰'
      }, { status: 401 });
    }

    const stats: CleanupStats = {
      emailVerifications: { expired: 0, used: 0 },
      gameTokens: { expired: 0, used: 0 },
      gameHistory: { old: 0 },
      totalCleaned: 0
    };

    const now = new Date();

    // 1. 清理過期的 emailVerifications - 簡化查詢避免複合索引
    console.log('🧹 開始清理過期的 email 驗證記錄...');
    const allEmailVerifications = await getDocs(collection(db, 'emailVerifications'));
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    for (const docSnapshot of allEmailVerifications.docs) {
      const data = docSnapshot.data();
      const expiresAt = data.expiresAt?.toDate();
      const createdAt = data.createdAt?.toDate();
      const used = data.used;
      
      // 清理過期的記錄
      if (expiresAt && expiresAt < now) {
        await deleteDoc(docSnapshot.ref);
        stats.emailVerifications.expired++;
      }
      // 清理已使用且超過1天的記錄
      else if (used && createdAt && createdAt < oneDayAgo) {
        await deleteDoc(docSnapshot.ref);
        stats.emailVerifications.used++;
      }
    }

    // 2. 清理過期和已使用的 gameTokens - 簡化查詢避免複合索引
    console.log('🧹 開始清理過期的遊戲令牌...');
    const allGameTokens = await getDocs(collection(db, 'gameTokens'));
    
    for (const docSnapshot of allGameTokens.docs) {
      const data = docSnapshot.data();
      const expiresAt = data.expiresAt?.toDate();
      const createdAt = data.createdAt?.toDate();
      const used = data.used;
      
      // 清理過期的記錄
      if (expiresAt && expiresAt < now) {
        await deleteDoc(docSnapshot.ref);
        stats.gameTokens.expired++;
      }
      // 清理已使用且超過1天的記錄
      else if (used && createdAt && createdAt < oneDayAgo) {
        await deleteDoc(docSnapshot.ref);
        stats.gameTokens.used++;
      }
    }

    // 3. 清理過舊的 gameHistory (超過90天的記錄) - 簡化查詢避免複合索引
    console.log('🧹 開始清理過舊的遊戲歷史記錄...');
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const allGameHistory = await getDocs(collection(db, 'gameHistory'));
    
    for (const docSnapshot of allGameHistory.docs) {
      const data = docSnapshot.data();
      const playedAt = data.playedAt?.toDate();
      
      // 清理90天前的記錄
      if (playedAt && playedAt < ninetyDaysAgo) {
        await deleteDoc(docSnapshot.ref);
        stats.gameHistory.old++;
      }
    }

    // 計算總清理數量
    stats.totalCleaned = 
      stats.emailVerifications.expired + 
      stats.emailVerifications.used + 
      stats.gameTokens.expired + 
      stats.gameTokens.used + 
      stats.gameHistory.old;

    console.log('✅ 資料清理完成:', stats);

    return NextResponse.json({
      success: true,
      message: `清理完成！共清理了 ${stats.totalCleaned} 筆記錄`,
      data: stats
    });

  } catch (error) {
    console.error('資料清理失敗:', error);
    return NextResponse.json({
      success: false,
      message: `清理失敗：${error instanceof Error ? error.message : '未知錯誤'}`,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

// GET 方法用於檢查需要清理的資料量 - 簡化查詢避免複合索引
export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const cleanupNeeded = {
      emailVerifications: { expired: 0, used: 0 },
      gameTokens: { expired: 0, used: 0 },
      gameHistory: { old: 0 },
      totalToClean: 0
    };

    // 檢查 emailVerifications
    const allEmailVerifications = await getDocs(collection(db, 'emailVerifications'));
    allEmailVerifications.docs.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate();
      const createdAt = data.createdAt?.toDate();
      const used = data.used;
      
      if (expiresAt && expiresAt < now) {
        cleanupNeeded.emailVerifications.expired++;
      } else if (used && createdAt && createdAt < oneDayAgo) {
        cleanupNeeded.emailVerifications.used++;
      }
    });

    // 檢查 gameTokens
    const allGameTokens = await getDocs(collection(db, 'gameTokens'));
    allGameTokens.docs.forEach(doc => {
      const data = doc.data();
      const expiresAt = data.expiresAt?.toDate();
      const createdAt = data.createdAt?.toDate();
      const used = data.used;
      
      if (expiresAt && expiresAt < now) {
        cleanupNeeded.gameTokens.expired++;
      } else if (used && createdAt && createdAt < oneDayAgo) {
        cleanupNeeded.gameTokens.used++;
      }
    });

    // 檢查 gameHistory
    const allGameHistory = await getDocs(collection(db, 'gameHistory'));
    allGameHistory.docs.forEach(doc => {
      const data = doc.data();
      const playedAt = data.playedAt?.toDate();
      
      if (playedAt && playedAt < ninetyDaysAgo) {
        cleanupNeeded.gameHistory.old++;
      }
    });

    // 計算總數
    cleanupNeeded.totalToClean = 
      cleanupNeeded.emailVerifications.expired + 
      cleanupNeeded.emailVerifications.used + 
      cleanupNeeded.gameTokens.expired + 
      cleanupNeeded.gameTokens.used + 
      cleanupNeeded.gameHistory.old;

    return NextResponse.json({
      success: true,
      message: '清理檢查完成',
      data: cleanupNeeded
    });

  } catch (error) {
    console.error('清理檢查失敗:', error);
    return NextResponse.json({
      success: false,
      message: `檢查失敗：${error instanceof Error ? error.message : '未知錯誤'}`
    }, { status: 500 });
  }
}

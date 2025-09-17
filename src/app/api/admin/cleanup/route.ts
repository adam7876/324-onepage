import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, deleteDoc, Timestamp } from 'firebase/firestore';
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

    // 1. 清理過期的 emailVerifications
    console.log('🧹 開始清理過期的 email 驗證記錄...');
    const emailVerificationsQuery = query(
      collection(db, 'emailVerifications'),
      where('expiresAt', '<', Timestamp.fromDate(now))
    );
    const expiredEmailVerifications = await getDocs(emailVerificationsQuery);
    
    for (const docSnapshot of expiredEmailVerifications.docs) {
      await deleteDoc(docSnapshot.ref);
      stats.emailVerifications.expired++;
    }

    // 2. 清理已使用的 emailVerifications (超過1天)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const usedEmailVerificationsQuery = query(
      collection(db, 'emailVerifications'),
      where('used', '==', true),
      where('createdAt', '<', Timestamp.fromDate(oneDayAgo))
    );
    const usedEmailVerifications = await getDocs(usedEmailVerificationsQuery);
    
    for (const docSnapshot of usedEmailVerifications.docs) {
      await deleteDoc(docSnapshot.ref);
      stats.emailVerifications.used++;
    }

    // 3. 清理過期的 gameTokens
    console.log('🧹 開始清理過期的遊戲令牌...');
    const gameTokensQuery = query(
      collection(db, 'gameTokens'),
      where('expiresAt', '<', Timestamp.fromDate(now))
    );
    const expiredGameTokens = await getDocs(gameTokensQuery);
    
    for (const docSnapshot of expiredGameTokens.docs) {
      await deleteDoc(docSnapshot.ref);
      stats.gameTokens.expired++;
    }

    // 4. 清理已使用的 gameTokens (超過1天)
    const usedGameTokensQuery = query(
      collection(db, 'gameTokens'),
      where('used', '==', true),
      where('createdAt', '<', Timestamp.fromDate(oneDayAgo))
    );
    const usedGameTokens = await getDocs(usedGameTokensQuery);
    
    for (const docSnapshot of usedGameTokens.docs) {
      await deleteDoc(docSnapshot.ref);
      stats.gameTokens.used++;
    }

    // 5. 清理過舊的 gameHistory (超過90天的記錄)
    console.log('🧹 開始清理過舊的遊戲歷史記錄...');
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const oldGameHistoryQuery = query(
      collection(db, 'gameHistory'),
      where('playedAt', '<', Timestamp.fromDate(ninetyDaysAgo))
    );
    const oldGameHistory = await getDocs(oldGameHistoryQuery);
    
    for (const docSnapshot of oldGameHistory.docs) {
      await deleteDoc(docSnapshot.ref);
      stats.gameHistory.old++;
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

// GET 方法用於檢查需要清理的資料量
export async function GET() {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 檢查各種需要清理的資料數量
    const expiredEmailVerifications = await getDocs(query(
      collection(db, 'emailVerifications'),
      where('expiresAt', '<', Timestamp.fromDate(now))
    ));

    const usedEmailVerifications = await getDocs(query(
      collection(db, 'emailVerifications'),
      where('used', '==', true),
      where('createdAt', '<', Timestamp.fromDate(oneDayAgo))
    ));

    const expiredGameTokens = await getDocs(query(
      collection(db, 'gameTokens'),
      where('expiresAt', '<', Timestamp.fromDate(now))
    ));

    const usedGameTokens = await getDocs(query(
      collection(db, 'gameTokens'),
      where('used', '==', true),
      where('createdAt', '<', Timestamp.fromDate(oneDayAgo))
    ));

    const oldGameHistory = await getDocs(query(
      collection(db, 'gameHistory'),
      where('playedAt', '<', Timestamp.fromDate(ninetyDaysAgo))
    ));

    const cleanupNeeded = {
      emailVerifications: {
        expired: expiredEmailVerifications.size,
        used: usedEmailVerifications.size
      },
      gameTokens: {
        expired: expiredGameTokens.size,
        used: usedGameTokens.size
      },
      gameHistory: {
        old: oldGameHistory.size
      },
      totalToClean: expiredEmailVerifications.size + usedEmailVerifications.size + 
                    expiredGameTokens.size + usedGameTokens.size + oldGameHistory.size
    };

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

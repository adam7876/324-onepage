import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/firestore';
import { generateCouponCode } from '../../../../lib/game-utils';
import type { GameRecord } from '../../../../lib/game-types';

export async function POST(request: NextRequest) {
  try {
    const { token, gameType, result } = await request.json();

    if (!token || !gameType || !result) {
      return NextResponse.json({
        success: false,
        message: '參數不完整'
      }, { status: 400 });
    }

    // 查找並驗證token
    const tokenQuery = query(
      collection(db, 'gameTokens'),
      where('token', '==', token),
      where('gameType', '==', gameType),
      where('used', '==', false)
    );

    const tokenSnapshot = await getDocs(tokenQuery);

    if (tokenSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'Token無效或已使用'
      }, { status: 400 });
    }

    const tokenDoc = tokenSnapshot.docs[0];
    const tokenData = tokenDoc.data();

    // 檢查是否過期
    const now = new Date();
    if (tokenData.expiresAt.toDate() < now) {
      return NextResponse.json({
        success: false,
        message: 'Token已過期'
      }, { status: 400 });
    }

    // 準備遊戲記錄
    const gameRecord: Omit<GameRecord, 'id'> = {
      email: tokenData.email,
      gameType,
      result: result.result,
      playedAt: Timestamp.fromDate(now),
    };

    // 如果中獎，生成獎勵代碼（含免運券）
    if (result.result === 'win' && result.reward) {
      gameRecord.reward = {
        type: result.reward.type || 'coupon',
        name: result.reward.name,
        value: result.reward.value,
        code: generateCouponCode(),
      };
    }

    // 儲存遊戲記錄
    await addDoc(collection(db, 'gameHistory'), gameRecord);

    // 更新會員數據
    const memberQuery = query(
      collection(db, 'members'),
      where('email', '==', tokenData.email.toLowerCase().trim())
    );
    const memberSnapshot = await getDocs(memberQuery);
    
    if (!memberSnapshot.empty) {
      const memberDoc = memberSnapshot.docs[0];
      const memberData = memberDoc.data();
      
      // 更新會員的遊戲歷史
      await updateDoc(doc(db, 'members', memberDoc.id), {
        'gameHistory.lastPlayed': Timestamp.fromDate(now),
        'gameHistory.totalPlays': (memberData.gameHistory?.totalPlays || 0) + 1,
        updatedAt: Timestamp.fromDate(now)
      });
    }

    // 標記token為已使用
    await updateDoc(doc(db, 'gameTokens', tokenDoc.id), {
      used: true
    });

    return NextResponse.json({
      success: true,
      message: '遊戲結果已記錄',
      data: gameRecord
    });

  } catch (error) {
    console.error('提交遊戲結果失敗:', error);
    return NextResponse.json({
      success: false,
      message: '系統錯誤，請稍後再試'
    }, { status: 500 });
  }
}

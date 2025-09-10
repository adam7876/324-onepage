import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/firestore';
import { generateGameToken } from '../../../../lib/game-utils';
import { GAME_CONFIG } from '../../../../lib/game-config';
import type { GameToken } from '../../../../lib/game-types';

export async function POST(request: NextRequest) {
  try {
    const { email, code, gameType } = await request.json();

    // 驗證參數
    if (!email || !code || !gameType) {
      return NextResponse.json({
        success: false,
        message: '參數不完整'
      }, { status: 400 });
    }

    // 檢查遊戲類型是否有效
    const validGame = GAME_CONFIG.games.find(g => g.id === gameType && g.enabled);
    if (!validGame) {
      return NextResponse.json({
        success: false,
        message: '無效的遊戲類型'
      }, { status: 400 });
    }

    // 查找驗證記錄
    const verificationQuery = query(
      collection(db, 'emailVerifications'),
      where('email', '==', email),
      where('code', '==', code),
      where('used', '==', false)
    );

    const verificationSnapshot = await getDocs(verificationQuery);
    
    if (verificationSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: '驗證碼無效或已使用'
      }, { status: 400 });
    }

    const verificationDoc = verificationSnapshot.docs[0];
    const verificationData = verificationDoc.data();

    // 檢查是否過期
    const now = new Date();
    if (verificationData.expiresAt.toDate() < now) {
      return NextResponse.json({
        success: false,
        message: '驗證碼已過期，請重新獲取'
      }, { status: 400 });
    }

    // 生成遊戲token
    const token = generateGameToken();
    const tokenExpiresAt = new Date(now.getTime() + GAME_CONFIG.tokenExpiryHours * 60 * 60 * 1000);

    // 儲存遊戲token
    const tokenData: Omit<GameToken, 'id'> = {
      token,
      email,
      gameType,
      used: false,
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(tokenExpiresAt),
    };

    await addDoc(collection(db, 'gameTokens'), tokenData);

    // 標記驗證碼為已使用
    await updateDoc(doc(db, 'emailVerifications', verificationDoc.id), {
      used: true
    });

    return NextResponse.json({
      success: true,
      message: '驗證成功',
      data: {
        token,
        gameType,
        expiresAt: tokenExpiresAt.toISOString()
      }
    });

  } catch (error) {
    console.error('驗證失敗:', error);
    return NextResponse.json({
      success: false,
      message: '系統錯誤，請稍後再試'
    }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { token, gameType } = await request.json();

    if (!token || !gameType) {
      return NextResponse.json({
        success: false,
        message: '參數不完整'
      }, { status: 400 });
    }

    // 查找token
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

    return NextResponse.json({
      success: true,
      message: 'Token驗證成功',
      data: {
        email: tokenData.email,
        gameType: tokenData.gameType,
        createdAt: tokenData.createdAt.toDate(),
        expiresAt: tokenData.expiresAt.toDate()
      }
    });

  } catch (error) {
    console.error('Token驗證失敗:', error);
    return NextResponse.json({
      success: false,
      message: '系統錯誤，請稍後再試'
    }, { status: 500 });
  }
}

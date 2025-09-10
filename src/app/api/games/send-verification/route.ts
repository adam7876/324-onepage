import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../../firebase/firestore';
import { generateVerificationCode, isValidEmail, getTodayStart } from '../../../../lib/game-utils';
import type { EmailVerification } from '../../../../lib/game-types';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // 驗證email格式
    if (!isValidEmail(email)) {
      return NextResponse.json({
        success: false,
        message: '請輸入有效的Email地址'
      }, { status: 400 });
    }

    // 檢查今天是否已經玩過
    const todayStart = getTodayStart();
    const gameHistoryQuery = query(
      collection(db, 'gameHistory'),
      where('email', '==', email),
      where('playedAt', '>=', Timestamp.fromDate(todayStart))
    );

    const gameHistorySnapshot = await getDocs(gameHistoryQuery);
    if (!gameHistorySnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: '您今天已經玩過遊戲了，明天再來吧！'
      }, { status: 400 });
    }

    // 檢查是否已有未使用的驗證碼（10分鐘內）
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const verificationQuery = query(
      collection(db, 'emailVerifications'),
      where('email', '==', email),
      where('used', '==', false),
      where('createdAt', '>=', Timestamp.fromDate(tenMinutesAgo))
    );

    const verificationSnapshot = await getDocs(verificationQuery);
    if (!verificationSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: '驗證碼已發送，請檢查您的信箱，10分鐘後可重新發送'
      }, { status: 400 });
    }

    // 生成驗證碼
    const code = generateVerificationCode();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10分鐘後過期

    // 儲存驗證記錄
    const verificationData: Omit<EmailVerification, 'id'> = {
      email,
      code,
      used: false,
      createdAt: Timestamp.fromDate(now),
      expiresAt: Timestamp.fromDate(expiresAt),
    };

    await addDoc(collection(db, 'emailVerifications'), verificationData);

    // 這裡應該發送email，暫時先在console顯示
    console.log(`驗證碼發送給 ${email}: ${code}`);

    // TODO: 實際部署時需要整合真實的郵件服務
    // 例如：SendGrid, AWS SES, 或其他郵件服務

    return NextResponse.json({
      success: true,
      message: '驗證碼已發送，請查收您的信箱',
      // 開發和測試環境下顯示驗證碼，方便測試
      code: code
    });

  } catch (error) {
    console.error('發送驗證碼失敗:', error);
    return NextResponse.json({
      success: false,
      message: `系統錯誤：${error instanceof Error ? error.message : '未知錯誤'}`,
      error: error instanceof Error ? error.message : '未知錯誤'
    }, { status: 500 });
  }
}

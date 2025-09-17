import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase/firestore';
import { generateVerificationCode, isValidEmail, isCommonEmailProvider } from '../../../../lib/game-utils';
import type { EmailVerification } from '../../../../lib/game-types';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // 驗證email格式和真實性
    if (!isValidEmail(email)) {
      return NextResponse.json({
        success: false,
        message: '請輸入有效的Email地址，不支援臨時或測試信箱'
      }, { status: 400 });
    }

    // 檢查是否為常見的 email 提供商（可選的額外保護）
    if (!isCommonEmailProvider(email)) {
      console.log(`⚠️ 非常見 email 提供商: ${email}`);
      // 暫時只記錄，不阻擋（您可以根據需要調整）
    }

    // 檢查該email今天是否已經玩過遊戲
    const gameHistoryQuery = query(
      collection(db, 'gameHistory'),
      where('email', '==', email)
    );

    const gameHistorySnapshot = await getDocs(gameHistoryQuery);
    
    // 檢查是否有今天的記錄
    const todayPlayRecord = gameHistorySnapshot.docs.find(doc => {
      const playedAt = doc.data().playedAt?.toDate();
      if (!playedAt) return false;
      
      // 檢查是否為今天
      const playedDate = new Date(playedAt);
      const today = new Date();
      return playedDate.getDate() === today.getDate() &&
             playedDate.getMonth() === today.getMonth() &&
             playedDate.getFullYear() === today.getFullYear();
    });

    if (todayPlayRecord) {
      return NextResponse.json({
        success: false,
        message: '您今天已經玩過遊戲了，明天再來試試吧！🎮'
      }, { status: 400 });
    }

    // 檢查是否在短時間內重複發送驗證碼
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const verificationQuery = query(
      collection(db, 'emailVerifications'),
      where('email', '==', email)
    );

    const verificationSnapshot = await getDocs(verificationQuery);
    
    // 檢查是否有5分鐘內的未使用驗證碼
    const recentVerification = verificationSnapshot.docs.find(doc => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate();
      return createdAt && 
             createdAt > fiveMinutesAgo && 
             !data.used;
    });

    if (recentVerification) {
      return NextResponse.json({
        success: false,
        message: '驗證碼已發送，請檢查您的信箱。5分鐘後可重新發送 📧'
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

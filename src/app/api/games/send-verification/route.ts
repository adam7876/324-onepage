import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase/firestore';
import { generateVerificationCode } from '../../../../lib/game-utils';
import { validateMemberForGame } from '../../../../lib/member-service';
import type { EmailVerification } from '../../../../lib/game-types';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // 驗證會員身份和遊戲資格
    const memberValidation = await validateMemberForGame(email);
    
    if (!memberValidation.valid) {
      return NextResponse.json({
        success: false,
        message: memberValidation.message
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

    // 直接回傳驗證碼（不發送 email）
    console.log(`🎮 會員 ${memberValidation.member?.name} (${email}) 驗證成功，驗證碼: ${code}`);

    return NextResponse.json({
      success: true,
      message: `${memberValidation.message}`,
      code: code // 直接顯示驗證碼
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

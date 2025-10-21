import { NextRequest, NextResponse } from 'next/server';
import { confirmLinePayPayment } from '@/lib/linepay-service';
import { collection, query, where, getDocs, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

// 處理 GET 請求（LINE Pay 重定向）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get('transactionId');
    const orderNumber = searchParams.get('orderId');

    if (!orderNumber || !transactionId) {
      return NextResponse.redirect(
        new URL('/checkout/failed?reason=missing_params', request.url)
      );
    }

    // 查詢訂單
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', orderNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.redirect(
        new URL('/checkout/failed?reason=order_not_found', request.url)
      );
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();

    // 確認付款
    const result = await confirmLinePayPayment(transactionId, orderData.total);
    
    if (result.success) {
      // 更新訂單狀態
      await updateDoc(orderDoc.ref, {
        status: '已付款',
        paymentStatus: '已付款',
        paidAt: Timestamp.now(),
        tradeNo: transactionId,
      });

      return NextResponse.redirect(
        new URL(`/checkout/success?orderNumber=${orderNumber}&transactionId=${transactionId}`, request.url)
      );
    } else {
      return NextResponse.redirect(
        new URL('/checkout/failed?reason=payment_failed', request.url)
      );
    }
  } catch (error) {
    console.error('LINE Pay confirm API error:', error);
    return NextResponse.redirect(
      new URL('/checkout/failed?reason=internal_error', request.url)
    );
  }
}

// 處理 POST 請求（API 呼叫）
export async function POST(request: NextRequest) {
  try {
    const { transactionId, amount, orderNumber } = await request.json();

    // 安全驗證
    if (!transactionId || !amount || !orderNumber) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 從 Firestore 取得訂單資料（根據 orderNumber 查詢）
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', orderNumber));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderDoc = querySnapshot.docs[0];
    const orderData = orderDoc.data();

    // 安全驗證：檢查訂單狀態
    if (orderData.paymentStatus !== '已請款') {
      return NextResponse.json(
        { success: false, error: 'Order not in correct state for confirmation' },
        { status: 400 }
      );
    }

    // 安全驗證：金額比對
    if (orderData.amountExpected !== amount) {
      console.error(`Amount mismatch for order ${orderNumber}: expected ${orderData.amountExpected}, got ${amount}`);
      return NextResponse.json(
        { success: false, error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // 確認 LINE Pay 付款
    const result = await confirmLinePayPayment(transactionId, amount);

    if (result.success) {
      // 更新訂單狀態為「已付款」
      await updateDoc(orderDoc.ref, {
        status: '已付款',
        paymentStatus: '已付款',
        paidAt: Timestamp.now(),
        tradeNo: transactionId,
      });

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed successfully',
      });
    } else {
      // 更新訂單狀態為「付款失敗」
      await updateDoc(orderDoc.ref, {
        paymentStatus: '付款失敗',
      });

      return NextResponse.json(
        { success: false, error: result.error || 'Payment confirmation failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('LINE Pay confirm API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createLinePayRequest } from '@/lib/linepay-service';
import { validateLinePayConfig } from '@/lib/linepay-config';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

export async function POST(request: NextRequest) {
  let orderNumber: string | undefined;
  
  try {
    // 安全驗證配置
    validateLinePayConfig();
    
    // API 認證檢查
    const apiKey = request.headers.get('x-api-key');
    const authHeader = request.headers.get('authorization');
    const expectedApiKey = process.env.INTERNAL_API_KEY || 'linepay-internal';
    
    if (apiKey !== expectedApiKey || !authHeader?.includes(expectedApiKey)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized API access' },
        { status: 401 }
      );
    }

    const body = await request.json();
    orderNumber = body.orderNumber;
    const orderData = body.orderData; // 從前端傳來的訂單資料

    if (!orderNumber || !orderData) {
      return NextResponse.json(
        { success: false, error: 'Order number and data are required' },
        { status: 400 }
      );
    }

    // 檢查是否已存在相同訂單編號
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', orderNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Order number already exists' },
        { status: 400 }
      );
    }

    // 建立待付款訂單
    const pendingOrderData = {
      ...orderData,
      status: '待付款',
      paymentStatus: '未請款',
      createdAt: Timestamp.now(),
    };
    
    await addDoc(collection(db, 'orders'), pendingOrderData);

    // 安全驗證：檢查訂單狀態
    if (orderData.paymentStatus !== '未請款') {
      return NextResponse.json(
        { success: false, error: 'Order already processed' },
        { status: 400 }
      );
    }

    // 準備 LINE Pay 請求資料
    const linePayData = {
      orderNumber: orderData.orderNumber,
      amount: orderData.amountExpected,
      items: orderData.items.map((item: { name: string; quantity: number; price: number }) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      customerName: orderData.name,
    };

    // 建立 LINE Pay 付款請求
    const result = await createLinePayRequest(linePayData);

    if (result.success && result.paymentUrl) {
      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Payment request failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('LINE Pay request API error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      orderNumber: orderNumber || 'unknown',
    });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

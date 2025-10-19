import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderNumber = searchParams.get('orderId');

    if (!orderNumber) {
      return NextResponse.redirect(
        new URL('/checkout/failed?reason=no_order_id', request.url)
      );
    }

    // 更新訂單狀態為「已取消」
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderNumber', '==', orderNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const orderDoc = querySnapshot.docs[0];
      await updateDoc(orderDoc.ref, {
        paymentStatus: '已取消',
        cancelledAt: Timestamp.now(),
      });
    }

    // 重導向到取消頁面
    return NextResponse.redirect(
      new URL(`/checkout/cancelled?orderNumber=${orderNumber}`, request.url)
    );
  } catch (error) {
    console.error('LINE Pay cancel API error:', error);
    return NextResponse.redirect(
      new URL('/checkout/failed?reason=system_error', request.url)
    );
  }
}

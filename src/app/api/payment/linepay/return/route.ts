import { NextRequest, NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transactionId');
  const orderNumber = searchParams.get('orderId');
  const status = searchParams.get('status');

  // 根據付款狀態重導向到相應頁面
  if (status === 'success' && transactionId && orderNumber) {
    // 付款成功，重導向到成功頁面
    return NextResponse.redirect(
      new URL(`/checkout/success?orderNumber=${orderNumber}&transactionId=${transactionId}`, request.url)
    );
  } else {
    // 付款失敗或取消，重導向到失敗頁面
    return NextResponse.redirect(
      new URL(`/checkout/failed?orderNumber=${orderNumber}&reason=${status || 'unknown'}`, request.url)
    );
  }
}

/**
 * 管理員手動取消 PayNow 物流訂單 API
 */

import { NextRequest, NextResponse } from 'next/server';
import { AdminAuth } from '@/lib/admin-auth';
import { getDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { getPayNowConfig } from '@/config/paynow.config';
import { generatePayNowPassCode } from '@/lib/paynow-crypto';

export async function POST(request: NextRequest) {
  try {
    const auth = await AdminAuth.verifyAdmin(request);
    if (!auth.success) return AdminAuth.createUnauthorizedResponse(auth.error);

    const { orderId } = await request.json() as { orderId: string };
    if (!orderId) {
      return NextResponse.json({ success: false, error: '訂單 ID 是必需的' }, { status: 400 });
    }

    const orderRef = doc(db, 'orders', orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return NextResponse.json({ success: false, error: '訂單不存在' }, { status: 404 });

    const order = snap.data() as any;
    const logisticsNo = order?.logisticsInfo?.logisticsNo;
    if (!logisticsNo) return NextResponse.json({ success: false, error: '此訂單尚無物流單號' }, { status: 400 });

    // 呼叫 PayNow 取消 API
    const cfg = getPayNowConfig();
    const passCode = generatePayNowPassCode(cfg.userAccount, order.orderNumber, String(order.total || 0), cfg.apiCode);
    const params = new URLSearchParams({
      LogisticNumber: logisticsNo,
      sno: '1',
      PassCode: passCode
    });

    const resp = await fetch(`${cfg.baseUrl}/api/Orderapi/CancelOrder`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const text = await resp.text();
    const success = text.startsWith('S,');

    if (success) {
      await updateDoc(orderRef, {
        'logisticsInfo.logisticsNo': '',
        'logisticsInfo.logisticsStatus': 'pending',
        'logisticsInfo.deliveredAt': null,
        cancelledAt: Timestamp.now(),
      });
    }

    return NextResponse.json({ success, message: text });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}



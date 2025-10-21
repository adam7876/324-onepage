/**
 * 訂單狀態遷移 API
 * 將「待匯款」狀態統一為「待付款」
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase/firestore';
import { securityService } from '@/services/security.service';

export async function POST(request: NextRequest) {
  try {
    securityService.logApiCall('/api/admin/migrate-order-status', 'POST');
    
    // 查詢所有「待匯款」的訂單
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('status', '==', '待匯款'));
    const querySnapshot = await getDocs(q);
    
    console.log(`找到 ${querySnapshot.size} 筆「待匯款」訂單`);
    
    if (querySnapshot.size === 0) {
      return NextResponse.json({
        success: true,
        message: '沒有需要遷移的訂單',
        updatedCount: 0
      });
    }
    
    // 批量更新訂單狀態
    const updatePromises = [];
    querySnapshot.forEach((orderDoc) => {
      console.log(`更新訂單 ${orderDoc.id}: 待匯款 → 待付款`);
      updatePromises.push(
        updateDoc(doc(db, 'orders', orderDoc.id), {
          status: '待付款'
        })
      );
    });
    
    await Promise.all(updatePromises);
    
    securityService.logOrderEvent('status_migration_completed', {
      updatedCount: querySnapshot.size,
      fromStatus: '待匯款',
      toStatus: '待付款'
    });
    
    return NextResponse.json({
      success: true,
      message: '訂單狀態遷移完成',
      updatedCount: querySnapshot.size
    });
    
  } catch (error) {
    console.error('訂單狀態遷移失敗:', error);
    securityService.logError(error as Error, { endpoint: '/api/admin/migrate-order-status' });
    
    return NextResponse.json(
      { success: false, error: '遷移失敗' },
      { status: 500 }
    );
  }
}

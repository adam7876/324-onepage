/**
 * 訂單服務層
 * 統一管理訂單相關邏輯
 */

import { db } from '../firebase/firestore';
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import type { Order, CartItem, OrderService, LogisticsInfo } from '../types';

// 使用統一類型定義，移除重複的介面定義

class OrderServiceImpl implements OrderService {
  async createOrder(orderData: Partial<Order>): Promise<string> {
    try {
      this.logOrderAction('create_start', orderData);
      
      const orderRef = await addDoc(collection(db, 'orders'), {
        ...orderData,
        createdAt: Timestamp.now(),
      });

      this.logOrderAction('create_success', { id: orderRef.id, ...orderData });
      return orderRef.id;
    } catch (error) {
      this.logOrderAction('create_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      this.logOrderAction('get_by_number_start', { orderNumber });
      
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('orderNumber', '==', orderNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        this.logOrderAction('get_by_number_not_found', { orderNumber });
        return null;
      }

      const orderDoc = querySnapshot.docs[0];
      const orderData = { id: orderDoc.id, ...orderDoc.data() } as Order;
      
      this.logOrderAction('get_by_number_success', { orderNumber, orderId: orderDoc.id });
      return orderData;
    } catch (error) {
      this.logOrderAction('get_by_number_error', { orderNumber, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<void> {
    try {
      this.logOrderAction('update_status_start', { orderId, status });
      
      await updateDoc(doc(db, 'orders', orderId), { status });
      
      this.logOrderAction('update_status_success', { orderId, status });
    } catch (error) {
      this.logOrderAction('update_status_error', { orderId, status, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async deleteOrder(orderId: string): Promise<void> {
    try {
      this.logOrderAction('delete_start', { orderId });
      
      await deleteDoc(doc(db, 'orders', orderId));
      
      this.logOrderAction('delete_success', { orderId });
    } catch (error) {
      this.logOrderAction('delete_error', { orderId, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async batchDeleteOrders(orderIds: string[]): Promise<void> {
    try {
      this.logOrderAction('batch_delete_start', { orderIds });
      
      const deletePromises = orderIds.map(orderId => deleteDoc(doc(db, 'orders', orderId)));
      await Promise.all(deletePromises);
      
      this.logOrderAction('batch_delete_success', { orderIds });
    } catch (error) {
      this.logOrderAction('batch_delete_error', { orderIds, error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  async generateOrderNumber(): Promise<string> {
    try {
      this.logOrderAction('generate_order_number_start', {});
      
      const now = new Date();
      const yyyy = String(now.getFullYear());
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}${mm}${dd}`;

      // 使用 Firestore 交易來確保原子性
      const { runTransaction, doc } = await import('firebase/firestore');
      const seqRef = doc(db, 'counters', `order-${dateKey}`);
      const seq = await runTransaction(db, async (tx) => {
        const snap = await tx.get(seqRef);
        const current = snap.exists() ? (snap.data().seq as number) : 0;
        const next = current + 1;
        if (snap.exists()) {
          tx.update(seqRef, { seq: next });
        } else {
          tx.set(seqRef, { seq: next, date: dateKey });
        }
        return next;
      });

      const orderNumber = `${dateKey}${String(seq).padStart(3, '0')}`;
      
      this.logOrderAction('generate_order_number_success', { orderNumber });
      return orderNumber;
    } catch (error) {
      this.logOrderAction('generate_order_number_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  processOrderData(formData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    shipping: string;
    payment: string;
    customerNotes: string;
    logisticsInfo?: LogisticsInfo;
  }, cart: CartItem[]): Order {
    try {
      this.logOrderAction('process_order_data_start', { formData, cartCount: cart.length });
      
      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      // 清理購物車資料
      const cleanCart = cart.map(item => ({
        ...item,
        name: item.name ?? "",
        price: item.price ?? 0,
        quantity: item.quantity ?? 1,
        imageUrl: item.imageUrl ?? "",
      }));
      
      const orderData: Order = {
        orderNumber: "", // 將由 generateOrderNumber 設定
        name: formData.name ?? "",
        email: formData.email ?? "",
        phone: formData.phone ?? "",
        address: formData.address ?? "",
        shipping: formData.shipping ?? "7-11 超商取貨",
        payment: formData.payment ?? "銀行匯款",
        customerNotes: formData.customerNotes ?? "",
        items: cleanCart,
        total: total,
        amountExpected: total,
        paymentStatus: "未請款",
        tradeNo: "",
        status: "待付款",
        createdAt: Timestamp.now(),
        // 7-11 店到店物流資訊
        logisticsInfo: formData.logisticsInfo,
      };
      
      this.logOrderAction('process_order_data_success', { orderData });
      return orderData;
    } catch (error) {
      this.logOrderAction('process_order_data_error', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw error;
    }
  }

  private logOrderAction(action: string, data: unknown): void {
    console.log(`Order ${action}:`, {
      action,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

// 單例模式
export const orderService = new OrderServiceImpl();

/**
 * 訂單服務層
 * 統一管理訂單相關邏輯
 */

import { db } from '../firebase/firestore';
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { CartItem } from './cart.service';

export interface Order {
  id?: string;
  orderNumber: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  shipping: string;
  payment: string;
  customerNotes?: string;
  items: CartItem[];
  total: number;
  amountExpected: number;
  paymentStatus: '未請款' | '已請款' | '已付款' | '付款失敗' | '已退款';
  paymentRequestedAt?: Timestamp;
  paidAt?: Timestamp;
  tradeNo?: string;
  status: string;
  createdAt: Timestamp;
}

export interface OrderService {
  createOrder(orderData: Partial<Order>): Promise<string>;
  getOrderByNumber(orderNumber: string): Promise<Order | null>;
  updateOrderStatus(orderId: string, status: string): Promise<void>;
  deleteOrder(orderId: string): Promise<void>;
  batchDeleteOrders(orderIds: string[]): Promise<void>;
  generateOrderNumber(): Promise<string>;
}

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
      
      const today = new Date();
      const dateStr = today.getFullYear().toString() + 
                     (today.getMonth() + 1).toString().padStart(2, '0') + 
                     today.getDate().toString().padStart(2, '0');
      
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('orderNumber', '>=', dateStr + '000'));
      const querySnapshot = await getDocs(q);
      
      const existingNumbers = querySnapshot.docs
        .map(doc => doc.data().orderNumber)
        .filter(num => num.startsWith(dateStr))
        .map(num => parseInt(num.slice(8)))
        .sort((a, b) => b - a);
      
      const nextSequence = (existingNumbers[0] || 0) + 1;
      const orderNumber = dateStr + nextSequence.toString().padStart(3, '0');
      
      this.logOrderAction('generate_order_number_success', { orderNumber });
      return orderNumber;
    } catch (error) {
      this.logOrderAction('generate_order_number_error', { error: error instanceof Error ? error.message : 'Unknown error' });
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

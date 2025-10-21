/**
 * 付款服務層
 * 統一管理付款相關邏輯
 */

import { createLinePayRequest, confirmLinePayPayment } from '../lib/linepay-service';
import { validateLinePayConfig } from '../lib/linepay-config';
import { Order } from './order.service';

export interface PaymentService {
  requestLinePayPayment(orderData: Order): Promise<{ success: boolean; paymentUrl?: string; error?: string }>;
  confirmLinePayPayment(transactionId: string, amount: number): Promise<{ success: boolean; error?: string }>;
  validatePaymentConfig(): boolean;
}

class PaymentServiceImpl implements PaymentService {
  async requestLinePayPayment(orderData: Order): Promise<{ success: boolean; paymentUrl?: string; error?: string }> {
    try {
      this.logPaymentAction('request_start', { orderNumber: orderData.orderNumber, amount: orderData.total });
      
      if (!this.validatePaymentConfig()) {
        throw new Error('Payment configuration is invalid');
      }

      const linePayData = {
        orderNumber: orderData.orderNumber,
        amount: orderData.total,
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        customerName: orderData.name,
      };

      const result = await createLinePayRequest(linePayData);
      
      this.logPaymentAction('request_result', { 
        orderNumber: orderData.orderNumber, 
        success: result.success, 
        error: result.error 
      });
      
      return result;
    } catch (error) {
      this.logPaymentAction('request_error', { 
        orderNumber: orderData.orderNumber, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async confirmLinePayPayment(transactionId: string, amount: number): Promise<{ success: boolean; error?: string }> {
    try {
      this.logPaymentAction('confirm_start', { transactionId, amount });
      
      const result = await confirmLinePayPayment(transactionId, amount);
      
      this.logPaymentAction('confirm_result', { 
        transactionId, 
        success: result.success, 
        error: result.error 
      });
      
      return result;
    } catch (error) {
      this.logPaymentAction('confirm_error', { 
        transactionId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  validatePaymentConfig(): boolean {
    try {
      validateLinePayConfig();
      return true;
    } catch (error) {
      this.logPaymentAction('config_validation_error', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      return false;
    }
  }

  private logPaymentAction(action: string, data: unknown): void {
    console.log(`Payment ${action}:`, {
      action,
      data,
      timestamp: new Date().toISOString()
    });
  }
}

// 單例模式
export const paymentService = new PaymentServiceImpl();

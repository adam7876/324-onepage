/**
 * 安全服務層
 * 統一管理安全相關邏輯和日誌
 */

import { configManager } from '../config/app.config';

export interface SecurityEvent {
  type: 'api_call' | 'error' | 'security' | 'payment' | 'order';
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  data?: any;
  timestamp: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export interface SecurityService {
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void;
  logApiCall(endpoint: string, method: string, data?: any): void;
  logError(error: Error, context?: any): void;
  logSecurityEvent(event: string, data?: any): void;
  logPaymentEvent(event: string, data?: any): void;
  logOrderEvent(event: string, data?: any): void;
}

class SecurityServiceImpl implements SecurityService {
  logEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // 根據配置決定是否記錄
    if (configManager.shouldLog(event.level)) {
      console.log(`[SECURITY] ${event.type.toUpperCase()}:`, securityEvent);
      
      // 在生產環境中，這裡可以發送到外部日誌服務
      if (configManager.isProduction()) {
        this.sendToExternalLogService(securityEvent);
      }
    }
  }

  logApiCall(endpoint: string, method: string, data?: any): void {
    this.logEvent({
      type: 'api_call',
      level: 'info',
      message: `API call: ${method} ${endpoint}`,
      data: {
        endpoint,
        method,
        data: this.sanitizeData(data)
      }
    });
  }

  logError(error: Error, context?: any): void {
    this.logEvent({
      type: 'error',
      level: 'error',
      message: `Error: ${error.message}`,
      data: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context: this.sanitizeData(context)
      }
    });
  }

  logSecurityEvent(event: string, data?: any): void {
    this.logEvent({
      type: 'security',
      level: 'warn',
      message: `Security event: ${event}`,
      data: this.sanitizeData(data)
    });
  }

  logPaymentEvent(event: string, data?: any): void {
    this.logEvent({
      type: 'payment',
      level: 'info',
      message: `Payment event: ${event}`,
      data: this.sanitizeData(data)
    });
  }

  logOrderEvent(event: string, data?: any): void {
    this.logEvent({
      type: 'order',
      level: 'info',
      message: `Order event: ${event}`,
      data: this.sanitizeData(data)
    });
  }

  private sanitizeData(data: any): any {
    if (!data) return data;
    
    // 移除敏感資料
    const sensitiveFields = ['password', 'secret', 'token', 'key', 'creditCard', 'ssn'];
    
    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const field of sensitiveFields) {
        if (sanitized[field]) {
          sanitized[field] = '[REDACTED]';
        }
      }
      return sanitized;
    }
    
    return data;
  }

  private sendToExternalLogService(event: SecurityEvent): void {
    // 這裡可以整合外部日誌服務，如：
    // - Sentry
    // - LogRocket
    // - DataDog
    // - 自建日誌系統
    
    // 目前只是 console.log，但可以擴展
    if (event.level === 'critical' || event.level === 'error') {
      console.error('[CRITICAL SECURITY EVENT]:', event);
    }
  }
}

// 單例模式
export const securityService = new SecurityServiceImpl();

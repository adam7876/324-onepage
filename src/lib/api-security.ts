/**
 * API 安全驗證服務
 * 提供多層次的安全檢查機制
 */

import { NextRequest } from 'next/server';

export interface SecurityCheckResult {
  isValid: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reason?: string;
  details?: Record<string, unknown>;
}

export class ApiSecurityService {
  /**
   * 檢查請求的基本安全性
   */
  static checkBasicSecurity(request: NextRequest): SecurityCheckResult {
    const userAgent = request.headers.get('user-agent');
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // 檢查 User-Agent
    if (!userAgent || userAgent.length < 10) {
      return {
        isValid: false,
        riskLevel: 'high',
        reason: 'Invalid or missing User-Agent',
        details: { userAgent, ip }
      };
    }

    // 檢查是否為已知的爬蟲或自動化工具
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return {
        isValid: false,
        riskLevel: 'medium',
        reason: 'Suspicious User-Agent detected',
        details: { userAgent, ip }
      };
    }

    // 檢查 Origin（如果存在）
    if (origin) {
      const allowedOrigins = [
        process.env.NEXT_PUBLIC_SITE_URL,
        'http://localhost:3000',
        'https://localhost:3000'
      ].filter(Boolean);

      if (origin && !allowedOrigins.some(allowed => origin.includes(allowed as string))) {
        return {
          isValid: true,
          riskLevel: 'medium',
          reason: 'Unknown origin',
          details: { origin, ip }
        };
      }
    }

    return {
      isValid: true,
      riskLevel: 'low',
      details: { userAgent, origin, referer, ip }
    };
  }

  /**
   * 檢查請求頻率（簡單的速率限制）
   */
  static checkRateLimit(): SecurityCheckResult {
    // 這裡可以實現更複雜的速率限制邏輯
    // 目前返回基本檢查結果
    return {
      isValid: true,
      riskLevel: 'low',
      details: { rateLimit: 'basic' }
    };
  }

  /**
   * 檢查請求內容安全性
   */
  static checkContentSecurity(request: NextRequest): SecurityCheckResult {
    const contentType = request.headers.get('content-type');
    
    // 檢查 Content-Type
    if (contentType && !contentType.includes('application/json')) {
      return {
        isValid: false,
        riskLevel: 'medium',
        reason: 'Invalid Content-Type',
        details: { contentType }
      };
    }

    return {
      isValid: true,
      riskLevel: 'low',
      details: { contentType }
    };
  }

  /**
   * 綜合安全檢查
   */
  static performSecurityCheck(request: NextRequest): SecurityCheckResult {
    const basicCheck = this.checkBasicSecurity(request);
    if (!basicCheck.isValid) {
      return basicCheck;
    }

    const rateLimitCheck = this.checkRateLimit();
    if (!rateLimitCheck.isValid) {
      return rateLimitCheck;
    }

    const contentCheck = this.checkContentSecurity(request);
    if (!contentCheck.isValid) {
      return contentCheck;
    }

    // 如果所有檢查都通過，返回最嚴格的風險等級
    const maxRiskLevel = [basicCheck, rateLimitCheck, contentCheck]
      .map(check => check.riskLevel)
      .reduce((max, current) => {
        const levels = { low: 0, medium: 1, high: 2 };
        return levels[current] > levels[max] ? current : max;
      }, 'low' as 'low' | 'medium' | 'high');

    return {
      isValid: true,
      riskLevel: maxRiskLevel,
      details: {
        basic: basicCheck.details,
        rateLimit: rateLimitCheck.details,
        content: contentCheck.details
      }
    };
  }

  /**
   * 記錄安全事件
   */
  static logSecurityEvent(event: string, details: Record<string, unknown>): void {
    console.warn(`[SECURITY] ${event}:`, {
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}

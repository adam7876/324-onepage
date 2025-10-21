/**
 * API 身份驗證中介軟體
 * 保護 API 端點免受未授權存取
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityService } from '../services/security.service';

export interface ApiAuthResult {
  success: boolean;
  error?: string;
  userId?: string;
  isAdmin?: boolean;
}

export class ApiAuth {
  /**
   * 驗證管理員身份
   */
  static async verifyAdmin(request: NextRequest): Promise<ApiAuthResult> {
    try {
      // 檢查 Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        securityService.logSecurityEvent('api_auth_failed', {
          reason: 'missing_auth_header',
          endpoint: request.url
        });
        return {
          success: false,
          error: 'Missing authorization header'
        };
      }

      const token = authHeader.substring(7);
      
      // 這裡可以驗證 JWT token 或 Firebase token
      // 目前簡化為檢查特定的 API key
      const validApiKeys = [
        process.env.ADMIN_API_KEY,
        process.env.INTERNAL_API_KEY
      ].filter(Boolean);

      if (!validApiKeys.includes(token)) {
        securityService.logSecurityEvent('api_auth_failed', {
          reason: 'invalid_token',
          endpoint: request.url,
          token: token.substring(0, 8) + '...'
        });
        return {
          success: false,
          error: 'Invalid authorization token'
        };
      }

      securityService.logSecurityEvent('api_auth_success', {
        endpoint: request.url
      });

      return {
        success: true,
        userId: 'api_user',
        isAdmin: true
      };

    } catch (error) {
      securityService.logSecurityEvent('api_auth_error', {
        endpoint: request.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        error: 'Authentication failed'
      };
    }
  }

  /**
   * 驗證 LINE Pay API 請求
   */
  static async verifyLinePayApi(request: NextRequest): Promise<ApiAuthResult> {
    try {
      // 檢查 User-Agent 和 Referer
      const userAgent = request.headers.get('user-agent');
      const referer = request.headers.get('referer');
      
      // LINE Pay 請求應該來自 LINE Pay 服務器
      if (!userAgent || !userAgent.includes('LINE')) {
        securityService.logSecurityEvent('linepay_auth_failed', {
          reason: 'invalid_user_agent',
          userAgent,
          endpoint: request.url
        });
        return {
          success: false,
          error: 'Invalid request source'
        };
      }

      securityService.logSecurityEvent('linepay_auth_success', {
        endpoint: request.url
      });

      return {
        success: true,
        userId: 'linepay_api',
        isAdmin: false
      };

    } catch (error) {
      securityService.logSecurityEvent('linepay_auth_error', {
        endpoint: request.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        error: 'LINE Pay authentication failed'
      };
    }
  }

  /**
   * 創建未授權回應
   */
  static createUnauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
    return NextResponse.json(
      { success: false, error: message },
      { status: 401 }
    );
  }

  /**
   * 創建禁止回應
   */
  static createForbiddenResponse(message: string = 'Forbidden'): NextResponse {
    return NextResponse.json(
      { success: false, error: message },
      { status: 403 }
    );
  }
}

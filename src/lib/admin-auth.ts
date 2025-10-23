/**
 * 管理員認證中介軟體
 * 統一管理所有管理員 API 的認證
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiConfig } from '../config/app.config';

export interface AdminAuthResult {
  success: boolean;
  error?: string;
  adminId?: string;
}

export class AdminAuth {
  /**
   * 驗證管理員身份
   */
  static async verifyAdmin(request: NextRequest): Promise<AdminAuthResult> {
    try {
      // 檢查 Authorization header
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          success: false,
          error: 'Missing authorization header'
        };
      }

      const token = authHeader.substring(7);
      const apiConfig = getApiConfig();
      
      // 驗證 API Key
      if (token !== apiConfig.adminApiKey) {
        return {
          success: false,
          error: 'Invalid admin token'
        };
      }

      return {
        success: true,
        adminId: 'admin'
      };

    } catch {
      return {
        success: false,
        error: 'Authentication failed'
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

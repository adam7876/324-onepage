/**
 * 配置檢查 API 端點
 * 用於檢查系統配置是否正確
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateConfig, getConfigSummary } from '@/config/config-validator';
import { getApiConfig } from '@/config/app.config';

export async function GET(request: NextRequest) {
  try {
    // 簡單的 API 認證
    const apiKey = request.headers.get('x-api-key');
    const apiConfig = getApiConfig();
    
    if (apiKey !== apiConfig.adminApiKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 執行配置驗證
    const validation = validateConfig();
    const summary = getConfigSummary();

    return NextResponse.json({
      success: true,
      validation,
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Config check error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Configuration check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

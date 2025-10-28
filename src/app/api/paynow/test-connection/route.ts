/**
 * PayNow 連線測試 API
 * 測試 PayNow 服務是否正常運作
 */

import { NextRequest, NextResponse } from 'next/server';
import { payNowLogisticsService } from '@/services/paynow-logistics.service';
import { getPayNowConfig, validatePayNowConfig } from '@/config/paynow.config';

export async function GET(request: NextRequest) {
  try {
    // 取得配置
    const config = getPayNowConfig();
    
    // 驗證配置
    const validation = validatePayNowConfig(config);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'PayNow configuration is invalid',
        details: validation.errors
      }, { status: 400 });
    }

    // 測試基本配置
    const configTest = {
      baseUrl: config.baseUrl,
      userAccount: config.userAccount,
      apiCode: config.apiCode ? '***' + config.apiCode.slice(-3) : 'Not set',
      returnUrl: config.returnUrl,
      testMode: config.testMode
    };

    return NextResponse.json({
      success: true,
      message: 'PayNow configuration loaded successfully',
      config: configTest,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('PayNow connection test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test PayNow connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'test-encryption') {
      // 測試加密功能
      const testData = {
        orderNumber: 'TEST' + Date.now(),
        logisticsService: '01' as const,
        deliverMode: '02' as const,
        totalAmount: 100,
        remark: '測試訂單',
        description: 'PayNow 連線測試',
        receiverStoreId: '123456',
        receiverStoreName: '測試門市',
        receiverName: '測試收件人',
        receiverPhone: '0912345678',
        receiverEmail: 'test@example.com',
        receiverAddress: '台北市信義區測試地址',
        senderName: '測試寄件人',
        senderPhone: '0987654321',
        senderEmail: 'sender@example.com',
        senderAddress: '高雄市左營區寄件地址'
      };

      // 這裡只是測試資料結構，不實際呼叫 API
      return NextResponse.json({
        success: true,
        message: 'PayNow encryption test data prepared',
        testData,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('PayNow test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process test request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

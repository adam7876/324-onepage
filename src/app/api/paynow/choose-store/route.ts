/**
 * PayNow 門市選擇 API
 * 跳轉到 PayNow 門市選擇頁面
 */

import { NextRequest, NextResponse } from 'next/server';
import { payNowLogisticsService } from '@/services/paynow-logistics.service';

export async function POST(request: NextRequest) {
  try {
    // 處理表單資料
    const formData = await request.formData();
    const orderNumber = formData.get('orderNumber') as string;

    if (!orderNumber) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head><meta charset="UTF-8"><title>錯誤</title></head>
        <body>
          <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h2 style="color: red;">錯誤</h2>
            <p>訂單編號是必需的</p>
            <button onclick="window.close()">關閉</button>
          </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // 生成 PayNow 門市選擇表單 HTML
    const formHtml = await payNowLogisticsService.chooseLogisticsService(orderNumber, '01');

    // 直接返回 HTML 表單，讓瀏覽器自動提交
    return new NextResponse(formHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    console.error('PayNow 門市選擇錯誤:', error);
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head><meta charset="UTF-8"><title>錯誤</title></head>
      <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h2 style="color: red;">錯誤</h2>
          <p>無法開啟門市選擇頁面</p>
          <p style="color: #666;">${error instanceof Error ? error.message : '未知錯誤'}</p>
          <button onclick="window.close()">關閉</button>
        </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

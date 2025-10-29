/**
 * PayNow 回調調試 API
 * 用於檢查 PayNow 回調的實際參數
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // 取得所有表單資料
    const allData: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      allData[key] = value.toString();
    }
    
    console.log('PayNow POST 回調調試 - 所有參數:', allData);
    
    return NextResponse.json({
      success: true,
      method: 'POST',
      allParams: allData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('PayNow POST 回調調試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 取得所有查詢參數
    const allParams: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      allParams[key] = value;
    }
    
    console.log('PayNow GET 回調調試 - 所有參數:', allParams);
    
    return NextResponse.json({
      success: true,
      method: 'GET',
      allParams,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('PayNow GET 回調調試錯誤:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

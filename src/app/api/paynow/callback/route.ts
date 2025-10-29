/**
 * PayNow 回調處理 API
 * 處理 PayNow 門市選擇完成後的回調
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 處理 PayNow 回調資料
    const formData = await request.formData();
    
    // 取得 PayNow 回調的參數
    const storeId = formData.get('store_id') as string;
    const storeName = formData.get('store_name') as string;
    const storeAddress = formData.get('store_address') as string;
    const orderNumber = formData.get('orderno') as string;
    
    console.log('PayNow 回調資料:', {
      storeId,
      storeName,
      storeAddress,
      orderNumber
    });
    
    // 重導向到成功頁面，並帶上門市資訊
    const successUrl = new URL('/checkout/success', request.url);
    if (orderNumber) {
      successUrl.searchParams.set('orderNumber', orderNumber);
    }
    if (storeId) {
      successUrl.searchParams.set('store_id', storeId);
    }
    if (storeName) {
      successUrl.searchParams.set('store_name', storeName);
    }
    if (storeAddress) {
      successUrl.searchParams.set('store_address', storeAddress);
    }
    
    // 重導向到成功頁面
    return NextResponse.redirect(successUrl);
    
  } catch (error) {
    console.error('PayNow 回調處理錯誤:', error);
    
    // 如果處理失敗，重導向到錯誤頁面
    const errorUrl = new URL('/checkout/error', request.url);
    errorUrl.searchParams.set('error', 'PayNow 回調處理失敗');
    
    return NextResponse.redirect(errorUrl);
  }
}

// 也支援 GET 方法（以防 PayNow 使用 GET）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 取得 PayNow 回調的參數
    const storeId = searchParams.get('store_id');
    const storeName = searchParams.get('store_name');
    const storeAddress = searchParams.get('store_address');
    const orderNumber = searchParams.get('orderno');
    
    console.log('PayNow GET 回調資料:', {
      storeId,
      storeName,
      storeAddress,
      orderNumber
    });
    
    // 重導向到成功頁面，並帶上門市資訊
    const successUrl = new URL('/checkout/success', request.url);
    if (orderNumber) {
      successUrl.searchParams.set('orderNumber', orderNumber);
    }
    if (storeId) {
      successUrl.searchParams.set('store_id', storeId);
    }
    if (storeName) {
      successUrl.searchParams.set('store_name', storeName);
    }
    if (storeAddress) {
      successUrl.searchParams.set('store_address', storeAddress);
    }
    
    // 重導向到成功頁面
    return NextResponse.redirect(successUrl);
    
  } catch (error) {
    console.error('PayNow GET 回調處理錯誤:', error);
    
    // 如果處理失敗，重導向到錯誤頁面
    const errorUrl = new URL('/checkout/error', request.url);
    errorUrl.searchParams.set('error', 'PayNow 回調處理失敗');
    
    return NextResponse.redirect(errorUrl);
  }
}

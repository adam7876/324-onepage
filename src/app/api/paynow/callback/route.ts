/**
 * PayNow 回調處理 API
 * 處理 PayNow 門市選擇完成後的回調
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 處理 PayNow 回調資料
    const formData = await request.formData();
    
    // 取得 PayNow 回調的參數（根據 API 文件，參數名稱是 storeid, storename, storeaddress）
    const storeId = formData.get('storeid') as string;
    const storeName = formData.get('storename') as string;
    const storeAddress = formData.get('storeaddress') as string;
    const orderNumber = formData.get('orderno') as string;
    
    console.log('PayNow 回調資料:', {
      storeId,
      storeName,
      storeAddress,
      orderNumber
    });
    
    // 重導向到商品頁面，並帶上門市資訊
    const successUrl = new URL('/', request.url);
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
    
    // 直接返回 HTML 頁面，避免 POST 方法問題
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>門市選擇完成</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script>
          // 使用 JavaScript 重導向到成功頁面
          window.location.href = '${successUrl.toString()}';
        </script>
      </head>
      <body>
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
          <h2>正在跳轉...</h2>
          <p>門市選擇已完成，正在跳轉到訂單確認頁面...</p>
        </div>
      </body>
      </html>
    `;
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
    
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
    
    // 取得 PayNow 回調的參數（根據 API 文件，參數名稱是 storeid, storename, storeaddress）
    const storeId = searchParams.get('storeid');
    const storeName = searchParams.get('storename');
    const storeAddress = searchParams.get('storeaddress');
    const orderNumber = searchParams.get('orderno');
    
    console.log('PayNow GET 回調資料:', {
      storeId,
      storeName,
      storeAddress,
      orderNumber
    });
    
    // 重導向到商品頁面，並帶上門市資訊
    const successUrl = new URL('/', request.url);
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

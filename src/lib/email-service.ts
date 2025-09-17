// Email 服務配置
interface EmailConfig {
  provider: 'console' | 'smtp' | 'sendgrid' | 'resend';
  settings: {
    apiKey?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    fromEmail?: string;
    fromName?: string;
  };
}

// 預設使用 console 輸出（開發/測試環境）
const EMAIL_CONFIG: EmailConfig = {
  provider: process.env.EMAIL_PROVIDER as any || 'console',
  settings: {
    apiKey: process.env.EMAIL_API_KEY,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    fromEmail: process.env.FROM_EMAIL || 'noreply@324game.com',
    fromName: process.env.FROM_NAME || '324遊樂園🎠',
  }
};

// Email 驗證結果
interface EmailSendResult {
  success: boolean;
  message: string;
  messageId?: string;
  error?: string;
}

// 發送驗證碼 Email
export async function sendVerificationEmail(
  toEmail: string, 
  verificationCode: string
): Promise<EmailSendResult> {
  
  const subject = '🎮 324遊樂園驗證碼';
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #8b5cf6; margin: 0;">🎠 324遊樂園 🎠</h1>
        <p style="color: #666; margin: 10px 0;">每天一次機會，玩遊戲領回饋金！</p>
      </div>
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; margin-bottom: 30px;">
        <h2 style="color: white; margin: 0 0 20px 0;">您的驗證碼</h2>
        <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block;">
          <span style="font-size: 32px; font-weight: bold; color: #8b5cf6; letter-spacing: 8px;">${verificationCode}</span>
        </div>
        <p style="color: #f3f4f6; margin: 20px 0 0 0; font-size: 14px;">驗證碼將在 10 分鐘後過期</p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
        <h3 style="color: #374151; margin: 0 0 15px 0;">🎮 遊戲規則</h3>
        <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
          <li>每天限玩一次</li>
          <li>需要Email驗證</li>
          <li>獲得回饋金可用於購物</li>
          <li>請在10分鐘內完成驗證</li>
        </ul>
      </div>
      
      <div style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px;">
        <p>此為系統自動發送的郵件，請勿回覆</p>
        <p>如有問題請聯繫客服</p>
      </div>
    </div>
  `;

  const textContent = `
324遊樂園🎠 - 驗證碼

您的驗證碼：${verificationCode}

驗證碼將在 10 分鐘後過期
請盡快完成遊戲驗證

遊戲規則：
- 每天限玩一次
- 需要Email驗證  
- 獲得回饋金可用於購物

此為系統自動發送的郵件，請勿回覆
  `;

  try {
    switch (EMAIL_CONFIG.provider) {
      case 'console':
        return sendConsoleEmail(toEmail, subject, verificationCode);
      
      case 'resend':
        return await sendResendEmail(toEmail, subject, htmlContent, textContent);
      
      case 'sendgrid':
        return await sendSendGridEmail(toEmail, subject, htmlContent, textContent);
      
      case 'smtp':
        return await sendSMTPEmail(toEmail, subject, htmlContent, textContent);
      
      default:
        return sendConsoleEmail(toEmail, subject, verificationCode);
    }
  } catch (error) {
    console.error('Email發送失敗:', error);
    return {
      success: false,
      message: '發送失敗，請稍後再試',
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
}

// Console 輸出（開發/測試環境）
function sendConsoleEmail(toEmail: string, subject: string, code: string): EmailSendResult {
  console.log(`
📧 =============== EMAIL DEBUG ===============
📤 收件人: ${toEmail}
📝 主題: ${subject}
🔢 驗證碼: ${code}
⏰ 發送時間: ${new Date().toLocaleString('zh-TW')}
🎯 提示: 在真實環境中，請設定 EMAIL_PROVIDER 環境變數
===============================================
  `);
  
  return {
    success: true,
    message: `驗證碼已發送到 ${toEmail}`,
    messageId: `console-${Date.now()}`
  };
}

// Resend Email Service (推薦)
async function sendResendEmail(
  toEmail: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string
): Promise<EmailSendResult> {
  
  if (!EMAIL_CONFIG.settings.apiKey) {
    throw new Error('Resend API key 未設定');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EMAIL_CONFIG.settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${EMAIL_CONFIG.settings.fromName} <${EMAIL_CONFIG.settings.fromEmail}>`,
      to: [toEmail],
      subject,
      html: htmlContent,
      text: textContent,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API 錯誤: ${error}`);
  }

  const result = await response.json();
  
  return {
    success: true,
    message: `驗證碼已發送到 ${toEmail}`,
    messageId: result.id
  };
}

// SendGrid Email Service
async function sendSendGridEmail(
  toEmail: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string
): Promise<EmailSendResult> {
  
  if (!EMAIL_CONFIG.settings.apiKey) {
    throw new Error('SendGrid API key 未設定');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EMAIL_CONFIG.settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: toEmail }],
        subject,
      }],
      from: {
        email: EMAIL_CONFIG.settings.fromEmail,
        name: EMAIL_CONFIG.settings.fromName,
      },
      content: [
        { type: 'text/plain', value: textContent },
        { type: 'text/html', value: htmlContent },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API 錯誤: ${error}`);
  }

  return {
    success: true,
    message: `驗證碼已發送到 ${toEmail}`,
    messageId: response.headers.get('x-message-id') || 'sendgrid-sent'
  };
}

// SMTP Email Service
async function sendSMTPEmail(
  toEmail: string, 
  subject: string, 
  htmlContent: string, 
  textContent: string
): Promise<EmailSendResult> {
  
  // 這裡需要 nodemailer 或類似的 SMTP 客戶端
  // 由於是 Next.js edge runtime，建議使用 API-based 解決方案
  throw new Error('SMTP 功能需要額外配置 nodemailer');
}

// Email 白名單檢查（可選的額外保護）
export function isEmailWhitelisted(email: string): boolean {
  // 可以設定允許的 email 域名或特定地址
  const allowedDomains = [
    'gmail.com',
    'yahoo.com', 
    'hotmail.com',
    'outlook.com',
    'icloud.com',
    'protonmail.com',
    // 可以新增更多允許的域名
  ];

  const emailDomain = email.split('@')[1]?.toLowerCase();
  
  if (!emailDomain) return false;
  
  return allowedDomains.includes(emailDomain);
}

// 簡單的 email 存在性檢查（基於常見域名）
export function isCommonEmailProvider(email: string): boolean {
  const commonProviders = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
    'icloud.com', 'live.com', 'msn.com', 'aol.com',
    'protonmail.com', 'tutanota.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return commonProviders.includes(domain || '');
}

/**
 * Google Apps Script - Statistics API for Hour of AI Dashboard
 *
 * VERSION 3.1 - 優化週報系統
 * - timestamp: Unix timestamp (毫秒) - 供程式處理
 * - timestamp_unified: 台灣時區人類可讀格式 (YYYY-MM-DD HH:mm:ss)
 * - 即時通知：每次新報名發送 Slack 通知
 * - 週報：每週二上午 9:00 自動發送統計報告
 * - GA4 整合：網站流量分析與轉換率追蹤
 *
 * SETUP INSTRUCTIONS:
 * 1. 複製此完整程式碼到 Google Apps Script 編輯器
 * 2. 設定 Slack Webhook URL（二選一）：
 *    - 方法 A：執行 setSlackWebhookURL('your-webhook-url')
 *    - 方法 B：專案設定 > Script Properties > 新增 SLACK_WEBHOOK_URL
 * 3. 部署為 Web App (Execute as: Me, Access: Anyone)
 * 4. 複製 Web App URL 到前端 CONFIG.FORM_SUBMIT_URL
 * 5. 設定時間驅動觸發器：每週二 9:00-10:00 執行 sendWeeklyReport
 *
 * 詳細教學請參考：docs/Notification-System-Setup-Guide.md
 */

// ===== CONFIGURATION =====
// 在此統一管理所有設定，方便快速啟用/停用

const CONFIG = {
  // ===== Slack 設定 =====
  // Slack Webhook URL - 從 Script Properties 讀取（安全做法）
  // 設定方式：Apps Script 編輯器 > 專案設定 > Script Properties
  // 新增屬性：SLACK_WEBHOOK_URL = 你的 Webhook URL
  // 或使用函數：setSlackWebhookURL('your-webhook-url')

  // 通知開關 - 設定為 false 即可停用
  ENABLE_INSTANT_NOTIFICATION: true,   // 即時通知：每次新報名時發送
  ENABLE_WEEKLY_REPORT: true,          // 週報：每週二上午發送
  ENABLE_EMAIL_NOTIFICATION: false,    // Email 通知（保留舊功能）

  // 通知接收者設定
  EMAIL_RECIPIENTS: ['support@junyiacademy.org'], // Email 收件者列表

  // 週報設定
  WEEKLY_REPORT_DAY: 2,    // 週二 (0=週日, 1=週一, ..., 6=週六)
  WEEKLY_REPORT_HOUR: 9,   // 上午 9 點

  // Slack 訊息設定
  SLACK_CHANNEL: '#hour-of-ai',  // 可選：指定 channel（如果 webhook 未預設）
  SLACK_USERNAME: 'Hour of AI Bot',  // Bot 顯示名稱
  SLACK_ICON_EMOJI: ':robot_face:',   // Bot 圖示

  // ===== GA4 設定 =====
  ENABLE_GA_REPORT: true,
  GA4_PROPERTY_ID: '266069252',  // GA4 Property ID
  PAGE_PATH_FILTER: '/',  // Firebase Hosting 根路徑（舊值 '/event/2025-hour-of-ai/' 為 WordPress 路徑）
};

// ===== UTILITY FUNCTIONS =====

/**
 * 格式化日期為台灣時區
 * @param {Date} date - 日期物件
 * @param {string} format - 格式字串 (例如 'yyyy-MM-dd', 'M/d')
 * @returns {string} 格式化後的日期字串
 */
function formatDateTW(date, format) {
  return Utilities.formatDate(date, 'Asia/Taipei', format);
}

/**
 * 取得成長率圖示
 * @param {string|number} value - 成長率數值
 * @returns {string} 對應的 emoji 圖示
 */
function getGrowthIcon(value) {
  const num = parseFloat(value);
  if (num > 0) return '📈';
  if (num < 0) return '📉';
  return '➖';
}

/**
 * 計算成長率
 * @param {number} current - 本期數值
 * @param {number} previous - 上期數值
 * @returns {string} 成長率字串 (例如 '+15.2' 或 '-5.3')
 */
function calculateGrowthRate(current, previous) {
  if (previous === 0) {
    return current > 0 ? '+100.0' : '0.0';
  }
  const growth = ((current - previous) / previous) * 100;
  return growth >= 0 ? '+' + growth.toFixed(1) : growth.toFixed(1);
}

/**
 * 將秒數轉換為 分:秒 格式
 * @param {number} seconds - 秒數
 * @returns {string} 格式化後的時間字串 (例如 '4:05')
 */
function formatDuration(seconds) {
  const totalSeconds = Math.round(parseFloat(seconds) || 0);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ===== SLACK WEBHOOK URL MANAGEMENT =====

/**
 * 設定 Slack Webhook URL（安全儲存到 Script Properties）
 * 使用方式：在 Apps Script 編輯器中執行此函數
 * @param {string} webhookUrl - Slack Webhook URL
 */
function setSlackWebhookURL(webhookUrl) {
  PropertiesService.getScriptProperties().setProperty('SLACK_WEBHOOK_URL', webhookUrl);
  Logger.log('✅ Slack Webhook URL 已成功設定');
  Logger.log('💡 提示：執行 testInstantNotification() 測試連線');
}

/**
 * 取得 Slack Webhook URL
 * @returns {string|null} Slack Webhook URL 或 null
 */
function getSlackWebhookURL() {
  return PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK_URL');
}

/**
 * 檢查 Slack Webhook URL 是否已設定
 */
function checkSlackWebhookURL() {
  const url = getSlackWebhookURL();
  if (url) {
    Logger.log('✅ Slack Webhook URL 已設定');
    Logger.log('URL 前 50 字元: ' + url.substring(0, 50) + '...');
  } else {
    Logger.log('❌ Slack Webhook URL 未設定');
    Logger.log('請執行: setSlackWebhookURL("你的-webhook-url")');
  }
}

// ===== STATISTICS API =====

/**
 * Handle GET requests for statistics
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getStats') {
      return getStatistics();
    }

    // Default response
    return ContentService.createTextOutput('Hour of AI Statistics API v3.1')
      .setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Calculate and return statistics from the Google Sheet
 */
function getStatistics() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Skip header row
    const registrations = data.slice(1);

    if (registrations.length === 0) {
      // Return fallback data if no registrations yet
      return ContentService.createTextOutput(JSON.stringify({
        'status': 'success',
        'totalEvents': 0,
        'totalParticipants': 0,
        'counties': {},
        'recentActivities': []
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 動態找出欄位索引
    const COLUMN_TIMESTAMP = headers.indexOf('timestamp');
    const COLUMN_TIMESTAMP_UNIFIED = headers.indexOf('timestamp_unified');
    const COLUMN_COUNTY = headers.indexOf('county');
    const COLUMN_PARTICIPANTS = headers.indexOf('participants');
    const COLUMN_INSTITUTION = headers.indexOf('institutionType');

    Logger.log(`欄位索引: timestamp=${COLUMN_TIMESTAMP}, timestamp_unified=${COLUMN_TIMESTAMP_UNIFIED}, county=${COLUMN_COUNTY}, participants=${COLUMN_PARTICIPANTS}, institutionType=${COLUMN_INSTITUTION}`);

    // Calculate statistics
    const stats = {
      totalEvents: registrations.length,
      totalParticipants: 0,
      counties: {},
      institutionTypes: {},
      recentActivities: []
    };

    // Process each registration
    registrations.forEach((row, index) => {
      const county = row[COLUMN_COUNTY] || '未知';
      const participants = parseInt(row[COLUMN_PARTICIPANTS]) || 0;
      const institutionType = row[COLUMN_INSTITUTION] || '其他';

      // 優先使用 timestamp_unified，如果沒有則使用 timestamp
      const timestamp = row[COLUMN_TIMESTAMP_UNIFIED] || row[COLUMN_TIMESTAMP];

      // Sum participants
      stats.totalParticipants += participants;

      // Count by county
      if (!stats.counties[county]) {
        stats.counties[county] = 0;
      }
      stats.counties[county]++;

      // Count by institution type
      if (!stats.institutionTypes[institutionType]) {
        stats.institutionTypes[institutionType] = 0;
      }
      stats.institutionTypes[institutionType]++;

      // Store all registrations for sorting
      stats.recentActivities.push({
        county: county,
        type: institutionType,
        participants: participants,
        timestamp: timestamp
      });
    });

    // Format recent activities with relative time
    stats.recentActivities = stats.recentActivities
      .filter(activity => activity.timestamp) // 過濾空白時間戳
      .sort((a, b) => {
        // 智能排序：自動處理兩種格式
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);

        // 降序排列（最新的在前）
        return dateB - dateA;
      })
      .slice(0, 5) // 取前 5 筆
      .map(activity => {
        const timeAgo = getTimeAgo(activity.timestamp);
        return {
          county: activity.county,
          type: activity.type,
          participants: activity.participants,
          time: timeAgo
        };
      });

    Logger.log(`統計結果: 總活動數=${stats.totalEvents}, 總參與人數=${stats.totalParticipants}, 最新活動數=${stats.recentActivities.length}`);

    return ContentService.createTextOutput(JSON.stringify({
      'status': 'success',
      ...stats
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error calculating statistics: ' + error.toString());

    // Return fallback data on error
    return ContentService.createTextOutput(JSON.stringify({
      'status': 'error',
      'message': error.toString(),
      'totalEvents': 0,
      'totalParticipants': 0,
      'counties': {},
      'recentActivities': []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Calculate relative time (e.g., "5 分鐘前")
 */
function getTimeAgo(timestamp) {
  try {
    const now = new Date();
    const past = new Date(timestamp);

    // 驗證日期是否有效
    if (isNaN(past.getTime())) {
      Logger.log(`無效的時間戳: ${timestamp}`);
      return '最近';
    }

    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins} 分鐘前`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} 小時前`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} 天前`;

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} 週前`;

  } catch (error) {
    Logger.log('Error in getTimeAgo: ' + error.toString());
    return '最近';
  }
}

/**
 * Handle OPTIONS preflight requests for CORS
 */
function doOptions(e) {
  return createCORSResponse('');
}

/**
 * Enhanced doPost with dual timestamp support
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Security validations
    validateOrigin(e, data);
    validateHoneypot(data);
    validateRateLimit(data, e);
    validateCSRFToken(data);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // ===== 雙 timestamp 處理 =====
    // 1. 保留原始 Unix timestamp (數字)
    const unixTimestamp = data.timestamp;

    // 2. 轉換為台灣時區的可讀格式
    const timestampDate = new Date(unixTimestamp);
    const timestamp_unified = formatDateTW(timestampDate, 'yyyy-MM-dd HH:mm:ss');

    Logger.log(`收到表單: Unix=${unixTimestamp}, Unified=${timestamp_unified}`);

    // Headers - 包含兩個 timestamp 欄位
    const headers = [
      'timestamp', 'timestamp_unified', 'email', 'contactName', 'jobTitle', 'phone',
      'county', 'address', 'postalCode', 'participants',
      'institutionType', 'schoolName', 'gradeLevel', 'activityType',
      'deviceUsage', 'activityDescription', 'deliveryFormat',
      'onlineRegistrationLink', 'startDate', 'endDate',
      'promotionalImage', 'additionalComments', 'codeOrgContact', 'dataConsent'
    ];

    // If sheet is empty, add headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    // Prepare row data - 手動組裝以確保 timestamp_unified 正確插入
    const rowData = [
      unixTimestamp,           // timestamp (原始)
      timestamp_unified,       // timestamp_unified (新增)
      data.email || '',
      data.contactName || '',
      data.jobTitle || '',
      data.phone || '',
      data.county || '',
      data.address || '',
      data.postalCode || '',
      data.participants || '',
      data.institutionType || '',
      data.schoolName || '',
      data.gradeLevel || '',
      data.activityType || '',
      data.deviceUsage || '',
      data.activityDescription || '',
      data.deliveryFormat || '',
      data.onlineRegistrationLink || '',
      data.startDate || '',
      data.endDate || '',
      data.promotionalImage || '',
      data.additionalComments || '',
      data.codeOrgContact || '',
      data.dataConsent || ''
    ];

    // Append data
    sheet.appendRow(rowData);

    Logger.log(`成功寫入 Sheet: Row ${sheet.getLastRow()}`);

    // Send instant notification (Slack + Email)
    sendInstantNotification(data, timestamp_unified);

    return createCORSResponse(JSON.stringify({
      'status': 'success',
      'timestamp': unixTimestamp,
      'timestamp_unified': timestamp_unified
    }));

  } catch (error) {
    Logger.log('Security validation failed: ' + error.toString());
    return createErrorResponse(error.message);
  }
}

/**
 * Validate request origin
 */
function validateOrigin(e, data) {
  const allowedOrigins = [
    'https://www.junyiacademy.org',
    'https://junyiacademy.org',
    // 正式網域
    'https://hoa.junyiacademy.org',
    // Firebase Hosting
    'https://hour-of-ai-landing-junyi.web.app',
    'https://hour-of-ai-landing-junyi.firebaseapp.com'
  ];

  // Check origin from data (more reliable than headers)
  const origin = data.origin;
  if (!origin || !allowedOrigins.includes(origin)) {
    Logger.log(`Invalid origin: ${origin}`);
    throw new Error('Invalid origin');
  }
}

/**
 * Validate honeypot fields
 */
function validateHoneypot(data) {
  const honeypots = ['honeypot_website', 'honeypot_contact', 'honeypot_phone'];

  for (const field of honeypots) {
    if (data[field] && data[field].trim() !== '') {
      Logger.log(`Honeypot triggered: ${field} = ${data[field]}`);
      throw new Error('Spam detected');
    }
  }
}

/**
 * Rate limiting validation - IP and Email based
 */
function validateRateLimit(data, e) {
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  // Different limits for IP vs Email
  const maxRequestsPerIP = 10;      // Higher limit per IP (multiple users from same office)
  const maxRequestsPerEmail = 3;    // Lower limit per email (prevent individual abuse)

  // Get client IP (may not always be available in Google Apps Script)
  const clientIP = getClientIP(e);

  // Validate IP-based rate limiting
  if (clientIP) {
    validateIPRateLimit(props, clientIP, now, oneHour, maxRequestsPerIP);
  }

  // Validate Email-based rate limiting
  if (!data.email) {
    throw new Error('Email is required for rate limiting');
  }
  validateEmailRateLimit(props, data.email, now, oneHour, maxRequestsPerEmail);
}

/**
 * Get client IP address (best effort)
 */
function getClientIP(e) {
  try {
    return e.headers['X-Forwarded-For'] ||
           e.headers['x-forwarded-for'] ||
           e.headers['X-Real-IP'] ||
           e.headers['x-real-ip'] ||
           null;
  } catch (error) {
    Logger.log('Could not get client IP: ' + error.toString());
    return null;
  }
}

/**
 * IP-based rate limiting
 */
function validateIPRateLimit(props, clientIP, now, oneHour, maxRequests) {
  const ipKey = `rate_ip_${clientIP}`;
  const ipData = props.getProperty(ipKey);

  if (ipData) {
    const { count, lastReset } = JSON.parse(ipData);

    if (now - lastReset < oneHour && count >= maxRequests) {
      throw new Error(`Too many requests from this IP. Limit: ${maxRequests} per hour.`);
    }

    const newCount = now - lastReset < oneHour ? count + 1 : 1;
    const newLastReset = now - lastReset < oneHour ? lastReset : now;

    props.setProperty(ipKey, JSON.stringify({
      count: newCount,
      lastReset: newLastReset
    }));
  } else {
    props.setProperty(ipKey, JSON.stringify({
      count: 1,
      lastReset: now
    }));
  }
}

/**
 * Email-based rate limiting (secondary protection)
 */
function validateEmailRateLimit(props, email, now, oneHour, maxRequests) {
  const emailKey = `rate_email_${email.toLowerCase()}`;
  const emailData = props.getProperty(emailKey);

  if (emailData) {
    const { count, lastReset } = JSON.parse(emailData);

    if (now - lastReset < oneHour && count >= maxRequests) {
      throw new Error(`Too many submissions for this email. Limit: ${maxRequests} per hour.`);
    }

    const newCount = now - lastReset < oneHour ? count + 1 : 1;
    const newLastReset = now - lastReset < oneHour ? lastReset : now;

    props.setProperty(emailKey, JSON.stringify({
      count: newCount,
      lastReset: newLastReset
    }));
  } else {
    props.setProperty(emailKey, JSON.stringify({
      count: 1,
      lastReset: now
    }));
  }
}

/**
 * CSRF token validation
 */
function validateCSRFToken(data) {
  if (!data.timestamp || !data.csrf_token) {
    throw new Error('Missing security token');
  }

  // Validate timestamp (token should be recent)
  const tokenAge = Date.now() - data.timestamp;
  const maxAge = 60 * 60 * 1000; // 1 hour

  if (tokenAge > maxAge || tokenAge < 0) {
    throw new Error('Token expired. Please refresh and try again.');
  }

  // Validate token format
  if (data.csrf_token.length !== 32 || !/^[0-9a-f]+$/.test(data.csrf_token)) {
    throw new Error('Invalid security token');
  }
}

/**
 * Create standardized error response
 */
function createErrorResponse(message) {
  return createCORSResponse(JSON.stringify({
    status: 'error',
    message: message
  }));
}

/**
 * Create CORS-enabled response
 */
function createCORSResponse(content) {
  return ContentService
    .createTextOutput(content)
    .setMimeType(ContentService.MimeType.JSON)
    .setHeaders({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '3600'
    });
}

/**
 * Test function to verify statistics calculation
 */
function testGetStatistics() {
  const result = getStatistics();
  Logger.log(result.getContent());
}

/**
 * Test function for form submission
 */
function testPost() {
  const testData = {
    timestamp: Date.now(),
    csrf_token: '12345678901234567890123456789012',
    origin: 'https://www.junyiacademy.org',
    email: 'test@example.com',
    contactName: '測試使用者',
    jobTitle: '教師',
    phone: '0912345678',
    county: '台北市',
    address: '測試地址',
    postalCode: '10005',
    participants: '50',
    institutionType: '學校',
    schoolName: '測試國中',
    gradeLevel: '國中',
    activityType: '教室活動',
    deviceUsage: '有使用設備',
    activityDescription: '這是一個測試活動',
    deliveryFormat: '實體',
    startDate: '2025-03-01',
    codeOrgContact: '是',
    dataConsent: '同意',
    honeypot_website: '',
    honeypot_contact: '',
    honeypot_phone: ''
  };

  const e = {
    postData: {
      contents: JSON.stringify(testData)
    },
    headers: {},
    parameter: {}
  };

  const result = doPost(e);
  Logger.log(result.getContent());
}

// ===== NOTIFICATION SYSTEM =====

/**
 * Send message to Slack via Webhook
 */
function sendToSlack(message) {
  const webhookUrl = getSlackWebhookURL();

  if (!webhookUrl) {
    Logger.log('❌ Slack Webhook URL 未設定');
    Logger.log('請執行: setSlackWebhookURL("你的-webhook-url")');
    Logger.log('或在 專案設定 > Script Properties 中新增 SLACK_WEBHOOK_URL');
    return false;
  }

  try {
    const payload = {
      text: message,
      username: CONFIG.SLACK_USERNAME,
      icon_emoji: CONFIG.SLACK_ICON_EMOJI
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(webhookUrl, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log('✅ Slack 通知發送成功');
      return true;
    } else {
      Logger.log(`❌ Slack 通知發送失敗: ${responseCode} - ${response.getContentText()}`);
      return false;
    }
  } catch (error) {
    Logger.log('❌ Slack 通知發送錯誤: ' + error.toString());
    return false;
  }
}

/**
 * Send instant notification when new registration submitted
 */
function sendInstantNotification(data, timestamp_unified) {
  if (!CONFIG.ENABLE_INSTANT_NOTIFICATION) {
    return;
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheetUrl = sheet.getUrl();
  const totalRegistrations = sheet.getActiveSheet().getLastRow() - 1; // Exclude header

  const message = `
🎉 *新的 Hour of AI 活動報名！*

📅 報名時間：${timestamp_unified}
👤 聯絡人：${data.contactName}
📧 Email：${data.email}
📍 縣市：${data.county}
🏫 機構類型：${data.institutionType}
${data.schoolName ? `🏫 學校名稱：${data.schoolName}\n` : ''}👥 預計參與人數：${data.participants}

📊 累計報名活動數：${totalRegistrations} 場

🔗 查看完整資料：${sheetUrl}
  `.trim();

  sendToSlack(message);

  // Send email if enabled
  if (CONFIG.ENABLE_EMAIL_NOTIFICATION) {
    const emailBody = `
新的 Hour of AI 報名!

報名時間: ${timestamp_unified}
聯絡人: ${data.contactName}
Email: ${data.email}
縣市: ${data.county}
機構類型: ${data.institutionType}
預計參與人數: ${data.participants}

查看完整資料: ${sheetUrl}
    `;

    CONFIG.EMAIL_RECIPIENTS.forEach(recipient => {
      try {
        MailApp.sendEmail({
          to: recipient,
          subject: '新的 Hour of AI 報名通知',
          body: emailBody
        });
      } catch (error) {
        Logger.log(`Failed to send email to ${recipient}: ${error.toString()}`);
      }
    });
  }
}

/**
 * Send weekly report - triggered by time-based trigger
 * Setup: Apps Script Editor > Triggers > Add Trigger
 * - Function: sendWeeklyReport
 * - Event source: Time-driven
 * - Type: Week timer
 * - Day: Tuesday
 * - Time: 9am-10am
 */
function sendWeeklyReport() {
  if (!CONFIG.ENABLE_WEEKLY_REPORT) {
    Logger.log('Weekly report is disabled');
    return;
  }

  try {
    const stats = calculateWeeklyStats();
    const message = formatWeeklyReport(stats);
    sendToSlack(message);
    Logger.log('✅ 週報發送成功');
  } catch (error) {
    Logger.log('❌ 週報生成失敗: ' + error.toString());
    sendToSlack(`⚠️ 週報生成失敗：${error.toString()}`);
  }
}

/**
 * Calculate weekly statistics
 */
function calculateWeeklyStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const registrations = data.slice(1);

  // Find column indices
  const COLUMN_TIMESTAMP = headers.indexOf('timestamp');
  const COLUMN_TIMESTAMP_UNIFIED = headers.indexOf('timestamp_unified');
  const COLUMN_COUNTY = headers.indexOf('county');
  const COLUMN_PARTICIPANTS = headers.indexOf('participants');
  const COLUMN_INSTITUTION = headers.indexOf('institutionType');
  const COLUMN_DELIVERY = headers.indexOf('deliveryFormat');
  const COLUMN_CODE_ORG = headers.indexOf('codeOrgContact');

  // Time ranges
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // Initialize stats
  const stats = {
    thisWeek: { events: 0, participants: 0, counties: new Set(), institutions: {}, delivery: {}, codeOrg: 0 },
    lastWeek: { events: 0, participants: 0 },
    total: { events: 0, participants: 0, counties: {}, institutions: {} },
    allCounties: new Set()
  };

  // Taiwan counties for coverage calculation
  const taiwanCounties = [
    '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
    '基隆市', '新竹市', '嘉義市',
    '新竹縣', '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣',
    '屏東縣', '宜蘭縣', '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'
  ];

  // Process each registration
  registrations.forEach(row => {
    const timestamp = row[COLUMN_TIMESTAMP_UNIFIED] || row[COLUMN_TIMESTAMP];
    const date = new Date(timestamp);
    const county = row[COLUMN_COUNTY] || '未知';
    const participants = parseInt(row[COLUMN_PARTICIPANTS]) || 0;
    const institution = row[COLUMN_INSTITUTION] || '其他';
    const delivery = row[COLUMN_DELIVERY] || '未知';
    const codeOrg = row[COLUMN_CODE_ORG] || '';

    // Total stats
    stats.total.events++;
    stats.total.participants += participants;
    stats.allCounties.add(county);

    if (!stats.total.counties[county]) {
      stats.total.counties[county] = 0;
    }
    stats.total.counties[county]++;

    if (!stats.total.institutions[institution]) {
      stats.total.institutions[institution] = 0;
    }
    stats.total.institutions[institution]++;

    // This week stats
    if (date >= oneWeekAgo) {
      stats.thisWeek.events++;
      stats.thisWeek.participants += participants;
      stats.thisWeek.counties.add(county);

      if (!stats.thisWeek.institutions[institution]) {
        stats.thisWeek.institutions[institution] = 0;
      }
      stats.thisWeek.institutions[institution]++;

      if (!stats.thisWeek.delivery[delivery]) {
        stats.thisWeek.delivery[delivery] = 0;
      }
      stats.thisWeek.delivery[delivery]++;

      if (codeOrg === '是' || codeOrg === 'yes') {
        stats.thisWeek.codeOrg++;
      }
    }

    // Last week stats (for comparison)
    if (date >= twoWeeksAgo && date < oneWeekAgo) {
      stats.lastWeek.events++;
      stats.lastWeek.participants += participants;
    }
  });

  // Calculate growth rates
  stats.growth = {
    events: calculateGrowthRate(stats.thisWeek.events, stats.lastWeek.events),
    participants: calculateGrowthRate(stats.thisWeek.participants, stats.lastWeek.participants)
  };

  // County coverage
  stats.coverage = {
    active: stats.allCounties.size,
    total: taiwanCounties.length,
    percentage: ((stats.allCounties.size / taiwanCounties.length) * 100).toFixed(1),
    inactive: taiwanCounties.filter(c => !stats.allCounties.has(c))
  };

  // Top counties
  stats.topCounties = Object.entries(stats.total.counties)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Average participants
  stats.avgParticipants = stats.total.events > 0
    ? (stats.total.participants / stats.total.events).toFixed(1)
    : 0;

  // Code.org partnership rate
  stats.codeOrgRate = stats.thisWeek.events > 0
    ? ((stats.thisWeek.codeOrg / stats.thisWeek.events) * 100).toFixed(1)
    : 0;

  // 取得 GA4 數據
  stats.ga = getGA4WeeklyStats();

  // 計算轉換率（如果有 GA 數據）
  if (stats.ga && stats.ga.thisWeek.users > 0) {
    stats.conversionRate = ((stats.thisWeek.events / stats.ga.thisWeek.users) * 100).toFixed(1);
  } else {
    stats.conversionRate = null;
  }

  return stats;
}

/**
 * Format weekly report message
 */
function formatWeeklyReport(stats) {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Build top counties text
  const topCountiesText = stats.topCounties.map((item, index) => {
    const medals = ['🥇', '🥈', '🥉'];
    return `   ${medals[index]} ${item[0]} - ${item[1]} 場`;
  }).join('\n');

  // Build institution breakdown
  const institutionText = Object.entries(stats.thisWeek.institutions)
    .map(([type, count]) => `   • ${type}：${count} 場`)
    .join('\n');

  // Build GA section
  let gaSection = '';
  if (stats.ga) {
    gaSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *網站流量分析* (GA4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👀 本週瀏覽次數：*${stats.ga.thisWeek.pageviews.toLocaleString()}* 次 ${getGrowthIcon(stats.ga.growth.pageviews)} (${stats.ga.growth.pageviews}% vs 上週)
👤 本週訪客數：*${stats.ga.thisWeek.users.toLocaleString()}* 人 ${getGrowthIcon(stats.ga.growth.users)} (${stats.ga.growth.users}% vs 上週)
🔄 工作階段：*${stats.ga.thisWeek.sessions.toLocaleString()}* 次
⏱️ 平均停留時間：*${formatDuration(stats.ga.thisWeek.avgSessionDuration)}*
📤 跳出率：*${stats.ga.thisWeek.bounceRate}%*`;
  } else if (CONFIG.ENABLE_GA_REPORT) {
    gaSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 *網站流量分析* (GA4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ GA4 數據取得失敗，請檢查 API 設定`;
  }

  // Build conversion section
  let conversionSection = '';
  if (stats.conversionRate !== null) {
    conversionSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *轉換指標*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 訪客轉報名率：*${stats.conversionRate}%* (${stats.thisWeek.events}/${stats.ga.thisWeek.users})`;
  }

  // Build highlight section
  let highlightSection = '';
  if (stats.thisWeek.events === 0) {
    highlightSection = `⚠️ *本週提醒*\n本週無新增報名，建議檢視推廣策略`;
  } else if (stats.thisWeek.events > stats.lastWeek.events) {
    highlightSection = `✨ *本週亮點*\n🎉 活動報名成長 ${stats.growth.events}%，表現優異！`;
  }

  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 *Hour of AI 週報* | ${formatDateTW(weekStart, 'M/d')} - ${formatDateTW(now, 'M/d')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 *核心成長指標*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 本週新增活動：*${stats.thisWeek.events}* 場 ${getGrowthIcon(stats.growth.events)} (${stats.growth.events}% vs 上週)
✅ 累計總活動：*${stats.total.events}* 場
👥 本週新增參與：*${stats.thisWeek.participants.toLocaleString()}* 人 ${getGrowthIcon(stats.growth.participants)} (${stats.growth.participants}% vs 上週)
🎓 累計總參與：*${stats.total.participants.toLocaleString()}* 人
${gaSection}
${conversionSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗺️ *市場滲透*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔥 本週活躍縣市：${stats.thisWeek.counties.size} 個
🏆 前三名：
${topCountiesText}

📍 覆蓋率：*${stats.coverage.percentage}%* (${stats.coverage.active}/${stats.coverage.total} 縣市)
${stats.coverage.inactive.length > 0 ? `⚠️ 待開發：${stats.coverage.inactive.join('、')}` : '✅ 已涵蓋全台所有縣市！'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏫 *客戶分群*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
本週新增：
${institutionText || '   （無資料）'}

平均參與人數：*${stats.avgParticipants}* 人/場
${stats.thisWeek.codeOrg > 0 ? `🤝 Code.org 合作意願率：${stats.codeOrgRate}%` : ''}

${highlightSection ? `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n${highlightSection}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 查看完整資料：${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
  `.trim();

  return message;
}

/**
 * Test weekly report generation
 */
function testWeeklyReport() {
  sendWeeklyReport();
}

/**
 * Test instant notification
 */
function testInstantNotification() {
  const testData = {
    contactName: '測試使用者',
    email: 'test@example.com',
    county: '台北市',
    institutionType: '學校',
    schoolName: '測試國中',
    participants: '50'
  };

  sendInstantNotification(testData, formatDateTW(new Date(), 'yyyy-MM-dd HH:mm:ss'));
}

// ===== GA4 ANALYTICS INTEGRATION =====

/**
 * 測試 GA4 連線 - 第一次執行會要求授權
 */
function testGa4Connection() {
  if (!CONFIG.ENABLE_GA_REPORT) {
    Logger.log('GA4 報表已停用');
    return;
  }
  
  const propertyId = CONFIG.GA4_PROPERTY_ID;
  
  try {
    // 測試查詢：取得最近 7 天的數據
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const request = {
      dateRanges: [{
        startDate: formatDateTW(oneWeekAgo, 'yyyy-MM-dd'),
        endDate: formatDateTW(today, 'yyyy-MM-dd')
      }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'sessions' }
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'CONTAINS',
            value: CONFIG.PAGE_PATH_FILTER
          }
        }
      },
      limit: 100
    };
    
    Logger.log('正在查詢 GA4 數據...');
    Logger.log('Property ID: ' + propertyId);
    Logger.log('日期範圍: ' + formatDateTW(oneWeekAgo, 'yyyy-MM-dd') + ' 至 ' + formatDateTW(today, 'yyyy-MM-dd'));
    Logger.log('頁面路徑過濾: ' + CONFIG.PAGE_PATH_FILTER);
    
    const response = AnalyticsData.Properties.runReport(
      request,
      'properties/' + propertyId
    );
    
    Logger.log('✅ 連線成功！');
    Logger.log('回應資料: ' + JSON.stringify(response, null, 2));
    
    if (response.rows && response.rows.length > 0) {
      // 匯總所有符合條件的頁面
      let totalPageviews = 0;
      let totalUsers = 0;
      let totalSessions = 0;
      
      response.rows.forEach(row => {
        totalPageviews += parseInt(row.metricValues[0].value) || 0;
        totalUsers += parseInt(row.metricValues[1].value) || 0;
        totalSessions += parseInt(row.metricValues[2].value) || 0;
        Logger.log(`  路徑: ${row.dimensionValues[0].value} - 瀏覽: ${row.metricValues[0].value}, 訪客: ${row.metricValues[1].value}`);
      });
      
      Logger.log('📊 匯總數據：');
      Logger.log('  總瀏覽次數: ' + totalPageviews);
      Logger.log('  總訪客數: ' + totalUsers);
      Logger.log('  總工作階段: ' + totalSessions);
    } else {
      Logger.log('⚠️ 查詢成功，但該日期範圍內沒有數據');
      Logger.log('   可能原因：');
      Logger.log('   1. 頁面路徑過濾太嚴格（路徑不完全匹配）');
      Logger.log('   2. 該日期範圍內真的沒有流量');
      Logger.log('   3. GA4 數據有 24-48 小時延遲');
    }
    
  } catch (error) {
    Logger.log('❌ 錯誤: ' + error.toString());
    Logger.log('詳細錯誤: ' + JSON.stringify(error, null, 2));
    
    if (error.toString().includes('PERMISSION_DENIED')) {
      Logger.log('💡 提示：請確認你的 Google 帳號有該 GA4 Property 的存取權限');
    } else if (error.toString().includes('not found')) {
      Logger.log('💡 提示：請確認 GA4_PROPERTY_ID 是否正確');
    } else if (error.toString().includes('API not enabled')) {
      Logger.log('💡 提示：請在 Google Cloud Console 啟用 Google Analytics Data API');
    }
  }
}

/**
 * 取得 GA4 週報數據（整合到週報系統用）
 * 修正：匯總所有符合路徑過濾條件的頁面數據
 */
function getGA4WeeklyStats() {
  if (!CONFIG.ENABLE_GA_REPORT) {
    return null;
  }
  
  const propertyId = CONFIG.GA4_PROPERTY_ID;
  
  try {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // 執行查詢的輔助函數（匯總所有符合條件的頁面）
    const runReport = (startDate, endDate) => {
      const request = {
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'screenPageViews' },
          { name: 'totalUsers' },
          { name: 'sessions' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' }
        ],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: {
              matchType: 'CONTAINS',
              value: CONFIG.PAGE_PATH_FILTER
            }
          }
        },
        limit: 100  // 增加限制以取得所有符合的頁面
      };
      
      const response = AnalyticsData.Properties.runReport(
        request,
        'properties/' + propertyId
      );
      
      // 匯總所有符合條件的頁面數據
      if (response.rows && response.rows.length > 0) {
        let totalPageviews = 0;
        let totalUsers = 0;
        let totalSessions = 0;
        let weightedDuration = 0;
        let weightedBounceRate = 0;
        
        response.rows.forEach(row => {
          const pageviews = parseInt(row.metricValues[0].value) || 0;
          const users = parseInt(row.metricValues[1].value) || 0;
          const sessions = parseInt(row.metricValues[2].value) || 0;
          const avgDuration = parseFloat(row.metricValues[3].value) || 0;
          const bounceRate = parseFloat(row.metricValues[4].value) || 0;
          
          totalPageviews += pageviews;
          totalUsers += users;
          totalSessions += sessions;
          
          // 加權平均（以 sessions 為權重）
          weightedDuration += avgDuration * sessions;
          weightedBounceRate += bounceRate * sessions;
        });
        
        // 計算加權平均值
        const avgSessionDuration = totalSessions > 0 ? weightedDuration / totalSessions : 0;
        const avgBounceRate = totalSessions > 0 ? weightedBounceRate / totalSessions : 0;
        
        return {
          pageviews: totalPageviews,
          users: totalUsers,
          sessions: totalSessions,
          avgSessionDuration: avgSessionDuration.toFixed(1),
          bounceRate: (avgBounceRate * 100).toFixed(1)
        };
      }
      
      return {
        pageviews: 0,
        users: 0,
        sessions: 0,
        avgSessionDuration: 0,
        bounceRate: 0
      };
    };
    
    // 取得本週和上週數據
    const thisWeek = runReport(formatDateTW(oneWeekAgo, 'yyyy-MM-dd'), formatDateTW(today, 'yyyy-MM-dd'));
    const lastWeek = runReport(formatDateTW(twoWeeksAgo, 'yyyy-MM-dd'), formatDateTW(oneWeekAgo, 'yyyy-MM-dd'));
    
    return {
      thisWeek: thisWeek,
      lastWeek: lastWeek,
      growth: {
        pageviews: calculateGrowthRate(thisWeek.pageviews, lastWeek.pageviews),
        users: calculateGrowthRate(thisWeek.users, lastWeek.users)
      }
    };
    
  } catch (error) {
    Logger.log('Error fetching GA4 data: ' + error.toString());
    return null;
  }
}

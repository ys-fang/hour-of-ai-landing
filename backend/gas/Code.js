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
  GA4_PROPERTY_ID: '521199085',  // GA4 Property ID（Hour of AI Landing）
  PAGE_PATH_FILTER: '/',  // Firebase Hosting 根路徑（舊值 '/event/2025-hour-of-ai/' 為 WordPress 路徑）

  // ===== Taiwan Rank Tracker 設定 =====
  ENABLE_RANK_TRACKER: true,
  RANK_TRACKER_DATA_URL: 'https://docs.google.com/spreadsheets/d/1QDTmNNP3i6Nfhg6y7qp5V_cSL6ciNsMyF3bEjyKXTsY/export?format=csv',
  RANK_TRACKER_TARGET_COUNTRY: 'Taiwan',
  GLOBAL_TOP10_SHEET_NAME: 'GlobalTop10History',  // 全球 Top 10 歷史資料工作表

  // ===== Click Tracking 設定 =====
  ENABLE_CLICK_TRACKER: true,
  CLICK_HISTORY_SHEET_NAME: 'ClickHistory',  // 點擊歷史資料工作表

  // ===== Google Sheets 設定 =====
  SPREADSHEET_ID: '1am2e_RU_fkx--338b7F76NjjP8CM5O1wnKYJmDRubhM',  // HOA 報名資料試算表

  // ===== Upcoming Events 設定 =====
  UPCOMING_EVENTS_SHEET_NAME: 'UpcomingEvents',  // 活動資料工作表名稱
  UPCOMING_EVENTS_CACHE_DURATION: 5 * 60,        // 快取時間（秒）
  UPCOMING_EVENTS_CACHE_KEY: 'upcoming_events_cache',
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
 * 標準化縣市名稱（臺→台）
 * 解決使用者輸入「臺北市」vs「台北市」導致覆蓋率計算錯誤的問題
 * @param {string} county - 原始縣市名稱
 * @returns {string} 標準化後的縣市名稱
 */
function normalizeCountyName(county) {
  if (!county || typeof county !== 'string') return '未知';
  return county.trim().replace(/臺/g, '台');
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

    if (action === 'getUpcomingEvents') {
      return getUpcomingEvents();
    }

    if (action === 'getGlobalRank') {
      return getGlobalRank();
    }

    // Default response
    return ContentService.createTextOutput('Hour of AI Statistics API v3.2')
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
    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getActiveSheet();
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
      const county = normalizeCountyName(row[COLUMN_COUNTY]);
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

    const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getActiveSheet();

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

  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
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
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getActiveSheet();
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
    const county = normalizeCountyName(row[COLUMN_COUNTY]);
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

  // 取得 GA4 點擊數據
  stats.clicks = getGA4ClickStats();

  // 計算轉換率（如果有 GA 數據）
  if (stats.ga && stats.ga.thisWeek.users > 0) {
    stats.conversionRate = ((stats.thisWeek.events / stats.ga.thisWeek.users) * 100).toFixed(1);
  } else {
    stats.conversionRate = null;
  }

  // 計算 CTA 點擊轉換率（點擊數 / 頁面瀏覽數）
  if (stats.clicks && stats.ga && stats.ga.thisWeek.pageviews > 0) {
    stats.clickConversionRate = ((stats.clicks.thisWeek.total / stats.ga.thisWeek.pageviews) * 100).toFixed(2);
  } else {
    stats.clickConversionRate = null;
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

  // Build click tracking section
  let clickSection = '';
  if (stats.clicks && stats.clicks.thisWeek) {
    const clicks = stats.clicks;
    clickSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *活動連結點擊追蹤*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 數據世界 (Active AI)：*${clicks.thisWeek.activeAi}* 次 ${getGrowthIcon(clicks.growth.activeAi)} (${clicks.growth.activeAi}% vs 上週)
🎮 半導體冒險 (AI Square)：*${clicks.thisWeek.aiSquare}* 次 ${getGrowthIcon(clicks.growth.aiSquare)} (${clicks.growth.aiSquare}% vs 上週)
📊 總點擊數：*${clicks.thisWeek.total}* 次 ${getGrowthIcon(clicks.growth.total)} (${clicks.growth.total}% vs 上週)${stats.clickConversionRate !== null ? `
🎯 點擊轉換率：*${stats.clickConversionRate}%* (${clicks.thisWeek.total} clicks / ${stats.ga.thisWeek.pageviews} pageviews)` : ''}`;
  } else if (CONFIG.ENABLE_GA_REPORT) {
    clickSection = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 *活動連結點擊追蹤*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 點擊數據尚無資料（新功能部署中）`;
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
${clickSection}
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
📊 查看完整資料：${SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getUrl()}
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

// ===== GA4 CLICK TRACKING =====

/**
 * 取得 GA4 活動 CTA 點擊數據
 * 追蹤 'activity_cta_click' 事件，用於計算轉換率
 *
 * @returns {Object|null} 點擊統計數據或 null（如果 GA4 報告已停用）
 */
function getGA4ClickStats() {
  if (!CONFIG.ENABLE_GA_REPORT) {
    return null;
  }

  const propertyId = CONFIG.GA4_PROPERTY_ID;

  try {
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    /**
     * 執行 GA4 事件查詢
     * @param {string} startDate - 開始日期 (YYYY-MM-DD)
     * @param {string} endDate - 結束日期 (YYYY-MM-DD)
     * @returns {Object} 點擊數據 { total, activeAi, aiSquare }
     */
    const runClickReport = (startDate, endDate) => {
      // 查詢兩個不同的事件名稱：active_ai_click 和 ai_square_click
      const request = {
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [
          { name: 'eventName' }
        ],
        metrics: [
          { name: 'eventCount' }
        ],
        dimensionFilter: {
          orGroup: {
            expressions: [
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'active_ai_click'
                  }
                }
              },
              {
                filter: {
                  fieldName: 'eventName',
                  stringFilter: {
                    matchType: 'EXACT',
                    value: 'ai_square_click'
                  }
                }
              }
            ]
          }
        },
        limit: 100
      };

      const response = AnalyticsData.Properties.runReport(
        request,
        'properties/' + propertyId
      );

      // Debug: 記錄 API 回應
      Logger.log('[getGA4ClickStats] Query: ' + startDate + ' to ' + endDate);
      Logger.log('[getGA4ClickStats] Response rowCount: ' + (response.rowCount || 0));

      // 初始化計數
      let totalClicks = 0;
      let activeAiClicks = 0;
      let aiSquareClicks = 0;

      if (response.rows && response.rows.length > 0) {
        response.rows.forEach(row => {
          const eventName = row.dimensionValues[0]?.value || '';
          const clickCount = parseInt(row.metricValues[0].value) || 0;

          Logger.log('[getGA4ClickStats] Found event: ' + eventName + ' = ' + clickCount);

          totalClicks += clickCount;

          if (eventName === 'active_ai_click') {
            activeAiClicks += clickCount;
          } else if (eventName === 'ai_square_click') {
            aiSquareClicks += clickCount;
          }
        });
      } else {
        Logger.log('[getGA4ClickStats] No rows returned for period ' + startDate + ' to ' + endDate);
      }

      return {
        total: totalClicks,
        activeAi: activeAiClicks,
        aiSquare: aiSquareClicks
      };
    };

    // 取得本週和上週數據
    const thisWeek = runClickReport(formatDateTW(oneWeekAgo, 'yyyy-MM-dd'), formatDateTW(today, 'yyyy-MM-dd'));
    const lastWeek = runClickReport(formatDateTW(twoWeeksAgo, 'yyyy-MM-dd'), formatDateTW(oneWeekAgo, 'yyyy-MM-dd'));

    return {
      thisWeek: thisWeek,
      lastWeek: lastWeek,
      growth: {
        total: calculateGrowthRate(thisWeek.total, lastWeek.total),
        activeAi: calculateGrowthRate(thisWeek.activeAi, lastWeek.activeAi),
        aiSquare: calculateGrowthRate(thisWeek.aiSquare, lastWeek.aiSquare)
      }
    };

  } catch (error) {
    Logger.log('Error fetching GA4 click data: ' + error.toString());
    return null;
  }
}

/**
 * 測試 GA4 點擊追蹤數據
 */
function testGA4ClickStats() {
  const stats = getGA4ClickStats();
  if (stats) {
    Logger.log('✅ GA4 Click Stats:');
    Logger.log('本週總點擊: ' + stats.thisWeek.total);
    Logger.log('  - Active AI: ' + stats.thisWeek.activeAi);
    Logger.log('  - AI Square: ' + stats.thisWeek.aiSquare);
    Logger.log('上週總點擊: ' + stats.lastWeek.total);
    Logger.log('成長率: ' + stats.growth.total + '%');
  } else {
    Logger.log('❌ 無法取得 GA4 點擊數據');
  }
}

/**
 * 診斷 GA4 點擊追蹤問題 - 詳細 debug 版本
 * 用於排查為何點擊數據為 0 的問題
 */
function debugGA4ClickTracking() {
  Logger.log('===== GA4 Click Tracking Debug =====');
  Logger.log('Config GA4_PROPERTY_ID: ' + CONFIG.GA4_PROPERTY_ID);
  Logger.log('Config ENABLE_GA_REPORT: ' + CONFIG.ENABLE_GA_REPORT);

  if (!CONFIG.ENABLE_GA_REPORT) {
    Logger.log('❌ GA4 報表已停用');
    return;
  }

  const propertyId = CONFIG.GA4_PROPERTY_ID;

  try {
    // Step 1: 測試日期範圍
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startDate = formatDateTW(oneWeekAgo, 'yyyy-MM-dd');
    const endDate = formatDateTW(today, 'yyyy-MM-dd');

    Logger.log('Date range: ' + startDate + ' to ' + endDate);

    // Step 2: 先查詢所有事件名稱（不做過濾）看看有哪些事件
    Logger.log('\n--- Step 2: 查詢所有事件類型 ---');
    const allEventsRequest = {
      dateRanges: [{ startDate: startDate, endDate: endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      limit: 50
    };

    const allEventsResponse = AnalyticsData.Properties.runReport(
      allEventsRequest,
      'properties/' + propertyId
    );

    Logger.log('總共找到 ' + (allEventsResponse.rows ? allEventsResponse.rows.length : 0) + ' 種事件');

    if (allEventsResponse.rows && allEventsResponse.rows.length > 0) {
      Logger.log('事件列表:');
      allEventsResponse.rows.forEach((row, index) => {
        const eventName = row.dimensionValues[0].value;
        const count = row.metricValues[0].value;
        Logger.log('  ' + (index + 1) + '. ' + eventName + ': ' + count + ' 次');

        // 特別標註我們關心的事件
        if (eventName.includes('click') || eventName.includes('active') || eventName.includes('ai_square')) {
          Logger.log('     ⭐ 這是我們關心的點擊相關事件！');
        }
      });
    } else {
      Logger.log('❌ 沒有找到任何事件！這可能表示：');
      Logger.log('   1. GA4 Property ID 不正確');
      Logger.log('   2. 沒有任何流量/事件');
      Logger.log('   3. API 權限問題');
    }

    // Step 3: 專門查詢 active_ai_click 事件
    Logger.log('\n--- Step 3: 查詢 active_ai_click 事件 ---');
    const clickRequest = {
      dateRanges: [{ startDate: startDate, endDate: endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'EXACT',
            value: 'active_ai_click'
          }
        }
      }
    };

    const clickResponse = AnalyticsData.Properties.runReport(
      clickRequest,
      'properties/' + propertyId
    );

    if (clickResponse.rows && clickResponse.rows.length > 0) {
      Logger.log('✅ 找到 active_ai_click 事件:');
      clickResponse.rows.forEach(row => {
        Logger.log('   count: ' + row.metricValues[0].value);
      });
    } else {
      Logger.log('❌ 沒有找到 active_ai_click 事件');
      Logger.log('   Raw response rowCount: ' + (clickResponse.rowCount || 0));
    }

    // Step 4: 查詢包含 "click" 的所有事件（模糊匹配）
    Logger.log('\n--- Step 4: 查詢包含 "click" 的事件 ---');
    const fuzzyClickRequest = {
      dateRanges: [{ startDate: startDate, endDate: endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        filter: {
          fieldName: 'eventName',
          stringFilter: {
            matchType: 'CONTAINS',
            value: 'click'
          }
        }
      }
    };

    const fuzzyClickResponse = AnalyticsData.Properties.runReport(
      fuzzyClickRequest,
      'properties/' + propertyId
    );

    if (fuzzyClickResponse.rows && fuzzyClickResponse.rows.length > 0) {
      Logger.log('✅ 找到包含 "click" 的事件:');
      fuzzyClickResponse.rows.forEach(row => {
        Logger.log('   ' + row.dimensionValues[0].value + ': ' + row.metricValues[0].value + ' 次');
      });
    } else {
      Logger.log('❌ 沒有找到任何包含 "click" 的事件');
    }

    Logger.log('\n===== Debug 完成 =====');

  } catch (error) {
    Logger.log('❌ Error during debug: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
  }
}

// ===== DAILY CLICK TRACKING TO SHEET =====

/**
 * 記錄每日點擊數據到試算表
 * 類似 Taiwan Rank Tracker 的 logGlobalTop10ToSheet()
 *
 * @param {Object} clickData - 點擊數據 { total, activeAi, aiSquare }
 * @param {string} date - 日期字串 (YYYY-MM-DD)
 */
function logDailyClicksToSheet(clickData, date) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.CLICK_HISTORY_SHEET_NAME);

  // 自動建立工作表（如不存在）
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.CLICK_HISTORY_SHEET_NAME);
    sheet.appendRow(['date', 'total_clicks', 'active_ai_clicks', 'ai_square_clicks', 'notes']);
    sheet.setFrozenRows(1);
    Logger.log(`✅ Created new sheet: ${CONFIG.CLICK_HISTORY_SHEET_NAME}`);
  }

  // 檢查今天是否已經記錄過（避免重複）
  const data = sheet.getDataRange().getValues();
  const existingRow = data.findIndex(row => row[0] === date);

  if (existingRow > 0) {
    // 更新現有記錄
    sheet.getRange(existingRow + 1, 2, 1, 3).setValues([[
      clickData.total,
      clickData.activeAi,
      clickData.aiSquare
    ]]);
    Logger.log(`✅ Updated existing record for ${date}`);
  } else {
    // 新增記錄
    sheet.appendRow([
      date,
      clickData.total,
      clickData.activeAi,
      clickData.aiSquare,
      'Auto-logged'
    ]);
    Logger.log(`✅ Logged click data to ${CONFIG.CLICK_HISTORY_SHEET_NAME} for ${date}`);
  }
}

/**
 * 主函數 - 每日執行點擊數據記錄
 * Setup: Apps Script Editor > Triggers > Add Trigger
 * - Function: trackDailyClicks
 * - Event source: Time-driven
 * - Type: Day timer
 * - Time: 選擇適合的時間（建議晚上，確保當天數據完整）
 */
function trackDailyClicks() {
  if (!CONFIG.ENABLE_CLICK_TRACKER) {
    Logger.log('Daily Click Tracker is disabled');
    return;
  }

  try {
    // 取得昨天的日期（因為 GA4 有延遲，記錄前一天的完整數據比較準確）
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = formatDateTW(yesterday, 'yyyy-MM-dd');

    // 取得昨天的點擊數據
    const startDate = dateStr;
    const endDate = dateStr;

    const request = {
      dateRanges: [{ startDate: startDate, endDate: endDate }],
      dimensions: [
        { name: 'eventName' }
      ],
      metrics: [
        { name: 'eventCount' }
      ],
      dimensionFilter: {
        orGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'active_ai_click'
                }
              }
            },
            {
              filter: {
                fieldName: 'eventName',
                stringFilter: {
                  matchType: 'EXACT',
                  value: 'ai_square_click'
                }
              }
            }
          ]
        }
      },
      limit: 100
    };

    const response = AnalyticsData.Properties.runReport(
      request,
      'properties/' + CONFIG.GA4_PROPERTY_ID
    );

    // Debug: 記錄 API 回應
    Logger.log('[trackDailyClicks] Query date: ' + dateStr);
    Logger.log('[trackDailyClicks] Response rowCount: ' + (response.rowCount || 0));

    // 計算點擊數
    let totalClicks = 0;
    let activeAiClicks = 0;
    let aiSquareClicks = 0;

    if (response.rows && response.rows.length > 0) {
      response.rows.forEach(row => {
        const eventName = row.dimensionValues[0]?.value || '';
        const clickCount = parseInt(row.metricValues[0].value) || 0;

        Logger.log('[trackDailyClicks] Found event: ' + eventName + ' = ' + clickCount);

        totalClicks += clickCount;

        if (eventName === 'active_ai_click') {
          activeAiClicks += clickCount;
        } else if (eventName === 'ai_square_click') {
          aiSquareClicks += clickCount;
        }
      });
    } else {
      Logger.log('[trackDailyClicks] No click events found for ' + dateStr);
    }

    const clickData = {
      total: totalClicks,
      activeAi: activeAiClicks,
      aiSquare: aiSquareClicks
    };

    // 記錄到試算表
    logDailyClicksToSheet(clickData, dateStr);

    Logger.log(`✅ Successfully tracked daily clicks for ${dateStr}: Total=${totalClicks}, ActiveAI=${activeAiClicks}, AISquare=${aiSquareClicks}`);

  } catch (error) {
    Logger.log('❌ Error tracking daily clicks: ' + error.toString());
  }
}

/**
 * 測試每日點擊追蹤
 */
function testDailyClickTracker() {
  trackDailyClicks();
}

/**
 * 設定每日點擊追蹤的時間觸發器
 * 執行一次即可自動建立 trigger
 * 建議時間：每天上午 9-10 點（讓 GA4 有時間處理前一天的數據）
 */
function setupDailyClickTrigger() {
  // 檢查是否已存在相同的 trigger
  const triggers = ScriptApp.getProjectTriggers();
  const existingTrigger = triggers.find(trigger =>
    trigger.getHandlerFunction() === 'trackDailyClicks'
  );

  if (existingTrigger) {
    Logger.log('⚠️ Trigger already exists for trackDailyClicks');
    Logger.log('Trigger ID: ' + existingTrigger.getUniqueId());
    Logger.log('如要重新設定，請先執行 removeDailyClickTrigger()');
    return;
  }

  // 建立新的每日觸發器：每天上午 9-10 點執行
  ScriptApp.newTrigger('trackDailyClicks')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();

  Logger.log('✅ Daily click tracking trigger created successfully!');
  Logger.log('Function: trackDailyClicks');
  Logger.log('Schedule: Every day at 9-10am');
  Logger.log('');
  Logger.log('📊 The trigger will:');
  Logger.log('  1. Run daily at 9-10am');
  Logger.log('  2. Query GA4 for yesterday\'s click data');
  Logger.log('  3. Log summary to ClickHistory sheet');
  Logger.log('');
  Logger.log('🔍 View triggers: Apps Script Editor > Triggers (clock icon)');
}

/**
 * 移除每日點擊追蹤的時間觸發器
 * 如需重新設定 trigger，先執行此函數
 */
function removeDailyClickTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = false;

  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'trackDailyClicks') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('✅ Removed trigger: ' + trigger.getUniqueId());
      removed = true;
    }
  });

  if (!removed) {
    Logger.log('ℹ️ No trigger found for trackDailyClicks');
  }
}

/**
 * 列出所有現有的 triggers
 */
function listAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  if (triggers.length === 0) {
    Logger.log('ℹ️ No triggers found');
    return;
  }

  Logger.log('📋 Current triggers:');
  Logger.log('');

  triggers.forEach((trigger, index) => {
    Logger.log(`${index + 1}. ${trigger.getHandlerFunction()}`);
    Logger.log(`   Trigger ID: ${trigger.getUniqueId()}`);
    Logger.log(`   Event Type: ${trigger.getEventType()}`);

    if (trigger.getEventType() === ScriptApp.EventType.CLOCK) {
      Logger.log(`   Source: Time-driven`);
    }

    Logger.log('');
  });
}

// ===== GLOBAL RANK API =====

/**
 * Get pre-computed global rank data from GlobalTop10History sheet
 * Returns the latest day's ranking data with Taiwan analysis
 */
function getGlobalRank() {
  try {
    // Check cache first (5 min)
    const cache = CacheService.getScriptCache();
    const cached = cache.get('global_rank_data');
    if (cached) {
      return ContentService.createTextOutput(cached)
        .setMimeType(ContentService.MimeType.JSON);
    }

    const fullData = fetchGlobalRankData();
    const fullSorted = fullData.filter(item => item.count > 0).sort((a, b) => b.count - a.count);
    const result = buildGlobalRankResponse(fullSorted, formatDateTW(new Date(), 'yyyy-MM-dd'));

    const jsonStr = JSON.stringify(result);
    cache.put('global_rank_data', jsonStr, 300);
    return ContentService.createTextOutput(jsonStr)
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error in getGlobalRank: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Build the global rank API response from sorted data
 */
function buildGlobalRankResponse(sorted, date) {
  const taiwanIndex = sorted.findIndex(item => item.country === CONFIG.RANK_TRACKER_TARGET_COUNTRY);
  const contextRange = 2;

  if (taiwanIndex === -1) {
    return { status: 'error', message: 'Taiwan not found in data' };
  }

  const taiwan = sorted[taiwanIndex];
  const rank = taiwanIndex + 1;
  const totalCountries = sorted.length;

  const startIdx = Math.max(0, taiwanIndex - contextRange);
  const nearbyCountries = [
    ...sorted.slice(startIdx, taiwanIndex)
      .map((c, idx) => ({ ...c, rank: startIdx + idx + 1, position: 'above' })),
    { ...taiwan, rank: rank, position: 'current' },
    ...sorted.slice(taiwanIndex + 1, taiwanIndex + contextRange + 1)
      .map((c, idx) => ({ ...c, rank: rank + idx + 1, position: 'below' }))
  ];

  return {
    status: 'success',
    globalRank: rank,
    totalCountries: totalCountries,
    percentile: ((totalCountries - rank + 1) / totalCountries * 100).toFixed(1),
    taiwanCount: taiwan.count,
    nearbyCountries: nearbyCountries,
    topCountry: sorted[0],
    lastUpdated: date || formatDateTW(new Date(), 'yyyy-MM-dd')
  };
}

// ===== TAIWAN RANK TRACKER =====
// 每日追蹤台灣在 Hour of AI 全球活動的排名
// 設定 Time-driven trigger: 每日執行 trackTaiwanRank

/**
 * 記錄全球 Top 10 國家到試算表
 * @param {Array} sortedData - 已依活動數排序的國家資料
 */
function logGlobalTop10ToSheet(sortedData) {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.GLOBAL_TOP10_SHEET_NAME);

  // 自動建立工作表（如不存在）
  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.GLOBAL_TOP10_SHEET_NAME);
    sheet.appendRow(['date', 'rank', 'country', 'count']);
    sheet.setFrozenRows(1);
    Logger.log(`✅ Created new sheet: ${CONFIG.GLOBAL_TOP10_SHEET_NAME}`);
  }

  const today = formatDateTW(new Date(), 'yyyy-MM-dd');
  const top10 = sortedData.slice(0, 10);

  // 寫入 Top 10 資料
  top10.forEach((item, index) => {
    sheet.appendRow([today, index + 1, item.country, item.count]);
  });

  Logger.log(`✅ Logged ${top10.length} countries to ${CONFIG.GLOBAL_TOP10_SHEET_NAME} for ${today}`);
}

/**
 * 主函數 - 每日執行追蹤台灣排名
 * Setup: Apps Script Editor > Triggers > Add Trigger
 * - Function: trackTaiwanRank
 * - Event source: Time-driven
 * - Type: Day timer
 * - Time: 選擇適合的時間
 */
function trackTaiwanRank() {
  if (!CONFIG.ENABLE_RANK_TRACKER) {
    Logger.log('Taiwan Rank Tracker is disabled');
    return;
  }

  try {
    const data = fetchGlobalRankData();

    // 排序資料（用於 Top 10 和台灣排名分析）
    const sorted = data
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);

    // 記錄 Top 10 到試算表
    logGlobalTop10ToSheet(sorted);

    // 分析台灣排名（使用已排序資料）
    const taiwanData = analyzeTaiwanRankFromSorted(sorted);

    // 發送通知（包含試算表連結）
    sendRankNotification(taiwanData);

    Logger.log('✅ Successfully tracked Taiwan rank: #' + taiwanData.rank);
  } catch (error) {
    Logger.log('❌ Error tracking Taiwan rank: ' + error.toString());
    sendToSlack(`⚠️ Taiwan Rank Tracker 錯誤：${error.toString()}`);
  }
}

/**
 * 抓取全球 Hour of AI 排名資料
 */
function fetchGlobalRankData() {
  const response = UrlFetchApp.fetch(CONFIG.RANK_TRACKER_DATA_URL);
  const csvText = response.getContentText();
  const lines = csvText.split('\n');

  const data = [];
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [country, count] = line.split(',');
    if (country && count) {
      data.push({
        country: country.trim().replace(/^"|"$/g, ''),
        count: parseInt(count.trim())
      });
    }
  }

  return data;
}

/**
 * 分析台灣排名及前後國家（從已排序資料）
 * @param {Array} sorted - 已排序的國家資料陣列
 */
function analyzeTaiwanRankFromSorted(sorted) {
  const taiwanIndex = sorted.findIndex(item => item.country === CONFIG.RANK_TRACKER_TARGET_COUNTRY);

  if (taiwanIndex === -1) {
    throw new Error('Taiwan not found in data');
  }

  const taiwan = sorted[taiwanIndex];
  const rank = taiwanIndex + 1;
  const totalCountries = sorted.length;

  return {
    rank: rank,
    count: taiwan.count,
    totalCountries: totalCountries,
    percentile: ((totalCountries - rank + 1) / totalCountries * 100).toFixed(1),
    context: {
      above: sorted.slice(Math.max(0, taiwanIndex - 2), taiwanIndex),
      below: sorted.slice(taiwanIndex + 1, taiwanIndex + 3)
    },
    topCountry: sorted[0],
    timestamp: new Date()
  };
}

/**
 * 分析台灣排名及前後國家（原始版本，供向後相容）
 */
function analyzeTaiwanRank(data) {
  const sorted = data
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  return analyzeTaiwanRankFromSorted(sorted);
}

/**
 * 發送排名通知到 Slack
 */
function sendRankNotification(data) {
  const timestamp = formatDateTW(data.timestamp, 'yyyy-MM-dd HH:mm:ss');

  // 建立前後國家文字
  let aboveText = '';
  data.context.above.forEach((country, idx) => {
    const r = data.rank - data.context.above.length + idx;
    aboveText += `   #${r} ${country.country} - ${country.count} 場\n`;
  });

  let belowText = '';
  data.context.below.forEach((country, idx) => {
    const r = data.rank + idx + 1;
    belowText += `   #${r} ${country.country} - ${country.count} 場\n`;
  });

  // 取得試算表 URL
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const spreadsheetUrl = spreadsheet.getUrl();
  const top10Sheet = spreadsheet.getSheetByName(CONFIG.GLOBAL_TOP10_SHEET_NAME);
  const sheetGid = top10Sheet ? top10Sheet.getSheetId() : '';
  const historyUrl = sheetGid ? `${spreadsheetUrl}#gid=${sheetGid}` : spreadsheetUrl;

  const message = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🇹🇼 *Taiwan Hour of AI 排名追蹤*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📅 更新時間：${timestamp}

🏅 *台灣排名：第 ${data.rank} 名* / ${data.totalCountries} 國
📈 活動數量：*${data.count}* 場
⭐ 全球前 *${data.percentile}%*

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 *前後排名*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▲ 領先台灣：
${aboveText || '   (無)'}
➡️  *#${data.rank} 台灣 - ${data.count} 場* ⬅️

▼ 落後台灣：
${belowText || '   (無)'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 *全球第一*：${data.topCountry.country} (${data.topCountry.count} 場)

📌 資料來源：https://csforall.org/en-US/hour-of-ai/how-to/global
📊 歷史資料：${historyUrl}
  `.trim();

  sendToSlack(message);
}

/**
 * 測試 Taiwan Rank Tracker
 */
function testTaiwanRankTracker() {
  trackTaiwanRank();
}

/**
 * 測試 Global Top 10 寫入功能
 */
function testGlobalTop10Logging() {
  const data = fetchGlobalRankData();
  const sorted = data
    .filter(item => item.count > 0)
    .sort((a, b) => b.count - a.count);

  logGlobalTop10ToSheet(sorted);

  Logger.log('✅ Test completed - check GlobalTop10History sheet');
  Logger.log(`Top 3: ${sorted.slice(0, 3).map(c => c.country).join(', ')}`);
}

/**
 * 測試 getGlobalRank API endpoint
 */
function testGetGlobalRank() {
  const result = getGlobalRank();
  const content = result.getContent();
  const data = JSON.parse(content);
  Logger.log('getGlobalRank response: ' + JSON.stringify(data, null, 2));
  Logger.log(`Status: ${data.status}, Rank: ${data.globalRank}, Total: ${data.totalCountries}`);
}

// ===== UPCOMING EVENTS API =====

/**
 * Get upcoming events from the UpcomingEvents sheet
 * API endpoint: ?action=getUpcomingEvents
 *
 * Sheet structure (UpcomingEvents):
 * id | title | description | url | startDate | endDate | isActive | sortOrder
 */
function getUpcomingEvents() {
  try {
    // Try to get from cache first
    const cache = CacheService.getScriptCache();
    const cached = cache.get(CONFIG.UPCOMING_EVENTS_CACHE_KEY);

    if (cached) {
      Logger.log('Returning cached upcoming events');
      return ContentService.createTextOutput(cached)
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Get the UpcomingEvents sheet
    const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONFIG.UPCOMING_EVENTS_SHEET_NAME);

    if (!sheet) {
      Logger.log('UpcomingEvents sheet not found, returning empty array');
      return createEventsResponse([]);
    }

    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      // Only headers or empty
      return createEventsResponse([]);
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Map column indices
    const columns = {
      id: headers.indexOf('id'),
      title: headers.indexOf('title'),
      description: headers.indexOf('description'),
      url: headers.indexOf('url'),
      startDate: headers.indexOf('startDate'),
      endDate: headers.indexOf('endDate'),
      isActive: headers.indexOf('isActive'),
      sortOrder: headers.indexOf('sortOrder'),
    };

    // Validate required columns exist
    const requiredColumns = ['id', 'title', 'description', 'url', 'startDate', 'isActive'];
    for (const col of requiredColumns) {
      if (columns[col] === -1) {
        Logger.log('Missing required column: ' + col);
        return createEventsResponse([], 'Missing required column: ' + col);
      }
    }

    // Process rows into event objects
    const events = rows
      .map(function(row, index) {
        try {
          return {
            id: String(row[columns.id] || ''),
            title: String(row[columns.title] || ''),
            description: String(row[columns.description] || ''),
            url: String(row[columns.url] || ''),
            startDate: formatEventDateValue(row[columns.startDate]),
            endDate: columns.endDate !== -1 ? formatEventDateValue(row[columns.endDate]) : null,
            isActive: parseEventBoolean(row[columns.isActive]),
            sortOrder: columns.sortOrder !== -1 ? parseEventNumber(row[columns.sortOrder]) : index,
          };
        } catch (error) {
          Logger.log('Error processing row ' + (index + 2) + ': ' + error.toString());
          return null;
        }
      })
      .filter(function(event) { return event !== null; });

    Logger.log('Found ' + events.length + ' events in sheet');

    // Create response and cache it
    const response = createEventsResponse(events);
    cache.put(
      CONFIG.UPCOMING_EVENTS_CACHE_KEY,
      response.getContent(),
      CONFIG.UPCOMING_EVENTS_CACHE_DURATION
    );

    return response;

  } catch (error) {
    Logger.log('Error in getUpcomingEvents: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString(),
      events: []
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Create standardized events response
 */
function createEventsResponse(events, warning) {
  var response = {
    status: 'success',
    events: events,
    count: events.length,
    timestamp: new Date().toISOString()
  };

  if (warning) {
    response.warning = warning;
  }

  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Format date value from Google Sheets for events
 */
function formatEventDateValue(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Utilities.formatDate(value, 'Asia/Taipei', 'yyyy-MM-dd');
  }

  if (typeof value === 'string') {
    var date = new Date(value);
    if (!isNaN(date.getTime())) {
      return Utilities.formatDate(date, 'Asia/Taipei', 'yyyy-MM-dd');
    }
    return value;
  }

  if (typeof value === 'number') {
    // Google Sheets serial date
    var date = new Date((value - 25569) * 86400 * 1000);
    return Utilities.formatDate(date, 'Asia/Taipei', 'yyyy-MM-dd');
  }

  return null;
}

/**
 * Parse boolean from various formats for events
 */
function parseEventBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    var lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '是' || lower === '1';
  }
  if (typeof value === 'number') return value !== 0;
  return false;
}

/**
 * Parse number from various formats for events
 */
function parseEventNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    var num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Clear the events cache
 */
function clearEventsCache() {
  var cache = CacheService.getScriptCache();
  cache.remove(CONFIG.UPCOMING_EVENTS_CACHE_KEY);
  Logger.log('Events cache cleared');
}

/**
 * Test function for upcoming events
 */
function testGetUpcomingEvents() {
  var result = getUpcomingEvents();
  Logger.log('Result: ' + result.getContent());
}

/**
 * Google Apps Script - Statistics API for Hour of AI Dashboard
 *
 * This script extends the existing form submission handler to also provide
 * real-time statistics for the live dashboard.
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your existing Google Apps Script project (the one handling form submissions)
 * 2. Add this code to your existing doGet() and doPost() functions
 * 3. Redeploy the web app
 * 4. The same URL will handle both form submissions and statistics requests
 */

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
    return ContentService.createTextOutput('Hour of AI Statistics API')
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

    // Column indices (adjust based on your sheet structure)
    const COLUMN_COUNTY = 5;        // 縣市 (county)
    const COLUMN_PARTICIPANTS = 8;  // 預估參與人數 (participants)
    const COLUMN_INSTITUTION = 9;   // 機構類型 (institutionType)
    const COLUMN_TIMESTAMP = 0;     // 時間戳記 (timestamp)

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
      const timestamp = row[COLUMN_TIMESTAMP];

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

      // Store recent registrations (last 10)
      if (index < 10) {
        stats.recentActivities.push({
          county: county,
          type: institutionType,
          participants: participants,
          timestamp: timestamp
        });
      }
    });

    // Format recent activities with relative time
    stats.recentActivities = stats.recentActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5)
      .map(activity => {
        const timeAgo = getTimeAgo(activity.timestamp);
        return {
          county: activity.county,
          type: activity.type,
          participants: activity.participants,
          time: timeAgo
        };
      });

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
 * Enhanced doPost with CSRF protection and spam prevention
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Security validations
    validateOrigin(e, data);
    validateHoneypot(data);
    validateRateLimit(data, e);  // Pass 'e' for IP access
    validateCSRFToken(data);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Headers - must match your sheet's row 1
    const headers = [
      'timestamp', 'email', 'contactName', 'jobTitle', 'phone',
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

    // Prepare row data
    const rowData = headers.map(header => data[header] || '');

    // Append data
    sheet.appendRow(rowData);

    // Send email notification (optional)
    const emailBody = `
新的 Hour of AI 報名!

報名時間: ${new Date(data.timestamp).toLocaleString('zh-TW')}
聯絡人: ${data.contactName}
Email: ${data.email}
縣市: ${data.county}
機構類型: ${data.institutionType}
預計參與人數: ${data.participants}

查看完整資料: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}
    `;

    // Uncomment below to enable email notifications
    // MailApp.sendEmail({
    //   to: 'support@junyiacademy.org',
    //   subject: '新的 Hour of AI 報名通知',
    //   body: emailBody
    // });

    return createCORSResponse(JSON.stringify({
      'status': 'success'
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
    'https://junyiacademy.org'
  ];

  // Check origin from data (more reliable than headers)
  const origin = data.origin;
  if (!origin || !allowedOrigins.includes(origin)) {
    throw new Error('Invalid origin');
  }

  // Additional referrer check if available
  const referrer = e.parameter.referrer;
  if (referrer && !allowedOrigins.some(allowed => referrer.startsWith(allowed))) {
    throw new Error('Invalid referrer');
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
  // Note: Google Apps Script has limited access to client IP
  // These headers may not always be available
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



// Test function
function testPost() {
  const testData = {
    timestamp: new Date().toISOString(),
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
    dataConsent: '同意'
  };

  const e = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };

  const result = doPost(e);
  Logger.log(result.getContent());
}
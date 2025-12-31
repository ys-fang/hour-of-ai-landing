# CSRF Protection Implementation Plan

**Ticket ID:** CSRF-001
**Priority:** High
**Estimated Time:** 4-6 hours
**Project:** Hour of AI Registration Form
**Date:** 2025-12-26

---

## Issue Description

The current Hour of AI registration form submits directly to Google Apps Script without CSRF protection, making it vulnerable to cross-site request forgery attacks and automated spam submissions.

## Acceptance Criteria

- [ ] Form submissions include CSRF token validation
- [ ] Origin verification prevents cross-domain attacks
- [ ] Rate limiting prevents spam submissions
- [ ] Honeypot field blocks automated bots
- [ ] Error handling provides appropriate feedback
- [ ] Backward compatibility maintained

## Technical Implementation Plan

### Phase 1: Frontend Protection (2 hours)

#### 1.1 Generate CSRF Token

```javascript
// Add to CONFIG object
const CONFIG = {
    // existing config...
    CSRF_TOKEN_KEY: 'csrf_token',
    MAX_REQUESTS_PER_HOUR: 3
};

// Generate secure token on page load
function generateCSRFToken() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Initialize token
const csrfToken = generateCSRFToken();
sessionStorage.setItem(CONFIG.CSRF_TOKEN_KEY, csrfToken);
```

#### 1.2 Add Honeypot Field

```html
<!-- Insert after line 1974 in existing form -->
<div style="position: absolute; left: -5000px;" aria-hidden="true">
    <input type="text" name="website" tabindex="-1" autocomplete="off">
</div>
```

#### 1.3 Modify Form Submission

```javascript
// Update form submission logic (around line 2640)
// Add timestamp and tokens to form data
data.csrf_token = sessionStorage.getItem(CONFIG.CSRF_TOKEN_KEY);
data.origin = window.location.origin;
data.timestamp = Date.now();
data.honeypot = formData.get('website'); // Should be empty
```

### Phase 2: Backend Validation (2 hours)

#### 2.1 Update Google Apps Script

```javascript
function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);

        // 1. Origin validation
        validateOrigin(e);

        // 2. Honeypot validation
        validateHoneypot(data);

        // 3. Rate limiting
        validateRateLimit(data);

        // 4. CSRF token validation
        validateCSRFToken(data);

        // Existing form processing logic...

    } catch (error) {
        return createErrorResponse(error.message);
    }
}

function validateOrigin(e) {
    const allowedOrigins = [
        'https://yourdomain.com',
        'http://localhost:3000' // for development
    ];

    const origin = e.parameter.origin;
    if (!origin || !allowedOrigins.includes(origin)) {
        throw new Error('Invalid origin');
    }
}

function validateHoneypot(data) {
    if (data.honeypot && data.honeypot.trim() !== '') {
        throw new Error('Spam detected');
    }
}

function validateRateLimit(data) {
    const props = PropertiesService.getScriptProperties();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    const userKey = `rate_${data.email}`;
    const userData = props.getProperty(userKey);

    if (userData) {
        const { count, lastReset } = JSON.parse(userData);

        if (now - lastReset < oneHour && count >= 3) {
            throw new Error('Too many requests. Please try again later.');
        }

        const newCount = now - lastReset < oneHour ? count + 1 : 1;
        props.setProperty(userKey, JSON.stringify({
            count: newCount,
            lastReset: now - lastReset < oneHour ? lastReset : now
        }));
    } else {
        props.setProperty(userKey, JSON.stringify({
            count: 1,
            lastReset: now
        }));
    }
}

function validateCSRFToken(data) {
    // Basic timestamp validation (token should be recent)
    const tokenAge = Date.now() - data.timestamp;
    const maxAge = 60 * 60 * 1000; // 1 hour

    if (tokenAge > maxAge) {
        throw new Error('Token expired. Please refresh and try again.');
    }

    if (!data.csrf_token || data.csrf_token.length !== 32) {
        throw new Error('Invalid security token');
    }
}

function createErrorResponse(message) {
    return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: message
    })).setMimeType(ContentService.MimeType.JSON);
}
```

### Phase 3: Error Handling & UX (1-2 hours)

#### 3.1 Update Frontend Error Handling

```javascript
// Update form submission error handling (around line 2696)
catch (error) {
    console.error('Form submission error:', error);

    // Parse error response if available
    let errorMessage = '送出時發生錯誤,請稍後再試';

    if (error.response) {
        try {
            const errorData = await error.response.json();
            if (errorData.message.includes('Too many requests')) {
                errorMessage = '提交次數過多，請稍後再試';
            } else if (errorData.message.includes('Token expired')) {
                errorMessage = '頁面已過期，請重新整理後再試';
                // Auto refresh after 3 seconds
                setTimeout(() => location.reload(), 3000);
            }
        } catch (e) {
            // Use default message
        }
    }

    alert(errorMessage);
    submitBtn.disabled = false;
    submitBtn.textContent = '送出報名 →';
}
```

## Testing Checklist

- [ ] Normal form submission works correctly
- [ ] Honeypot field blocks automated submissions
- [ ] Rate limiting blocks excessive requests from same email
- [ ] Origin validation blocks cross-domain requests
- [ ] CSRF token validation blocks replay attacks
- [ ] Expired tokens are handled gracefully
- [ ] Error messages are user-friendly in Chinese
- [ ] Form works on different browsers and devices

## Deployment Steps

1. Update frontend JavaScript code
2. Add honeypot field to HTML
3. Deploy updated Google Apps Script
4. Test with allowed origins
5. Monitor logs for blocked attempts
6. Update documentation

## Rollback Plan

If issues occur:

1. Revert Google Apps Script to previous version
2. Remove CSRF validation temporarily
3. Keep honeypot and rate limiting (lower risk)
4. Investigate and fix issues before re-deployment

## Monitoring & Maintenance

- Monitor Google Apps Script execution logs
- Track blocked submission attempts
- Review rate limiting effectiveness monthly
- Update allowed origins list as needed

## Security Benefits

- **Prevents CSRF attacks**: Forms can only be submitted from authorized origins
- **Blocks automated bots**: Honeypot field catches automated submissions
- **Prevents spam abuse**: Rate limiting stops excessive submissions
- **Token expiration**: Prevents replay attacks with old tokens

## Performance Impact

- **Minimal frontend overhead**: ~2KB additional JavaScript
- **Low backend complexity**: Simple validation functions
- **Storage usage**: SessionStorage for tokens, PropertiesService for rate limiting

---

**Implementation Notes:**
- Test thoroughly in development environment first
- Update allowed origins list for production deployment
- Monitor submission logs for the first week after deployment
- Consider implementing more sophisticated rate limiting if needed

**Contact:** Development Team
**Review Required:** Security Team, Product Team
        // ===== 統一的 Flash-Card 系統 =====
        function toggleCard(button, event) {
            event.stopPropagation();

            const cardElement = button.closest('.activity-card');

            if (cardElement) {
                cardElement.classList.add('flipped');

                // 直接使用內聯樣式強制顯示背面
                const cardImage = cardElement.querySelector('.activity-card-image');
                const cardContent = cardElement.querySelector('.activity-card-content');
                const overlay = cardElement.querySelector('.image-overlay');
                const closeBtn = cardElement.querySelector('.overlay-close');

                if (cardImage) {
                    cardImage.style.opacity = '1';
                    cardImage.style.zIndex = '10';
                    cardImage.style.pointerEvents = 'auto';
                }
                if (cardContent) {
                    cardContent.style.opacity = '0.1';
                }
                if (overlay) {
                    overlay.style.opacity = '1';
                }
                if (closeBtn) {
                    closeBtn.style.display = 'inline-flex';
                }

                // 停止按鈕的動畫
                button.style.animation = 'none';
            } else {
                console.error('找不到 .activity-card 元素!');
            }
        }

        function closeCard(button, event) {
            event.stopPropagation();

            const cardElement = button.closest('.activity-card');
            if (cardElement) {
                cardElement.classList.remove('flipped');

                // 直接重置內聯樣式
                const cardImage = cardElement.querySelector('.activity-card-image');
                const cardContent = cardElement.querySelector('.activity-card-content');
                const overlay = cardElement.querySelector('.image-overlay');
                const closeBtn = cardElement.querySelector('.overlay-close');

                if (cardImage) {
                    cardImage.style.opacity = '0';
                    cardImage.style.zIndex = '';
                    cardImage.style.pointerEvents = 'none';
                }
                if (cardContent) {
                    cardContent.style.opacity = '1';
                }
                if (overlay) {
                    overlay.style.opacity = '0';
                }
                if (closeBtn) {
                    closeBtn.style.display = 'none';
                }

                // 重新啟動查看詳細按鈕的動畫
                const detailsButton = cardElement.querySelector('.activity-details-button');
                if (detailsButton) {
                    detailsButton.style.animation = 'pulse-gentle 2s infinite';
                }
            }
        }

        // 初始化
        document.addEventListener('DOMContentLoaded', () => {



            // 為所有查看詳細按鈕添加事件監聽器
            const detailButtons = document.querySelectorAll('.activity-details-button');

            detailButtons.forEach((button, index) => {

                // 添加多種事件
                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    toggleCard(this, event);
                    return false;
                }, true);

                button.addEventListener('mousedown', function(event) {
                }, true);

                button.addEventListener('touchstart', function(event) {
                }, true);
            });

            // 為所有關閉按鈕添加事件監聽器
            const closeButtons = document.querySelectorAll('.overlay-close');

            closeButtons.forEach((button, index) => {

                button.addEventListener('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    closeCard(this, event);
                    return false;
                }, true);
            });

            // 為整個activity-card添加點擊事件作為後備
            const activityCards = document.querySelectorAll('.activity-card');
            activityCards.forEach((card, index) => {

                card.addEventListener('click', function(event) {

                    // 檢查是否點擊了詳細按鈕區域
                    if (event.target.closest('.activity-details-button')) {
                        const button = event.target.closest('.activity-details-button');
                        event.preventDefault();
                        event.stopPropagation();
                        toggleCard(button, event);
                    }
                });
            });
        });

        // ===== Smart Configuration System =====

        // 智慧配置函數 - 自動偵測部署環境
        function getFormSubmitUrl() {
            // 1. 檢查 URL 參數 (用於測試)
            const urlParams = new URLSearchParams(window.location.search);
            const apiUrl = urlParams.get('apiUrl');
            if (apiUrl) {
                console.log('🔧 Using URL parameter API:', apiUrl);
                return apiUrl;
            }

            // 2. 檢查 WordPress 環境變數 (用於生產)
            if (window.HOA_CONFIG && window.HOA_CONFIG.FORM_SUBMIT_URL) {
                console.log('🏢 Using WordPress config API');
                return window.HOA_CONFIG.FORM_SUBMIT_URL;
            }

            // 3. 偵測域名環境
            const hostname = window.location.hostname;

            // 3a. Hour of AI 專屬子網域 (正式環境)
            if (hostname === 'hoa.junyiacademy.org') {
                console.log('🎯 Detected hoa.junyiacademy.org - using production API');
                return 'https://script.google.com/macros/s/AKfycbyM_JnJwmOTysT5Z65RylyLMnS4n3t8c1DbQfbF9Xk8kX1_J2MZum1kV39eEEiB340hpw/exec';
            }

            // 3b. 其他 junyiacademy.org 子網域 (WordPress 環境)
            if (hostname.includes('junyiacademy.org')) {
                console.log('🌐 Detected Junyiacademy domain - using production fallback');
                // WordPress 部署時需要設定 window.HOA_CONFIG
                return 'PLEASE_SET_HOA_CONFIG_IN_WORDPRESS';
            }

            // 4. Firebase Hosting 環境 (測試/開發)
            if (hostname.includes('hour-of-ai-landing-junyi.web.app') ||
                hostname.includes('hour-of-ai-landing-junyi.firebaseapp.com')) {
                console.log('🔥 Detected Firebase Hosting - using production API');
                return 'https://script.google.com/macros/s/AKfycbyM_JnJwmOTysT5Z65RylyLMnS4n3t8c1DbQfbF9Xk8kX1_J2MZum1kV39eEEiB340hpw/exec';
            }

            // 5. GitHub Pages 或本地測試環境
            console.log('🧪 Using demo mode - statistics will show sample data');
            return 'DEMO_MODE';
        }

        const CONFIG = {
            // 智慧 API URL 配置
            FORM_SUBMIT_URL: getFormSubmitUrl(),
            ENABLE_ANALYTICS: true,
            ANIMATION_DURATION: 300,
            CSRF_TOKEN_KEY: 'csrf_token',
            MAX_REQUESTS_PER_HOUR: 3,

            // Demo mode 配置
            IS_DEMO_MODE: function() {
                return this.FORM_SUBMIT_URL === 'DEMO_MODE';
            },

            // WordPress 配置檢查
            isWordPressConfigValid: function() {
                return this.FORM_SUBMIT_URL !== 'PLEASE_SET_HOA_CONFIG_IN_WORDPRESS';
            }
        };

        // Generate secure CSRF token
        function generateCSRFToken() {
            const array = new Uint8Array(16);
            crypto.getRandomValues(array);
            return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }

        // Initialize CSRF token on page load
        function initializeCSRFToken() {
            const csrfToken = generateCSRFToken();
            sessionStorage.setItem(CONFIG.CSRF_TOKEN_KEY, csrfToken);
            return csrfToken;
        }

        // Initialize token
        let currentToken = initializeCSRFToken();

        // Refresh token periodically (every 30 minutes)
        setInterval(() => {
            currentToken = initializeCSRFToken();
        }, 30 * 60 * 1000);

        // ===== DEVELOPMENT TESTING UTILITIES =====

        // Auto-fill form for testing (call fillTestData() in console)
        window.fillTestData = function() {
            const testData = {
                'email': 'test@example.com',
                'contactName': '測試使用者',
                'jobTitle': '教師',
                'phone': '0912345678',
                'county': '台北市',
                'address': '台北市信義區市府路1號',
                'postalCode': '11008',
                'participants': '30',
                'institutionType': '學校',
                'schoolName': '測試國小',
                'gradeLevel': '國小',
                'activityType': '教室活動',
                'deviceUsage': '有使用設備',
                'activityDescription': '這是一個AI教育測試活動，將教授學生基本的人工智慧概念和程式設計技能。',
                'deliveryFormat': '實體',
                'onlineRegistrationLink': 'https://example.com/register',
                'startDate': '2025-03-01',
                'endDate': '2025-03-01',
                'promotionalImage': 'https://example.com/image.jpg',
                'additionalComments': '測試用備註',
                'codeOrgContact': '是',
                'dataConsent': '同意'
            };

            Object.entries(testData).forEach(([name, value]) => {
                const input = document.querySelector(`[name="${name}"]`);
                if (input) {
                    if (input.type === 'radio') {
                        const radio = document.querySelector(`[name="${name}"][value="${value}"]`);
                        if (radio) radio.checked = true;
                    } else if (input.type === 'checkbox') {
                        if (value === '同意') input.checked = true;
                    } else {
                        input.value = value;
                    }
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            });

            console.log('✅ 測試資料已自動填入');
        };

        // Quick navigation to any page (call goToPage(4) in console)
        window.goToPage = function(page) {
            currentPage = page;
            showPage(currentPage);
            updateProgress();
            console.log(`✅ 已跳轉到第 ${page} 頁`);
        };

        // CORS test function
        window.testCORS = function() {
            console.log('🧪 Testing CORS...');

            const testPayload = {
                timestamp: Date.now(),
                csrf_token: sessionStorage.getItem(CONFIG.CSRF_TOKEN_KEY),
                origin: window.location.origin,
                email: 'cors-test@example.com',
                contactName: 'CORS Test',
                honeypot_website: '',
                honeypot_contact: '',
                honeypot_phone: ''
            };

            fetch(CONFIG.FORM_SUBMIT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testPayload)
            })
            .then(() => {
                console.log('✅ CORS test completed - no errors thrown');
            })
            .catch(error => {
                console.error('❌ CORS test failed:', error);
            });
        };

        // Rate limit test function
        window.testRateLimit = function(testEmail = 'rate-limit-test@example.com', count = 6) {
            console.log(`🚦 Testing rate limit with ${count} requests for ${testEmail}...`);

            const promises = [];

            for (let i = 1; i <= count; i++) {
                const testPayload = {
                    timestamp: Date.now(),
                    csrf_token: sessionStorage.getItem(CONFIG.CSRF_TOKEN_KEY),
                    origin: window.location.origin,
                    email: testEmail,
                    contactName: `Rate Test ${i}`,
                    honeypot_website: '',
                    honeypot_contact: '',
                    honeypot_phone: ''
                };

                const promise = fetch(CONFIG.FORM_SUBMIT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(testPayload)
                })
                .then(() => {
                    console.log(`📤 Request ${i} sent successfully`);
                    return { success: true, index: i };
                })
                .catch(error => {
                    console.error(`❌ Request ${i} failed:`, error);
                    return { success: false, index: i, error };
                });

                promises.push(promise);

                // Small delay between requests
                if (i < count) {
                    setTimeout(() => {}, 200);
                }
            }

            Promise.all(promises).then(results => {
                const successful = results.filter(r => r.success).length;
                const failed = results.filter(r => !r.success).length;

                console.log(`
🚦 Rate Limit Test Results:
• Total requests: ${count}
• Successful: ${successful}
• Failed: ${failed}
• Test email: ${testEmail}

📝 Note: Due to no-cors mode, we can't see server-side rate limiting.
Check Google Apps Script logs to verify rate limiting is working.
Check Google Sheets to see how many entries were actually created.
                `);
            });
        };

        // Honeypot test function
        window.testHoneypot = function() {
            console.log('🍯 Testing honeypot detection...');

            const testPayload = {
                timestamp: Date.now(),
                csrf_token: sessionStorage.getItem(CONFIG.CSRF_TOKEN_KEY),
                origin: window.location.origin,
                email: 'honeypot-test@example.com',
                contactName: 'Honeypot Test',
                // Trigger honeypot detection
                honeypot_website: 'http://spam-website.com',
                honeypot_contact: 'spam@spam.com',
                honeypot_phone: '123456789'
            };

            fetch(CONFIG.FORM_SUBMIT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testPayload)
            })
            .then(() => {
                console.log(`
🍯 Honeypot test completed.

📝 Expected behavior:
• Server should detect honeypot fields are filled
• Server should block this request
• No entry should appear in Google Sheets
• Check Google Apps Script logs for 'Honeypot triggered' messages

⚠️ Due to no-cors mode, we can't see the server rejection.
                `);
            })
            .catch(error => {
                console.error('❌ Honeypot test failed:', error);
            });
        };

        // Security test suite
        window.runSecurityTests = function() {
            console.log('🔒 Running complete security test suite...');

            console.log('\n1️⃣ Testing CORS...');
            testCORS();

            setTimeout(() => {
                console.log('\n2️⃣ Testing Honeypot...');
                testHoneypot();
            }, 1000);

            setTimeout(() => {
                console.log('\n3️⃣ Testing Rate Limit...');
                testRateLimit();
            }, 2000);

            console.log(`
🔒 Security Test Suite Started

⏱️ Tests running in sequence:
1. CORS connectivity test
2. Honeypot detection test
3. Rate limit test (6 requests)

📊 Check results above and verify in:
• Browser console for client-side results
• Google Apps Script logs for server-side validation
• Google Sheets for actual data written

⏰ All tests will complete in ~10 seconds
            `);
        };

        // Dev shortcuts (only available in staging)
        if (window.location.hostname.includes('staging') || window.location.hostname.includes('localhost')) {
            console.log(`
🔧 開發測試工具已載入:
• fillTestData() - 自動填入測試資料
• goToPage(n) - 跳轉到指定頁面 (1-4)

🧪 安全測試功能:
• testCORS() - 測試CORS連線
• testRateLimit() - 測試頻率限制 (預設6次請求)
• testHoneypot() - 測試蜜罐防護
• runSecurityTests() - 執行完整安全測試套件

            `);
        }

        // ===== Activity Card Progressive Disclosure =====
        document.addEventListener('DOMContentLoaded', function() {
            const activityCards = document.querySelectorAll('[data-expandable]');

            function isDesktop() {
                return window.innerWidth > 768;
            }

            // Simple, bulletproof approach
            activityCards.forEach((card, index) => {
                const expandBtn = card.querySelector('.activity-expand-btn');

                // Desktop: hover to expand
                card.addEventListener('mouseenter', () => {
                    if (isDesktop()) {
                        // First: remove expanded from ALL cards
                        activityCards.forEach(c => c.classList.remove('expanded'));

                        // Then: add expanded ONLY to this card
                        card.classList.add('expanded');
                    }
                });

                // Desktop: leave to collapse
                card.addEventListener('mouseleave', () => {
                    if (isDesktop()) {
                        card.classList.remove('expanded');
                    }
                });

                // Desktop: click expand button to toggle
                if (expandBtn) {
                    expandBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (isDesktop()) {
                            const isExpanded = card.classList.contains('expanded');

                            // Always close all first
                            activityCards.forEach(c => c.classList.remove('expanded'));

                            // If it wasn't expanded, expand it
                            if (!isExpanded) {
                                card.classList.add('expanded');
                            }
                        }
                    });
                }

                // Mobile: entire card click to toggle
                card.addEventListener('click', (e) => {
                    if (!isDesktop()) {
                        // Prevent if clicking on CTA button
                        if (e.target.closest('.btn')) {
                            return;
                        }

                        e.preventDefault();
                        const isExpanded = card.classList.contains('expanded');

                        // Always close all first
                        activityCards.forEach(c => c.classList.remove('expanded'));

                        // If it wasn't expanded, expand it
                        if (!isExpanded) {
                            card.classList.add('expanded');
                        }
                    }
                });
            });

            // Click outside to close all
            document.addEventListener('click', (e) => {
                if (!e.target.closest('[data-expandable]')) {
                    activityCards.forEach(card => card.classList.remove('expanded'));
                }
            });
        });

        // ===== Mobile Navigation =====
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const navLinks = document.getElementById('navLinks');

        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when clicking on a link
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // ===== Sticky Navigation =====
        const nav = document.getElementById('nav');
        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 100) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }

            lastScroll = currentScroll;
        });

        // ===== Fade-in Animation on Scroll =====
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });

        // ===== Floating CTA =====
        const floatingCta = document.getElementById('floatingCta');
        const registrationSection = document.getElementById('register');

        window.addEventListener('scroll', () => {
            const registrationTop = registrationSection.offsetTop;
            const scrollPosition = window.pageYOffset + window.innerHeight;

            if (window.pageYOffset > 800 && scrollPosition < registrationTop + 200) {
                floatingCta.classList.add('visible');
            } else {
                floatingCta.classList.remove('visible');
            }
        });

        // ===== Activity Description Example Section =====
        const exampleToggle = document.getElementById('exampleToggle');
        const exampleContent = document.getElementById('exampleContent');
        const activityDescriptionTextarea = document.getElementById('activityDescription');
        const exampleUseBtns = document.querySelectorAll('.example-use-btn');

        // Example templates
        const exampleTemplates = {
            '1': '本校將於 2025 年 3 月舉辦「AI 素養起步走」活動，針對國中七年級學生（約 120 人），透過「數據世界：AI 原來如此」課程，讓學生認識 AI 基本概念與實際應用。活動將在電腦教室進行，每位學生使用一台電腦，預計 2 小時完成課程並取得證書。',
            '2': '本校計畫於 2025 年 4 月為五、六年級學生（約 80 人）舉辦「我的 AI 初體驗」活動。透過「數據世界：AI 原來如此」課程，以互動式教學讓孩子們初步了解 AI 技術。活動採分組進行，每 2-3 人共用一台平板或電腦，預計利用兩堂課（共 80 分鐘）完成，並於課後頒發參與證書。',
            '3': '本校將於 2025 年 5 月舉辦全校性「Hour of AI 週」活動，開放高一至高三學生自由報名參加（預計 200 人）。活動包含「我的半導體冒險」及「數據世界：AI 原來如此」兩個課程，學生可依興趣選擇。將於電腦教室及圖書館進行，採線上自主學習搭配教師引導討論的混成模式，預計每位學生投入 2-3 小時完成學習。',
            '4': '本機構將於 2025 年 6 月舉辦「社區 AI 素養推廣活動」，邀請社區居民及在職人士參與（預計 50 人）。透過「數據世界：AI 原來如此」課程，協助民眾建立 AI 基本認知，提升數位素養。活動採實體工作坊形式，於社區活動中心進行，每位參與者配備筆電或平板，預計 3 小時完成課程與交流討論。'
        };

        // Toggle example section
        if (exampleToggle) {
            exampleToggle.addEventListener('click', () => {
                exampleToggle.classList.toggle('active');
                exampleContent.classList.toggle('active');
            });
        }

        // Use example buttons
        exampleUseBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const exampleId = btn.getAttribute('data-example');
                const exampleText = exampleTemplates[exampleId];

                if (exampleText && activityDescriptionTextarea) {
                    activityDescriptionTextarea.value = exampleText;
                    activityDescriptionTextarea.focus();

                    // Collapse example section after selection
                    exampleToggle.classList.remove('active');
                    exampleContent.classList.remove('active');

                    // Remove error state if present
                    const formGroup = activityDescriptionTextarea.closest('.form-group');
                    if (formGroup) {
                        formGroup.classList.remove('error');
                    }

                    // Show brief success feedback
                    btn.innerHTML = '<span class="material-icons small">check</span> 已填入';
                    btn.style.background = 'var(--color-primary-teal)';
                    setTimeout(() => {
                        btn.textContent = '使用此範例';
                        btn.style.background = '';
                    }, 1500);
                }
            });
        });

        // ===== Multi-Step Form Logic =====
        const form = document.getElementById('registrationForm');
        const formPages = document.querySelectorAll('.form-page');
        const progressSteps = document.querySelectorAll('.progress-step');
        // Progress line removed for mobile-friendly design
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');
        const formActions = document.getElementById('formActions');

        let currentPage = 1;
        const totalPages = 4;

        // Update progress bar
        function updateProgress() {
            // Progress line removed for mobile-friendly design

            progressSteps.forEach((step, index) => {
                const stepNumber = index + 1;
                if (stepNumber < currentPage) {
                    step.classList.add('completed');
                    step.classList.remove('active');
                } else if (stepNumber === currentPage) {
                    step.classList.add('active');
                    step.classList.remove('completed');
                } else {
                    step.classList.remove('active', 'completed');
                }
            });
        }

        // Show specific page
        function showPage(pageNumber) {
            formPages.forEach(page => {
                page.classList.remove('active');
            });

            const targetPage = document.querySelector(`[data-page="${pageNumber}"]`);
            if (targetPage) {
                targetPage.classList.add('active');
            }

            // Update button visibility
            if (pageNumber === 1) {
                prevBtn.classList.add('hidden');
            } else {
                prevBtn.classList.remove('hidden');
            }

            if (pageNumber === totalPages) {
                nextBtn.classList.add('hidden');
                submitBtn.classList.remove('hidden');
            } else {
                nextBtn.classList.remove('hidden');
                submitBtn.classList.add('hidden');
            }

            // Scroll to form
            document.querySelector('.form-progress').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Validate current page
        function validatePage(pageNumber) {
            const currentPageEl = document.querySelector(`[data-page="${pageNumber}"]`);
            const inputs = currentPageEl.querySelectorAll('input[required], select[required], textarea[required]');
            let isValid = true;

            inputs.forEach(input => {
                const formGroup = input.closest('.form-group');

                // Check if input is visible (for conditional fields)
                if (formGroup && formGroup.classList.contains('hidden')) {
                    return;
                }

                // For radio buttons
                if (input.type === 'radio') {
                    const radioGroup = currentPageEl.querySelectorAll(`input[name="${input.name}"]`);
                    const isChecked = Array.from(radioGroup).some(radio => radio.checked);
                    if (!isChecked) {
                        formGroup.classList.add('error');
                        isValid = false;
                    } else {
                        formGroup.classList.remove('error');
                    }
                }
                // For other inputs
                else if (!input.value.trim()) {
                    formGroup.classList.add('error');
                    isValid = false;
                } else if (input.hasAttribute('pattern')) {
                    // Validate pattern
                    const pattern = new RegExp(input.getAttribute('pattern'));
                    if (!pattern.test(input.value)) {
                        formGroup.classList.add('error');
                        isValid = false;
                    } else {
                        formGroup.classList.remove('error');
                    }
                } else {
                    formGroup.classList.remove('error');
                }
            });

            // Custom validation for page 4
            if (pageNumber === 4) {
                const dataConsent = document.querySelector('input[name="dataConsent"]:checked');
                if (dataConsent && dataConsent.value === '不同意') {
                    alert('您必須同意資料蒐集與運用聲明才能完成報名');
                    isValid = false;
                }
            }

            return isValid;
        }

        // Next button
        nextBtn.addEventListener('click', () => {
            if (validatePage(currentPage)) {
                currentPage++;
                showPage(currentPage);
                updateProgress();
            }
        });

        // Previous button
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                showPage(currentPage);
                updateProgress();
            }
        });

        // Standard button elements - no extra keyboard handling needed

        // Conditional Fields Logic

        // Show/hide school fields based on institution type
        const institutionTypeRadios = document.querySelectorAll('input[name="institutionType"]');
        const schoolFields = document.getElementById('schoolFields');

        institutionTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === '學校') {
                    schoolFields.classList.remove('hidden');
                    schoolFields.querySelectorAll('input[name="schoolName"], input[name="gradeLevel"]').forEach(input => {
                        input.setAttribute('required', 'required');
                    });
                } else {
                    schoolFields.classList.add('hidden');
                    schoolFields.querySelectorAll('input').forEach(input => {
                        input.removeAttribute('required');
                        input.value = '';
                    });
                }
            });
        });

        // Show/hide online registration field
        const deliveryFormatCheckboxes = document.querySelectorAll('input[name="deliveryFormat"]');
        const onlineRegistrationField = document.getElementById('onlineRegistrationField');

        deliveryFormatCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const onlineChecked = Array.from(deliveryFormatCheckboxes).some(cb =>
                    cb.value === '線上' && cb.checked
                );

                if (onlineChecked) {
                    onlineRegistrationField.classList.remove('hidden');
                } else {
                    onlineRegistrationField.classList.add('hidden');
                }
            });
        });

        // ===== Form Submission =====
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validatePage(currentPage)) {
                return;
            }

            // Show loading overlay
            const loadingOverlay = document.getElementById('loadingOverlay');
            loadingOverlay.classList.add('active');

            // Collect form data
            const formData = new FormData(form);
            const data = {};

            // Convert FormData to object
            for (let [key, value] of formData.entries()) {
                // Handle checkboxes (multiple values)
                if (key === 'deliveryFormat') {
                    if (!data[key]) {
                        data[key] = [];
                    }
                    data[key].push(value);
                } else {
                    data[key] = value;
                }
            }

            // Convert deliveryFormat array to string
            if (Array.isArray(data.deliveryFormat)) {
                data.deliveryFormat = data.deliveryFormat.join(', ');
            }

            // Add timestamp and security data
            data.timestamp = Date.now();
            data.csrf_token = sessionStorage.getItem(CONFIG.CSRF_TOKEN_KEY);
            data.origin = window.location.origin;

            // Add honeypot data (should be empty)
            data.honeypot_website = formData.get('website') || '';
            data.honeypot_contact = formData.get('contact') || '';
            data.honeypot_phone = formData.get('phone_number') || '';

            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.textContent = '送出中...';

            try {
                // 檢查是否為 Demo Mode
                if (CONFIG.IS_DEMO_MODE()) {
                    console.log('🧪 Demo Mode: Simulating form submission');
                    console.log('📝 Form data would be:', data);

                    // 模擬 API 延遲
                    await new Promise(resolve => setTimeout(resolve, 1500));

                    // Demo mode 不實際提交，直接顯示成功
                } else if (!CONFIG.isWordPressConfigValid()) {
                    // WordPress 環境但未正確設定
                    throw new Error('請在 WordPress 中設定 window.HOA_CONFIG.FORM_SUBMIT_URL');
                } else {
                    // 正常提交到 Google Apps Script
                    console.log('🚀 Submitting to:', CONFIG.FORM_SUBMIT_URL);
                    await fetch(CONFIG.FORM_SUBMIT_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(data)
                    });
                }

                // Since we can't read the response in no-cors mode,
                // we assume success if no error was thrown

                // Hide loading overlay
                loadingOverlay.classList.remove('active');

                // Reset submit button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = '提交活動規劃 <span class="material-icons small">send</span>';

                // Show success page
                formActions.classList.add('hidden');

                // Ensure all navigation buttons are hidden
                prevBtn.classList.add('hidden');
                nextBtn.classList.add('hidden');
                submitBtn.classList.add('hidden');

                formPages.forEach(page => page.classList.remove('active'));
                document.querySelector('[data-page="success"]').classList.add('active');

                // Track conversion
                if (CONFIG.ENABLE_ANALYTICS && typeof gtag !== 'undefined') {
                    gtag('event', 'form_submission', {
                        'event_category': 'registration',
                        'event_label': '均一 x Hour of AI'
                    });
                }

                // Reset form
                form.reset();
                currentPage = 1;

            } catch (error) {
                console.error('Form submission error:', error);

                // Hide loading overlay on error
                loadingOverlay.classList.remove('active');

                // Simple error handling for no-cors mode
                let errorMessage = '送出時發生錯誤,請稍後再試或直接聯繫我們。';

                if (error.message && error.message.includes('Failed to fetch')) {
                    errorMessage = '網路連線問題，請檢查您的網路連線後再試';
                }

                alert(errorMessage);
                submitBtn.disabled = false;
                submitBtn.innerHTML = '提交活動規劃 <span class="material-icons small">send</span>';
            }
        });

        // ===== Upcoming Events Carousel =====

        // Event data (Phase 2: will be replaced with Google Sheets data)
        const upcomingEventsConfig = {
            AUTOPLAY_INTERVAL: 5000, // 5 seconds
            events: [
                {
                    title: 'AI 素養起步走｜學生體驗場',
                    description: '1/22（四）由均一老師全程線上帶領，讓孩子在學期最後一週趣味體驗 AI',
                    url: 'https://link.junyiacademy.org/8k8ckh'
                },
                {
                    title: 'AI 素養起步走｜教師增能場',
                    description: '1/27（二）陪老師一起學習如何在課堂中引導孩子培養 AI 素養，線上免費參加',
                    url: 'https://link.junyiacademy.org/8k8ckh'
                }
            ]
        };

        // Carousel state
        let carouselAutoplayTimer = null;
        let carouselCurrentIndex = 0;

        /**
         * Render event cards in the carousel
         */
        function renderEventCards(events) {
            const carousel = document.getElementById('eventsCarousel');
            if (!carousel || !events || events.length === 0) return;

            carousel.innerHTML = events.map((event, index) => `
                <a href="${event.url}"
                   class="event-card fade-in"
                   target="_blank"
                   rel="noopener noreferrer"
                   data-event-index="${index}">
                    <div class="event-card-arrow">
                        <span class="material-icons">arrow_forward</span>
                    </div>
                    <div class="event-card-content">
                        <h3 class="event-card-title">${event.title}</h3>
                        <p class="event-card-description">${event.description}</p>
                        <span class="event-card-btn">
                            <span class="material-icons small">open_in_new</span>
                            前往活動
                        </span>
                    </div>
                </a>
            `).join('');

            // Trigger fade-in animation
            setTimeout(() => {
                carousel.querySelectorAll('.fade-in').forEach(el => el.classList.add('visible'));
            }, 100);
        }

        /**
         * Render carousel dots
         */
        function renderCarouselDots(totalPages) {
            const dotsContainer = document.getElementById('carouselDots');
            if (!dotsContainer || totalPages <= 1) {
                if (dotsContainer) dotsContainer.innerHTML = '';
                return;
            }

            dotsContainer.innerHTML = Array.from({ length: totalPages }, (_, i) => `
                <button class="carousel-dot ${i === 0 ? 'active' : ''}"
                        data-page="${i}"
                        aria-label="前往第 ${i + 1} 頁"></button>
            `).join('');

            // Add click handlers
            dotsContainer.querySelectorAll('.carousel-dot').forEach(dot => {
                dot.addEventListener('click', () => {
                    const page = parseInt(dot.dataset.page);
                    scrollToPage(page);
                    resetAutoplay();
                });
            });
        }

        /**
         * Get visible cards count based on viewport
         * 統一使用手機端樣式：所有裝置都只顯示單一卡片
         */
        function getVisibleCardsCount() {
            return 1; // 所有裝置統一顯示單一卡片
        }

        /**
         * Get total pages
         */
        function getTotalPages() {
            const events = upcomingEventsConfig.events;
            const visibleCards = getVisibleCardsCount();
            return Math.ceil(events.length / visibleCards);
        }

        /**
         * Scroll carousel to specific page
         */
        function scrollToPage(page) {
            const carousel = document.getElementById('eventsCarousel');
            if (!carousel) return;

            const cards = carousel.querySelectorAll('.event-card');
            if (cards.length === 0) return;

            const visibleCards = getVisibleCardsCount();
            const targetIndex = Math.min(page * visibleCards, cards.length - 1);
            const targetCard = cards[targetIndex];

            if (targetCard) {
                carousel.scrollTo({
                    left: targetCard.offsetLeft - carousel.offsetLeft,
                    behavior: 'smooth'
                });
            }

            carouselCurrentIndex = page;
            updateCarouselDots(page);
            updateNavButtons();
        }

        /**
         * Update active dot
         */
        function updateCarouselDots(activePage) {
            const dots = document.querySelectorAll('.carousel-dot');
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === activePage);
            });
        }

        /**
         * Update navigation buttons state
         */
        function updateNavButtons() {
            const prevBtn = document.getElementById('carouselPrev');
            const nextBtn = document.getElementById('carouselNext');
            const totalPages = getTotalPages();

            if (prevBtn) prevBtn.disabled = carouselCurrentIndex === 0;
            if (nextBtn) nextBtn.disabled = carouselCurrentIndex >= totalPages - 1;
        }

        /**
         * Start autoplay
         */
        function startAutoplay() {
            stopAutoplay();
            carouselAutoplayTimer = setInterval(() => {
                const totalPages = getTotalPages();
                const nextPage = (carouselCurrentIndex + 1) % totalPages;
                scrollToPage(nextPage);
            }, upcomingEventsConfig.AUTOPLAY_INTERVAL);
        }

        /**
         * Stop autoplay
         */
        function stopAutoplay() {
            if (carouselAutoplayTimer) {
                clearInterval(carouselAutoplayTimer);
                carouselAutoplayTimer = null;
            }
        }

        /**
         * Reset autoplay (restart timer)
         */
        function resetAutoplay() {
            startAutoplay();
        }

        /**
         * Initialize events carousel
         */
        function initEventsCarousel() {
            const carousel = document.getElementById('eventsCarousel');
            const prevBtn = document.getElementById('carouselPrev');
            const nextBtn = document.getElementById('carouselNext');

            if (!carousel) return;

            // Render cards and dots
            renderEventCards(upcomingEventsConfig.events);
            renderCarouselDots(getTotalPages());
            updateNavButtons();

            // Navigation button handlers
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (carouselCurrentIndex > 0) {
                        scrollToPage(carouselCurrentIndex - 1);
                        resetAutoplay();
                    }
                });
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    const totalPages = getTotalPages();
                    if (carouselCurrentIndex < totalPages - 1) {
                        scrollToPage(carouselCurrentIndex + 1);
                        resetAutoplay();
                    }
                });
            }

            // Pause autoplay on hover/touch
            carousel.addEventListener('mouseenter', stopAutoplay);
            carousel.addEventListener('mouseleave', startAutoplay);
            carousel.addEventListener('touchstart', stopAutoplay, { passive: true });
            carousel.addEventListener('touchend', () => {
                // Delay restart to allow scroll to complete
                setTimeout(startAutoplay, 1000);
            }, { passive: true });

            // Handle scroll events for dot sync
            let scrollTimeout;
            carousel.addEventListener('scroll', () => {
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const scrollLeft = carousel.scrollLeft;
                    const cardWidth = carousel.querySelector('.event-card')?.offsetWidth || 0;
                    const gap = parseFloat(getComputedStyle(carousel).gap) || 0;
                    const visibleCards = getVisibleCardsCount();
                    const pageWidth = (cardWidth + gap) * visibleCards;
                    const newPage = Math.round(scrollLeft / pageWidth);

                    if (newPage !== carouselCurrentIndex) {
                        carouselCurrentIndex = newPage;
                        updateCarouselDots(newPage);
                        updateNavButtons();
                    }
                }, 100);
            });

            // Handle window resize
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    renderCarouselDots(getTotalPages());
                    scrollToPage(0);
                    updateNavButtons();
                }, 250);
            });

            // Start autoplay
            startAutoplay();

            console.log('✅ Events carousel initialized');
        }

        // ===== Live Statistics Dashboard =====

        // 智慧統計 API URL 配置
        function getStatsApiUrl() {
            if (CONFIG.IS_DEMO_MODE()) {
                return 'DEMO_MODE';
            } else if (!CONFIG.isWordPressConfigValid()) {
                return 'WORDPRESS_CONFIG_NEEDED';
            } else {
                return CONFIG.FORM_SUBMIT_URL.replace('/exec', '/exec?action=getStats');
            }
        }

        const liveStatsConfig = {
            // 智慧統計 API endpoint
            STATS_API_URL: getStatsApiUrl(),
            UPDATE_INTERVAL: 5 * 60 * 1000, // 5 minutes
            // Cache configuration
            CACHE_KEY: 'hourOfAI_stats_cache',
            CACHE_TIMESTAMP_KEY: 'hourOfAI_stats_timestamp',
            CACHE_VERSION_KEY: 'hourOfAI_stats_version',
            CACHE_DURATION: 6 * 60 * 60 * 1000, // 6 hours
            CACHE_VERSION: 'v1', // Update this to force cache refresh
            // Initial/fallback data
            fallbackData: {
                totalEvents: 15,
                totalParticipants: 1850,
                counties: {
                    '台北市': 5,
                    '新北市': 3,
                    '台中市': 2,
                    '高雄市': 2,
                    '桃園市': 1,
                    '台南市': 1,
                    '新竹市': 1
                },
                recentActivities: [
                    { county: '台北市', type: '學校', time: '5 分鐘前', participants: 120 },
                    { county: '新北市', type: '學校', time: '15 分鐘前', participants: 80 },
                    { county: '台中市', type: '企業', time: '30 分鐘前', participants: 50 }
                ]
            }
        };

        // ===== Mock Data Generator for Demo Mode =====

        function generateMockStats() {
            const baseTime = Date.now();
            const counties = [
                '台北市', '新北市', '台中市', '台南市', '高雄市', '桃園市',
                '新竹縣', '新竹市', '苗栗縣', '彰化縣', '南投縣', '雲林縣',
                '嘉義縣', '嘉義市', '屏東縣', '宜蘭縣', '花蓮縣', '台東縣'
            ];

            const institutionTypes = ['學校', '企業', '政府機關', '非營利組織', '其他'];
            const activities = ['AI 程式體驗', 'AI 藝術創作', '機器學習入門', 'AI 倫理討論', 'AI 工具應用'];

            // 生成動態統計 (每次稍有變化)
            const mockCounties = {};
            const totalCounties = Math.floor(Math.random() * 6) + 12; // 12-18 個縣市

            for (let i = 0; i < totalCounties; i++) {
                const county = counties[Math.floor(Math.random() * counties.length)];
                if (!mockCounties[county]) {
                    mockCounties[county] = Math.floor(Math.random() * 8) + 1; // 1-8 場活動
                }
            }

            // 生成最近活動
            const recentActivities = [];
            for (let i = 0; i < 5; i++) {
                const county = counties[Math.floor(Math.random() * counties.length)];
                const type = institutionTypes[Math.floor(Math.random() * institutionTypes.length)];
                const participants = Math.floor(Math.random() * 150) + 20; // 20-170 人
                const timeAgo = ['剛剛', '5 分鐘前', '15 分鐘前', '30 分鐘前', '1 小時前'][i];

                recentActivities.push({ county, type, participants, time: timeAgo });
            }

            // 計算總計
            const totalEvents = Object.values(mockCounties).reduce((sum, count) => sum + count, 0);
            const totalParticipants = totalEvents * (Math.floor(Math.random() * 50) + 50); // 平均 50-100 人/活動

            return {
                status: 'success',
                totalEvents: totalEvents + Math.floor(Math.random() * 5), // 加一點隨機性
                totalParticipants: totalParticipants + Math.floor(Math.random() * 200),
                counties: mockCounties,
                institutionTypes: {
                    '學校': Math.floor(totalEvents * 0.6),
                    '企業': Math.floor(totalEvents * 0.2),
                    '政府機關': Math.floor(totalEvents * 0.1),
                    '非營利組織': Math.floor(totalEvents * 0.07),
                    '其他': Math.floor(totalEvents * 0.03)
                },
                recentActivities
            };
        }

        // ===== Cache Management Utilities =====

        /**
         * Save statistics data to localStorage cache
         */
        function saveToCache(data) {
            try {
                localStorage.setItem(liveStatsConfig.CACHE_KEY, JSON.stringify(data));
                localStorage.setItem(liveStatsConfig.CACHE_TIMESTAMP_KEY, Date.now().toString());
                localStorage.setItem(liveStatsConfig.CACHE_VERSION_KEY, liveStatsConfig.CACHE_VERSION);
                console.log('✅ 統計資料已儲存至快取');
            } catch (e) {
                console.warn('⚠️ localStorage 寫入失敗:', e);
                // If quota exceeded, try to clear old cache
                if (e.name === 'QuotaExceededError') {
                    clearCache();
                    try {
                        localStorage.setItem(liveStatsConfig.CACHE_KEY, JSON.stringify(data));
                        localStorage.setItem(liveStatsConfig.CACHE_TIMESTAMP_KEY, Date.now().toString());
                        localStorage.setItem(liveStatsConfig.CACHE_VERSION_KEY, liveStatsConfig.CACHE_VERSION);
                    } catch (e2) {
                        console.error('❌ 清除快取後仍無法寫入');
                    }
                }
            }
        }

        /**
         * Load statistics data from localStorage cache
         */
        function loadFromCache() {
            try {
                const cachedData = localStorage.getItem(liveStatsConfig.CACHE_KEY);
                if (cachedData) {
                    return JSON.parse(cachedData);
                }
            } catch (e) {
                console.warn('⚠️ localStorage 讀取失敗:', e);
                clearCache();
            }
            return null;
        }

        /**
         * Check if cache is still valid
         */
        function isCacheValid() {
            try {
                // Check version first
                const cachedVersion = localStorage.getItem(liveStatsConfig.CACHE_VERSION_KEY);
                if (cachedVersion !== liveStatsConfig.CACHE_VERSION) {
                    console.log('🔄 快取版本不符，需要更新');
                    return false;
                }

                const timestamp = localStorage.getItem(liveStatsConfig.CACHE_TIMESTAMP_KEY);
                if (!timestamp) {
                    return false;
                }

                const cacheAge = Date.now() - parseInt(timestamp);
                const isValid = cacheAge < liveStatsConfig.CACHE_DURATION;

                if (!isValid) {
                    console.log('⏰ 快取已過期');
                }

                return isValid;
            } catch (e) {
                console.warn('⚠️ 快取驗證失敗:', e);
                return false;
            }
        }

        /**
         * Clear cache
         */
        function clearCache() {
            try {
                localStorage.removeItem(liveStatsConfig.CACHE_KEY);
                localStorage.removeItem(liveStatsConfig.CACHE_TIMESTAMP_KEY);
                localStorage.removeItem(liveStatsConfig.CACHE_VERSION_KEY);
                console.log('🗑️ 快取已清除');
            } catch (e) {
                console.warn('⚠️ 清除快取失敗:', e);
            }
        }

        /**
         * Get cache age in milliseconds
         */
        function getCacheAge() {
            try {
                const timestamp = localStorage.getItem(liveStatsConfig.CACHE_TIMESTAMP_KEY);
                if (!timestamp) {
                    return null;
                }
                return Date.now() - parseInt(timestamp);
            } catch (e) {
                return null;
            }
        }

        /**
         * Format cache age for display
         */
        function formatCacheAge(ageMs) {
            if (!ageMs) {
                return '剛剛更新';
            }

            const minutes = Math.floor(ageMs / 60000);
            const hours = Math.floor(minutes / 60);

            if (minutes < 1) return '剛剛更新';
            if (minutes < 60) return `${minutes} 分鐘前更新`;
            if (hours < 24) return `${hours} 小時前更新`;

            const days = Math.floor(hours / 24);
            return `${days} 天前更新`;
        }

        /**
         * Update cache indicator in UI
         */
        function updateCacheIndicator(ageMs) {
            const indicator = document.getElementById('statsCacheIndicator');
            if (indicator) {
                indicator.textContent = formatCacheAge(ageMs);
            }
        }

        // ===== Global Rank Configuration =====

        /**
         * Global Rank Configuration
         */
        const globalRankConfig = {
            CSV_URL: 'https://docs.google.com/spreadsheets/d/1QDTmNNP3i6Nfhg6y7qp5V_cSL6ciNsMyF3bEjyKXTsY/export?format=csv',
            CACHE_KEY: 'hourOfAI_global_rank_cache',
            CACHE_TIMESTAMP_KEY: 'hourOfAI_global_rank_timestamp',
            CACHE_DURATION: 3600000, // 1 hour
            TARGET_COUNTRY: 'Taiwan',
            CONTEXT_RANGE: 2  // Show 2 countries above and below
        };

        /**
         * Fetch and analyze Taiwan's global rank
         */
        async function fetchTaiwanGlobalRank() {
            try {
                // Check cache first
                const cached = getGlobalRankCache();
                if (cached) {
                    console.log('Using cached global rank data');
                    return cached;
                }

                // Fetch fresh data
                const response = await fetch(globalRankConfig.CSV_URL);
                const csvText = await response.text();
                const data = parseCSV(csvText);
                const analysis = analyzeTaiwanGlobalRank(data);

                // Save to cache
                saveGlobalRankCache(analysis);

                return analysis;
            } catch (error) {
                console.error('Error fetching global rank:', error);
                return null;
            }
        }

        /**
         * Parse CSV data
         */
        function parseCSV(csvText) {
            const lines = csvText.split('\n');
            const data = [];

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
         * Analyze Taiwan's global rank
         */
        function analyzeTaiwanGlobalRank(data) {
            // Sort by count descending
            const sorted = data
                .filter(item => item.count > 0)
                .sort((a, b) => b.count - a.count);

            // Find Taiwan
            const taiwanIndex = sorted.findIndex(item =>
                item.country === globalRankConfig.TARGET_COUNTRY
            );

            if (taiwanIndex === -1) {
                throw new Error('Taiwan not found in data');
            }

            const taiwan = sorted[taiwanIndex];
            const rank = taiwanIndex + 1;
            const totalCountries = sorted.length;

            // Get nearby countries
            const contextRange = globalRankConfig.CONTEXT_RANGE;
            const nearbyCountries = [
                ...sorted.slice(Math.max(0, taiwanIndex - contextRange), taiwanIndex)
                    .map((country, idx) => ({
                        ...country,
                        rank: taiwanIndex - contextRange + idx + 1,
                        position: 'above'
                    })),
                {
                    ...taiwan,
                    rank: rank,
                    position: 'current'
                },
                ...sorted.slice(taiwanIndex + 1, taiwanIndex + contextRange + 1)
                    .map((country, idx) => ({
                        ...country,
                        rank: rank + idx + 1,
                        position: 'below'
                    }))
            ];

            return {
                globalRank: rank,
                totalCountries: totalCountries,
                percentile: ((totalCountries - rank + 1) / totalCountries * 100).toFixed(1),
                taiwanCount: taiwan.count,
                nearbyCountries: nearbyCountries,
                topCountry: sorted[0],
                lastUpdated: new Date().toISOString()
            };
        }

        /**
         * Cache management for global rank
         */
        function saveGlobalRankCache(data) {
            try {
                localStorage.setItem(globalRankConfig.CACHE_KEY, JSON.stringify(data));
                localStorage.setItem(globalRankConfig.CACHE_TIMESTAMP_KEY, Date.now().toString());
            } catch (e) {
                console.warn('Failed to save global rank cache:', e);
            }
        }

        function getGlobalRankCache() {
            try {
                const timestamp = localStorage.getItem(globalRankConfig.CACHE_TIMESTAMP_KEY);
                if (!timestamp) return null;

                const age = Date.now() - parseInt(timestamp);
                if (age > globalRankConfig.CACHE_DURATION) return null;

                const cached = localStorage.getItem(globalRankConfig.CACHE_KEY);
                return cached ? JSON.parse(cached) : null;
            } catch (e) {
                console.warn('Failed to get global rank cache:', e);
                return null;
            }
        }

        /**
         * Update UI with global rank data
         */
        function updateGlobalRankUI(rankData, localStats) {
            if (!rankData) return;

            // Update global rank card
            animateCounter(
                document.getElementById('globalRankNumber'),
                0,
                rankData.globalRank,
                1000
            );
            document.getElementById('globalRankTotal').textContent = rankData.totalCountries;
            document.getElementById('globalPercentile').textContent = rankData.percentile;

            // Update comparison card
            document.getElementById('localEventCount').textContent =
                formatNumberResponsively(localStats.totalEvents || 0);
            document.getElementById('globalEventCount').textContent =
                formatNumberResponsively(rankData.taiwanCount);

            // Update nearby countries list
            const listContainer = document.getElementById('nearbyCountriesList');
            listContainer.innerHTML = rankData.nearbyCountries.map(country => `
                <div class="country-rank-item ${country.position === 'current' ? 'current-country' : ''}">
                    <span class="rank-col">#${country.rank}</span>
                    <span class="country-col">${country.country}</span>
                    <span class="count-col">${formatNumberResponsively(country.count)} 場活動</span>
                </div>
            `).join('');
        }

        /**
         * Initialize global rank section
         */
        async function initGlobalRankSection() {
            try {
                const localStats = loadFromCache() || liveStatsConfig.fallbackData;
                const rankData = await fetchTaiwanGlobalRank();
                updateGlobalRankUI(rankData, localStats);
            } catch (error) {
                console.error('Error initializing global rank section:', error);
            }
        }

        /**
         * Refresh global rank data
         */
        async function refreshGlobalRank() {
            try {
                const rankData = await fetchTaiwanGlobalRank();
                const localStats = loadFromCache() || liveStatsConfig.fallbackData;
                updateGlobalRankUI(rankData, localStats);
            } catch (error) {
                console.error('Error refreshing global rank:', error);
            }
        }

        // Responsive number formatting
        function formatNumberResponsively(number) {
            const screenWidth = window.innerWidth;

            // Mobile: show full number (up to 6 digits comfortably)
            if (screenWidth <= 768) {
                return number.toLocaleString();
            }

            // Tablet: medium abbreviation
            if (screenWidth <= 1024) {
                if (number >= 1000000) {
                    return (number / 1000000).toFixed(1).replace('.0', '') + 'M';
                }
                if (number >= 1000) {
                    return (number / 1000).toFixed(1).replace('.0', '') + 'K';
                }
                return number.toLocaleString();
            }

            // Desktop: short abbreviation
            if (number >= 1000000) {
                return Math.floor(number / 1000000) + 'M+';
            }
            if (number >= 1000) {
                return Math.floor(number / 1000) + 'K+';
            }
            return number.toString();
        }

        // Enhanced animated counter with responsive formatting
        function animateCounter(element, start, end, duration) {
            if (!element) return;

            const range = end - start;
            const startTime = performance.now();

            function update(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out cubic
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(start + range * easeProgress);

                // Use responsive formatting
                element.textContent = formatNumberResponsively(current);

                if (progress < 1) {
                    requestAnimationFrame(update);
                }
            }

            requestAnimationFrame(update);
        }

        // Update counters on window resize to refresh number format
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                // Re-format existing counter values
                const totalEventsEl = document.getElementById('totalEvents');
                const totalParticipantsEl = document.getElementById('totalParticipants');
                const totalCountiesEl = document.getElementById('totalCounties');

                if (totalEventsEl && totalEventsEl.dataset.value) {
                    totalEventsEl.textContent = formatNumberResponsively(parseInt(totalEventsEl.dataset.value));
                }
                if (totalParticipantsEl && totalParticipantsEl.dataset.value) {
                    totalParticipantsEl.textContent = formatNumberResponsively(parseInt(totalParticipantsEl.dataset.value));
                }
                if (totalCountiesEl && totalCountiesEl.dataset.value) {
                    totalCountiesEl.textContent = formatNumberResponsively(parseInt(totalCountiesEl.dataset.value));
                }
            }, 250);
        });

        // Update counters
        function updateCounters(data) {
            const totalEvents = data.totalEvents || liveStatsConfig.fallbackData.totalEvents;
            const totalParticipants = data.totalParticipants || liveStatsConfig.fallbackData.totalParticipants;
            const totalCounties = Object.keys(data.counties || liveStatsConfig.fallbackData.counties).length;

            // Store original values for resize handling
            const totalEventsEl = document.getElementById('totalEvents');
            const totalParticipantsEl = document.getElementById('totalParticipants');
            const totalCountiesEl = document.getElementById('totalCounties');

            if (totalEventsEl) totalEventsEl.dataset.value = totalEvents;
            if (totalParticipantsEl) totalParticipantsEl.dataset.value = totalParticipants;
            if (totalCountiesEl) totalCountiesEl.dataset.value = totalCounties;

            animateCounter(totalEventsEl, 0, totalEvents, 2000);
            animateCounter(totalParticipantsEl, 0, totalParticipants, 2500);
            animateCounter(totalCountiesEl, 0, totalCounties, 1500);
        }

        // Initialize Leaflet map
        let taiwanMap = null;
        let geoJsonLayer = null;
        let currentCountyData = {};
        let taiwanGeoJSON = null; // Will be loaded from external source

        async function loadTaiwanGeoJSON() {
            try {
                // Load real Taiwan county boundaries from GitHub (g0v open data)
                const response = await fetch('https://raw.githubusercontent.com/g0v/twgeojson/master/json/twCounty2010.geo.json');

                if (!response.ok) {
                    throw new Error('Failed to load GeoJSON');
                }

                const geoData = await response.json();
                taiwanGeoJSON = geoData;

                // Map county codes/names to Traditional Chinese
                const nameMapping = {
                    'TPE': '台北市',
                    'TPH': '新北市',
                    'TYC': '桃園市',
                    'HSC': '新竹市',
                    'HSH': '新竹縣',
                    'MAL': '苗栗縣',
                    'TXG': '台中市',
                    'CWH': '彰化縣',
                    'NTO': '南投縣',
                    'YLH': '雲林縣',
                    'CHY': '嘉義市',
                    'CYI': '嘉義縣',
                    'TNN': '台南市',
                    'KHH': '高雄市',
                    'ILA': '宜蘭縣',
                    'HWA': '花蓮縣',
                    'TTT': '台東縣',
                    'PEH': '澎湖縣',
                    'KMN': '金門縣',
                    'LNN': '連江縣',
                    'PIF': '屏東縣',
                    'KEE': '基隆市',
                    // Also handle Chinese names
                    '台北市': '台北市',
                    '新北市': '新北市',
                    '桃園市': '桃園市',
                    '桃園縣': '桃園市',
                    '台中市': '台中市',
                    '台中縣': '台中市',
                    '台南市': '台南市',
                    '台南縣': '台南市',
                    '高雄市': '高雄市',
                    '高雄縣': '高雄市',
                    '基隆市': '基隆市',
                    '新竹市': '新竹市',
                    '新竹縣': '新竹縣',
                    '苗栗縣': '苗栗縣',
                    '彰化縣': '彰化縣',
                    '南投縣': '南投縣',
                    '雲林縣': '雲林縣',
                    '嘉義市': '嘉義市',
                    '嘉義縣': '嘉義縣',
                    '屏東縣': '屏東縣',
                    '宜蘭縣': '宜蘭縣',
                    '花蓮縣': '花蓮縣',
                    '台東縣': '台東縣',
                    '澎湖縣': '澎湖縣',
                    '金門縣': '金門縣',
                    '連江縣': '連江縣'
                };

                // Update feature properties with Chinese names
                taiwanGeoJSON.features.forEach(feature => {
                    const props = feature.properties;
                    const countyId = props.COUNTYID || props.COUNTYCODE || props.id;
                    const countyName = props.COUNTYNAME || props.name || props.NAME;

                    // Try to map to Chinese name
                    feature.properties.name = nameMapping[countyId] || nameMapping[countyName] || countyName;
                });

                return taiwanGeoJSON;
            } catch (error) {
                console.error('Error loading Taiwan GeoJSON, using fallback:', error);
                // Return a minimal fallback if CDN fails
                return createFallbackGeoJSON();
            }
        }

        function createFallbackGeoJSON() {
            // Fallback: just show a simple rectangle for Taiwan
            return {
                "type": "FeatureCollection",
                "features": [{
                    "type": "Feature",
                    "properties": {"name": "台灣"},
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[120, 22], [122, 22], [122, 26], [120, 26], [120, 22]]]
                    }
                }]
            };
        }

        async function initTaiwanMap() {
            // Load GeoJSON data
            if (!taiwanGeoJSON) {
                await loadTaiwanGeoJSON();
            }

            // Initialize map centered on Taiwan
            taiwanMap = L.map('taiwanMap', {
                center: [23.8, 121],
                zoom: 7,
                minZoom: 7,
                maxZoom: 10,
                zoomControl: true,
                scrollWheelZoom: false
            });

            // Add base tile layer (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(taiwanMap);

            // Add GeoJSON layer with real Taiwan boundaries
            geoJsonLayer = L.geoJSON(taiwanGeoJSON, {
                style: function(feature) {
                    return {
                        fillColor: '#E8E8E8',
                        weight: 2,
                        opacity: 1,
                        color: '#999',
                        fillOpacity: 0.6
                    };
                },
                onEachFeature: function(feature, layer) {
                    const countyName = feature.properties.name;

                    // Bind popup
                    layer.bindPopup(`
                        <div class="county-popup">
                            <div class="county-popup-name">${countyName}</div>
                            <div class="county-popup-count" id="popup-${countyName}">0</div>
                            <div class="county-popup-label">場活動</div>
                        </div>
                    `);

                    // Hover effects
                    layer.on({
                        mouseover: function(e) {
                            const layer = e.target;
                            layer.setStyle({
                                weight: 3,
                                color: '#3B7DD6',
                                fillOpacity: 0.8
                            });
                        },
                        mouseout: function(e) {
                            geoJsonLayer.resetStyle(e.target);
                        }
                    });
                }
            }).addTo(taiwanMap);
        }

        // Update Taiwan map with heat map colors
        async function updateTaiwanMap(countyData) {
            const counties = countyData || liveStatsConfig.fallbackData.counties;
            currentCountyData = counties;

            if (!taiwanMap) {
                await initTaiwanMap();
            }

            const maxCount = Math.max(...Object.values(counties), 1);

            // Update layer styling based on data
            if (geoJsonLayer) {
                geoJsonLayer.eachLayer(function(layer) {
                    const countyName = layer.feature.properties.name;
                    const count = counties[countyName] || 0;

                    // Calculate heat level
                    const percentage = count / maxCount;
                    let color = '#E8E8E8'; // Default gray

                    if (count > 0) {
                        if (percentage > 0.8) {
                            color = 'rgba(59, 125, 214, 1)'; // Deep blue
                        } else if (percentage > 0.6) {
                            color = 'rgba(59, 125, 214, 0.8)';
                        } else if (percentage > 0.4) {
                            color = 'rgba(59, 125, 214, 0.6)';
                        } else if (percentage > 0.2) {
                            color = 'rgba(59, 125, 214, 0.4)';
                        } else {
                            color = 'rgba(59, 125, 214, 0.2)';
                        }
                    }

                    // Update layer style
                    layer.setStyle({
                        fillColor: color,
                        weight: 2,
                        opacity: 1,
                        color: '#999',
                        fillOpacity: 0.7
                    });

                    // Update popup content
                    layer.bindPopup(`
                        <div class="county-popup">
                            <div class="county-popup-name">${countyName}</div>
                            <div class="county-popup-count">${count}</div>
                            <div class="county-popup-label">場活動</div>
                        </div>
                    `);
                });
            }
        }

        // Update rankings
        function updateRankings(countyData) {
            const counties = countyData || liveStatsConfig.fallbackData.counties;
            const sorted = Object.entries(counties)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

            const maxCount = sorted[0]?.[1] || 1;
            const rankingList = document.getElementById('rankingList');

            rankingList.innerHTML = sorted.map(([county, count], index) => {
                const percentage = (count / maxCount * 100).toFixed(0);
                const positionClass = index === 0 ? 'top-1' : index === 1 ? 'top-2' : index === 2 ? 'top-3' : '';

                return `
                    <div class="ranking-item">
                        <div class="ranking-position ${positionClass}">${index + 1}</div>
                        <div class="ranking-info">
                            <div class="ranking-name">${county}</div>
                            <div class="ranking-bar">
                                <div class="ranking-bar-fill" style="width: ${percentage}%"></div>
                            </div>
                        </div>
                        <div class="ranking-count">${count} 場</div>
                    </div>
                `;
            }).join('');
        }

        // Update activity feed
        function updateActivityFeed(activities) {
            const feed = activities || liveStatsConfig.fallbackData.recentActivities;
            const activityFeed = document.getElementById('activityFeed');

            activityFeed.innerHTML = feed.map(activity => {
                const icons = ['school', 'business', 'apartment', 'person', 'work'];
                const randomIcon = icons[Math.floor(Math.random() * icons.length)];

                return `
                    <div class="activity-item">
                        <div class="activity-icon">
                            <span class="material-icons medium" style="color: var(--color-white);">${randomIcon}</span>
                        </div>
                        <div class="activity-content">
                            <div class="activity-text">
                                <strong>${activity.county}</strong> 新增${activity.type}活動規劃，預計 <strong>${activity.participants}</strong> 人參與
                            </div>
                            <div class="activity-time">${activity.time}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Fetch statistics from API with cache support
        async function fetchStatistics(forceRefresh = false) {
            // 1. If not forcing refresh, check cache first
            if (!forceRefresh) {
                const cachedData = loadFromCache();
                if (cachedData && isCacheValid()) {
                    console.log('✅ 使用快取資料');
                    updateCacheIndicator(getCacheAge());
                    return cachedData;
                }
            }

            // 2. Cache invalid or forced refresh - fetch from API
            console.log(forceRefresh ? '🔄 強制重新載入資料...' : '📡 從 API 載入資料...');

            try {
                // 檢查統計 API 模式
                if (liveStatsConfig.STATS_API_URL === 'DEMO_MODE') {
                    console.log('🧪 Demo Mode: 使用模擬統計資料');

                    // 模擬 API 延遲
                    await new Promise(resolve => setTimeout(resolve, 800));

                    // 回傳模擬資料，每次稍有不同
                    const mockData = generateMockStats();
                    console.log('📊 Mock stats generated:', mockData);

                    saveToCache(mockData);
                    updateCacheIndicator(0); // Fresh data
                    return mockData;

                } else if (liveStatsConfig.STATS_API_URL === 'WORDPRESS_CONFIG_NEEDED') {
                    console.log('⚠️ WordPress 環境需要設定 API URL');
                    throw new Error('WordPress 環境需要設定統計 API');
                }

                const response = await fetch(liveStatsConfig.STATS_API_URL, {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'no-cache' // Force fresh data when calling API
                });

                if (response.ok) {
                    const data = await response.json();

                    // Save to cache
                    saveToCache(data);
                    updateCacheIndicator(0); // Just updated

                    return data;
                }
            } catch (error) {
                console.warn('⚠️ API 呼叫失敗:', error);

                // 3. API failed - try to use expired cache as fallback
                const cachedData = loadFromCache();
                if (cachedData) {
                    console.log('📦 API 失敗，使用過期快取資料');
                    updateCacheIndicator(getCacheAge());
                    return cachedData;
                }
            }

            // 4. Everything failed - use hardcoded fallback
            console.log('⚠️ 使用預設資料');
            return liveStatsConfig.fallbackData;
        }

        // Manual refresh function (called by refresh button)
        async function refreshStatistics() {
            const refreshBtn = document.getElementById('statsRefreshBtn');

            // Show loading state
            if (refreshBtn) {
                refreshBtn.classList.add('loading');
                refreshBtn.disabled = true;
            }

            try {
                // Force refresh from API
                const data = await fetchStatistics(true);

                // Update all UI components
                updateCounters(data);
                await updateTaiwanMap(data.counties);
                updateRankings(data.counties);
                updateActivityFeed(data.recentActivities);

                // Update global rank
                await refreshGlobalRank();

                console.log('✅ 統計資料已更新');
            } catch (error) {
                console.error('❌ 更新統計資料失敗:', error);
            } finally {
                // Remove loading state
                if (refreshBtn) {
                    refreshBtn.classList.remove('loading');
                    refreshBtn.disabled = false;
                }
            }
        }

        // Initialize and update statistics
        async function initStatistics() {
            // Initial load (will use cache if valid)
            const data = await fetchStatistics();

            updateCounters(data);
            await updateTaiwanMap(data.counties);
            updateRankings(data.counties);
            updateActivityFeed(data.recentActivities);

            // Initialize global rank section
            await initGlobalRankSection();

            // Check cache periodically and only refresh if expired
            // This is more efficient than unconditional refreshes
            setInterval(async () => {
                // Only fetch if cache is invalid
                if (!isCacheValid()) {
                    console.log('⏰ 快取過期，自動更新統計資料');
                    const newData = await fetchStatistics();
                    updateCounters(newData);
                    await updateTaiwanMap(newData.counties);
                    updateRankings(newData.counties);
                    updateActivityFeed(newData.recentActivities);
                    await refreshGlobalRank();
                } else {
                    console.log('✅ 快取仍有效，跳過更新');
                }
            }, liveStatsConfig.UPDATE_INTERVAL);
        }

        // ===== Submit Another Registration =====
        const submitAnotherBtn = document.getElementById('submitAnotherBtn');
        if (submitAnotherBtn) {
            submitAnotherBtn.addEventListener('click', () => {
                // Reset form
                form.reset();

                // Clear all error states
                document.querySelectorAll('.form-group.error').forEach(group => {
                    group.classList.remove('error');
                });

                // Go back to page 1
                currentPage = 1;
                showPage(currentPage);
                updateProgress();

                // Show form actions again
                formActions.classList.remove('hidden');

                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = '提交活動規劃 <span class="material-icons small">send</span>';

                // Scroll to progress steps
                document.querySelector('.form-progress').scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            });
        }

        // ===== Smooth Scrolling for Anchor Links =====
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // ===== Demo Mode Indicators Control =====
        function setupDemoModeIndicators() {
            // Check if we're in demo mode
            if (CONFIG.IS_DEMO_MODE()) {
                console.log('🧪 Demo Mode: 顯示 Demo 標示元素');

                // Show demo badge in title
                const demoIndicator = document.getElementById('demoIndicator');
                if (demoIndicator) {
                    demoIndicator.style.display = 'inline-flex';
                }

                // Show demo notice
                const demoNotice = document.getElementById('demoNotice');
                if (demoNotice) {
                    demoNotice.style.display = 'block';
                }

                // Add demo mode class to stats dashboard
                const statsDashboard = document.getElementById('statsDashboard');
                if (statsDashboard) {
                    statsDashboard.classList.add('demo-mode');
                }
            } else {
                console.log('🌐 Production Mode: 隱藏 Demo 標示元素');
                // Ensure demo indicators are hidden in production
                const demoElements = ['demoIndicator', 'demoNotice'];
                demoElements.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.style.display = 'none';
                    }
                });

                // Remove demo mode class
                const statsDashboard = document.getElementById('statsDashboard');
                if (statsDashboard) {
                    statsDashboard.classList.remove('demo-mode');
                }
            }
        }

        // ===== AI Pillars Modal =====
        function togglePillarDetail(pillarId) {
            const detailPanel = document.getElementById(`pillar-detail-${pillarId}`);
            const pillarCard = document.querySelector(`.pillar-card[data-pillar="${pillarId}"]`);
            const allCards = document.querySelectorAll('.pillar-card');

            // Reset all cards
            allCards.forEach(card => card.classList.remove('active'));

            // Mark the clicked card as active
            if (pillarCard) pillarCard.classList.add('active');

            // Open modal with content
            openPillarModal(pillarId, detailPanel);
        }

        // Store scroll position for iOS scroll lock
        let scrollPosition = 0;

        function openPillarModal(pillarId, detailPanel) {
            const modal = document.getElementById('pillarModal');
            const modalContent = document.getElementById('pillarModalContent');

            // Clone the content from the detail panel
            modalContent.innerHTML = detailPanel.innerHTML;
            modalContent.setAttribute('data-pillar', pillarId);

            // Lock body scroll (iOS compatible)
            scrollPosition = window.pageYOffset;
            document.body.classList.add('modal-open');
            document.body.style.top = `-${scrollPosition}px`;

            // Show modal
            modal.classList.add('active');

            // Focus trap for accessibility
            const closeBtn = modal.querySelector('.pillar-modal-close');
            if (closeBtn) closeBtn.focus();
        }

        function closePillarModal() {
            const modal = document.getElementById('pillarModal');
            const allCards = document.querySelectorAll('.pillar-card');

            modal.classList.remove('active');

            // Unlock body scroll and restore position instantly (no animation)
            document.body.classList.remove('modal-open');
            document.body.style.top = '';
            window.scrollTo({ top: scrollPosition, left: 0, behavior: 'instant' });

            // Reset card active states
            allCards.forEach(card => card.classList.remove('active'));
        }

        // Setup modal event listeners on DOMContentLoaded
        function setupPillarModal() {
            const modal = document.getElementById('pillarModal');
            const closeBtn = modal.querySelector('.pillar-modal-close');
            const modalContent = document.getElementById('pillarModalContent');

            // Close on close button click
            closeBtn.addEventListener('click', closePillarModal);

            // Close on overlay click (outside modal)
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closePillarModal();
                }
            });

            // Close on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    closePillarModal();
                }
            });

            // Prevent touchmove on overlay (iOS scroll fix)
            modal.addEventListener('touchmove', (e) => {
                // Only allow scrolling inside modal content
                if (!modalContent.contains(e.target)) {
                    e.preventDefault();
                }
            }, { passive: false });

            // Tab switching (event delegation for dynamically injected content)
            modalContent.addEventListener('click', (e) => {
                const tabBtn = e.target.closest('.pillar-tab-btn');
                if (!tabBtn) return;

                const tabsContainer = tabBtn.closest('.pillar-tabs');
                const tabName = tabBtn.dataset.tab;

                // Update active tab button
                tabsContainer.querySelectorAll('.pillar-tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                tabBtn.classList.add('active');

                // Update active tab panel
                tabsContainer.querySelectorAll('.pillar-tab-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                tabsContainer.querySelector(`.pillar-tab-panel[data-tab="${tabName}"]`).classList.add('active');
            });
        }

        // ===== Initialize =====
        document.addEventListener('DOMContentLoaded', () => {
            updateProgress();

            // Setup demo mode indicators based on environment
            setupDemoModeIndicators();

            // Initialize upcoming events carousel
            initEventsCarousel();

            // Initialize live statistics dashboard
            initStatistics();

            // Setup pillar modal event listeners
            setupPillarModal();

            // Setup pillar card click listeners
            document.querySelectorAll('.pillar-card[data-pillar]').forEach(card => {
                card.addEventListener('click', () => {
                    const pillarId = card.getAttribute('data-pillar');
                    togglePillarDetail(pillarId);
                });
            });

            // Setup stats refresh button
            const statsRefreshBtn = document.getElementById('statsRefreshBtn');
            if (statsRefreshBtn) {
                statsRefreshBtn.addEventListener('click', refreshStatistics);
            }

            // Trigger fade-in for elements already in viewport
            document.querySelectorAll('.fade-in').forEach(el => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight) {
                    el.classList.add('visible');
                }
            });

            // Register Service Worker for PWA
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
                    .then(reg => console.log('Service Worker registered'))
                    .catch(err => console.log('Service Worker registration failed:', err));
            }
        });

        // ===== Google Apps Script Setup Instructions =====
        /*
        To enable form submission to Google Sheets:

        1. Create a new Google Spreadsheet
        2. Go to Extensions > Apps Script
        3. Replace the Code.gs content with:

        ```javascript
        function doPost(e) {
          try {
            const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
            const data = JSON.parse(e.postData.contents);

            // Headers (create these in row 1 of your sheet first)
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

            return ContentService.createTextOutput(JSON.stringify({
              'status': 'success'
            })).setMimeType(ContentService.MimeType.JSON);

          } catch (error) {
            return ContentService.createTextOutput(JSON.stringify({
              'status': 'error',
              'message': error.toString()
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
        ```

        4. Click "Deploy" > "New deployment"
        5. Choose "Web app"
        6. Set "Execute as" to "Me"
        7. Set "Who has access" to "Anyone"
        8. Click "Deploy" and copy the Web App URL
        9. Paste the URL in the CONFIG.FORM_SUBMIT_URL above
        10. Test the form!
        */


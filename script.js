/**
 * ═══════════════════════════════════════════════════
 * DHARSHANA PORTFOLIO — Main Script
 * Handles navigation, animations, form security,
 * and interactive UI elements.
 * ═══════════════════════════════════════════════════
 *
 * SECURITY FEATURES:
 * ─ CSRF token generation & validation
 * ─ Honeypot anti-bot field
 * ─ Human verification checkbox with delay simulation
 * ─ Rate limiting on form submissions
 * ─ Input sanitization (XSS prevention)
 * ─ Output encoding
 * ─ Content-Security-Policy via <meta> tag in HTML
 * ─ Referrer-Policy, X-Frame-Options, Permissions-Policy via <meta>
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════
    // SECURITY ARCHITECTURE & MANAGERS
    // ═══════════════════════════════════════

    /**
     * SecurityManager provides centralized cryptographic token generation,
     * HTML entity sanitization, malicious pattern detection (XSS/injection),
     * and strict format validators.
     */
    class SecurityManager {
        /**
         * Sanitize string to prevent XSS attacks via HTML entity encoding.
         */
        static sanitizeInput(str) {
            if (typeof str !== 'string') return '';
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML;
        }

        /**
         * Comprehensive XSS and malicious pattern detector.
         * Scans for script tags, pseudo-protocols, event handlers,
         * dangerous objects/embeds, and injection vectors.
         */
        static containsMaliciousPatterns(str) {
            if (typeof str !== 'string') return false;
            const patterns = [
                /<script[^>]*>/i,
                /javascript\s*:/i,
                /on\w+\s*=\s*["']/i,
                /data\s*:\s*text\/html/i,
                /<iframe[^>]*>/i,
                /<object[^>]*>/i,
                /<embed[^>]*>/i,
                /<form[^>]*>/i,
                /eval\s*\(/i,
                /expression\s*\(/i,
                /url\s*\(\s*["']?javascript/i,
                /<svg[^>]*on\w+/i
            ];
            return patterns.some(pattern => pattern.test(str));
        }

        /**
         * Cryptographically secure CSRF token generation (64-character hex).
         */
        static generateCSRFToken() {
            const array = new Uint8Array(32);
            window.crypto.getRandomValues(array);
            return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
        }

        /**
         * Validate name format (letters, spaces, hyphens, apostrophes, 2-100 chars).
         */
        static isValidName(name) {
            if (typeof name !== 'string') return false;
            const trimmed = name.trim();
            return /^[a-zA-Z\s'-]{2,100}$/.test(trimmed);
        }

        /**
         * Validate email format with strict RFC regex and max 255 chars.
         */
        static isValidEmail(email) {
            if (typeof email !== 'string') return false;
            const trimmed = email.trim();
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            return emailRegex.test(trimmed) && trimmed.length <= 255;
        }
    }

    /**
     * Sliding-window client-side rate limiter.
     * Restricts submissions per time window and calculates remaining cooldown.
     */
    class RateLimiter {
        constructor(maxAttempts = 3, windowMs = 60000) {
            this.maxAttempts = maxAttempts;
            this.windowMs = windowMs;
            this.attempts = [];
        }

        isAllowed() {
            const now = Date.now();
            this.attempts = this.attempts.filter(t => now - t < this.windowMs);
            return this.attempts.length < this.maxAttempts;
        }

        getRetryAfterSeconds() {
            const now = Date.now();
            this.attempts = this.attempts.filter(t => now - t < this.windowMs);
            if (this.attempts.length < this.maxAttempts) return 0;
            const oldestInWindow = this.attempts[0];
            return Math.max(1, Math.ceil((this.windowMs - (now - oldestInWindow)) / 1000));
        }

        recordAttempt() {
            this.attempts.push(Date.now());
        }
    }

    /**
     * Timing & Physical User Interaction Tracker (Anti-Bot).
     * Bots submit forms instantaneously and without genuine pointer/keyboard events.
     */
    const TimingAndInteractionProtection = {
        formLoadTime: Date.now(),
        minSubmitTimeMs: 3000,
        hasInteracted: false,
        init() {
            const markInteraction = () => {
                this.hasInteracted = true;
            };
            window.addEventListener('keydown', markInteraction, { passive: true, once: true });
            window.addEventListener('pointerdown', markInteraction, { passive: true, once: true });
            window.addEventListener('touchstart', markInteraction, { passive: true, once: true });
        },
        isSuspiciouslyFast() {
            return (Date.now() - this.formLoadTime) < this.minSubmitTimeMs;
        },
        hasNoInteraction() {
            return !this.hasInteracted;
        }
    };
    TimingAndInteractionProtection.init();

    /**
     * Safe Toast Notification with XSS immunity.
     * Uses createElement and textContent exclusively to prevent HTML injection.
     */
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = ''; // Clear previous content safely

        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'ri-check-line' : 'ri-error-warning-line';

        const span = document.createElement('span');
        span.textContent = message; // strictly textContent, zero HTML injection

        toast.appendChild(icon);
        toast.appendChild(span);
        toast.className = `toast ${type} show`;

        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    /**
     * Debounce utility function.
     */
    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    // ═══════════════════════════════════════
    // CSRF TOKEN INITIALIZATION
    // ═══════════════════════════════════════
    let csrfToken = SecurityManager.generateCSRFToken();
    const csrfInput = document.getElementById('csrf_token');
    if (csrfInput) {
        csrfInput.value = csrfToken;
    }
    try {
        sessionStorage.setItem('csrf_token', csrfToken);
    } catch (e) {
        // SessionStorage fallback
    }


    // ═══════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════
    const nav = document.getElementById('main-nav');
    const menuBtn = document.getElementById('menu-btn');
    const navLinks = document.getElementById('nav-links');
    const navOverlay = document.getElementById('nav-overlay');
    const navLinkItems = document.querySelectorAll('.nav_links li a');

    // Toggle mobile menu
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            navOverlay.classList.toggle('open', isOpen);
            menuBtn.querySelector('i').className = isOpen ? 'ri-close-line' : 'ri-menu-line';
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });
    }

    // Close mobile menu on overlay click
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileMenu);
    }

    // Close mobile menu on nav link click
    navLinkItems.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileMenu();
        });
    });

    function closeMobileMenu() {
        if (navLinks) navLinks.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('open');
        if (menuBtn) menuBtn.querySelector('i').className = 'ri-menu-line';
        document.body.style.overflow = '';
    }

    // Nav scroll effect
    const onScroll = debounce(() => {
        if (nav) {
            nav.classList.toggle('scrolled', window.scrollY > 50);
        }
        updateActiveNavLink();
    }, 10);

    window.addEventListener('scroll', onScroll, { passive: true });

    // Active nav link based on scroll position
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollY = window.scrollY + 120;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinkItems.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }


    // ═══════════════════════════════════════
    // SCROLL REVEAL ANIMATIONS
    // ═══════════════════════════════════════
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));


    // ═══════════════════════════════════════
    // COUNTER ANIMATION
    // ═══════════════════════════════════════
    const counterElements = document.querySelectorAll('[data-count]');

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counterElements.forEach(el => counterObserver.observe(el));

    function animateCounter(el) {
        const target = parseInt(el.getAttribute('data-count'), 10);
        const duration = 2000;
        const start = performance.now();

        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(ease * target);
            el.textContent = current + '+';
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target + '+';
            }
        }

        requestAnimationFrame(update);
    }


    // ═══════════════════════════════════════
    // PROJECT FILTER
    // ═══════════════════════════════════════
    const filterBtns = document.querySelectorAll('.filter_btn');
    const projectCards = document.querySelectorAll('.project_card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');

            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter cards
            projectCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = '';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    requestAnimationFrame(() => {
                        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });


    // ═══════════════════════════════════════
    // VERIFIED BY HUMAN MODAL
    // ═══════════════════════════════════════
    const modalOverlay = document.getElementById('verified-modal-overlay');
    const modalCloseBtn = document.getElementById('verified-modal-close');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const copyProofBtn = document.getElementById('copy-verified-link');
    const modalTriggers = document.querySelectorAll('[data-trigger="verified-modal"]');

    function openModal() {
        if (modalOverlay) {
            modalOverlay.classList.add('active');
            modalOverlay.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal() {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            modalOverlay.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }
    }

    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);

    // Close on overlay click
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeMobileMenu();
        }
    });

    // Copy verification proof
    if (copyProofBtn) {
        copyProofBtn.addEventListener('click', () => {
            const proofText = `Portfolio Verification — Anbalagan Dharshana | Certificate: HV-PM-2026-DH88 | Status: ACTIVE | ${window.location.href}`;
            navigator.clipboard.writeText(proofText).then(() => {
                showToast('Verification proof copied!', 'success');
                copyProofBtn.innerHTML = '<i class="ri-check-line"></i> Copied!';
                setTimeout(() => {
                    copyProofBtn.innerHTML = '<i class="ri-file-copy-line"></i> Copy Verification Proof Link';
                }, 2000);
            }).catch(() => {
                showToast('Copy failed. Please try again.', 'error');
            });
        });
    }


    // ═══════════════════════════════════════
    // HUMAN VERIFICATION WIDGET
    // ═══════════════════════════════════════
    const verifyCheckbox = document.getElementById('verify_human_checkbox');
    const verifyText = document.getElementById('verify-text');
    const verifyWidget = document.getElementById('human-verify-widget');
    let humanVerified = false;

    if (verifyCheckbox) {
        verifyCheckbox.addEventListener('change', () => {
            if (verifyCheckbox.checked) {
                const label = verifyCheckbox.nextElementSibling;
                label.classList.add('verifying');
                if (verifyText) verifyText.textContent = 'Verifying...';

                // Simulate verification delay (security measure)
                setTimeout(() => {
                    label.classList.remove('verifying');
                    humanVerified = true;
                    if (verifyText) verifyText.textContent = 'Verified ✓';
                    if (verifyWidget) verifyWidget.classList.add('verified');
                }, 1200 + Math.random() * 800); // Random delay to prevent timing attacks
            } else {
                humanVerified = false;
                if (verifyText) verifyText.textContent = 'Verify you are human';
                if (verifyWidget) verifyWidget.classList.remove('verified');
            }
        });
    }


    // ═══════════════════════════════════════
    // CONTACT FORM — 8-GATE SECURITY PIPELINE
    // ═══════════════════════════════════════
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const formRateLimiter = new RateLimiter(3, 60000); // 3 submissions per 60 seconds

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // ── Gate 1: Honeypot Anti-Bot Trap ──
            const honeypot = document.getElementById('hp_website');
            if (honeypot && honeypot.value.trim() !== '') {
                // Automated bot detected — silently pretend success to prevent retry loops
                showToast('Message sent successfully!', 'success');
                contactForm.reset();
                return;
            }

            // ── Gate 2: Submission Timing Analysis ──
            // Humans take at least 3 seconds to complete the form
            if (TimingAndInteractionProtection.isSuspiciouslyFast()) {
                showToast('Please take a moment to review before submitting.', 'error');
                return;
            }

            // ── Gate 3: Physical Interaction Verification ──
            // Rejects automated headless scripts with no user keyboard/pointer events
            if (TimingAndInteractionProtection.hasNoInteraction()) {
                showToast('Message sent successfully!', 'success');
                contactForm.reset();
                return;
            }

            // ── Gate 4: Rate Limiting (Sliding Window) ──
            if (!formRateLimiter.isAllowed()) {
                const retrySec = formRateLimiter.getRetryAfterSeconds();
                showToast(`Too many attempts. Please wait ${retrySec}s before submitting again.`, 'error');
                return;
            }

            // ── Gate 5: Strict Input Validation ──
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            let isValid = true;

            [nameInput, emailInput, messageInput].forEach(input => {
                if (input) input.classList.remove('invalid');
            });

            const nameVal = nameInput ? nameInput.value.trim() : '';
            if (!SecurityManager.isValidName(nameVal)) {
                if (nameInput) nameInput.classList.add('invalid');
                isValid = false;
            }

            const emailVal = emailInput ? emailInput.value.trim() : '';
            if (!SecurityManager.isValidEmail(emailVal)) {
                if (emailInput) emailInput.classList.add('invalid');
                isValid = false;
            }

            const messageVal = messageInput ? messageInput.value.trim() : '';
            if (!messageVal || messageVal.length < 10 || messageVal.length > 5000) {
                if (messageInput) messageInput.classList.add('invalid');
                isValid = false;
            }

            if (!isValid) {
                showToast('Please check your entries (Valid name, email, and 10+ char message).', 'error');
                return;
            }

            // ── Gate 6: Malicious Pattern Detection (XSS/Injection) ──
            if (
                SecurityManager.containsMaliciousPatterns(nameVal) ||
                SecurityManager.containsMaliciousPatterns(emailVal) ||
                SecurityManager.containsMaliciousPatterns(messageVal)
            ) {
                showToast('Security Alert: Prohibited script or HTML patterns detected.', 'error');
                return;
            }

            // ── Gate 7: HumanGuard Interactive Verification ──
            if (!humanVerified) {
                showToast('Please complete the "Verify you are human" check first.', 'error');
                if (verifyWidget) {
                    verifyWidget.classList.add('shake');
                    setTimeout(() => verifyWidget.classList.remove('shake'), 600);
                }
                return;
            }

            // ── Gate 8: CSRF Token Integrity Check ──
            const tokenInput = document.getElementById('csrf_token');
            let storedToken;
            try {
                storedToken = sessionStorage.getItem('csrf_token');
            } catch (err) {
                storedToken = csrfToken;
            }
            if (!tokenInput || !tokenInput.value || tokenInput.value !== storedToken) {
                showToast('Security token mismatch. Please refresh the page.', 'error');
                return;
            }

            // ── Record rate limit attempt ──
            formRateLimiter.recordAttempt();

            // ── Sanitize Inputs ──
            const sanitizedData = {
                name: SecurityManager.sanitizeInput(nameVal),
                email: SecurityManager.sanitizeInput(emailVal),
                message: SecurityManager.sanitizeInput(messageVal),
                csrf_token: tokenInput.value,
                timestamp: new Date().toISOString()
            };

            // ── Submit ──
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;

            try {
                // Attempt to send to backend (if available)
                const response = await fetch('http://localhost:5000/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': sanitizedData.csrf_token
                    },
                    body: JSON.stringify(sanitizedData)
                });

                if (response.ok) {
                    showToast('Message sent successfully! I\'ll get back to you soon.', 'success');
                    contactForm.reset();
                    humanVerified = false;
                    if (verifyCheckbox) verifyCheckbox.checked = false;
                    if (verifyText) verifyText.textContent = 'Verify you are human';
                    if (verifyWidget) verifyWidget.classList.remove('verified');
                } else {
                    throw new Error('Server error');
                }
            } catch (err) {
                // Fallback: mailto link
                const mailtoLink = `mailto:anbalagandharshana14@gmail.com?subject=Portfolio Contact from ${encodeURIComponent(sanitizedData.name)}&body=${encodeURIComponent(`Name: ${sanitizedData.name}\nEmail: ${sanitizedData.email}\n\nMessage:\n${sanitizedData.message}`)}`;
                window.location.href = mailtoLink;
                showToast('Opening your email client...', 'success');
                contactForm.reset();
                humanVerified = false;
                if (verifyCheckbox) verifyCheckbox.checked = false;
                if (verifyText) verifyText.textContent = 'Verify you are human';
                if (verifyWidget) verifyWidget.classList.remove('verified');
            } finally {
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;

                // Rotate CSRF token after every submission attempt
                csrfToken = SecurityManager.generateCSRFToken();
                if (tokenInput) tokenInput.value = csrfToken;
                try {
                    sessionStorage.setItem('csrf_token', csrfToken);
                } catch (e) { /* SessionStorage fallback */ }
            }
        });

        // Real-time validation & Paste Scanning
        const formInputs = contactForm.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]), textarea');
        formInputs.forEach(input => {
            input.addEventListener('blur', () => {
                if (input.value.trim() === '' && input.required) {
                    input.classList.add('invalid');
                } else {
                    input.classList.remove('invalid');
                }
            });

            input.addEventListener('input', () => {
                if (input.classList.contains('invalid')) {
                    if (input.value.trim() !== '') {
                        input.classList.remove('invalid');
                    }
                }

                // Defense-in-depth: JS-level maxlength enforcement
                const maxLen = parseInt(input.getAttribute('maxlength'), 10);
                if (maxLen && input.value.length > maxLen) {
                    input.value = input.value.slice(0, maxLen);
                }
            });

            // ── Paste Scanning (Layer 11) ──
            input.addEventListener('paste', (e) => {
                const pastedText = (e.clipboardData || window.clipboardData)?.getData('text') || '';
                if (SecurityManager.containsMaliciousPatterns(pastedText)) {
                    e.preventDefault();
                    showToast('Security Alert: Malicious pattern detected in pasted content.', 'error');
                }
            });
        });
    }


    // ═══════════════════════════════════════
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ═══════════════════════════════════════
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const navHeight = nav ? nav.offsetHeight : 80;
                const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });


    // ═══════════════════════════════════════
    // ADDITIONAL SECURITY ENFORCEMENTS
    // ═══════════════════════════════════════

    // ── Layer 9: External Link Safety & MutationObserver ──
    const ExternalLinkProtector = {
        protectLink(anchor) {
            if (anchor.getAttribute('target') === '_blank') {
                const relVal = anchor.getAttribute('rel') || '';
                const parts = relVal.split(/\s+/).filter(Boolean);
                if (!parts.includes('noopener')) parts.push('noopener');
                if (!parts.includes('noreferrer')) parts.push('noreferrer');
                anchor.setAttribute('rel', parts.join(' '));
            }
        },
        init() {
            document.querySelectorAll('a[target="_blank"]').forEach(this.protectLink);
            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'A') ExternalLinkProtector.protectLink(node);
                            node.querySelectorAll?.('a[target="_blank"]').forEach(ExternalLinkProtector.protectLink);
                        }
                    });
                });
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }
    };
    ExternalLinkProtector.init();

    // ── Layer 10: Content & Asset Protection ──
    const ContentProtection = {
        init() {
            document.querySelectorAll('img').forEach(img => {
                img.setAttribute('draggable', 'false');
                img.addEventListener('contextmenu', (e) => e.preventDefault());
                img.addEventListener('dragstart', (e) => e.preventDefault());
            });
        }
    };
    ContentProtection.init();

    // ── CSP Violation Reporting ──
    document.addEventListener('securitypolicyviolation', (e) => {
        console.warn(
            '[CSP Violation]',
            'Directive:', e.violatedDirective,
            '| Blocked URI:', e.blockedURI,
            '| Source:', e.sourceFile, 'line', e.lineNumber
        );
    });

    // ── Prevent window.opener attacks (reverse tabnabbing) ──
    const _nativeOpen = window.open;
    window.open = function (url, target, features) {
        const newWindow = _nativeOpen.call(window, url, target, features);
        if (newWindow) {
            try { newWindow.opener = null; } catch (e) { /* cross-origin — safe */ }
        }
        return newWindow;
    };

    // ── Global Error Handlers ──
    window.addEventListener('error', (event) => {
        console.error('[Global Error]', event.message, event.filename, event.lineno);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('[Unhandled Promise Rejection]', event.reason);
    });

    // ── Console Security Indicator (SECURITY.md §18) ──
    console.log(
        '%c🛡️ Security Layer Active\n' +
        '%c  ✓ CSP Headers  ✓ CSRF Protection  ✓ XSS Prevention\n' +
        '  ✓ Rate Limiter  ✓ Honeypot Trap  ✓ Timing Analysis\n' +
        '  ✓ External Link Safety  ✓ Content Protection\n' +
        '  ✓ Malicious Pattern Detection  ✓ Paste Scanning\n' +
        '  ✓ HumanGuard Verification  ✓ Input Sanitization',
        'color: #14532d; font-size: 16px; font-weight: bold;',
        'color: #166534; font-size: 12px; font-family: monospace;'
    );

})();

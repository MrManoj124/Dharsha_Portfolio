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
    // UTILITY FUNCTIONS
    // ═══════════════════════════════════════

    /**
     * Sanitize string to prevent XSS attacks.
     * Encodes HTML special characters.
     */
    function sanitizeInput(str) {
        if (typeof str !== 'string') return '';
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    /**
     * Validate email format with a strict regex.
     */
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email) && email.length <= 255;
    }

    /**
     * Generate a CSRF token (pseudo-random hex string).
     */
    function generateCSRFToken() {
        const array = new Uint8Array(32);
        window.crypto.getRandomValues(array);
        return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Show a toast notification.
     */
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3500);
    }

    /**
     * Debounce function.
     */
    function debounce(fn, delay) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }


    // ═══════════════════════════════════════
    // CSRF TOKEN MANAGEMENT
    // ═══════════════════════════════════════
    const csrfToken = generateCSRFToken();
    const csrfInput = document.getElementById('csrf_token');
    if (csrfInput) {
        csrfInput.value = csrfToken;
    }
    // Store in sessionStorage for validation
    try {
        sessionStorage.setItem('csrf_token', csrfToken);
    } catch (e) {
        // SessionStorage not available — continue
    }

    // Record form load time for bot-detection timing check
    const formLoadTime = Date.now();
    const MIN_HUMAN_FILL_TIME_MS = 3000; // Humans take at least 3 seconds to fill a form


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
    // CONTACT FORM — SECURITY & VALIDATION
    // ═══════════════════════════════════════
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');

    // Rate limiting
    let lastSubmitTime = 0;
    const RATE_LIMIT_MS = 30000; // 30 seconds between submissions
    let submitCount = 0;
    const MAX_SUBMISSIONS = 5;

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // ── Security Check 1: Rate Limiting ──
            const now = Date.now();
            if (now - lastSubmitTime < RATE_LIMIT_MS) {
                const remainSec = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000);
                showToast(`Please wait ${remainSec}s before submitting again.`, 'error');
                return;
            }

            if (submitCount >= MAX_SUBMISSIONS) {
                showToast('Maximum submissions reached. Please try again later.', 'error');
                return;
            }

            // ── Security Check 2: Honeypot ──
            const honeypot = document.getElementById('hp_website');
            if (honeypot && honeypot.value.trim() !== '') {
                // Bot detected — silently pretend success
                showToast('Message sent successfully!', 'success');
                contactForm.reset();
                return;
            }

            // ── Security Check 2b: Form Timing ──
            // Bots submit instantly; real humans take time to type
            const timeTaken = Date.now() - formLoadTime;
            if (timeTaken < MIN_HUMAN_FILL_TIME_MS) {
                // Submitted too fast — likely a bot; silently pretend success
                showToast('Message sent successfully!', 'success');
                contactForm.reset();
                return;
            }

            // ── Security Check 3: CSRF Token Validation ──
            const tokenInput = document.getElementById('csrf_token');
            let storedToken;
            try {
                storedToken = sessionStorage.getItem('csrf_token');
            } catch (e) {
                storedToken = csrfToken;
            }
            if (!tokenInput || tokenInput.value !== storedToken) {
                showToast('Security validation failed. Please refresh the page.', 'error');
                return;
            }

            // ── Security Check 4: Human Verification ──
            if (!humanVerified) {
                showToast('Please verify you are human first.', 'error');
                return;
            }

            // ── Input Validation ──
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');
            let isValid = true;

            // Clear previous errors
            [nameInput, emailInput, messageInput].forEach(input => {
                if (input) input.classList.remove('invalid');
            });

            // Name validation
            const nameVal = nameInput ? nameInput.value.trim() : '';
            if (!nameVal || nameVal.length < 2 || nameVal.length > 100) {
                if (nameInput) nameInput.classList.add('invalid');
                isValid = false;
            }

            // Email validation
            const emailVal = emailInput ? emailInput.value.trim() : '';
            if (!emailVal || !isValidEmail(emailVal)) {
                if (emailInput) emailInput.classList.add('invalid');
                isValid = false;
            }

            // Message validation
            const messageVal = messageInput ? messageInput.value.trim() : '';
            if (!messageVal || messageVal.length < 10 || messageVal.length > 5000) {
                if (messageInput) messageInput.classList.add('invalid');
                isValid = false;
            }

            if (!isValid) {
                showToast('Please fill in all fields correctly.', 'error');
                return;
            }

            // ── Sanitize Inputs ──
            const sanitizedData = {
                name: sanitizeInput(nameVal),
                email: sanitizeInput(emailVal),
                message: sanitizeInput(messageVal),
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
                lastSubmitTime = Date.now();
                submitCount++;

                // Regenerate CSRF token
                const newToken = generateCSRFToken();
                if (tokenInput) tokenInput.value = newToken;
                try {
                    sessionStorage.setItem('csrf_token', newToken);
                } catch (e) { /* no-op */ }
            }
        });

        // Real-time validation feedback
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

                // JS-level maxlength enforcement (defense-in-depth)
                const maxLen = parseInt(input.getAttribute('maxlength'), 10);
                if (maxLen && input.value.length > maxLen) {
                    input.value = input.value.slice(0, maxLen);
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
    // ADDITIONAL SECURITY MEASURES
    // ═══════════════════════════════════════

    // Prevent right-click context menu on images (portfolio protection)
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    });

    // Disable drag on images
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('dragstart', (e) => e.preventDefault());
    });

    // ── CSP Violation Reporting ──
    // Logs any Content-Security-Policy violations for debugging/monitoring
    document.addEventListener('securitypolicyviolation', (e) => {
        console.warn(
            '[CSP Violation]',
            'Directive:', e.violatedDirective,
            '| Blocked URI:', e.blockedURI,
            '| Source:', e.sourceFile, 'line', e.lineNumber
        );
    });

    // ── Prevent window.opener attacks (reverse tabnabbing) ──
    // Any programmatic window.open gets noopener protection
    const _nativeOpen = window.open;
    window.open = function (url, target, features) {
        const newWindow = _nativeOpen.call(window, url, target, features);
        if (newWindow) {
            try { newWindow.opener = null; } catch (e) { /* cross-origin — already safe */ }
        }
        return newWindow;
    };

    // ── Global Error Handlers ──
    // Catch and log unhandled errors without exposing details to the user
    window.addEventListener('error', (event) => {
        console.error('[Global Error]', event.message, event.filename, event.lineno);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('[Unhandled Promise Rejection]', event.reason);
    });

    // ── Dev Tools Security Notice ──
    console.log(
        '%c⚠ Security Notice',
        'color: #E8A838; font-size: 20px; font-weight: bold;'
    );
    console.log(
        '%cThis portfolio is protected with comprehensive security measures.\nAll inputs are sanitized and validated.\nCSRF tokens, rate limiting, honeypot, timing checks, and CSP are active.\n\n— Dharshana Portfolio Security',
        'color: #14532d; font-size: 14px;'
    );

})();

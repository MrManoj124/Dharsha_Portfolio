/**
 * Dharshana's Portfolio — Enhanced UX Script
 * ──────────────────────────────────────────
 * Features:
 * - Mobile-responsive navigation with full-screen overlay
 * - Project filtering by category with animations
 * - Animated stats counter on scroll
 * - Active nav link highlighting based on scroll position
 * - Scroll-reveal animations with stagger delays
 * - Typing animation with blinking cursor
 * - Form validation & security (CSRF, input sanitization)
 * - Smooth scrolling & back-to-top
 * - Intersection Observer-based lazy animations
 */

// ============================================
// 1. PROJECT FILTERING
// ============================================
class ProjectFilter {
    constructor() {
        this.filterBtns = document.querySelectorAll('.filter_btn');
        this.projectCards = document.querySelectorAll('.project_card');
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        if (!this.filterBtns.length) return;
        
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleFilterClick(e.target);
            });
        });
    }

    handleFilterClick(btn) {
        // Update active state
        this.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        this.currentFilter = btn.dataset.filter;
        this.applyFilter();
    }

    applyFilter() {
        this.projectCards.forEach(card => {
            const category = card.dataset.category;
            const matches = this.currentFilter === 'all' || category === this.currentFilter;
            
            if (!matches) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.classList.add('hidden');
                }, 300);
            } else {
                card.classList.remove('hidden');
                requestAnimationFrame(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'scale(1)';
                });
            }
        });
    }
}

// ============================================
// 2. SECURITY UTILITIES
// ============================================
class SecurityManager {
    static generateCSRFToken() {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        return token;
    }

    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    static isValidEmail(email) {
        const emailRegex = /^[^@\s]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
        return emailRegex.test(email) && email.length <= 255;
    }

    static isValidName(name) {
        const nameRegex = /^[a-zA-Z\s'-]{2,100}$/;
        return nameRegex.test(name.trim());
    }

    static isValidMessage(message) {
        const trimmed = message.trim();
        return trimmed.length >= 10 && trimmed.length <= 5000;
    }
}

// ============================================
// 3. CONTACT FORM WITH SECURITY
// ============================================
class ContactFormHandler {
    constructor() {
        this.form = document.getElementById('contact-form');
        this.csrfTokenField = document.getElementById('csrf_token');
        this.submitBtn = null;
        this.init();
    }

    init() {
        if (!this.form) return;
        
        // Set CSRF token
        const csrfToken = SecurityManager.generateCSRFToken();
        if (this.csrfTokenField) {
            this.csrfTokenField.value = csrfToken;
            sessionStorage.setItem('csrfToken', csrfToken);
        }

        this.submitBtn = this.form.querySelector('.submit_btn');
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.setupInputValidation();
    }

    setupInputValidation() {
        const inputs = this.form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => {
                // Real-time sanitization
                if (input.type !== 'email') {
                    input.value = SecurityManager.sanitizeHTML(input.value);
                }
            });
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;

        if (field.id === 'name') {
            isValid = value.length > 0 && SecurityManager.isValidName(value);
        } else if (field.id === 'email') {
            isValid = SecurityManager.isValidEmail(value);
        } else if (field.id === 'message') {
            isValid = SecurityManager.isValidMessage(value);
        }

        if (!isValid && value.length > 0) {
            field.style.borderColor = '#ef4444';
            field.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.08)';
        } else {
            field.style.borderColor = '';
            field.style.boxShadow = '';
        }

        return isValid;
    }

    async handleSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const message = document.getElementById('message').value.trim();
        const csrfToken = this.csrfTokenField.value;

        // Validate all fields
        if (!name || !email || !message) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (!SecurityManager.isValidName(name)) {
            showNotification('Please enter a valid name (letters, spaces, apostrophes only)', 'error');
            return;
        }

        if (!SecurityManager.isValidEmail(email)) {
            showNotification('Please enter a valid email address', 'error');
            return;
        }

        if (!SecurityManager.isValidMessage(message)) {
            showNotification('Message must be between 10 and 5000 characters', 'error');
            return;
        }

        // Prepare sanitized data
        const formData = {
            name: SecurityManager.sanitizeHTML(name),
            email: SecurityManager.sanitizeHTML(email),
            subject: "Message from Dharsha's Portfolio",
            message: SecurityManager.sanitizeHTML(message),
            csrf_token: csrfToken,
            timestamp: new Date().toISOString()
        };

        // Disable submit button
        this.submitBtn.disabled = true;
        const originalHTML = this.submitBtn.innerHTML;
        this.submitBtn.innerHTML = '<span>Sending...</span> <i class="ri-loader-4-line" style="margin-left:0.5rem; animation: spin 1s linear infinite;"></i>';

        try {
            await this.submitForm(formData);
            
            showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
            this.form.reset();
            const newToken = SecurityManager.generateCSRFToken();
            this.csrfTokenField.value = newToken;
            sessionStorage.setItem('csrfToken', newToken);
        } catch (error) {
            showNotification(error.message || 'Failed to send message. Please try again.', 'error');
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.innerHTML = originalHTML;
        }
    }

    async submitForm(data) {
        const response = await fetch('http://localhost:5000/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: data.name,
                email: data.email,
                subject: data.subject,
                message: data.message
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || 'Failed to send message. Please try again.');
        }

        return await response.json();
    }
}

// ============================================
// 4. ANIMATED STATS COUNTER
// ============================================
class StatsCounter {
    constructor() {
        this.statNumbers = document.querySelectorAll('.stat_number[data-count]');
        this.hasAnimated = false;
        this.init();
    }

    init() {
        if (!this.statNumbers.length) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.hasAnimated) {
                    this.hasAnimated = true;
                    this.animateAll();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.3 });

        // Observe the stats container
        const statsContainer = document.querySelector('.hero_stats');
        if (statsContainer) {
            observer.observe(statsContainer);
        }
    }

    animateAll() {
        this.statNumbers.forEach((el, index) => {
            setTimeout(() => {
                this.animateNumber(el);
            }, index * 150);
        });
    }

    animateNumber(el) {
        const target = parseInt(el.dataset.count, 10);
        const duration = 1800;
        const start = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - start;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            
            el.textContent = current + '+';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }
}

// ============================================
// 5. SCROLL-REVEAL ANIMATIONS
// ============================================
class ScrollReveal {
    constructor() {
        this.init();
    }

    init() {
        const revealElements = document.querySelectorAll('.reveal');
        if (!revealElements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach((el, index) => {
            // Add stagger delay for grid items
            const parent = el.parentElement;
            if (parent) {
                const siblings = Array.from(parent.children).filter(c => c.classList.contains('reveal'));
                const siblingIndex = siblings.indexOf(el);
                if (siblingIndex > 0 && siblingIndex <= 5) {
                    el.classList.add(`reveal-delay-${siblingIndex}`);
                }
            }
            observer.observe(el);
        });
    }
}

// ============================================
// 6. ACTIVE NAV LINK HIGHLIGHTING
// ============================================
class ActiveNavHighlighter {
    constructor() {
        this.sections = document.querySelectorAll('section[id]');
        this.navLinks = document.querySelectorAll('.nav_links a[href^="#"]');
        this.init();
    }

    init() {
        if (!this.sections.length || !this.navLinks.length) return;
        
        // Throttled scroll listener
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.update();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    update() {
        const scrollPos = window.scrollY + 150;

        this.sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPos >= top && scrollPos < top + height) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// ============================================
// 7. TYPING ANIMATION WITH CURSOR
// ============================================
class TypingAnimation {
    constructor() {
        this.tagline = document.querySelector('.hero_content .tagline');
        this.init();
    }

    init() {
        if (!this.tagline) return;

        // Get cursor element
        const cursor = this.tagline.querySelector('.tagline_cursor');
        
        // Get text content without the cursor
        const text = Array.from(this.tagline.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE)
            .map(node => node.textContent)
            .join('');
        
        // Clear text but keep cursor
        this.tagline.textContent = '';
        if (cursor) this.tagline.appendChild(cursor);
        this.tagline.style.opacity = '1';

        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                // Insert text before cursor
                if (cursor) {
                    this.tagline.insertBefore(
                        document.createTextNode(text.charAt(i)),
                        cursor
                    );
                } else {
                    this.tagline.textContent += text.charAt(i);
                }
                i++;
                setTimeout(typeWriter, 60);
            } else {
                // After typing is done, remove cursor after a delay
                setTimeout(() => {
                    if (cursor) cursor.style.display = 'none';
                }, 3000);
            }
        };

        setTimeout(typeWriter, 600);
    }
}

// ============================================
// 8. MOBILE MENU TOGGLE
// ============================================
function initMobileMenu() {
    const menuBtn = document.getElementById("menu-btn");
    const navLinks = document.getElementById("nav-links");

    if (!menuBtn || !navLinks) return;

    const menuBtnIcon = menuBtn.querySelector("i");

    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("open");
        const isOpen = navLinks.classList.contains("open");
        menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close menu when clicking on a link
    navLinks.addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
            navLinks.classList.remove("open");
            menuBtnIcon.setAttribute("class", "ri-menu-line");
            document.body.style.overflow = '';
        }
    });

    // ESC key closes mobile menu
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
            navLinks.classList.remove('open');
            menuBtnIcon.setAttribute("class", "ri-menu-line");
            document.body.style.overflow = '';
        }
    });
}

// ============================================
// 9. SMOOTH SCROLL NAVIGATION
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// 10. NAVBAR SCROLL EFFECT
// ============================================
function initNavScrollEffect() {
    const nav = document.querySelector('nav');
    if (!nav) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 80) {
                    nav.classList.add('scrolled');
                } else {
                    nav.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    });
}

// ============================================
// 11. NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    notification.innerHTML = `
        <i class="${type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'}"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'linear-gradient(135deg, #2a6a77, #5fa8a4)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
        color: white;
        border-radius: 14px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        font-weight: 500;
        max-width: 360px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.95rem;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => notification.remove(), 400);
    }, 4000);
}

// ============================================
// 12. INJECT ANIMATION KEYFRAMES
// ============================================
function injectAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                opacity: 0;
                transform: translateX(80px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        @keyframes slideOutRight {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(80px);
            }
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

// ============================================
// 13. LAZY LOAD IMAGES
// ============================================
function initLazyLoad() {
    if (!('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    imageObserver.unobserve(img);
                }
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ============================================
// 14. ERROR HANDLING
// ============================================
function initErrorHandling() {
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
    });
}

// ============================================
// INITIALIZE EVERYTHING
// ============================================
function initApp() {
    // Core features
    new ProjectFilter();
    new ContactFormHandler();
    
    // UX enhancements
    new StatsCounter();
    new ScrollReveal();
    new ActiveNavHighlighter();
    new TypingAnimation();
    
    // UI behaviors
    initMobileMenu();
    initSmoothScroll();
    initNavScrollEffect();
    initLazyLoad();
    
    // System
    injectAnimationStyles();
    initErrorHandling();
}

// Boot
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

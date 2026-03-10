/**
 * Portfolio Website Enhancement Script
 * Features: 
 * - Mobile-responsive navigation
 * - Project filtering by category
 * - Form validation & security (CSRF protection, input sanitization)
 * - Animations and smooth scrolling
 * - React-ready component structure for future migration
 */

// ============================================
// 1. PROJECT FILTERING (React-Ready Component)
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
                card.classList.add('hidden');
            } else {
                card.classList.remove('hidden');
                // Re-trigger animation
                card.offsetHeight; // Force reflow
                card.style.animation = 'none';
                setTimeout(() => {
                    card.style.animation = '';
                }, 10);
            }
        });
    }
}

// Initialize project filter on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ProjectFilter();
    });
} else {
    new ProjectFilter();
}

// ============================================
// 2. SECURITY UTILITIES
// ============================================
class SecurityManager {
    /**
     * Generate CSRF token
     */
    static generateCSRFToken() {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        return token;
    }

    /**
     * HTML sanitization to prevent XSS attacks
     */
    static sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^@\s]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
        return emailRegex.test(email) && email.length <= 255;
    }

    /**
     * Validate name (alphanumeric and basic punctuation only)
     */
    static isValidName(name) {
        const nameRegex = /^[a-zA-Z\s'-]{2,100}$/;
        return nameRegex.test(name.trim());
    }

    /**
     * Validate message length and content
     */
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
        } else {
            field.style.borderColor = '';
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

        // Validate field formats
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

        // Prepare sanitized data for submission
        const formData = {
            name: SecurityManager.sanitizeHTML(name),
            email: SecurityManager.sanitizeHTML(email),
            message: SecurityManager.sanitizeHTML(message),
            csrf_token: csrfToken,
            timestamp: new Date().toISOString()
        };

        // Disable submit button
        this.submitBtn.disabled = true;
        const originalText = this.submitBtn.textContent;
        this.submitBtn.textContent = 'Sending...';

        try {
            // Simulate form submission (replace with actual API endpoint)
            await this.submitForm(formData);
            
            showNotification('Message sent successfully! I\'ll get back to you soon.', 'success');
            this.form.reset();
            // Generate new CSRF token
            const newToken = SecurityManager.generateCSRFToken();
            this.csrfTokenField.value = newToken;
            sessionStorage.setItem('csrfToken', newToken);
        } catch (error) {
            showNotification('Failed to send message. Please try again.', 'error');
        } finally {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = originalText;
        }
    }

    async submitForm(data) {
        return new Promise((resolve) => {
            // Simulate API call delay
            setTimeout(() => {
                // In production, send to your backend API:
                // fetch('/api/contact', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json',
                //         'X-CSRF-Token': data.csrf_token
                //     },
                //     body: JSON.stringify(data)
                // })
                resolve();
            }, 1500);
        });
    }
}

// Initialize contact form on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ContactFormHandler();
    });
} else {
    new ContactFormHandler();
}

// ============================================
// 4. MOBILE MENU TOGGLE
// ============================================
const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");

if (menuBtn && navLinks) {
    const menuBtnIcon = menuBtn.querySelector("i");

    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("open");
        const isOpen = navLinks.classList.contains("open");
        menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
    });

    // Close menu when clicking on a link
    navLinks.addEventListener("click", (e) => {
        if (e.target.tagName === "A") {
            navLinks.classList.remove("open");
            menuBtnIcon.setAttribute("class", "ri-menu-line");
        }
    });
}

// ============================================
// 5. SMOOTH SCROLL NAVIGATION
// ============================================
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

// ============================================
// 6. NAVBAR BACKGROUND ON SCROLL
// ============================================
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        nav.style.background = 'rgba(255, 255, 255, 0.98)';
        nav.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
    } else {
        nav.style.background = 'rgba(255, 255, 255, 0.95)';
        nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.05)';
    }
});

// ============================================
// 7. INTERSECTION OBSERVER FOR ANIMATIONS
// ============================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe all sections and cards
document.querySelectorAll('section, .skill_category, .cert_card, .blog_card').forEach(el => {
    observer.observe(el);
});

// ============================================
// 8. TYPING ANIMATION FOR HERO TAGLINE
// ============================================
const tagline = document.querySelector('.hero_content .tagline');
if (tagline) {
    const text = tagline.textContent;
    tagline.textContent = '';
    tagline.style.opacity = '1';
    
    let i = 0;
    const typeWriter = () => {
        if (i < text.length) {
            tagline.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        }
    };
    
    setTimeout(typeWriter, 500);
}

// ============================================
// 9. NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 500;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 4000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
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
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);

// ============================================
// 10. ACCESSIBILITY IMPROVEMENTS
// ============================================
// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC key closes mobile menu
    if (e.key === 'Escape' && navLinks) {
        navLinks.classList.remove('open');
        if (menuBtnIcon) {
            menuBtnIcon.setAttribute("class", "ri-menu-line");
        }
    }
});

// ============================================
// 11. PERFORMANCE OPTIMIZATION
// ============================================
// Lazy load images (for future enhancement)
if ('IntersectionObserver' in window) {
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
// 12. ERROR HANDLING & LOGGING
// ============================================
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // In production, send to error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // In production, send to error tracking service
});

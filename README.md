# Dharshana — Project Manager Portfolio

A modern, responsive portfolio website for **Anbalagan Dharshana**, a Project Management professional specializing in strategic planning, cross-functional team leadership, and agile execution.

---

## ✨ Features

- **Responsive Design** — Fully optimized for desktop, tablet, and mobile devices
- **Interactive UI** — Smooth scroll-reveal animations, animated counters, and typing effects
- **Project Showcase** — Filterable project gallery by methodology (Agile, Waterfall, Lean)
- **Experience Timeline** — Visual chronological journey of academic and professional milestones
- **Skills Overview** — Categorized display of methodologies, tools, and soft skills
- **Blog Section** — Project management insights, tips, and best practices
- **Contact Form** — Secure contact form with email verification and multi-layer protection
- **Human Verification** — Authenticity seal and verification certificate modal
- **Security Hardened** — Industry-standard protections against common web vulnerabilities

---

## 🛠️ Tech Stack

| Layer     | Technology                            |
|-----------|---------------------------------------|
| Structure | HTML5 (semantic elements)             |
| Styling   | CSS3 (custom properties, animations)  |
| Logic     | Vanilla JavaScript (ES6+)             |
| Icons     | Remix Icons (CDN with integrity hash) |
| Fonts     | Inter, Poppins (Google Fonts)         |
| Email     | EmailJS (client-side email delivery)  |

---

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- A code editor (VS Code recommended)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MrManoj124/Dharsha_Portfolio.git
   cd Dharsha_Portfolio
   ```

2. **Configure EmailJS** (for contact form)
   - Create a free account at [emailjs.com](https://www.emailjs.com/)
   - Create an email service and two templates:
     - **OTP Template** — sends a verification code to the visitor
     - **Contact Template** — forwards the visitor's message to you
   - Update the configuration in `script.js`:
     ```javascript
     const EMAILJS_PUBLIC_KEY = 'your_public_key';
     const EMAILJS_SERVICE_ID = 'your_service_id';
     const EMAILJS_OTP_TEMPLATE_ID = 'your_otp_template_id';
     const EMAILJS_CONTACT_TEMPLATE_ID = 'your_contact_template_id';
     ```

3. **Open the site**
   - Open `index.html` directly in your browser, or
   - Use a local dev server:
     ```bash
     npx serve .
     ```

---

## 📁 Project Structure

```
Dharsha_Portfolio/
├── index.html              # Main HTML page
├── style.css               # Complete stylesheet
├── script.js               # Interactive logic & form handling
├── Portfolio.jpeg           # Portfolio image
├── Portfolio_White_C.jpeg   # Profile photo
├── SECURITY.md             # Security documentation
├── FEATURES.md             # Detailed feature documentation
├── QUICKSTART.md           # Quick start guide
└── README.md               # This file
```

---

## 📬 Contact Form

The contact form includes:
- **Email OTP verification** — visitors verify their email before sending
- **Multi-layer bot protection** — automated submissions are silently rejected
- **Input validation** — all fields are validated and sanitized
- **EmailJS integration** — messages are delivered directly to your inbox

---

## 🔒 Security

This portfolio implements comprehensive client-side security measures following industry best practices. Refer to [SECURITY.md](./SECURITY.md) for the full security documentation.

> **Reporting vulnerabilities:** If you discover a security issue, please report it privately rather than opening a public issue.

---

## 📄 License

© 2026 Anbalagan Dharshana. All rights reserved.

---

## 📧 Contact

- **Email:** [anbalagandharshana14@gmail.com](mailto:anbalagandharshana14@gmail.com)
- **LinkedIn:** [Dharsha Dharshana](https://www.linkedin.com/in/dharsha-dharshana-bb4347364)
- **Location:** Colombo, Sri Lanka
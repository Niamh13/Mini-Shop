# Mini-Shop
# (Secure Applicant Programming Project)

Mini-Shop purpose is to demostrate insecure coding practices, analyse their security impact, and implement secure remediation following industry standards such as the OWASP Top 10.

The application is minimal to focus on security control rather than design or functions.

---

# Project Features

# **Core Functionality**
- Product listing  
- Add-to-cart flow  
- Admin area for viewing orders and managing products  
- Simple user review system  

# **Insecure Version Includes (Intentionally Introduced)**
- SQL Injection  
- Cross-Site Scripting: Reflected, Stored, and DOM-based  
- Sensitive Data Exposure  
- Weak session handling  
- No security headers  
- No CSRF protection  
- Naive logging exposing sensitive info  

# **Secure Version Fixes**
- Parameterised SQL queries  
- Input validation & output encoding  
- DOM sanitisation  
- Encryption & masking of sensitive data  
- Proper session management  
- CSRF tokens for unsafe actions  
- Security headers (CSP, XSS-Protection, etc.)  
- Safe logging & monitoring  
- Improved authentication & access control  

---

# Technologies Used

- **Node.js**  
- **Express.js**  
- **SQLite3**  
- **EJS templating engine**  
- **JavaScript (Frontend & Backend)**  

---

# Branch Structure

This project uses GitHub branches to separate secure and insecure versions:

- **`insecure` branch**  
  Contains the intentionally vulnerable implementation.  
  Used for demonstrating OWASP Top 10 vulnerabilities and poor security practices.

- **`secure` branch**  
  Contains the fully remediated implementation following secure coding standards.

---

# Installation & Setup

 **1. Clone the repository**
```bash
git clone https://github.com/USERNAME/mini-shop.git
cd mini-shop

 **2. Install Dependencies**
npm install

 **3. Initialise SQLite db**
node db/init.js

 **4. Run**
node app.js
http://localhost:3000

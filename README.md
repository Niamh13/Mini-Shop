# Mini-Shop (Secure Applicant Programming Project)

Mini-Shop purpose is to demostrate insecure coding practices, analyse their security impact, and implement secure remediation following industry standards such as the OWASP Top 10.

The application is minimal to focus on security control rather than design or functions.

---

# Project Features

# **Core Functionality**
- Product listing  
- Add-to-cart flow
- Fake checkout
- Admin panel
- Product management (add/update/delete)
- Order records with masked card numbers
- System activity loggin
- Simple user review system  

# **Insecure Version Includes (Intentionally Introduced)**
- SQL Injection  
- Cross-Site Scripting: Reflected, Stored, and DOM-based  
- Weak/no authentication
- Sensitive Data Exposure
- Unvalidated inputs
- Poor logging (credentials, cards numbers, etc.)
- No CSRF protection
- Missing security headers  

# **Secure Version Fixes**
- Parameterised SQL queries  
- Input validation & output encoding  
- DOM sanitisation  
- Password Hashing (bcrypt)
- Secure session management
- CSRF protection
- Helmet security headers
- Card number masking
- Safe, minimal logging
- Admin authentication
- Proper access control on admin routes 

---

# Technologies Used

- **Node.js**  
- **Express.js**  
- **SQLite3**  
- **EJS templating engine**  
- **JavaScript (Frontend & Backend)**
- **bcrypt (password hashing)**
- **Helmet (security headers)**
- **CSURF (CSURF protection)**

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

# For Secure version
npm install csurf
npm install helmet
npm install sanitize-html
npm install bcrypt

 **3. Initialise SQLite db**
node db/init.js
node db/logs.js (only for secure)

 **4. Run**
node app.js
http://localhost:3000

**5. Run Playwright test**
- on the first terminal
node app.js
- on a second terminal
npx playwright test tests

**Admin Login**
Default set as
Username: admin
Password: admin123

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");
const helmet = require("helmet");
const csurf = require("csurf");

const app = express();
const PORT = process.env.PORT || 3000;

// Security middlewares
app.use(helmet());

// Body parsers & cookies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Session config - for demo keep secure:false on localhost; set secure:true in HTTPS
app.use(session({
  secret: process.env.SESSION_SECRET || "change_this_in_production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,       // set true if using HTTPS
    sameSite: 'lax'      // helps mitigate CSRF
  }
}));

// CSRF protection - exclude /admin/login POST so we can handle login form safely
const csrfProtection = csurf();

app.use((req, res, next) => {
  // Exclude POST /admin/login from CSRF protection to avoid token errors while submitting login form
  if (req.path === "/admin/login" && req.method === "POST") {
    next();
  } else {
    csrfProtection(req, res, next);
  }
});

// Static files
app.use(express.static("public"));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Minimal, safe logging middleware (no request body logging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Helper: escaping function (available in templates)
app.locals.escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
};

// Make CSRF token available to all views (except excluded routes)
app.use((req, res, next) => {
  if (req.path === "/admin/login" && req.method === "POST") {
    // no CSRF token here
    return next();
  }
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Mount routes
app.use("/products", require("./routes/products"));
app.use("/admin", require("./routes/admin"));
app.use("/cart", require("./routes/cart"));

// Home page route rendering views/home.ejs
app.get("/", (req, res) => {
  res.render("home");
});

app.listen(PORT, () => {
  console.log(`Mini-Shop (secure) running at http://localhost:${PORT}`);
});

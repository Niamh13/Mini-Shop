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

// security middlewares
app.use(helmet());

app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  res.removeHeader("X-Content-Security-Policy");
  res.removeHeader("X-WebKit-CSP");
  next();
});


app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  })
);


// body parsers & cookies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// session config
app.use(session({
  secret: process.env.SESSION_SECRET || "change_this_in_production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,       
    sameSite: 'lax'      
  }
}));

// CSRF protection
const csrfProtection = csurf();

app.use((req, res, next) => {
  // exclude POST /admin/login from CSRF protection to avoid token errors while submitting login form
  if (req.path === "/admin/login" && req.method === "POST") {
    return next();
  } 
  csrfProtection(req, res, next);
});

app.use((req, res, next) => {
  if (req.path === "/admin/login" && req.method === "POST") return next();
  if (req.csrfToken) res.locals.csrfToken = req.csrfToken();
  next();
});

// static files
app.use(express.static("public"));

// view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// minimal, safe logging middleware (no request body logging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// escaping function
app.locals.escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
};

// mount routes
app.use("/products", require("./routes/products"));
app.use("/admin", require("./routes/admin"));
app.use("/cart", require("./routes/cart"));

// home page route rendering views/home.ejs
app.get("/", (req, res) => {
  res.render("home");
});

// start server
app.listen(PORT, () => {
  console.log(`Mini-Shop (secure) running at http://localhost:${PORT}`);
});

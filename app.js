const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: "insecure-secret", // secure version will replace this
    resave: false,
    saveUninitialized: true
}));

// Static files
app.use(express.static("public"));

// Set EJS view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use((req, res, next) => {
    console.log("USER ACTION:", req.method, req.url, "Body:", req.body);
    next();
});

// Routes
app.get("/", (req, res) => {
    res.render("home");
});

// Placeholder routes (will build later)
app.use("/products", require("./routes/products"));
app.use("/admin", require("./routes/admin"));

// Start server
app.listen(PORT, () => {
    console.log(`Mini-Shop running at http://localhost:${PORT}`);
});

app.use("/cart", require("./routes/cart"));

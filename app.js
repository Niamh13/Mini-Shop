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
    secret: "insecure-secret",
    resave: false,
    saveUninitialized: true
}));

// Static files
app.use(express.static("public"));

// Set EJS view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Poor Logging
app.use((req, res, next) => {
    console.log("USER ACTION:", req.method, req.url, "Body:", req.body);
    next();
});

// Mount Routes (Only once each)
app.use("/products", require("./routes/products"));
app.use("/admin", require("./routes/admin"));
app.use("/cart", require("./routes/cart"));

// Home route inline (OK)
app.get("/", (req, res) => {
    res.send(`
        <h1>Welcome to Mini-Shop</h1>
        <p>This is the insecure version of the project for demonstrating vulnerabilities.</p>

        <h2>Navigation</h2>
        <ul>
            <li><a href="/products">View Products</a></li>
            <li><a href="/cart">Your Cart</a></li>
            <li><a href="/admin">Admin Panel</a></li>
        </ul>
    `);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Mini-Shop running at http://localhost:${PORT}`);
});

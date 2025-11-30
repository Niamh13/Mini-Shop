const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const db = new sqlite3.Database("./db/database.sqlite");

// Require admin auth
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    return res.status(403).send("Access denied");
}

// Log admin actions
function logAdmin(message) {
    db.run("INSERT INTO logs (message) VALUES (?)", [message]);
}

// Login page
router.get("/login", (req, res) => {
    const token = req.csrfToken();
    res.cookie("csrfToken", token);
    res.render("admin_login", { error: null, csrfToken: token });
});

// Login POST
router.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM admins WHERE username = ?", [username], (err, user) => {
        if (!user) {
            return res.status(401).render("admin_login", {
                error: "Invalid username or password",
                csrfToken: req.csrfToken()
            });
        }

        bcrypt.compare(password, user.password_hash, (err, match) => {
            if (!match) {
                return res.status(401).render("admin_login", {
                    error: "Invalid username or password",
                    csrfToken: req.csrfToken()
                });
            }

            req.session.isAdmin = true;
            req.session.adminUsername = username;
            logAdmin(`${username} logged into admin panel`);
            res.redirect("/admin");
        });
    });
});

// Admin panel
router.get("/", requireAdmin, (req, res) => {
    db.all("SELECT * FROM products", (err, products) => {
        db.all("SELECT * FROM orders", (err2, orders) => {
            orders.forEach(o => {
                if (o.card_number?.length >= 4) {
                    o.card_number = "**** **** **** " + o.card_number.slice(-4);
                }
            });

            db.all("SELECT * FROM logs ORDER BY created_at DESC LIMIT 20", (e3, logs) => {
                res.render("admin", {
                    products,
                    orders,
                    logs,
                    csrfToken: req.csrfToken(),
                    adminUsername: req.session.adminUsername,
                    noLogs: logs.length === 0
                });
            });
        });
    });
});

module.exports = router;

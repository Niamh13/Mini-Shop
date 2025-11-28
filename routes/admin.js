const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const db = new sqlite3.Database("./db/database.sqlite");

// ------------------------------
// Middleware: Require Admin Login
// ------------------------------
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) {
        next();
    } else {
        res.status(403).send("Access denied. Admins only.");
    }
}

// ------------------------------
// Helper: Log Admin Actions
// ------------------------------
function logAdminAction(message) {
    db.run("INSERT INTO logs (message) VALUES (?)", [message], (err) => {
        if (err) console.error("Logging failed:", err);
    });
}

// Admin Login Pages
router.get("/login", (req, res) => {
    res.render("admin_login", { error: null, csrfToken: req.csrfToken() });
});

router.post("/login", (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM admins WHERE username = ?", [username], (err, adminUser) => {
        if (err) return res.status(500).send("Database error");

        if (!adminUser) {
            return res.render("admin_login", {
                error: "Invalid username or password",
                csrfToken: req.csrfToken()
            });
        }

        bcrypt.compare(password, adminUser.password_hash, (err, match) => {
            if (err) return res.status(500).send("Server error");

            if (!match) {
                return res.render("admin_login", {
                    error: "Invalid username or password",
                    csrfToken: req.csrfToken()
                });
            }

            req.session.isAdmin = true;
            req.session.adminUsername = username;

            logAdminAction(`${username} logged into the admin panel.`);

            res.redirect("/admin");
        });
    });
});

// Admin Logout
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});


// Main admin panel
router.get("/", requireAdmin, (req, res) => {
    db.all("SELECT * FROM products", (err, products) => {
        if (err) return res.send("Database error");

        db.all("SELECT * FROM orders", (err2, orders) => {
            if (err2) return res.send("Database error");

            // Mask card numbers
            orders.forEach(o => {
                if (o.card_number?.length >= 4) {
                    o.card_number = "**** **** **** " + o.card_number.slice(-4);
                }
            });

            db.all("SELECT * FROM logs ORDER BY created_at DESC LIMIT 20", (err3, logs) => {
                if (err3) logs = [];

                const noLogs = logs.length === 0;

                res.render("admin", {
                    products,
                    orders,
                    logs,
                    csrfToken: req.csrfToken(),
                    adminUsername: req.session.adminUsername,
                    noLogs
                });
            });
        });
    });
});

// ------------------------------
// ADD NEW PRODUCT
// ------------------------------
router.post("/products/new", requireAdmin, (req, res) => {
    const { name, price, stock } = req.body;

    db.run(
        "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
        [name, price, stock],
        function (err) {
            if (err) return res.send("Database error");

            logAdminAction(`${req.session.adminUsername} added product '${name}'.`);

            res.redirect("/admin");
        }
    );
});

// ------------------------------
// UPDATE PRODUCT
// ------------------------------
router.post("/products/:id/update", requireAdmin, (req, res) => {
    const id = req.params.id;
    const { name, price, stock } = req.body;

    db.run(
        "UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?",
        [name, price, stock, id],
        function (err) {
            if (err) return res.send("Database error");

            logAdminAction(`${req.session.adminUsername} updated product #${id}.`);

            res.redirect("/admin");
        }
    );
});

// ------------------------------
// DELETE PRODUCT
// ------------------------------
router.post("/products/:id/delete", requireAdmin, (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM products WHERE id = ?", [id], (err) => {
        if (err) return res.send("Database error");

        logAdminAction(`${req.session.adminUsername} deleted product #${id}.`);

        res.redirect("/admin");
    });
});

// ------------------------------
module.exports = router;

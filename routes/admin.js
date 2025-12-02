const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const db = new sqlite3.Database("./db/database.sqlite");

// middleware to check admin authentication
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    return res.status(403).send("Access denied");
}

// logging function
function logAdmin(message) {
    db.run("INSERT INTO logs (message) VALUES (?)", [message]);
}

// login page
router.get("/login", (req, res) => {
    res.render("admin_login", {
        error: null,
        csrfToken: req.csrfToken()
    });
});

// login POST
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

            // Save admin session
            req.session.isAdmin = true;
            req.session.adminUsername = username;

            logAdmin(`${username} logged in`);
            res.redirect("/admin");
        });
    });
});

// logout
router.get("/logout", requireAdmin, (req, res) => {
    logAdmin(`${req.session.adminUsername} logged out`);
    req.session.destroy(() => res.redirect("/"));
});

// load admin panel
router.get("/", requireAdmin, (req, res) => {
    db.all("SELECT * FROM products", (err, products) => {
        db.all("SELECT * FROM orders", (err2, orders) => {
            orders.forEach(o => {
                if (o.card_number?.length >= 4) {
                    o.card_number = "**** **** **** " + o.card_number.slice(-4);
                }
            });

            db.all("SELECT * FROM logs ORDER BY created_at DESC LIMIT 20", (err3, logs) => {
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

// add product
router.post("/products/new", requireAdmin, (req, res) => {
    const { name, price, stock } = req.body;

    db.run(
        "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
        [name, price, stock],
        () => {
            logAdmin(`${req.session.adminUsername} added product "${name}"`);
            res.redirect("/admin");
        }
    );
});

// update product
router.post("/products/:id/update", requireAdmin, (req, res) => {
    const { id } = req.params;
    const { name, price, stock } = req.body;

    db.run(
        "UPDATE products SET name = ?, price = ?, stock = ? WHERE id = ?",
        [name, price, stock, id],
        () => {
            logAdmin(`${req.session.adminUsername} updated product ID ${id}`);
            res.redirect("/admin");
        }
    );
});

// delete product
router.post("/products/:id/delete", requireAdmin, (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM products WHERE id = ?", [id], () => {
        logAdmin(`${req.session.adminUsername} deleted product ID ${id}`);
        res.redirect("/admin");
    });
});

module.exports = router;

const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/database.sqlite");

// List products with optional search (SQLi vulnerability intended)
router.get("/", (req, res) => {
    const search = req.query.search || "";
    const sql = "SELECT * FROM products WHERE name LIKE '%" + search + "%'";
    db.all(sql, [], (err, products) => {
        if (err) return res.send("Database error");
        res.render("products", { products, encodeURIComponent, search });

    });
});

// Product detail page with reviews
router.get("/:id", (req, res) => {
    const productId = req.params.id;
    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
        if (err) return res.send("Database error");
        if (!product) return res.status(404).send("Product not found");

        db.all("SELECT * FROM reviews WHERE product_id = ?", [productId], (err2, reviews) => {
            if (err2) return res.send("Database error");

            res.render("product_detail", {
                product,
                reviews: reviews || []
            });
        });
    });
});

// Add a review (stored XSS vulnerability intended)
router.post("/:id/review", (req, res) => {
    const productId = req.params.id;
    const content = req.body.content; // no sanitization for demo
    db.run(
        "INSERT INTO reviews (product_id, content) VALUES (?, ?)",
        [productId, content],
        (err) => {
            if (err) console.error(err);
            res.redirect(`/products/${productId}`);
        }
    );
});

module.exports = router;

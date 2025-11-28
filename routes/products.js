const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/database.sqlite");
const sanitizeHtml = require("sanitize-html");

// List products with safe parameterized LIKE query
router.get("/", (req, res) => {
    const search = req.query.search || "";
    const sql = "SELECT * FROM products WHERE name LIKE ?";
    db.all(sql, [`%${search}%`], (err, products) => {
        if (err) return res.send("Database error");

        const noProducts = products.length === 0;
        res.render("products", { products, encodeURIComponent, search, noProducts });
    });
});

// Product detail page with reviews (sanitized)
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

// Add a review (sanitize input, use CSRF protection)
router.post("/:id/review", (req, res) => {
    const productId = req.params.id;
    // Sanitize user input to prevent stored XSS
    const contentRaw = req.body.content || "";
    const content = sanitizeHtml(contentRaw, {
        allowedTags: [], // strip all tags
        allowedAttributes: {}
    });

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

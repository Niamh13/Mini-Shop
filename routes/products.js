const express = require("express");
const router = express.Router();
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/database.sqlite");
const sanitizeHtml = require("sanitize-html");

// LIST PRODUCTS (sanitised, parameterised)
router.get("/", (req, res) => {
    const rawSearch = req.query.search || "";

    const search = sanitizeHtml(rawSearch, {
        allowedTags: [],
        allowedAttributes: {}
    })

    const sql = "SELECT * FROM products WHERE name LIKE ?";
    db.all(sql, [`%${search}%`], (err, products) => {
        if (err) return res.send("Database error");

        const noProducts = products.length === 0;

        res.render("products", {
            products,
            search,
            noProducts,
            encodeURIComponent,
            csrfToken: req.csrfToken()
        });
    });
});

// PRODUCT DETAIL PAGE
router.get("/:id", (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
        if (err) return res.send("Database error");
        if (!product) return res.status(404).send("Product not found");

        db.all("SELECT * FROM reviews WHERE product_id = ?", [id], (err2, reviews) => {
            if (err2) return res.send("Database error");

            res.render("product_detail", {
                product,
                reviews: reviews || [],
                csrfToken: req.csrfToken()
            });
        });
    });
});

// POST REVIEW (SANITIZED)
router.post("/:id/review", (req, res) => {
    const id = req.params.id;

    const contentSanitized = sanitizeHtml(req.body.content || "", {
        allowedTags: [],
        allowedAttributes: {}
    });

    db.run(
        "INSERT INTO reviews (product_id, content) VALUES (?, ?)",
        [id, contentSanitized],
        () => res.redirect(`/products/${id}`)
    );
});

module.exports = router;

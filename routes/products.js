// shows SQL INJECTION vulnerability - the user input "search" is directly concatenated into the SQL

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./db/database.sqlite');

router.get('/', (req, res) => {
    const search = req.query.search || "";

    const sql = "SELECT * FROM products WHERE name LIKE '%" + search + "%'";
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.send("Database error");
        }
        res.render('products', { products: rows, search });
    });
});

module.exports = router;

// shows XSS vulnerabilty - reviews are entered raw and displayed without sanitization 

//product detail page
router.get("/:id", (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM products WHERE id = ?", [id], (err, product) => {
        db.all(
            "SELECT * FROM reiews WHERE product_id = " + id,(err2, reviews) => {
                res.render("product_detail", { product, reviews } );
            }
        );
    });
});

// enter reviews (XSS)
router.post("/:id/reviews", (req, res) => {
    const id = req.params.id;
    const content = req.body.content; 

    const sql = "INSERT INTO reviews (product_id, content) VALUES (" + id + ", '" + content + "')";

    db.run(sql, () => {
        res.redirect("/products/" + id);
    });
});
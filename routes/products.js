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
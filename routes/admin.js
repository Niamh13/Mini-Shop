const express = require("express");
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./db/database.sqlite');

router.get("/", (req, res) => {
    db.all("SELECT * FROM orders", (err, rows) => {
        res.render("admin", { orders: rows });
    });
});

module.exports = router;

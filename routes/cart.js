// cart.js — INSECURE VERSION
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./db/database.sqlite");

// Insecure DOM XSS route
router.get("/", (req, res) => {
    // If the test injects ?item=<img ...>, show it raw and bypass real cart
    if (req.query.item) {
        return res.send(`
            <h1>Your Cart</h1>
            <div id="cart">${req.query.item}</div> <!-- VULNERABLE: raw HTML -->
            <a href="/products">Back to products</a>
        `);
    }

    // REAL CART DISPLAY (kept insecure for consistency)
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.send(`
            <h1>Your Cart</h1>
            <p>No items yet.</p>
            <a href="/products">Back to products</a><br>
            <a href="/">Back to home</a>
        `);
    }

    const placeholders = cart.map(() => "?").join(",");

    db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, cart, (err, items) => {
        const total = items.reduce((sum, i) => sum + i.price, 0);

        res.send(`
            <h1>Your Cart</h1>
            <ul>
                ${items
                    .map(
                        i => `
                    <li>
                        ${i.name} — €${i.price}
                        <a href="/cart/remove/${i.id}" style="color:red;">[Remove]</a>
                    </li>`
                    )
                    .join("")}
            </ul>

            <h3>Total: €${total.toFixed(2)}</h3>

            <form action="/cart/pay" method="POST">
                <label>Card Number (Fake):</label><br>
                <input name="card" placeholder="1234 5678 9012 3456"><br><br>
                <button type="submit">Pay Now</button>
            </form>

            <br>
            <a href="/products">Back to products</a><br>
            <a href="/">Back to home</a>
        `);
    });
});

// Add item to cart (insecure session storage)
router.get("/add/:id", (req, res) => {
    const productId = req.params.id;

    if (!req.session.cart) req.session.cart = [];

    req.session.cart.push(productId);

    res.redirect("/cart");
});

// Remove a single item from cart
router.get("/remove/:id", (req, res) => {
    const productId = req.params.id;

    if (!req.session.cart) req.session.cart = [];

    const index = req.session.cart.indexOf(productId);

    if (index !== -1) {
        req.session.cart.splice(index, 1);   
    }

    res.redirect("/cart");
});

// Insecure payment (NO CSRF protection!)
router.post("/pay", (req, res) => {
    const cart = req.session.cart || [];
    const fakeCard = req.body.card || "NO CARD ENTERED";

    if (cart.length === 0) {
        return res.send("<p>Your cart is empty!</p>");
    }

    db.run(
        "INSERT INTO orders (card_number) VALUES (?)",
        [fakeCard],
        function (err) {
            if (err) return res.send("Error creating order.");

            req.session.cart = []; // clear cart

            res.send(`
                <h1>Order Successful</h1>
                <p>Your fake payment has been processed (insecure).</p>
                <p>Order ID: ${this.lastID}</p>

                <a href="/products">Continue Shopping</a><br>
                <a href="/">Back to home</a>
            `);
        }
    );
});

module.exports = router;

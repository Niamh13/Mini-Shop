const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./db/database.sqlite");

// Secure HTML escape
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[m]));
}

// Add item to cart (POST ONLY)
router.post("/add/:id", (req, res) => {
    const id = req.params.id;

    if (!req.session.cart) req.session.cart = [];
    req.session.cart.push(id);

    res.redirect("/cart");
});

// Remove item from cart
router.post("/remove/:id", (req, res) => {
    const id = req.params.id;

    if (!req.session.cart) req.session.cart = [];
    const index = req.session.cart.indexOf(id);
    if (index !== -1) req.session.cart.splice(index, 1);

    res.redirect("/cart");
});

// View cart
router.get("/", (req, res) => {
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.send(`
            <h1>Your Cart</h1>
            <p>No items yet.</p>
            <a href="/products">Back to products</a>
        `);
    }

    const placeholders = cart.map(() => "?").join(",");

    db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, cart, (err, items) => {
        if (err) return res.send("Database error");

        const total = items.reduce((s, i) => s + i.price, 0);

        res.send(`
            <h1>Your Cart</h1>
            <ul>
                ${items.map(i => `
                    <li>
                        ${escapeHtml(i.name)} — €${i.price.toFixed(2)}
                        <form method="POST" action="/cart/remove/${i.id}" style="display:inline;">
                            <input type="hidden" name="_csrf" value="${res.locals.csrfToken}">
                            <button type="submit" style="color:red;">Remove</button>
                        </form>
                    </li>
                `).join("")}
            </ul>

            <h3>Total: €${total.toFixed(2)}</h3>

            <form method="POST" action="/cart/pay">
                <input type="hidden" name="_csrf" value="${res.locals.csrfToken}">
                <input name="card" placeholder="1234 5678 9012 3456" required>
                <button type="submit">Pay Now</button>
            </form>

            <a href="/products">Continue Shopping</a>
        `);
    });
});

// Payment
router.post("/pay", (req, res) => {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.status(400).send("Cart is empty");

    const placeholders = cart.map(() => "?").join(",");

    db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, cart, (err, items) => {
        if (err) return res.send("Database error");

        const total = items.reduce((s, i) => s + i.price, 0);

        let card = req.body.card.replace(/\D/g, "");
        if (card.length >= 4) card = "**** **** **** " + card.slice(-4);

        db.run("INSERT INTO orders (card_number, total) VALUES (?, ?)",
            [card, total],
            function () {
                req.session.cart = [];

                res.send(`
                    <h1>Order Successful</h1>
                    <p>Order ID: ${this.lastID}</p>
                    <p>Total Paid: €${total.toFixed(2)}</p>
                    <a href="/products">Back to Products</a>
                `);
            }
        );
    });
});

module.exports = router;

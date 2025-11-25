const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./db/database.sqlite");

// Add item to cart
router.get("/add/:id", (req, res) => {
    const productId = req.params.id;
    if (!req.session.cart) req.session.cart = [];
    req.session.cart.push(productId);
    res.redirect("/cart");
});

// Remove item from cart
router.get("/remove/:id", (req, res) => {
    const productId = req.params.id;
    if (!req.session.cart) req.session.cart = [];
    const index = req.session.cart.indexOf(productId);
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
            <a href="/products">Back to products</a><br>
            <a href="/">Back to home</a>
        `);
    }

    const placeholders = cart.map(() => "?").join(",");

    db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, cart, (err, items) => {
        if (err) return res.send("Database error");

        const total = items.reduce((sum, i) => sum + i.price, 0);

        res.send(`
            <h1>Your Cart</h1>
            <ul>
                ${items.map(i => `
                    <li>
                        ${escapeHtml(i.name)} — €${i.price.toFixed(2)}
                        <a href="/cart/remove/${i.id}" style="color:red;">[Remove]</a>
                    </li>
                `).join("")}
            </ul>

            <h3>Total: €${total.toFixed(2)}</h3>

            <form action="/cart/pay" method="POST">
                <input type="hidden" name="_csrf" value="${res.locals.csrfToken}">
                <label>Card Number (Fake):</label><br>
                <input name="card" placeholder="1234 5678 9012 3456" required><br><br>
                <button type="submit">Pay Now</button>
            </form>

            <br>
            <a href="/products">Back to products</a><br>
            <a href="/">Back to home</a>
        `);
    });
});

// Escape helper to prevent XSS in cart item names
function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (m) {
        switch (m) {
            case "&": return "&amp;";
            case "<": return "&lt;";
            case ">": return "&gt;";
            case '"': return "&quot;";
            case "'": return "&#39;";
            default: return m;
        }
    });
}

// Fake payment → creates order (mask card number)
// Fake payment → creates order (mask card number + store total)
router.post("/pay", (req, res) => {
    const cart = req.session.cart || [];
    let cardRaw = req.body.card || "NO CARD ENTERED";

    if (cart.length === 0) {
        return res.send("<p>Your cart is empty!</p>");
    }

    // Recalculate total from cart (never trust client-side values)
    const placeholders = cart.map(() => "?").join(",");
    db.all(`SELECT * FROM products WHERE id IN (${placeholders})`, cart, (err, items) => {
        if (err) return res.send("Database error during payment.");

        const total = items.reduce((sum, i) => sum + i.price, 0);

        // Mask card number for storage
        let cardNumber = cardRaw.replace(/\D/g, ''); // remove non-digits
        if (cardNumber.length >= 4) {
            cardNumber = "**** **** **** " + cardNumber.slice(-4);
        } else {
            cardNumber = "**** **** **** ****";
        }

        db.run(
            "INSERT INTO orders (card_number, total) VALUES (?, ?)",
            [cardNumber, total],
            function (err) {
                if (err) return res.send("Error creating order.");

                req.session.cart = []; // clear cart

                res.send(`
                    <h1>Order Successful</h1>
                    <p>Your fake payment has been processed.</p>
                    <p><strong>Order ID:</strong> ${this.lastID}</p>
                    <p><strong>Total Paid:</strong> €${total.toFixed(2)}</p>

                    <a href="/products">Continue Shopping</a><br>
                    <a href="/">Back to home</a>
                `);
            }
        );
    });
});


module.exports = router;

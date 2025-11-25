const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();
const db = new sqlite3.Database("./db/database.sqlite");

// Admin home — list products + orders
router.get("/", (req, res) => {
    db.all("SELECT * FROM products", (err, products) => {
        db.all("SELECT * FROM orders", (err2, orders) => {
            res.send(`
                <h1>Admin Panel</h1>

                <a href="/">Back to Home</a>
                <hr>

                <h2>Add New Product</h2>
                <form method="POST" action="/admin/add">
                    <input name="name" placeholder="Product name">
                    <input name="price" placeholder="Price">
                    <input name="stock" placeholder="Stock">
                    <button type="submit">Add Product</button>
                </form>

                <h2>Products</h2>
                <ul>
                    ${products.map(p =>
                        `<li>
                            ${p.name} — €${p.price} — Stock: ${p.stock}
                            <form method="POST" action="/admin/stock/${p.id}" style="display:inline;">
                                <input name="stock" placeholder="New stock">
                                <button type="submit">Update Stock</button>
                            </form>
                            <form method="POST" action="/admin/delete/${p.id}" style="display:inline;">
                                <button type="submit">Delete</button>
                            </form>
                        </li>`
                    ).join("")}
                </ul>

                <h2>Orders</h2>
                <ul>
                    ${orders.map(o =>
                        `<li>Order #${o.id} — Card: ${o.card_number}</li>`
                    ).join("")}
                </ul>
            `);
        });
    });
});

// Add product
router.post("/add", (req, res) => {
    const { name, price, stock } = req.body;

    db.run(
        "INSERT INTO products (name, price, stock) VALUES (?, ?, ?)",
        [name, price, stock],
        () => res.redirect("/admin")
    );
});

// Update stock
router.post("/stock/:id", (req, res) => {
    const id = req.params.id;
    const stock = req.body.stock;

    db.run("UPDATE products SET stock = ? WHERE id = ?", [stock, id], () => {
        res.redirect("/admin");
    });
});

// Delete product
router.post("/delete/:id", (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM products WHERE id = ?", [id], () => {
        res.redirect("/admin");
    });
});

module.exports = router;

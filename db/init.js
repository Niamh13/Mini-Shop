const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./db/database.sqlite");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            price REAL,
            stock INTEGER DEFAULT 10
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            content TEXT
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            card_number TEXT,
            total TEXT
        )
    `);

    // fake products
    db.run(`INSERT INTO products (name, price) VALUES ('Red Double Knit Yarn', 8.99)`);
    db.run(`INSERT INTO products (name, price) VALUES ('Blue Double Knit Yarn', 9.99)`);
    db.run(`INSERT INTO products (name, price) VALUES ('Black Double Knit Yarn', 9.49)`);

    // fake orders
    db.run(`INSERT INTO orders (card_number, total) VALUES ('4242 4242 4242 4242', 31.47)`);
    db.run(`INSERT INTO orders (card_number, total) VALUES ('5555 5555 5555 4444', 19.48)`);
    db.run(`INSERT INTO orders (card_number, total) VALUES ('3714 496353 98431', 50.45)`);
});

console.log("Database initialized with sample data.");
db.close();

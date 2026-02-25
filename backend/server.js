const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'inventory.db'));

// Create products table
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    sku TEXT UNIQUE NOT NULL,
    description TEXT
  )
`);

// Seed with 20 products if table is empty
const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
if (count.count === 0) {
  const insert = db.prepare(
    'INSERT INTO products (name, category, price, quantity, sku, description) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const seedProducts = [
    ['Wireless Headphones', 'Electronics', 79.99, 45, 'WH-1001', 'Over-ear Bluetooth headphones with noise cancellation'],
    ['Running Shoes', 'Footwear', 129.99, 30, 'RS-2002', 'Lightweight breathable running shoes'],
    ['Coffee Maker', 'Appliances', 59.99, 20, 'CM-3003', '12-cup programmable coffee maker'],
    ['Yoga Mat', 'Sports', 34.99, 60, 'YM-4004', 'Non-slip eco-friendly yoga mat'],
    ['Backpack', 'Bags', 49.99, 25, 'BP-5005', '30L waterproof hiking backpack'],
    ['Desk Lamp', 'Home Office', 29.99, 40, 'DL-6006', 'LED desk lamp with adjustable brightness'],
    ['Water Bottle', 'Sports', 19.99, 100, 'WB-7007', 'Insulated stainless steel water bottle 32oz'],
    ['Bluetooth Speaker', 'Electronics', 49.99, 35, 'BS-8008', 'Portable waterproof Bluetooth speaker'],
    ['Notebook Set', 'Stationery', 14.99, 80, 'NB-9009', 'Set of 3 hardcover ruled notebooks'],
    ['Kitchen Knife Set', 'Kitchen', 89.99, 15, 'KK-1010', '7-piece professional knife set with block'],
    ['Sunglasses', 'Accessories', 39.99, 50, 'SG-1011', 'UV400 polarized sunglasses'],
    ['Fitness Tracker', 'Electronics', 99.99, 28, 'FT-1012', 'Waterproof fitness tracker with heart rate monitor'],
    ['Candle Set', 'Home Decor', 24.99, 55, 'CS-1013', 'Set of 4 scented soy candles'],
    ['Fleece Jacket', 'Clothing', 69.99, 22, 'FJ-1014', 'Lightweight outdoor fleece jacket'],
    ['Cutting Board', 'Kitchen', 22.99, 38, 'CB-1015', 'Large bamboo cutting board with juice groove'],
    ['Mouse Pad', 'Home Office', 12.99, 75, 'MP-1016', 'Extended gaming mouse pad XL'],
    ['Throw Pillow', 'Home Decor', 18.99, 90, 'TP-1017', 'Decorative velvet throw pillow 18x18'],
    ['Resistance Bands', 'Sports', 27.99, 65, 'RB-1018', 'Set of 5 resistance bands with carry bag'],
    ['Ceramic Mug', 'Kitchen', 11.99, 110, 'CM-1019', 'Large 16oz ceramic coffee mug'],
    ['USB-C Hub', 'Electronics', 44.99, 32, 'UH-1020', '7-in-1 USB-C hub with HDMI and card reader'],
  ];

  const insertMany = db.transaction((products) => {
    for (const product of products) {
      insert.run(...product);
    }
  });
  insertMany(seedProducts);
  console.log('Database seeded with 20 products');
}

// GET all products (with optional search and category filter)
app.get('/api/products', (req, res) => {
  const { search, category } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];

  if (search || category) {
    query += ' WHERE';
    if (search) {
      query += ' (name LIKE ? OR sku LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (search && category) query += ' AND';
    if (category) {
      query += ' category = ?';
      params.push(category);
    }
  }
  query += ' ORDER BY name ASC';

  const products = db.prepare(query).all(...params);
  res.json(products);
});

// GET single product
app.get('/api/products/:id', (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST create product
app.post('/api/products', (req, res) => {
  const { name, category, price, quantity, sku, description } = req.body;
  if (!name || !category || price == null || !sku) {
    return res.status(400).json({ error: 'name, category, price, and sku are required' });
  }
  try {
    const result = db
      .prepare(
        'INSERT INTO products (name, category, price, quantity, sku, description) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(name, category, parseFloat(price), parseInt(quantity) || 0, sku, description || '');
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PATCH update product quantity
app.patch('/api/products/:id/quantity', (req, res) => {
  const { quantity } = req.body;
  if (quantity == null || quantity < 0) {
    return res.status(400).json({ error: 'Valid quantity is required' });
  }
  const result = db
    .prepare('UPDATE products SET quantity = ? WHERE id = ?')
    .run(parseInt(quantity), req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json(product);
});

// PUT update product
app.put('/api/products/:id', (req, res) => {
  const { name, category, price, quantity, sku, description } = req.body;
  if (!name || !category || price == null || !sku) {
    return res.status(400).json({ error: 'name, category, price, and sku are required' });
  }
  try {
    const result = db
      .prepare(
        'UPDATE products SET name = ?, category = ?, price = ?, quantity = ?, sku = ?, description = ? WHERE id = ?'
      )
      .run(name, category, parseFloat(price), parseInt(quantity) || 0, sku, description || '', req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    res.json(product);
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE product
app.delete('/api/products/:id', (req, res) => {
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Product not found' });
  res.json({ message: 'Product deleted' });
});

// GET categories
app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json(categories.map((r) => r.category));
});

app.listen(PORT, () => {
  console.log(`Inventory API running at http://localhost:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(helmet());
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
    ['Classic White Crew Tee', "Men's", 19.99, 120, 'TS-M-001', '100% cotton classic crewneck tee in white'],
    ['Classic Black Crew Tee', "Men's", 19.99, 95, 'TS-M-002', '100% cotton classic crewneck tee in black'],
    ['Vintage Logo Tee', "Men's", 27.99, 60, 'TS-M-003', 'Washed vintage-look graphic logo tee'],
    ['Striped Crewneck Tee', "Men's", 24.99, 45, 'TS-M-004', 'Classic navy and white horizontal stripe tee'],
    ['Graphic Print Tee', "Men's", 29.99, 50, 'TS-M-005', 'Bold screen-printed graphic front tee'],
    ['Slim-Fit Polo Shirt', "Men's", 39.99, 35, 'TS-M-006', 'Piqué cotton slim-fit polo shirt'],
    ['Classic White V-Neck', "Women's", 21.99, 110, 'TS-W-001', 'Soft cotton V-neck tee in white'],
    ['Floral Print Tee', "Women's", 27.99, 55, 'TS-W-002', 'Lightweight floral all-over print tee'],
    ['Cropped Graphic Tee', "Women's", 25.99, 70, 'TS-W-003', 'Cropped fit with retro graphic print'],
    ['Tie-Dye Relaxed Tee', "Women's", 29.99, 40, 'TS-W-004', 'Hand-dyed tie-dye relaxed fit tee'],
    ['Ribbed Tank Top', "Women's", 18.99, 80, 'TS-W-005', 'Stretchy ribbed cotton tank top'],
    ['Oversized Boyfriend Tee', "Women's", 26.99, 65, 'TS-W-006', 'Relaxed oversized fit drop-shoulder tee'],
    ['Kids Dino Graphic Tee', "Kids'", 14.99, 90, 'TS-K-001', 'Fun dinosaur graphic print kids tee'],
    ['Kids Plain Tee', "Kids'", 12.99, 130, 'TS-K-002', 'Essential plain cotton tee for kids'],
    ['Kids Rainbow Stripe Tee', "Kids'", 15.99, 75, 'TS-K-003', 'Bright rainbow stripe kids tee'],
    ['Unisex Logo Tee', 'Unisex', 24.99, 85, 'TS-U-001', 'Signature brand logo tee, unisex fit'],
    ['Unisex Pocket Tee', 'Unisex', 22.99, 100, 'TS-U-002', 'Minimalist chest-pocket tee, unisex'],
    ['Long Sleeve Tee', 'Unisex', 29.99, 55, 'TS-U-003', 'Classic long sleeve cotton tee, unisex'],
    ['Performance Tee', 'Unisex', 34.99, 8, 'TS-U-004', 'Moisture-wicking athletic performance tee'],
    ['Branded Tote Bag', 'Accessories', 14.99, 0, 'TS-A-001', 'Heavy-duty canvas tote with brand logo'],
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

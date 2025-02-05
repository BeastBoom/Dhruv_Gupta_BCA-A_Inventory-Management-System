const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// MySQL Connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',     // Use DB_HOST from env, fallback to localhost
  user: process.env.DB_USER || 'root',            // Use DB_USER from env
  password: process.env.DB_PASSWORD || '',        // Use DB_PASSWORD from env
  database: process.env.DB_DATABASE || 'inventory_db' // Use DB_DATABASE from env
});


// Connect to MySQL and create tables if they don't exist
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');

  // Products table (already exists)
  connection.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      quantity INT DEFAULT 0,
      price DECIMAL(10,2) NOT NULL,
      category_id INT DEFAULT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `, (err) => {
    if (err) console.error('Error creating products table:', err);
    else console.log('Products table is ready');
  });

  // Categories table (already exists)
  connection.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      product_ids VARCHAR(255)
    )
  `, (err) => {
    if (err) console.error('Error creating categories table:', err);
    else console.log('Categories table is ready');
  });

 // Create the customers table if it doesn't exist
connection.query(`
  CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    customer_number VARCHAR(255) NOT NULL,
    email VARCHAR(255)
  )
`, (err) => {
  if (err) {
    console.error('Error creating customers table:', err);
  } else {
    console.log('Customers table is ready');
  }
});


  // Orders table
  connection.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      order_value DECIMAL(10,2),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `, (err) => {
    if (err) console.error('Error creating orders table:', err);
    else console.log('Orders table is ready');
  });

  // Order_items table
  connection.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      product_id INT,
      quantity INT,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `, (err) => {
    if (err) console.error('Error creating order_items table:', err);
    else console.log('Order_items table is ready');
  });
});

// Helper function to renumber products (if desired)
function renumberProducts(callback) {
  connection.query('SET @count = 0', (err) => {
    if (err) return callback(err);
    connection.query('UPDATE products SET id = (@count:=@count + 1) ORDER BY id', (err) => {
      if (err) return callback(err);
      connection.query('ALTER TABLE products AUTO_INCREMENT = 1', callback);
    });
  });
}

/* ---------- PRODUCTS API ---------- */
app.get('/api/products', (req, res) => {
  connection.query(
    `SELECT p.*, c.name AS category_name 
     FROM products p 
     LEFT JOIN categories c ON p.category_id = c.id`,
    (err, results) => {
      if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).send('Error fetching products');
      }
      res.json(results);
    }
  );
});

app.post('/api/products', (req, res) => {
  const { name, quantity, price, category_id } = req.body;
  if (isNaN(price)) return res.status(400).send('Price must be a valid number');
  connection.query(
    'INSERT INTO products (name, quantity, price, category_id) VALUES (?, ?, ?, ?)',
    [name, quantity, price, category_id || null],
    (err) => {
      if (err) {
        console.error('Error adding product:', err);
        return res.status(500).send('Error adding product');
      }
      renumberProducts((err) => {
        if (err) {
          console.error('Error renumbering products:', err);
          return res.status(500).send('Error renumbering products');
        }
        connection.query(
          'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id DESC LIMIT 1',
          (err, rows) => {
            if (err) {
              console.error('Error fetching product after renumbering:', err);
              return res.status(500).send('Error fetching product');
            }
            res.status(201).json(rows[0]);
          }
        );
      });
    }
  );
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, quantity, price, category_id } = req.body;
  connection.query(
    'UPDATE products SET name = ?, quantity = ?, price = ?, category_id = ? WHERE id = ?',
    [name, quantity, price, category_id || null, id],
    (err, results) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).send('Error updating product');
      }
      if (results.affectedRows === 0) return res.status(404).send('Product not found');
      res.json({ id, name, quantity, price, category_id });
    }
  );
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM products WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).send('Error deleting product');
    }
    if (results.affectedRows === 0) return res.status(404).send('Product not found');
    renumberProducts((err) => {
      if (err) {
        console.error('Error renumbering products:', err);
        return res.status(500).send('Error renumbering products');
      }
      res.json({ message: 'Product deleted and IDs renumbered successfully' });
    });
  });
});

/* ---------- CATEGORIES API ---------- */
app.get('/api/categories', (req, res) => {
  connection.query(
    `SELECT 
       c.id AS category_id, 
       c.name AS category_name, 
       c.description, 
       CONCAT('[', GROUP_CONCAT(
           CONCAT(
               '{',
               '"id":', p.id, ',',
               '"name":"', p.name, '",',
               '"price":', p.price, ',',
               '"quantity":', p.quantity,
               '}'
           )
       ), ']') AS products
     FROM categories c
     LEFT JOIN products p ON c.id = p.category_id
     GROUP BY c.id`,
    (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).send('Error fetching categories');
      }
      const parsedResults = results.map(row => ({
        id: row.category_id,
        name: row.category_name,
        description: row.description,
        products: row.products && row.products !== '[null]' ? JSON.parse(row.products) : []
      }));
      res.json(parsedResults);
    }
  );
});

app.post('/api/categories', (req, res) => {
  const { name, description, product_ids } = req.body;
  connection.query(
    'INSERT INTO categories (name, description, product_ids) VALUES (?, ?, ?)',
    [name, description, product_ids],
    (err, insertResult) => {
      if (err) {
        console.error('Error adding category:', err);
        return res.status(500).send('Error adding category');
      }
      connection.query('SELECT * FROM categories WHERE id = ?', [insertResult.insertId], (err, rows) => {
        if (err) {
          console.error('Error fetching category:', err);
          return res.status(500).send('Error fetching category');
        }
        res.status(201).json(rows[0]);
      });
    }
  );
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, product_ids } = req.body;
  connection.query(
    'UPDATE categories SET name = ?, description = ?, product_ids = ? WHERE id = ?',
    [name, description, product_ids, id],
    (err, updateResult) => {
      if (err) {
        console.error('Error updating category:', err);
        return res.status(500).send('Error updating category');
      }
      if (updateResult.affectedRows === 0) return res.status(404).send('Category not found');
      res.json({ id, name, description, product_ids });
    }
  );
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM categories WHERE id = ?', [id], (err, deleteResult) => {
    if (err) {
      console.error('Error deleting category:', err);
      return res.status(500).send('Error deleting category');
    }
    if (deleteResult.affectedRows === 0) return res.status(404).send('Category not found');
    res.json({ message: 'Category deleted successfully' });
  });
});

/* ---------- CUSTOMERS API ---------- */
// Get all customers
app.get('/api/customers', (req, res) => {
  connection.query(
    `SELECT 
       cu.id,
       cu.name,
       cu.customer_number,
       cu.email,
       (SELECT GROUP_CONCAT(o.id) FROM orders o WHERE o.customer_id = cu.id) AS orders
     FROM customers cu`,
    (err, results) => {
      if (err) {
        console.error('Error fetching customers:', err);
        return res.status(500).send('Error fetching customers');
      }
      res.json(results);
    }
  );
});

// Add new customer
app.post('/api/customers', (req, res) => {
  const { name, customer_number, email } = req.body;
  // email is optional; customer_number is required
  if (!name || !customer_number) {
    return res.status(400).send('Name and Customer Number are required');
  }
  connection.query(
    'INSERT INTO customers (name, customer_number, email) VALUES (?, ?, ?)',
    [name, customer_number, email || null],
    (err, insertResult) => {
      if (err) {
        console.error('Error adding customer:', err);
        return res.status(500).send('Error adding customer');
      }
      connection.query('SELECT * FROM customers WHERE id = ?', [insertResult.insertId], (err, rows) => {
        if (err) {
          console.error('Error fetching customer:', err);
          return res.status(500).send('Error fetching customer');
        }
        res.status(201).json(rows[0]);
      });
    }
  );
});

// Update customer
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, customer_number, email } = req.body;
  if (!name || !customer_number) {
    return res.status(400).send('Name and Customer Number are required');
  }
  connection.query(
    'UPDATE customers SET name = ?, customer_number = ?, email = ? WHERE id = ?',
    [name, customer_number, email || null, id],
    (err, updateResult) => {
      if (err) {
        console.error('Error updating customer:', err);
        return res.status(500).send('Error updating customer');
      }
      if (updateResult.affectedRows === 0) {
        return res.status(404).send('Customer not found');
      }
      res.json({ id, name, customer_number, email });
    }
  );
});

// Delete customer
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM customers WHERE id = ?', [id], (err, deleteResult) => {
    if (err) {
      console.error('Error deleting customer:', err);
      return res.status(500).send('Error deleting customer');
    }
    if (deleteResult.affectedRows === 0) {
      return res.status(404).send('Customer not found');
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});


app.post('/api/customers', (req, res) => {
  const { name, customer_number, email } = req.body;
  
  // Validate required fields
  if (!name || !customer_number) {
    return res.status(400).send('Name and Customer Number are required');
  }
  
  connection.query(
    'INSERT INTO customers (name, customer_number, email) VALUES (?, ?, ?)',
    [name, customer_number, email || null],
    (err, insertResult) => {
      if (err) {
        console.error('Error adding customer:', err);
        return res.status(500).send('Error adding customer');
      }
      // Fetch the newly created customer record
      connection.query('SELECT * FROM customers WHERE id = ?', [insertResult.insertId], (err, rows) => {
        if (err) {
          console.error('Error fetching customer:', err);
          return res.status(500).send('Error fetching customer');
        }
        res.status(201).json(rows[0]);
      });
    }
  );
});


app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, customer_number, email } = req.body;
  
  // Validate required fields
  if (!name || !customer_number) {
    return res.status(400).send('Name and Customer Number are required');
  }
  
  connection.query(
    'UPDATE customers SET name = ?, customer_number = ?, email = ? WHERE id = ?',
    [name, customer_number, email || null, id],
    (err, updateResult) => {
      if (err) {
        console.error('Error updating customer:', err);
        return res.status(500).send('Error updating customer');
      }
      if (updateResult.affectedRows === 0) {
        return res.status(404).send('Customer not found');
      }
      res.json({ id, name, customer_number, email });
    }
  );
});


app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM customers WHERE id = ?', [id], (err, deleteResult) => {
    if (err) {
      console.error('Error deleting customer:', err);
      return res.status(500).send('Error deleting customer');
    }
    if (deleteResult.affectedRows === 0) return res.status(404).send('Customer not found');
    res.json({ message: 'Customer deleted successfully' });
  });
});

/* ---------- ORDERS API ---------- */
app.get('/api/orders', (req, res) => {
  connection.query(
    `SELECT 
       o.id AS order_id, 
       o.order_date, 
       o.order_value,
       c.name AS customer_name,
       c.id AS customer_id,
       CONCAT('[', GROUP_CONCAT(
         CONCAT(
           '{',
           '"product_id":', p.id, ',',
           '"name":"', p.name, '",',
           '"price":', p.price, ',',
           '"quantity":', oi.quantity,
           '}'
         )
       ), ']') AS products
     FROM orders o
     LEFT JOIN customers c ON o.customer_id = c.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     LEFT JOIN products p ON oi.product_id = p.id
     GROUP BY o.id`,
    (err, results) => {
      if (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).send('Error fetching orders');
      }
      const orders = results.map(row => ({
        id: row.order_id,
        order_date: row.order_date,
        order_value: row.order_value,
        customer_name: row.customer_name,
        customer_id: row.customer_id,
        products: row.products && row.products !== '[null]' ? JSON.parse(row.products) : []
      }));
      res.json(orders);
    }
  );
});

app.post('/api/orders', (req, res) => {
  // Expected request body: { customer_id, items: [{ product_id, quantity }, ...] }
  const { customer_id, items } = req.body;
  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send('Invalid order data');
  }

  // Insert order (order_value will be calculated later)
  connection.query(
    'INSERT INTO orders (customer_id) VALUES (?)',
    [customer_id],
    (err, orderResult) => {
      if (err) {
        console.error('Error creating order:', err);
        return res.status(500).send('Error creating order');
      }
      const orderId = orderResult.insertId;
      // Insert order items
      const orderItemsData = items.map(item => [orderId, item.product_id, item.quantity]);
      connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES ?',
        [orderItemsData],
        (err) => {
          if (err) {
            console.error('Error adding order items:', err);
            return res.status(500).send('Error adding order items');
          }
          // Calculate order_value
          connection.query(
            `UPDATE orders SET order_value = (
              SELECT SUM(p.price * oi.quantity)
              FROM order_items oi
              JOIN products p ON oi.product_id = p.id
              WHERE oi.order_id = ?
            ) WHERE id = ?`,
            [orderId, orderId],
            (err) => {
              if (err) {
                console.error('Error updating order value:', err);
                return res.status(500).send('Error updating order value');
              }
              // Return the created order details
              connection.query(
                `SELECT 
                   o.id AS order_id, 
                   o.order_date, 
                   o.order_value,
                   c.name AS customer_name,
                   c.id AS customer_id,
                   CONCAT('[', GROUP_CONCAT(
                     CONCAT(
                       '{',
                       '"product_id":', p.id, ',',
                       '"name":"', p.name, '",',
                       '"price":', p.price, ',',
                       '"quantity":', oi.quantity,
                       '}'
                     )
                   ), ']') AS products
                 FROM orders o
                 LEFT JOIN customers c ON o.customer_id = c.id
                 LEFT JOIN order_items oi ON o.id = oi.order_id
                 LEFT JOIN products p ON oi.product_id = p.id
                 WHERE o.id = ?
                 GROUP BY o.id`,
                [orderId],
                (err, rows) => {
                  if (err) {
                    console.error('Error fetching order:', err);
                    return res.status(500).send('Error fetching order');
                  }
                  res.status(201).json(rows[0]);
                }
              );
            }
          );
        }
      );
    }
  );
});

app.put('/api/orders/:id', (req, res) => {
  // Basic update implementation: update customer_id and order items
  const { id } = req.params;
  const { customer_id, items } = req.body;
  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send('Invalid order data');
  }

  // Update the order's customer_id
  connection.query(
    'UPDATE orders SET customer_id = ? WHERE id = ?',
    [customer_id, id],
    (err, result) => {
      if (err) {
        console.error('Error updating order:', err);
        return res.status(500).send('Error updating order');
      }
      if (result.affectedRows === 0) return res.status(404).send('Order not found');

      // Delete existing order items
      connection.query('DELETE FROM order_items WHERE order_id = ?', [id], (err) => {
        if (err) {
          console.error('Error deleting order items:', err);
          return res.status(500).send('Error deleting order items');
        }
        // Insert new order items
        const orderItemsData = items.map(item => [id, item.product_id, item.quantity]);
        connection.query(
          'INSERT INTO order_items (order_id, product_id, quantity) VALUES ?',
          [orderItemsData],
          (err) => {
            if (err) {
              console.error('Error adding order items:', err);
              return res.status(500).send('Error adding order items');
            }
            // Recalculate order_value
            connection.query(
              `UPDATE orders SET order_value = (
                SELECT SUM(p.price * oi.quantity)
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
              ) WHERE id = ?`,
              [id, id],
              (err) => {
                if (err) {
                  console.error('Error updating order value:', err);
                  return res.status(500).send('Error updating order value');
                }
                // Return updated order
                connection.query(
                  `SELECT 
                     o.id AS order_id, 
                     o.order_date, 
                     o.order_value,
                     c.name AS customer_name,
                     c.id AS customer_id,
                     CONCAT('[', GROUP_CONCAT(
                       CONCAT(
                         '{',
                         '"product_id":', p.id, ',',
                         '"name":"', p.name, '",',
                         '"price":', p.price, ',',
                         '"quantity":', oi.quantity,
                         '}'
                       )
                     ), ']') AS products
                   FROM orders o
                   LEFT JOIN customers c ON o.customer_id = c.id
                   LEFT JOIN order_items oi ON o.id = oi.order_id
                   LEFT JOIN products p ON oi.product_id = p.id
                   WHERE o.id = ?
                   GROUP BY o.id`,
                  [id],
                  (err, rows) => {
                    if (err) {
                      console.error('Error fetching order:', err);
                      return res.status(500).send('Error fetching order');
                    }
                    res.json(rows[0]);
                  }
                );
              }
            );
          }
        );
      });
    }
  );
});

app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  // Delete order items first, then the order
  connection.query('DELETE FROM order_items WHERE order_id = ?', [id], (err) => {
    if (err) {
      console.error('Error deleting order items:', err);
      return res.status(500).send('Error deleting order items');
    }
    connection.query('DELETE FROM orders WHERE id = ?', [id], (err, result) => {
      if (err) {
        console.error('Error deleting order:', err);
        return res.status(500).send('Error deleting order');
      }
      if (result.affectedRows === 0) return res.status(404).send('Order not found');
      res.json({ message: 'Order deleted successfully' });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

"use strict";

const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const cors = require('cors');
const bcrypt = require("bcrypt");
const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST, // or your MySQL host
  user: process.env.DB_USER,      // your MySQL username
  password: process.env.DB_PASSWORD, // your MySQL password
  database: process.env.DB_DATABASE,
  waitForConnections:true,
  connectionLimit:3,
  queueLimit:0,
});


// Connect to MySQL and create tables if they don't exist
pool.query('Select 1',(err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  } else {
    console.log('Connected to MySQL database');
  }

  // Create the users table
  pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    )`,
    (err) => {
      if (err) console.error("Error creating users table:", err);
      else console.log("Users table is ready");
    }
  );

  // Products table (with user_id)
  pool.query(
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      quantity INT DEFAULT 0,
      price DECIMAL(10,2) NOT NULL,
      category_id INT DEFAULT NULL,
      user_id INT NOT NULL
    )`,
    (err) => {
      if (err) console.error("Error creating products table:", err);
      else console.log("Products table is ready");
    }
  );

  // Create Categories Table (with user_id)
  pool.query(
    `CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      product_ids VARCHAR(255),
      user_id INT NOT NULL
    )`,
    (err) => {
      if (err) console.error("Error creating categories table:", err);
      else console.log("Categories table is ready");
    }
  );

 // Create Customers Table (with user_id)
 pool.query(
  `CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    customer_number VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    user_id INT NOT NULL
  )`,
  (err) => {
    if (err) console.error("Error creating customers table:", err);
    else console.log("Customers table is ready");
  }
);


  // Create Orders Table (with user_id)
  pool.query(
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_id INT,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      order_value DECIMAL(10,2),
      user_id INT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,
    (err) => {
      if (err) console.error("Error creating orders table:", err);
      else console.log("Orders table is ready");
    }
  );

  // Create Order_items Table (with user_id)
  pool.query(
    `CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      product_id INT,
      quantity INT,
      user_id INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    (err) => {
      if (err) console.error("Error creating order_items table:", err);
      else console.log("Order_items table is ready");
    }
  );
});

/* --------------------
   AUTHENTICATION ENDPOINTS
-------------------- */

// Signup Endpoint
app.post("/api/signup", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Username and password are required." });
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error("Error hashing password:", err);
      return res
        .status(500)
        .json({ success: false, message: "Server error." });
    }
    pool.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hash],
      (err, result) => {
        if (err) {
          console.error("Error inserting user:", err);
          return res
            .status(500)
            .json({ success: false, message: "Signup failed." });
        }
        res.json({ success: true, user: { id: result.insertId, username } });
      }
    );
  });
});

// Login Endpoint
app.post("/api/login", (req, res) => {
  let { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: "Username and password are required." });
  }
  username = username.trim();
  password = password.trim();

  pool.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, results) => {
      if (err) {
        console.error("Error fetching user:", err);
        return res.status(500).json({ success: false, message: "Login failed." });
      }
      if (results.length === 0) {
        console.error("No user found for username:", username);
        return res.status(400).json({ success: false, message: "Invalid credentials." });
      }
      const user = results[0];
      bcrypt.compare(password, user.password, (err, match) => {
        if (err) {
          console.error("Error comparing password:", err);
          return res.status(500).json({ success: false, message: "Login failed." });
        }
        if (!match) {
          console.error("Password mismatch for user:", username);
          return res.status(400).json({ success: false, message: "Invalid credentials." });
        }
        res.json({ success: true, user: { id: user.id, username: user.username } });
      });
    }
  );
});

// Helper function to renumber products (if desired)
function renumberProducts(callback) {
  pool.query('SET @count = 0', (err) => {
    if (err) return callback(err);
    pool.query('UPDATE products SET id = (@count:=@count + 1) ORDER BY id', (err) => {
      if (err) return callback(err);
      pool.query('ALTER TABLE products AUTO_INCREMENT = 1', callback);
    });
  });
}

// Middleware to require user identification in header (x-user-id)
function requireUser(req, res, next) {
  const userId = req.headers["x-user-id"];
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required in header (x-user-id).",
    });
  }
  req.userId = userId;
  next();
}

/* ---------- PRODUCTS API ---------- */
app.get('/api/products', requireUser, (req, res) => {
  const userId = req.userId;
  pool.query(
    `SELECT p.*, c.name AS category_name 
     FROM products p 
     LEFT JOIN categories c ON p.category_id = c.id WHERE p.user_id = ?`,[userId],
    (err, results) => {
      if (err) {
        console.error('Error fetching products:', err);
        return res.status(500).send('Error fetching products');
      }
      res.json(results);
    }
  );
});

app.post('/api/products', requireUser, (req, res) => {
  const userId = req.userId;
  const { name, quantity, price, category_id } = req.body;
  if (isNaN(price)) return res.status(400).send('Price must be a valid number');
  pool.query(
    'INSERT INTO products (name, quantity, price, category_id, user_id) VALUES (?, ?, ?, ?, ?)',
    [name, quantity, price, category_id || null, userId],
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
        pool.query(
          'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.user_id = ? ORDER BY p.id DESC LIMIT 1',[userId],
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

app.put('/api/products/:id', requireUser,(req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { name, quantity, price, category_id } = req.body;
  pool.query(
    'UPDATE products SET name = ?, quantity = ?, price = ?, category_id = ? WHERE id = ? AND user_id = ?',
    [name, quantity, price, category_id || null, id, userId],
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

// DELETE product endpoint with dependent order_items deletion
app.delete('/api/products/:id', requireUser, (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  // First, delete any order_items referencing this product for this user
  pool.query(
    'DELETE FROM order_items WHERE product_id = ? AND user_id = ?',
    [id, userId],
    (err, orderItemsResult) => {
      if (err) {
        console.error('Error deleting order items for product:', err);
        return res.status(500).send('Error deleting order items for product');
      }

      // Now, delete the product itself
      pool.query(
        'DELETE FROM products WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, productResult) => {
          if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).send('Error deleting product');
          }
          if (productResult.affectedRows === 0) {
            return res.status(404).send('Product not found');
          }
          
          // Optionally, renumber the products if desired
          renumberProducts((err) => {
            if (err) {
              console.error('Error renumbering products:', err);
              return res.status(500).send('Error renumbering products');
            }
            res.json({ message: 'Product and associated order items deleted successfully' });
          });
        }
      );
    }
  );
});

/* ---------- CATEGORIES API ---------- */
app.get('/api/categories', requireUser, (req, res) => {
  const userId = req.userId;
  pool.query(
    `SELECT 
       c.id AS category_id, 
       c.name AS category_name, 
       c.description, 
       IFNULL(
         CONCAT('[', GROUP_CONCAT(
           CONCAT(
             '{"id":', p.id, ',"name":"', p.name, '","price":', p.price, ',"quantity":', p.quantity, '}'
           )
         ), ']'),
         '[]'
       ) AS products
     FROM categories c
     LEFT JOIN products p ON c.id = p.category_id AND p.user_id = ? WHERE c.user_id = ?
     GROUP BY c.id`,
     [userId, userId],
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

app.post('/api/categories', requireUser, (req, res) => {
  const userId = req.userId;
  const { name, description, product_ids } = req.body;
  pool.query(
    'INSERT INTO categories (name, description, product_ids, user_id) VALUES (?, ?, ?, ?)',
    [name, description, product_ids, userId],
    (err, insertResult) => {
      if (err) {
        console.error('Error adding category:', err);
        return res.status(500).send('Error adding category');
      }
      pool.query('SELECT * FROM categories WHERE id = ? AND user_id = ?', [insertResult.insertId], (err, rows) => {
        if (err) {
          console.error('Error fetching category:', err);
          return res.status(500).send('Error fetching category');
        }
        res.status(201).json(rows[0]);
      });
    }
  );
});

app.put('/api/categories/:id', requireUser, (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { name, description, product_ids } = req.body;
  pool.query(
    'UPDATE categories SET name = ?, description = ?, product_ids = ? WHERE id = ? AND user_id = ?',
    [name, description, product_ids, id, userId],
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

app.delete('/api/categories/:id',  requireUser, (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  pool.query('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, userId], (err, deleteResult) => {
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
app.get('/api/customers', requireUser, (req, res) => {
  const userId = req.userId;
  pool.query(
    `SELECT 
       cu.id,
       cu.name,
       cu.customer_number,
       cu.email,
       (SELECT GROUP_CONCAT(o.id) FROM orders o WHERE o.customer_id = cu.id AND o.user_id = ?) AS orders
     FROM customers cu WHERE cu.user_id = ?`, [userId, userId],
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
app.post("/api/customers", requireUser, (req, res) => {
  const userId = req.userId;
  const { name, customer_number, email } = req.body;
  if (!name || !customer_number) {
    return res.status(400).send("Name and Customer Number are required");
  }
  pool.query(
    "INSERT INTO customers (name, customer_number, email, user_id) VALUES (?, ?, ?, ?)",
    [name, customer_number, email || null, userId],
    (err, insertResult) => {
      if (err) {
        console.error("Error adding customer:", err);
        return res.status(500).send("Error adding customer");
      }
      pool.query(
        "SELECT * FROM customers WHERE id = ? AND user_id = ?",
        [insertResult.insertId, userId],
        (err, rows) => {
          if (err) {
            console.error("Error fetching customer:", err);
            return res.status(500).send("Error fetching customer");
          }
          res.status(201).json(rows[0]);
        }
      );
    }
  );
});

// Update customer
app.put("/api/customers/:id", requireUser, (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { name, customer_number, email } = req.body;
  if (!name || !customer_number) {
    return res.status(400).send("Name and Customer Number are required");
  }
  pool.query(
    "UPDATE customers SET name = ?, customer_number = ?, email = ? WHERE id = ? AND user_id = ?",
    [name, customer_number, email || null, id, userId],
    (err, updateResult) => {
      if (err) {
        console.error("Error updating customer:", err);
        return res.status(500).send("Error updating customer");
      }
      if (updateResult.affectedRows === 0) {
        return res.status(404).send("Customer not found");
      }
      res.json({ id, name, customer_number, email });
    }
  );
});

// Delete customer
app.delete("/api/customers/:id", requireUser, (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  pool.query(
    "DELETE FROM customers WHERE id = ? AND user_id = ?",
    [id, userId],
    (err, deleteResult) => {
      if (err) {
        console.error("Error deleting customer:", err);
        return res.status(500).send("Error deleting customer");
      }
      if (deleteResult.affectedRows === 0)
        return res.status(404).send("Customer not found");
      res.json({ message: "Customer deleted successfully" });
    }
  );
});

/* ---------- ORDERS API ---------- */
app.get("/api/orders", requireUser, (req, res) => {
  const userId = req.userId;
  pool.query(
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
     WHERE o.user_id = ?
     GROUP BY o.id`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error fetching orders:", err);
        return res.status(500).send("Error fetching orders");
      }
      const orders = results.map((row) => ({
        id: row.order_id,
        order_date: row.order_date,
        order_value: row.order_value,
        customer_name: row.customer_name,
        customer_id: row.customer_id,
        products:
          row.products && row.products !== "[null]" ? JSON.parse(row.products) : [],
      }));
      res.json(orders);
    }
  );
});

app.post("/api/orders", requireUser, (req, res) => {
  const userId = req.userId;
  const { customer_id, items } = req.body;
  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send("Invalid order data");
  }
  pool.query(
    "INSERT INTO orders (customer_id, user_id) VALUES (?, ?)",
    [customer_id, userId],
    (err, orderResult) => {
      if (err) {
        console.error("Error creating order:", err);
        return res.status(500).send("Error creating order");
      }
      const orderId = orderResult.insertId;
      const orderItemsData = items.map((item) => [orderId, item.product_id, item.quantity, userId]);
      pool.query(
        "INSERT INTO order_items (order_id, product_id, quantity, user_id) VALUES ?",
        [orderItemsData],
        (err) => {
          if (err) {
            console.error("Error adding order items:", err);
            return res.status(500).send("Error adding order items");
          }
          pool.query(
            `UPDATE orders SET order_value = (
              SELECT SUM(p.price * oi.quantity)
              FROM order_items oi
              JOIN products p ON oi.product_id = p.id
              WHERE oi.order_id = ?
            ) WHERE id = ?`,
            [orderId, orderId],
            (err) => {
              if (err) {
                console.error("Error updating order value:", err);
                return res.status(500).send("Error updating order value");
              }
              pool.query(
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
                 WHERE o.id = ? AND o.user_id = ?
                 GROUP BY o.id`,
                [orderId, userId],
                (err, rows) => {
                  if (err) {
                    console.error("Error fetching order:", err);
                    return res.status(500).send("Error fetching order");
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

app.put("/api/orders/:id", requireUser, (req, res) => {
  // Basic update implementation: update customer_id and order items
  const userId = req.userId;
  const { id } = req.params;
  const { customer_id, items } = req.body;
  if (!customer_id || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).send("Invalid order data");
  }
  pool.query(
    "UPDATE orders SET customer_id = ? WHERE id = ? AND user_id = ?",
    [customer_id, id, userId],
    (err, result) => {
      if (err) {
        console.error("Error updating order:", err);
        return res.status(500).send("Error updating order");
      }
      if (result.affectedRows === 0) return res.status(404).send("Order not found");
      pool.query("DELETE FROM order_items WHERE order_id = ? AND user_id = ?", [id, userId], (err) => {
        if (err) {
          console.error("Error deleting order items:", err);
          return res.status(500).send("Error deleting order items");
        }
        const orderItemsData = items.map((item) => [id, item.product_id, item.quantity, userId]);
        pool.query(
          "INSERT INTO order_items (order_id, product_id, quantity, user_id) VALUES ?",
          [orderItemsData],
          (err) => {
            if (err) {
              console.error("Error adding order items:", err);
              return res.status(500).send("Error adding order items");
            }
            pool.query(
              `UPDATE orders SET order_value = (
                SELECT SUM(p.price * oi.quantity)
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = ?
              ) WHERE id = ?`,
              [id, id],
              (err) => {
                if (err) {
                  console.error("Error updating order value:", err);
                  return res.status(500).send("Error updating order value");
                }
                pool.query(
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
                   WHERE o.id = ? AND o.user_id = ?
                   GROUP BY o.id`,
                  [id, userId],
                  (err, rows) => {
                    if (err) {
                      console.error("Error fetching order:", err);
                      return res.status(500).send("Error fetching order");
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

app.delete("/api/orders/:id", requireUser, (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  pool.query("DELETE FROM order_items WHERE order_id = ? AND user_id = ?", [id, userId], (err) => {
    if (err) {
      console.error("Error deleting order items:", err);
      return res.status(500).send("Error deleting order items");
    }
    pool.query("DELETE FROM orders WHERE id = ? AND user_id = ?", [id, userId], (err, result) => {
      if (err) {
        console.error("Error deleting order:", err);
        return res.status(500).send("Error deleting order");
      }
      if (result.affectedRows === 0) return res.status(404).send("Order not found");
      res.json({ message: "Order deleted successfully" });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

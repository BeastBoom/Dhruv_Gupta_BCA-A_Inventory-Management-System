// ===============================
// Global UI Toggles (Sidebar & Theme)
// ===============================
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const mainContent = document.getElementById('main-content');

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('expanded');
  mainContent.classList.toggle('expanded');
});

const themeToggle = document.getElementById('theme-toggle');
const body = document.body;
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    themeToggle.textContent = body.classList.contains('dark-theme') ? '☀️' : '🌙';
  });
}

// ===============================
// Overview Dashboard Functions (using Chart.js)
// ===============================

// Update Overview Metrics and Render Charts
function updateDashboard() {
  Promise.all([
    fetchTotalStock(),
    fetchTotalCustomers(),
    fetchTotalSales(),
    fetchTotalCategories()
  ])
    .then(([stock, customerCount, sales, categoryCount]) => {
      // Update metric elements
      document.getElementById('stock-value').textContent = stock;
      document.getElementById('customer-value').textContent = customerCount;
      document.getElementById('sales-value').textContent = `$${sales.toFixed(2)}`;
      document.getElementById('category-value').textContent = categoryCount;

      // Render charts
      renderChart1(); // Bar chart for Product Stock
      renderChart2(); // Pie chart for Customer distribution (dummy or calculated)
      renderChart3(); // Line chart for Sales Over Time
      renderChart4(); // Doughnut chart for Category distribution
    })
    .catch(err => {
      console.error('Error updating dashboard metrics:', err);
    });
}

// Fetch total stock from products API (sum of quantity)
function fetchTotalStock() {
  return fetch('https://inventory-management-system-xtb4.onrender.com/api/products')
    .then(res => res.json())
    .then(products => products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0));
}

// Fetch total customers (count)
function fetchTotalCustomers() {
  return fetch('https://inventory-management-system-xtb4.onrender.com/api/customers')
    .then(res => res.json())
    .then(customers => customers.length);
}

// Fetch total sales (sum of order_value)
function fetchTotalSales() {
  return fetch('https://inventory-management-system-xtb4.onrender.com/api/orders')
    .then(res => res.json())
    .then(orders => orders.reduce((sum, order) => sum + (parseFloat(order.order_value) || 0), 0));
}

// Fetch total categories (count)
function fetchTotalCategories() {
  return fetch('https://inventory-management-system-xtb4.onrender.com/api/categories')
    .then(res => res.json())
    .then(categories => categories.length);
}

// ------------------------------
// Chart Rendering Functions using Chart.js
// ------------------------------

function renderChart1() {
  // Bar chart for Product Stock Levels
  fetch('https://inventory-management-system-xtb4.onrender.com/api/products')
    .then(res => res.json())
    .then(products => {
      const labels = products.map(p => p.name);
      const data = products.map(p => parseInt(p.quantity) || 0);
      const ctx = document.getElementById('chart1').getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Stock Quantity',
            data: data,
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    })
    .catch(err => console.error('Error rendering Chart 1:', err));
}

function renderChart2() {
  // Pie chart for Customer Distribution (dummy data example)
  fetch('https://inventory-management-system-xtb4.onrender.com/api/customers')
    .then(res => res.json())
    .then(customers => {
      const labels = customers.map(c => c.name);
      // Example: random data or you can use number of orders if available
      const data = customers.map(() => Math.floor(Math.random() * 10) + 1);
      const ctx = document.getElementById('chart2').getContext('2d');
      new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            label: 'Customer Distribution',
            data: data,
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    })
    .catch(err => console.error('Error rendering Chart 2:', err));
}

function renderChart3() {
  // Line chart for Sales Over Time
  fetch('https://inventory-management-system-xtb4.onrender.com/api/orders')
    .then(res => res.json())
    .then(orders => {
      const salesByDate = {};
      orders.forEach(order => {
        const date = new Date(order.order_date).toISOString().split('T')[0];
        salesByDate[date] = (salesByDate[date] || 0) + (parseFloat(order.order_value) || 0);
      });
      const labels = Object.keys(salesByDate).sort();
      const data = labels.map(date => salesByDate[date]);
      const ctx = document.getElementById('chart3').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Sales Over Time',
            data: data,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    })
    .catch(err => console.error('Error rendering Chart 3:', err));
}

function renderChart4() {
  // Doughnut chart for Categories Distribution (count of products per category)
  fetch('https://inventory-management-system-xtb4.onrender.com/api/categories')
    .then(res => res.json())
    .then(categories => {
      const labels = categories.map(c => c.name);
      // Count products per category, or default to 0 if products is empty
      const data = categories.map(c => (c.products && c.products.length) || 0);
      const ctx = document.getElementById('chart4').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            label: 'Categories Distribution',
            data: data,
            backgroundColor: [
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 99, 132, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    })
    .catch(err => console.error('Error rendering Chart 4:', err));
}

// Call updateDashboard to update metrics and render charts on load
updateDashboard();

// ===============================
// Existing Product Management Code (Add/Edit/Delete)
// ===============================
let editingRow = null;

async function fetchProducts() {
  try {
    const response = await fetch('https://inventory-management-system-xtb4.onrender.com/api/products');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const products = await response.json();
    populateTable(products);
  } catch (error) {
    console.error('Error fetching products:', error);
  }
}

function populateTable(products) {
  const tableBody = document.getElementById('productTableBody');
  if (!tableBody) {
    console.error('No table body element found with id "productTableBody"');
    return;
  }
  tableBody.innerHTML = products.map(product => `
      <tr data-id="${product.id}" data-category-id="${product.category_id || ''}">
          <td>${product.name}</td>
          <td>${product.quantity}</td>
          <td>$${parseFloat(product.price).toFixed(2)}</td>
          <td>${product.category_name || 'None'}</td>
          <td>
              <button class="btn btn-edit" onclick="openEditModal(this)">Edit</button>
              <button class="btn btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
          </td>
      </tr>
  `).join('');
}

window.openEditModal = function(button) {
  const row = button.closest('tr');
  const cells = row.cells;
  document.getElementById('productName').value = cells[0].textContent;
  document.getElementById('quantity').value = cells[1].textContent;
  document.getElementById('price').value = cells[2].textContent.replace('$', '');
  const categoryDropdown = document.getElementById('categorySelect');
  categoryDropdown.value = row.dataset.categoryId || '';
  document.getElementById('modalTitle').textContent = 'Edit Product';
  editingRow = row;
  document.getElementById('productModal').style.display = 'block';
  fetchCategories();
};

window.deleteProduct = async function(productId) {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      const response = await fetch(`https://inventory-management-system-xtb4.onrender.com/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const row = document.querySelector(`tr[data-id="${productId}"]`);
        if (row) row.remove();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }
};

document.getElementById("productForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  
  const productName = document.getElementById("productName").value;
  const quantity = document.getElementById("quantity").value;
  let price = document.getElementById("price").value;
  const categoryId = document.getElementById("categorySelect").value;
  
  price = parseFloat(price);
  if (isNaN(price)) {
    alert("Please enter a valid price.");
    return;
  }
  
  const product = {
    name: productName,
    quantity: quantity,
    price: price,
    category_id: categoryId || null
  };
  
  if (editingRow) {
    try {
      const response = await fetch(`https://inventory-management-system-xtb4.onrender.com/api/products/${editingRow.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await response.json();
      editingRow.cells[0].textContent = data.name;
      editingRow.cells[1].textContent = data.quantity;
      editingRow.cells[2].textContent = `$${data.price.toFixed(2)}`;
      editingRow.cells[3].textContent = data.category_name || 'None';
      closeProductModal();
    } catch (error) {
      console.error("Error updating product:", error);
    }
  } else {
    try {
      const response = await fetch("https://inventory-management-system-xtb4.onrender.com/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      await response.json();
      fetchProducts();
      closeProductModal();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  }
});

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  editingRow = null;
}

// Attach functions to global window object for HTML onclick handlers
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.openOrderEditModal = openOrderEditModal;
window.deleteOrder = deleteOrder;

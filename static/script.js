"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Global UI Toggles
  initializeUIToggles();

  // If dashboard metrics exist, update dashboard (index.html)
  if (document.getElementById("stock-value")) {
    updateDashboard();
  }
  
  // If product management table exists, fetch products (products.html)
  if (document.getElementById("productTableBody")) {
    fetchProducts();
  }
});

// ------------------------------
// Global UI Toggles (Sidebar & Theme)
// ------------------------------
function initializeUIToggles() {
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menu-toggle");
  const mainContent = document.getElementById("main-content");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("expanded");
      mainContent.classList.toggle("expanded");
    });
  }
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;
  // Session Storage
  if (sessionStorage.getItem("darkTheme")==="true"){
    body.classList.add("dark-theme");
    if (themeToggle) {
      themeToggle.textContent = "☀️";
    }
  }
  
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-theme");
      sessionStorage.setItem("darkTheme",body.classList.contains("dark-theme"));
      themeToggle.textContent = body.classList.contains("dark-theme") ? "☀️" : "🌙";
    });
  }
}

// ------------------------------
// Global Chart Instances
// ------------------------------
let chart1Instance = null;
let chart2Instance = null;
let chart3Instance = null;
let chart4Instance = null;

// ------------------------------
// Dashboard Functions (Chart.js Integration)
// ------------------------------
function fetchTotalStock() {
  return fetch("https://inventory-management-system-xtb4.onrender.com/api/products", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => res.json())
    .then((products) => products.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0));
}

function fetchTotalCustomers() {
  return fetch("https://inventory-management-system-xtb4.onrender.com/api/customers", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => res.json())
    .then((customers) => customers.length);
}

function fetchTotalSales() {
  return fetch("https://inventory-management-system-xtb4.onrender.com/api/orders", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => res.json())
    .then((orders) => orders.reduce((sum, o) => sum + (parseFloat(o.order_value) || 0), 0));
}

function fetchTotalCategories() {
  return fetch("https://inventory-management-system-xtb4.onrender.com/api/categories", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => res.json())
    .then((categories) => categories.length);
}

function renderChart1() {
  const canvas = document.getElementById("chart1");
  if (!canvas) {
    console.error("Chart1 canvas not found");
    return;
  }
  if (chart1Instance) {
    chart1Instance.destroy();
  }
  fetch("https://inventory-management-system-xtb4.onrender.com/api/products", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => res.json())
    .then((products) => {
      const labels = products.map((p) => p.name);
      const data = products.map((p) => parseInt(p.quantity) || 0);
      const ctx = canvas.getContext("2d");
      chart1Instance = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Stock Quantity",
              data: data,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            xAxes: [
              {
                ticks: {
                  display: false,
                },
                gridlines: {
                  display: false,
                },
              },
            ],
            yAxes: [
              {
                ticks: {
                  beginAtZero: true,
                },
              },
            ],
          },
        },
      });
    })
    .catch((err) => console.error("Error rendering Chart 1:", err));
}

function renderChart2() {
  const canvas = document.getElementById("chart2");
  if (!canvas) {
    console.error("Chart2 canvas not found");
    return;
  }
  if (chart2Instance) {
    chart2Instance.destroy();
  }
  fetch("https://inventory-management-system-xtb4.onrender.com/api/customers", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => res.json())
    .then((customers) => {
      const labels = customers.map((c) => c.name);
      const data = customers.map(() => Math.floor(Math.random() * 10) + 1); // Replace with real data if available
      const ctx = canvas.getContext("2d");
      chart2Instance = new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Customer Distribution",
              data: data,
              backgroundColor: [
                "rgba(255, 99, 132, 0.6)",
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
        },
      });
    })
    .catch((err) => console.error("Error rendering Chart 2:", err));
}

function renderChart3() {
  const canvas = document.getElementById("chart3");
  if (!canvas) {
    console.error("Chart3 canvas not found");
    return;
  }
  if (chart3Instance) {
    chart3Instance.destroy();
  }
  fetch("https://inventory-management-system-xtb4.onrender.com/api/orders", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => res.json())
    .then((orders) => {
      const salesByDate = {};
      orders.forEach((order) => {
        const date = new Date(order.order_date).toISOString().split("T")[0];
        salesByDate[date] = (salesByDate[date] || 0) + (parseFloat(order.order_value) || 0);
      });
      const labels = Object.keys(salesByDate).sort();
      const data = labels.map((date) => salesByDate[date]);
      const ctx = canvas.getContext("2d");
      chart3Instance = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Sales Over Time",
              data: data,
              borderColor: "rgba(255, 99, 132, 1)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
        },
      });
    })
    .catch((err) => console.error("Error rendering Chart 3:", err));
}

function renderChart4() {
  const canvas = document.getElementById("chart4");
  if (!canvas) {
    console.error("Chart4 canvas not found");
    return;
  }
  if (chart4Instance) {
    chart4Instance.destroy();
  }
  fetch("https://inventory-management-system-xtb4.onrender.com/api/categories", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => res.json())
    .then((categories) => {
      const labels = categories.map((c) => c.name);
      const data = categories.map((c) => (c.products && c.products.length) || 0);
      const ctx = canvas.getContext("2d");
      chart4Instance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Categories Distribution",
              data: data,
              backgroundColor: [
                "rgba(54, 162, 235, 0.6)",
                "rgba(255, 99, 132, 0.6)",
                "rgba(255, 206, 86, 0.6)",
                "rgba(75, 192, 192, 0.6)",
                "rgba(153, 102, 255, 0.6)",
                "rgba(255, 159, 64, 0.6)",
              ],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
        },
      });
    })
    .catch((err) => console.error("Error rendering Chart 4:", err));
}

function updateDashboard() {
  Promise.all([
    fetchTotalStock(),
    fetchTotalCustomers(),
    fetchTotalSales(),
    fetchTotalCategories(),
  ])
    .then(([stock, customerCount, sales, categoryCount]) => {
      const stockEl = document.getElementById("stock-value");
      const customerEl = document.getElementById("customer-value");
      const salesEl = document.getElementById("sales-value");
      const categoryEl = document.getElementById("category-value");
      if (stockEl) stockEl.textContent = stock;
      if (customerEl) customerEl.textContent = customerCount;
      if (salesEl) salesEl.textContent = `$${sales.toFixed(2)}`;
      if (categoryEl) categoryEl.textContent = categoryCount;
      // Render charts after updating metrics
      renderChart1();
      renderChart2();
      renderChart3();
      renderChart4();
    })
    .catch((err) => console.error("Error updating dashboard:", err));
}

// ===============================
// Product Management Functions
// ===============================

// Declare global variable for the row being edited
let editingRowProd = null;

// Fetch products and populate the product table
function fetchProducts() {
  fetch("https://inventory-management-system-xtb4.onrender.com/api/products", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then((products) => {
      populateTable(products);
    })
    .catch((error) => console.error("Error fetching products:", error));
}

// Populate the products table
function populateTable(products) {
  const tableBody = document.getElementById("productTableBody");
  if (!tableBody) {
    console.error('No table body element found with id "productTableBody"');
    return;
  }
  tableBody.innerHTML = products.map(product => `
      <tr data-id="${product.id}" data-category-id="${product.category_id || ''}">
          <td>${product.name}</td>
          <td>${product.quantity}</td>
          <td>$${parseFloat(product.price).toFixed(2)}</td>
          <td>${product.category_name || "None"}</td>
          <td>
              <button class="btn btn-edit" onclick="openEditModal(this)">Edit</button>
              <button class="btn btn-delete" onclick="deleteProduct('${product.id}')">Delete</button>
              <button class="btn btn-history" onclick="showProductHistory('${product.id}')">
                <i class="fas fa-history"></i>
              </button>
          </td>
      </tr>
  `).join('');
}

function showProductHistory(productId) {
  fetch(`https://inventory-management-system-xtb4.onrender.com/api/products/${productId}/history`, {
    headers: {
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    }
  })
    .then(res => {
      if (!res.ok) {
        return res.text().then(text => { throw new Error(text || res.status); });
      }
      return res.json();
    })
    .then(data => {
      if (data.success) {
        let historyText = "Product History:\n\n";
        if (!data.history.length) {
          historyText += "No history available for this product.";
        } else {
          data.history.forEach(record => {
            const dateStr = new Date(record.changed_at).toLocaleString();
            historyText += `${dateStr}: [${record.change_type}] ${record.change_details}\n\n`;
          });
        }
        alert(historyText);
      } else {
        alert("Failed to fetch product history: " + data.message);
      }
    })
    .catch(err => {
      console.error("Error fetching product history:", err);
      alert("Error fetching product history: " + err.message);
    });
}


// Fetch categories and populate the category dropdown
function fetchCategories() {
  return fetch("https://inventory-management-system-xtb4.onrender.com/api/categories", {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then((res) => res.json())
    .then((categories) => {
      const categoryDropdown = document.getElementById("categorySelect");
      if (categoryDropdown) {
        categoryDropdown.innerHTML = '<option value="">Select Category</option>';
        categories.forEach((category) => {
          const option = document.createElement("option");
          option.value = category.id;
          option.textContent = category.name;
          categoryDropdown.appendChild(option);
        });
      }
      return categories;
    })
    .catch((err) => console.error("Error fetching categories:", err));
}

// Function to open the product modal for adding a new product
function openProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.style.display = "block";
    document.getElementById("productForm").reset();
    editingRowProd = null;
    // Load categories into the dropdown
    fetchCategories();
  }
}
window.openProductModal = openProductModal; // Attach globally

// Function to open the product modal for editing an existing product
function openEditModal(button) {
  const row = button.closest("tr");
  if (!row) return;
  
  editingRowProd = row; // Set the global editing row

  // Populate modal fields with current row values
  const cells = row.cells;
  document.getElementById("productName").value = cells[0].textContent;
  document.getElementById("quantity").value = cells[1].textContent;
  document.getElementById("price").value = cells[2].textContent.replace("$", "");
  
  const categoryDropdown = document.getElementById("categorySelect");
  // Set the dropdown value to the category id stored in data attribute
  categoryDropdown.value = row.dataset.categoryId || "";
  
  document.getElementById("modalTitle").textContent = "Edit Product";
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.style.display = "block";
    // Load categories so the dropdown is updated
    fetchCategories();
  }
}
window.openEditModal = openEditModal; // Attach globally

// Function to close the product modal
function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.style.display = "none";
  }
  editingRowProd = null;
}
window.closeProductModal = closeProductModal; // Attach globally

// Function to delete a product
async function deleteProduct(productId) {
  if (confirm("Are you sure you want to delete this product?")) {
    try {
      const response = await fetch(`https://inventory-management-system-xtb4.onrender.com/api/products/${productId}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "x-user-id": sessionStorage.getItem("userId")
        },
      });
      if (response.ok) {
        const row = document.querySelector(`tr[data-id="${productId}"]`);
        if (row) row.remove();
      } else {
        console.error(`Error deleting product: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  }
}
window.deleteProduct = deleteProduct; // Attach globally

// Handle form submission for adding/editing a product
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
  
  const product = { name: productName, quantity, price, category_id: categoryId || null };
  
  if (editingRowProd) {
    try {
      const response = await fetch(`https://inventory-management-system-xtb4.onrender.com/api/products/${editingRowProd.dataset.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      const data = await response.json();
      editingRowProd.cells[0].textContent = data.name;
      editingRowProd.cells[1].textContent = data.quantity;
      editingRowProd.cells[2].textContent = `$${data.price.toFixed(2)}`;
      editingRowProd.cells[3].textContent = data.category_name || "None";
      closeProductModal(); // This call closes the modal
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product: " + error.message);
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
      closeProductModal(); // Close modal after creation
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product: " + error.message);
    }
  }
});


// Attach global functions for inline HTML event handlers
window.openEditModal = openEditModal;
window.deleteProduct = deleteProduct;

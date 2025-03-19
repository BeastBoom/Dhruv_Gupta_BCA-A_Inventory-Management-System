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


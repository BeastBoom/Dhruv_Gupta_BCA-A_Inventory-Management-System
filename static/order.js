// ------------------------------
// Global UI Toggles (Sidebar & Theme)
// ------------------------------
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const mainContent = document.getElementById('main-content');

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('expanded');
  mainContent.classList.toggle('expanded');
});

document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const themeToggle = document.getElementById("theme-toggle");

  // Check sessionStorage for dark mode preference
  if (sessionStorage.getItem("darkTheme") === "true") {
    body.classList.add("dark-theme");
    if (themeToggle) {
      themeToggle.textContent = "☀️"; // Show light icon when dark mode is active
    }
  }

  // Set up the theme toggle button if it exists
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      body.classList.toggle("dark-theme");
      // Save the current state in sessionStorage
      sessionStorage.setItem("darkTheme", body.classList.contains("dark-theme"));
      // Update the toggle button icon accordingly
      themeToggle.textContent = body.classList.contains("dark-theme") ? "☀️" : "🌙";
    });
  }
});


// ------------------------------
// Orders Page Logic
// ------------------------------
let editingOrder = null;

// When the page loads, fetch orders
document.addEventListener('DOMContentLoaded', () => {
  fetchOrders();
});

// Fetch orders from the API and populate the orders table
function fetchOrders() {
  fetch('https://inventory-management-system-xtb4.onrender.com/api/orders', {
    headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
  })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(orders => {
      populateOrdersTable(orders);
    })
    .catch(error => console.error('Error fetching orders:', error));
}

// Populate orders table and store extra order data in data attributes
function populateOrdersTable(orders) {
  const tableBody = document.getElementById('ordersTableBody');
  if (!tableBody) {
    console.error('No table body element found with id "ordersTableBody"');
    return;
  }
  tableBody.innerHTML = orders.map(order => {
    // Format the order date to YYYY-MM-DD
    const formattedDate = new Date(order.order_date).toISOString().split('T')[0];
    // Convert the products array to a JSON string for storing in a data attribute
    const productsJSON = JSON.stringify(order.products || []);
    return `
      <tr data-id="${order.id}" 
          data-customer-id="${order.customer_id || ''}" 
          data-order-date="${order.order_date}" 
          data-products='${productsJSON}'>
        <td>${order.id}</td>
        <td>${order.customer_name || 'N/A'}</td>
        <td>${formattedDate}</td>
        <td>$${order.order_value ? parseFloat(order.order_value).toFixed(2) : '0.00'}</td>
        <td>
          ${order.products && order.products.length > 0 
            ? order.products.map(prod => `<p>${prod.name} (x${prod.quantity})</p>`).join('')
            : 'No products'}
        </td>
        <td>
          <button class="btn btn-edit" onclick="openOrderEditModal(this)">Edit</button>
          <button class="btn btn-delete" onclick="deleteOrder(${order.id})">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ------------------------------
// Modal Data Loading Functions
// ------------------------------

// Load customers for the order modal
async function loadCustomersForOrder() {
  try {
    const response = await fetch('https://inventory-management-system-xtb4.onrender.com/api/customers', {
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": sessionStorage.getItem("userId")
      },
    });
    if (!response.ok) throw new Error('Failed to fetch customers');
    const customers = await response.json();
    const customerSelect = document.getElementById('orderCustomerSelect');
    customerSelect.innerHTML = '<option value="">Select Customer</option>';
    customers.forEach(cust => {
      const option = document.createElement('option');
      option.value = cust.id;
      option.textContent = cust.name;
      customerSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
  }
}

// Load products for the order modal (returns an array of products)
async function loadProductsForOrder() {
  try {
    const response = await fetch('https://inventory-management-system-xtb4.onrender.com/api/products', {
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": sessionStorage.getItem("userId")
      },
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    return await response.json();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// ------------------------------
// Order Items Dynamic Row Functions
// ------------------------------

// Add a new order item row; if preselectedProductId and preselectedQuantity are provided, prepopulate that row.
async function addOrderItemRow(preselectedProductId = null, preselectedQuantity = null) {
  const products = await loadProductsForOrder();
  const container = document.getElementById('orderItemsContainer');
  const row = document.createElement('div');
  row.className = 'order-item-row';
  
  // Create product dropdown
  const productSelect = document.createElement('select');
  productSelect.required = true;
  productSelect.innerHTML = '<option value="">Select Product</option>';
  products.forEach(prod => {
    const option = document.createElement('option');
    // Ensure value is a string
    option.value = String(prod.id);
    option.textContent = prod.name;
    option.dataset.price = prod.price; // store price as data attribute
    productSelect.appendChild(option);
  });
  
  // Create price input (read-only)
  const priceInput = document.createElement('input');
  priceInput.type = 'text';
  priceInput.placeholder = 'Price';
  priceInput.readOnly = true;
  
  // Create quantity input
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.min = '1';
  qtyInput.placeholder = 'Quantity';
  qtyInput.required = true;
  
  // Create remove button
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn btn-delete';
  removeBtn.textContent = 'Remove';
  removeBtn.addEventListener('click', () => {
    container.removeChild(row);
    recalcTotal();
  });
  
  // When product changes, update the price field and recalc total
  productSelect.addEventListener('change', () => {
    const selected = productSelect.options[productSelect.selectedIndex];
    if (selected && selected.dataset.price) {
      priceInput.value = parseFloat(selected.dataset.price).toFixed(2);
    } else {
      priceInput.value = '';
    }
    recalcTotal();
  });
  
  // When quantity changes, update the total value
  qtyInput.addEventListener('input', recalcTotal);
  
  row.appendChild(productSelect);
  row.appendChild(priceInput);
  row.appendChild(qtyInput);
  row.appendChild(removeBtn);
  container.appendChild(row);
  
  // Prepopulate if values are provided
  if (preselectedProductId !== null) {
    productSelect.value = String(preselectedProductId);
    productSelect.dispatchEvent(new Event('change'));
  }
  if (preselectedQuantity !== null) {
    qtyInput.value = preselectedQuantity;
  }
  
  recalcTotal();
}

// Recalculate total order value based on all order item rows
function recalcTotal() {
  const container = document.getElementById('orderItemsContainer');
  let total = 0;
  const rows = container.getElementsByClassName('order-item-row');
  for (let row of rows) {
    const priceInput = row.querySelector('input[readonly]');
    const qtyInput = row.querySelector('input[type="number"]');
    const price = parseFloat(priceInput.value) || 0;
    const qty = parseInt(qtyInput.value) || 0;
    total += price * qty;
  }
  document.getElementById('totalOrderValue').value = total.toFixed(2);
}

// ------------------------------
// Modal Open/Close & Form Submission
// ------------------------------

// Open order modal for adding a new order
function openOrderModal() {
  document.getElementById('orderForm').reset();
  document.getElementById('orderItemsContainer').innerHTML = '';
  recalcTotal();
  loadCustomersForOrder();
  // Add one default order item row
  addOrderItemRow();
  document.getElementById('orderModal').style.display = 'block';
}

// Close the order modal
function closeOrderModal() {
  document.getElementById('orderModal').style.display = 'none';
  editingOrder = null;
}

// Open order modal for editing an existing order and preselect values
async function openOrderEditModal(button) {
  const row = button.closest('tr');
  const customerId = row.getAttribute('data-customer-id') || '';
  const orderDateRaw = row.getAttribute('data-order-date') || '';
  // Check for both "id" and "product_id" in products data
  const productsData = row.getAttribute('data-products') ? JSON.parse(row.getAttribute('data-products')) : [];
  
  // Load customers and set the customer dropdown
  await loadCustomersForOrder();
  document.getElementById('orderCustomerSelect').value = customerId;
  
  // Prepopulate order date field
  if (orderDateRaw) {
    const formattedDate = new Date(orderDateRaw).toISOString().split('T')[0];
    document.getElementById('orderDate').value = formattedDate;
  }
  
  // Clear and prepopulate the order items container
  const itemsContainer = document.getElementById('orderItemsContainer');
  itemsContainer.innerHTML = '';
  if (productsData.length > 0) {
    for (const item of productsData) {
      // Use either item.id or item.product_id if available
      const prodId = item.id || item.product_id;
      const quantity = item.quantity;
      await addOrderItemRow(prodId, quantity);
    }
  } else {
    await addOrderItemRow();
  }
  recalcTotal();
  
  editingOrder = row;
  document.getElementById('orderModal').style.display = 'block';
}

// Delete an order by its ID
function deleteOrder(orderId) {
  if (!confirm('Are you sure you want to delete this order?')) return;
  fetch(`https://inventory-management-system-xtb4.onrender.com/api/orders/${orderId}`, { method: 'DELETE', headers: { 
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
   })
    .then(response => {
      if (!response.ok) throw new Error(`Failed to delete order with ID ${orderId}`);
      fetchOrders(); // Refresh orders table
    })
    .catch(error => console.error('Error deleting order:', error));
}

// Order form submission handler
document.getElementById("orderForm").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const customer_id = document.getElementById("orderCustomerSelect").value;
  const order_date = document.getElementById("orderDate").value; // if used
  const container = document.getElementById("orderItemsContainer");
  const rows = container.getElementsByClassName("order-item-row");
  const items = [];
  
  for (let row of rows) {
    const productSelect = row.querySelector("select");
    const qtyInput = row.querySelector('input[type="number"]');
    const product_id = productSelect.value;
    const quantity = qtyInput.value;
    if (product_id && quantity) {
      items.push({ product_id: parseInt(product_id), quantity: parseInt(quantity) });
    }
  }
  
  if (!customer_id || items.length === 0) {
    alert("Please fill in all fields.");
    return;
  }
  
  const orderData = { customer_id, items };

  fetch("https://inventory-management-system-xtb4.onrender.com/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": sessionStorage.getItem("userId")
    },
    body: JSON.stringify(orderData)
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => { throw new Error(data.message || "Order creation failed"); });
      }
      return response.json();
    })
    .then(data => {
      alert("Order placed successfully!");
      closeOrderModal(); // Close the order modal
      fetchOrders(); // Refresh orders list or product quantities
    })
    .catch(err => {
      console.error("Error placing order:", err);
      alert("Error: " + err.message);
    });
});


// Attach functions to the global window object for HTML onclick handlers
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.openOrderEditModal = openOrderEditModal;
window.deleteOrder = deleteOrder;

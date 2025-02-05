// Customers Page JavaScript

// Fetch customers on page load
document.addEventListener('DOMContentLoaded', fetchCustomers);

async function fetchCustomers() {
  try {
    const response = await fetch('https://inventory-management-system-xtb4.onrender.com/api/customers');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const customers = await response.json();
    populateCustomersTable(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
  }
}

function populateCustomersTable(customers) {
  const tableBody = document.getElementById('customersTableBody');
  if (!tableBody) {
    console.error('No table body element found with id "customersTableBody"');
    return;
  }
  tableBody.innerHTML = customers.map(customer => `
    <tr data-id="${customer.id}">
      <td>${customer.name}</td>
      <td>${customer.customer_number || 'N/A'}</td>
      <td>${customer.email || 'N/A'}</td>
      <td>${customer.orders ? customer.orders : 'None'}</td>
      <td>
        <button class="btn btn-edit" onclick="openCustomerEditModal(this)">Edit</button>
        <button class="btn btn-delete" onclick="deleteCustomer(${customer.id})">Delete</button>
      </td>
    </tr>
  `).join('');
}

let editingCustomer = null;

function openCustomerModal() {
  document.getElementById('customerModal').style.display = 'block';
  document.getElementById('customerModalTitle').textContent = 'Add New Customer';
  document.getElementById('customerForm').reset();
  editingCustomer = null;
}

function closeCustomerModal() {
  document.getElementById('customerModal').style.display = 'none';
  editingCustomer = null;
}

function openCustomerEditModal(button) {
  const row = button.closest('tr');
  const cells = row.cells;
  document.getElementById('customerName').value = cells[0].textContent;
  document.getElementById('customerNumber').value = cells[1].textContent.trim();
  const emailText = cells[2].textContent.trim();
  document.getElementById('customerEmail').value = (emailText === 'N/A') ? '' : emailText;
  editingCustomer = row;
  document.getElementById('customerModal').style.display = 'block';
}

async function deleteCustomer(customerId) {
  try {
    const response = await fetch(`https://inventory-management-system-xtb4.onrender.com/api/customers/${customerId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      document.querySelector(`tr[data-id="${customerId}"]`)?.remove();
    }
  } catch (error) {
    console.error('Error deleting customer:', error);
  }
}

document.getElementById("customerForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("customerName").value;
  const customerNumber = document.getElementById('customerNumber').value;
  const email = document.getElementById("customerEmail").value;
  const customerData = { customer_number: customerNumber, name, email };
  
  if (editingCustomer) {
    fetch(`https://inventory-management-system-xtb4.onrender.com/api/customers/${editingCustomer.getAttribute('data-id')}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    })
    .then(response => response.json())
    .then(() => {
      fetchCustomers();
      closeCustomerModal();
    })
    .catch(error => console.error("Error updating customer:", error));
  } else {
    fetch("https://inventory-management-system-xtb4.onrender.com/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerData)
    })
    .then(response => response.json())
    .then(() => {
      fetchCustomers();
      closeCustomerModal();
    })
    .catch(error => console.error("Error saving customer:", error));
  }
});

// Attach functions to the global window object for use in HTML event handlers
window.openCustomerModal = openCustomerModal;
window.closeCustomerModal = closeCustomerModal;
window.openCustomerEditModal = openCustomerEditModal;
window.deleteCustomer = deleteCustomer;

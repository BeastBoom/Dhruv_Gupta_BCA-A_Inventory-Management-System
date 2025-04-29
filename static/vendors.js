// ------------------------------
// Global UI Toggles (Sidebar & Theme)
// ------------------------------

const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const logoImg = document.getElementById("logo-img");
const mainContent = document.getElementById('main-content');


menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('expanded');
  mainContent.classList.toggle('expanded');

  if (sidebar.classList.contains("expanded")) {
    logoImg.src = "../images/logo.png"; // full logo
    logoImg.alt = "Logo (expanded)";
  } else {
    logoImg.src = "../images/logo-short.png"; // collapsed logo
    logoImg.alt = "Logo (collapsed)";
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');

  // Check sessionStorage for dark mode preference
  if (sessionStorage.getItem('darkTheme') === 'true') {
    body.classList.add('dark-theme');
    if (themeToggle) {
      themeToggle.textContent = '☀️'; // Show light icon when dark mode is active
    }
  }

  // Set up the theme toggle button if it exists
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      body.classList.toggle('dark-theme');
      // Save the current state in sessionStorage
      sessionStorage.setItem(
        'darkTheme',
        body.classList.contains('dark-theme'),
      );
      // Update the toggle button icon accordingly
      themeToggle.textContent = body.classList.contains('dark-theme')
        ? '☀️'
        : '🌙';
    });
  }
});

// Vendors Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  fetchVendors();
});

// Fetch vendors from API and populate the table
async function fetchVendors() {
  try {
    const response = await fetch(
      'https://inventory-management-system-xtb4.onrender.com/api/vendors',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionStorage.getItem('userId'),
        },
      },
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const vendors = await response.json();
    populateVendorsTable(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
  }
}

function populateVendorsTable(vendors) {
  const tableBody = document.getElementById('vendorsTableBody');
  if (!tableBody) {
    console.error('No table body element found with id "vendorsTableBody"');
    return;
  }
  tableBody.innerHTML = vendors
    .map(
      (vendor) => `
      <tr data-id="${vendor.id}">
        <td>${vendor.name}</td>
        <td>${vendor.email || 'N/A'}</td>
        <td>${vendor.supply_area || 'N/A'}</td>
        <td>${vendor.phone || 'N/A'}</td>
        <td>
          <button class="btn btn-edit" onclick="openVendorEditModal(this)">Edit</button>
          <button class="btn btn-delete" onclick="deleteVendor(${vendor.id})">Delete</button>
        </td>
      </tr>
    `,
    )
    .join('');
}

let editingVendor = null;

function openVendorModal() {
  document.getElementById('vendorModal').style.display = 'block';
  document.getElementById('vendorModalTitle').textContent = 'Add New Vendor';
  document.getElementById('vendorForm').reset();
  editingVendor = null;
}

function closeVendorModal() {
  document.getElementById('vendorModal').style.display = 'none';
  editingVendor = null;
}

function openVendorEditModal(button) {
  const row = button.closest('tr');
  editingVendor = row;
  document.getElementById('vendorName').value = row.cells[0].textContent;
  document.getElementById('vendorEmail').value =
    row.cells[1].textContent === 'N/A' ? '' : row.cells[1].textContent;
  document.getElementById('vendorSupply').value =
    row.cells[2].textContent === 'N/A' ? '' : row.cells[2].textContent;
  document.getElementById('vendorPhone').value =
    row.cells[3].textContent === 'N/A' ? '' : row.cells[3].textContent;
  document.getElementById('vendorModalTitle').textContent = 'Edit Vendor';
  document.getElementById('vendorModal').style.display = 'block';
}

async function deleteVendor(vendorId) {
  if (!confirm('Are you sure you want to delete this vendor?')) return;
  try {
    const response = await fetch(
      `https://inventory-management-system-xtb4.onrender.com/api/vendors/${vendorId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionStorage.getItem('userId'),
        },
      },
    );
    if (response.ok) {
      document.querySelector(`tr[data-id="${vendorId}"]`)?.remove();
    }
  } catch (error) {
    console.error('Error deleting vendor:', error);
  }
}

document.getElementById("vendorForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  
  const name = document.getElementById("vendorName").value.trim();
  const email = document.getElementById("vendorEmail").value.trim();
  const supply_area = document.getElementById("vendorSupply").value.trim();
  const phone = document.getElementById("vendorPhone").value.trim();

  if (!name) {
    alert("Vendor name is required.");
    return;
  }
  
  // Validate email if provided using the API endpoint
  if (email) {
    try {
      const validationResponse = await fetch("https://inventory-management-system-xtb4.onrender.com/api/validate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const validationData = await validationResponse.json();
      if (!validationData.success || !validationData.valid) {
        alert("The provided email address appears to be invalid.");
        return;
      }
    } catch (err) {
      console.error("Error during email validation:", err);
      alert("Email validation failed.");
      return;
    }
  }
  
  // Validate phone: must be a 10-digit number (no country code)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(phone)) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }
  
  const vendorData = { name, email, supply_area, phone };
  
  try {
    if (editingVendor) {
      const vendorId = editingVendor.getAttribute('data-id');
      const response = await fetch(`https://inventory-management-system-xtb4.onrender.com/api/vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          "x-user-id": sessionStorage.getItem("userId")
        },
        body: JSON.stringify(vendorData)
      });
      await response.json();
      fetchVendors();
      closeVendorModal();
    } else {
      const response = await fetch("https://inventory-management-system-xtb4.onrender.com/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": sessionStorage.getItem("userId")
        },
        body: JSON.stringify(vendorData)
      });
      await response.json();
      fetchVendors();
      closeVendorModal();
    }
  } catch (error) {
    console.error("Error saving vendor:", error);
  }
});



// Attach functions globally for inline HTML event handlers
window.openVendorModal = openVendorModal;
window.closeVendorModal = closeVendorModal;
window.openVendorEditModal = openVendorEditModal;
window.deleteVendor = deleteVendor;

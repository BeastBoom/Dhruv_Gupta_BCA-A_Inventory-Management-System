// ------------------------------
// Global UI Toggles (Sidebar & Theme)
// ------------------------------

const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const logoImg = document.getElementById('logo-img');
const mainContent = document.getElementById('main-content');

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('expanded');
  mainContent.classList.toggle('expanded');

  if (sidebar.classList.contains('expanded')) {
    logoImg.src = '../images/logo.png'; // full logo
    logoImg.alt = 'Logo (expanded)';
  } else {
    logoImg.src = '../images/logo-short.png'; // collapsed logo
    logoImg.alt = 'Logo (collapsed)';
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

let editingAlertId = null;

document.addEventListener('DOMContentLoaded', () => {
  const userId = sessionStorage.getItem('userId');
  if (!userId) {
    console.error('Missing userId in session storage');
    return;
  }

  fetchAlerts();
  loadProducts();
  loadVendors();

  document
    .getElementById('alertForm')
    .addEventListener('submit', handleAlertSubmit);
});

async function loadProducts() {
  // populate product dropdown
  const res = await fetch(
    'https://inventory-management-system-xtb4.onrender.com/api/products',
    {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': sessionStorage.getItem('userId'),
      },
    },
  );
  const products = await res.json();
  const sel = document.getElementById('alertProductSelect');
  products.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
}

async function fetchAlerts() {
  try {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      console.error('No userId found in session');
      return;
    }

    const res = await fetch(
      'https://inventory-management-system-xtb4.onrender.com/api/alerts',
      {
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionStorage.getItem('userId'),
        },
      },
    );

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}`);
    }

    const { alerts } = await res.json();
    const tbody = document.getElementById('alertsTableBody');
    tbody.innerHTML = alerts
      .map(
        (a) => `
    <tr data-id="${a.id}">
      <td>${a.product_name}</td>
      <td>${a.vendor_name}</td>
      <td>${a.threshold_qty}</td>
      <td>${a.last_notified || 'Never'}</td>
      <td>
        <button class="btn btn-edit" onclick="openAlertModal(${a.id}, ${a.product_id}, ${a.vendor_id}, ${a.threshold_qty})">Edit</button>
        <button class="btn btn-delete" onclick="deleteAlert(${a.id})">Delete</button>
      </td>
    </tr>
  `,
      )
      .join('');
  } catch (error) {
    console.error('Error fetching alerts:', error);
    // Display user-friendly error
  }
}

// Update this function to include vendorId parameter
function openAlertModal(id = null, productId = '', vendorId = '', threshold = '') {
  editingAlertId = id;
  document.getElementById('alertModalTitle')
    .textContent = id ? 'Edit Alert' : 'Add Alert';
  document.getElementById('alertProductSelect').value = productId;
  document.getElementById('alertVendorSelect').value = vendorId; // Set vendor dropdown
  document.getElementById('alertThreshold').value = threshold;
  document.getElementById('alertModal').style.display = 'block';
}

function closeAlertModal() {
  document.getElementById('alertModal').style.display = 'none';
  editingAlertId = null;
  document.getElementById('alertForm').reset();
}

async function handleAlertSubmit(e) {
  e.preventDefault();
  const product_id = +document.getElementById('alertProductSelect').value;
  const vendor_id = +document.getElementById('alertVendorSelect').value;
  const threshold_qty = +document.getElementById('alertThreshold').value;
  if (!product_id || !threshold_qty) return alert('Fill all fields');

  let url, method;
  
  if (editingAlertId) {
    // We're editing an existing alert
    url = `https://inventory-management-system-xtb4.onrender.com/api/alerts/${editingAlertId}`;
    method = 'PUT'; // or 'PATCH' depending on your API
  } else {
    // We're creating a new alert
    url = 'https://inventory-management-system-xtb4.onrender.com/api/alerts';
    method = 'POST';
  }
  
  const body = { product_id, vendor_id, threshold_qty };

  await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': sessionStorage.getItem('userId'),
    },
    body: JSON.stringify(body),
  });

  closeAlertModal();
  fetchAlerts();
}

async function deleteAlert(id) {
  if (!confirm('Delete this alert?')) return;
  await fetch(
    `https://inventory-management-system-xtb4.onrender.com/api/alerts/${id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': sessionStorage.getItem('userId'),
      },
    },
  );
  fetchAlerts();
}

async function loadVendors() {
  const res = await fetch(
    'https://inventory-management-system-xtb4.onrender.com/api/vendors',
    {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': sessionStorage.getItem('userId'),
      },
    },
  );
  const vendors = await res.json();
  const sel = document.getElementById('alertVendorSelect');
  vendors.forEach((v) => {
    const opt = document.createElement('option');
    opt.value = v.id;
    opt.textContent = v.name;
    sel.appendChild(opt);
  });
}

// expose modal funcs to inline onclicks
window.openAlertModal = openAlertModal;
window.closeAlertModal = closeAlertModal;
window.deleteAlert = deleteAlert;

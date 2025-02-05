// Toggle Sidebar
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menu-toggle');
const mainContent = document.getElementById('main-content');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('expanded');
    mainContent.classList.toggle('expanded');
});

// Toggle Dark/Light Theme
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    themeToggle.textContent = body.classList.contains('dark-theme') ? '☀️' : '🌙';
});

// Product Management Variables
let editingRow = null;

async function fetchCategories() {
  try {
      const response = await fetch('http://localhost:3000/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const categories = await response.json();

      const categoryDropdown = document.getElementById('categorySelect');
      categoryDropdown.innerHTML = '<option value="">Select Category</option>';
      categories.forEach(category => {
          const option = document.createElement('option');
          option.value = category.id;
          option.textContent = category.name;
          categoryDropdown.appendChild(option);
      });
  } catch (error) {
      console.error('Error fetching categories:', error);
  }
}


// Modal Functions
window.openProductModal = function() {
  document.getElementById('productModal').style.display = 'block';
  document.getElementById('modalTitle').textContent = 'Add New Product';
  document.getElementById('productForm').reset();
  editingRow = null;
  fetchCategories();  // Ensure categories are loaded before opening modal
};


// Close Modal Function (defined once here)
function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
  editingRow = null;  // Reset editingRow when modal is closed
}

// Edit Modal Function
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
  fetchCategories();  // Ensure categories are loaded
};


window.deleteProduct = async function(productId) {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        document.querySelector(`tr[data-id="${productId}"]`)?.remove();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }
};

// Fetch all products on page load
document.addEventListener('DOMContentLoaded', fetchProducts);

async function fetchProducts() {
  try {
    const response = await fetch('http://localhost:3000/api/products');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
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



// Submit Product Form (Add/Edit)
document.getElementById("productForm").addEventListener("submit", function (e) {
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
      fetch(`http://localhost:3000/api/products/${editingRow.dataset.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(product)
      })
      .then(response => response.json())
      .then(data => {
          editingRow.cells[0].textContent = data.name;
          editingRow.cells[1].textContent = data.quantity;
          editingRow.cells[2].textContent = `$${data.price.toFixed(2)}`;
          editingRow.cells[3].textContent = data.category_name || 'None';
          closeProductModal();
      })
      .catch(error => console.error("Error updating product:", error));
  } else {
      fetch("http://localhost:3000/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(product)
      })
      .then(response => response.json())
      .then(() => {
          fetchProducts();
          closeProductModal();
      })
      .catch(error => console.error("Error saving product:", error));
  }
});

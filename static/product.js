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
        let historyHtml = "";
        if (data.history.length === 0) {
          historyHtml = "<p>No history available for this product.</p>";
        } else {
          data.history.forEach(record => {
            const dateStr = new Date(record.changed_at).toLocaleString();
            let details = record.change_details;
            // If details is in JSON format, parse and reformat it.
            try {
              const detailsObj = JSON.parse(details);
              let detailsStr = "";
              for (const key in detailsObj) {
                detailsStr += `<strong>${key}:</strong> ${detailsObj[key]}<br/>`;
              }
              details = detailsStr;
            } catch (e) {
              // If parsing fails, use the raw details.
            }
            historyHtml += `
              <div class="history-record">
                <p><strong>${dateStr}</strong></p>
                <p>Type: ${record.change_type}</p>
                <p>Details: ${details}</p>
              </div>
              <hr/>
            `;
          });
        }
        document.getElementById("historyContent").innerHTML = historyHtml;
        openHistoryModal();
      } else {
        alert("Failed to fetch product history: " + data.message);
      }
    })
    .catch(err => {
      console.error("Error fetching product history:", err);
      alert("Error fetching product history: " + err.message);
    });
}

function openHistoryModal() {
  const modal = document.getElementById("historyModal");
  if (modal) {
    modal.style.display = "block";
  }
}

function closeHistoryModal() {
  const modal = document.getElementById("historyModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Attach close event to the modal's close button
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("historyModalClose");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeHistoryModal);
  }
  
  // Close the modal when clicking outside the content area
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("historyModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

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
  const quantityStr = document.getElementById("quantity").value;
  let price = document.getElementById("price").value;
  const categoryId = document.getElementById("categorySelect").value;
  
  // Validate and parse quantity
  const quantity = parseInt(quantityStr, 10);
  if (isNaN(quantity)) {
    alert("Please enter a valid quantity.");
    return;
  }
  
  // Parse and validate price
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

  // Include the user ID header (ensure sessionStorage has a valid "userId")
  const headers = {
    "Content-Type": "application/json",
    "x-user-id": sessionStorage.getItem("userId")
  };

  if (editingRowProd) {
    // Update existing product
    try {
      const response = await fetch(`https://inventory-management-system-xtb4.onrender.com/api/products/${editingRowProd.dataset.id}`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(product)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      const data = await response.json();
      // Ensure returned price is parsed before calling toFixed()
      const updatedPrice = parseFloat(data.price) || 0;
      editingRowProd.cells[0].textContent = data.name;
      editingRowProd.cells[1].textContent = data.quantity;
      editingRowProd.cells[2].textContent = `$${updatedPrice.toFixed(2)}`;
      editingRowProd.cells[3].textContent = data.category_name || "None";
      closeProductModal(); // Close the modal on success
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Error updating product: " + error.message);
    }
  } else {
    // Create a new product
    try {
      const response = await fetch("https://inventory-management-system-xtb4.onrender.com/api/products", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(product)
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      await response.json();
      fetchProducts(); // Refresh product list
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

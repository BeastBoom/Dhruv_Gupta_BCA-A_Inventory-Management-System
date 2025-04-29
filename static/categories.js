(function () {
  // Toggle Sidebar
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

// This code should run when the DOM is loaded on every page
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

  // Category Management Variables
  let editingCategoryRow = null;

  // Function to open the category modal (for adding a new category)
  function openCategoryModal() {
    const categoryModal = document.getElementById('categoryModal');
    if (categoryModal) {
      categoryModal.style.display = 'block';
      document.getElementById('categoryModalTitle').textContent = 'Add New Category';
      document.getElementById('categoryForm').reset();
      editingCategoryRow = null;
    } else {
      console.error('Element with id "categoryModal" not found.');
    }
  }

  // Function to close the category modal
  function closeCategoryModal() {
    const categoryModal = document.getElementById('categoryModal');
    if (categoryModal) {
      categoryModal.style.display = 'none';
      editingCategoryRow = null;
    } else {
      console.error('Element with id "categoryModal" not found.');
    }
  }

  // Function to open the edit modal for a category
  function openCategoryEditModal(button) {
    const row = button.closest('tr');
    const cells = row.cells;
    // Assuming columns: Category Name, Description, Products
    document.getElementById('categoryName').value = cells[0].textContent;
    document.getElementById('categoryDescription').value = cells[1].textContent;
    document.getElementById('categoryProducts').value = cells[2].textContent;
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    editingCategoryRow = row;
    document.getElementById('categoryModal').style.display = 'block';
  }

  // Function to delete a category
  async function deleteCategory(categoryId) {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await fetch(`https://inventory-management-system-xtb4.onrender.com/api/categories/${categoryId}`, {
          method: 'DELETE',
          headers: {
            "Content-Type": "application/json",
            "x-user-id": sessionStorage.getItem("userId")
          }
        });
        if (response.ok) {
          document.querySelector(`tr[data-id="${categoryId}"]`)?.remove();
        }
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  }

  // Fetch all categories
  async function fetchCategories() {
    try {
      const response = await fetch('https://inventory-management-system-xtb4.onrender.com/api/categories', {
        headers: {
          "Content-Type": "application/json",
          "x-user-id": sessionStorage.getItem("userId")
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const categories = await response.json();
      populateCategoryTable(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  // Populate the category table
  function populateCategoryTable(categories) {
    const tableBody = document.getElementById('categoryTableBody');
    if (!tableBody) {
      console.error('No table body element found with id "categoryTableBody"');
      return;
    }
    tableBody.innerHTML = categories.map(category => `
      <tr data-id="${category.id}">
        <td>${category.name}</td>
        <td>${category.description || 'NA'}</td>
        <td>${category.products && category.products.length > 0
          ? category.products.map(product => `<p>${product.name}</p>`).join('')
          : 'No products'}</td>
        <td>
          <button class="btn btn-edit" onclick="openCategoryEditModal(this)">Edit</button>
          <button class="btn btn-delete" onclick="deleteCategory('${category.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  // Submit Category Form (Add/Edit)
  const categoryForm = document.getElementById("categoryForm");
  if (categoryForm) {
    categoryForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = document.getElementById("categoryName").value;
      const description = document.getElementById("categoryDescription").value;
      const product_ids = document.getElementById("categoryProducts").value; // e.g., "1,2,3"

      const category = { name, description, product_ids };

      if (editingCategoryRow) {
        // Editing an existing category
        fetch(`https://inventory-management-system-xtb4.onrender.com/api/categories/${editingCategoryRow.dataset.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': sessionStorage.getItem("userId")
          },
          body: JSON.stringify(category)
        })
        .then(response => response.json())
        .then(data => {
          editingCategoryRow.cells[0].textContent = data.name;
          editingCategoryRow.cells[1].textContent = data.description;
          editingCategoryRow.cells[2].textContent = data.product_ids;
          closeCategoryModal();
        })
        .catch(error => console.error("Error updating category:", error));
      } else {
        // Adding a new category
        fetch("https://inventory-management-system-xtb4.onrender.com/api/categories", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "x-user-id": sessionStorage.getItem("userId")
          },
          body: JSON.stringify(category)
        })
        .then(response => response.json())
        .then(data => {
          console.log("Category saved:", data);
          fetchCategories();
          closeCategoryModal();
        })
        .catch(error => console.error("Error saving category:", error));
      }
    });
  } else {
    console.error('Element with id "categoryForm" not found.');
  }

  // Attach functions to the global window object
  window.openCategoryModal = openCategoryModal;
  window.closeCategoryModal = closeCategoryModal;
  window.openCategoryEditModal = openCategoryEditModal;
  window.deleteCategory = deleteCategory;

  // Fetch categories on page load
  document.addEventListener('DOMContentLoaded', fetchCategories);
})();

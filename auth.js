"use strict";

// Toggle between login and signup views
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

if (signUpButton && signInButton && container) {
  signUpButton.addEventListener('click', () => {
    container.classList.add("right-panel-active");
  });
  signInButton.addEventListener('click', () => {
    container.classList.remove("right-panel-active");
  });
} else {
  console.error("Toggle buttons or container not found.");
}

// Wait for the DOM to load before attaching form handlers
document.addEventListener("DOMContentLoaded", () => {
  // Login form handling – note the ID is "login-form" (with a dash) in your HTML.
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("login-username").value;
      const password = document.getElementById("login-password").value;
      fetch("https://inventory-management-system-xtb4.onrender.com/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Save user ID in sessionStorage for this session
            sessionStorage.setItem("userId", data.user.id);
            // Redirect to dashboard
            window.location.href = "templates/dashboard.html";
          } else {
            alert("Invalid credentials.");
          }
        })
        .catch((err) => {
          console.error("Error logging in:", err);
          alert("Login failed.");
        });
    });
  } else {
    console.error("Login form (id='login-form') not found.");
  }

  // Signup form handling – note the ID is "signup-form" (with a dash) in your HTML.
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Retrieve input elements
      const usernameEl = document.getElementById("signup-username");
      const emailEl = document.getElementById("signup-email");
      const passwordEl = document.getElementById("signup-password");
      const confirmPasswordEl = document.getElementById("signup-confirm-password");

      // Check that all elements exist
      if (!usernameEl || !emailEl || !passwordEl || !confirmPasswordEl) {
        alert("One or more signup fields are missing. Please refresh the page.");
        return;
      }

      // Get values and trim where necessary
      const username = usernameEl.value.trim();
      const email = emailEl.value.trim();
      const password = passwordEl.value;
      const confirmPassword = confirmPasswordEl.value;

      // Validate username: must be at least 3 characters
      if (username.length < 3) {
        alert("Username must be at least 3 characters long.");
        return;
      }

      // Validate email using regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }

      // Validate password: Minimum 8 characters, at least one uppercase, one lowercase, one digit, and one special character
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(password)) {
        alert("Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a digit, and a special character.");
        return;
      }

      // Validate confirm password matches
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      // All validations passed; send signup request to backend
      fetch("https://inventory-management-system-xtb4.onrender.com/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data.success) {
            alert("Signup successful! Please log in.");
            // Optionally, switch back to login view
            container.classList.remove("right-panel-active");
          } else {
            alert("Signup failed: " + data.message);
          }
        })
        .catch((err) => {
          console.error("Error signing up:", err);
          alert("Signup failed due to an error.");
        });
    });
  } else {
    console.error("Signup form (id='signup-form') not found.");
  }
});

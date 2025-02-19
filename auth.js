"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Login form handling
  const loginForm = document.getElementById("loginForm");
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
            // Save user ID in sessionStorage for the session
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
  }

  // Signup form handling
  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      // Get the form values
      const emailEl = document.getElementById("signup-email").value.trim();
      const usernameEl = document.getElementById("signup-username").value.trim();
      const passwordEl = document.getElementById("signup-password").value;
      const confirmPasswordEl = document.getElementById("signup-confirm-password").value;
      
       // Check that all input elements exist
       if (!usernameEl || !emailEl || !passwordEl || !confirmPasswordEl) {
        alert("One or more signup fields are missing. Please refresh the page.");
        return;
      }

      // Retrieve and trim values
      const username = usernameEl.value.trim();
      const email = emailEl.value.trim();
      const password = passwordEl.value;
      const confirmPassword = confirmPasswordEl.value;

      // Username: not empty and at least 3 characters
      if (username.length < 3) {
        alert("Username is required and must be at least 3 characters long.");
        return;
      }

      // Email validation using a simple regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }

      // Password validation: Minimum 8 characters, at least one uppercase, one lowercase, one digit, and one special character.
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(password)) {
        alert("Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.");
        return;
      }

      // Confirm password check
      if (password !== confirmPassword) {
        alert("Password and Confirm Password do not match.");
        return;
      }

      console.log("Signup form submitted with:", username, email);

      // Send the signup request to the backend (without confirmPassword)
      fetch("https://inventory-management-system-xtb4.onrender.com/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })
        .then((res) => {
          console.log("Signup response status:", res.status);
          return res.json();
        })
        .then((data) => {
          console.log("Signup response data:", data);
          if (data.success) {
            // Redirect to login page after successful signup
            window.location.href = "index.html";
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
    console.error("Signup form (id='signupForm') not found in the DOM.");
  }
});

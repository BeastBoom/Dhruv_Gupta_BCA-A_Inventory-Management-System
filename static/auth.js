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
            window.location.href = "../templates/dashboard.html";
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
      const username = document.getElementById("signup-username").value;
      const password = document.getElementById("signup-password").value;
      
      console.log("Signup form submitted with:", username, password);
      
      // Send the signup request to the backend
      fetch("https://inventory-management-system-xtb4.onrender.com/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
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

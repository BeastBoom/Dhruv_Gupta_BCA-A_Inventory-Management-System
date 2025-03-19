"use strict";

const fetch = window.fetch || require('node-fetch'); // Use node-fetch if needed

async function validateEmailWithAPI(email) {
  const apiKey = process.env.EMAIL_VALIDATION_API_KEY; // ensure this is set in your .env
  const url = `http://apilayer.net/api/check?access_key=${apiKey}&email=${encodeURIComponent(email)}&smtp=1&format=1`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Email validation request failed: ${response.status}`);
    const data = await response.json();
    // Returns true only if both format and SMTP checks are positive
    return data.format_valid && data.smtp_check;
  } catch (err) {
    console.error("Error validating email:", err);
    return false;
  }
}

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
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Retrieve input elements
      const emailEl = document.getElementById("signup-email");
      const usernameEl = document.getElementById("signup-username");
      const passwordEl = document.getElementById("signup-password");
      const confirmPasswordEl = document.getElementById("signup-confirm-password");

      // Check that all elements exist
      if (!emailEl || !usernameEl || !passwordEl || !confirmPasswordEl) {
        alert("One or more signup fields are missing. Please refresh the page.");
        return;
      }

      // Get trimmed values
      const email = emailEl.value.trim();
      const username = usernameEl.value.trim();
      const password = passwordEl.value;
      const confirmPassword = confirmPasswordEl.value;

      // Client-side validations
      if (username.length < 3) {
        alert("Username must be at least 3 characters long.");
        return;
      }
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }
      // Validate password complexity: minimum 8 characters, with uppercase, lowercase, digit, and special character.
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(password)) {
        alert("Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.");
        return;
      }
      // Confirm password check
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      // Call external API to validate email
      const emailIsValid = await validateEmailWithAPI(email);
      if (!emailIsValid) {
        alert("The provided email address appears to be invalid.");
        return;
      }

      // Proceed with signup request
      try {
        const response = await fetch("https://inventory-management-system-xtb4.onrender.com/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          alert("Signup successful! Please log in.");
          window.location.href = "index.html"; // or redirect to login view
        } else {
          alert("Signup failed: " + data.message);
        }
      } catch (err) {
        console.error("Error signing up:", err);
        alert("Signup failed due to an error.");
      }
    });
  } else {
    console.error("Signup form (id='signupForm') not found in the DOM.");
  }
});
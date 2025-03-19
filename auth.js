"use strict";

// Toggle between login and signup views
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
  container.classList.add("right-panel-active");
  // Clear the login form when switching to sign-up view
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.reset();
  }
});

signInButton.addEventListener('click', () => {
  container.classList.remove("right-panel-active");
  // Clear the signup form when switching to sign-in view
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.reset();
  }
});

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

      // Retrieve form field values
      const emailEl = document.getElementById("signup-email");
      const usernameEl = document.getElementById("signup-username");
      const passwordEl = document.getElementById("signup-password");
      const confirmPasswordEl = document.getElementById("signup-confirm-password");

      if (!emailEl || !usernameEl || !passwordEl || !confirmPasswordEl) {
        alert("One or more signup fields are missing. Please refresh the page.");
        return;
      }

      const email = emailEl.value.trim();
      const username = usernameEl.value.trim();
      const password = passwordEl.value;
      const confirmPassword = confirmPasswordEl.value;

      // Basic validations
      if (username.length < 3) {
        alert("Username must be at least 3 characters long.");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return;
      }
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(password)) {
        alert("Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character.");
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      // Call your backend endpoint to validate the email
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
          window.location.href = "index.html";
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

// --- Login Password Toggle with Dynamic Visibility ---
const loginPasswordInput = document.getElementById("login-password");
const loginToggle = document.getElementById("login-toggle");
if (loginPasswordInput && loginToggle) {
  function updateLoginToggleVisibility() {
    loginToggle.style.display = loginPasswordInput.value.trim() === "" ? "none" : "block";
  }
  loginPasswordInput.addEventListener("input", updateLoginToggleVisibility);
  loginPasswordInput.addEventListener("focus", updateLoginToggleVisibility);
  // Prevent the input from losing focus when clicking the icon
  loginToggle.addEventListener("mousedown", (e) => { e.preventDefault(); });
  loginPasswordInput.addEventListener("blur", () => {
    // Delay hiding to check if the toggle is focused
    setTimeout(() => {
      if (document.activeElement !== loginToggle) {
        loginPasswordInput.type = "password";
        loginToggle.style.display = "none";
      }
    }, 100);
  });
  updateLoginToggleVisibility();
  loginToggle.addEventListener("click", () => {
    if (loginPasswordInput.type === "password") {
      loginPasswordInput.type = "text";
      loginToggle.innerHTML = '<i class="fa fa-eye-slash"></i>';
    } else {
      loginPasswordInput.type = "password";
      loginToggle.innerHTML = '<i class="fa fa-eye"></i>';
    }
  });
}

// --- Signup Password Toggle with Dynamic Visibility ---
const signupPasswordInput = document.getElementById("signup-password");
const signupToggle = document.getElementById("signup-toggle");
if (signupPasswordInput && signupToggle) {
  function updateSignupToggleVisibility() {
    signupToggle.style.display = signupPasswordInput.value.trim() === "" ? "none" : "block";
  }
  signupPasswordInput.addEventListener("input", updateSignupToggleVisibility);
  signupPasswordInput.addEventListener("focus", updateSignupToggleVisibility);
  signupToggle.addEventListener("mousedown", (e) => { e.preventDefault(); });
  signupPasswordInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (document.activeElement !== signupToggle) {
        signupPasswordInput.type = "password";
        signupToggle.style.display = "none";
      }
    }, 100);
  });
  updateSignupToggleVisibility();
  signupToggle.addEventListener("click", () => {
    if (signupPasswordInput.type === "password") {
      signupPasswordInput.type = "text";
      signupToggle.innerHTML = '<i class="fa fa-eye-slash"></i>';
    } else {
      signupPasswordInput.type = "password";
      signupToggle.innerHTML = '<i class="fa fa-eye"></i>';
    }
  });
}

// --- Signup Confirm Password Toggle with Dynamic Visibility ---
const signupConfirmInput = document.getElementById("signup-confirm-password");
const signupConfirmToggle = document.getElementById("signup-confirm-toggle");
if (signupConfirmInput && signupConfirmToggle) {
  function updateSignupConfirmToggleVisibility() {
    signupConfirmToggle.style.display = signupConfirmInput.value.trim() === "" ? "none" : "block";
  }
  signupConfirmInput.addEventListener("input", updateSignupConfirmToggleVisibility);
  signupConfirmInput.addEventListener("focus", updateSignupConfirmToggleVisibility);
  signupConfirmToggle.addEventListener("mousedown", (e) => { e.preventDefault(); });
  signupConfirmInput.addEventListener("blur", () => {
    setTimeout(() => {
      if (document.activeElement !== signupConfirmToggle) {
        signupConfirmInput.type = "password";
        signupConfirmToggle.style.display = "none";
      }
    }, 100);
  });
  updateSignupConfirmToggleVisibility();
  signupConfirmToggle.addEventListener("click", () => {
    if (signupConfirmInput.type === "password") {
      signupConfirmInput.type = "text";
      signupConfirmToggle.innerHTML = '<i class="fa fa-eye-slash"></i>';
    } else {
      signupConfirmInput.type = "password";
      signupConfirmToggle.innerHTML = '<i class="fa fa-eye"></i>';
    }
  });
}

// Event listeners for real-time validation
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const emailInput = document.getElementById("email");
const submitButton = document.getElementById("googleform");

// Error messages
const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");
const pass = document.getElementsByClassName("pass")[0];
const confirmPasswordError = document.getElementById("confirmPasswordError");
const emailError = document.getElementById("emailError");
const email = document.getElementsByClassName("email")[0];

// Validation regex patterns
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

function validateEmail() {
  if (!emailPattern.test(emailInput.value)) {
    emailError.textContent = "Enter a valid email address";
    email.style.opacity=1;
    return false;
  }
  emailError.textContent = "";
  email.style.opacity=0;
  return true;
}

function validatePassword() {
  if (!passwordPattern.test(passwordInput.value)) {
    passwordError.textContent =
      "Password must be 8+ chars, include upper/lower case, number, and special character";
      pass.style.opacity=1;
      return false;
    
  }
  passwordError.textContent = "";
  pass.style.opacity=0;
  
  return true;
}

function validateConfirmPassword() {
  if (confirmPasswordInput.value !== passwordInput.value) {
    confirmPasswordError.textContent = "Passwords do not match";

    return false;
  }
  confirmPasswordError.textContent = "";
  return true;
}

function validateForm() {
  const isUsernameFilled = !!usernameInput.value;
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = validateConfirmPassword();

  if (!isUsernameFilled) {
    usernameError.textContent = "Username is required";
    usernameError.style.opacity=1;
  } else {
    usernameError.textContent = "";
    usernameError.style.opacity=0;
  }

  return isUsernameFilled && isEmailValid && isPasswordValid && isConfirmPasswordValid;
}

// Event listeners for real-time feedback
emailInput.addEventListener("input", validateEmail);
passwordInput.addEventListener("input", validatePassword);
confirmPasswordInput.addEventListener("input", validateConfirmPassword);

// Form submission handling
submitButton.addEventListener("click", function (event) {
  event.preventDefault(); // Prevent form submission for validation

  if (validateForm()) {
    alert("Form submitted successfully!");
    document.getElementById("myForm").reset();
  } else {
    alert("Please fill out all the fields correctly");
  }
});

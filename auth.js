"use strict";

let _resendTimer = null;

const API_BASE_URL = "https://inventory-management-system-xtb4.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
  // Panel Toggle (login ↔ signup)
  const signUpButton = document.getElementById('signUp');
  const signInButton = document.getElementById('signIn');
  const container    = document.getElementById('container');

  signUpButton.addEventListener('click', () => {
    container.classList.add('right-panel-active');
    document.getElementById('login-form').reset();
  });
  signInButton.addEventListener('click', () => {
    container.classList.remove('right-panel-active');
    document.getElementById('signup-form').reset();
  });

  // Login Handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;
      try {
        const res  = await fetch('${API_BASE_URL}/api/login', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('userId', data.user.id);
          window.location.href = 'templates/dashboard.html';
        } else {
          alert('Invalid credentials.');
        }
      } catch(err) {
        console.error('Error logging in:', err);
        alert('Login failed. Please try again.');
      }
    });
  }

  // Signup Handler
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailEl   = document.getElementById('signup-email');
      const userEl    = document.getElementById('signup-username');
      const passEl    = document.getElementById('signup-password');
      const confirmEl = document.getElementById('signup-confirm-password');
      const email     = emailEl.value.trim();
      const username  = userEl.value.trim();
      const password  = passEl.value;
      const confirm   = confirmEl.value;

      // Basic client-side validation
      if (username.length < 3) {
        return alert('Username must be at least 3 characters.');
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return alert('Invalid email format.');
      }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) {
        return alert('Password must be 8+ chars, include uppercase, lowercase, digit & special.');
      }
      if (password !== confirm) {
        return alert('Passwords do not match.');
      }

      // Create account & request verification code
      try {
        const res = await fetch('${API_BASE_URL}/api/signup', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ username, email, password })
        });
        if (!res.ok) {
          const text = await res.text();
          console.error('Signup response:', res.status, text);
          throw new Error(`Signup failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('pendingVerificationId', data.pendingId);
          openVerificationModal();
        } else {
          alert('Signup error: ' + data.message);
        }
      } catch(err) {
        console.error('Signup exception:', err);
        alert(`Signup failed: ${err.message.includes('405') ? 'Server configuration error (Method Not Allowed). Please contact support.' : 'Could not connect to server.'}`);
      }
    });
  }

  // Password Eye Toggles
  const setupToggle = (inputId, toggleId) => {
    const inp = document.getElementById(inputId);
    const tog = document.getElementById(toggleId);
    if (!inp || !tog) return;
    const update = () => tog.style.display = inp.value ? 'block' : 'none';
    inp.addEventListener('input', update);
    inp.addEventListener('focus', update);
    inp.addEventListener('blur', () => {
      setTimeout(() => {
        if (document.activeElement !== tog) {
          inp.type = 'password';
          tog.style.display = 'none';
        }
      }, 100);
    });
    tog.addEventListener('mousedown', e => e.preventDefault());
    tog.addEventListener('click', () => {
      if (inp.type === 'password') {
        inp.type = 'text';
        tog.innerHTML = '<i class="fa fa-eye-slash"></i>';
      } else {
        inp.type = 'password';
        tog.innerHTML = '<i class="fa fa-eye"></i>';
      }
    });
    update();
  };
  setupToggle('login-password',         'login-toggle');
  setupToggle('signup-password',        'signup-toggle');
  setupToggle('signup-confirm-password','signup-confirm-toggle');

  // Verification Modal & Resend Buttons
  window.openVerificationModal = () => {
    document.getElementById('verificationModal').style.display = 'block';
  };

  // Handle code submission
  const verifyForm = document.getElementById('verificationForm');
  if (verifyForm) {
    verifyForm.addEventListener('submit', async e => {
      e.preventDefault();
      const code = document.getElementById('verificationCodeInput').value.trim();
      const verificationId = sessionStorage.getItem('pendingVerificationId');
      try {
        const res= await fetch('${API_BASE_URL}/api/verify-code', {
          method: 'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ verificationId, code })
        });
        if (!res.ok) {
          const text = await res.text();
          console.error('Verify response:', res.status, text);
          throw new Error(`Verification failed: ${res.status} ${res.statusText}`);
        }
        const result = await res.json();
        if (result.success) {
          alert('✅ Verified! You may now log in.');
          sessionStorage.removeItem('pendingVerificationId');
          window.location.href = 'index.html';
        } else {
          alert('❌ ' + result.message);
        }
      } catch(err) {
        console.error('Verification error:', err);
        alert(`Verification failed: ${err.message.includes('405') ? 'Server configuration error (Method Not Allowed). Please contact support.' : 'Could not connect to server.'}`);
      }
    });
  }

  // Handle resends with server-side limit and client-side cooldown
  const resendBtn = document.getElementById('resendCodeBtn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const verificationId = sessionStorage.getItem('pendingVerificationId');
      try {
        const response = await fetch('${API_BASE_URL}/api/resend-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verificationId })
        });
        if (!response.ok) {
          const text = await response.text();
          console.error('Resend response:', response.status, text);
          throw new Error(`Resend failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.success) {
          alert('A new code has been sent.');
        } else {
          alert(data.message);
          if (response.status === 429 || data.message.includes('limit reached')) {
            startResendCooldown();
          }
        }
      } catch (err) {
        console.error('Resend error:', err);
        alert(`Could not resend code: ${err.message.includes('405') ? 'Server configuration error (Method Not Allowed). Please contact support.' : 'Could not connect to server.'}`);
      }
    });
  }

  // Function to start a 30-minute cooldown for the resend button
  function startResendCooldown() {
    const resendBtn = document.getElementById('resendCodeBtn');
    resendBtn.disabled = true;
    resendBtn.textContent = 'Resend in 30:00';
    let secs = 30 * 60; // 30 minutes
    const tick = () => {
      if (secs <= 0) {
        clearInterval(_resendTimer);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      } else {
        const m = Math.floor(secs / 60);
        const s = String(secs % 60).padStart(2, '0');
        resendBtn.textContent = `Resend in ${m}:${s}`;
        secs--;
      }
    };
    tick();
    _resendTimer = setInterval(tick, 1000);
  }
});
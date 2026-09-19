const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const icon = menuBtn.querySelector('i');
    if (icon) {
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    }
  });
}

const sections = document.querySelectorAll('main section[id], footer[id]');
const navAnchors = document.querySelectorAll('.nav-links a');

const activateLink = () => {
  let currentId = 'about';

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 160;
    const sectionHeight = section.clientHeight;
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
      currentId = section.getAttribute('id') || 'about';
    }
  });

  navAnchors.forEach((link) => {
    const href = link.getAttribute('href');
    link.classList.toggle('active', href === '#' + currentId);
  });
};

window.addEventListener('scroll', activateLink);
activateLink();

const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
  const button = item.querySelector('.faq-question');
  if (!button) return;

  button.addEventListener('click', () => {
    faqItems.forEach((faq) => {
      if (faq !== item) {
        faq.classList.remove('active');
      }
    });
    item.classList.toggle('active');
  });
});

const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 14);
targetDate.setHours(targetDate.getHours() + 8);
targetDate.setMinutes(targetDate.getMinutes() + 32);

const countdownEls = {
  days: document.querySelector('.countdown div:nth-child(1) strong'),
  hours: document.querySelector('.countdown div:nth-child(2) strong'),
  mins: document.querySelector('.countdown div:nth-child(3) strong')
};

const updateCountdown = () => {
  const now = new Date();
  const diff = Math.max(targetDate - now, 0);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  if (countdownEls.days) countdownEls.days.textContent = String(days).padStart(2, '0');
  if (countdownEls.hours) countdownEls.hours.textContent = String(hours).padStart(2, '0');
  if (countdownEls.mins) countdownEls.mins.textContent = String(minutes).padStart(2, '0');
};

updateCountdown();
setInterval(updateCountdown, 60000);

const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

revealItems.forEach((item) => revealObserver.observe(item));

const USERS_KEY = 'up_hackathon_users';
const OTP_KEY = 'up_hackathon_otp';
const SESSION_KEY = 'up_hackathon_session';

const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const setUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const setOtpState = (email, otp) => {
  localStorage.setItem(OTP_KEY, JSON.stringify({ email, otp, expiresAt: Date.now() + 5 * 60 * 1000 }));
};

const getOtpState = () => JSON.parse(localStorage.getItem(OTP_KEY) || 'null');

const showStatus = (element, message, type = '') => {
  if (!element) return;
  element.textContent = message;
  element.className = 'status-text';
  if (type) element.classList.add(type);
};

const normalizeEmail = (value) => value.trim().toLowerCase();

const showOtpBox = (boxId, visible) => {
  const box = document.getElementById(boxId);
  if (box) {
    box.classList.toggle('visible', visible);
  }
};

const handleRegisterFlow = () => {
  const form = document.querySelector('.register-form');
  if (!form) return;

  const otpBox = document.getElementById('register-otp-box');
  const statusEl = document.getElementById('register-status');
  const otpInput = document.getElementById('register-otp');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const action = event.submitter?.dataset.action || 'send-register-otp';

    const name = document.getElementById('reg-name')?.value.trim();
    const email = normalizeEmail(document.getElementById('reg-email')?.value || '');
    const college = document.getElementById('reg-college')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim();
    const track = document.getElementById('reg-track')?.value;
    const summary = document.getElementById('reg-summary')?.value.trim();

    if (action === 'send-register-otp') {
      if (!name || !email || !college || !phone) {
        showStatus(statusEl, 'Please fill in all required fields.', 'error');
        return;
      }

      const otp = generateOtp();
      setOtpState(email, otp);
      showStatus(statusEl, `OTP sent to ${email}. Demo code: ${otp}`, 'success');
      showOtpBox('register-otp-box', true);
      if (otpInput) otpInput.focus();
      return;
    }

    if (action === 'verify-register') {
      const currentOtp = getOtpState();
      const enteredOtp = (otpInput?.value || '').trim();

      if (!currentOtp || currentOtp.email !== email) {
        showStatus(statusEl, 'Please request a new OTP first.', 'error');
        return;
      }

      if (String(currentOtp.otp) !== enteredOtp) {
        showStatus(statusEl, 'Invalid OTP. Please try again.', 'error');
        return;
      }

      const users = getUsers();
      const existing = users.find((user) => user.email === email);
      if (!existing) {
        users.push({ name, email, college, phone, track, summary, createdAt: new Date().toISOString() });
        setUsers(users);
      }

      localStorage.setItem(SESSION_KEY, JSON.stringify({ email, name, loggedIn: true }));
      showStatus(statusEl, 'Registration successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
    }
  });

  const resendButton = document.querySelector('[data-action="resend-register"]');
  resendButton?.addEventListener('click', () => {
    const email = normalizeEmail(document.getElementById('reg-email')?.value || '');
    if (!email) {
      showStatus(statusEl, 'Enter your email first.', 'error');
      return;
    }
    const otp = generateOtp();
    setOtpState(email, otp);
    showStatus(statusEl, `New OTP sent to ${email}. Demo code: ${otp}`, 'success');
    if (otpInput) otpInput.value = '';
    if (otpInput) otpInput.focus();
  });
};

const handleLoginFlow = () => {
  const form = document.querySelector('.login-form');
  if (!form) return;

  const otpBox = document.getElementById('login-otp-box');
  const emailInput = document.getElementById('login-email');
  const otpInput = document.getElementById('login-otp');
  const statusEl = document.getElementById('login-status');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const action = event.submitter?.dataset.action || 'send-login-otp';
    const email = normalizeEmail(emailInput?.value || '');

    if (action === 'send-login-otp') {
      if (!email) {
        showStatus(statusEl, 'Please enter your email.', 'error');
        return;
      }

      const users = getUsers();
      const exists = users.some((user) => user.email === email);
      if (!exists) {
        showStatus(statusEl, 'No account found for this email. Please register first.', 'error');
        return;
      }

      const otp = generateOtp();
      setOtpState(email, otp);
      showStatus(statusEl, `OTP sent to ${email}. Demo code: ${otp}`, 'success');
      showOtpBox('login-otp-box', true);
      if (otpInput) otpInput.focus();
      return;
    }

    if (action === 'verify-login') {
      const currentOtp = getOtpState();
      const enteredOtp = (otpInput?.value || '').trim();

      if (!currentOtp || currentOtp.email !== email) {
        showStatus(statusEl, 'Please request a new OTP first.', 'error');
        return;
      }

      if (String(currentOtp.otp) !== enteredOtp) {
        showStatus(statusEl, 'Invalid OTP. Please try again.', 'error');
        return;
      }

      const users = getUsers();
      const user = users.find((u) => u.email === email);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email, name: user?.name || 'User', loggedIn: true }));
      showStatus(statusEl, 'Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
    }
  });

  const resendButton = document.querySelector('[data-action="resend-login"]');
  resendButton?.addEventListener('click', () => {
    const email = normalizeEmail(emailInput?.value || '');
    if (!email) {
      showStatus(statusEl, 'Enter your email first.', 'error');
      return;
    }
    const otp = generateOtp();
    setOtpState(email, otp);
    showStatus(statusEl, `New OTP sent to ${email}. Demo code: ${otp}`, 'success');
    if (otpInput) otpInput.value = '';
    if (otpInput) otpInput.focus();
  });
};

handleRegisterFlow();
handleLoginFlow();

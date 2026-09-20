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
const firebaseConfig = {
  apiKey: 'AIzaSyA6JR2JVT-QWyyFyOseVTXqIEs62WVKzBk',
  authDomain: 'up-hackathon-rivals.firebaseapp.com',
  projectId: 'up-hackathon-rivals',
  storageBucket: 'up-hackathon-rivals.firebasestorage.app',
  messagingSenderId: '151906621027',
  appId: '1:151906621027:web:dae1b0942eeb8464014a56'
};

const isFirebaseConfigured = () => Object.values(firebaseConfig).every((value) => value && String(value).trim() !== '');
const getUsers = () => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const setUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const getDb = () => {
  if (window.firebase && isFirebaseConfigured()) {
    if (!window.__upHackathonDb) {
      firebase.initializeApp(firebaseConfig);
      window.__upHackathonDb = firebase.firestore();
    }
    return window.__upHackathonDb;
  }
  return null;
};

const getAuth = () => {
  if (window.firebase && isFirebaseConfigured()) {
    if (!window.__upHackathonAuth) {
      firebase.initializeApp(firebaseConfig);
      window.__upHackathonAuth = firebase.auth();
    }
    return window.__upHackathonAuth;
  }
  return null;
};

const registerWithFirebaseAuth = async (email, password, profile) => {
  const auth = getAuth();
  if (!auth) {
    return { ok: false, error: 'Firebase Auth is not available.' };
  }

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    const userProfile = {
      uid: user.uid,
      name: profile.name,
      email: profile.email,
      college: profile.college,
      phone: profile.phone,
      track: profile.track,
      summary: profile.summary,
      createdAt: profile.createdAt || new Date().toISOString(),
      source: 'website'
    };

    const db = getDb();
    if (db) {
      await db.collection('Users').doc(user.uid).set(userProfile, { merge: true });
    }

    return { ok: true, user: userProfile };
  } catch (error) {
    console.error('Firebase Auth registration failed:', error);
    return { ok: false, error: error.message || 'Registration failed.' };
  }
};

const loginWithFirebaseAuth = async (email, password) => {
  const auth = getAuth();
  if (!auth) {
    return { ok: false, error: 'Firebase Auth is not available.' };
  }

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    return { ok: true, user };
  } catch (error) {
    console.error('Firebase Auth login failed:', error);
    return { ok: false, error: error.message || 'Login failed.' };
  }
};

const syncUserToDatabase = async (user) => {
  const db = getDb();

  if (!db) {
    console.error('Firebase database is not available.');
    return false;
  }

  try {
    await db.collection('Users').doc(user.email).set({
      name: user.name,
      email: user.email,
      college: user.college,
      phone: user.phone,
      track: user.track,
      summary: user.summary,
      createdAt: user.createdAt || new Date().toISOString(),
      source: 'website'
    }, { merge: true });

    console.log('✅ User saved to Firestore:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Firebase Firestore error:', error);
    return false;
  }
};

const findUserByEmail = async (email) => {
  const db = getDb();

  if (db) {
    try {
      const snapshot = await db
        .collection('Users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        return snapshot.docs[0].data();
      }
    } catch (error) {
      console.error('Firebase lookup failed:', error);
    }
  }

  const localUsers = getUsers();
  return localUsers.find((user) => user.email === email) || null;
};

const showStatus = (element, message, type = '') => {
  if (!element) return;
  element.textContent = message;
  element.className = 'status-text';
  if (type) element.classList.add(type);
};

const normalizeEmail = (value) => value.trim().toLowerCase();

const handleRegisterFlow = () => {
  const form = document.querySelector('.register-form');
  if (!form) return;

  const otpBox = document.getElementById('register-otp-box');
  const statusEl = document.getElementById('register-status');
  const otpInput = document.getElementById('register-otp');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const action = event.submitter?.dataset.action || 'send-register-otp';

    const name = document.getElementById('reg-name')?.value.trim();
    const email = normalizeEmail(document.getElementById('reg-email')?.value || '');
    const college = document.getElementById('reg-college')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim();
    const track = document.getElementById('reg-track')?.value;
    const summary = document.getElementById('reg-summary')?.value.trim();

    if (action === 'send-register-otp') {
      const password = document.getElementById('reg-password')?.value || '';

      if (!name || !email || !college || !phone || !password) {
        showStatus(statusEl, 'Please fill in all required fields, including password.', 'error');
        return;
      }

      if (password.length < 6) {
        showStatus(statusEl, 'Password must be at least 6 characters long.', 'error');
        return;
      }

      const profile = {
        name,
        email,
        college,
        phone,
        track,
        summary,
        createdAt: new Date().toISOString()
      };

      const authResult = await registerWithFirebaseAuth(email, password, profile);
      if (!authResult.ok) {
        showStatus(statusEl, authResult.error || 'Registration failed.', 'error');
        return;
      }

      const users = getUsers();
      const existing = users.find((user) => user.email === email);
      if (!existing) {
        users.push(profile);
        setUsers(users);
      }

      await syncUserToDatabase(profile);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email, name, loggedIn: true }));
      showStatus(statusEl, 'Registration successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
    }
  });
};

const handleLoginFlow = () => {
  const form = document.querySelector('.login-form');
  if (!form) return;

  const otpBox = document.getElementById('login-otp-box');
  const emailInput = document.getElementById('login-email');
  const otpInput = document.getElementById('login-otp');
  const statusEl = document.getElementById('login-status');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const action = event.submitter?.dataset.action || 'send-login-otp';
    const email = normalizeEmail(emailInput?.value || '');

    if (action === 'send-login-otp') {
      const password = document.getElementById('login-password')?.value || '';

      if (!email || !password) {
        showStatus(statusEl, 'Please enter both email and password.', 'error');
        return;
      }

      const authResult = await loginWithFirebaseAuth(email, password);
      if (!authResult.ok) {
        showStatus(statusEl, authResult.error || 'Login failed.', 'error');
        return;
      }

      const user = await findUserByEmail(email);
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email, name: user?.name || 'User', loggedIn: true }));
      showStatus(statusEl, 'Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1200);
    }
  });
};

handleRegisterFlow();
handleLoginFlow();

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { auth } from './firebase-config.js';

onAuthStateChanged(auth, (user) => {
  const currentPage = window.location.pathname;
  const isLoginPage = currentPage.includes('login.html');

  if (!user && !isLoginPage) {
    window.location.replace('login.html');
  } else if (user && isLoginPage) {
    window.location.replace('index.html');
  }
});
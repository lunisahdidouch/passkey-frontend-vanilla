const registrationSection = document.getElementById('registrationSection');
const loginSection = document.getElementById('loginSection');
const switchToLoginLink = document.getElementById('switchToLogin');
const switchToRegisterLink = document.getElementById('switchToRegister');
const headerAuthLink = document.getElementById('headerAuthLink');
const pageTitle = document.querySelector('title');

function showLogin() {
    registrationSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    headerAuthLink.textContent = 'Sign up';
    headerAuthLink.href = '#register'; // Update href for semantics if needed
    pageTitle.textContent = 'Login';
}

function showRegistration() {
    loginSection.classList.add('hidden');
    registrationSection.classList.remove('hidden');
    headerAuthLink.textContent = 'Login';
    headerAuthLink.href = '#login'; // Update href for semantics if needed
    pageTitle.textContent = 'Create Account';
}

// Event Listeners
switchToLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
});

switchToRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    showRegistration();
});

headerAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    if (headerAuthLink.textContent.toLowerCase().includes('login')) {
        showLogin();
    } else {
        showRegistration();
    }
});

// Initial state: Show Registration page by default
// Or show based on URL hash, e.g. if #login is present
if (window.location.hash === '#login') {
    showLogin();
} else {
    showRegistration(); // Default
}
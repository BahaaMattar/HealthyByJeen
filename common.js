// Load HTML into a target element
function loadHTML(targetId, file) {
    fetch(file)
        .then(res => res.text())
        .then(data => {
            document.getElementById(targetId).innerHTML = data;

            // If header loaded, initialize its JS
            if (targetId === 'header') {
                initHeader();
                setActiveNavLink();
                updateAuthUI(); // ✅ update header login/profile
            }
        });
}

// Initialize header interactions
function initHeader() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    if (hamburger && navMenu) {
        if (!hamburger.dataset.bound) {
            hamburger.dataset.bound = "true";
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navMenu.classList.toggle('active');
            });
        }
    }

    // ✅ Profile/Login button behavior (both desktop + mobile use .profile-btn)
    const profileBtns = document.querySelectorAll('.profile-btn');
    profileBtns.forEach(btn => {
        if (btn.dataset.bound) return;
        btn.dataset.bound = "true";

        // IMPORTANT: capture = true so we beat any delegated handlers
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            const user = getCurrentUser();

            if (user) {
                window.location.href = "/profile/profile.html";
                return;
            }

            // ✅ NEW: open Component-75 modal if present
            const newModal = document.getElementById("hbjAuth");
            if (newModal) {
                // Prefer the exported function from index.html
                if (typeof openLoginPopup === "function") {
                    openLoginPopup();
                    return;
                }
                // Fallback (if openLoginPopup isn't in scope for some reason)
                if (typeof hbjOpen === "function") {
                    hbjOpen("login");
                    return;
                }

                // As a last fallback, just show it
                newModal.classList.add("show");
                newModal.setAttribute("aria-hidden", "false");
                return;
            }

            // ✅ OLD modal (legacy) support if some pages still have it
            const oldModal = document.getElementById("authModal");
            if (oldModal) {
                openAuthModal("login");
                return;
            }

            // Otherwise go to index and it will open login automatically
            window.location.href = "/index.html?auth=login";
        }, true);
    });
}

// Highlight the current page link
function setActiveNavLink() {
    const links = document.querySelectorAll("header nav a");
    const currentPath = window.location.pathname;

    links.forEach(link => {
        const linkPath = link.getAttribute("href");
        if (linkPath && linkPath.split("/").pop() === currentPath.split("/").pop()) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}

/* ======================================================
   ✅ AUTH (frontend only) — localStorage
   ====================================================== */

const JEEN_ACCOUNTS_KEY = "jeen_accounts_v1";
const JEEN_USER_KEY = "jeen_current_user_v1";

function getAccounts() {
    try { return JSON.parse(localStorage.getItem(JEEN_ACCOUNTS_KEY)) || []; }
    catch { return []; }
}

function saveAccounts(accounts) {
    localStorage.setItem(JEEN_ACCOUNTS_KEY, JSON.stringify(accounts));
}

function findAccount(email) {
    const e = (email || "").toLowerCase().trim();
    return getAccounts().find(a => (a.email || "").toLowerCase() === e) || null;
}

function upsertAccount(account) {
    const accounts = getAccounts();
    const e = (account.email || "").toLowerCase().trim();
    const idx = accounts.findIndex(a => (a.email || "").toLowerCase() === e);

    if (idx >= 0) accounts[idx] = { ...accounts[idx], ...account };
    else accounts.push(account);

    saveAccounts(accounts);
}

function setCurrentUser(user) {
    localStorage.setItem(JEEN_USER_KEY, JSON.stringify(user));
}

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(JEEN_USER_KEY)); }
    catch { return null; }
}

function signOut() {
    localStorage.removeItem(JEEN_USER_KEY);
    updateAuthUI();
}

/**
 * Login rules:
 * - if account not found => { ok:false, code:"NOT_FOUND" }
 * - wrong password => { ok:false, code:"WRONG_PASSWORD" }
 */
function logIn({ email, password }) {
    const acc = findAccount(email);
    if (!acc) return { ok: false, code: "NOT_FOUND", message: "Account not found. Please sign up." };
    if ((acc.password || "") !== (password || "")) return { ok: false, code: "WRONG_PASSWORD", message: "Wrong password." };

    setCurrentUser({ fullName: acc.fullName, email: acc.email });
    updateAuthUI();
    return { ok: true };
}

/**
 * Signup rules:
 * - if exists => { ok:false, code:"EXISTS" }
 * - else => create and login
 */
function signUp({ fullName, email, password, bmr }) {
    const existing = findAccount(email);
    if (existing) return { ok: false, code: "EXISTS", message: "Account already exists. Please log in." };

    const clean = {
        fullName: (fullName || "").trim(),
        email: (email || "").trim(),
        password: (password || ""),
        profile: { phone: "", location: "" },
        bmr: (bmr === "" || bmr === null || typeof bmr === "undefined") ? null : Number(bmr),
        preferences: { goal: "", allergies: "", calorieTarget: "" }
    };

    upsertAccount(clean);
    setCurrentUser({ fullName: clean.fullName, email: clean.email });
    updateAuthUI();
    return { ok: true };
}

// Header button: logged out => "Log in", logged in => profile icon
function updateAuthUI() {
    const user = getCurrentUser();
    const btns = document.querySelectorAll(".profile-btn");

    btns.forEach(btn => {
        // remove old icon if any
        const oldImg = btn.querySelector("img");
        if (oldImg) oldImg.remove();

        if (!user) {
            btn.textContent = "Log in";
            btn.classList.remove("profile-btn--icon");
            return;
        }

        btn.textContent = "";
        btn.classList.add("profile-btn--icon");

        const icon = document.createElement("img");
        icon.src = "/common_elements/profile_icon.png";
        icon.alt = "Profile";
        icon.width = 28;
        icon.height = 28;
        btn.appendChild(icon);
    });
}

/* ======================================================
   ✅ Modal helpers (legacy)
   ====================================================== */

function openAuthModal(tab) {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    modal.classList.add("show");
    showAuthTab(tab || "login");
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (!modal) return;
    modal.classList.remove("show");
}

function showAuthTab(tab) {
    const loginView = document.getElementById("loginView");
    const signupView = document.getElementById("signupView");
    if (!loginView || !signupView) return;

    if (tab === "signup") {
        loginView.classList.add("hidden");
        signupView.classList.remove("hidden");
    } else {
        signupView.classList.add("hidden");
        loginView.classList.remove("hidden");
    }

    // clear errors when switching
    const e1 = document.getElementById("loginErr");
    const e2 = document.getElementById("signupErr");
    if (e1) { e1.style.display = "none"; e1.textContent = ""; }
    if (e2) { e2.style.display = "none"; e2.textContent = ""; }
}

// Click outside to close (safe to call on any page)
function bindAuthModalBackdropClose() {
    document.addEventListener("click", (e) => {
        const modal = document.getElementById("authModal");
        if (modal && e.target === modal) closeAuthModal();

        const bmr = document.getElementById("bmrModal");
        if (bmr && e.target === bmr) closeBmrModal();
    });
}

// ===== BMR calculator (Mifflin-St Jeor) =====
function calculateBMR({ gender, weightKg, heightCm, age }) {
    const w = Number(weightKg), h = Number(heightCm), a = Number(age);
    if (!w || !h || !a) return null;

    const base = (10 * w) + (6.25 * h) - (5 * a);
    if ((gender || "").toLowerCase() === "male") return Math.round(base + 5);
    return Math.round(base - 161);
}

function openBmrModal() {
    const m = document.getElementById("bmrModal");
    if (!m) return;
    m.classList.add("show");
}

function closeBmrModal() {
    const m = document.getElementById("bmrModal");
    if (!m) return;
    m.classList.remove("show");
}

/* ======================================================
   HTML loader
   ====================================================== */
function loadHTML(targetId, file) {
  fetch(file)
    .then(res => res.text())
    .then(data => {
      const el = document.getElementById(targetId);
      if (!el) return;
      el.innerHTML = data;

      if (targetId === "header") {
        initHeader();
        setActiveNavLink();
        updateAuthUI();
      }
    });
}

/* ======================================================
   Header interactions
   ====================================================== */
function initHeader() {
  const hamburger = document.getElementById("hamburger");
  const navMenu = document.getElementById("nav-menu");

  if (hamburger && navMenu) {
    if (!hamburger.dataset.bound) {
      hamburger.dataset.bound = "true";
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
      });
    }
  }

  // Ensure popup exists on ALL pages
  ensureAuthPopup();

  // Profile/Login button behavior (desktop + mobile)
  const profileBtns = document.querySelectorAll(".profile-btn");
  profileBtns.forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "true";

    // Capture true so we beat inline onclick and avoid “refresh”
    btn.addEventListener(
      "click",
      e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const user = getCurrentUser();
        if (user) {
          window.location.href = "/profile/profile.html";
          return false;
        }

        // open component-75 popup everywhere
        openLoginPopup();
        return false;
      },
      true
    );
  });
}

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

  updateCartCount();
}

// Update Cart Count in Navbar
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cartItems")) || [];
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const countElements = document.querySelectorAll(".cart-count");
  countElements.forEach(el => {
    el.innerText = totalCount;
    el.style.display = totalCount > 0 ? "block" : "none";
  });
}

/* ======================================================
   AUTH (frontend only) — localStorage
   ====================================================== */
const JEEN_ACCOUNTS_KEY = "jeen_accounts_v1";
const JEEN_USER_KEY = "jeen_current_user_v1";

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(JEEN_ACCOUNTS_KEY)) || [];
  } catch {
    return [];
  }
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
  try {
    return JSON.parse(localStorage.getItem(JEEN_USER_KEY));
  } catch {
    return null;
  }
}

function signOut() {
  localStorage.removeItem(JEEN_USER_KEY);
  updateAuthUI();
}

function logIn({ email, password }) {
  const acc = findAccount(email);
  if (!acc) return { ok: false, code: "NOT_FOUND", message: "Account not found. Please sign up." };
  if ((acc.password || "") !== (password || "")) return { ok: false, code: "WRONG_PASSWORD", message: "Wrong password." };

  setCurrentUser({ fullName: acc.fullName, email: acc.email });
  updateAuthUI();
  return { ok: true };
}

function signUp({ fullName, email, password }) {
  const existing = findAccount(email);
  if (existing) return { ok: false, code: "EXISTS", message: "Account already exists. Please log in." };

  const clean = {
    fullName: (fullName || "").trim(),
    email: (email || "").trim(),
    password: (password || ""),
    profile: { phone: "", location: "" },
    preferences: { goal: "", allergies: "", calorieTarget: "" }
  };

  upsertAccount(clean);
  setCurrentUser({ fullName: clean.fullName, email: clean.email });
  updateAuthUI();
  return { ok: true };
}

function updateAuthUI() {
  const user = getCurrentUser();
  const btns = document.querySelectorAll(".profile-btn");

  btns.forEach(btn => {
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
   Component-75 Popup (GLOBAL) — injected once
   ====================================================== */
function ensureAuthPopup() {
  // already exists
  if (document.getElementById("hbjAuth")) return;

  // inject minimal CSS (only for popup)
  const style = document.createElement("style");
  style.id = "hbj-auth-style";
  style.textContent = `
    :root{ --hbj-green:#006744; --hbj-accent:#97CA66; --hbj-white:#fff; }
    .hbj-auth-overlay{ position:fixed; inset:0; display:none; align-items:center; justify-content:center;
      padding:18px; background:rgba(0,0,0,.38); z-index:9999; font-family:"Poppins",sans-serif; }
    .hbj-auth-overlay.show{ display:flex; }
    .hbj-auth-card{ width:100%; max-width:520px; background:var(--hbj-green); border-radius:56px;
      padding:40px 42px 34px; position:relative; overflow:hidden; box-shadow:0 24px 70px rgba(0,0,0,.25); }
    .hbj-auth-card::before{ content:""; position:absolute; left:-170px; top:-155px; width:520px; height:520px;
      background-image:url("/common_elements/Vector.png"); background-repeat:no-repeat; background-size:contain;
      background-position:left top; pointer-events:none; z-index:0; }
    .hbj-auth-card > *{ position:relative; z-index:1; }
    .hbj-auth-close{ position:absolute; right:18px; top:16px; width:34px; height:34px; border-radius:50%;
      border:none; background:rgba(255,255,255,.12); color:#fff; font-size:18px; cursor:pointer;
      display:flex; align-items:center; justify-content:center; }
    .hbj-title{ text-align:center; color:#fff; font-weight:800; font-size:34px; margin:18px 0 18px; }
    .hbj-field{ margin-top:16px; } .hbj-label{ color:var(--hbj-accent); font-weight:700; font-size:13px; margin:0 0 8px; }
    .hbj-input{ width:100%; height:36px; border-radius:999px; border:none; outline:none; padding:0 16px; background:#fff;
      font-size:13px; font-weight:500; }
    .hbj-row{ display:flex; justify-content:space-between; align-items:center; margin-top:12px; color:#fff; font-size:12px; font-weight:600; }
    .hbj-check{ display:flex; align-items:center; gap:8px; user-select:none; } .hbj-check input{ width:14px; height:14px; accent-color:var(--hbj-accent); }
    .hbj-link{ border:none; background:transparent; color:#fff; text-decoration:underline; cursor:pointer; font-weight:700; font-size:12px; padding:0; }
    .hbj-btn{ display:block; margin:18px auto 0; min-width:120px; height:28px; border-radius:999px; border:none;
      background:var(--hbj-accent); color:#0b3f2c; font-weight:800; font-size:12px; cursor:pointer; }
    .hbj-divider{ margin:14px auto 10px; width:74%; height:2px; background:rgba(255,255,255,.55); border-radius:99px; }
    .hbj-with{ text-align:center; color:#fff; font-size:12px; font-weight:700; margin-top:10px; }
    .hbj-social{ margin-top:10px; display:flex; justify-content:center; gap:14px; }
    .hbj-icon-btn{ width:36px; height:36px; border-radius:50%; border:2px solid #fff; background:transparent; color:#fff;
      font-weight:900; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px; line-height:1; }
    .hbj-bottom{ margin-top:14px; text-align:center; color:#fff; font-size:12px; font-weight:600; }
    .hbj-error{ display:none; margin-top:12px; text-align:center; color:#ffd6d6; font-size:12px; font-weight:700; }
    .hbj-success{ display:none; margin-top:12px; text-align:center; color:#d8ffe6; font-size:12px; font-weight:700; }
    .hbj-hidden{ display:none; }
    @media (max-width:480px){
      .hbj-auth-card{ border-radius:44px; padding:34px 26px 28px; }
      .hbj-title{ font-size:30px; }
      .hbj-auth-card::before{ width:270px; height:250px; left:-110px; top:-120px; }
    }
  `;
  document.head.appendChild(style);

  // inject markup (LOGIN + SIGNUP only — no BMR)
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div id="hbjAuth" class="hbj-auth-overlay" aria-hidden="true">
      <div class="hbj-auth-card" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
        <button class="hbj-auth-close" type="button" onclick="hbjCloseAuth()" aria-label="Close">✕</button>

        <div id="hbj-login">
          <div class="hbj-title">Log in</div>
          <form id="hbjLoginForm">
            <div class="hbj-field">
              <div class="hbj-label">Email</div>
              <input class="hbj-input" id="hbjLoginEmail" type="email" required autocomplete="email">
            </div>
            <div class="hbj-field">
              <div class="hbj-label">Password</div>
              <input class="hbj-input" id="hbjLoginPassword" type="password" required autocomplete="current-password">
            </div>

            <div class="hbj-row">
              <label class="hbj-check">
                <input id="hbjRemember" type="checkbox">
                <span>Remember me</span>
              </label>
              <button class="hbj-link" type="button" onclick="hbjForgot()">Forgot password?</button>
            </div>

            <button class="hbj-btn" type="submit">Log in</button>

            <div class="hbj-divider"></div>
            <div class="hbj-with">Log in with</div>
            <div class="hbj-social">
              <button class="hbj-icon-btn" type="button" onclick="hbjSocial('facebook')" aria-label="Facebook">f</button>
              <button class="hbj-icon-btn" type="button" onclick="hbjSocial('google')" aria-label="Google">G+</button>
            </div>

            <div id="hbjLoginErr" class="hbj-error"></div>
            <div id="hbjLoginOk" class="hbj-success"></div>

            <div class="hbj-bottom">
              Don’t have an account?
              <button class="hbj-link" type="button" onclick="hbjShow('signup')">Sign up</button>
            </div>
          </form>
        </div>

        <div id="hbj-signup" class="hbj-hidden">
          <div class="hbj-title">Sign up</div>
          <form id="hbjSignupForm">
            <div class="hbj-field">
              <div class="hbj-label">Full Name</div>
              <input class="hbj-input" id="hbjSignupName" type="text" required autocomplete="name">
            </div>
            <div class="hbj-field">
              <div class="hbj-label">Email</div>
              <input class="hbj-input" id="hbjSignupEmail" type="email" required autocomplete="email">
            </div>
            <div class="hbj-field">
              <div class="hbj-label">Password</div>
              <input class="hbj-input" id="hbjSignupPassword" type="password" required autocomplete="new-password">
            </div>

            <button class="hbj-btn" type="submit">Sign up</button>

            <div id="hbjSignupErr" class="hbj-error"></div>
            <div id="hbjSignupOk" class="hbj-success"></div>

            <div class="hbj-bottom">
              Already have an account?
              <button class="hbj-link" type="button" onclick="hbjShow('login')">Log in</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrap.firstElementChild);

  // bind once after injection
  bindAuthPopupEvents();
}

// Global openers
function openLoginPopup() { hbjOpen("login"); return false; }
function openSignupPopup() { hbjOpen("signup"); return false; }

function hbjOpen(screen) {
  ensureAuthPopup();
  const modal = document.getElementById("hbjAuth");
  if (!modal) return;
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  hbjShow(screen || "login");
  hbjClearMsgs();
}

function hbjCloseAuth() {
  const modal = document.getElementById("hbjAuth");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  hbjClearMsgs();
}

function hbjShow(screen) {
  const login = document.getElementById("hbj-login");
  const signup = document.getElementById("hbj-signup");
  if (!login || !signup) return;

  login.classList.add("hbj-hidden");
  signup.classList.add("hbj-hidden");

  if (screen === "signup") signup.classList.remove("hbj-hidden");
  else login.classList.remove("hbj-hidden");

  hbjClearMsgs();
}

function hbjClearMsgs() {
  ["hbjLoginErr", "hbjLoginOk", "hbjSignupErr", "hbjSignupOk"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.style.display = "none"; el.textContent = ""; }
  });
}

function hbjForgot() {
  const ok = document.getElementById("hbjLoginOk");
  const err = document.getElementById("hbjLoginErr");
  if (err) { err.style.display = "none"; err.textContent = ""; }
  if (ok) { ok.style.display = "block"; ok.textContent = "Forgot password is UI only for now."; }
}

function hbjSocial(provider) {
  const ok = document.getElementById("hbjLoginOk");
  const err = document.getElementById("hbjLoginErr");
  if (err) { err.style.display = "none"; err.textContent = ""; }
  if (ok) { ok.style.display = "block"; ok.textContent = `“Log in with ${provider}” is UI only for now.`; }
}

function bindAuthPopupEvents() {
  // Outside click closes
  document.addEventListener("click", e => {
    const overlay = document.getElementById("hbjAuth");
    if (overlay && overlay.classList.contains("show") && e.target === overlay) hbjCloseAuth();
  }, true);

  // ESC closes
  document.addEventListener("keydown", e => {
    const overlay = document.getElementById("hbjAuth");
    if (e.key === "Escape" && overlay?.classList.contains("show")) hbjCloseAuth();
  });

  // Login submit
  document.addEventListener("submit", e => {
    const form = e.target;
    if (!form || form.id !== "hbjLoginForm") return;
    e.preventDefault();

    const email = document.getElementById("hbjLoginEmail").value.trim();
    const password = document.getElementById("hbjLoginPassword").value.trim();

    const err = document.getElementById("hbjLoginErr");
    const ok = document.getElementById("hbjLoginOk");
    if (ok) { ok.style.display = "none"; ok.textContent = ""; }

    const res = logIn({ email, password });
    if (!res?.ok) {
      if (err) { err.style.display = "block"; err.textContent = res?.message || "Login failed."; }
      return;
    }

    if (err) { err.style.display = "none"; err.textContent = ""; }
    hbjCloseAuth();
    updateAuthUI();
  }, true);

  // Signup submit
  document.addEventListener("submit", e => {
    const form = e.target;
    if (!form || form.id !== "hbjSignupForm") return;
    e.preventDefault();

    const fullName = document.getElementById("hbjSignupName").value.trim();
    const email = document.getElementById("hbjSignupEmail").value.trim();
    const password = document.getElementById("hbjSignupPassword").value.trim();

    const err = document.getElementById("hbjSignupErr");
    const ok = document.getElementById("hbjSignupOk");
    if (ok) { ok.style.display = "none"; ok.textContent = ""; }

    const res = signUp({ fullName, email, password });
    if (!res?.ok) {
      if (err) { err.style.display = "block"; err.textContent = res?.message || "Signup failed."; }
      return;
    }

    if (err) { err.style.display = "none"; err.textContent = ""; }
    hbjCloseAuth();
    updateAuthUI();
  }, true);
}

// Ensure popup exists even if a page doesn’t load header (safety)
document.addEventListener("DOMContentLoaded", () => {
  ensureAuthPopup();
  updateAuthUI();
});

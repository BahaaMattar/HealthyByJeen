document.addEventListener("DOMContentLoaded", () => {
  // Must be logged in
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/index.html";
    return;
  }

  // Tabs
  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");
  const subTitle = document.getElementById("subTitle");

  tabs.forEach(t => {
    t.addEventListener("click", () => {
      tabs.forEach(x => x.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      t.classList.add("active");
      const target = document.getElementById(t.dataset.tab);
      if (target) target.classList.add("active");

      subTitle.textContent = (t.dataset.tab === "orders") ? "Previous Orders" : "User info";
    });
  });

  // Load account
  let acc = findAccount(user.email);
  if (!acc) {
    // fallback (shouldn't happen, but safe)
    acc = {
      fullName: user.fullName || "",
      email: user.email,
      password: "",
      profile: { phone: "", location: "" },
      bmr: null
    };
    upsertAccount(acc);
  }

  // Fill UI
  const displayName = document.getElementById("displayName");
  const displayLocation = document.getElementById("displayLocation");

  const fullNameInput = document.getElementById("fullName");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const locationInput = document.getElementById("location");
  const bmrInput = document.getElementById("bmr");

  function renderAccount(a){
    displayName.textContent = a.fullName || "—";
    displayLocation.textContent = a.profile?.location ? a.profile.location : "—";
    fullNameInput.value = a.fullName || "";
    emailInput.value = a.email || "";
    phoneInput.value = a.profile?.phone || "";
    locationInput.value = a.profile?.location || "";
    bmrInput.value = a.bmr ?? "";
  }

  renderAccount(acc);

  // Save profile
  document.getElementById("profileForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const updated = {
      ...acc,
      fullName: fullNameInput.value.trim(),
      email: emailInput.value.trim(),
      profile: {
        phone: phoneInput.value.trim(),
        location: locationInput.value.trim()
      },
      bmr: bmrInput.value ? Number(bmrInput.value) : null
    };

    // If email changed, we treat it as new key (simple approach)
    // Remove old record then insert new
    const accounts = getAccounts().filter(a => (a.email || "").toLowerCase() !== (acc.email || "").toLowerCase());
    saveAccounts(accounts);
    upsertAccount(updated);

    setCurrentUser({ fullName: updated.fullName, email: updated.email });
    updateAuthUI();

    acc = updated;
    renderAccount(acc);

    alert("Saved ✅");
  });

  // Sign out
  document.getElementById("signOutBtn").addEventListener("click", () => {
    signOut();
    window.location.href = "/index.html";
  });

  // BMR modal open/close (Component-75 style)
  const bmrModal = document.getElementById("bmrModal");
  const openBmr = document.getElementById("openBmr");

  // close button is now inside markup with onclick="closeBmrModal()"
  function closeBmrModal(){
    if(!bmrModal) return;
    bmrModal.classList.remove("show");
    bmrModal.setAttribute("aria-hidden", "true");
  }

  function openBmrModal(){
    if(!bmrModal) return;
    bmrModal.classList.add("show");
    bmrModal.setAttribute("aria-hidden", "false");
  }

  if (openBmr) {
    openBmr.addEventListener("click", (e) => {
      e.preventDefault();
      openBmrModal();
    });
  }

  if (bmrModal) {
    bmrModal.addEventListener("click", (e) => {
      if (e.target === bmrModal) closeBmrModal();
    });
  }

  // BMR calculation (same formula, new field IDs)
  document.getElementById("hbjBmrForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const gender = document.getElementById("hbjBmrGender").value;

    // age select values: "18-35" | "35-60" | "60+"
    // We'll use midpoints so calculation still works
    const ageBucket = document.getElementById("hbjBmrAge").value;
    const age = ageBucket === "18-35" ? 26 : (ageBucket === "35-60" ? 47 : 65);

    const height = Number(document.getElementById("hbjBmrHeight").value);
    const weight = Number(document.getElementById("hbjBmrWeight").value);
    const activity = Number(document.getElementById("hbjBmrActivity").value);

    let base = 10 * weight + 6.25 * height - 5 * age + (gender === "Male" ? 5 : -161);
    const calories = Math.round(base * activity);

    // show result inside modal
    const result = document.getElementById("hbjBmrResult");
    if (result) {
      result.style.display = "block";
      result.textContent = `Estimated calories/day: ${calories}`;
    }

    // Save in form + account
    bmrInput.value = calories;
    acc = { ...acc, bmr: calories };
    upsertAccount(acc);

    closeBmrModal();
  });

});

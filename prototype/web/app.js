(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  const views = {
    splash: $("#view-splash"),
    auth: $("#view-auth"),
    otp: $("#view-otp"),
    trips: $("#view-trips"),
    detail: $("#view-trip-detail"),
    me: $("#view-me"),
    home: $("#view-home"),
  };

  let mode = "signin";
  let channel = "email";
  let pendingIdentity = "";
  let resendTimer = null;
  let resendLeft = 30;

  function showView(name) {
    Object.values(views).forEach(v => { if(v) v.classList.remove("is-active"); });
    const target = views[name];
    if (target) target.classList.add("is-active");
    window.scrollTo(0,0);
    // trips/me share bottom padding, ensure background correct
    document.body.style.background = (name === "trips" || name === "detail" || name === "me") ? "#000" : "";
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function getEmailError(v) {
    v = v.trim();
    if (!v) return "Enter your email.";
    if (!v.includes("@")) return "Email must contain @ (e.g. name@gmail.com).";
    if (v.startsWith("@") || v.endsWith("@")) return "Enter a valid email (e.g. name@gmail.com).";
    if (v.includes("..")) return "Email can't contain ..";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email (e.g. name@gmail.com).";
    const domain = v.split("@")[1] || "";
    if (!domain.includes(".")) return "Email domain must contain . (e.g. gmail.com).";
    if (/\s/.test(v)) return "Email can't contain spaces.";
    return null;
  }
  function getPhoneError(v) {
    v = v.trim();
    if (!v) return "Enter your phone number.";
    if (/[a-zA-Z]/.test(v)) return "Phone can't contain letters - 10 digits only.";
    const digits = v.replace(/\D/g, "");
    if (digits.length === 0) return "Enter 10 digits (e.g. 9876543210).";
    if (digits.length < 10) return "Too short - need 10 digits, you entered " + digits.length + ".";
    if (digits.length > 10) {
      if (digits.length === 12 && digits.startsWith("91")) return "Enter 10 digits without +91 (e.g. 9876543210).";
      if (digits.length === 11 && digits.startsWith("0")) return "Enter 10 digits without leading 0.";
      return "Too long - need exactly 10 digits, you entered " + digits.length + ".";
    }
    if (!/^[6-9]\d{9}$/.test(digits)) return "Enter a valid 10-digit Indian mobile (starts with 6-9).";
    return null;
  }

  function syncFieldUI() {
    const label = $("#field-label");
    const input = $("#field-input");
    const hint = $("#field-hint");
    const title = $("#auth-title");
    const sub = $("#auth-sub");
    if (channel === "email") {
      label.textContent = "Email address";
      input.placeholder = "name@gmail.com";
      input.inputMode = "email";
      input.autocomplete = "email";
      input.maxLength = 254;
      hint.textContent = "Use a valid email like name@gmail.com - we'll send a 6-digit OTP.";
    } else {
      label.textContent = "Phone number";
      input.placeholder = "98765 43210";
      input.inputMode = "numeric";
      input.autocomplete = "tel";
      input.maxLength = 14;
      hint.textContent = "Enter exactly 10 digits (e.g. 9876543210) - we'll send a 6-digit OTP.";
    }
    title.textContent = mode === "signin" ? "Welcome back" : "Create account";
    sub.textContent = mode === "signin"
      ? "Sign in with a one-time code."
      : "Sign up - we'll verify you with a one-time code.";
  }

  const SPLASH_MS = 2200;
  let splashTimer = setTimeout(() => showView("auth"), SPLASH_MS);
  const skipBtn = $("#btn-skip-splash");
  if (skipBtn) skipBtn.addEventListener("click", () => {
    clearTimeout(splashTimer);
    showView("auth");
  });

  $$(".seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode;
      $$(".seg-btn").forEach(b => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      syncFieldUI();
    });
  });
  $$(".subseg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      channel = btn.dataset.channel;
      $$(".subseg-btn").forEach(b => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      $("#field-input").value = "";
      $("#field-error").textContent = "";
      syncFieldUI();
      $("#field-input").focus();
    });
  });

  syncFieldUI();

  const fieldInput = $("#field-input");
  if (fieldInput) fieldInput.addEventListener("input", () => {
    $("#field-error").textContent = "";
    if (channel === "phone") {
      const cleaned = fieldInput.value.replace(/[a-zA-Z]/g, "");
      if (cleaned !== fieldInput.value) fieldInput.value = cleaned;
    }
  });

  const authForm = $("#auth-form");
  if (authForm) authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("#field-input");
    const err = $("#field-error");
    const v = input.value.trim();
    const emailErr = channel === "email" ? getEmailError(v) : null;
    const phoneErr = channel === "phone" ? getPhoneError(v) : null;
    const msg = channel === "email" ? emailErr : phoneErr;
    if (msg) {
      err.textContent = msg;
      return;
    }
    err.textContent = "";
    pendingIdentity = v;
    $("#otp-sent-to").textContent = "We sent a code to " + pendingIdentity + " - mock OTP is 123456";
    $$(".otp-input").forEach(i => i.value = "");
    $("#otp-single").value = "";
    $("#otp-error").textContent = "";
    showView("otp");
    startResendCountdown();
    setTimeout(() => $$(".otp-input")[0]?.focus(), 100);
    toast("Mock OTP sent to " + pendingIdentity);
  });

  function startResendCountdown() {
    clearInterval(resendTimer);
    resendLeft = 30;
    $("#resend-sec").textContent = String(resendLeft);
    $("#btn-resend").disabled = true;
    $("#resend-hint").textContent = "Resend in " + resendLeft + "s";
    resendTimer = setInterval(() => {
      resendLeft -= 1;
      $("#resend-sec").textContent = String(resendLeft);
      $("#resend-hint").textContent = resendLeft > 0 ? "Resend in " + resendLeft + "s" : "You can resend now.";
      if (resendLeft <= 0) {
        clearInterval(resendTimer);
        $("#btn-resend").disabled = false;
      }
    }, 1000);
  }

  const btnResend = $("#btn-resend");
  if (btnResend) btnResend.addEventListener("click", () => {
    toast("Mock OTP resent: 123456 to " + pendingIdentity);
    startResendCountdown();
  });
  const btnEdit = $("#btn-edit");
  if (btnEdit) btnEdit.addEventListener("click", () => {
    clearInterval(resendTimer);
    showView("auth");
    $("#field-input").value = pendingIdentity;
    $("#field-input").focus();
  });
  const btnBackAuth = $("#btn-back-to-auth");
  if (btnBackAuth) btnBackAuth.addEventListener("click", () => {
    clearInterval(resendTimer);
    showView("auth");
  });

  const otpInputs = $$(".otp-input");
  otpInputs.forEach((inp, idx) => {
    inp.addEventListener("input", () => {
      inp.value = inp.value.replace(/\D/g, "").slice(0,1);
      if (inp.value && idx < otpInputs.length - 1) otpInputs[idx+1].focus();
      syncSingleFromBoxes();
    });
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !inp.value && idx > 0) {
        otpInputs[idx-1].focus();
        otpInputs[idx-1].value = "";
        syncSingleFromBoxes();
        e.preventDefault();
      }
      if (e.key === "ArrowLeft" && idx > 0) otpInputs[idx-1].focus();
      if (e.key === "ArrowRight" && idx < otpInputs.length - 1) otpInputs[idx+1].focus();
    });
    inp.addEventListener("paste", (e) => {
      const text = (e.clipboardData || window.clipboardData).getData("text") || "";
      const digits = text.replace(/\D/g, "").slice(0,6);
      if (digits.length) {
        e.preventDefault();
        digits.split("").forEach((d,i) => { if (otpInputs[i]) otpInputs[i].value = d; });
        syncSingleFromBoxes();
        const next = Math.min(digits.length, 5);
        otpInputs[next].focus();
      }
    });
  });

  function syncSingleFromBoxes() {
    const v = otpInputs.map(i => i.value).join("");
    $("#otp-single").value = v;
  }
  function syncBoxesFromSingle() {
    const v = $("#otp-single").value.replace(/\D/g, "").slice(0,6);
    v.split("").forEach((d,i) => { if (otpInputs[i]) otpInputs[i].value = d; });
    for (let i=v.length; i<6; i++) if (otpInputs[i]) otpInputs[i].value = "";
  }
  const otpSingle = $("#otp-single");
  if (otpSingle) otpSingle.addEventListener("input", () => {
    otpSingle.value = otpSingle.value.replace(/\D/g, "").slice(0,6);
    syncBoxesFromSingle();
  });

  const otpForm = $("#otp-form");
  if (otpForm) otpForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = ($("#otp-single").value || otpInputs.map(i=>i.value).join("")).replace(/\D/g,"");
    const err = $("#otp-error");
    if (code.length !== 6) {
      err.textContent = "Enter the 6-digit code.";
      return;
    }
    err.textContent = "";
    clearInterval(resendTimer);
    // success -> go to trips
    initTrips();
    showView("trips");
    toast(code === "123456" ? "Verified" : "Verified (test) - " + code);
  });

  // ========== TRIPS LOGIC ==========
  const STORAGE_TRIPS = "nastory_trips_v1";
  const STORAGE_CATS = "nastory_cats_v1";
  const STORAGE_FILTER = "nastory_filter_v1";
  const STORAGE_SORT = "nastory_sort_v1";

  const DEFAULT_CATS = ["Family", "Frnds", "Partner"];
  const DEFAULT_TRIPS = [
    { id:"1", title:"Bangalore 2026", preview:"Sunrise at Ulsoor, coffee and family stories", category:"Family", dateLabel:"September 26", created:"2026-09-26T10:00:00", modified:"2026-09-26T10:00:00" },
    { id:"2", title:"Manali 2024", preview:"Snow trails, maggi and friends forever", category:"Frnds", dateLabel:"September 25", created:"2024-09-25T10:00:00", modified:"2024-09-25T10:00:00" },
    { id:"3", title:"First date with my love", preview:"Oct 7 - the day everything changed", category:"Partner", dateLabel:"September 21", created:"2024-10-07T10:00:00", modified:"2024-09-21T10:00:00" },
    { id:"4", title:"Family trip 2025", preview:"ISB campus, marketplace and warm hugs", category:"Family", dateLabel:"September 21", created:"2025-09-21T10:00:00", modified:"2025-09-21T10:00:00" },
    { id:"5", title:"Frnds trip 2027", preview:"How idea can bring money for organisation", category:"Frnds", dateLabel:"September 15", created:"2027-09-15T10:00:00", modified:"2027-09-15T10:00:00" },
    { id:"6", title:"Goa diaries", preview:"Bakul mess 2 - sunsets and old friends", category:"Frnds", dateLabel:"September 21", created:"2025-09-21T09:00:00", modified:"2025-09-21T09:00:00" },
    { id:"7", title:"Tpo", preview:"Placement talks and late night prep", category:"Uncategorized", dateLabel:"September 25", created:"2025-09-25T08:00:00", modified:"2025-09-25T08:00:00" },
    { id:"8", title:"9i", preview:"Hello so9looophould - random note", category:"Uncategorized", dateLabel:"September 26", created:"2026-09-26T09:00:00", modified:"2026-09-26T09:00:00" },
  ];

  let categories = [];
  let trips = [];
  let currentFilter = "all";
  let currentSearch = "";
  let currentSort = "modified_desc";
  let selectedTripId = null;
  let pendingDeleteId = null;

  function loadState() {
    try {
      const c = JSON.parse(localStorage.getItem(STORAGE_CATS) || "null");
      const t = JSON.parse(localStorage.getItem(STORAGE_TRIPS) || "null");
      const f = localStorage.getItem(STORAGE_FILTER);
      const s = localStorage.getItem(STORAGE_SORT);
      categories = Array.isArray(c) && c.length ? c : [...DEFAULT_CATS];
      trips = Array.isArray(t) && t.length ? t : [...DEFAULT_TRIPS];
      if (f) currentFilter = f;
      if (s) currentSort = s;
    } catch {
      categories = [...DEFAULT_CATS];
      trips = [...DEFAULT_TRIPS];
    }
  }
  function saveState() {
    localStorage.setItem(STORAGE_CATS, JSON.stringify(categories));
    localStorage.setItem(STORAGE_TRIPS, JSON.stringify(trips));
    localStorage.setItem(STORAGE_FILTER, currentFilter);
    localStorage.setItem(STORAGE_SORT, currentSort);
  }

  function initTrips() {
    loadState();
    // apply saved sort radio
    const radio = document.querySelector('input[name="sort"][value="'+currentSort+'"]');
    if (radio) radio.checked = true;
    renderAll();
    updateMe();
  }

  function filteredAndSorted() {
    let list = [...trips];
    // filter by folder
    if (currentFilter !== "all") {
      list = list.filter(t => t.category === currentFilter);
    }
    // search
    if (currentSearch.trim()) {
      const q = currentSearch.trim().toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.preview.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }
    // sort
    list.sort((a,b) => {
      const aC = new Date(a.created).getTime();
      const bC = new Date(b.created).getTime();
      const aM = new Date(a.modified).getTime();
      const bM = new Date(b.modified).getTime();
      if (currentSort === "modified_desc") return bM - aM;
      if (currentSort === "modified_asc") return aM - bM;
      if (currentSort === "created_desc") return bC - aC;
      if (currentSort === "created_asc") return aC - bC;
      return 0;
    });
    return list;
  }

  function renderAll() {
    renderTrips();
    renderFolders();
    renderCreateCategoryOptions();
    updateHeaderCount();
    updateFolderCounts();
  }

  function updateHeaderCount() {
    const count = filteredAndSorted().length;
    $("#header-count").textContent = String(count);
    const nameEl = $("#header-filter-name");
    if (currentSearch) nameEl.textContent = "Search";
    else if (currentFilter === "all") nameEl.textContent = "All";
    else nameEl.textContent = currentFilter;
  }

  function renderTrips() {
    const listEl = $("#trips-list");
    const list = filteredAndSorted();
    listEl.innerHTML = "";
    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "trip-empty";
      empty.innerHTML = '<strong>No trips found</strong><br/><span class="muted small">Try another folder or search</span>';
      listEl.appendChild(empty);
      return;
    }
    list.forEach(t => {
      const row = document.createElement("div");
      row.className = "trip-item";
      row.setAttribute("role","listitem");
      row.dataset.id = t.id;
      row.innerHTML = '<div class="trip-title">'+escapeHtml(t.title)+'</div>'
        + '<div class="trip-preview">'+escapeHtml(t.preview)+'</div>'
        + '<div class="trip-meta"><span class="trip-date">'+escapeHtml(t.dateLabel)+'</span><span class="trip-cat">'+escapeHtml(t.category)+'</span></div>';
      row.addEventListener("click", () => openTrip(t.id));
      listEl.appendChild(row);
    });
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[m])); }

  function renderFolders() {
    const container = $("#folders-my");
    container.innerHTML = "";
    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "folder-row" + (currentFilter===cat ? " is-active" : "");
      btn.dataset.filter = cat;
      btn.type = "button";
      const count = trips.filter(t=>t.category===cat).length;
      btn.innerHTML = '<span class="folder-icon cat">▭</span><span class="folder-name">'+escapeHtml(cat)+'</span><span class="folder-count">'+count+'</span><span class="folder-arrow">›</span>';
      btn.addEventListener("click", () => setFilter(cat));
      container.appendChild(btn);
    });
    // active states for All / Uncategorized
    const allRow = $("#folder-all");
    const uncatRow = $("#folder-uncat");
    if (allRow) allRow.classList.toggle("is-active", currentFilter==="all");
    if (uncatRow) uncatRow.classList.toggle("is-active", currentFilter==="Uncategorized");
  }

  function updateFolderCounts() {
    $("#folder-count-all").textContent = String(trips.length);
    $("#folder-count-uncat").textContent = String(trips.filter(t=>t.category==="Uncategorized").length);
    // per-folder counts are rendered in renderFolders
  }

  function renderCreateCategoryOptions() {
    const sel = $("#create-trip-category");
    if (!sel) return;
    sel.innerHTML = "";
    const opts = ["Uncategorized", ...categories];
    opts.forEach(c => {
      const o = document.createElement("option");
      o.value = c; o.textContent = c;
      sel.appendChild(o);
    });
  }

  function setFilter(f) {
    currentFilter = f;
    saveState();
    renderAll();
    closeDrawer();
  }

  function openTrip(id) {
    const t = trips.find(x=>x.id===id);
    if (!t) return;
    selectedTripId = id;
    $("#detail-title").textContent = t.title;
    $("#detail-h1").textContent = t.title;
    $("#detail-note").textContent = t.preview;
    $("#detail-cat").textContent = t.category;
    $("#detail-meta").textContent = t.dateLabel + " - " + t.category;
    showView("detail");
  }

  function updateMe() {
    $("#me-email").textContent = pendingIdentity || "—";
    $("#me-subtitle").textContent = pendingIdentity ? pendingIdentity : "Not signed in";
    $("#me-count").textContent = String(trips.length);
    $("#me-cats").textContent = String(categories.length);
  }

  // Header actions
  const btnOpenFolders = $("#btn-open-folders");
  const drawerOverlay = $("#drawer-overlay");
  const drawerBackdrop = $("#drawer-backdrop");
  const btnCloseDrawer = $("#btn-close-drawer");
  function openDrawer(){ drawerOverlay.classList.remove("hidden"); }
  function closeDrawer(){ drawerOverlay.classList.add("hidden"); }
  if (btnOpenFolders) btnOpenFolders.addEventListener("click", openDrawer);
  if (drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);
  if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);

  const folderAll = $("#folder-all");
  if (folderAll) folderAll.addEventListener("click", ()=> setFilter("all"));
  const folderUncat = $("#folder-uncat");
  if (folderUncat) folderUncat.addEventListener("click", ()=> setFilter("Uncategorized"));

  // Add category
  const btnAddCat = $("#btn-add-category");
  const addRow = $("#add-category-row");
  const inputNewCat = $("#input-new-category");
  const btnConfirmCat = $("#btn-confirm-category");
  const btnCancelCat = $("#btn-cancel-category");
  if (btnAddCat) btnAddCat.addEventListener("click", ()=>{
    addRow.classList.remove("hidden");
    inputNewCat.value="";
    inputNewCat.focus();
  });
  if (btnCancelCat) btnCancelCat.addEventListener("click", ()=> addRow.classList.add("hidden"));
  if (btnConfirmCat) btnConfirmCat.addEventListener("click", ()=>{
    const v = inputNewCat.value.trim();
    if (!v) { toast("Enter folder name"); return; }
    if (v.length > 20) { toast("Max 20 chars"); return; }
    if (categories.includes(v) || v==="All" || v==="Uncategorized") { toast("Folder exists"); return; }
    categories.push(v);
    saveState();
    renderAll();
    addRow.classList.add("hidden");
    toast("Folder added: "+v);
  });
  if (inputNewCat) inputNewCat.addEventListener("keydown", (e)=>{
    if(e.key==="Enter") btnConfirmCat.click();
    if(e.key==="Escape") addRow.classList.add("hidden");
  });

  // Search
  const btnSearch = $("#btn-search");
  const searchBar = $("#search-bar");
  const searchInput = $("#search-input");
  const btnClearSearch = $("#btn-clear-search");
  if (btnSearch) btnSearch.addEventListener("click", ()=>{
    searchBar.classList.toggle("hidden");
    if (!searchBar.classList.contains("hidden")) searchInput.focus();
  });
  if (searchInput) searchInput.addEventListener("input", ()=>{
    currentSearch = searchInput.value;
    renderAll();
  });
  if (btnClearSearch) btnClearSearch.addEventListener("click", ()=>{
    searchInput.value=""; currentSearch=""; renderAll(); searchBar.classList.add("hidden");
  });

  // Sort
  const btnSort = $("#btn-sort");
  const sortModal = $("#sort-modal");
  const btnSortCancel = $("#btn-sort-cancel");
  function openSort(){ sortModal.classList.remove("hidden"); }
  function closeSort(){ sortModal.classList.add("hidden"); }
  if (btnSort) btnSort.addEventListener("click", openSort);
  if (btnSortCancel) btnSortCancel.addEventListener("click", closeSort);
  if (sortModal) sortModal.addEventListener("click", (e)=>{ if(e.target===sortModal) closeSort(); });
  $$('input[name="sort"]').forEach(r=>{
    r.addEventListener("change", ()=>{
      currentSort = r.value;
      saveState();
      renderAll();
      closeSort();
      toast("Sorted: "+ r.parentElement.textContent.trim());
    });
  });

  // FAB create trip
  const btnFab = $("#btn-fab-add");
  const createModal = $("#create-modal");
  const btnCreateCancel = $("#btn-create-cancel");
  const btnCreateSave = $("#btn-create-save");
  function openCreate(){
    $("#create-trip-title").value="";
    $("#create-trip-note").value="";
    $("#create-error").textContent="";
    renderCreateCategoryOptions();
    createModal.classList.remove("hidden");
    setTimeout(()=> $("#create-trip-title").focus(), 80);
  }
  function closeCreate(){ createModal.classList.add("hidden"); }
  if (btnFab) btnFab.addEventListener("click", openCreate);
  if (btnCreateCancel) btnCreateCancel.addEventListener("click", closeCreate);
  if (createModal) createModal.addEventListener("click", (e)=>{ if(e.target===createModal) closeCreate(); });
  if (btnCreateSave) btnCreateSave.addEventListener("click", ()=>{
    const title = $("#create-trip-title").value.trim();
    const note = $("#create-trip-note").value.trim();
    const cat = $("#create-trip-category").value;
    const errEl = $("#create-error");
    if (!title) { errEl.textContent="Enter trip name"; return; }
    if (title.length < 2) { errEl.textContent="Name too short"; return; }
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-US",{month:"long", day:"numeric"});
    const newTrip = {
      id: String(Date.now()),
      title, preview: note || "No note yet",
      category: cat, dateLabel,
      created: now.toISOString(), modified: now.toISOString()
    };
    trips.unshift(newTrip);
    saveState();
    renderAll();
    closeCreate();
    toast("Trip created: "+title);
  });

  // Detail back / delete
  const btnBackToTrips = $("#btn-back-to-trips");
  if (btnBackToTrips) btnBackToTrips.addEventListener("click", ()=> showView("trips"));
  const btnDeleteTrip = $("#btn-delete-trip");
  const deleteModal = $("#delete-modal");
  const btnDeleteCancel = $("#btn-delete-cancel");
  const btnDeleteConfirm = $("#btn-delete-confirm");
  if (btnDeleteTrip) btnDeleteTrip.addEventListener("click", ()=>{
    const t = trips.find(x=>x.id===selectedTripId);
    if(!t) return;
    pendingDeleteId = selectedTripId;
    $("#delete-msg").textContent = 'Delete "'+t.title+'" ?';
    deleteModal.classList.remove("hidden");
  });
  if (btnDeleteCancel) btnDeleteCancel.addEventListener("click", ()=> deleteModal.classList.add("hidden"));
  if (deleteModal) deleteModal.addEventListener("click", (e)=>{ if(e.target===deleteModal) deleteModal.classList.add("hidden"); });
  if (btnDeleteConfirm) btnDeleteConfirm.addEventListener("click", ()=>{
    if(!pendingDeleteId) return;
    trips = trips.filter(t=>t.id!==pendingDeleteId);
    saveState();
    pendingDeleteId=null;
    deleteModal.classList.add("hidden");
    renderAll();
    showView("trips");
    updateMe();
    toast("Trip deleted");
  });

  // Bottom nav
  $$(".bottom-item").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const nav = btn.dataset.nav;
      if(nav==="trips") { showView("trips"); updateMe(); }
      if(nav==="me") { updateMe(); showView("me"); }
      $$(".bottom-item").forEach(b=>{
        // highlight only those in the active view's nav - simpler: toggle all matching nav
        // we keep active sync by view
      });
      syncBottomNav(nav);
    });
  });
  function syncBottomNav(active){
    $$(".bottom-nav").forEach(nav=>{
      nav.querySelectorAll(".bottom-item").forEach(btn=>{
        btn.classList.toggle("is-active", btn.dataset.nav===active);
      });
    });
  }

  // Me logout
  const btnMeLogout = $("#btn-me-logout");
  if (btnMeLogout) btnMeLogout.addEventListener("click", ()=>{
    pendingIdentity="";
    $("#field-input").value="";
    $$(".otp-input").forEach(i=>i.value="");
    const single = $("#otp-single");
    if(single) single.value="";
    closeDrawer(); closeSort(); closeCreate();
    deleteModal.classList.add("hidden");
    showView("auth");
    toast("Logged out - back to sign in");
  });

  // Allow view-trips to be shown for dev if already authed - check localStorage
  // keyboard: Escape closes modals/drawer
  document.addEventListener("keydown", (e)=>{
    if(e.key==="Escape"){
      closeDrawer(); closeSort(); closeCreate(); deleteModal.classList.add("hidden");
    }
    if(views.splash && views.splash.classList.contains("is-active") && e.key==="Enter"){
      clearTimeout(splashTimer);
      showView("auth");
    }
  });

  // initial Me sync
  updateMe();
})();

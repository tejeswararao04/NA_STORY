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
    editor: $("#view-editor"),
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
    document.body.style.background = (name === "trips" || name === "detail" || name === "me" || name === "editor") ? "#000" : "";
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }
  // expose for inline handlers in editor/detail
  window.toast = toast;

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
  // trips only - no tpo/9i/irrelevant namings
  const DEFAULT_TRIPS = [
    { id:"1", title:"Bangalore 2026", preview:"Sunrise at Ulsoor, coffee and family stories", category:"Family", dateLabel:"September 26", created:"2026-09-26T10:00:00", modified:"2026-09-26T10:00:00", blocks:[{image:null, context:"Sunrise at Ulsoor, coffee and family stories - the city that felt like home."}] },
    { id:"2", title:"Manali 2024", preview:"Snow trails, maggi and friends forever", category:"Frnds", dateLabel:"September 25", created:"2024-09-25T10:00:00", modified:"2024-09-25T10:00:00", blocks:[{image:null, context:"Snow trails, maggi and friends forever - Manali with my squad."}] },
    { id:"3", title:"First date with my love", preview:"Oct 7 - the day everything changed", category:"Partner", dateLabel:"September 21", created:"2024-10-07T10:00:00", modified:"2024-09-21T10:00:00", blocks:[{image:null, context:"Oct 7 - the day everything changed. First coffee, first walk."}] },
    { id:"4", title:"Family trip 2025", preview:"Temples, beaches and home food in South India", category:"Family", dateLabel:"September 21", created:"2025-09-21T10:00:00", modified:"2025-09-21T10:00:00", blocks:[{image:null, context:"Temples, beaches and home food - family trip across South India."}] },
    { id:"5", title:"Frnds trip 2027", preview:"Late nights, startups and Silicon dreams", category:"Frnds", dateLabel:"September 15", created:"2027-09-15T10:00:00", modified:"2027-09-15T10:00:00", blocks:[{image:null, context:"Late nights, startups and Silicon dreams with friends."}] },
    { id:"6", title:"South India Trip 2024", preview:"Kerala backwaters, filter coffee and sunsets", category:"Family", dateLabel:"September 20", created:"2024-09-20T10:00:00", modified:"2024-09-20T10:00:00", blocks:[{image:null, context:"Kerala backwaters, filter coffee and sunsets - South India at its best."}] },
    { id:"7", title:"Goa Gateway 2025", preview:"Bakul mess, sunsets and old friends", category:"Frnds", dateLabel:"September 21", created:"2025-09-21T09:00:00", modified:"2025-09-21T09:00:00", blocks:[{image:null, context:"Bakul mess, sunsets and old friends - Goa that we will never forget."}] },
    { id:"8", title:"Kerala Backwaters 2023", preview:"Houseboat, calm waters and family laughter", category:"Family", dateLabel:"September 18", created:"2023-09-18T10:00:00", modified:"2023-09-18T10:00:00", blocks:[{image:null, context:"Houseboat, calm waters and family laughter - Kerala 2023."}] },
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
      let loadedTrips = Array.isArray(t) && t.length ? t : [...DEFAULT_TRIPS];
      // migrate: ensure trips-related only, drop any tpo/9i style if stored from earlier version
      const badTitles = new Set(["tpo","9i","501684"]);
      loadedTrips = loadedTrips.filter(x=> !badTitles.has(String(x.title).toLowerCase()));
      // if filtered we added new defaults anyway, ensure at least 6 trips
      if (loadedTrips.length < 5) loadedTrips = [...DEFAULT_TRIPS];
      trips = loadedTrips.map(normalizeTrip);
      if (f) currentFilter = f;
      if (s) currentSort = s;
    } catch {
      categories = [...DEFAULT_CATS];
      trips = [...DEFAULT_TRIPS].map(normalizeTrip);
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
    // search across title, preview, category and blocks
    if (currentSearch.trim()) {
      const q = currentSearch.trim().toLowerCase();
      list = list.filter(t => {
        const inTitle = t.title.toLowerCase().includes(q);
        const inPreview = (t.preview||"").toLowerCase().includes(q);
        const inCat = t.category.toLowerCase().includes(q);
        const inBlocks = Array.isArray(t.blocks) && t.blocks.some(b=> (b.context||"").toLowerCase().includes(q));
        return inTitle || inPreview || inCat || inBlocks;
      });
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
    // keep editor category in sync
    renderEditorCategoryOptions();
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
      const preview = getTripPreview(t);
      row.innerHTML = '<div class="trip-title">'+escapeHtml(t.title)+'</div>'
        + '<div class="trip-preview">'+escapeHtml(preview)+'</div>'
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
  }

  // legacy helper kept for compat - now editor does same
  function renderCreateCategoryOptions(){
    renderEditorCategoryOptions();
  }

  function setFilter(f) {
    currentFilter = f;
    saveState();
    renderAll();
    closeDrawer();
  }

  function openTrip(id) {
    const t = normalizeTrip(trips.find(x=>x.id===id) || {});
    if (!t || !t.id) return;
    selectedTripId = id;
    $("#detail-title").textContent = t.title;
    $("#detail-h1").textContent = t.title;
    const preview = getTripPreview(t);
    $("#detail-note").textContent = preview;
    $("#detail-cat").textContent = t.category;
    $("#detail-meta").textContent = t.dateLabel + " - " + t.category;
    // render detail blocks if any
    const detailStory = $("#detail-story");
    if (detailStory) {
      if (Array.isArray(t.blocks) && t.blocks.length) {
        detailStory.innerHTML = t.blocks.map(b=>{
          const img = b.image ? '<img src="'+b.image+'" style="width:100%; max-height:220px; object-fit:cover; border-radius:10px; margin:8px 0; border:1px solid #222" />' : '';
          const ctx = b.context ? '<div style="margin:6px 0; color:#ccc">'+escapeHtml(b.context)+'</div>' : '<div style="color:#666">No context</div>';
          return '<div style="display:flex; gap:10px; align-items:stretch; margin:10px 0; padding:8px; background:#0f0f0f; border:1px solid #1a1a1a; border-radius:10px">'+
            '<div style="width:110px; flex:0 0 110px; border-radius:8px; overflow:hidden; background:#1a1a1a; display:grid; place-items:center">'+ (b.image ? '<img src="'+b.image+'" style="width:100%; height:100%; object-fit:cover"/>' : '<span style="font-size:11px; color:#777">No photo</span>') +'</div>'+
            '<div style="flex:1; font-size:13px; color:#ddd">'+escapeHtml(b.context || "No context")+'</div></div>';
        }).join("");
      } else {
        detailStory.textContent = "Your story will appear here after you generate it. (prototype - story AI later)";
      }
    }
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

  // ===== EDITOR - + button like screenshot (Title + side-by-side photo + context) =====
  const btnFab = $("#btn-fab-add");
  const editorView = $("#view-editor");
  let editorBlocks = []; // {image: dataUrl|null, context: string}
  let pendingPhotoIndex = null;

  function getTripPreview(t){
    if (Array.isArray(t.blocks) && t.blocks.length) {
      const first = t.blocks.find(b=>b.context && b.context.trim()) || t.blocks[0];
      return first.context || t.preview || "";
    }
    return t.preview || "";
  }

  function normalizeTrip(t){
    if (!Array.isArray(t.blocks) || t.blocks.length===0) {
      t.blocks = [{ image: null, context: t.preview || "" }];
    }
    // ensure each block has image/context
    t.blocks = t.blocks.map(b=> ({ image: b.image || null, context: b.context || "" }));
    if (!t.preview) t.preview = getTripPreview(t);
    return t;
  }

  // migrate existing stored trips
  function migrateTrips(){
    trips = trips.map(normalizeTrip);
  }

  function openEditor(){
    // reset
    $("#editor-title").value = "";
    $("#editor-error").textContent = "";
    $("#editor-chars").textContent = "0 characters";
    const now = new Date();
    $("#editor-date").textContent = now.toLocaleDateString("en-US",{month:"numeric", day:"numeric", year:"numeric"}) + ", " + now.toLocaleTimeString("en-US",{hour:"2-digit", minute:"2-digit"});
    editorBlocks = [{ image:null, context:"" }];
    pendingPhotoIndex = null;
    renderEditorCategoryOptions();
    renderEditorBlocks();
    showView("editor");
    setTimeout(()=> $("#editor-title").focus(), 80);
  }
  function closeEditor(){
    showView("trips");
  }

  function renderEditorCategoryOptions(){
    const sel = $("#editor-category");
    if (!sel) return;
    sel.innerHTML = "";
    const opts = ["Uncategorized", ...categories];
    opts.forEach(c=>{
      const o=document.createElement("option");
      o.value=c; o.textContent=c;
      sel.appendChild(o);
    });
    sel.value = categories.includes("Family") ? "Family" : opts[0];
  }

  function renderEditorBlocks(){
    const container = $("#editor-blocks");
    container.innerHTML = "";
    editorBlocks.forEach((b, idx)=>{
      const row = document.createElement("div");
      row.className = "block";
      row.dataset.idx = String(idx);
      const photoHtml = b.image
        ? '<img src="'+b.image+'" alt="photo" />'
        : '<div class="photo-placeholder">Add photo<br/><span style="font-size:10px; color:#777">Gallery / Camera</span></div>';
      const overlay = b.image ? '<div class="photo-overlay"><span>Change</span></div>' : '<div class="photo-overlay"><span>Choose</span></div>';
      row.innerHTML = '<div class="block-photo '+(b.image?'has-image':'')+'" data-photo-idx="'+idx+'">'+photoHtml+overlay+'</div>'
        + '<div class="block-context"><textarea placeholder="What happened here? Write context..." rows="3" data-ctx-idx="'+idx+'">'+escapeHtml(b.context)+'</textarea></div>'
        + '<button class="block-delete" type="button" data-del-idx="'+idx+'">x</button>';
      container.appendChild(row);
    });
    // attach listeners
    container.querySelectorAll("[data-photo-idx]").forEach(el=>{
      el.addEventListener("click", ()=>{
        pendingPhotoIndex = parseInt(el.dataset.photoIdx,10);
        openPhotoChoice();
      });
    });
    container.querySelectorAll("[data-ctx-idx]").forEach(el=>{
      el.addEventListener("input", ()=>{
        const i = parseInt(el.dataset.ctxIdx,10);
        editorBlocks[i].context = el.value;
        updateEditorChars();
      });
    });
    container.querySelectorAll("[data-del-idx]").forEach(el=>{
      el.addEventListener("click", ()=>{
        const i = parseInt(el.dataset.delIdx,10);
        if (editorBlocks.length===1) { toast("At least one block"); return; }
        editorBlocks.splice(i,1);
        renderEditorBlocks();
        updateEditorChars();
      });
    });
    updateEditorChars();
  }

  function updateEditorChars(){
    const title = $("#editor-title").value || "";
    const ctxLen = editorBlocks.reduce((s,b)=> s + (b.context||"").length, 0);
    const total = title.length + ctxLen;
    $("#editor-chars").textContent = total + " characters";
  }

  // photo choice sheet
  const photoChoice = $("#photo-choice");
  const inputGallery = $("#input-gallery");
  const inputCamera = $("#input-camera");
  function openPhotoChoice(){ photoChoice.classList.remove("hidden"); }
  function closePhotoChoice(){ photoChoice.classList.add("hidden"); }
  const btnChooseGallery = $("#btn-choose-gallery");
  const btnTakePhoto = $("#btn-take-photo");
  const btnPhotoCancel = $("#btn-photo-cancel");
  if (btnChooseGallery) btnChooseGallery.addEventListener("click", ()=>{ closePhotoChoice(); inputGallery.click(); });
  if (btnTakePhoto) btnTakePhoto.addEventListener("click", ()=>{ closePhotoChoice(); inputCamera.click(); });
  if (btnPhotoCancel) btnPhotoCancel.addEventListener("click", closePhotoChoice);
  if (photoChoice) photoChoice.addEventListener("click", e=>{ if(e.target===photoChoice) closePhotoChoice(); });

  function handleImageFile(file){
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Choose an image"); return; }
    if (file.size > 8*1024*1024) { toast("Image too large (max 8MB)"); return; }
    const reader = new FileReader();
    reader.onload = ()=>{
      if (pendingPhotoIndex!==null && editorBlocks[pendingPhotoIndex]) {
        editorBlocks[pendingPhotoIndex].image = reader.result;
        renderEditorBlocks();
        toast("Photo added");
      }
    };
    reader.readAsDataURL(file);
  }
  if (inputGallery) inputGallery.addEventListener("change", ()=>{ handleImageFile(inputGallery.files[0]); inputGallery.value=""; });
  if (inputCamera) inputCamera.addEventListener("change", ()=>{ handleImageFile(inputCamera.files[0]); inputCamera.value=""; });

  const editorTitle = $("#editor-title");
  if (editorTitle) editorTitle.addEventListener("input", updateEditorChars);

  const btnAddBlock = $("#btn-add-block");
  if (btnAddBlock) btnAddBlock.addEventListener("click", ()=>{
    editorBlocks.push({ image:null, context:"" });
    renderEditorBlocks();
  });
  const btnToolbarImage = $("#btn-toolbar-image");
  if (btnToolbarImage) btnToolbarImage.addEventListener("click", ()=>{
    editorBlocks.push({ image:null, context:"" });
    renderEditorBlocks();
    // open photo chooser for the new block
    pendingPhotoIndex = editorBlocks.length-1;
    setTimeout(openPhotoChoice, 80);
  });
  const btnToolbarPlus = $("#btn-toolbar-plus");
  if (btnToolbarPlus) btnToolbarPlus.addEventListener("click", ()=>{
    editorBlocks.push({ image:null, context:"" });
    renderEditorBlocks();
  });

  const btnEditorBack = $("#btn-editor-back");
  if (btnEditorBack) btnEditorBack.addEventListener("click", closeEditor);
  const btnEditorSave = $("#btn-editor-save");
  if (btnEditorSave) btnEditorSave.addEventListener("click", ()=>{
    const title = $("#editor-title").value.trim();
    const cat = $("#editor-category").value;
    const errEl = $("#editor-error");
    if (!title) { errEl.textContent = "Enter title (e.g. South India Trip)"; return; }
    if (title.length < 2) { errEl.textContent = "Title too short"; return; }
    const hasContent = editorBlocks.some(b=> b.context.trim() || b.image);
    if (!hasContent) { errEl.textContent = "Add at least one photo or context"; return; }
    errEl.textContent = "";
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-US",{month:"long", day:"numeric"});
    // build preview from first context
    const firstCtx = editorBlocks.find(b=>b.context.trim())?.context || "";
    const preview = firstCtx ? firstCtx.slice(0,80) : (editorBlocks[0].image ? "Photo trip" : "No note yet");
    const newTrip = {
      id: String(Date.now()),
      title, preview,
      category: cat, dateLabel,
      created: now.toISOString(), modified: now.toISOString(),
      blocks: editorBlocks.map(b=> ({ image:b.image, context:b.context }))
    };
    trips.unshift(newTrip);
    saveState();
    renderAll();
    closeEditor();
    toast("Trip saved: "+title);
  });

  if (btnFab) btnFab.addEventListener("click", openEditor);

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
    closeDrawer(); closeSort();
    if (typeof closeEditor === "function") { /* editor is a view, no overlay */ }
    if (deleteModal) deleteModal.classList.add("hidden");
    const pc = $("#photo-choice");
    if (pc) pc.classList.add("hidden");
    showView("auth");
    toast("Logged out - back to sign in");
  });

  // keyboard: Escape closes modals/drawer/editor sheets
  document.addEventListener("keydown", (e)=>{
    if(e.key==="Escape"){
      closeDrawer(); closeSort();
      const pc = $("#photo-choice");
      if (pc) pc.classList.add("hidden");
      if (deleteModal) deleteModal.classList.add("hidden");
      // if editor open, go back to trips
      if (views.editor && views.editor.classList.contains("is-active")) {
        showView("trips");
      }
    }
    if(views.splash && views.splash.classList.contains("is-active") && e.key==="Enter"){
      clearTimeout(splashTimer);
      showView("auth");
    }
  });

  // initial Me sync
  updateMe();
})();

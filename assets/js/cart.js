(() => {
  const STORAGE_KEY = "gawhara-cart-v1";
  const money = (n) =>
    Number(n || 0).toLocaleString("ar-EG", {
      maximumFractionDigits: 0,
    }) + " ج.م";

  const arabicDigits = (n) =>
    String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

  let products = [];
  let cart = loadCart();
  const catFromUrl = new URLSearchParams(window.location.search).get("cat");
  let activeCategory = catFromUrl || "الكل";

  const els = {
    grid: document.getElementById("grid"),
    filters: document.getElementById("filters"),
    search: document.getElementById("search"),
    openCart: document.getElementById("openCart"),
    closeCart: document.getElementById("closeCart"),
    overlay: document.getElementById("overlay"),
    drawer: document.getElementById("drawer"),
    cartBody: document.getElementById("cartBody"),
    cartCount: document.getElementById("cartCount"),
    cartTotal: document.getElementById("cartTotal"),
    clearCart: document.getElementById("clearCart"),
    printCart: document.getElementById("printCart"),
    waCart: document.getElementById("waCart"),
    toast: document.getElementById("toast"),
    printSheet: document.getElementById("print-sheet"),
    year: document.getElementById("year"),
  };

  if (els.year) els.year.textContent = new Date().getFullYear();

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("is-on");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.remove("is-on"), 1800);
  }

  function openDrawer() {
    els.overlay.hidden = false;
    document.body.classList.add("cart-open");
    requestAnimationFrame(() => {
      els.overlay.classList.add("is-open");
      els.drawer.classList.add("is-open");
      els.drawer.setAttribute("aria-hidden", "false");
    });
  }

  function closeDrawer() {
    els.overlay.classList.remove("is-open");
    els.drawer.classList.remove("is-open");
    els.drawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
    setTimeout(() => {
      els.overlay.hidden = true;
    }, 250);
  }

  function cartQtyTotal() {
    return cart.reduce((s, i) => s + Number(i.qty || 0), 0);
  }

  function cartMoneyTotal() {
    return cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 0), 0);
  }

  function updateCartBadge() {
    const q = cartQtyTotal();
    els.cartCount.textContent = arabicDigits(q);
    els.cartCount.dataset.count = String(q);
  }

  function addToCart(product, qty) {
    const amount = Math.max(1, Number(qty) || 1);
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      existing.qty += amount;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        unit: product.unit,
        price: Number(product.price) || 0,
        qty: amount,
        image: product.image,
      });
    }
    saveCart();
    updateCartBadge();
    renderCart();
    showToast("اتضاف للسلة ✓");
  }

  function setItemQty(id, qty) {
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    item.qty = Math.max(1, Number(qty) || 1);
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function removeItem(id) {
    cart = cart.filter((i) => i.id !== id);
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
    updateCartBadge();
    renderCart();
  }

  function renderFilters() {
    const cats = ["الكل", ...new Set(products.map((p) => p.category))];
    els.filters.innerHTML = cats
      .map(
        (c) =>
          `<button type="button" class="chip${c === activeCategory ? " is-on" : ""}" data-cat="${c}">${c}</button>`
      )
      .join("");
  }

  function filteredProducts() {
    const q = (els.search.value || "").trim().toLowerCase();
    return products.filter((p) => {
      const catOk = activeCategory === "الكل" || p.category === activeCategory;
      if (!catOk) return false;
      if (!q) return true;
      const hay = `${p.name} ${p.brand} ${p.desc} ${p.category}`.toLowerCase();
      return hay.includes(q);
    });
  }

  function renderGrid() {
    const list = filteredProducts();
    if (!list.length) {
      els.grid.innerHTML = `<div class="empty">مفيش أصناف مطابقة… جرّب فلتر أو كلمة تانية.</div>`;
      return;
    }
    els.grid.innerHTML = list
      .map((p) => {
        const ask = !p.price;
        return `
        <article class="card" data-id="${p.id}">
          <div class="card-media">
            <img src="${p.image}" alt="${p.name}" loading="lazy" />
            <span class="card-badge">${p.source === "instagram" ? "إنستجرام" : "فيسبوك"}</span>
          </div>
          <div class="card-body">
            <div class="card-cat">${p.category} · ${p.brand}</div>
            <h3>${p.name}</h3>
            <p class="card-desc">${p.desc}</p>
            <div class="card-price${ask ? " is-ask" : ""}">
              ${ask ? "السعر حسب الكمية" : money(p.price)}
              ${ask ? "" : `<small> / ${p.unit}</small>`}
            </div>
            <div class="card-actions">
              <input class="qty-input" type="number" min="1" value="1" aria-label="الكمية" data-qty />
              <button type="button" class="btn btn-red" data-add>أضف للسلة</button>
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  function renderCart() {
    updateCartBadge();
    els.cartTotal.textContent = money(cartMoneyTotal());

    if (!cart.length) {
      els.cartBody.innerHTML = `<p style="color:var(--mute);text-align:center;padding:2rem 0.5rem">السلة فاضيّة. اختار أصناف من الصفحة.</p>`;
      els.waCart.href = "https://wa.me/201092706555";
      return;
    }

    els.cartBody.innerHTML = cart
      .map(
        (i) => `
      <div class="cart-item" data-id="${i.id}">
        <img src="${i.image}" alt="" />
        <div>
          <h4>${i.name}</h4>
          <div class="meta">السعر: ${i.price ? money(i.price) + " / " + i.unit : "حسب الكمية"}</div>
          <div class="cart-controls">
            <div class="qty-stepper" role="group" aria-label="الكمية">
              <button type="button" class="qty-btn" data-qty-dec aria-label="نقص الكمية">−</button>
              <input type="number" min="1" value="${i.qty}" data-cart-qty aria-label="الكمية" />
              <button type="button" class="qty-btn" data-qty-inc aria-label="زود الكمية">+</button>
            </div>
            <button type="button" class="remove" data-remove>امسح</button>
          </div>
        </div>
        <div class="cart-line">${money(i.price * i.qty)}</div>
      </div>`
      )
      .join("");

    const lines = cart
      .map(
        (i) =>
          `• ${i.name} — كمية: ${i.qty} ${i.unit} — سعر: ${i.price} — إجمالي: ${i.price * i.qty}`
      )
      .join("%0A");
    const msg = `السلام عليكم، عايز أطلب القائمة دي:%0A%0A${lines}%0A%0Aالإجمالي: ${cartMoneyTotal()} ج.م`;
    els.waCart.href = `https://wa.me/201092706555?text=${msg}`;
  }

  function buildPrintSheet() {
    const now = new Date().toLocaleString("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const itemCount = arabicDigits(cartQtyTotal());
    const rows = cart
      .map(
        (i, idx) => `
      <tr>
        <td class="ps-num">${arabicDigits(idx + 1)}</td>
        <td class="ps-name">${i.name}</td>
        <td class="ps-qty">${arabicDigits(i.qty)} ${i.unit || ""}</td>
        <td class="ps-price">${i.price ? money(i.price) : "حسب الكمية"}</td>
        <td class="ps-line">${i.price ? money(i.price * i.qty) : "—"}</td>
      </tr>`
      )
      .join("");

    els.printSheet.innerHTML = `
      <div class="ps-accent"></div>
      <header class="ps-header">
        <div class="ps-brand">
          <img src="assets/logo.png" width="52" height="52" alt="شعار الجوهرة" />
          <div>
            <h1>الجوهرة للتوريدات الكهربائية</h1>
            <p class="ps-tag">جملة وقطاعي · فيصل المريوطية</p>
          </div>
        </div>
        <div class="ps-meta">
          <strong>قائمة التسوق</strong>
          <div>${now}</div>
          <div>${itemCount} قطعة</div>
        </div>
      </header>
      <div class="ps-info">
        <span><b>العنوان:</b> ٥ شارع دكتور لاشين، المريوطية فيصل</span>
        <span><b>موبايل:</b> 01092706555</span>
        <span><b>واتساب:</b> 01092706555</span>
      </div>
      <table>
        <thead>
          <tr>
            <th class="ps-num">#</th>
            <th class="ps-name">الصنف</th>
            <th class="ps-qty">الكمية</th>
            <th class="ps-price">السعر</th>
            <th class="ps-line">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="5">مفيش أصناف</td></tr>`}
        </tbody>
        <tfoot>
          <tr>
            <th colspan="4">الإجمالي الكلي</th>
            <td>${money(cartMoneyTotal())}</td>
          </tr>
        </tfoot>
      </table>
      <p class="ps-note">ملاحظة: الأسعار استرشادية للتخطيط — أكّد السعر النهائي مع المحل أو واتساب قبل الشراء.</p>
      <footer class="ps-footer">
        <span>الجوهرة للتوريدات الكهربائية</span>
        <span>واتساب · فيسبوك · إنستجرام</span>
      </footer>
    `;
  }

  function printList() {
    if (!cart.length) {
      showToast("السلة فاضيّة");
      return;
    }
    buildPrintSheet();
    window.print();
  }

  els.grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add]");
    if (!btn) return;
    const card = btn.closest(".card");
    const product = products.find((p) => p.id === card.dataset.id);
    if (!product) return;
    const qty = card.querySelector("[data-qty]")?.value || 1;
    addToCart(product, qty);
  });

  els.filters.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat]");
    if (!chip) return;
    activeCategory = chip.dataset.cat;
    const url = new URL(window.location.href);
    if (activeCategory === "الكل") url.searchParams.delete("cat");
    else url.searchParams.set("cat", activeCategory);
    history.replaceState(null, "", url);
    renderFilters();
    renderGrid();
  });

  els.search.addEventListener("input", () => renderGrid());

  els.cartBody.addEventListener("change", (e) => {
    const row = e.target.closest(".cart-item");
    if (!row) return;
    if (e.target.matches("[data-cart-qty]")) setItemQty(row.dataset.id, e.target.value);
  });

  els.cartBody.addEventListener("click", (e) => {
    const row = e.target.closest(".cart-item");
    if (!row) return;
    const id = row.dataset.id;
    if (e.target.closest("[data-remove]")) {
      removeItem(id);
      return;
    }
    if (e.target.closest("[data-qty-inc]")) {
      const item = cart.find((i) => i.id === id);
      if (item) setItemQty(id, Number(item.qty) + 1);
      return;
    }
    if (e.target.closest("[data-qty-dec]")) {
      const item = cart.find((i) => i.id === id);
      if (item) setItemQty(id, Number(item.qty) - 1);
    }
  });

  els.openCart.addEventListener("click", openDrawer);
  els.closeCart.addEventListener("click", closeDrawer);
  els.overlay.addEventListener("click", closeDrawer);
  els.clearCart.addEventListener("click", () => {
    clearCart();
    showToast("السلة اتفضّت");
  });
  els.printCart.addEventListener("click", printList);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  fetch("assets/catalog/products.json")
    .then((r) => r.json())
    .then((data) => {
      products = data.products || [];
      const cats = new Set(products.map((p) => p.category));
      if (activeCategory !== "الكل" && !cats.has(activeCategory)) {
        activeCategory = "الكل";
      }
      renderFilters();
      renderGrid();
      renderCart();
    })
    .catch(() => {
      els.grid.innerHTML = `<div class="empty">مقدرناش نحمّل الأصناف. تأكد إن السيرفر شغال.</div>`;
    });
})();

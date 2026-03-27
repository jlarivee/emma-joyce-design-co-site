(function () {
  const products = window.EMMA_PRODUCTS || [];
  const storageKey = "emma-joyce-cart";
  const productMap = Object.fromEntries(products.map((product) => [product.id, product]));

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(storageKey, JSON.stringify(cart));
    updateCartCount(cart);
  }

  function updateCartCount(cart) {
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = String(cart.length);
    });
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value);
  }

  function addToCart(productId, note) {
    const cart = loadCart();
    const product = productMap[productId];
    if (!product) return;

    cart.push({
      productId: productId,
      note: note || "",
      quantity: 1,
      addedAt: Date.now()
    });

    saveCart(cart);
    renderCartDrawer();
    renderCheckout();
    toggleCart(true);
  }

  function removeFromCart(index) {
    const cart = loadCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCartDrawer();
    renderCheckout();
  }

  function productCard(product) {
    return `
      <article class="product-card">
        <img class="product-image" src="${product.image}" alt="${product.name}" />
        <div class="product-content">
          <div class="product-meta">
            <span class="pill">${product.category}</span>
            <strong>${formatPrice(product.price)}</strong>
          </div>
          <h3>${product.name}</h3>
          <p>${product.description}</p>
          <div class="product-actions">
            <button class="secondary-link" data-quick-view="${product.id}" type="button">Quick View</button>
            <button class="primary-link" data-add-cart="${product.id}" type="button">Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }

  function bindProductButtons() {
    document.querySelectorAll("[data-quick-view]").forEach((button) => {
      button.onclick = function () {
        openModal(button.getAttribute("data-quick-view"));
      };
    });

    document.querySelectorAll("[data-add-cart]").forEach((button) => {
      button.onclick = function () {
        addToCart(button.getAttribute("data-add-cart"), "Added from product grid");
      };
    });
  }

  function renderFeaturedGrids() {
    document.querySelectorAll("[data-product-grid]").forEach((grid) => {
      const limit = Number(grid.getAttribute("data-limit") || products.length);
      grid.innerHTML = products.slice(0, limit).map(productCard).join("");
    });
    bindProductButtons();
  }

  function renderShopPage() {
    const shopGrid = document.getElementById("shopGrid");
    const searchInput = document.getElementById("searchInput");
    const filterRow = document.getElementById("filterRow");

    if (!shopGrid || !filterRow) return;

    const filters = ["All", ...new Set(products.map((product) => product.category))];
    let activeFilter = "All";
    let search = "";

    function renderFilters() {
      filterRow.innerHTML = filters
        .map(
          (filter) =>
            `<button class="filter-chip${filter === activeFilter ? " active" : ""}" data-filter="${filter}" type="button">${filter}</button>`
        )
        .join("");
    }

    function renderProducts() {
      const visibleProducts = products.filter((product) => {
        const matchesFilter = activeFilter === "All" || product.category === activeFilter;
        const haystack = `${product.name} ${product.eventType} ${product.category} ${product.description}`.toLowerCase();
        return matchesFilter && haystack.includes(search.toLowerCase());
      });

      shopGrid.innerHTML = visibleProducts.length
        ? visibleProducts.map(productCard).join("")
        : '<p class="empty-state">No products match that search yet.</p>';

      bindProductButtons();
    }

    filterRow.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      activeFilter = button.getAttribute("data-filter");
      renderFilters();
      renderProducts();
    });

    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        search = event.target.value;
        renderProducts();
      });
    }

    renderFilters();
    renderProducts();
  }

  function openModal(productId) {
    const product = productMap[productId];
    const modal = document.getElementById("productModal");
    const modalLayout = document.getElementById("modalLayout");

    if (!product || !modal || !modalLayout) return;

    modalLayout.innerHTML = `
      <div>
        <img class="modal-image" src="${product.image}" alt="${product.name}" />
      </div>
      <div class="modal-copy">
        <p class="eyebrow">${product.eventType}</p>
        <h2>${product.name}</h2>
        <div class="modal-price-row">
          <strong>${formatPrice(product.price)}</strong>
          <span class="pill">${product.category}</span>
        </div>
        <p>${product.details}</p>
        <div class="tag-row">${product.tags.map((tag) => `<span class="pill">${tag}</span>`).join("")}</div>
        <label>
          Personalization Notes
          <textarea id="productNotes" rows="4" placeholder="Names, event date, colors, wording, or special requests"></textarea>
        </label>
        <div class="product-actions">
          <button class="primary-link" id="modalAddButton" type="button">Add Customized Item</button>
          <a class="secondary-link" href="${product.etsyUrl}" target="_blank" rel="noreferrer">View on Etsy</a>
        </div>
      </div>
    `;

    modal.showModal();

    document.getElementById("modalAddButton").addEventListener("click", () => {
      const notes = document.getElementById("productNotes").value.trim();
      addToCart(productId, notes || "Personalization to be confirmed");
      modal.close();
    });
  }

  function toggleCart(open) {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
  }

  function renderCartDrawer() {
    const drawerItems = document.getElementById("cartItems");
    const drawerTotal = document.getElementById("cartTotal");
    const cart = loadCart();

    if (!drawerItems || !drawerTotal) return;

    if (!cart.length) {
      drawerItems.innerHTML = '<p class="empty-state">Your cart is empty right now.</p>';
      drawerTotal.textContent = "$0";
      return;
    }

    drawerItems.innerHTML = cart
      .map((item, index) => {
        const product = productMap[item.productId];
        return `
          <article class="cart-item">
            <div class="cart-item-top">
              <strong>${product.name}</strong>
              <strong>${formatPrice(product.price)}</strong>
            </div>
            <small>${product.category} | ${product.eventType}</small>
            <p>${item.note || "No customization notes yet."}</p>
            <button class="secondary-link" data-remove-cart="${index}" type="button">Remove</button>
          </article>
        `;
      })
      .join("");

    drawerTotal.textContent = formatPrice(
      cart.reduce((sum, item) => sum + (productMap[item.productId] ? productMap[item.productId].price : 0), 0)
    );

    drawerItems.querySelectorAll("[data-remove-cart]").forEach((button) => {
      button.onclick = function () {
        removeFromCart(Number(button.getAttribute("data-remove-cart")));
      };
    });
  }

  function renderCheckout() {
    const checkoutList = document.getElementById("checkoutItems");
    const checkoutTotal = document.getElementById("checkoutTotal");
    const checkoutEmpty = document.getElementById("checkoutEmpty");
    const cart = loadCart();

    if (!checkoutList || !checkoutTotal) return;

    if (!cart.length) {
      checkoutList.innerHTML = "";
      checkoutTotal.textContent = "$0";
      if (checkoutEmpty) checkoutEmpty.hidden = false;
      return;
    }

    if (checkoutEmpty) checkoutEmpty.hidden = true;

    checkoutList.innerHTML = cart
      .map((item, index) => {
        const product = productMap[item.productId];
        return `
          <article class="checkout-item">
            <img src="${product.image}" alt="${product.name}" />
            <div>
              <strong>${product.name}</strong>
              <p>${item.note || "Personalization to be confirmed."}</p>
              <button class="text-button" type="button" data-remove-checkout="${index}">Remove</button>
            </div>
            <strong>${formatPrice(product.price)}</strong>
          </article>
        `;
      })
      .join("");

    checkoutTotal.textContent = formatPrice(
      cart.reduce((sum, item) => sum + (productMap[item.productId] ? productMap[item.productId].price : 0), 0)
    );

    checkoutList.querySelectorAll("[data-remove-checkout]").forEach((button) => {
      button.onclick = function () {
        removeFromCart(Number(button.getAttribute("data-remove-checkout")));
      };
    });
  }

  function bindCommonUi() {
    document.querySelectorAll("[data-open-cart]").forEach((button) => {
      button.addEventListener("click", () => toggleCart(true));
    });

    const closeCart = document.getElementById("closeCartButton");
    if (closeCart) closeCart.addEventListener("click", () => toggleCart(false));

    const closeModal = document.getElementById("closeModalButton");
    const modal = document.getElementById("productModal");
    if (closeModal && modal) {
      closeModal.addEventListener("click", () => modal.close());
      modal.addEventListener("click", (event) => {
        const box = modal.getBoundingClientRect();
        const inBounds =
          box.top <= event.clientY &&
          event.clientY <= box.top + box.height &&
          box.left <= event.clientX &&
          event.clientX <= box.left + box.width;
        if (!inBounds) modal.close();
      });
    }

    document.querySelectorAll("[data-checkout-form]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const confirmation = document.getElementById("checkoutConfirmation");
        if (confirmation) confirmation.hidden = false;
      });
    });
  }

  function init() {
    updateCartCount(loadCart());
    renderFeaturedGrids();
    renderShopPage();
    renderCartDrawer();
    renderCheckout();
    bindCommonUi();
  }

  document.addEventListener("DOMContentLoaded", init);
})();

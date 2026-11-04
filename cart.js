const CART_STORAGE_KEY = 'rybatsiuga-cart-v1';
const GIFT_THRESHOLD = 2000;
const MAX_ITEM_QUANTITY = 99;

const cartMarkup = `
  <div class="scrim" data-cart-close aria-hidden="true"></div>
  <aside class="cart-drawer" role="dialog" aria-modal="true" aria-labelledby="cart-title" aria-hidden="true">
    <div class="drawer-head">
      <h1 id="cart-title">Кошик <span data-cart-heading-count aria-live="polite">0 товарів</span></h1>
      <button class="close-drawer" type="button" data-cart-close aria-label="Закрити кошик">×</button>
    </div>
    <div class="drawer-content" data-cart-items></div>
    <div class="cart-summary">
      <div class="summary-row"><span data-cart-summary-count>Товари · 0 шт.</span><span data-cart-subtotal>0 грн</span></div>
      <div class="summary-row summary-total"><span>Разом</span><span data-cart-total>0 грн</span></div>
      <p>За тарифами Нової пошти.<br>Оплата доставки при отриманні.</p>
      <div class="summary-actions">
        <button class="btn btn-outline" type="button" data-cart-close>Продовжити покупки</button>
        <button class="btn" type="button" data-checkout>Оформити замовлення</button>
      </div>
    </div>
  </aside>
`;

if (!document.querySelector('.cart-drawer')) {
  document.body.insertAdjacentHTML('beforeend', cartMarkup);
}

const cartPage = document.body;
const cartDrawer = document.querySelector('.cart-drawer');
const cartScrim = document.querySelector('.scrim');
const cartItemsContainer = cartDrawer.querySelector('[data-cart-items]');
const cartHeadingCount = cartDrawer.querySelector('[data-cart-heading-count]');
const cartSummaryCount = cartDrawer.querySelector('[data-cart-summary-count]');
const cartSubtotal = cartDrawer.querySelector('[data-cart-subtotal]');
const cartTotal = cartDrawer.querySelector('[data-cart-total]');
const closeCartButton = cartDrawer.querySelector('.close-drawer');
const checkoutButton = cartDrawer.querySelector('[data-checkout]');
const reduceCartMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let cartItems = loadCart();
let cartTrigger = null;
let closeFallback = null;
let inertedElements = [];

function normalizeCartItem(item) {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const price = Number(item.price);
  const quantity = Math.min(MAX_ITEM_QUANTITY, Math.max(1, Number.parseInt(item.quantity, 10) || 1));
  const image = typeof item.image === 'string' && item.image.startsWith('assets/')
    ? item.image
    : 'assets/viewed-reel.png';

  if (!item.id || !item.name || !Number.isFinite(price) || price < 0) {
    return null;
  }

  return {
    id: String(item.id),
    sku: String(item.sku || item.id),
    name: String(item.name),
    variant: String(item.variant || ''),
    price,
    image,
    quantity
  };
}

function loadCart() {
  try {
    const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : [];

    if (!Array.isArray(parsedValue)) {
      throw new Error('Invalid cart value');
    }

    return parsedValue.map(normalizeCartItem).filter(Boolean);
  } catch {
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore storage access errors and continue with an empty in-memory cart.
    }
    return [];
  }
}

function saveCart() {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch {
    // The cart still works for the current page if storage is unavailable.
  }
}

function formatPrice(value) {
  return `${new Intl.NumberFormat('uk-UA').format(value)} грн`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[character]));
}

function itemKey(item) {
  return `${item.id}::${item.sku}`;
}

function totalQuantity() {
  return cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

function totalPrice() {
  return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function quantityLabel(quantity) {
  const lastTwoDigits = quantity % 100;
  const lastDigit = quantity % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return `${quantity} товарів`;
  }

  if (lastDigit === 1) {
    return `${quantity} товар`;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return `${quantity} товари`;
  }

  return `${quantity} товарів`;
}

function renderCartBadges(quantity) {
  document.querySelectorAll('a.nav-icon[href="cart.html"]').forEach((link) => {
    let badge = link.querySelector('.cart-badge');

    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'cart-badge';
      badge.setAttribute('aria-label', 'Кількість товарів у кошику');
      link.append(badge);
    }

    badge.textContent = quantity > 99 ? '99+' : String(quantity);
    badge.hidden = quantity === 0;
  });
}

function renderCartItem(item) {
  const key = escapeHtml(itemKey(item));
  const variant = item.variant ? `<p>${escapeHtml(item.variant)}</p>` : '';

  return `
    <article class="cart-item surface" data-cart-key="${key}">
      <div class="cart-item-top">
        <img src="${escapeHtml(item.image)}" width="95" height="95" alt="${escapeHtml(item.name)}">
        <div class="cart-item-copy">
          <h2>${escapeHtml(item.name)}</h2>
          ${variant}
          <span class="in-stock">✓ В наявності</span>
        </div>
      </div>
      <div class="cart-item-bottom">
        <div class="qty" aria-label="Кількість товару">
          <button type="button" data-cart-action="decrease" aria-label="Зменшити кількість" ${item.quantity === 1 ? 'disabled' : ''}>−</button>
          <strong aria-live="polite">${item.quantity}</strong>
          <button type="button" data-cart-action="increase" aria-label="Збільшити кількість" ${item.quantity >= MAX_ITEM_QUANTITY ? 'disabled' : ''}>+</button>
        </div>
        <strong>${formatPrice(item.price * item.quantity)}</strong>
        <button type="button" class="trash" data-cart-action="remove" aria-label="Видалити ${escapeHtml(item.name)}">×</button>
      </div>
    </article>
  `;
}

function renderGift(total) {
  const remaining = Math.max(0, GIFT_THRESHOLD - total);
  const progress = Math.min(100, Math.round((total / GIFT_THRESHOLD) * 100));
  const title = remaining > 0
    ? `Ще ${formatPrice(remaining)} —<br>і подарунок до замовлення`
    : 'Подарунок уже додано до замовлення';

  return `
    <section class="gift-box">
      <h3>${title}</h3>
      <div class="progress" role="progressbar" aria-label="Прогрес до подарунка" aria-valuemin="0" aria-valuemax="${GIFT_THRESHOLD}" aria-valuenow="${Math.min(total, GIFT_THRESHOLD)}"><i style="width: ${progress}%"></i></div>
      <small>${formatPrice(total)} із ${formatPrice(GIFT_THRESHOLD)} · Деталі акції</small>
    </section>
  `;
}

function renderCart() {
  const quantity = totalQuantity();
  const total = totalPrice();

  if (cartItems.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <span aria-hidden="true">🛒</span>
        <h2>Кошик порожній</h2>
        <p>Додайте товари з каталогу — вони збережуться у цьому браузері.</p>
      </div>
    `;
  } else {
    cartItemsContainer.innerHTML = `${cartItems.map(renderCartItem).join('')}${renderGift(total)}`;
  }

  cartHeadingCount.textContent = quantityLabel(quantity);
  cartSummaryCount.textContent = `Товари · ${quantity} шт.`;
  cartSubtotal.textContent = formatPrice(total);
  cartTotal.textContent = formatPrice(total);
  checkoutButton.disabled = cartItems.length === 0;
  renderCartBadges(quantity);
}

function commitCart(mutator) {
  mutator(cartItems);
  saveCart();
  renderCart();
}

function addItemFromButton(button) {
  const item = normalizeCartItem({
    id: button.dataset.productId,
    sku: button.dataset.sku,
    name: button.dataset.name,
    variant: button.dataset.variant,
    price: button.dataset.priceValue,
    image: button.dataset.image,
    quantity: 1
  });

  if (!item) {
    return;
  }

  commitCart((items) => {
    const existingItem = items.find((storedItem) => itemKey(storedItem) === itemKey(item));

    if (existingItem) {
      existingItem.quantity = Math.min(MAX_ITEM_QUANTITY, existingItem.quantity + 1);
    } else {
      items.push(item);
    }
  });
}

function updateItem(key, action) {
  commitCart((items) => {
    const itemIndex = items.findIndex((item) => itemKey(item) === key);

    if (itemIndex < 0) {
      return;
    }

    if (action === 'remove') {
      items.splice(itemIndex, 1);
      return;
    }

    const item = items[itemIndex];

    if (action === 'increase') {
      item.quantity = Math.min(MAX_ITEM_QUANTITY, item.quantity + 1);
    }

    if (action === 'decrease') {
      item.quantity = Math.max(1, item.quantity - 1);
    }
  });
}

function setBackgroundInert(isInert) {
  if (isInert) {
    inertedElements = Array.from(document.body.children).filter((element) => (
      element !== cartDrawer && element !== cartScrim && element.tagName !== 'SCRIPT' && !element.inert
    ));
    inertedElements.forEach((element) => { element.inert = true; });
    return;
  }

  inertedElements.forEach((element) => { element.inert = false; });
  inertedElements = [];
}

function cartFocusableElements() {
  return Array.from(cartDrawer.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'));
}

function finishClosingCart() {
  if (!cartPage.classList.contains('is-closing')) {
    return;
  }

  window.clearTimeout(closeFallback);
  cartPage.classList.remove('cart-open', 'is-closing');
  cartDrawer.setAttribute('aria-hidden', 'true');
  setBackgroundInert(false);

  if (cartTrigger?.isConnected) {
    cartTrigger.focus();
  }
}

function openCart(trigger = null) {
  if (cartPage.classList.contains('cart-open')) {
    return;
  }

  cartTrigger = trigger || document.activeElement;
  cartPage.classList.remove('is-closing');
  cartPage.classList.add('cart-open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  setBackgroundInert(true);
  closeCartButton.focus({ preventScroll: true });
}

function closeCart() {
  if (!cartPage.classList.contains('cart-open') || cartPage.classList.contains('is-closing')) {
    return;
  }

  if (reduceCartMotion.matches) {
    cartPage.classList.add('is-closing');
    finishClosingCart();
    return;
  }

  cartPage.classList.add('is-closing');
  closeFallback = window.setTimeout(finishClosingCart, 550);
}

function trapCartFocus(event) {
  const focusableElements = cartFocusableElements();

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add-to-cart]');

  if (addButton) {
    event.preventDefault();
    addItemFromButton(addButton);
    openCart(addButton);
    return;
  }

  const cartLink = event.target.closest('a[href="cart.html"]');

  if (cartLink) {
    event.preventDefault();
    openCart(cartLink);
    return;
  }

  if (event.target.closest('[data-cart-close]')) {
    event.preventDefault();
    closeCart();
    return;
  }

  const actionButton = event.target.closest('[data-cart-action]');

  if (actionButton) {
    const itemElement = actionButton.closest('[data-cart-key]');
    const key = itemElement.dataset.cartKey;
    const action = actionButton.dataset.cartAction;
    updateItem(key, action);

    if (action !== 'remove') {
      const updatedItem = Array.from(cartDrawer.querySelectorAll('[data-cart-key]')).find((item) => item.dataset.cartKey === key);
      const actionControl = updatedItem?.querySelector(`[data-cart-action="${action}"]:not([disabled])`)
        || updatedItem?.querySelector('[data-cart-action]:not([disabled])');
      actionControl?.focus();
    } else {
      closeCartButton.focus();
    }
    return;
  }

  if (event.target.closest('[data-checkout]') && cartItems.length > 0) {
    window.location.href = 'login.html';
  }
});

document.addEventListener('keydown', (event) => {
  if (!cartPage.classList.contains('cart-open')) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeCart();
  }

  if (event.key === 'Tab') {
    trapCartFocus(event);
  }
});

cartDrawer.addEventListener('animationend', (event) => {
  if (event.target === cartDrawer && cartPage.classList.contains('is-closing')) {
    finishClosingCart();
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === CART_STORAGE_KEY) {
    cartItems = loadCart();
    renderCart();
  }
});

renderCart();

if (cartPage.classList.contains('cart-page')) {
  openCart();
}

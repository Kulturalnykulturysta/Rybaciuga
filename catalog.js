const filterForm = document.querySelector('.filter-row');
const searchInput = filterForm.querySelector('input[name="q"]');
const priceSelect = filterForm.querySelector('select[name="price"]');
const categorySelect = filterForm.querySelector('select[name="category"]');
const productCards = Array.from(document.querySelectorAll('[data-product-card]'));
const emptyState = document.querySelector('[data-catalog-empty]');
const urlFilters = new URLSearchParams(window.location.search);

function normalizeText(value) {
  return String(value || '').trim().toLocaleLowerCase('uk-UA');
}

function matchesPrice(price, range) {
  if (range === '0-500') return price <= 500;
  if (range === '500-1500') return price > 500 && price <= 1500;
  if (range === '1500-3000') return price > 1500 && price <= 3000;
  if (range === '3000-plus') return price > 3000;
  return true;
}

function applyInitialFilters() {
  const requestedQuery = urlFilters.get('q');
  const requestedCategory = urlFilters.get('category');
  const requestedPrice = urlFilters.get('price');

  if (requestedQuery) {
    searchInput.value = requestedQuery;
  }

  if (requestedCategory) {
    const matchingOption = Array.from(categorySelect.options).find((option) => (
      normalizeText(option.value) === normalizeText(requestedCategory)
    ));

    if (matchingOption) {
      categorySelect.value = matchingOption.value;
    } else {
      categorySelect.add(new Option(`Категорія: ${requestedCategory}`, requestedCategory, false, true));
    }
  }

  if (requestedPrice && Array.from(priceSelect.options).some((option) => option.value === requestedPrice)) {
    priceSelect.value = requestedPrice;
  }
}

function filterProducts() {
  const query = normalizeText(searchInput.value);
  const category = normalizeText(categorySelect.value);
  const priceRange = priceSelect.value;
  let visibleCount = 0;

  productCards.forEach((card) => {
    const matchesQuery = !query || normalizeText(card.dataset.name).includes(query);
    const matchesCategory = category === 'all' || normalizeText(card.dataset.category).includes(category);
    const price = Number(card.dataset.price);
    const shouldShow = matchesQuery && matchesCategory && matchesPrice(price, priceRange);

    card.hidden = !shouldShow;
    if (shouldShow) visibleCount += 1;
  });

  emptyState.hidden = visibleCount > 0;
}

applyInitialFilters();

const filterSelects = document.querySelectorAll('.filter-row select');
const enhancedSelects = [];

function closeFilterSelect(customSelect, returnFocus = false) {
  customSelect.classList.remove('is-open');
  const trigger = customSelect.querySelector('.custom-select-trigger');
  trigger.setAttribute('aria-expanded', 'false');

  if (returnFocus) {
    trigger.focus();
  }
}

function closeOtherFilterSelects(currentSelect) {
  enhancedSelects.forEach(({ customSelect }) => {
    if (customSelect !== currentSelect) {
      closeFilterSelect(customSelect);
    }
  });
}

filterSelects.forEach((select, selectIndex) => {
  const customSelect = document.createElement('div');
  const trigger = document.createElement('button');
  const triggerText = document.createElement('span');
  const arrow = document.createElement('span');
  const menu = document.createElement('div');
  const menuId = `filter-select-${selectIndex}`;

  customSelect.className = 'custom-select';
  trigger.className = 'custom-select-trigger';
  trigger.type = 'button';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', menuId);
  trigger.setAttribute('aria-label', select.getAttribute('aria-label'));
  arrow.className = 'custom-select-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  menu.className = 'custom-select-menu';
  menu.id = menuId;
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', select.getAttribute('aria-label'));

  function updateSelection() {
    triggerText.textContent = select.options[select.selectedIndex].textContent;

    menu.querySelectorAll('.custom-select-option').forEach((optionButton, optionIndex) => {
      optionButton.setAttribute('aria-selected', String(optionIndex === select.selectedIndex));
    });
  }

  Array.from(select.options).forEach((option, optionIndex) => {
    const optionButton = document.createElement('button');
    optionButton.className = 'custom-select-option';
    optionButton.type = 'button';
    optionButton.setAttribute('role', 'option');
    optionButton.textContent = option.textContent;

    optionButton.addEventListener('click', () => {
      select.selectedIndex = optionIndex;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      updateSelection();
      closeFilterSelect(customSelect, true);
    });

    menu.append(optionButton);
  });

  trigger.append(triggerText, arrow);
  customSelect.append(trigger, menu);
  select.classList.add('is-enhanced');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');
  select.insertAdjacentElement('afterend', customSelect);
  enhancedSelects.push({ select, customSelect, updateSelection });
  updateSelection();

  trigger.addEventListener('click', () => {
    const shouldOpen = !customSelect.classList.contains('is-open');
    closeOtherFilterSelects(customSelect);
    customSelect.classList.toggle('is-open', shouldOpen);
    trigger.setAttribute('aria-expanded', String(shouldOpen));
  });

  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && customSelect.classList.contains('is-open')) {
      event.preventDefault();
      closeFilterSelect(customSelect, true);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      closeOtherFilterSelects(customSelect);
      customSelect.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');

      const options = menu.querySelectorAll('.custom-select-option');
      const focusIndex = event.key === 'ArrowDown' ? select.selectedIndex : Math.max(0, select.selectedIndex - 1);
      options[focusIndex].focus();
    }
  });

  menu.addEventListener('keydown', (event) => {
    const options = Array.from(menu.querySelectorAll('.custom-select-option'));
    const currentIndex = options.indexOf(document.activeElement);

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      options[(currentIndex + direction + options.length) % options.length].focus();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeFilterSelect(customSelect, true);
    }
  });

  customSelect.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (!customSelect.contains(document.activeElement)) {
        closeFilterSelect(customSelect);
      }
    }, 0);
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.custom-select')) {
    enhancedSelects.forEach(({ customSelect }) => closeFilterSelect(customSelect));
  }
});

filterForm.addEventListener('input', filterProducts);
filterForm.addEventListener('change', filterProducts);

filterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  filterProducts();
});

filterForm.addEventListener('reset', () => {
  window.setTimeout(() => {
    enhancedSelects.forEach(({ customSelect, updateSelection }) => {
      updateSelection();
      closeFilterSelect(customSelect);
    });
    filterProducts();
  }, 0);
});

filterProducts();

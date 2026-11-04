const categoryMenu = document.querySelector('[data-category-menu]');

if (categoryMenu) {
  const categoryTabs = Array.from(categoryMenu.querySelectorAll('[data-category-tab]'));
  const categoryPanels = Array.from(categoryMenu.querySelectorAll('[data-category-panel]'));
  const hoverInput = window.matchMedia('(hover: hover) and (pointer: fine)');
  let activeCategory = categoryTabs.find((tab) => tab.getAttribute('aria-selected') === 'true')?.dataset.categoryTab
    || categoryTabs[0]?.dataset.categoryTab;

  function syncCategoryMenu(isOpen) {
    categoryMenu.classList.toggle('is-open', isOpen);

    categoryTabs.forEach((tab) => {
      const isActive = tab.dataset.categoryTab === activeCategory;
      tab.setAttribute('aria-selected', String(isActive));
      tab.setAttribute('aria-expanded', String(isActive && isOpen));
      tab.tabIndex = isActive ? 0 : -1;
    });

    categoryPanels.forEach((panel) => {
      const isActive = panel.dataset.categoryPanel === activeCategory;
      panel.classList.toggle('is-active', isActive);
      panel.setAttribute('aria-hidden', String(!isActive || !isOpen));
      panel.inert = !isActive || !isOpen;
    });
  }

  function openCategory(category, shouldFocus = false) {
    activeCategory = category;
    syncCategoryMenu(true);

    if (shouldFocus) {
      categoryTabs.find((tab) => tab.dataset.categoryTab === category)?.focus();
    }
  }

  function closeCategory() {
    syncCategoryMenu(false);
  }

  categoryTabs.forEach((tab, index) => {
    tab.addEventListener('pointerenter', () => {
      if (hoverInput.matches) {
        openCategory(tab.dataset.categoryTab);
      }
    });

    tab.addEventListener('focus', () => {
      openCategory(tab.dataset.categoryTab);
    });

    tab.addEventListener('click', () => {
      openCategory(tab.dataset.categoryTab);
    });

    tab.addEventListener('keydown', (event) => {
      let nextIndex = null;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % categoryTabs.length;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + categoryTabs.length) % categoryTabs.length;
      }

      if (event.key === 'Home') {
        nextIndex = 0;
      }

      if (event.key === 'End') {
        nextIndex = categoryTabs.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        openCategory(categoryTabs[nextIndex].dataset.categoryTab, true);
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        closeCategory();
        tab.focus();
      }
    });
  });

  categoryMenu.addEventListener('pointerleave', () => {
    if (hoverInput.matches) {
      closeCategory();
    }
  });

  categoryMenu.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (!categoryMenu.contains(document.activeElement)) {
        closeCategory();
      }
    }, 0);
  });

  document.addEventListener('click', (event) => {
    if (!categoryMenu.contains(event.target)) {
      closeCategory();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && categoryMenu.classList.contains('is-open')) {
      closeCategory();
      categoryTabs.find((tab) => tab.dataset.categoryTab === activeCategory)?.focus();
    }
  });

  syncCategoryMenu(false);
}

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

const filterForm = document.querySelector('.filter-row');

filterForm.addEventListener('reset', () => {
  window.setTimeout(() => {
    enhancedSelects.forEach(({ customSelect, updateSelection }) => {
      updateSelection();
      closeFilterSelect(customSelect);
    });
  }, 0);
});

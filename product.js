const variantButtons = document.querySelectorAll('.variants button');
const productVariantName = document.querySelector('.product-variant-name');
const productPrice = document.querySelector('.price');
const productSku = document.querySelector('.product-titleline small');
const selectedVariant = document.querySelector('.selected-variant');
const buyButton = document.querySelector('[data-add-to-cart]');
const specRows = Array.from(document.querySelectorAll('.specs tr'));
const variantSpec = document.querySelector('[data-variant-spec]');

function findSpecValue(label) {
  const row = specRows.find((item) => item.firstElementChild?.textContent.trim() === label);
  return row?.lastElementChild;
}

const lengthSpec = findSpecValue('Довжина');
const testSpec = findSpecValue('Тест');

variantButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const buttonLabel = button.textContent.trim();
    const titleSuffix = button.dataset.title
      || [button.dataset.length, button.dataset.test].filter(Boolean).join(' ')
      || buttonLabel;

    variantButtons.forEach((item) => {
      const isCurrent = item === button;
      item.classList.toggle('is-selected', isCurrent);
      item.setAttribute('aria-pressed', String(isCurrent));
    });

    if (productPrice && button.dataset.price) {
      productPrice.textContent = button.dataset.price;
    }

    if (productSku && button.dataset.sku) {
      productSku.textContent = `Артикул: ${button.dataset.sku}`;
    }

    if (productVariantName) {
      productVariantName.textContent = titleSuffix;
    }

    if (selectedVariant) {
      selectedVariant.textContent = `Обрано: ${buttonLabel}`;
    }

    if (buyButton) {
      buyButton.dataset.sku = button.dataset.sku || buyButton.dataset.sku;
      buyButton.dataset.variant = buttonLabel;
      buyButton.dataset.priceValue = button.dataset.priceValue || buyButton.dataset.priceValue;
    }

    if (lengthSpec) {
      lengthSpec.textContent = button.dataset.length;
    }

    if (testSpec) {
      testSpec.textContent = button.dataset.test;
    }

    if (variantSpec && button.dataset.specValue) {
      variantSpec.textContent = button.dataset.specValue;
    }
  });
});

const photoButtons = document.querySelectorAll('.thumbs button');
const photoModal = document.querySelector('.photo-modal');
const modalImage = photoModal.querySelector('img');
const modalCaption = photoModal.querySelector('#photo-modal-title');
const modalClose = photoModal.querySelector('.photo-modal-close');
const modalBackdrop = photoModal.querySelector('.photo-modal-backdrop');
let activePhotoButton = null;
let photoInertedElements = [];

function setPhotoBackgroundInert(isInert) {
  if (isInert) {
    photoInertedElements = Array.from(document.body.children).filter((element) => (
      element !== photoModal && element.tagName !== 'SCRIPT' && !element.inert
    ));
    photoInertedElements.forEach((element) => { element.inert = true; });
    return;
  }

  photoInertedElements.forEach((element) => { element.inert = false; });
  photoInertedElements = [];
}

function openPhoto(event) {
  const button = event.currentTarget;
  activePhotoButton = button;

  photoButtons.forEach((item) => {
    const isCurrent = item === button;
    item.classList.toggle('is-selected', isCurrent);
    item.setAttribute('aria-pressed', String(isCurrent));
  });

  modalImage.src = button.dataset.photo;
  modalImage.alt = button.getAttribute('aria-label');
  modalCaption.textContent = button.getAttribute('aria-label');
  photoModal.hidden = false;
  document.body.classList.add('product-photo-open');
  setPhotoBackgroundInert(true);
  modalClose.focus({ preventScroll: true });
}

function closePhoto() {
  if (photoModal.hidden) {
    return;
  }

  photoModal.hidden = true;
  document.body.classList.remove('product-photo-open');
  setPhotoBackgroundInert(false);
  activePhotoButton?.focus();
}

photoButtons.forEach((button) => button.addEventListener('click', openPhoto));
modalClose.addEventListener('click', closePhoto);
modalBackdrop.addEventListener('click', closePhoto);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Tab' && !photoModal.hidden) {
    event.preventDefault();
    modalClose.focus();
  }

  if (event.key === 'Escape' && !photoModal.hidden) {
    event.preventDefault();
    closePhoto();
  }
});

const variantButtons = document.querySelectorAll('.variants button');
const productVariantName = document.querySelector('.product-variant-name');
const productPrice = document.querySelector('.price');
const productSku = document.querySelector('.product-titleline small');
const selectedVariant = document.querySelector('.selected-variant');
const buyButton = document.querySelector('[data-add-to-cart]');
const specRows = Array.from(document.querySelectorAll('.specs tr'));

function findSpecValue(label) {
  const row = specRows.find((item) => item.firstElementChild?.textContent.trim() === label);
  return row?.lastElementChild;
}

const lengthSpec = findSpecValue('Довжина');
const testSpec = findSpecValue('Тест');

variantButtons.forEach((button) => {
  button.addEventListener('click', () => {
    variantButtons.forEach((item) => {
      const isCurrent = item === button;
      item.classList.toggle('is-selected', isCurrent);
      item.setAttribute('aria-pressed', String(isCurrent));
    });

    productPrice.textContent = button.dataset.price;
    productSku.textContent = `Артикул: ${button.dataset.sku}`;
    productVariantName.textContent = `${button.dataset.length} ${button.dataset.test}`;
    selectedVariant.textContent = `Обрано: ${button.textContent.trim()}`;
    buyButton.dataset.sku = button.dataset.sku;
    buyButton.dataset.variant = button.textContent.trim();
    buyButton.dataset.priceValue = button.dataset.priceValue;

    if (lengthSpec) {
      lengthSpec.textContent = button.dataset.length;
    }

    if (testSpec) {
      testSpec.textContent = button.dataset.test;
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

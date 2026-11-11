/* Liwi-Ka multi-image product gallery + accessible full-screen image viewer. */
(function (window, document) {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const states = new WeakMap();
  let viewer;
  let viewerImage;
  let viewerState = null;

  function productImages(product, initialImage) {
    const values = [];
    const add = (item) => {
      const url = typeof item === 'string' ? item : (item?.url || item?.imageUrl || item?.downloadURL || item?.src || '');
      if (url && !values.some(entry => entry.url === url)) values.push({ url, alt: product?.name || 'Liwi-Ka chocolate' });
    };
    if (Array.isArray(product?.images)) product.images.forEach(add);
    if (Array.isArray(product?.imageUrls)) product.imageUrls.forEach(add);
    if (Array.isArray(product?.flavours)) product.flavours.forEach(flavour => add(typeof flavour === 'object' ? flavour.image : ''));
    add(initialImage);
    add(product?.imageUrl || product?.image);
    return values;
  }

  function createViewer() {
    if (viewer) return viewer;
    viewer = document.createElement('div');
    viewer.className = 'liwika-image-viewer';
    viewer.hidden = true;
    viewer.setAttribute('role', 'dialog');
    viewer.setAttribute('aria-modal', 'true');
    viewer.setAttribute('aria-label', 'Product image viewer');
    viewer.innerHTML = `
      <button class="liwika-viewer-close" type="button" aria-label="Close image viewer">&times;</button>
      <button class="liwika-viewer-arrow liwika-viewer-prev" type="button" aria-label="Previous image">‹</button>
      <img class="liwika-viewer-image" alt="Product image enlarged">
      <button class="liwika-viewer-arrow liwika-viewer-next" type="button" aria-label="Next image">›</button>
      <span class="liwika-viewer-count" aria-live="polite"></span>`;
    document.body.appendChild(viewer);
    viewerImage = $('.liwika-viewer-image', viewer);

    const close = () => {
      viewer.hidden = true;
      document.body.classList.remove('liwika-image-viewer-open');
      viewerState = null;
    };
    $('.liwika-viewer-close', viewer).addEventListener('click', close);
    viewer.addEventListener('click', event => { if (event.target === viewer) close(); });
    $('.liwika-viewer-prev', viewer).addEventListener('click', () => stepViewer(-1));
    $('.liwika-viewer-next', viewer).addEventListener('click', () => stepViewer(1));
    document.addEventListener('keydown', event => {
      if (viewer.hidden) return;
      if (event.key === 'Escape') { event.stopImmediatePropagation(); close(); }
      if (event.key === 'ArrowLeft') stepViewer(-1);
      if (event.key === 'ArrowRight') stepViewer(1);
    }, true);
    let touchX = 0;
    viewer.addEventListener('touchstart', event => { touchX = event.changedTouches[0]?.clientX || 0; }, { passive: true });
    viewer.addEventListener('touchend', event => {
      const delta = (event.changedTouches[0]?.clientX || 0) - touchX;
      if (Math.abs(delta) > 45) stepViewer(delta < 0 ? 1 : -1);
    }, { passive: true });
    return viewer;
  }

  function viewerRender() {
    if (!viewerState || !viewerImage) return;
    const { images, index, name } = viewerState;
    viewerImage.src = images[index]?.url || '';
    viewerImage.alt = `${name || 'Product'} image ${index + 1}`;
    const count = $('.liwika-viewer-count', viewer);
    count.textContent = `${index + 1} / ${images.length}`;
    $('.liwika-viewer-prev', viewer).hidden = images.length < 2;
    $('.liwika-viewer-next', viewer).hidden = images.length < 2;
  }

  function stepViewer(direction) {
    if (!viewerState || viewerState.images.length < 2) return;
    viewerState.index = (viewerState.index + direction + viewerState.images.length) % viewerState.images.length;
    viewerRender();
  }

  function openViewer(state) {
    if (!state?.images?.length) return;
    createViewer();
    viewerState = { images: state.images, index: state.index, name: state.name };
    viewer.hidden = false;
    document.body.classList.add('liwika-image-viewer-open');
    viewerRender();
    $('.liwika-viewer-close', viewer).focus({ preventScroll: true });
  }

  function renderState(state) {
    const { container, image, images, index } = state;
    const current = images[index];
    image.src = current?.url || '';
    image.alt = `${state.name || 'Product'} image ${index + 1}`;
    state.container.querySelectorAll('.liwika-gallery-thumb').forEach((button, i) => {
      button.classList.toggle('is-active', i === index);
      button.setAttribute('aria-pressed', i === index ? 'true' : 'false');
    });
    const count = $('.liwika-gallery-count', container);
    if (count) count.textContent = `${index + 1} / ${images.length}`;
    const multi = images.length > 1;
    container.classList.toggle('has-multiple-images', multi);
    $('.liwika-gallery-prev', container).hidden = !multi;
    $('.liwika-gallery-next', container).hidden = !multi;
    $('.liwika-gallery-thumbnails', container).hidden = !multi;
  }

  function move(state, direction) {
    if (!state || state.images.length < 2) return;
    state.index = (state.index + direction + state.images.length) % state.images.length;
    renderState(state);
  }

  function ensureGallery(modal) {
    const container = $('.modal-image-container', modal);
    const image = $('#modalProductImage', modal);
    if (!container || !image) return null;
    if (container.dataset.liwikaGalleryReady === '1') return states.get(modal);

    container.dataset.liwikaGalleryReady = '1';
    const previous = document.createElement('button');
    previous.type = 'button'; previous.className = 'liwika-gallery-arrow liwika-gallery-prev';
    previous.setAttribute('aria-label', 'Previous product image'); previous.textContent = '‹';
    const next = document.createElement('button');
    next.type = 'button'; next.className = 'liwika-gallery-arrow liwika-gallery-next';
    next.setAttribute('aria-label', 'Next product image'); next.textContent = '›';
    const count = document.createElement('span'); count.className = 'liwika-gallery-count'; count.setAttribute('aria-live', 'polite');
    const thumbs = document.createElement('div'); thumbs.className = 'liwika-gallery-thumbnails';
    container.append(previous, next, count, thumbs);

    const state = { modal, container, image, images: [], index: 0, name: '' };
    states.set(modal, state);
    previous.addEventListener('click', event => { event.stopPropagation(); move(state, -1); });
    next.addEventListener('click', event => { event.stopPropagation(); move(state, 1); });
    let swipeInProgress = false;
    image.addEventListener('click', event => { event.stopPropagation(); if (swipeInProgress) return; openViewer(state); });
    image.setAttribute('tabindex', '0');
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', 'Open enlarged product image');
    image.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openViewer(state); }
    });
    let touchX = 0;
    container.addEventListener('touchstart', event => { touchX = event.changedTouches[0]?.clientX || 0; swipeInProgress = false; }, { passive: true });
    container.addEventListener('touchend', event => {
      const delta = (event.changedTouches[0]?.clientX || 0) - touchX;
      if (Math.abs(delta) > 45) {
        swipeInProgress = true;
        move(state, delta < 0 ? 1 : -1);
        window.setTimeout(() => { swipeInProgress = false; }, 350);
      }
    }, { passive: true });
    return state;
  }

  function setGalleryImage(url) {
    const modal = $('#productModal');
    const state = modal && states.get(modal);
    if (!state || !url) return;
    const index = state.images.findIndex(item => item.url === url);
    if (index >= 0) {
      state.index = index;
      renderState(state);
    } else {
      state.images.push({ url, alt: state.name || 'Liwi-Ka chocolate' });
      state.index = state.images.length - 1;
      rebuildThumbs(state);
      renderState(state);
    }
  }

  function rebuildThumbs(state) {
    const thumbs = $('.liwika-gallery-thumbnails', state.container);
    thumbs.innerHTML = '';
    state.images.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'liwika-gallery-thumb';
      button.setAttribute('aria-label', `Show image ${index + 1}`);
      button.setAttribute('aria-pressed', 'false');
      const img = document.createElement('img'); img.src = item.url; img.alt = '';
      button.appendChild(img);
      button.addEventListener('click', event => { event.stopPropagation(); state.index = index; renderState(state); });
      thumbs.appendChild(button);
    });
  }

  window.LiwikaRenderProductGallery = function (product, initialImage) {
    const modal = $('#productModal');
    if (!modal) return;
    const state = ensureGallery(modal);
    if (!state) return;
    state.name = product?.name || 'Liwi-Ka chocolate';
    state.images = productImages(product, initialImage);
    if (!state.images.length) state.images = [{ url: initialImage || product?.imageUrl || product?.image || '' }].filter(x => x.url);
    const initialIndex = state.images.findIndex(item => item.url === initialImage);
    state.index = initialIndex >= 0 ? initialIndex : 0;
    rebuildThumbs(state);
    renderState(state);
  };
  window.LiwikaSetProductGalleryImage = setGalleryImage;
  window.LiwikaOpenProductImageViewer = function () {
    const modal = $('#productModal'); const state = modal && states.get(modal);
    if (state) openViewer(state);
  };
})(window, document);

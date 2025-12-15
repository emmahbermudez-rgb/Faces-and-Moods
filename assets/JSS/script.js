// Carrito, contador de visitas, filtro del catalogo

document.addEventListener('DOMContentLoaded', () => {
  /* ---------------------------
     Inicializaciones generales
     --------------------------- */
  // Mapa de productos leyendo las cards actuales en DOM

  const productNodes = Array.from(document.querySelectorAll('.product'));
  const PRODUCTS = productNodes.map(node => {
    const id = node.dataset.id || generateId();
    const title = (node.querySelector('.title')?.innerText || 'Producto');
    const priceEl = node.querySelector('.price');
    const price = priceEl ? parseFloat(priceEl.dataset.value || priceEl.innerText.replace(/[^0-9\.,]/g,'')) || 0 : 0;
    const img = node.querySelector('img')?.getAttribute('src') || '';

    const category = node.dataset.category || node.getAttribute('data-category') || 'sin-categoria';
    return { id, title, price, img, category };
  });

  // carrito: array de { id, title, price, qty }
  window.cart = loadCart() || [];

  // contador de visitas
  incrementVisits();

  // actualizar contador en nav al cargar
  updateCartCount();

  /* Carrito agregar */

  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.product');
      if(!card) return;
      const id = card.dataset.id;
      const qtyField = card.querySelector('.qty');
      const qty = qtyField ? Math.max(1, parseInt(qtyField.value || 1)) : 1;

      // encontrar datos de producto del mapa PRODUCTS

      const prod = PRODUCTS.find(p => p.id === id) || {
        id,
        title: card.querySelector('.title')?.innerText || 'Producto',
        price: parseFloat(card.querySelector('.price')?.dataset.value || 0) || 0
      };

      addToCart(prod, qty);
      // Mensaje de agregado
      flashMessage(`${prod.title} añadido al carrito (${qty})`);
    });
  });

  document.querySelectorAll('.wish-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const card = e.target.closest('.product');
      const title = card?.querySelector('.title')?.innerText || 'Producto';
      flashMessage(`Añadido a deseos: ${title}`);
    });
  });


  /* 
     guardar en carrito
    */
  function addToCart(product, qty = 1){
    const existing = window.cart.find(item => item.id === product.id);
    if(existing){
      existing.qty = (existing.qty || 0) + qty;
    } else {
      window.cart.push({ id: product.id, title: product.title, price: Number(product.price), qty });
    }
    saveCart();
    updateCartCount();
    
    if(document.getElementById('cartItems')) renderCart();
  }

  function removeFromCart(index){
    if(index < 0 || index >= window.cart.length) return;
    window.cart.splice(index, 1);
    saveCart();
    updateCartCount();
    if(document.getElementById('cartItems')) renderCart();
  }

  function updateQtyInCart(index, qty){
    qty = Number(qty);
    if(qty <= 0){
      removeFromCart(index);
      return;
    }
    if(window.cart[index]) {
      window.cart[index].qty = qty;
      saveCart();
      updateCartCount();
      if(document.getElementById('cartItems')) renderCart();
    }
  }

  function clearCart(){
    window.cart = [];
    saveCart();
    updateCartCount();
    if(document.getElementById('cartItems')) renderCart();
    flashMessage('Carrito vaciado');
  }

  // Exponer funciones globales mínimas

  window.addToCart = addToCart;
  window.removeFromCart = removeFromCart;
  window.clearCart = clearCart;

 
  function saveCart(){
    try {
      localStorage.setItem('faces_cart', JSON.stringify(window.cart));
    } catch(e) { console.warn('no se pudo guardar el carrito', e); }
  }
  function loadCart(){
    try {
      const raw = localStorage.getItem('faces_cart');
      return raw ? JSON.parse(raw) : [];
    } catch(e) { return []; }
  }

  /* 
     Render carrito */

  function renderCart(){
    const container = document.getElementById('cartItems');
    if(!container) return;
    if(!window.cart || window.cart.length === 0){
      container.innerHTML = '<p class="small muted">Tu carrito está vacío.</p>';
      return;
    }
    let html = '';
    let total = 0;
    window.cart.forEach((item, idx) => {
      const sub = (item.price * item.qty);
      total += sub;
      html += `
        <div class="cart-row" data-index="${idx}" style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.04)">
          <div style="flex:1">
            <div style="font-weight:700">${escapeHtml(item.title)}</div>
            <div class="small muted">${item.qty} × $${Number(item.price).toFixed(2)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <input class="cart-qty" data-index="${idx}" type="number" min="1" value="${item.qty}" style="width:70px;padding:6px;border-radius:6px;border:1px solid rgba(0,0,0,0.08)"/>
            <div style="text-align:right"><b>$${sub.toFixed(2)}</b></div>
            <button class="btn remove-cart" data-index="${idx}" style="margin-top:6px">Eliminar</button>
          </div>
        </div>
      `;
    });
    html += `<div style="padding-top:12px;display:flex;justify-content:space-between;align-items:center">
              <div><strong>Total:</strong> $${total.toFixed(2)}</div>
              <div style="display:flex;gap:8px">
                <button id="vaciarCarritoBtn" class="btn">Vaciar carrito</button>
                <button id="pagarBtn" class="btn primary">Pagar</button>
              </div>
            </div>`;
    container.innerHTML = html;

    // remover 

    container.querySelectorAll('.remove-cart').forEach(b=>{
      b.addEventListener('click', (e)=> {
        const i = Number(e.target.dataset.index);
        removeFromCart(i);
      });
    });
    container.querySelectorAll('.cart-qty').forEach(inp=>{
      inp.addEventListener('change', (ev)=>{
        const i = Number(ev.target.dataset.index);
        const q = Number(ev.target.value) || 1;
        updateQtyInCart(i, q);
      });
    });

    // vaciar
    const vaciarBtn = document.getElementById('vaciarCarritoBtn');
    if(vaciarBtn) vaciarBtn.addEventListener('click', clearCart);

    // pagar 
    const pagarBtn = document.getElementById('pagarBtn');
    if(pagarBtn) pagarBtn.addEventListener('click', ()=> alert('Proceder al pago'));
  }

  // si estamos en pagina carrito, renderizamos al inicio

  if(document.getElementById('cartItems')) renderCart();

  /* 
     Contador del carrito en la nav
     */


  function updateCartCount(){
    const el = document.getElementById('cartCount');
    const totalQty = (window.cart || []).reduce((s,i)=> s + (Number(i.qty)||0), 0);
    if(el) el.innerText = totalQty;
  }

  /* ---------------------------
     Contador de visitas
     --------------------------- */

  function incrementVisits(){
    try {
      let v = Number(localStorage.getItem('faces_visitas') || 0);
      v = v + 1;
      localStorage.setItem('faces_visitas', v);
      const el = document.getElementById('visitCount');
      if(el) el.innerText = v;
      // también puedes mostrar en consola
      // console.log('Visitas a este navegador:', v);
    } catch(e){ /* ignore */ }
  }

  /* 
     Filtro por categorías (Opción A: filtrar dentro del carrusel)
  */
  // Botones / select con class .filter-btn y data-cat="tazas"

  document.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const cat = btn.dataset.cat || 'all';
      filterProducts(cat);

      

      document.querySelectorAll('.filter-btn').forEach(b=> b.classList.remove('active-filter'));
      btn.classList.add('active-filter');
    });
  });

  function filterProducts(category){

    // Si category === 'all' mostramos todo
    document.querySelectorAll('.product').forEach(prodEl => {
      const prodCat = prodEl.dataset.category || prodEl.getAttribute('data-category') || 'sin-categoria';
      if(category === 'all' || category === '' || prodCat === category){
        prodEl.style.display = '';
      } else {
        prodEl.style.display = 'none';
      }
    });
  }

  /* ---------------------------
     Small utilities
     --------------------------- */
  function flashMessage(txt, ms = 1200){

    // simple floating toast

    const t = document.createElement('div');
    t.innerText = txt;
    t.style = `
      position:fixed;right:20px;bottom:20px;padding:10px 14px;background:var(--accent, #7a5413dc);
      color:white;border-radius:10px;box-shadow:0 6px 18px rgba(0,0,0,0.12);z-index:9999;font-weight:600;
    `;
    document.body.appendChild(t);
    setTimeout(()=> t.style.opacity = '0.0', ms - 200);
    setTimeout(()=> t.remove(), ms);
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function generateId(prefix='p'){
    return prefix + Math.random().toString(36).slice(2,9);
  }

  /* ---------------------------
     Inicial: asignar data-id/data-category a products que no tengan 
     --------------------------- */
  productNodes.forEach((node, idx) => {
    if(!node.dataset.id) node.dataset.id = PRODUCTS[idx].id;
    if(!node.dataset.category) node.dataset.category = PRODUCTS[idx].category || 'sin-categoria';
  });

  // listo
});


/* carrusel */

document.querySelectorAll('.carousel').forEach(car=>{
    const track = car.querySelector('.carousel-track');
    const left = car.querySelector('.carousel-btn.left');
    const right = car.querySelector('.carousel-btn.right');
    if(left) left.addEventListener('click', ()=> track.scrollBy({left:-300,behavior:'smooth'}));
    if(right) right.addEventListener('click', ()=> track.scrollBy({left:300,behavior:'smooth'}));
});


// MENU responsive (mejorado) + búsqueda expandible
const mt = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const searchContainer = document.getElementById('searchContainer');
const searchToggle = document.getElementById('searchToggle');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

if (mt && navLinks) {
  mt.addEventListener('click', () => {
    if (navLinks.style.display === 'flex') {
      navLinks.style.display = 'none';
      navLinks.setAttribute('aria-hidden', 'true');
    } else {
      navLinks.style.display = 'flex';
      navLinks.style.flexDirection = 'column';
      navLinks.setAttribute('aria-hidden', 'false');
      if (searchContainer) searchContainer.classList.remove('expanded');
    }
  });
}

// close menu when clicking outside (mobile)
document.addEventListener('click', (e) => {
  const target = e.target;
  if (window.innerWidth <= 640) {
    if (navLinks && mt && !navLinks.contains(target) && !mt.contains(target)) {
      navLinks.style.display = 'none';
      navLinks.setAttribute('aria-hidden', 'true');
    }
  }
});

// Search expand toggle (mobile)
if (searchToggle && searchContainer && searchInput && searchForm) {
  searchToggle.addEventListener('click', (e) => {
    if (searchContainer.classList.contains('expanded')) {
      // submit search
      searchForm.dispatchEvent(new Event('submit', { cancelable: true }));
      return;
    }
    // expand search
    searchContainer.classList.add('expanded');
    // hide menu if open
    if (navLinks) { navLinks.style.display = 'none'; navLinks.setAttribute('aria-hidden','true'); }
    setTimeout(()=> searchInput.focus(), 200);
  });

  // collapse when clicking outside
  document.addEventListener('click', (e) => {
    if (!searchContainer.contains(e.target) && window.innerWidth <= 640) {
      searchContainer.classList.remove('expanded');
    }
  });

  // Esc key closes search
  searchInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      searchContainer.classList.remove('expanded');
      searchInput.blur();
    }
  });
}

// on resize: reset states
window.addEventListener('resize', () => {
  if (window.innerWidth > 640) {
    if (navLinks) { navLinks.style.display = 'flex'; navLinks.removeAttribute('aria-hidden'); }
    if (searchContainer) searchContainer.classList.remove('expanded');
  } else {
    if (navLinks) { navLinks.style.display = 'none'; navLinks.setAttribute('aria-hidden','true'); }
    if (searchContainer) searchContainer.classList.remove('expanded');
  }
});

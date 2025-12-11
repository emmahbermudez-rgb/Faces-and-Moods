// script.js - basic interactions for Faces and moods
document.addEventListener('DOMContentLoaded', function(){
  // Mobile menu toggle
  const mt = document.getElementById('menuToggle');
  if(mt) mt.addEventListener('click', ()=> {
    const nav = document.getElementById('navLinks');
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
    nav.style.flexDirection = 'column';
    nav.style.gap = '10px';
    nav.style.padding = '12px';
    nav.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,255,255,0.95))';
  });

  // Simple cart in memory
  window.cart = window.cart || [];
  document.querySelectorAll('.add-to-cart').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const card = e.target.closest('.product');
      const id = card.dataset.id;
      const title = card.querySelector('.title').innerText;
      const price = parseFloat(card.querySelector('.price').dataset.value);
      const qtyField = card.querySelector('.qty');
      const qty = qtyField ? Math.max(1, parseInt(qtyField.value||1)) : 1;
      const existing = window.cart.find(x=>x.id===id);
      if(existing) existing.qty += qty; else window.cart.push({id,title,price,qty});
      updateCartCount();
      alert(title + ' añadido al carrito ('+qty+')');
    });
  });

  document.querySelectorAll('.wish-btn').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const card = e.target.closest('.product');
      const title = card.querySelector('.title').innerText;
      alert('Añadido a lista de deseos: ' + title);
    });
  });

  function updateCartCount(){
    const el = document.getElementById('cartCount');
    const total = window.cart.reduce((s,i)=>s+i.qty,0);
    if(el) el.innerText = total;
  }

  // Carousel controls
  document.querySelectorAll('.carousel').forEach(car=>{
    const track = car.querySelector('.carousel-track');
    const left = car.querySelector('.carousel-btn.left');
    const right = car.querySelector('.carousel-btn.right');
    if(left) left.addEventListener('click', ()=> track.scrollBy({left:-300,behavior:'smooth'}));
    if(right) right.addEventListener('click', ()=> track.scrollBy({left:300,behavior:'smooth'}));
  });

  // Simple search (client-side)
  const searchForm = document.getElementById('searchForm');
  if(searchForm){
    searchForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      if(!q){ window.location.href='catalog.html'; return; }
      const cards = document.querySelectorAll('.product');
      cards.forEach(c=>{
        const t = c.querySelector('.title').innerText.toLowerCase();
        c.style.display = t.includes(q) ? 'block' : 'none';
      });
      window.scrollTo({top:200,behavior:'smooth'});
    });
  }
});

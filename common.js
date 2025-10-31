/* Common JS for CafeteriaUI static pages
   LocalStorage keys:
     caf_menu_v1, caf_users_v1, caf_orders_v1, caf_cart_v1, caf_user
*/
(function(){
  const STORAGE = {
    MENU: 'caf_menu_v1',
    USERS: 'caf_users_v1',
    ORDERS: 'caf_orders_v1',
    CART: 'caf_cart_v1',
    USER: 'caf_user'
  };

  const seedMenu = [
    { id: "m1", name: "Espresso", desc: "Rich and bold espresso shot", price: 70, tags: ["coffee","hot","strong"] },
    { id: "m2", name: "Cappuccino", desc: "Silky milk foam with espresso", price: 120, tags: ["coffee","hot","milk"] },
    { id: "m3", name: "Iced Latte", desc: "Chilled milk and espresso over ice", price: 130, tags: ["coffee","cold","milk"] },
    { id: "m4", name: "Blueberry Muffin", desc: "Freshly baked muffin", price: 90, tags: ["snack","baked","sweet"] },
    { id: "m5", name: "Veg Sandwich", desc: "Grilled veggies with herb spread", price: 150, tags: ["savory","sandwich","veg"] }
  ];

  function ensureSeeded(){
    if(!localStorage.getItem(STORAGE.MENU)) localStorage.setItem(STORAGE.MENU, JSON.stringify(seedMenu));
  }
  function loadMenu(){ return JSON.parse(localStorage.getItem(STORAGE.MENU) || '[]'); }
  function saveMenu(m){ localStorage.setItem(STORAGE.MENU, JSON.stringify(m)); }
  function loadUsers(){ return JSON.parse(localStorage.getItem(STORAGE.USERS) || '[]'); }
  function saveUsers(u){ localStorage.setItem(STORAGE.USERS, JSON.stringify(u)); }
  function loadOrders(){ return JSON.parse(localStorage.getItem(STORAGE.ORDERS) || '[]'); }
  function saveOrders(o){ localStorage.setItem(STORAGE.ORDERS, JSON.stringify(o)); }
  function loadCart(){ return JSON.parse(localStorage.getItem(STORAGE.CART) || '[]'); }
  function saveCart(c){ localStorage.setItem(STORAGE.CART, JSON.stringify(c)); }
  function getUser(){ return JSON.parse(localStorage.getItem(STORAGE.USER) || 'null'); }
  function setUser(u){ localStorage.setItem(STORAGE.USER, JSON.stringify(u)); }
  function clearUser(){ localStorage.removeItem(STORAGE.USER); }

  function hash(p){ try{return btoa(p);}catch(e){return p;} }

  function makeToken(){ return (Date.now().toString(36) + Math.random().toString(36).slice(2,10)).toUpperCase(); }

  /* escape for safety */
  function esc(s){ return (''+s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])) }

  /* Public initializers for each page */
  window.initMenuPage = function(){
    ensureSeeded();
    const menuGrid = document.getElementById('menu-grid');
    const search = document.getElementById('search');
    renderMenu(search.value || '');

    document.querySelectorAll('.nav-link').forEach(a=>{
      // optionally change link text if user logged in
    });

    search.addEventListener('input', ()=> renderMenu(search.value || ''));

    renderAuthUI();
  };

  function renderMenu(q){
    const menuGrid = document.getElementById('menu-grid');
    const items = loadMenu();
    const ql = (q||'').trim().toLowerCase();
    const filtered = items.filter(i=>{
      if(!ql) return true;
      if(i.name.toLowerCase().includes(ql) || (i.desc||'').toLowerCase().includes(ql)) return true;
      return (i.tags||[]).some(t=>t.toLowerCase().includes(ql));
    });
    menuGrid.innerHTML = '';
    filtered.forEach(it=>{
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <div class="item-title">${esc(it.name)}</div>
        <div class="small">${esc(it.desc)}</div>
        <div class="tags">Tags: ${(it.tags||[]).join(', ')}</div>
        <div class="price">₹ ${it.price}</div>
        <div style="display:flex;gap:8px;margin-top:10px;align-items:center">
          <input type="number" min="1" value="1" style="width:80px" data-id="${it.id}" class="qty" />
          <button class="btn add" data-id="${it.id}">Add</button>
        </div>
      `;
      menuGrid.appendChild(div);
    });
    document.querySelectorAll('.add').forEach(b=>{
      b.addEventListener('click', (ev)=>{
        const id = b.getAttribute('data-id');
        const qinput = document.querySelector(`.qty[data-id="${id}"]`);
        let qty = Math.max(1, parseInt(qinput.value || '1'));
        addToCart(id, qty);
      });
    });
    renderAuthUI();
  }

  function addToCart(id, qty){
    const menu = loadMenu();
    const item = menu.find(m=>m.id===id);
    if(!item) return alert('Item missing');
    const cart = loadCart();
    const ex = cart.find(c=>c.id===id);
    if(ex) ex.qty += qty; else cart.push({...item, qty});
    saveCart(cart);
    alert(item.name + ' added to cart');
  }

  /* Cart page */
  window.initCartPage = function(){
    renderAuthUI();
    renderCart();
    document.getElementById('place-order').addEventListener('click', placeOrder);
    document.getElementById('clear-cart').addEventListener('click', ()=>{ localStorage.removeItem(STORAGE.CART); renderCart(); });
    document.getElementById('close-popup').addEventListener('click', ()=>{ document.getElementById('order-popup').style.display='none'; });
    document.getElementById('copy-token').addEventListener('click', async ()=>{
      const t = document.getElementById('order-token').textContent;
      try{ await navigator.clipboard.writeText(t); alert('Copied token'); }catch(e){ alert('Copy failed'); }
    });
  };

  function renderCart(){
    const list = loadCart();
    const container = document.getElementById('cart-list');
    container.innerHTML = '';
    if(list.length===0){ container.innerHTML = '<p>No items in cart.</p>'; document.getElementById('total-line').textContent='Total: ₹0'; return;}
    let total = 0;
    list.forEach(c=>{
      total += (c.price * c.qty);
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div>
          <div style="font-weight:700">${esc(c.name)} x ${c.qty}</div>
          <div class="small">₹ ${c.price} each</div>
        </div>
        <div>
          <button class="btn-ghost remove" data-id="${c.id}">Remove</button>
        </div>
      `;
      container.appendChild(div);
    });
    document.querySelectorAll('.remove').forEach(b=>b.addEventListener('click', ()=>{
      const id = b.getAttribute('data-id');
      const next = loadCart().filter(x=>x.id!==id);
      saveCart(next); renderCart();
    }));
    document.getElementById('total-line').textContent = 'Total: ₹' + total;
  }

  function placeOrder(){
    const cart = loadCart();
    if(cart.length===0) return alert('Cart empty');
    const token = makeToken();
    const orders = loadOrders();
    const user = getUser();
    orders.push({ token, items: cart, createdAt: new Date().toISOString(), user: user?{id:user.email,name:user.name}:{id:'guest',name:'Guest'} });
    saveOrders(orders);
    localStorage.removeItem(STORAGE.CART);
    renderCart();
    document.getElementById('order-token').textContent = token;
    document.getElementById('order-popup').style.display = 'block';
  }

  /* Login page */
  window.initLoginPage = function(){
    renderAuthUI();
    const form = document.getElementById('login-form');
    form.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-pass').value;
      const users = loadUsers();
      const u = users.find(x => x.email === email && x.password === hash(pass));
      if(!u) return alert('Invalid credentials');
      setUser(u);
      alert('Logged in as ' + u.name);
      // redirect to index
      window.location.href = 'index.html';
    });
  };

  /* Signup page */
  window.initSignupPage = function(){
    renderAuthUI();
    const form = document.getElementById('signup-form');
    form.addEventListener('submit', (ev)=>{
      ev.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const pass = document.getElementById('signup-pass').value;
      const role = document.getElementById('signup-role').value;
      const users = loadUsers();
      if(users.find(u=>u.email===email)) return alert('User exists');
      const u = { name, email, password: hash(pass), role };
      users.push(u); saveUsers(users);
      setUser(u);
      alert('Account created: ' + name);
      window.location.href = 'index.html';
    });
  };

  /* Admin page */
  window.initAdminPage = function(){
    renderAuthUI();
    const cur = getUser();
    if(!cur || cur.role !== 'admin'){
      alert('Admin access required. Please login as admin.');
      window.location.href = 'login.html';
      return;
    }
    renderAdminList();
    document.getElementById('add-item').addEventListener('click', ()=>{
      document.getElementById('item-form').style.display = 'block';
      document.getElementById('form-title').textContent = 'New Item';
      document.getElementById('item-name').value=''; document.getElementById('item-desc').value=''; document.getElementById('item-price').value=''; document.getElementById('item-tags').value='';
      window._editingId = null;
    });
    document.getElementById('cancel-item').addEventListener('click', ()=>{ document.getElementById('item-form').style.display = 'none'; });
    document.getElementById('save-item').addEventListener('click', ()=>{
      const name = document.getElementById('item-name').value.trim();
      const desc = document.getElementById('item-desc').value.trim();
      const price = Number(document.getElementById('item-price').value) || 0;
      const tags = document.getElementById('item-tags').value.split(',').map(t=>t.trim()).filter(Boolean);
      if(!name) return alert('Name required');
      const menu = loadMenu();
      if(window._editingId){
        const next = menu.map(m => m.id === window._editingId ? {...m, name, desc, price, tags} : m);
        saveMenu(next);
      } else {
        const id = 'm' + Math.floor(Math.random()*1000000);
        menu.push({id,name,desc,price,tags});
        saveMenu(menu);
      }
      document.getElementById('item-form').style.display = 'none';
      renderAdminList();
      // refresh menu page when admin returns
    });
  };

  function renderAdminList(){
    const area = document.getElementById('admin-list');
    area.innerHTML = '';
    const menu = loadMenu();
    menu.forEach(it=>{
      const div = document.createElement('div');
      div.className = 'card';
      div.style.display='flex'; div.style.justifyContent='space-between'; div.style.alignItems='center';
      div.innerHTML = `<div>
        <div style="font-weight:700">${esc(it.name)} — ₹${it.price}</div>
        <div class="small">${esc(it.desc)}</div>
        <div class="tags">${(it.tags||[]).join(', ')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn-ghost edit" data-id="${it.id}">Edit</button>
        <button class="btn delete" data-id="${it.id}">Delete</button>
      </div>`;
      area.appendChild(div);
    });
    area.querySelectorAll('.edit').forEach(b=>b.addEventListener('click', ()=>{
      const id = b.getAttribute('data-id');
      const item = loadMenu().find(x=>x.id===id);
      if(!item) return;
      window._editingId = id;
      document.getElementById('form-title').textContent = 'Edit Item';
      document.getElementById('item-name').value = item.name;
      document.getElementById('item-desc').value = item.desc;
      document.getElementById('item-price').value = item.price;
      document.getElementById('item-tags').value = (item.tags||[]).join(', ');
      document.getElementById('item-form').style.display = 'block';
    }));
    area.querySelectorAll('.delete').forEach(b=>b.addEventListener('click', ()=>{
      const id = b.getAttribute('data-id');
      if(!confirm('Delete item?')) return;
      const next = loadMenu().filter(x=>x.id!==id);
      saveMenu(next); renderAdminList();
    }));
  }

  /* Auth UI in nav */
  function renderAuthUI(){
    const user = getUser();
    const loginLink = document.querySelector('a[href="login.html"]');
    const signupLink = document.querySelector('a[href="signup.html"]');
    if(user){
      if(loginLink) loginLink.style.display='none';
      if(signupLink) signupLink.style.display='none';
      let badge = document.getElementById('nav-user-badge');
      if(!badge){
        badge = document.createElement('div'); badge.id='nav-user-badge';
        badge.className='user-badge'; badge.style.marginLeft='8px';
        badge.textContent = user.name + (user.role==='admin'?' (admin)':'');
        const nav = document.querySelector('.nav-actions');
        nav.appendChild(badge);
        const logout = document.createElement('button'); logout.textContent='Logout'; logout.className='btn'; logout.id='nav-logout';
        logout.style.marginLeft='6px';
        nav.appendChild(logout);
        logout.addEventListener('click', ()=>{ clearUser(); window.location.href='index.html'; });
      } else {
        badge.textContent = user.name + (user.role==='admin'?' (admin)':'');
      }
    } else {
      if(loginLink) loginLink.style.display='inline-block';
      if(signupLink) signupLink.style.display='inline-block';
      const exists = document.getElementById('nav-user-badge');
      if(exists) exists.remove();
      const lo = document.getElementById('nav-logout'); if(lo) lo.remove();
    }
  }

  // expose helpers for debug
  window._debug = { loadMenu, saveMenu, loadUsers, saveUsers, loadOrders, saveOrders, loadCart, saveCart, getUser, setUser, clearUser };

  ensureSeeded();

})();
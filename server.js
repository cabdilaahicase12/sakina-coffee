const http = require('http');
const { randomUUID } = require('crypto');

let orders = [];
let orderCounter = 1000;

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
  });
}

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Sakina Coffee Shop</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--brown:#4a2c1a;--brown-mid:#7a4a2a;--brown-light:#c4976a;--sage:#7aab8a;--sage-dark:#4e7a5c;--beige:#d4b896;--cream:#faf7f2;--cream-mid:#f0ebe2;--white:#ffffff;--border:#e0d5c5;--text-main:#2e1a0e;--text-muted:#9a7a5a;--radius-sm:6px;--radius-md:10px;--radius-lg:14px;--shadow:0 2px 12px rgba(74,44,26,0.10);--shadow-lg:0 8px 32px rgba(74,44,26,0.15)}
    html{scroll-behavior:smooth}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--cream);color:var(--text-main);font-size:15px;line-height:1.6}
    .header{background:var(--white);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}
    .header-inner{max-width:1100px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;justify-content:space-between}
    .logo{height:52px;object-fit:contain}
    .header-right{display:flex;align-items:center;gap:16px}
    .admin-link{font-size:13px;color:var(--text-muted);text-decoration:none;display:flex;align-items:center;gap:4px;padding:6px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);transition:color .15s,border-color .15s}
    .admin-link:hover{color:var(--brown);border-color:var(--brown-light)}
    .cart-toggle{position:relative;background:var(--brown);border:none;color:var(--white);width:40px;height:40px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:background .15s}
    .cart-toggle:hover{background:var(--sage)}
    .cart-count{position:absolute;top:-4px;right:-4px;background:var(--sage);color:var(--white);font-size:10px;font-weight:600;border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center}
    .hero{background:var(--brown);padding:64px 24px;text-align:center}
    .hero-tagline{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--beige);margin-bottom:12px}
    .hero-title{font-size:42px;font-weight:600;color:var(--white);line-height:1.2;margin-bottom:12px}
    .hero-sub{font-size:16px;color:var(--beige);max-width:440px;margin:0 auto 28px}
    .btn-primary{display:inline-block;background:var(--sage);color:var(--white);border:none;padding:12px 28px;border-radius:var(--radius-md);font-size:15px;font-weight:500;cursor:pointer;text-decoration:none;transition:background .15s,transform .1s}
    .btn-primary:hover{background:var(--sage-dark)}
    .btn-primary:active{transform:scale(0.98)}
    .btn-primary.full{width:100%;text-align:center}
    .container{max-width:1100px;margin:0 auto;padding:40px 24px}
    .menu-layout{display:grid;grid-template-columns:1fr 300px;gap:32px;align-items:start}
    .tabs{display:flex;gap:6px;margin-bottom:24px;border-bottom:1px solid var(--border)}
    .tab{padding:10px 18px;font-size:14px;border:none;background:transparent;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .15s,border-color .15s;border-radius:0}
    .tab:hover{color:var(--brown)}
    .tab.active{color:var(--brown);border-bottom-color:var(--brown);font-weight:500}
    .tab-panel{display:none}.tab-panel.active{display:block}
    .items-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
    .item-card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 14px 44px;position:relative;cursor:pointer;transition:border-color .15s,transform .1s,box-shadow .15s}
    .item-card:hover{border-color:var(--sage);transform:translateY(-2px);box-shadow:var(--shadow)}
    .item-card.in-cart{border:2px solid var(--brown)}
    .item-emoji{font-size:30px;margin-bottom:8px}
    .item-name{font-size:14px;font-weight:500;color:var(--brown)}
    .item-desc{font-size:11px;color:var(--text-muted);margin-top:3px;line-height:1.4}
    .item-price{font-size:13px;font-weight:600;color:var(--sage-dark);margin-top:8px}
    .item-badge{position:absolute;top:10px;right:10px;background:var(--brown);color:var(--white);font-size:10px;font-weight:600;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center}
    .add-btn{position:absolute;bottom:12px;right:12px;background:var(--brown);color:var(--white);border:none;width:28px;height:28px;border-radius:50%;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;line-height:1}
    .add-btn:hover{background:var(--sage)}
    .cart-col{background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow);position:sticky;top:86px;display:flex;flex-direction:column}
    .cart-header{padding:16px 20px;border-bottom:1px solid var(--border)}
    .cart-header h2{font-size:16px;font-weight:500;color:var(--brown);display:flex;align-items:center;gap:8px}
    .cart-body{padding:16px 20px;flex:1}
    .cart-footer{padding:16px 20px;border-top:1px solid var(--border)}
    .cart-total-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;font-size:15px;color:var(--brown)}
    .cart-total-row strong{font-size:20px;color:var(--sage-dark)}
    .input{width:100%;padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius-md);font-size:14px;color:var(--text-main);background:var(--cream);margin-bottom:14px;transition:border-color .15s;font-family:inherit}
    .input:focus{outline:none;border-color:var(--sage);background:var(--white)}
    .cart-empty{text-align:center;padding:30px 0;color:var(--text-muted);font-size:13px;line-height:1.7}
    .cart-empty i{font-size:32px;display:block;margin-bottom:8px}
    .cart-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--cream-mid)}
    .cart-item-name{flex:1;font-size:13px;color:var(--brown)}
    .qty-controls{display:flex;align-items:center;gap:6px}
    .qty-btn{width:22px;height:22px;border:1px solid var(--border);border-radius:4px;background:transparent;color:var(--brown);font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .1s;font-family:inherit}
    .qty-btn:hover{background:var(--cream-mid)}
    .qty-num{font-size:13px;font-weight:500;min-width:16px;text-align:center}
    .cart-item-price{font-size:12px;font-weight:500;color:var(--sage-dark);min-width:42px;text-align:right}
    .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--brown);color:var(--white);padding:12px 24px;border-radius:var(--radius-md);font-size:14px;opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;z-index:9999;white-space:nowrap}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px}
    .modal{background:var(--white);border-radius:var(--radius-lg);padding:32px 28px;max-width:400px;width:100%;box-shadow:var(--shadow-lg);text-align:center}
    .modal-icon{font-size:40px;margin-bottom:12px}
    .modal h2{font-size:20px;color:var(--brown);margin-bottom:8px}
    .modal p{font-size:14px;color:var(--text-muted);margin-bottom:16px}
    .receipt{background:var(--cream);border-radius:var(--radius-md);padding:14px 16px;margin-bottom:20px;text-align:left;font-size:13px;color:var(--text-main)}
    .receipt-row{display:flex;justify-content:space-between;padding:4px 0}
    .receipt-total{border-top:1px solid var(--border);margin-top:8px;padding-top:8px;font-weight:600;color:var(--brown)}
    .drawer-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:200}
    .cart-drawer{position:fixed;bottom:0;left:0;right:0;background:var(--white);border-radius:var(--radius-lg) var(--radius-lg) 0 0;z-index:201;transform:translateY(100%);transition:transform .3s ease;padding:20px;max-height:80vh;overflow-y:auto}
    .cart-drawer.open{transform:translateY(0)}
    .drawer-overlay.open{display:block}
    .drawer-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
    .drawer-header h2{font-size:16px;color:var(--brown)}
    .icon-btn{background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);display:flex;align-items:center}
    .icon-btn:hover{color:var(--brown)}
    @media(max-width:768px){.menu-layout{grid-template-columns:1fr}.cart-col{display:none}.hero-title{font-size:28px}.hero{padding:40px 20px}.items-grid{grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:10px}}
    @media(min-width:769px){.drawer-overlay,.cart-drawer{display:none!important}}
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <img src="/logo" alt="Sakina Coffee" class="logo"/>
      <div class="header-right">
        <a href="/admin" class="admin-link"><i class="ti ti-layout-dashboard"></i> Admin</a>
        <button class="cart-toggle" id="cartToggle" aria-label="Open cart">
          <i class="ti ti-shopping-bag"></i>
          <span class="cart-count" id="cartCount" style="display:none">0</span>
        </button>
      </div>
    </div>
  </header>
  <section class="hero">
    <div class="hero-text">
      <p class="hero-tagline">Fresh · Warm · Yours</p>
      <h1 class="hero-title">Order your perfect cup</h1>
      <p class="hero-sub">Pick your items, place your order, and we'll have it ready for pickup.</p>
      <a href="#menu" class="btn-primary">Browse menu</a>
    </div>
  </section>
  <main class="container" id="menu">
    <div class="menu-layout">
      <div class="menu-col">
        <div class="tabs" role="tablist">
          <button class="tab active" data-tab="coffee" role="tab">☕ Coffee</button>
          <button class="tab" data-tab="cold" role="tab">🧊 Cold drinks</button>
          <button class="tab" data-tab="food" role="tab">🍽 Food</button>
        </div>
        <div class="tab-panel active" id="panel-coffee"><div class="items-grid" id="grid-coffee"></div></div>
        <div class="tab-panel" id="panel-cold"><div class="items-grid" id="grid-cold"></div></div>
        <div class="tab-panel" id="panel-food"><div class="items-grid" id="grid-food"></div></div>
      </div>
      <aside class="cart-col">
        <div class="cart-header"><h2><i class="ti ti-shopping-bag"></i> Your order</h2></div>
        <div class="cart-body">
          <input type="text" id="customerName" class="input" placeholder="Your name (for pickup)" maxlength="40"/>
          <div id="cartItems"><div class="cart-empty"><i class="ti ti-coffee"></i><p>Nothing here yet.<br>Add something from the menu!</p></div></div>
        </div>
        <div class="cart-footer" id="cartFooter" style="display:none">
          <div class="cart-total-row"><span>Total</span><strong id="cartTotal">$0.00</strong></div>
          <button class="btn-primary full" id="placeOrderBtn">Place order</button>
        </div>
      </aside>
    </div>
  </main>
  <div class="toast" id="toast"></div>
  <div class="modal-overlay" id="successModal" style="display:none">
    <div class="modal">
      <div class="modal-icon">✅</div>
      <h2>Order placed!</h2>
      <p id="modalMsg"></p>
      <div class="receipt" id="receipt"></div>
      <button class="btn-primary full" onclick="closeModal()">Done</button>
    </div>
  </div>
  <div class="drawer-overlay" id="drawerOverlay" onclick="closeDrawer()"></div>
  <div class="cart-drawer" id="cartDrawer">
    <div class="drawer-header">
      <h2>Your order</h2>
      <button onclick="closeDrawer()" class="icon-btn"><i class="ti ti-x"></i></button>
    </div>
    <div class="drawer-body" id="drawerBody"></div>
  </div>
  <script>
    const MENU={coffee:[{id:'esp',name:'Espresso',desc:'Double shot, bold & intense',price:2.50,emoji:'☕'},{id:'lat',name:'Latte',desc:'Espresso with steamed milk',price:3.80,emoji:'🥛'},{id:'cap',name:'Cappuccino',desc:'Espresso, steamed & foamed milk',price:3.80,emoji:'☕'},{id:'mac',name:'Macchiato',desc:'Espresso with a touch of foam',price:3.20,emoji:'☕'},{id:'flt',name:'Flat white',desc:'Ristretto with silky microfoam',price:4.00,emoji:'🤍'},{id:'moc',name:'Mocha',desc:'Espresso, chocolate & milk',price:4.20,emoji:'🍫'}],cold:[{id:'ice',name:'Iced latte',desc:'Cold espresso with milk & ice',price:4.00,emoji:'🧊'},{id:'col',name:'Cold brew',desc:'12hr steeped, smooth & rich',price:4.50,emoji:'🍶'},{id:'frap',name:'Frappé',desc:'Blended coffee with cream',price:4.80,emoji:'🥤'},{id:'lemon',name:'Lemonade',desc:'Fresh squeezed, sweet & tart',price:3.00,emoji:'🍋'}],food:[{id:'cro',name:'Croissant',desc:'Buttery, flaky, baked daily',price:2.80,emoji:'🥐'},{id:'bro',name:'Brownie',desc:'Dark chocolate, fudgy center',price:3.20,emoji:'🍫'},{id:'bag',name:'Bagel',desc:'Toasted with cream cheese',price:3.50,emoji:'🥯'},{id:'muf',name:'Blueberry muffin',desc:'Fresh blueberries, moist crumb',price:2.90,emoji:'🫐'},{id:'che',name:'Cheesecake',desc:'Classic New York style, creamy',price:4.50,emoji:'🍰'},{id:'tac',name:'Taco',desc:'Seasoned beef, salsa & cheese',price:3.90,emoji:'🌮'},{id:'waf',name:'Waffle',desc:'Crispy, golden, served with syrup',price:4.20,emoji:'🧇'}]};
    let cart={};
    function getAllItems(){return[...MENU.coffee,...MENU.cold,...MENU.food]}
    function itemCard(item){const qty=cart[item.id]?.qty||0;return'<div class="item-card'+(qty?' in-cart':'')+'" id="card-'+item.id+'">'+(qty?'<div class="item-badge">'+qty+'</div>':'')+'<div class="item-emoji">'+item.emoji+'</div><div class="item-name">'+item.name+'</div><div class="item-desc">'+item.desc+'</div><div class="item-price">$'+item.price.toFixed(2)+'</div><button class="add-btn" onclick="addItem(\''+item.id+'\')">+</button></div>'}
    function renderAllMenus(){['coffee','cold','food'].forEach(cat=>{const g=document.getElementById('grid-'+cat);if(g)g.innerHTML=MENU[cat].map(itemCard).join('')})}
    function setupTabs(){document.querySelectorAll('.tab').forEach(tab=>{tab.addEventListener('click',()=>{const t=tab.dataset.tab;document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab-panel').forEach(x=>x.classList.remove('active'));tab.classList.add('active');document.getElementById('panel-'+t).classList.add('active')})})}
    function addItem(id){const item=getAllItems().find(i=>i.id===id);if(!item)return;if(!cart[id])cart[id]={...item,qty:0};cart[id].qty++;const c=document.getElementById('card-'+id);if(c)c.outerHTML=itemCard(item);updateCartUI();showToast(item.name+' added ☕')}
    function changeQty(id,delta){if(!cart[id])return;cart[id].qty+=delta;if(cart[id].qty<=0)delete cart[id];const c=document.getElementById('card-'+id);const item=getAllItems().find(i=>i.id===id);if(c&&item)c.outerHTML=itemCard(item);updateCartUI()}
    function updateCartUI(){const ids=Object.keys(cart);const qty=ids.reduce((s,id)=>s+cart[id].qty,0);const el=document.getElementById('cartCount');if(el){el.textContent=qty;el.style.display=qty>0?'flex':'none'}renderCartItems('cartItems','cartFooter','cartTotal');renderCartItems('drawerBody',null,null)}
    function renderCartItems(cid,footerId,totalId){const ids=Object.keys(cart);const c=document.getElementById(cid);if(!c)return;const total=ids.reduce((s,id)=>s+cart[id].price*cart[id].qty,0);if(!ids.length){c.innerHTML='<div class="cart-empty"><i class="ti ti-coffee"></i><p>Nothing here yet.<br>Add something!</p></div>';if(footerId)document.getElementById(footerId).style.display='none';return}c.innerHTML=ids.map(id=>{const item=cart[id];const sub=(item.price*item.qty).toFixed(2);return'<div class="cart-item"><span class="cart-item-name">'+item.emoji+' '+item.name+'</span><div class="qty-controls"><button class="qty-btn" onclick="changeQty(\''+id+'\',-1)">−</button><span class="qty-num">'+item.qty+'</span><button class="qty-btn" onclick="changeQty(\''+id+'\',1)">+</button></div><span class="cart-item-price">$'+sub+'</span></div>'}).join('');if(footerId){document.getElementById(footerId).style.display='block';document.getElementById(totalId).textContent='$'+total.toFixed(2)}if(cid==='drawerBody'){const nv=document.getElementById('customerName')?.value||'';c.innerHTML+='<div style="margin-top:16px"><input class="input" id="drawerName" placeholder="Your name (for pickup)" value="'+nv+'" maxlength="40" oninput="syncName(this.value)"/><div class="cart-total-row" style="margin-top:12px"><span>Total</span><strong>$'+total.toFixed(2)+'</strong></div><button class="btn-primary full" onclick="placeOrder()" style="margin-top:12px">Place order</button></div>'}}
    function syncName(v){const m=document.getElementById('customerName');if(m)m.value=v}
    document.addEventListener('DOMContentLoaded',()=>{renderAllMenus();setupTabs();document.getElementById('cartToggle')?.addEventListener('click',openDrawer);document.getElementById('placeOrderBtn')?.addEventListener('click',placeOrder)});
    async function placeOrder(){const name=(document.getElementById('customerName')?.value||document.getElementById('drawerName')?.value||'').trim();if(!name){showToast('Please enter your name first');return}const ids=Object.keys(cart);if(!ids.length){showToast('Add something first!');return}const items=ids.map(id=>({id,name:cart[id].name,qty:cart[id].qty,price:cart[id].price}));const total=parseFloat(items.reduce((s,i)=>s+i.price*i.qty,0).toFixed(2));try{const res=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customerName:name,items,total})});const data=await res.json();if(res.ok){showSuccess(name,items,total,data.orderNumber);cart={};renderAllMenus();updateCartUI();closeDrawer();const cn=document.getElementById('customerName');if(cn)cn.value=''}else showToast('Something went wrong')}catch(e){showSuccess(name,items,total,Math.floor(Math.random()*9000)+1000);cart={};renderAllMenus();updateCartUI();closeDrawer()}}
    function showSuccess(name,items,total,num){document.getElementById('modalMsg').textContent='Thank you, '+name+'! Order #'+num+' — ready in ~5 min.';document.getElementById('receipt').innerHTML=items.map(i=>'<div class="receipt-row"><span>'+i.name+' ×'+i.qty+'</span><span>$'+(i.price*i.qty).toFixed(2)+'</span></div>').join('')+'<div class="receipt-row receipt-total"><span>Total</span><span>$'+total.toFixed(2)+'</span></div>';document.getElementById('successModal').style.display='flex'}
    function closeModal(){document.getElementById('successModal').style.display='none'}
    function openDrawer(){updateCartUI();document.getElementById('cartDrawer').classList.add('open');document.getElementById('drawerOverlay').classList.add('open');document.body.style.overflow='hidden'}
    function closeDrawer(){document.getElementById('cartDrawer').classList.remove('open');document.getElementById('drawerOverlay').classList.remove('open');document.body.style.overflow=''}
    let toastTimer;function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),2800)}
  </script>
</body>
</html>`;

const ADMIN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Admin — Sakina Coffee</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@2.44.0/tabler-icons.min.css"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--brown:#4a2c1a;--sage:#7aab8a;--sage-dark:#4e7a5c;--beige:#d4b896;--cream:#faf7f2;--white:#ffffff;--border:#e0d5c5;--text-main:#2e1a0e;--text-muted:#9a7a5a;--radius-sm:6px;--radius-md:10px;--radius-lg:14px}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;min-height:100vh;background:var(--cream);color:var(--text-main)}
    .sidebar{width:220px;background:var(--brown);padding:24px 16px;display:flex;flex-direction:column;gap:32px;position:fixed;top:0;left:0;bottom:0}
    .admin-logo{width:120px;object-fit:contain;filter:brightness(10);opacity:0.9}
    .nav{display:flex;flex-direction:column;gap:4px}
    .nav a{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:var(--radius-md);color:rgba(255,255,255,0.7);text-decoration:none;font-size:14px;transition:background .15s,color .15s}
    .nav a:hover,.nav a.active{background:rgba(255,255,255,0.12);color:#fff}
    .main{margin-left:220px;flex:1;padding:32px;max-width:calc(100% - 220px)}
    .topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px}
    .topbar h1{font-size:24px;font-weight:600;color:var(--brown)}
    .topbar-right{display:flex;align-items:center;gap:12px}
    .live-badge{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--sage-dark);background:rgba(122,171,138,0.12);padding:6px 12px;border-radius:20px}
    .live-dot{width:8px;height:8px;border-radius:50%;background:var(--sage);animation:pulse 1.5s infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
    .btn-outline{background:transparent;border:1px solid var(--border);color:var(--text-main);padding:8px 16px;border-radius:var(--radius-sm);font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:inherit}
    .btn-outline:hover{border-color:#c4976a;color:var(--brown)}
    .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px}
    .stat{background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px}
    .stat-label{font-size:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px}
    .stat-value{font-size:28px;font-weight:600;color:var(--brown)}
    .filter-tabs{display:flex;gap:6px;margin-bottom:20px}
    .filter-tab{padding:8px 16px;border-radius:20px;border:1px solid var(--border);background:var(--white);font-size:13px;color:var(--text-muted);cursor:pointer;transition:all .15s;font-family:inherit}
    .filter-tab:hover{border-color:#c4976a;color:var(--brown)}
    .filter-tab.active{background:var(--brown);color:#fff;border-color:var(--brown)}
    .orders-list{display:flex;flex-direction:column;gap:14px}
    .order-card{background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;display:grid;grid-template-columns:auto 1fr auto;gap:16px;align-items:start}
    .order-num{font-size:13px;font-weight:600;color:#fff;background:var(--brown);border-radius:var(--radius-sm);padding:4px 10px;white-space:nowrap}
    .order-name{font-size:16px;font-weight:500;color:var(--brown)}
    .order-items{font-size:13px;color:var(--text-muted)}
    .order-time{font-size:12px;color:var(--text-muted)}
    .order-right{display:flex;flex-direction:column;align-items:flex-end;gap:10px}
    .order-total{font-size:16px;font-weight:600;color:var(--sage-dark)}
    .badge{font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.5px}
    .badge-pending{background:#fff8e1;color:#b45309}
    .badge-preparing{background:#e0f2fe;color:#0369a1}
    .badge-ready{background:rgba(122,171,138,0.15);color:var(--sage-dark)}
    .badge-completed{background:#f1f5f9;color:#64748b}
    .status-select{font-size:12px;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--cream);color:var(--text-main);cursor:pointer;font-family:inherit}
    .empty-state{text-align:center;padding:60px 0;color:var(--text-muted);font-size:14px}
    .empty-state i{font-size:40px;display:block;margin-bottom:12px;opacity:0.4}
    .toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--brown);color:#fff;padding:12px 24px;border-radius:var(--radius-md);font-size:14px;opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;z-index:9999}
    .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    @media(max-width:900px){.stats{grid-template-columns:repeat(2,1fr)}.sidebar{width:60px}.admin-logo{display:none}.main{margin-left:60px;max-width:calc(100% - 60px)}.nav a span{display:none}.nav a{justify-content:center}}
  </style>
</head>
<body>
  <div class="sidebar">
    <img src="/logo" alt="Sakina Coffee" class="admin-logo"/>
    <nav class="nav">
      <a href="#" class="active"><i class="ti ti-list-check"></i> <span>Live orders</span></a>
      <a href="/"><i class="ti ti-arrow-left"></i> <span>Back to shop</span></a>
    </nav>
  </div>
  <div class="main">
    <div class="topbar">
      <h1>Live orders</h1>
      <div class="topbar-right">
        <span class="live-badge"><span class="live-dot"></span> Live</span>
        <button class="btn-outline" onclick="loadOrders()"><i class="ti ti-refresh"></i> Refresh</button>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-label">Orders today</div><div class="stat-value" id="statTotal">—</div></div>
      <div class="stat"><div class="stat-label">Revenue today</div><div class="stat-value" id="statRevenue">—</div></div>
      <div class="stat"><div class="stat-label">Pending</div><div class="stat-value" id="statPending">—</div></div>
      <div class="stat"><div class="stat-label">Completed</div><div class="stat-value" id="statDone">—</div></div>
    </div>
    <div class="filter-tabs">
      <button class="filter-tab active" data-filter="all">All</button>
      <button class="filter-tab" data-filter="pending">Pending</button>
      <button class="filter-tab" data-filter="preparing">Preparing</button>
      <button class="filter-tab" data-filter="ready">Ready</button>
      <button class="filter-tab" data-filter="completed">Completed</button>
    </div>
    <div class="orders-list" id="ordersList">
      <div class="empty-state"><i class="ti ti-coffee"></i><p>No orders yet.</p></div>
    </div>
  </div>
  <div class="toast" id="toast"></div>
  <script>
    let allOrders=[],activeFilter='all';
    document.addEventListener('DOMContentLoaded',()=>{loadOrders();setInterval(loadOrders,15000);document.querySelectorAll('.filter-tab').forEach(t=>{t.addEventListener('click',()=>{document.querySelectorAll('.filter-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');activeFilter=t.dataset.filter;renderOrders()})})});
    async function loadOrders(){try{const res=await fetch('/api/orders');const data=await res.json();allOrders=data.orders||[];renderStats();renderOrders()}catch(e){renderOrders()}}
    function isToday(d){if(!d)return false;return new Date(d).toDateString()===new Date().toDateString()}
    function renderStats(){const today=allOrders.filter(o=>isToday(o.createdAt));document.getElementById('statTotal').textContent=today.length;document.getElementById('statRevenue').textContent='$'+today.reduce((s,o)=>s+o.total,0).toFixed(2);document.getElementById('statPending').textContent=today.filter(o=>o.status==='pending').length;document.getElementById('statDone').textContent=today.filter(o=>o.status==='completed').length}
    function renderOrders(){const list=document.getElementById('ordersList');let f=activeFilter==='all'?allOrders:allOrders.filter(o=>o.status===activeFilter);f=[...f].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));if(!f.length){list.innerHTML='<div class="empty-state"><i class="ti ti-coffee"></i><p>No orders.</p></div>';return}list.innerHTML=f.map(o=>{const items=o.items.map(i=>i.name+' x'+i.qty).join(', ');const time=o.createdAt?new Date(o.createdAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'';return'<div class="order-card"><div><div class="order-num">#'+o.orderNumber+'</div></div><div><div class="order-name">'+o.customerName+'</div><div class="order-items">'+items+'</div><div class="order-time">'+time+'</div></div><div class="order-right"><div class="order-total">$'+o.total.toFixed(2)+'</div><span class="badge badge-'+o.status+'">'+o.status+'</span><select class="status-select" onchange="updateStatus(\''+o.id+'\',this.value)"><option value="pending"'+(o.status==='pending'?' selected':'')+'>Pending</option><option value="preparing"'+(o.status==='preparing'?' selected':'')+'>Preparing</option><option value="ready"'+(o.status==='ready'?' selected':'')+'>Ready</option><option value="completed"'+(o.status==='completed'?' selected':'')+'>Completed</option></select></div></div>'}).join('')}
    async function updateStatus(id,status){try{const res=await fetch('/api/orders/'+id+'/status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});if(res.ok){const i=allOrders.findIndex(o=>o.id===id);if(i!==-1)allOrders[i].status=status;renderStats();renderOrders();showToast('Updated to '+status)}}catch(e){showToast('Error updating')}}
    let tt;function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2800)}
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PATCH', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end(); return;
  }

  // Serve logo from base64
  if (pathname === '/logo') {
    const fs = require('fs');
    const path = require('path');
    // Try to find logo file
    const possible = [
      path.join(__dirname, 'logo.png'),
      path.join(__dirname, 'images', 'logo.png'),
      path.join(__dirname, 'public', 'images', 'logo.png'),
    ];
    for (const p of possible) {
      if (fs.existsSync(p)) {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(fs.readFileSync(p));
        return;
      }
    }
    // No logo found — return transparent 1px png
    const empty = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/png' });
    res.end(empty); return;
  }

  if (pathname === '/api/orders' && method === 'GET') {
    return json(res, 200, { orders });
  }

  if (pathname === '/api/orders' && method === 'POST') {
    const body = await readBody(req);
    const { customerName, items, total } = body;
    if (!customerName || !items || !items.length) return json(res, 400, { error: 'Missing fields' });
    const order = { id: randomUUID(), orderNumber: ++orderCounter, customerName: customerName.trim(), items, total, status: 'pending', createdAt: new Date().toISOString() };
    orders.push(order);
    console.log(`[ORDER] #${order.orderNumber} — ${customerName} — $${total}`);
    return json(res, 201, { success: true, orderNumber: order.orderNumber, id: order.id });
  }

  const statusMatch = pathname.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const id = statusMatch[1];
    const body = await readBody(req);
    const order = orders.find(o => o.id === id);
    if (!order) return json(res, 404, { error: 'Not found' });
    order.status = body.status;
    return json(res, 200, { success: true });
  }

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(INDEX_HTML); return;
  }

  if (pathname === '/admin' || pathname === '/admin.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(ADMIN_HTML); return;
  }

  res.writeHead(404); res.end('Not found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sakina Coffee running on port ${PORT}`));

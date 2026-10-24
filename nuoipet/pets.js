(()=> {
  'use strict';

  const PETS = {
    cow:{name:'Bò sữa',icon:'🐄',feed:'wheat',feedIcon:'🌾',product:'milk',productIcon:'🥛',productName:'Sữa bò',time:20000,price:80},
    chicken:{name:'Gà',icon:'🐔',feed:'carrot',feedIcon:'🥕',product:'egg',productIcon:'🥚',productName:'Trứng gà',time:12000,price:45},
    rabbit:{name:'Thỏ',icon:'🐇',feed:'carrot',feedIcon:'🥕',product:'fur',productIcon:'🧶',productName:'Lông thỏ',time:15000,price:60}
  };

  const save=()=>window.nongTrai&&window.nongTrai.save&&window.nongTrai.save();
  const refresh=()=>window.nongTrai&&window.nongTrai.refresh&&window.nongTrai.refresh();
  const toast=m=>window.nongTrai&&window.nongTrai.toast?window.nongTrai.toast(m):alert(m);
  const state=()=>window.nongTrai&&window.nongTrai.state?window.nongTrai.state():null;

  function ensure(){
    const s=state(); if(!s)return null;
    s.inventory=s.inventory||{};
    s.pets=s.pets||[];
    return s;
  }

  function inv(s,k){return Number(s.inventory[k]||0);}
  function add(s,k,n){s.inventory[k]=Math.max(0,inv(s,k)+n);}
  function money(s){return Number(s.coins||0);}
  function esc(x){return String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

  function open(){
    const s=ensure(); if(!s)return;
    const modal=document.getElementById('modal'), title=document.getElementById('mt'), body=document.getElementById('mb');
    if(!modal||!title||!body)return;

    const now=Date.now();
    const rows=s.pets.map((p,i)=>{
      const d=PETS[p.type], ready=now>=p.readyAt;
      const left=Math.max(0,p.readyAt-now);
      return '<div class="pet-card" data-pet="'+i+'">'+
        '<div class="pet-icon">'+d.icon+'</div>'+
        '<div class="pet-info"><b>'+esc(d.name)+'</b><small>Ăn '+d.feedIcon+' '+esc(d.feed==='wheat'?'Lúa mì':'Cà rốt')+
        ' · Cho ra '+d.productIcon+' '+esc(d.productName)+'</small>'+
        '<strong>'+(ready?'✅ Sẵn sàng thu hoạch':'⏱️ '+Math.ceil(left/1000)+'s')+'</strong></div>'+
        '<div class="pet-actions">'+
        '<button class="pet-btn" data-feed="'+i+'">'+d.feedIcon+' Cho ăn</button>'+
        '<button class="pet-btn" data-collect="'+i+'" '+(ready?'':'disabled')+'>'+d.productIcon+' Thu hoạch</button>'+
        '</div></div>';
    }).join('');

    body.innerHTML=
      '<div class="pet-shop">'+
      '<div class="pet-summary">🐾 Đang nuôi <b>'+s.pets.length+'</b> con · 🪙 '+money(s)+' xu</div>'+
      '<div class="pet-list">'+(rows||'<div class="pet-empty">Chưa có vật nuôi. Hãy mua con đầu tiên bên dưới.</div>')+'</div>'+
      '<h3 class="pet-heading">🛒 Mua vật nuôi</h3>'+
      '<div class="pet-buy">'+Object.entries(PETS).map(([k,d])=>
        '<button class="pet-buy-btn" data-buy="'+k+'">'+d.icon+' <b>'+d.name+'</b><small>🪙 '+d.price+'</small></button>'
      ).join('')+'</div>'+
      '<p class="pet-note">Mỗi con cần thức ăn từ kho. Khi đủ thời gian sẽ cho sản phẩm đưa thẳng vào kho.</p>'+
      '</div>';
    title.textContent='🐄 Chuồng · Nuôi Thú';
    modal.classList.add('on');

    body.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy));
    body.querySelectorAll('[data-feed]').forEach(b=>b.onclick=()=>feed(+b.dataset.feed));
    body.querySelectorAll('[data-collect]').forEach(b=>b.onclick=()=>collect(+b.dataset.collect));
  }

  function buy(type){
    const s=ensure(),d=PETS[type]; if(!s||!d)return;
    if(money(s)<d.price){toast('Không đủ xu để mua '+d.icon+' '+d.name);return;}
    s.coins-=d.price;
    s.pets.push({type,readyAt:0,working:false});
    save();refresh();toast('Đã mua '+d.icon+' '+d.name);open();
  }

  function feed(i){
    const s=ensure(),p=s&&s.pets[i]; if(!p)return;
    const d=PETS[p.type], now=Date.now();
    if(p.working && now<p.readyAt){toast(d.icon+' đang lớn/sản xuất...');return;}
    if(inv(s,d.feed)<1){toast('Kho không có '+d.feedIcon+' '+(d.feed==='wheat'?'Lúa mì':'Cà rốt'));return;}
    add(s,d.feed,-1);
    p.working=true;
    p.readyAt=now+d.time;
    save();refresh();toast('Đã cho '+d.icon+' '+d.name+' ăn');open();
  }

  function collect(i){
    const s=ensure(),p=s&&s.pets[i]; if(!p)return;
    const d=PETS[p.type];
    if(!p.working||Date.now()<p.readyAt){toast('Chưa đến lúc thu hoạch');return;}
    add(s,d.product,1);
    p.working=false;p.readyAt=0;
    save();refresh();toast('+1 '+d.productIcon+' '+d.productName);open();
  }

  function tick(){
    const s=ensure(); if(!s)return;
    const m=document.getElementById('modal');
    if(m&&m.classList.contains('on')&&document.getElementById('mt')?.textContent.includes('Chuồng'))open();
  }

  window.nongPet={open,buy,feed,collect,state:ensure};
  setInterval(tick,1000);
})();
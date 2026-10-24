(()=>{'use strict';
if(window.nongPet)return;

const TYPES={
 pet1:{name:'Vật nuôi 1',img:'./img/spr-1.webp',baby:'./img/spr-1.webp',price:50,product:'🎁 Sản phẩm',value:25,grow:40},
 pet2:{name:'Vật nuôi 2',img:'./img/spr-2.webp',baby:'./img/spr-2.webp',price:60,product:'🎁 Sản phẩm',value:30,grow:45},
 pet3:{name:'Vật nuôi 3',img:'./img/spr-3.webp',baby:'./img/spr-3.webp',price:70,product:'🎁 Sản phẩm',value:35,grow:50},
 pet4:{name:'Vật nuôi 4',img:'./img/spr-4.webp',baby:'./img/spr-4.webp',price:80,product:'🎁 Sản phẩm',value:40,grow:55},
 pet5:{name:'Vật nuôi 5',img:'./img/spr-5.webp',baby:'./img/spr-5.webp',price:90,product:'🎁 Sản phẩm',value:45,grow:60},
 pet6:{name:'Vật nuôi 6',img:'./img/spr-6.webp',baby:'./img/spr-6.webp',price:100,product:'🎁 Sản phẩm',value:50,grow:65},
 pet7:{name:'Vật nuôi 7',img:'./img/spr-7.webp',baby:'./img/spr-7.webp',price:110,product:'🎁 Sản phẩm',value:55,grow:70},
 pet8:{name:'Vật nuôi 8',img:'./img/spr-8.webp',baby:'./img/spr-8.webp',price:120,product:'🎁 Sản phẩm',value:60,grow:75},
 pet9:{name:'Vật nuôi 9',img:'./img/spr-9.webp',baby:'./img/spr-9.webp',price:130,product:'🎁 Sản phẩm',value:65,grow:80}
};

const S=window.nongTrai.state();
S.pets=S.pets||{animals:[],capacity:4,feed:0};
S.pets.animals=S.pets.animals||[];
S.pets.capacity=Number(S.pets.capacity||4);

const save=()=>window.nongTrai.save?.();
const hud=()=>window.nongTrai.refresh?.();
const toast=m=>window.nongTrai.toast?.(m);
const coins=()=>Number(S.coins||0);
const setCoins=v=>S.coins=Math.max(0,Number(v)||0);
const feedCount=()=>Number(S.pets.feed||0);

function addCoins(n){setCoins(coins()+n);hud();save()}
function spendCoins(n){if(coins()<n)return false;setCoins(coins()-n);hud();save();return true}
function petIcon(p){return TYPES[p.type]?.img||TYPES.pet1.img}

function ensureIds(){
  S.pets.animals.forEach((p,i)=>{if(!p.id)p.id='pet_'+Date.now()+'_'+i})
}

function age(p){
  p.growth=Math.max(0,Math.min(100,Number(p.growth)||0));
  if(p.growth>=100&&p.stage!=='adult'){
    p.stage='adult';p.growth=100;p.readyAt=0;
    toast('🎉 '+TYPES[p.type].name+' đã trưởng thành!');
    save();
  }
}

function createPet(type){
  const t=TYPES[type];
  if(!t)return;
  if(S.pets.animals.length>=S.pets.capacity){toast('🐾 Chuồng đã đầy!');return}
  if(coins()<t.price){toast('🪙 Không đủ xu!');return}
  if(!spendCoins(t.price)){toast('🪙 Không đủ xu!');return}
  S.pets.animals.push({
    id:'pet_'+Date.now()+'_'+Math.floor(Math.random()*9999),
    type,stage:'baby',readyAt:0,growth:0,
    hunger:0,lastFed:Date.now(),products:0
  });
  save();hud();render();setTimeout(startWalking,50);
  toast('🐾 Đã mua '+t.name+' · -🪙'+t.price);
}

function feedPet(id){
  const p=S.pets.animals.find(x=>x.id===id);
  if(!p)return;
  age(p);
  if(p.stage==='adult'){toast('✅ Vật nuôi đã trưởng thành 100%');return}
  if(feedCount()<=0){toast('🌾 Hết thức ăn!');return}
  S.pets.feed--;
  p.hunger=100;
  p.growth=Math.min(100,(Number(p.growth)||0)+25);
  p.lastFed=Date.now();
  age(p);
  save();render();
  toast('🍚 Đã cho ăn · Lớn '+p.growth+'%');
}

function collectPet(id){
  const p=S.pets.animals.find(x=>x.id===id);
  if(!p)return;
  age(p);
  if(p.products<=0){toast('⏳ Chưa có sản phẩm!');return}
  const t=TYPES[p.type];
  const amount=p.products;
  p.products=0;
  addCoins(amount*t.value);
  toast('🎁 +'+amount+' '+t.product+' · 🪙'+amount*t.value);
  render();setTimeout(startWalking,50);
}

function sellPet(id){
  const i=S.pets.animals.findIndex(x=>x.id===id);
  if(i<0)return;
  const p=S.pets.animals[i],t=TYPES[p.type];
  age(p);
  if((Number(p.growth)||0)<100){toast('🐾 Vật nuôi chưa lớn 100%, chưa thể bán!');return}
  const price=Math.floor(t.price*2.25);
  if(!confirm('Bán '+t.name+' lấy 🪙'+price+'?'))return;
  S.pets.animals.splice(i,1);
  addCoins(price);
  render();setTimeout(startWalking,50);
  toast('Đã bán '+t.name+' · +🪙'+price);
}

function produce(){
  const now=Date.now();
  S.pets.animals.forEach(p=>{
    if(p.stage!=='adult'&&p.hunger>0&&now-(p.lastFed||0)>=12000)p.hunger=0;
  });
  S.pets.animals.forEach(p=>{
    age(p);
    if(p.stage!=='adult')return;
    const t=TYPES[p.type];
    const hungry=p.hunger<20;
    if(hungry)return;
    const elapsed=Math.floor((now-(p.lastProduct||now))/60000);
    if(elapsed>0){
      p.products=Math.min(5,(p.products||0)+Math.min(2,elapsed));
      p.lastProduct=now;
    }
  });
}

function feedAll(){
  if(!S.pets.animals.length){toast('🐾 Chưa có vật nuôi');return}
  if(feedCount()<=0){toast('🌾 Hết thức ăn!');return}
  let n=0;
  S.pets.animals.forEach(p=>{
    if(feedCount()>0&&p.hunger<100){
      S.pets.feed--;p.hunger=Math.min(100,p.hunger+35);p.lastFed=Date.now();n++;
    }
  });
  save();render();toast(n?'❤️ Đã cho '+n+' con ăn':'😊 Tất cả đều đã no');
}

function shop(){
  document.getElementById('pet-shop-popup')?.remove();
  const pop=document.createElement('div');
  pop.id='pet-shop-popup';
  pop.style.cssText='position:fixed;inset:0;z-index:1000;background:#0009;display:grid;place-items:center;padding:16px';
  pop.innerHTML='<div style="width:min(94vw,520px);max-height:82dvh;overflow:auto;background:#fff9df;border:4px solid #8c6330;border-radius:20px;padding:14px"><div style="display:flex;justify-content:space-between;align-items:center"><h2 style="margin:0">🛒 SHOP VẬT NUÔI</h2><button id="petShopClose">✕</button></div><div id="petShopGrid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px"></div></div>';
  document.body.appendChild(pop);
  const grid=pop.querySelector('#petShopGrid');
  Object.entries(TYPES).forEach(([key,t])=>{
    const b=document.createElement('button');
    b.style.cssText='border:2px solid #b4935c;border-radius:14px;background:#fffdf2;padding:8px;font-weight:900;cursor:pointer;color:#3b2919';
    b.innerHTML='<img src="'+t.img+'" style="width:72px;height:72px;object-fit:contain;display:block;margin:auto"><span>'+t.name+'</span><br><small>🪙 '+t.price+'</small>';
    b.onclick=()=>createPet(key);
    grid.appendChild(b);
  });
  pop.querySelector('#petShopClose').onclick=()=>pop.remove();
  pop.onclick=e=>{if(e.target===pop)pop.remove()};
}

function render(){
  const scene=document.getElementById('new-pet-scene');
  if(!scene)return;
  scene.innerHTML='';
  ensureIds();
  S.pets.animals.forEach(p=>{
    age(p);
    const t=TYPES[p.type];
    const el=document.createElement('div');
    el.className='new-pet';
    el.dataset.petId=p.id;
    el.style.position='absolute';
    if(p.walkX==null)p.walkX=10+Math.random()*75;
    if(p.walkY==null)p.walkY=25+Math.random()*55;
    el.style.left=p.walkX+'%';el.style.top=p.walkY+'%';el.style.transform='translate(-50%,-50%)';
    const growth=Math.max(0,Math.min(100,Number(p.growth)||0));
    const status=p.hunger<=0?'🍚':growth+'%';
    el.innerHTML='<img src="'+petIcon(p)+'"><div class="pet-status">'+status+'</div>';
    el.onclick=()=>{if(growth>=100)sellPet(p.id);else feedPet(p.id)};
    scene.appendChild(el);
  });
  const count=document.getElementById('pet-count');
  if(count)count.textContent=S.pets.animals.length+'/'+S.pets.capacity;
  const food=document.getElementById('pet-feed-count');
  if(food)food.textContent=feedCount();
  const money=document.getElementById('pet-money');
  if(money)money.textContent=Math.floor(coins());
  clearTimeout(render.walkRestart);render.walkRestart=setTimeout(startWalking,30);
}

function open(){
  const body=document.getElementById('mb');
  if(!body)return;
  body.innerHTML='<div class="new-ranch"><div class="new-ranch-top"><b>🐾 CHUỒNG NUÔI THÚ</b><span>🐾 <i id="pet-count">0/4</i></span><span>🪙 <i id="pet-money">0</i></span></div><div id="new-pet-scene" class="new-pet-scene"></div><div class="new-ranch-actions"><button id="pet-shop-btn">🛒 MỞ SHOP</button><button id="pet-feed-btn">🌾 Thức ăn: <b id="pet-feed-count">0</b></button></div><div class="new-ranch-help">Mua vật nuôi trong Shop · Cho ăn để lớn · Thu sản phẩm để nhận xu.</div></div>';
  document.getElementById('modal')?.classList.add('on');
  document.getElementById('pet-shop-btn').onclick=shop;
  document.getElementById('pet-feed-btn').onclick=feedAll;
  render();
}

ensureIds();
setInterval(()=>{produce();render()},10000);
function startWalking(){
  const scene=document.getElementById('new-pet-scene');if(!scene)return;
  S.pets.animals.forEach(p=>{
    const el=scene.querySelector('[data-pet-id="'+p.id+'"]');if(!el)return;
    const img=el.querySelector('img');
    const move=()=>{
      if(!el.isConnected)return;
      const nx=8+Math.random()*84,ny=25+Math.random()*58;
      const dx=nx-(p.walkX??nx),dy=ny-(p.walkY??ny);
      const dist=Math.hypot(dx,dy);
      const duration=Math.max(2200,Math.min(6000,dist*55));
      p.walkX=nx;p.walkY=ny;
      el.style.transition='left '+duration+'ms linear, top '+duration+'ms linear';
      if(img){
        const dir=dx<0?-1:1;
        img.style.animation='none';
        img.offsetHeight;
        img.style.setProperty('--pet-dir',dir);
        img.style.animation='petWalk .34s steps(2,end) infinite';
      }
      requestAnimationFrame(()=>{el.style.left=nx+'%';el.style.top=ny+'%'});
      clearTimeout(p.walkTimer);
      p.walkTimer=setTimeout(move,duration+40);
    };
    clearTimeout(p.walkTimer);
    p.walkTimer=setTimeout(move,150+Math.random()*600);
  });
}
setTimeout(startWalking,100);
window.nongPet={open,shop,feed:feedPet,collect:collectPet,buy:createPet,state:()=>S.pets};
})();
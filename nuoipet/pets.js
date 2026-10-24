(()=>{'use strict';
if(window.nongPet)return;

const TYPES={
 pig:{name:'Heo',img:'./img/spr-2.webp',baby:'./img/spr-1.webp',price:60,product:'🥓 Thịt heo',value:35,grow:45},
 sheep:{name:'Cừu',img:'./img/spr-5.webp',baby:'./img/spr-9.webp',price:90,product:'🧶 Len',value:45,grow:60},
 cow:{name:'Bò',img:'./img/spr-8.webp',baby:'./img/spr-8.webp',price:150,product:'🥛 Sữa',value:60,grow:75},
 dog:{name:'Chó',img:'./img/cho.webp',baby:'./img/cho.webp',price:120,product:'❤️ Niềm vui',value:20,grow:55}
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
function petIcon(p){return TYPES[p.type]?.img||TYPES.pig.img}

function ensureIds(){
  S.pets.animals.forEach((p,i)=>{if(!p.id)p.id='pet_'+Date.now()+'_'+i})
}

function age(p){
  if(p.stage==='baby'&&Date.now()>=p.readyAt){
    p.stage='adult';
    p.readyAt=0;
    toast('🎉 '+TYPES[p.type].name+' đã lớn!');
    save();
  }
}

function createPet(type){
  const t=TYPES[type];
  if(!t)return;
  if(S.pets.animals.length>=S.pets.capacity){toast('🐾 Chuồng đã đầy!');return}
  if(coins()<t.price){toast('🪙 Không đủ xu!');return}
  setCoins(coins()-t.price);
  S.pets.animals.push({
    id:'pet_'+Date.now()+'_'+Math.floor(Math.random()*9999),
    type,stage:'baby',readyAt:Date.now()+t.grow*1000,
    hunger:100,lastFed:Date.now(),products:0
  });
  save();hud();render();
  toast('🐾 Đã mua '+t.name+'!');
}

function feedPet(id){
  const p=S.pets.animals.find(x=>x.id===id);
  if(!p)return;
  age(p);
  if(feedCount()<=0){toast('🌾 Hết thức ăn!');return}
  if(p.hunger>=100){toast('😊 Vật nuôi đang no!');return}
  S.pets.feed--;
  p.hunger=Math.min(100,p.hunger+35);
  p.lastFed=Date.now();
  save();render();
  toast('❤️ Đã cho '+TYPES[p.type].name+' ăn');
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
  render();
}

function sellPet(id){
  const i=S.pets.animals.findIndex(x=>x.id===id);
  if(i<0)return;
  const p=S.pets.animals[i],t=TYPES[p.type];
  const price=Math.floor(t.price*.7);
  if(!confirm('Bán '+t.name+' lấy 🪙'+price+'?'))return;
  S.pets.animals.splice(i,1);
  addCoins(price);
  render();
  toast('Đã bán '+t.name);
}

function produce(){
  const now=Date.now();
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

function shop(){ return; }

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
    el.innerHTML='<img src="'+petIcon(p)+'"><b>'+t.name+'</b><small>'+ (p.stage==='baby'?'🍼 Đang lớn':p.hunger+'% no')+'</small><div class="new-pet-actions"><button data-feed>🍚</button><button data-get>🎁</button><button data-sell>💰</button></div>';
    el.querySelector('[data-feed]').onclick=()=>feedPet(p.id);
    el.querySelector('[data-get]').onclick=()=>collectPet(p.id);
    el.querySelector('[data-sell]').onclick=()=>sellPet(p.id);
    scene.appendChild(el);
  });
  const count=document.getElementById('pet-count');
  if(count)count.textContent=S.pets.animals.length+'/'+S.pets.capacity;
  const food=document.getElementById('pet-feed-count');
  if(food)food.textContent=feedCount();
  const money=document.getElementById('pet-money');
  if(money)money.textContent=Math.floor(coins());
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
window.nongPet={open,shop,feed:feedPet,collect:collectPet,buy:createPet,state:()=>S.pets};
})();
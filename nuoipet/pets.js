(()=> {
'use strict';

/* Nuôi Thú — port lại cơ chế cũ trong app.js, giữ state rn/rf/rx */
const SP={
  pig:{n:'Heo',e:'🐷',cost:60,baby:'🐷',grow:60,vars:[
    {n:'Heo hồng',e:'🐷',p:'truf',t:45,w:70},{n:'Heo hoa',e:'🐽',p:'truf',t:30,w:20},
    {n:'Heo băng',e:'🐖',p:'ice',t:70,w:7},{n:'Heo vàng bay',e:'🪽🐷',p:'gold',t:100,w:3}
  ]},
  sheep:{n:'Cừu',e:'🐑',cost:90,baby:'🐑',grow:80,vars:[
    {n:'Cừu sừng',e:'🐏',p:'wool',t:60,w:50},{n:'Cừu hoa',e:'🐑',p:'wool',t:40,w:50}
  ]},
  cow:{n:'Bò',e:'🐄',cost:150,baby:'🐄',grow:100,vars:[
    {n:'Bò sữa',e:'🐄',p:'milk',t:50,w:100}
  ]}
};
const FOOD={carrot:60,wheat:90,tomato:120,sun:150,pump:240}, SATR=600;
const IT={
  carrot:['🥕','Cà rốt',12],wheat:['🌾','Lúa mì',22],tomato:['🍅','Cà chua',40],
  sun:['🌻','Hướng dương',75],pump:['🎃','Bí ngô',140],
  truf:['🍄','Nấm cục',35],wool:['☁️','Len cừu',30],ice:['❄️','Tinh thể băng',90],
  gold:['🏅','Vàng thỏi',220],milk:['🥛','Sữa bò',25]
};
let sellM=false, opened=false, timer=0;
const save=()=>window.nongTrai?.save?.();
const refresh=()=>window.nongTrai?.refresh?.();
const toast=m=>window.nongTrai?.toast?window.nongTrai.toast(m):null;
const S=()=>window.nongTrai?.state?.();
const inv=(s,k)=>Number(s?.inventory?.[k]||0);
const add=(s,k,n)=>{s.inventory=s.inventory||{};s.inventory[k]=Math.max(0,inv(s,k)+n)};
const lvl=s=>Number(s?.level||1);
const cap=s=>4+lvl(s)+2*Number(s?.rx||0);
const rvar=a=>a.v>=0?SP[a.sp].vars[a.v]:null;

function ensure(){
 const s=S(); if(!s)return null;
 s.inventory=s.inventory||{};
 s.rn=s.rn||[];
 s.rf=s.rf||'carrot';
 s.rx=Number(s.rx||0);
 /* migrate pets.js state nếu người chơi đã dùng bản tĩnh */
 if(!s.rn.length&&Array.isArray(s.pets)&&s.pets.length){
   const now=Date.now();
   s.pets.forEach((p,i)=>{
     if(!SP[p.type])return;
     s.rn.push({id:'a'+now+i,sp:p.type,v:-1,g:0,pr:0,rd:0,fed:now+30000,t:now,x:20+Math.random()*60,y:48+Math.random()*30});
   });
   delete s.pets;
 }
 return s;
}

function updateAnimal(a,now){
 const d=Math.max(0,Math.min(now,a.fed)-a.t)/1000;
 a.t=now;
 if(d<=0)return;
 const sp=SP[a.sp];
 if(a.v<0){
   a.g+=d;
   if(a.g>=sp.grow){
     let r=Math.random()*sp.vars.reduce((sum,v)=>sum+v.w,0),i=0;
     for(;i<sp.vars.length-1;i++){if(r<sp.vars[i].w)break;r-=sp.vars[i].w}
     a.v=i;a.pr=0;
     toast(sp.n+' đã lớn: '+sp.vars[i].n+(i>1&&a.sp==='pig'?' ✨ hiếm!':'!'));
   }
 }else{
   const v=sp.vars[a.v];
   a.pr+=d;
   while(a.pr>=v.t&&a.rd<3){a.pr-=v.t;a.rd++}
   if(a.rd>=3)a.pr=0;
 }
}

function walk(a,el){
 const nx=Math.min(88,Math.max(12,a.x+(Math.random()-.5)*28));
 const ny=Math.min(84,Math.max(35,a.y+(Math.random()-.5)*18));
 a.x=nx;a.y=ny;
 el.style.left=nx+'%';el.style.top=ny+'%';
 el.style.zIndex=Math.round(ny*10);
 el.style.transform=nx>a.px?'scaleX(1)':'scaleX(-1)';
 a.px=nx;
}

function animalLabel(a,now){
 const sp=SP[a.sp],v=rvar(a);
 const hungry=a.fed<=now;
 if(!v)return hungry?'😋 Đói':'🍼 '+Math.floor(a.g/sp.grow*100)+'%';
 if(a.rd>0)return IT[v.p]?.[0]+' Thu!'+(a.rd>1?' ×'+a.rd:'');
 if(hungry)return '😋 Đói';
 return IT[v.p]?.[0]+' '+Math.ceil(v.t-a.pr)+'s';
}

function renderScene(s){
 const now=Date.now();
 const scene=document.getElementById('pet-scene'); if(!scene)return;
 scene.innerHTML='';
 s.rn.forEach(a=>{
   updateAnimal(a,now);
   const sp=SP[a.sp],v=rvar(a),el=document.createElement('div');
   el.className='old-pet '+(v?'grown':'baby');
   el.style.left=(a.x||50)+'%';el.style.top=(a.y||60)+'%';
   el.style.zIndex=Math.round((a.y||60)*10);
   el.dataset.id=a.id;
   el.innerHTML='<div class="old-pet-label">'+animalLabel(a,now)+'</div><div class="old-pet-body">'+(v?v.e:sp.baby)+'</div>';
   el.onclick=()=>clickAnimal(a);
   scene.appendChild(el);
 });
}

function clickAnimal(a){
 const s=ensure(),now=Date.now(); if(!s)return;
 updateAnimal(a,now);
 if(sellM){
   const v=a.v>=0,g=Math.round(SP[a.sp].cost*(v?1.5:.5));
   s.coins+=g;s.rn=s.rn.filter(x=>x!==a);save();refresh();toast('Đã bán thú +🪙'+g);render();return;
 }
 if(a.rd>0){
   const v=rvar(a);if(!v)return;
   if(Number(s.inventory?.__cap||0) && false)return;
   const product=v.p;
   add(s,product,1);a.rd--;s.xp=(s.xp||0)+3;
   save();refresh();toast('+1 '+(IT[product]?.[0]||'📦')+' '+(IT[product]?.[1]||product));render();return;
 }
 const k=s.rf;
 if(inv(s,k)<1){toast('Hết '+(IT[k]?.[1]||k)+'! Chọn thức ăn khác hoặc trồng thêm');return}
 if(a.fed-now>(SATR-FOOD[k])*1000){toast(SP[a.sp].n+' no rồi!');return}
 add(s,k,-1);a.fed=Math.max(now,a.fed)+FOOD[k]*1000;s.xp=(s.xp||0)+1;
 save();refresh();toast('Cho '+SP[a.sp].n+' ăn '+(IT[k]?.[0]||'🍽️'));render();
}

function buy(k){
 const s=ensure(),sp=SP[k];if(!s||!sp)return;
 if(s.rn.length>=cap(s)){toast('Chuồng đầy ('+cap(s)+'). Nâng cấp chuồng để mở rộng!');return}
 if(Number(s.coins||0)<sp.cost){toast('Cần 🪙'+sp.cost);return}
 s.coins-=sp.cost;const now=Date.now();
 s.rn.push({id:'a'+now+Math.floor(Math.random()*1e4),sp:k,v:-1,g:0,pr:0,rd:0,fed:now+30000,t:now,x:25+Math.random()*50,y:48+Math.random()*28,px:25});
 save();refresh();toast('Đã mua '+sp.e+' '+sp.n+' con! Cho ăn để lớn 🍼');render();
}

function chooseFood(k){
 const s=ensure();if(!s)return;
 if(!FOOD[k])return;
 s.rf=k;save();render();
}

function upgradePen(){
 const s=ensure(),cost=150*(1+Number(s.rx||0));
 if(Number(s.coins||0)<cost){toast('Cần 🪙'+cost);return}
 s.coins-=cost;s.rx=(s.rx||0)+1;save();refresh();toast('Chuồng đã mở rộng! +2 chỗ');render();
}

function render(){
 const s=ensure();if(!s)return;
 const title=document.getElementById('mt'),body=document.getElementById('mb');if(!title||!body)return;
 title.textContent='🐄 Chuồng · Nuôi Thú';
 body.innerHTML='<div class="old-ranch">'+
   '<div class="old-ranch-top"><b>🐾 '+s.rn.length+'/'+cap(s)+'</b><span>🪙 '+Math.floor(s.coins||0)+'</span><button id="pet-sell" class="'+(sellM?'on':'')+'">💰 '+(sellM?'BÁN ĐANG BẬT':'Bán thú')+'</button></div>'+
   '<div id="pet-scene" class="pet-scene"></div>'+
   '<div class="old-ranch-actions">'+
     '<div class="old-section-title">🛒 Mua thú</div>'+
     '<div class="old-buy-grid">'+Object.entries(SP).map(([k,p])=>'<button data-buy="'+k+'">'+p.e+' <b>'+p.n+'</b><small>🪙'+p.cost+'</small></button>').join('')+'</div>'+
     '<div class="old-section-title">🍽️ Chọn thức ăn — chạm thú để cho ăn</div>'+
     '<div class="old-food-grid">'+Object.keys(FOOD).map(k=>'<button data-food="'+k+'" class="'+(s.rf===k?'on':'')+'">'+(IT[k]?.[0]||'🍽️')+' '+(IT[k]?.[1]||k)+'<small>Có '+inv(s,k)+'</small></button>').join('')+'</div>'+
     '<button id="pet-upgrade" class="old-upgrade">🏠 Mở rộng chuồng · +2 chỗ · 🪙'+(150*(1+Number(s.rx||0)))+'</button>'+
   '</div></div>';
 body.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>buy(b.dataset.buy));
 body.querySelectorAll('[data-food]').forEach(b=>b.onclick=()=>chooseFood(b.dataset.food));
 document.getElementById('pet-sell').onclick=()=>{sellM=!sellM;toast(sellM?'Chạm thú để bán':'Đã tắt bán thú');render()};
 document.getElementById('pet-upgrade').onclick=upgradePen;
 renderScene(s);
 opened=true;
}

function tick(){
 const s=ensure();if(!s)return;
 const now=Date.now();
 s.rn.forEach(a=>updateAnimal(a,now));
 if(!opened)return;
 const scene=document.getElementById('pet-scene');if(!scene)return;
 s.rn.forEach(a=>{
   const el=scene.querySelector('[data-id="'+a.id+'"]');if(!el)return;
   const label=animalLabel(a,now);
   const l=el.querySelector('.old-pet-label');if(l&&l.textContent!==label)l.textContent=label;
   if(Math.random()<0.035)walk(a,el);
 });
 if(Math.floor(now/1000)%2===0)save();
}
function open(){
 ensure();render();
 const modal=document.getElementById('modal');if(modal)modal.classList.add('on');
}
window.nongPet={open,buy,feed:(i)=>{const s=ensure();const a=s?.rn?.[i];if(a)clickAnimal(a)},collect:(i)=>{const s=ensure();const a=s?.rn?.[i];if(a&&a.rd>0)clickAnimal(a)},state:ensure};
setInterval(tick,1000);
})();
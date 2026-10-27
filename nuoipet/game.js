const IMG={
 bg:"img/bg.jpg",
 boy:"img/boy.webp",
 girl:"img/girl.webp",
 pig_baby:"img/pig_baby.webp",
 pig:"img/pig.webp",
 pig_gold:"img/pig_gold.webp",
 pig_blue:"img/pig_blue.webp",
 sheep:"img/sheep.webp",
 sheep_flower:"img/sheep_flower.webp",
 pig_flower:"img/pig_flower.webp",
 cow:"img/cow.webp",
 lamb:"img/lamb.webp",
 chicken:"../img/ga.png",duck:"../img/vit.png",goat:"../img/de.png",bee:"../img/ong.png"
};
const LV_H=50,LV_F=60;const DAY=864e5, RENT=7*DAY, CAP=10, FEED_COST=4;
const T={
 pig_baby:{n:'Heo con',p:'Nấm',e:'🍄',v:6,t:12,c:40,s:9},
 lamb:{n:'Cừu con',p:'Len',e:'🧶',v:12,t:14,c:100,s:11},
 pig:{n:'Heo hồng',p:'Nấm',e:'🍄',v:14,t:14,c:120,s:12},
 sheep:{n:'Cừu sừng',p:'Len',e:'🧶',v:18,t:16,c:150,s:13},
 pig_flower:{n:'Heo hoa vàng',p:'Hoa',e:'🌼',v:22,t:18,c:250,s:12},
 pig_blue:{n:'Heo xanh',p:'Ngọc xanh',e:'💠',v:35,t:25,c:300,s:13},
 sheep_flower:{n:'Cừu hoa đỏ',p:'Len hoa',e:'🧶',v:30,t:22,c:320,s:14},
 cow:{n:'Bò sữa',p:'Sữa',e:'🥛',v:40,t:22,c:400,s:14},
 chicken:{n:'Gà',p:'Trứng',e:'🥚',v:18,t:16,c:120,s:11},
 duck:{n:'Vịt',p:'Trứng vịt',e:'🥚',v:22,t:18,c:160,s:12},
 goat:{n:'Dê',p:'Sữa dê',e:'🥛',v:32,t:20,c:280,s:13},
 bee:{n:'Ong',p:'Mật ong',e:'🍯',v:45,t:25,c:350,s:9},
 pig_gold:{n:'Heo vàng có cánh',p:'Kim Cương',e:'💎',g:1,t:60,gc:12,s:13}
};
const ST={
 boy:{n:'Cậu bé xô nước',gem:20,lv:0,home:[30,66]},
 girl:{n:'Nhà thám hiểm',gem:25,lv:0,home:[40,72]}
};
let S={coins:0,gems:0,inv:{},cap:30,xp:0,skew:0,staff:{},animals:[],nid:1};
try{const r=localStorage.getItem('ntt_v2');if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
const now=()=>Date.now()+S.skew;
const MAIN_KEY='nongtrai_new_v1';let mainState=null,fbUser=null,cloudTimer=0;
function loadMainLocal(){try{const d=JSON.parse(localStorage.getItem(MAIN_KEY));if(d&&typeof d==='object'){mainState=d;S.coins=Number(d.coins)||0;S.gems=Number(d.gems)||0}}catch(e){}}
loadMainLocal();
const save=()=>{try{localStorage.setItem('ntt_v2',JSON.stringify(S));mainState=JSON.parse(localStorage.getItem(MAIN_KEY)||'{}')||{};mainState.coins=Number(S.coins)||0;mainState.gems=Number(S.gems)||0;localStorage.setItem(MAIN_KEY,JSON.stringify(mainState))}catch(e){}if(fbUser){clearTimeout(cloudTimer);cloudTimer=setTimeout(async()=>{try{await firebase.firestore().collection('users').doc(fbUser.uid).set({game:mainState,petGame:S,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})}catch(e){console.error('Lưu nuôi pet:',e)}},0)}};
const $=id=>document.getElementById(id);
const stage=$('stage');
stage.style.backgroundImage='url('+IMG.bg+')';
let vf=1,ox=0;
function calc(){const R=stage.clientWidth/stage.clientHeight;vf=Math.min(1,R/(16/9));ox=(1-vf)*.55}
const X=x=>((x-ox*100)/vf)+'%';
function place(el,x,y){el.style.left=X(x);el.style.top=y+'%';el.style.zIndex=Math.round(y*10)}
function toast(m){const t=$('toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',2200)}
function pop(x,y,txt){const d=document.createElement('div');d.className='pop';d.textContent=txt;place(d,x,y-6);d.style.zIndex=999;d.style.transition='none';stage.appendChild(d);setTimeout(()=>d.remove(),1200)}
function hud(){$('coins').textContent='🪙 '+Math.floor(S.coins);$('gems').textContent='💎 '+S.gems;$('lv').textContent='⭐ Cấp '+lvl()[0];{const L=lvl()[0];$('bHar').innerHTML=(L<LV_H?'🔒':'🧺')+'<br>Thu hoạch tất cả';$('bHar').style.opacity=L<LV_H?.6:1;$('bFeed').innerHTML=(L<LV_F?'🔒':'🍽️')+'<br>Cho ăn tất cả';$('bFeed').style.opacity=L<LV_F?.6:1}$('cnt').textContent='🐾 '+S.animals.length+'/'+CAP}

/* ---------- animals ---------- */
const els={};
function mk(a){
 const d=T[a.type],el=document.createElement('div');
 el.className='ent animal';el.style.width=(d.s/vf)+'%';
 el.innerHTML='<div class="bar"><i></i></div><div class="bub" hidden></div><div class="in"><img alt="'+d.n+'" src="'+IMG[a.type]+'"></div>';
 el.onclick=()=>tap(a);stage.appendChild(el);els[a.id]=el;place(el,a.x,a.y);
}
function ui(a){
 const el=els[a.id],d=T[a.type],b=el.querySelector('.bub');
 b.hidden=!a.ready&&a.food>25;
 b.textContent=a.ready?d.e:'🍽️';
 const i=el.querySelector('.bar i');i.style.width=a.food+'%';i.style.background=a.food>40?'#67d23a':a.food>15?'#f2b630':'#e5483a';
}
function wander(a){
 let x,y,k=0;
 do{x=26+Math.random()*56;y=62+Math.random()*24;k++}while(k<20&&Math.abs(x-72)<9&&Math.abs(y-79)<6);
 const dx=x-a.x,dist=Math.hypot(dx,y-a.y),dur=Math.max(2,dist/5);
 const el=els[a.id];el.style.setProperty('--d',dur+'s');
 el.querySelector('.in').firstChild.style.transform=dx>0?'scaleX(-1)':'none';
 a.x=x;a.y=y;place(el,x,y);
 a.next=now()+dur*1000+1500+Math.random()*4000;
}
function harvest(a,quiet){
 if(!a.ready)return false;const d=T[a.type];
 if(!d.g&&used()>=S.cap){if(!quiet)toast('Kho đầy – hãy bán bớt hoặc mở rộng kho');return false}
 if(d.g){S.gems+=d.g;pop(a.x,a.y,'+'+d.g+' 💎')}else{S.inv[a.type]=(S.inv[a.type]||0)+1;pop(a.x,a.y,'+1 '+d.e)}
 a.ready=false;a.prog=0;ui(a);addXp(d.g?10:3);hud();save();return true;
}
function feed(a,free){
 if(a.food>85)return false;
 if(!free){if(S.coins<FEED_COST){toast('Không đủ xu để cho ăn');return false}S.coins-=FEED_COST}
 a.food=Math.min(100,a.food+70);addXp(1);pop(a.x,a.y,'🍽️ +');ui(a);hud();save();return true;
}
function tap(a){if(a.ready)harvest(a);else if(!feed(a)&&a.food>85)toast(T[a.type].n+' đang no')}

/* ---------- staff ---------- */
const crew={};
function syncStaff(){
 for(const k in ST){
  const on=S.staff[k]&&S.staff[k]>now();
  if(on&&!crew[k]){
   const el=document.createElement('div');el.className='ent staff';el.style.width=(7.5/vf)+'%';
   el.innerHTML='<div class="in"><img alt="'+ST[k].n+'" src="'+IMG[k]+'"></div>';
   stage.appendChild(el);crew[k]={el,x:ST[k].home[0],y:ST[k].home[1],busy:false};place(el,crew[k].x,crew[k].y);
  }
  if(!on&&crew[k]){crew[k].el.remove();delete crew[k];if(S.staff[k]){delete S.staff[k];toast(ST[k].n+' đã hết hạn thuê');save()}}
 }
}
function go(c,x,y,sec){c.el.style.setProperty('--d',sec+'s');c.x=x;c.y=y;place(c.el,x,y)}
function work(){
 syncStaff();
 const taken=new Set(Object.values(crew).map(c=>c.target).filter(Boolean));
 for(const k in crew){
  const c=crew[k];if(c.busy)continue;
  let t=S.animals.find(a=>a.ready&&!taken.has(a.id))||S.animals.find(a=>a.food<45&&!taken.has(a.id));
  if(!t){if(Math.hypot(c.x-ST[k].home[0],c.y-ST[k].home[1])>1)go(c,ST[k].home[0],ST[k].home[1],2);continue}
  c.busy=true;c.target=t.id;taken.add(t.id);
  const dist=Math.hypot(c.x-t.x,c.y-t.y),sec=Math.max(.8,dist/14);
  c.el.querySelector('img').style.transform=t.x>c.x?'scaleX(-1)':'none';
  go(c,t.x+(t.x>50?-4:4),t.y+1,sec);
  setTimeout(()=>{
   if(S.animals.includes(t)){if(t.ready)harvest(t,true);else feed(t,true)}
   setTimeout(()=>{c.busy=false;c.target=null},600);
  },sec*1000+150);
 }
}

/* ---------- loop ---------- */
let last=performance.now();
function tick(){
 const n=performance.now(),dt=Math.min(2,(n-last)/1000);last=n;
 for(const a of S.animals){
  a.food=Math.max(0,a.food-dt);
  if(a.food>0&&!a.ready){a.prog+=dt;if(a.prog>=T[a.type].t)a.ready=true}
  if(!a.next||now()>a.next)wander(a);
  ui(a);
 }
}
setInterval(tick,250);setInterval(work,400);setInterval(save,5000);

/* ---------- panels ---------- */
const need=l=>10+l*5;
function lvl(){const l=Math.max(1,Number(mainState?.level)||1),x=Math.max(0,Number(mainState?.xp)||0);return [l,x,50+(l-1)*35]}
function addXp(n){mainState=mainState||{};let b=Math.max(1,Number(mainState.level)||1);mainState.xp=(Number(mainState.xp)||0)+n;const xpNeed=l=>50+(Math.max(1,l)-1)*35;while(mainState.xp>=xpNeed(b)){mainState.xp-=xpNeed(b);b++;mainState.level=b}const a=b;if(a>lvl()[0]){}hud();save()}
function lvUp(){mainState=mainState||{};mainState.level=lvl()[0]+10;mainState.xp=0;hud();save();staff()}
const used=()=>Object.values(S.inv).reduce((s,v)=>s+v,0);
const total=()=>Object.keys(S.inv).reduce((s,k)=>s+S.inv[k]*T[k].v,0);
const upCost=()=>S.cap*20;
function kho(){armed=0;
 let h=head('Kho ('+used()+'/'+S.cap+')'),any=false;
 for(const k in S.inv){const n=S.inv[k];if(!n)continue;any=true;const d=T[k];
  h+='<div class="row"><img src="'+IMG[k]+'" alt=""><div class="t"><b>'+d.e+' '+d.p+' × '+n+'</b><br>'+d.n+' · '+d.v+' xu/cái</div><button onclick="sell(\''+k+'\')">Bán hết<br>🪙 '+n*d.v+'</button></div>'}
 if(!any)h+='<p class="hint">Kho đang trống. Thu hoạch từ thú để có hàng bán.</p>';
 else h+='<button onclick="sellAll()" style="margin-top:8px;width:100%">Bán tất cả · 🪙 '+total()+'</button>';
 h+='<button onclick="upg()" style="margin-top:8px;width:100%">Mở rộng kho +20 chỗ · 🪙 '+upCost()+'</button><p class="hint">Heo vàng cho Kim Cương trực tiếp, không chiếm chỗ trong kho.</p><button onclick="pets()" style="margin-top:8px;width:100%">🐾 Bán vật nuôi</button>';
 open(h);
}
let armed=0;
const petPrice=t=>T[t].gc?Math.floor(T[t].gc/2):Math.floor(T[t].c/2);
function pets(){
 let h=head('Bán vật nuôi');
 if(!S.animals.length)h+='<p class="hint">Chuồng đang trống.</p>';
 for(const a of S.animals){const d=T[a.type],p=petPrice(a.type),u=d.gc?'💎':'🪙';
  h+='<div class="row"><img src="'+IMG[a.type]+'" alt=""><div class="t"><b>'+d.n+'</b><br>'+(a.ready?'Có '+d.p+' chưa thu hoạch':(a.food>0?'Đang sản xuất':'Đang đói'))+'</div><button onclick="sellPet('+a.id+')">'+(armed===a.id?'Chắc chưa?':'Bán<br>'+u+' '+p)+'</button></div>'}
 h+='<p class="hint">Bán được nửa giá mua. Bấm hai lần để xác nhận.</p><button onclick="kho()" style="margin-top:8px;width:100%">← Về kho</button>';
 open(h);
}
function sellPet(id){
 if(armed!==id){armed=id;pets();return}
 armed=0;const i=S.animals.findIndex(a=>a.id===id);if(i<0)return;
 const a=S.animals[i],d=T[a.type],p=petPrice(a.type);
 if(d.gc)S.gems+=p;else S.coins+=p;
 els[a.id].remove();delete els[a.id];S.animals.splice(i,1);
 hud();save();toast('Đã bán '+d.n+' +'+p+(d.gc?' 💎':' xu'));pets();
}
function sell(k){const n=S.inv[k]||0;S.coins+=n*T[k].v;S.inv[k]=0;hud();save();toast('Đã bán +'+n*T[k].v+' xu');kho()}
function sellAll(){const t=total();S.coins+=t;S.inv={};hud();save();toast('Đã bán +'+t+' xu');kho()}
function upg(){const c=upCost();if(S.coins<c){toast('Không đủ xu để mở rộng');return}S.coins-=c;S.cap+=20;hud();save();toast('Kho tăng lên '+S.cap+' chỗ');kho()}
function open(html){const s=$('sheet');s.innerHTML=html;$('veil').style.display='flex';s.scrollTop=0}
function shut(){$('veil').style.display='none'}
$('veil').onclick=e=>{if(e.target.id==='veil')shut()};
function head(t){return '<h2>'+t+'<button onclick="shut()" style="padding:0 12px" aria-label="Đóng">✕</button></h2>'}
function shop(){
 let h=head('Cửa hàng thú cưng');
 for(const k in T){const d=T[k],gem=d.gc;
  h+='<div class="row"><img src="'+IMG[k]+'" alt=""><div class="t"><b>'+d.n+'</b><br>Cho '+d.p+' '+d.e+(d.g?' ×'+d.g:' · '+d.v+' xu')+' mỗi '+d.t+'s</div><button onclick="buy(\''+k+'\')">'+(gem?'💎 '+gem:'🪙 '+d.c)+'</button></div>'}
 h+='<p class="hint">Chạm vào thú: có bong bóng sản phẩm thì thu hoạch, đói thì cho ăn ('+FEED_COST+' xu). Thú đói sẽ ngừng sản xuất.</p>';
 open(h);
}
function buy(k){
 const d=T[k];
 if(S.animals.length>=CAP){toast('Chuồng đã đầy ('+CAP+' con)');return}
 if(d.gc){if(S.gems<d.gc){toast('Không đủ Kim Cương');return}S.gems-=d.gc}
 else{if(S.coins<d.c){toast('Không đủ xu');return}S.coins-=d.c}
 const a={id:S.nid++,type:k,food:100,prog:0,ready:false,x:50,y:68};
 S.animals.push(a);mk(a);wander(a);ui(a);hud();save();shut();toast('Đã mua '+d.n+' – nhìn vào chuồng nhé!');
}
function left(ms){const d=Math.floor(ms/DAY),h=Math.floor(ms%DAY/36e5);return d+' ngày '+h+' giờ'}
function staff(){
 let h=head('Thuê nhân viên');
 h+='<p class="hint">Cấp hiện tại: '+lvl()[0]+' · XP '+lvl()[1]+'/'+lvl()[2]+'. Thu hoạch +3 XP, cho ăn +1 XP. Thu hoạch tất cả mở ở cấp '+LV_H+', Cho ăn tất cả mở ở cấp '+LV_F+'.</p>';
 for(const k in ST){const s=ST[k],exp=S.staff[k],on=exp&&exp>now();
  h+='<div class="row st"><img src="'+IMG[k]+'" alt=""><div class="t"><b>'+s.n+'</b><br>Tự thu hoạch và cho ăn mọi thú trong chuồng.<br>'+
  (on?'<span class="gem">Còn '+left(exp-now())+'</span>':(lvl()[0]<s.lv?'🔒 Mở khoá ở cấp '+s.lv:'Chưa thuê'))+'</div><button '+(lvl()[0]<s.lv?'disabled ':'')+'onclick="hire(\''+k+'\')">'+(on?'Gia hạn':'Thuê')+'<br>7 ngày<br>💎 '+s.gem+'</button></div>'}
 h+='<p class="hint">Gia hạn sẽ cộng thêm 7 ngày vào thời gian còn lại.</p><button onclick="skip()" style="margin-top:8px;width:100%">⏩ Tua nhanh 1 ngày (thử nghiệm)</button><button onclick="lvUp()" style="margin-top:8px;width:100%">⭐ Tăng 10 cấp (thử nghiệm)</button>';
 open(h);
}
function hire(k){
 const s=ST[k];if(lvl()[0]<s.lv){toast('Cần đạt cấp '+s.lv);return}if(S.gems<s.gem){toast('Không đủ Kim Cương');return}
 S.gems-=s.gem;const base=S.staff[k]>now()?S.staff[k]:now();S.staff[k]=base+RENT;
 syncStaff();hud();save();toast('Đã thuê '+s.n+' 7 ngày');staff();
}
function skip(){S.skew+=DAY;syncStaff();save();staff()}
$('bShop').onclick=shop;$('bKho').onclick=kho;$('bStaff').onclick=staff;
$('bFeed').onclick=()=>{if(lvl()[0]<LV_F){toast('🔒 Cho ăn tất cả mở khoá ở cấp '+LV_F);return}let n=0;for(const a of S.animals){if(a.food<=85&&S.coins>=FEED_COST&&feed(a))n++}toast(n?'Đã cho ăn '+n+' con':'Không cần cho ăn')};
$('bHar').onclick=()=>{if(lvl()[0]<LV_H){toast('🔒 Thu hoạch tất cả mở khoá ở cấp '+LV_H);return}let n=0;for(const a of S.animals)if(harvest(a,true))n++;toast(n?'Đã thu hoạch '+n+' con':'Chưa có gì để thu hoạch')};

function boot(){
 calc();hud();
 for(const k in els){els[k].remove();delete els[k]}
 for(const k in crew){crew[k].el.remove();delete crew[k]}
 for(const k in ST)if(S.staff[k]&&lvl()[0]<ST[k].lv){delete S.staff[k];S.gems+=ST[k].gem}
 S.animals.forEach(a=>{mk(a);ui(a)});syncStaff();
}
addEventListener('resize',boot);
boot();

$('bIsland').onclick=()=>location.href='../game.html';
if(typeof firebase!=='undefined'&&typeof FB_CONFIG!=='undefined'){try{if(!firebase.apps.length)firebase.initializeApp(FB_CONFIG);firebase.auth().onAuthStateChanged(async u=>{if(!u){location.replace('../login.html');return}fbUser=u;try{const d=await firebase.firestore().collection('users').doc(u.uid).get({source:'server'});if(d.exists){const data=d.data();if(data.petGame)S=Object.assign(S,data.petGame);if(data.game){mainState=data.game;S.coins=Number(mainState.coins)||0;S.gems=Number(mainState.gems)||0}try{localStorage.setItem('ntt_v2',JSON.stringify(S));localStorage.setItem(MAIN_KEY,JSON.stringify(mainState||{}))}catch(e){}boot()}}catch(e){console.error('Đồng bộ nuôi pet:',e)}})}catch(e){console.error(e)}}
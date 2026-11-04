const IMG={
 "fire": "../img/fire.webp",
 "leaf": "../img/leaf.webp",
 "ice": "../img/ice.webp",
 "spark": "../img/lightning.webp",
 "water": "../img/water.webp",
 "dark": "../img/dark.webp",
 "rainbow": "../img/rainbow.webp"
};
const T={fire:{n:'Rồng Lửa',p:0,i:'🔥'},leaf:{n:'Rồng Lá',p:80,i:'🍃'},ice:{n:'Rồng Băng',p:200,i:'❄️'},spark:{n:'Rồng Sét',p:400,i:'⚡'},water:{n:'Rồng Nước',p:300,i:'💧'},dark:{n:'Rồng Bóng Tối',p:600,i:'🌑'},rainbow:{n:'Rồng Cầu Vồng',p:1000,i:'🌈'}};
const KEY='rong_v1',MAIN_KEY='nongtrai_new_v1',ENERGY_KEY='rong_energy_v1',MAXD=7,B={x0:15,x1:87,y0:30,y1:68},E={x:51,y:49,rx:36,ry:19};
function pen(x,y){const a=(x-E.x)/E.rx,b=(y-E.y)/E.ry,r=Math.hypot(a,b);return r>1?[E.x+a/r*E.rx,E.y+b/r*E.ry]:[x,y]}
function rp(){const t=Math.random()*6.283,r=Math.sqrt(Math.random())*.95;return[E.x+Math.cos(t)*r*E.rx,E.y+Math.sin(t)*r*E.ry]}
let S={coins:100,gems:0,energy:0,food:3,dragons:[],n:1,sel:null};
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.dragons)S=s}catch(e){}
const $=id=>document.getElementById(id),W=$('world'),els={},coins=[];
const rnd=(a,b)=>a+Math.random()*(b-a);
function mainLoad(){try{return JSON.parse(localStorage.getItem(MAIN_KEY))||null}catch(e){return null}}
function syncMoneyIn(){const g=mainLoad();if(g&&g.coins!==undefined&&Number.isFinite(Number(g.coins)))S.coins=Math.max(0,Number(g.coins));S.gems=Math.max(0,Number(g?.gems)||0);try{const e=JSON.parse(localStorage.getItem(ENERGY_KEY)||'0');S.energy=Math.max(0,Number(e)||0)}catch(_){S.energy=0}}
function syncMoneyOut(){const g=mainLoad();if(g){g.coins=Math.max(0,Number(S.coins)||0);g.gems=Math.max(0,Number(S.gems)||0);try{localStorage.setItem(MAIN_KEY,JSON.stringify(g))}catch(e){}}try{localStorage.setItem(ENERGY_KEY,String(Math.max(0,Number(S.energy)||0)))}catch(e){}}
syncMoneyIn();
function save(){syncMoneyOut();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function toast(m){const t=$('toast');t.textContent=m;t.style.opacity=1;clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.opacity=0,1600)}
function newD(type){return{id:S.n++,type,lv:1,xp:0,hun:80,x:rnd(40,62),y:rnd(42,56),tx:null,ty:null,wait:1,ct:0}}
if(!S.dragons.length)S.dragons.push(newD('fire'));
const sc=d=>.75+.07*d.lv;
function dragonImage(d){const names={fire:'lua',leaf:'co',ice:'bang',spark:'set',water:'nuoc',dark:'hacam',rainbow:'ngoc'};const stage=Number(d.evolutionStage)||0;if(stage<1)return IMG[d.type]||IMG.fire;return '../rong-tien-hoa/rong_'+(names[d.type]||'lua')+'2.png'}
function mk(d){const e=document.createElement('div');e.className='d';
 e.innerHTML='<div class="b"><div class="sh"></div><img src="'+dragonImage(d)+'"><span class="em"></span></div>';
 e.onclick=ev=>{ev.stopPropagation();S.sel=d.id;d.wait=0;render()};W.appendChild(e);els[d.id]=e}
function fx(x,y,t){const f=document.createElement('div');f.className='fx';f.textContent=t;f.style.left=x+'%';f.style.top=(y-12)+'%';W.appendChild(f);setTimeout(()=>f.remove(),1000)}
W.onclick=ev=>{const d=S.dragons.find(d=>d.id===S.sel);if(!d)return;const r=W.getBoundingClientRect();
 [d.tx,d.ty]=pen((ev.clientX-r.left)/r.width*100,(ev.clientY-r.top)/r.height*100);d.wait=0;d.go=1};
function spawnCoin(d){if(coins.length>=8)return;const c=document.createElement('div');c.className='c';c.textContent='🪙';
 const v=d.lv*5;c.style.left=(d.x+rnd(-4,4))+'%';c.style.top=(d.y+1)+'%';c.style.zIndex=9999;
 c.onclick=ev=>{ev.stopPropagation();S.coins+=v;fx(parseFloat(c.style.left),parseFloat(c.style.top),'+'+v);c.remove();coins.splice(coins.indexOf(c),1);hud();save()};
 W.appendChild(c);coins.push(c)}
function hud(){$('co').textContent='🪙 '+S.coins;$('gm').textContent='💎 '+S.gems;$('en').textContent='ϟ '+S.energy;$('fo').textContent='🍖 '+S.food}
function render(){hud();const d=S.dragons.find(d=>d.id===S.sel),p=$('panel');
 Object.values(els).forEach(e=>e.classList.remove('sel'));
 if(!d){p.hidden=true;return}els[d.id].classList.add('sel');p.hidden=false;
 const need=d.lv*30,t=T[d.type];
 p.innerHTML='<b>'+t.i+' '+t.n+' — Cấp '+d.lv+(d.lv>=10?' (MAX)':'')+'</b>'+
 '<div class="r">🍖<div class="bar"><i id="bh" style="background:#ef6c00"></i></div></div>'+
 '<div class="r">⭐<div class="bar"><i id="bx" style="background:#7c4dff"></i></div></div>'+
 '<div class="r"><button id="bf">🍖 Cho ăn</button><button id="bp">ϟ Vuốt ve (1)</button><span style="font-size:3cqw;flex:1">Chạm đất để rồng đi tới đó</span></div>'+
 '<div class="r"><button id="pvp-select-dragon" style="width:100%">⚔️ Chọn rồng chiến đấu</button></div>';
 $('bf').onclick=()=>{if(S.food<1)return toast('Hết thịt! Mua thêm ở cửa hàng');S.food--;d.hun=Math.min(100,d.hun+40);gain(d,10);fx(d.x,d.y,'🍖');hud();save()};
 $('bp').onclick=()=>{if(S.energy<1)return toast('Hết năng lượng! Hãy giao đơn hàng để nhận thêm ⚡');S.energy--;gain(d,2);fx(d.x,d.y,'💗');hud();save()};$('pvp-select-dragon').onclick=()=>{const chosen={id:d.id,type:d.type,level:d.lv,name:T[d.type].n};try{localStorage.setItem('rong_chien_dau_v1',JSON.stringify(chosen));toast('Đã chọn '+chosen.name+' làm rồng chiến đấu!')}catch(e){toast('Không lưu được lựa chọn')}};bars()}
function bars(){const d=S.dragons.find(d=>d.id===S.sel);if(!d||!$('bh'))return;$('bh').style.width=d.hun+'%';$('bx').style.width=(d.lv>=10?100:d.xp/(d.lv*30)*100)+'%'}
function gain(d,x){if(d.lv>=10)return;d.xp+=x;while(d.xp>=d.lv*30&&d.lv<10){d.xp-=d.lv*30;d.lv++;toast('🎉 '+T[d.type].n+' lên cấp '+d.lv+'!');fx(d.x,d.y,'🌟')}bars()}
function shop(){const s=$('shop');s.hidden=false;
 let h='<div class="box"><b style="font-size:5cqw">🛒 Cửa hàng</b>';
 for(const k in T){if(k==='fire')continue;h+='<div class="it"><img src="'+IMG[k]+'"><div><b>'+T[k].n+'</b><br>💎 '+T[k].p+'</div><button data-b="'+k+'">Mua</button></div>'}
 h+='<div class="it"><span style="font-size:10cqw">🍖</span><div><b>5 miếng thức ăn</b><br>🪙 25</div><button data-b="food">Mua</button></div>'+
 '<button id="cl" style="width:100%;margin-top:2cqw;background:#ddd;box-shadow:0 .8cqw #aaa">Đóng</button></div>';
 s.innerHTML=h;$('cl').onclick=()=>s.hidden=true;
 s.querySelectorAll('[data-b]').forEach(b=>b.onclick=()=>{const k=b.dataset.b,p=k==='food'?25:T[k].p;
  if(k==='food'&&S.coins<p)return toast('Không đủ xu 🪙');if(k!=='food'&&S.gems<p)return toast('Không đủ Kim Cương 💎');
  if(k!=='food'&&S.dragons.length>=MAXD)return toast('Tối đa '+MAXD+' chuồng rồng!');
  if(k==='food'){S.coins-=p;S.food+=5}else{S.gems-=p;const d=newD(k);S.dragons.push(d);mk(d);S.sel=d.id;toast('Chào mừng '+T[k].n+'!')}
  hud();render();save()})}
S.dragons.forEach(mk);S.sel=null;render();
let last=performance.now(),acc=0;
function tick(t){const dt=Math.min(.1,(t-last)/1000);last=t;acc+=dt;
 for(const d of S.dragons){const e=els[d.id];d.hun=Math.max(0,d.hun-dt*.3);
  if(d.tx==null){d.wait-=dt;if(d.wait<=0){[d.tx,d.ty]=rp();d.go=0}}
  let mv=false;
  if(d.tx!=null){const dx=d.tx-d.x,dy=d.ty-d.y,dist=Math.hypot(dx,dy),sp=(d.go?14:6)*(d.hun<=0?.4:1)*dt;
   if(dist<=sp){d.tx=null;d.wait=rnd(1,4)}else{d.x+=dx/dist*sp;d.y+=dy/dist*sp;mv=true;e.classList.toggle('fl',dx<0)}}
  [d.x,d.y]=pen(d.x,d.y);e.classList.toggle('mv',mv);
  const k=sc(d)*(.85+.3*(d.y-B.y0)/(B.y1-B.y0));e.style.setProperty('--s',k);
  e.style.left=d.x+'%';e.style.top=d.y+'%';e.style.zIndex=Math.round(d.y*10);
  e.querySelector('.em').textContent=d.hun<=0?'😢':d.hun<25?'🍖':'';
  d.ct+=dt;if(d.ct>=12&&d.hun>10){d.ct=0;spawnCoin(d)}}
 if(acc>.5){acc=0;bars();save()}
 requestAnimationFrame(tick)}
requestAnimationFrame(tick);
window.addEventListener('storage',e=>{if(e.key===MAIN_KEY||e.key===ENERGY_KEY){syncMoneyIn();hud();}});

const $collection=$('collection');
function showCollection(){
 const owned=new Set(S.dragons.map(d=>d.type));
 let h='<div class="collection-box"><div class="collection-head"><span>📖 Bộ sưu tập rồng</span><span>'+owned.size+'/'+Object.keys(T).length+'</span></div><div class="collection-grid">';
 for(const k of Object.keys(T)){
  const yes=owned.has(k);
  h+='<div class="collection-card '+(yes?'owned':'locked')+'"><img src="'+IMG[k]+'"><b>'+(yes?T[k].n:'???')+'</b><small>'+(yes?'✓ Đã sưu tập':'🔒 Chưa có')+'</small></div>';
 }
 h+='</div><button id="collection-close" style="width:100%;margin-top:3cqw;background:#e7dfd1;box-shadow:0 .7cqw #b7aa95">Đóng</button></div>';
 $collection.innerHTML=h;$collection.hidden=false;
 $('collection-close').onclick=()=>$collection.hidden=true;
}
$('collection-btn').onclick=showCollection;
$('bottom-shop').onclick=()=>shop();

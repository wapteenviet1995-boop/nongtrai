(()=>{'use strict';
const SAVE_KEY='nongtrai_new_v1';
const $=id=>document.getElementById(id);
const DEFAULT_BUILDINGS={landLevel:1,house:1,barn:1,warehouse:1,garden:1,workshop:0,dragonGate:0,decor:0};
let S={coins:0,gems:0,level:1,xp:0,buildings:{...DEFAULT_BUILDINGS}};
let user=null,busy=false;
const LAND=[
 {level:2,name:'Bãi cỏ phía Đông',icon:'🌿',cost:500,need:3,desc:'Thêm không gian xây vườn cây và khu trang trí.'},
 {level:3,name:'Thung lũng xanh',icon:'🌳',cost:1800,need:6,desc:'Mở rộng trang trại, chuẩn bị xây xưởng và hồ nước.'},
 {level:4,name:'Đồi nắng vàng',icon:'⛰️',cost:5000,need:10,desc:'Khu đất lớn dành cho công trình cao cấp.'}
];
const BUILDINGS=[
 {id:'house',name:'Nhà chính',icon:'🏡',desc:'Trung tâm trang trại. Nâng cấp nhà để mở khóa đất mới.',base:250,land:1,max:10},
 {id:'barn',name:'Chuồng mở rộng',icon:'🐄',desc:'Phát triển khu chuồng và không gian chăm sóc vật nuôi.',base:180,land:1,max:10},
 {id:'warehouse',name:'Kho nông sản',icon:'📦',desc:'Nâng cấp khu lưu trữ và quản lý nông sản.',base:220,land:1,max:10},
 {id:'garden',name:'Vườn cây',icon:'🌱',desc:'Mở rộng khu trồng trọt và cảnh quan xanh.',base:200,land:1,max:10},
 {id:'workshop',name:'Xưởng chế biến',icon:'⚙️',desc:'Xây xưởng mới để phát triển hoạt động sản xuất.',base:650,land:2,max:8},
 {id:'dragonGate',name:'Cổng Đảo Rồng',icon:'🐉',desc:'Xây cổng trang trí kết nối khu đất với Đảo Rồng.',base:1200,land:3,max:5},
 {id:'decor',name:'Khu trang trí',icon:'🌸',desc:'Tạo điểm nhấn cho bản đồ nông trại.',base:90,land:2,max:20}
];
function readLocal(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')}catch(e){return {}}}
function mergeGame(g){S={...S,...g,buildings:{...DEFAULT_BUILDINGS,...(g.buildings||{})}};S.coins=Number(S.coins)||0;S.gems=Number(S.gems)||0;S.level=Number(S.level)||1}
function persistLocal(){const local=readLocal();local.coins=S.coins;local.gems=S.gems;local.level=S.level;local.xp=S.xp;local.buildings={...DEFAULT_BUILDINGS,...S.buildings};try{localStorage.setItem(SAVE_KEY,JSON.stringify(local))}catch(e){}}
function toast(t){const el=$('toast');el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),2300)}
function costFor(b,level){return Math.round(b.base*Math.pow(1.55,Math.max(0,level)))}
function renderFarmMap(){
 const land=Number(S.buildings.landLevel)||1;
 const zones=[
  {n:1,title:'Đảo chính',icons:'🏡 🌾 🐄',desc:'Nhà chính · Ruộng · Chuồng'},
  {n:2,title:'Bãi cỏ phía Đông',icons:'🌳 🌼 ⚙️',desc:'Vườn mở rộng · Xưởng'},
  {n:3,title:'Thung lũng xanh',icons:'🐉 🌲 💧',desc:'Cổng Đảo Rồng · Hồ cảnh quan'},
  {n:4,title:'Đồi nắng vàng',icons:'⛰️ ☀️ 🌻',desc:'Khu đất cao cấp'}
 ];
 $('farmMap').innerHTML=zones.map(z=>'<div class="zone '+(land>=z.n?'':'closed')+'"><strong>'+z.title+'</strong><div class="icons">'+(land>=z.n?z.icons:'🔒')+'</div><small>'+(land>=z.n?z.desc:'Chưa mở khóa · Khu '+z.n)+'</small></div>').join('');
}
function render(){
 renderFarmMap();
 $('coins').textContent=Math.floor(S.coins).toLocaleString('vi-VN');$('gems').textContent=Math.floor(S.gems).toLocaleString('vi-VN');$('level').textContent='Lv.'+S.level;
 const land=Number(S.buildings.landLevel)||1;$('landCount').textContent=land;
 $('buildingCount').textContent=BUILDINGS.filter(b=>(Number(S.buildings[b.id])||0)>0).length;
 $('landGrid').innerHTML=LAND.map(a=>{
  const unlocked=land>=a.level,prev=LAND.find(x=>x.level===a.level-1);
  const houseNeed=a.level===2?2:a.level===3?4:7;
  const canLevel=S.level>=a.need&&Number(S.buildings.house)>=houseNeed;
  const label=unlocked?'✅ Đã mở':!canLevel?'🔒 Cần Lv.'+a.need+' và Nhà Lv.'+houseNeed:'Mở đất · 🪙'+a.cost.toLocaleString('vi-VN');
  return '<article class="card '+(unlocked?'':'locked')+'"><div class="card-top"><div class="emoji">'+a.icon+'</div><div><h3>'+a.name+'</h3><div class="level">Khu đất '+a.level+'/4</div></div></div><p>'+a.desc+'</p><div class="land-progress"><i style="width:'+(unlocked?100:Math.min(100,land/a.level*100))+'%"></i></div><button class="action" data-land="'+a.level+'" '+(unlocked||!canLevel||busy?'disabled':'')+'>'+label+'</button></article>';
 }).join('');
 $('buildingGrid').innerHTML=BUILDINGS.map(b=>{
  const lv=Number(S.buildings[b.id])||0,unlocked=land>=b.land,price=costFor(b,lv),atMax=lv>=b.max;
  const label=lv===0?'Xây dựng': 'Nâng cấp';
  const blocked=!unlocked||atMax||busy;
  return '<article class="card '+(!unlocked?'locked':'')+'"><div class="card-top"><div class="emoji">'+b.icon+'</div><div><h3>'+b.name+'</h3><div class="level">'+(lv?'Cấp '+lv+'/'+b.max:'Chưa xây dựng')+'</div></div></div><p>'+b.desc+'</p><div class="cost">'+(!unlocked?'🔒 Cần mở Khu đất '+b.land:atMax?'⭐ Đã đạt cấp tối đa':'🪙 '+price.toLocaleString('vi-VN')+' Xu')+'</div><button class="action" data-building="'+b.id+'" '+(blocked?'disabled':'')+'>'+(atMax?'Đã tối đa':label+(lv?' · Lv.'+(lv+1):''))+'</button></article>';
 }).join('');
 document.querySelectorAll('[data-land]').forEach(b=>b.addEventListener('click',()=>expandLand(Number(b.dataset.land))));
 document.querySelectorAll('[data-building]').forEach(b=>b.addEventListener('click',()=>upgradeBuilding(b.dataset.building)));
}
async function commitPurchase(mutator){
 if(busy)return;
 if(!user||!user.uid){toast('❌ Bạn chưa đăng nhập.');return}
 busy=true;render();
 try{
  const db=firebase.firestore();
  const ref=db.collection('users').doc(user.uid);
  let savedGame=null;
  await db.runTransaction(async tx=>{
   const snap=await tx.get(ref);
   if(!snap.exists)throw new Error('USER_DOC_NOT_FOUND');
   const data=snap.data()||{};
   const game=data.game&&typeof data.game==='object'?data.game:{};
   const latest={
    ...S,
    ...game,
    coins:Number(game.coins??S.coins)||0,
    gems:Number(game.gems??S.gems)||0,
    level:Number(game.level??S.level)||1,
    xp:Number(game.xp??S.xp)||0,
    buildings:{...DEFAULT_BUILDINGS,...(S.buildings||{}),...(game.buildings||{})}
   };
   const next=mutator(latest);
   if(!next)throw new Error('NOT_ENOUGH');
   const coins=Number(next.coins);
   const gems=Number(next.gems??latest.gems);
   if(!Number.isFinite(coins)||!Number.isFinite(gems)||coins<0||gems<0)throw new Error('INVALID_GAME_VALUE');
   const buildings={...latest.buildings,...(next.buildings||{})};
   for(const [key,value] of Object.entries(buildings)){
    const n=Number(value);
    if(!Number.isFinite(n)||n<0)throw new Error('INVALID_BUILDING_VALUE');
    buildings[key]=n;
   }
   savedGame={...game,...next,coins,gems,buildings};
   tx.set(ref,{
    game:savedGame,
    updatedAt:firebase.firestore.FieldValue.serverTimestamp()
   },{merge:true});
  });
  if(savedGame)mergeGame(savedGame);
  persistLocal();
  toast('🎉 Xây dựng thành công!');
 }catch(e){
  console.warn('Build save:',e);
  const code=e.code||'';
  const detail=code?code+': ': '';
  const msg=e.message==='NOT_ENOUGH'?'❌ Dữ liệu mới nhất không đủ Xu hoặc chưa đủ điều kiện.':
   e.message==='USER_DOC_NOT_FOUND'?'❌ Chưa tìm thấy hồ sơ người chơi trên máy chủ.':
   e.message==='INVALID_GAME_VALUE'||e.message==='INVALID_BUILDING_VALUE'?'❌ Dữ liệu nâng cấp không hợp lệ.':
   '❌ Không lưu được: '+detail+(e.message||'Lỗi Firebase');
  toast(msg);
 }finally{busy=false;render()}
}
function expandLand(level){
 const item=LAND.find(x=>x.level===level);if(!item||Number(S.buildings.landLevel)>=level)return;
 const houseNeed=level===2?2:level===3?4:7;
 if(S.level<item.need||Number(S.buildings.house)<houseNeed){toast('🔒 Cần đạt Lv.'+item.need+' và Nhà Lv.'+houseNeed);return}
 if(S.coins<item.cost){toast('❌ Bạn chưa đủ Xu để mở đất.');return}
 commitPurchase(g=>{if(g.coins<item.cost||Number(g.buildings.landLevel)>=level||g.level<item.need||Number(g.buildings.house)<houseNeed)return null;return {coins:g.coins-item.cost,buildings:{...g.buildings,landLevel:level}}});
}
function upgradeBuilding(id){
 const b=BUILDINGS.find(x=>x.id===id);if(!b)return;
 commitPurchase(g=>{
  const current=Number(g.buildings[id])||0;
  const land=Number(g.buildings.landLevel)||1;
  const price=costFor(b,current);
  if(land<b.land||current>=b.max||Number(g.coins)<price)return null;
  return {coins:Number(g.coins)-price,buildings:{...g.buildings,[id]:current+1}};
 });
}
async function start(){
 if(typeof firebase==='undefined'||typeof FB_CONFIG==='undefined'){location.replace('./login.html');return}
 try{if(!firebase.apps.length)firebase.initializeApp(FB_CONFIG)}catch(e){location.replace('./login.html');return}
 firebase.auth().onAuthStateChanged(async u=>{
  if(!u){location.replace('./login.html');return}user=u;
  const local=readLocal();mergeGame(local);
  try{const snap=await firebase.firestore().collection('users').doc(u.uid).get();if(snap.exists&&snap.data().game)mergeGame(snap.data().game);persistLocal()}
  catch(e){console.warn('Build load:',e);toast('⚠️ Không tải được dữ liệu máy chủ.')}
  render();
 });
}
start();
})();
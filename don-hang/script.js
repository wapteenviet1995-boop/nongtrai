(()=> {
const KEY='nongtrai_new_v1', PKEY='ntt_v2', OKEY='nongtrai_orders_v1';
const ITEMS={
 phomai:['🧀','Phô mai'],banhmi:['🥖','Bánh mì'],suachua:['🥛','Sữa chua'],banhmat:['🍰','Bánh mật'],
 kem:['🍨','Kem'],banhde:['🎂','Bánh dê'],ao:['🧵','Áo'],banhrang:['⚙️','Bánh răng'],
 matong:['🍯','Mật ong'],pig_gold:['🐷','Heo vàng'],pig_blue:['🐷','Heo xanh'],dongco:['🔧','Động cơ'],
 wheat:['🌾','Lúa mì'],carrot:['🥕','Cà rốt'],tomato:['🍅','Cà chua'],corn:['🌽','Bắp'],
 berry:['🍓','Dâu'],pumpkin:['🎃','Bí ngô'],cow:['🥛','Bò'],chicken:['🥚','Trứng gà'],
 duck:['🥚','Vịt'],goat:['🥛','Dê'],bee:['🍯','Ong']
};
const BASE=[
 ['👩‍🌾','Lily - Quán cà phê',{cow:2,wheat:3},80,30,1],
 ['👨‍🌾','Ông John - Nông trại',{cow:2,bee:1},100,35,3],
 ['👩','Mai - Cửa hàng',{berry:2,duck:3},140,45,5],
 ['👨‍🍳','Tùng - Xưởng sản xuất',{wheat:5,goat:2,bee:1},180,55,7],
 ['🍰','Tiệm bánh',{wheat:4,carrot:3,tomato:2},220,65,8],
 ['🏪','Siêu thị',{phomai:2,banhmi:2,suachua:1},300,80,10],
 ['🥛','Nhà máy sữa',{cow:3,chicken:2,goat:2},360,90,12],
 ['🏨','Khách sạn',{banhmat:2,kem:2,banhde:1},450,110,15],
 ['🏬','Trung tâm thương mại',{corn:5,berry:3,pumpkin:2},520,125,16],
 ['🚢','Thương lái',{ao:2,banhrang:2,matong:4},650,150,20],
 ['⚙️','Xưởng cơ khí',{dongco:2,banhrang:4,ao:2},800,180,22],
 ['👑','Cung điện Nông Trại',{phomai:4,kem:3,banhde:3,matong:5},1200,260,28]
];
const RARE=[
 ['💎','Thương nhân Kim Cương',{pig_gold:1,bee:3,banhmat:2},1200,250,20],
 ['👑','Hoàng gia',{banhde:3,phomai:3,kem:3},1800,350,25],
 ['🐉','Sứ giả Đảo Rồng',{pig_blue:2,matong:5,dongco:2},2500,500,30]
];
let G={},P={},O={done:0,day:'',orders:[]};
const $=s=>document.querySelector(s);
function load(){
 try{G=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){G={};}
 try{P=JSON.parse(localStorage.getItem(PKEY)||'{}')||{};}catch(e){P={};}
 try{O=JSON.parse(localStorage.getItem(OKEY)||'{}')||{};}catch(e){O={};}
 const d=new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Ho_Chi_Minh'});
 if(O.day!==d || !Array.isArray(O.orders)){
   O={done:0,day:d,orders:BASE.map((x,i)=>({id:i,done:false}))};
   save(false);
 }
}
function have(k){
 if(['cow','chicken','duck','goat','bee'].includes(k)) return Number(P.inv?.[k])||0;
 if(G.production?.items?.[k]!=null) return Number(G.production.items[k])||0;
 return Number(G.inventory?.[k])||0;
}
function take(k,n){
 if(['cow','chicken','duck','goat','bee'].includes(k)){
   P.inv=P.inv||{}; P.inv[k]=Math.max(0,(Number(P.inv[k])||0)-n);
 }else if(G.production?.items?.[k]!=null){
   G.production.items[k]=Math.max(0,(Number(G.production.items[k])||0)-n);
 }else{
   G.inventory=G.inventory||{}; G.inventory[k]=Math.max(0,(Number(G.inventory[k])||0)-n);
 }
}
function save(cloud=true){
 try{
   localStorage.setItem(KEY,JSON.stringify(G));
   localStorage.setItem(PKEY,JSON.stringify(P));
   localStorage.setItem(OKEY,JSON.stringify(O));
 }catch(e){}
 if(cloud && window.firebase?.auth().currentUser){
   firebase.firestore().collection('users').doc(firebase.auth().currentUser.uid)
   .set({game:G,petGame:P,orders:O,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true}).catch(()=>{});
 }
}
function toast(t){
 const e=$('.order-toast'); if(!e)return;
 e.textContent=t;e.style.display='block';
 clearTimeout(window.__orderToast);
 window.__orderToast=setTimeout(()=>e.style.display='none',1800);
}
function getOrders(){
 const level=Number(G.level)||1;
 const normal=BASE.map((x,id)=>({...x,id})).filter(x=>level>=x[5]);
 const rare=RARE.map((x,i)=>({...x,rare:true,id:'r'+i})).filter(x=>level>=x[5] && Math.random()<0.35);
 return normal.concat(rare);
}
function render(){
 load();
 const box=$('.orders'); if(!box)return;
 const list=getOrders();
 box.innerHTML=list.map(x=>{
   const [face,name,need,coin,xp,lv]=x;
   const saved=O.orders.find(q=>String(q.id)===String(x.id))||{done:false};
   let ok=true;
   const ns=Object.entries(need).map(([k,n])=>{
     const h=have(k);if(h<n)ok=false;
     return '<span class="need">'+(ITEMS[k]?.[0]||'📦')+' '+h+'/'+n+'</span>';
   }).join('');
   return '<div class="order '+(x.rare?'rare-order':'')+'">'+
    '<div class="face">'+face+'</div>'+
    '<div class="who"><b>'+(x.rare?'⭐ NHIỆM VỤ HIẾM · ':'')+name+'</b>'+
    '<div class="needs">'+ns+'</div></div>'+
    '<div class="reward">🪙 '+coin+'<br>⭐ '+xp+' XP'+
    '<button class="deliver" type="button" data-order="'+x.id+'" '+((!ok||saved.done)?'disabled':'')+'>'+
    (saved.done?'Đã giao':'Giao hàng')+'</button></div></div>';
 }).join('');
 const done=Number(O.done)||0;
 const bar=$('.progress i');if(bar)bar.style.width=Math.min(100,done*10)+'%';
 const txt=$('.progtext');if(txt)txt.textContent=done+' nhiệm vụ đã giao';
}
function openOrders(){
 try{render();}catch(e){console.error('Đơn hàng:',e);}
 const o=document.querySelector('.order-overlay');
 if(o){o.classList.add('on');o.style.setProperty('display','grid','important');o.style.setProperty('visibility','visible','important');o.style.setProperty('opacity','1','important');}
}
function closeOrders(){
 const o=document.querySelector('.order-overlay');
 if(o){o.classList.remove('on');o.style.setProperty('display','none','important');}
}
window.openOrders=openOrders;
window.closeOrders=closeOrders;
document.addEventListener('click',e=>{
 const order=e.target.closest('#orderBtn');
 if(order){e.preventDefault();e.stopPropagation();openOrders();return;}
 if(e.target.closest('.order-close')){e.preventDefault();e.stopPropagation();closeOrders();return;}
 if(e.target.closest('.back')){e.preventDefault();closeOrders();return;}
 const btn=e.target.closest('.deliver[data-order]');
 if(!btn || btn.disabled)return;
 const id=btn.dataset.order;
 const x=BASE.find((v,i)=>String(i)===String(id));
 if(!x){toast('Đơn hàng không hợp lệ');return;}
 load();
 const saved=O.orders.find(q=>String(q.id)===String(id));
 if(!saved || saved.done){render();return;}
 for(const [k,n] of Object.entries(x[2])){
   if(have(k)<n){toast('❌ Chưa đủ hàng');return;}
 }
 for(const [k,n] of Object.entries(x[2]))take(k,n);
 G.coins=(Number(G.coins)||0)+Number(x[3]);
 G.xp=(Number(G.xp)||0)+Number(x[4]);
 saved.done=true;O.done=(Number(O.done)||0)+1;
 save();
 const coins=$('#coins');if(coins)coins.textContent=G.coins;
 render();
 toast('✅ Giao hàng thành công! +'+x[3]+' xu');
});
window.addEventListener('pageshow',load);
})();
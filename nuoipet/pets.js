(()=>{'use strict';
const SP={pig:{n:'Heo',e:'🐷',cost:60,baby:0,bw:6.5,aw:9,grow:60,vars:[{s:1,n:'Heo hồng',p:'truf',t:45,w:70},{s:6,n:'Heo hoa',p:'truf',t:30,w:20},{s:3,n:'Heo băng',p:'ice',t:70,w:7},{s:2,n:'Heo vàng bay',p:'gold',t:100,w:3}]},
 sheep:{n:'Cừu',e:'🐑',cost:90,baby:8,bw:6.5,aw:9,grow:80,vars:[{s:4,n:'Cừu sừng',p:'wool',t:60,w:50},{s:5,n:'Cừu hoa',p:'wool',t:40,w:50}]},
 cow:{n:'Bò',e:'🐄',cost:150,baby:7,bw:7.5,aw:11.5,grow:100,vars:[{s:7,n:'Bò sữa',p:'milk',t:50,w:100}]}};
const FOOD={carrot:60,wheat:90,tomato:120,sun:150,pump:240},SATR=600;
const S=window.nongTrai.state();
S.rn=S.rn||[];S.rf=S.rf||'carrot';
Object.defineProperty(S,'c',{configurable:true,get(){return Number(S.coins||0)},set(v){S.coins=Number(v)||0}});
Object.defineProperty(S,'inv',{configurable:true,get(){S.inventory=S.inventory||{};return S.inventory},set(v){S.inventory=v||{}}});
let sellM=false,rc=0;const re={};
const lvl=()=>Number(S.level||1),inv=k=>Number(S.inventory?.[k]||0),add=(k,n)=>{S.inventory=S.inventory||{};S.inventory[k]=Math.max(0,inv(k)+n)};
const tot=()=>Object.values(S.inventory||{}).reduce((a,b)=>a+Number(b||0),0),cap=()=>40+30*Number(S.wl||0);
const hud=()=>window.nongTrai.refresh?.(),toast=m=>window.nongTrai.toast?.(m),full=()=>toast('Kho đầy! Hãy bán bớt hoặc nâng cấp nhà kho 🏚️');
const fl=(txt,el)=>{if(!el)return;const d=document.createElement('div');d.className='fl';d.textContent=txt;d.style.position='fixed';d.style.left='50%';d.style.top='45%';document.body.appendChild(d);setTimeout(()=>d.remove(),900)};
const pill=()=>{};
const rcap=()=>4+lvl()+2*(S.rx||0),rvar=a=>a.v>=0?SP[a.sp].vars[a.v]:null;
function rupd(a,now){const d=Math.max(0,Math.min(now,a.fed)-a.t)/1000;a.t=now;if(d<=0)return;const sp=SP[a.sp];
 if(a.v<0){a.g+=d;if(a.g>=sp.grow){let r=Math.random()*sp.vars.reduce((s,v)=>s+v.w,0),i=0;for(;i<sp.vars.length-1;i++){if(r<sp.vars[i].w)break;r-=sp.vars[i].w}a.v=i;a.pr=0;toast(sp.n+' đã lớn: '+sp.vars[i].n+(i>1&&a.sp==='pig'?' ✨ hiếm!':'!'))}}
 else{const v=sp.vars[a.v];a.pr+=d;while(a.pr>=v.t&&a.rd<3){a.pr-=v.t;a.rd++}if(a.rd>=3)a.pr=0}}
function rwalk(a,el){const nx=Math.min(88,Math.max(16,a.x+(Math.random()-.5)*30)),ny=Math.min(84,Math.max(42,a.y+(Math.random()-.5)*16));
 el.children[1].style.transform=nx>a.x?'scaleX(-1)':'';a.x=nx;a.y=ny;el.style.left=nx+'%';el.style.top=ny+'%';el.style.zIndex=Math.round(ny*10)}
function rmk(a){const d=document.createElement('div');d.className='an';d.innerHTML='<div class="pill"></div><img alt="">';a.x=a.x||50;a.y=a.y||60;d.style.left=a.x+'%';d.style.top=a.y+'%';d.style.zIndex=Math.round(a.y*10);d.onclick=()=>rclick(a,d);const scene=document.getElementById('pet-scene');if(scene)scene.appendChild(d);re[a.id]=d}
function rclick(a,el){const now=Date.now();rupd(a,now);const sp=SP[a.sp];
 if(sellM){const v=a.v>=0,g=Math.round(sp.cost*(v?1.5:.5));if(!confirm('Bán '+(v?rvar(a).n:sp.n+' con')+' lấy 🪙'+g+'?'))return;S.c+=g;S.rn=S.rn.filter(x=>x!==a);hud();fl('+'+g+' 🪙',el);return}
 if(a.rd>0){if(tot()>=cap()){full();return}const p=rvar(a).p;a.rd--;add(p,1);S.xp+=3;hud();fl('+1 '+IT[p][0],el);return}
 const k=S.rf;if(inv(k)<1){toast('Hết '+IT[k][1]+'! Chọn thức ăn khác hoặc trồng thêm');return}
 if(a.fed-now>(SATR-FOOD[k])*1000){toast(sp.n+' no rồi!');return}
 add(k,-1);a.fed=Math.max(now,a.fed)+FOOD[k]*1000;S.xp+=1;hud();fl('-1 '+IT[k][0]+' 😋',el)}
function rbuy(k){const sp=SP[k];if(S.rn.length>=rcap()){toast('Chuồng đầy ('+rcap()+'). Lên cấp để mở rộng!');return}if(S.c<sp.cost){toast('Cần 🪙'+sp.cost);return}
 S.c-=sp.cost;const now=Date.now(),a={id:'a'+now+Math.floor(Math.random()*1e4),sp:k,v:-1,g:0,pr:0,rd:0,fed:now+30000,t:now,x:25+Math.random()*50,y:50+Math.random()*28};S.rn.push(a);rmk(a);hud();toast('Đã mua '+sp.n+' con! Cho ăn để lớn 🍼')}
function rbar(){const B=$('rb');if(!B)return;B.innerHTML='';const mk=(h,on,fn,cls)=>{const d=document.createElement('div');d.className='seed'+(on?' on':'')+(cls?' '+cls:'');d.innerHTML=h;d.onclick=fn;B.appendChild(d)};
 mk('<b>🐾</b>'+S.rn.length+'/'+rcap()+'<br>Chuồng',0,()=>toast('Lên cấp để mở rộng chuồng'));
 Object.keys(SP).forEach(k=>mk('<b>'+SP[k].e+'</b>Mua '+SP[k].n+'<br>🪙'+SP[k].cost,0,()=>rbuy(k)));
 mk('<b>💰</b>Bán thú<br>'+(sellM?'BẬT':'tắt'),sellM,()=>{sellM=!sellM;toast(sellM?'Chạm thú để bán':'Đã tắt chế độ bán');rbar()});
 Object.keys(FOOD).forEach(k=>mk('<b>'+IT[k][0]+'</b>'+IT[k][1]+'<br>Có: '+inv(k),S.rf===k,()=>{S.rf=k;rbar()}))}
function rtick(){const now=Date.now();S.rn.forEach(a=>{if(!re[a.id])rmk(a);rupd(a,now);const el=re[a.id],sp=SP[a.sp],v=rvar(a),img=el.children[1],src=SPR[v?v.s:sp.baby];if(img.getAttribute('src')!==src)img.src=src;el.style.width=(v?sp.aw:sp.bw)+'%';const hu=a.fed<=now;let t,cd=0;if(!v){t=hu?'😋 Đói':'🍼 '+Math.floor(a.g/sp.grow*100)+'%';cd=!hu}else if(a.rd>0)t=IT[v.p][0]+' Thu!'+(a.rd>1?' ×'+a.rd:'');else if(hu)t='😋 Đói';else{t=IT[v.p][0]+' '+Math.ceil(v.t-a.pr)+'s';cd=1}if(el.firstChild.textContent!==t)el.firstChild.textContent=t;el.firstChild.classList.toggle('cd',!!cd);if(Math.random()<.18)rwalk(a,el)}Object.keys(re).forEach(id=>{if(!S.rn.some(a=>a.id===id)){re[id].remove();delete re[id]}});if(!(rc++%10))window.nongTrai.save?.()}

function renderOldBar(){const bar=document.getElementById('pet-old-bar');if(!bar)return;rbar();}
function open(){const s=document.getElementById('pet-scene');if(!s)return;document.getElementById('modal')?.classList.add('on');rtick();rbar();}
window.nongPet={open,buy:rbuy,state:()=>S,feed:(i)=>{const a=S.rn[i];if(a)rclick(a,re[a.id])}};
setInterval(rtick,1000);
})();
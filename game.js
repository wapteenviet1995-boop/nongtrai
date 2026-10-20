/* ===== LÕI GAME: nông trại, chuồng trại, shop, nhân viên ===== */
const CROPS=[{id:'carrot',e:'🥕',n:'Cà rốt',cost:5,t:20,xp:3,lv:1},{id:'wheat',e:'🌾',n:'Lúa mì',cost:8,t:40,xp:5,lv:1},{id:'tomato',e:'🍅',n:'Cà chua',cost:12,t:70,xp:8,lv:2},{id:'sun',e:'🌻',n:'Hướng dương',cost:20,t:120,xp:12,lv:3},{id:'pump',e:'🎃',n:'Bí ngô',cost:35,t:200,xp:20,lv:5}];
const IT={carrot:['🥕','Cà rốt',12],wheat:['🌾','Lúa mì',22],tomato:['🍅','Cà chua',40],sun:['🌻','Hướng dương',75],pump:['🎃','Bí ngô',140],milk:['🥛','Sữa bò',25],egg:['🥚','Trứng gà',12],fur:['🧶','Lông thỏ',18],f1:['🐟','Cá nhỏ',12],f2:['🐠','Cá vàng',28],f3:['🐡','Cá nóc',60],f4:['🦈','Cá mập',150],gem:['💎','Ngọc rồng',40]};
const DF={f1:60,f2:120,f3:240,f4:900,tomato:90,sun:150,pump:300};
const PL=[[13.94,28.06,8.11,11.12],[22.82,28.03,7.97,11.06],[31.65,28.12,7.94,10.88],[40.43,28.09,8.08,11.06],[13.94,40.31,8.04,11.0],[22.82,40.34,7.9,10.94],[31.64,40.41,7.97,10.94],[40.43,40.34,8.01,10.94],[13.92,52.66,8.08,10.81],[22.84,52.75,7.87,10.75],[31.67,52.75,7.9,10.75],[40.43,52.75,8.01,10.88],[13.89,65.03,8.08,10.81],[22.81,65.09,7.94,10.81],[31.65,65.06,7.87,10.88],[40.45,65.06,7.97,11.0],[13.87,76.94,8.11,10.75],[22.82,77.03,7.97,10.56],[31.65,77.06,7.94,10.62],[40.43,77.0,8.01,10.62],[60.48,27.78,8.08,11.19],[69.43,27.91,8.08,11.06],[78.42,27.97,8.01,10.94],[87.32,27.97,8.11,11.06],[60.45,40.09,8.15,11.06],[69.43,40.06,8.01,11.0],[78.42,40.09,8.01,10.94],[87.34,40.12,8.08,11.0],[60.45,52.53,8.15,10.81],[69.47,52.53,8.01,10.81],[78.42,52.47,8.01,10.94],[87.39,52.53,8.11,10.94],[60.41,64.94,8.22,11.0],[69.45,65.0,7.97,10.75],[78.41,64.97,8.04,10.94],[87.36,64.94,8.11,10.88],[60.46,76.91,8.18,10.81],[69.49,76.91,8.04,10.69],[78.46,76.88,8.08,10.88],[87.36,76.94,8.18,10.88]];
const FREE=[5,6,9,10];
const AN=[];
const CAP=50,SAT=900000,K='nongtrai_v2';
const $=id=>document.getElementById(id);
function fresh(){return{c:40,xp:0,seed:'carrot',inv:{carrot:2,wheat:3},p:PL.map((_,i)=>({u:FREE.includes(i),c:null,s:0,e:0,w:0})),an:{},fi:{st:0,e:0},d:{xp:0,full:0,acc:0,t:Date.now()},box:0,wl:0,rn:[],rf:'carrot'}}
function load(){try{const r=localStorage.getItem(K);if(r){const o=JSON.parse(r);if(o&&o.p&&o.d){if(o.p.length!==PL.length)o.p=fresh().p;o.rn=o.rn||[];return o}}}catch(e){}return fresh()}
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
let S=load();
const tot=()=>Object.entries(S.inv).reduce((a,[k,b])=>a+(k==='gem'?0:b),0),cap=()=>40+30*(S.wl||0),uCost=()=>100*(1+(S.wl||0));
function full(){toast('Kho đầy! Hãy bán bớt hoặc nâng cấp nhà kho 🏚️')}
const lvl=()=>1+Math.floor(Math.sqrt(S.xp/10)),dl=()=>1+Math.floor(Math.sqrt(S.d.xp/30));
const cr=id=>CROPS.find(c=>c.id===id),inv=k=>S.inv[k]||0;
let tt;function toast(m){const t=$('to');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),1900)}
function fl(txt,el){const r=el.getBoundingClientRect(),d=document.createElement('div');d.className='fl';d.textContent=txt;d.style.left=(r.left+r.width/2)+'px';d.style.top=(r.top+r.height/3)+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),1000)}
function add(k,n){S.inv[k]=inv(k)+n}
function hud(){$('co').textContent=Math.floor(S.c);$('hv').textContent=tot()+'/'+cap();const L=lvl(),a=10*(L-1)**2,b=10*L*L;$('lv').textContent=L;$('xb').style.width=Math.min(100,(S.xp-a)/(b-a)*100)+'%';$('nx').textContent='XP '+S.xp+'/'+b;seedsUI();save()}
function seedsUI(){const L=lvl();$('sd').innerHTML='';CROPS.forEach(c=>{const d=document.createElement('div'),lk=L<c.lv;d.className='seed'+(S.seed===c.id?' on':'')+(lk?' lk':'');d.innerHTML='<b>'+c.e+'</b>'+c.n+'<br>'+(lk?'🔒 Cấp '+c.lv:'🪙'+c.cost+' · '+c.t+'s')+'<br>Có: '+inv(c.id);d.onclick=()=>{if(lk){toast('Cần đạt cấp '+c.lv);return}S.seed=c.id;hud()};$('sd').appendChild(d)})}
/* nông trại */
const pe=[];
PL.forEach((pos,i)=>{const d=document.createElement('div');d.className='hs plot';d.style.cssText='left:'+pos[0]+'%;top:'+pos[1]+'%;width:'+pos[2]+'%;height:'+pos[3]+'%';d.innerHTML='<div class="b"></div><div class="bar"><i></i></div>';d.onclick=()=>clickPlot(i,d);$('s1').appendChild(d);pe.push(d)});
const uc=()=>40+20*(S.p.filter(p=>p.u).length-FREE.length);
function clickPlot(i,el){const p=S.p[i],now=Date.now();
 if(!p.u){const k=uc();if(S.c>=k){S.c-=k;p.u=true;hud();toast('Đã mở khóa ô đất!')}else toast('Cần 🪙'+k+' để mở ô này');return}
 if(!p.c){const c=cr(S.seed);if(lvl()<c.lv){toast('Chưa đủ cấp');return}if(S.c<c.cost){toast('Không đủ xu! Hãy bán đồ trong kho hoặc câu cá');return}S.c-=c.cost;p.c=c.id;p.s=now;p.e=now+c.t*1000;p.w=0;hud();fl('-'+c.cost,el);return}
 if(now>=p.e){if(tot()>=cap()){full();return}const c=cr(p.c);add(c.id,1);S.xp+=c.xp;p.c=null;hud();fl('+1 '+c.e,el);return}
 if(now-p.w<3000){toast('Vừa tưới xong, đợi chút nhé 💧');return}
 p.w=now;p.e-=(p.e-p.s)*.2;save();fl('💧 -20%',el)}
/* trang chủ: hotspot */
const he={};
function spot(id,x,y,w,h,fn){const d=document.createElement('div');d.className='hs';d.style.cssText='left:'+x+'%;top:'+y+'%;width:'+w+'%;height:'+h+'%';d.innerHTML='<div class="pill"></div>';d.onclick=()=>fn(d);$('s2').appendChild(d);he[id]=d.firstChild;return d}
function openHouseMenu(){
 dOpen=false;
 $('md').className='md ui-house';
 $('md').innerHTML='<h2>🏡 Ngôi nhà</h2><p style="text-align:center;margin:0 0 12px;color:var(--mu)">Bạn muốn làm gì trên đảo?</p><div class="house-actions"><button class="btn g" id="hmfarm">🌱 Làm nông</button><button class="btn g" id="hmranch">🐮 Chăn nuôi</button><button class="btn" id="hmstorage">📦 Nhà kho</button><button class="btn" id="hmshop">🏪 Cửa hàng</button><button class="btn" id="hmsocial">👥 Cộng đồng & bạn bè</button><button class="btn" id="hmdaily">🎁 Nhiệm vụ ngày</button><button class="btn" id="hmach">🏆 Thành tựu</button></div><div style="text-align:right;margin-top:12px"><button class="btn" id="hmclose">Đóng</button></div>';
 $('ov').classList.add('on');
 $('hmfarm').onclick=()=>{closeM();go(1)};
 $('hmranch').onclick=()=>{closeM();go(3)};
 $('hmstorage').onclick=()=>openKho();
 $('hmshop').onclick=()=>openShop('buy');
 $('hmsocial').onclick=()=>openSoc('chat');
 $('hmdaily').onclick=()=>openSoc('daily');
 $('hmach').onclick=()=>openSoc('ach');
 $('hmclose').onclick=closeM;
}
spot('house',7,12,25,35,()=>openHouseMenu());
spot('farm',68,57,22,16,()=>go(1));
spot('wh',82,43,14,16,()=>openKho());
AN.forEach(a=>spot(a.id,a.x,a.y,a.w,a.h,el=>clickAn(a,el)));
spot('fish',46,65,13,18,el=>clickFish(el));
spot('box',4,64,8,11,el=>{const now=Date.now();if(S.box>now){toast('Rương đang nạp, chờ thêm chút');return}S.box=now+90000;const g=40+Math.floor(Math.random()*60);S.c+=g;hud();fl('+'+g+' 🪙',el)});
function clickAn(a,el){const now=Date.now(),s=S.an[a.id]||(S.an[a.id]={st:0,e:0});
 if(s.st===0){if(inv(a.feed)<1){toast('Cần 1 '+IT[a.feed][0]+' '+IT[a.feed][1]+' - hãy trồng ở nông trại');return}add(a.feed,-1);s.st=1;s.e=now+a.t*1000;hud();fl('-1 '+IT[a.feed][0],el)}
 else if(s.st===1&&now>=s.e)s.st=2;
 if(s.st===2){if(tot()>=cap()){full();return}add(a.out,1);s.st=0;S.xp+=2;hud();fl('+1 '+IT[a.out][0],el)}
 else if(s.st===1)toast(a.n+' đang sản xuất...')}
function clickFish(el){const f=S.fi,now=Date.now();
 if(f.st===0){f.st=1;f.e=now+6000;save();toast('Đã thả cần 🎣');return}
 if(f.st===1&&now>=f.e)f.st=2;
 if(f.st===2){if(tot()>=cap()){full();return}const r=Math.random(),k=r<.6?'f1':r<.88?'f2':r<.98?'f3':'f4';add(k,1);f.st=0;S.xp+=2;hud();fl('+1 '+IT[k][0],el)}else toast('Chưa có cá cắn câu...')}
function tick(){const now=Date.now();
 S.p.forEach((p,i)=>{const el=pe[i],b=el.children[0],bar=el.children[1];el.classList.toggle('locked',!p.u);el.classList.remove('ready');
  if(!p.u){b.innerHTML='🔒<small>🪙'+uc()+'</small>';bar.style.visibility='hidden';return}
  if(!p.c){b.innerHTML='＋';bar.style.visibility='hidden';return}
  const c=cr(p.c);bar.style.visibility='visible';
  if(now>=p.e){el.classList.add('ready');b.innerHTML=c.e+'<small>Thu hoạch</small>';bar.children[0].style.width='100%'}
  else{const pr=(now-p.s)/(p.e-p.s);b.innerHTML=(pr<.5?'🌱':'🌿')+'<small>'+Math.ceil((p.e-now)/1000)+'s</small>';bar.children[0].style.width=pr*100+'%'}});
 const rd=S.p.filter(p=>p.c&&now>=p.e).length;
 pill('farm','🌱 Vườn'+(rd?' · '+rd+'!':''),0);
 pill('wh','🏚️ '+tot()+'/'+cap(),0);
 AN.forEach(a=>{const s=S.an[a.id]||{st:0,e:0};let t,cd=0;if(s.st===1&&now>=s.e)s.st=2;
  if(s.st===0)t=a.e+' '+IT[a.feed][0];else if(s.st===1){t=a.e+' '+Math.ceil((s.e-now)/1000)+'s';cd=1}else t=IT[a.out][0]+' Thu!';pill(a.id,t,cd)});
 const f=S.fi;if(f.st===1&&now>=f.e)f.st=2;
 pill('fish',f.st===0?'🎣 Thả':f.st===1?'🎣 '+Math.ceil((f.e-now)/1000)+'s':'🐟 Kéo!',f.st===1?1:0);
 accrue(now);pill('dra','🐲 Lv'+dl()+' 💎'+Math.floor(S.d.acc),0);pill('dra2','',0);he.dra2.style.display='none';
 const bx=S.box-now;pill('box',bx>0?'🎁 '+Math.ceil(bx/1000)+'s':'🎁',bx>0?1:0);
 if($('ov').classList.contains('on')&&dOpen)dUpd()}
function pill(id,t,cd){const e=he[id];if(e.textContent!==t)e.textContent=t;e.classList.toggle('cd',!!cd)}
/* rồng */
function accrue(now){const d=S.d,last=d.t||now,up=Math.min(now,d.full),dt=Math.max(0,up-last)/60000;d.acc=Math.min(CAP,d.acc+dt*.3*dl());d.t=now}
let dOpen=false;
function openDragon(){dOpen=true;let h='<h2>🐲 Rồng trên đảo bay</h2><div class="dr" id="dE">🐲</div><div style="text-align:center;font-weight:700" id="dN"></div><div style="font-size:13px;color:var(--mu)">Kinh nghiệm</div><div class="pb"><i id="dX"></i></div><div style="font-size:13px;color:var(--mu)">Độ no <span id="dS"></span></div><div class="pb"><i id="dB"></i></div><div class="row"><span>💎 Ngọc tích lũy: <b id="dG">0</b>/'+CAP+'</span><span class="sp"></span><button class="btn g" id="dC">Thu ngọc</button></div><div style="font-size:13px;color:var(--mu)">Cho ăn (rồng chỉ sinh ngọc khi còn no, lên cấp thì sinh nhanh hơn):</div><div class="fd">';
 Object.keys(DF).forEach(k=>{h+='<button class="btn" data-f="'+k+'">'+IT[k][0]+' ×<span id="c_'+k+'">0</span><br><small>+'+DF[k]+'s</small></button>'});
 h+='</div><div style="text-align:right"><button class="btn" id="dZ">Đóng</button></div>';$('md').innerHTML=h;$('ov').classList.add('on');
 $('md').querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>feed(b.dataset.f));
 $('dC').onclick=()=>{accrue(Date.now());let g=Math.floor(S.d.acc);if(g<1){toast('Chưa có ngọc để thu');return}S.d.acc-=g;add('gem',g);hud();toast('+'+g+' 💎 vào kho')};
 $('dZ').onclick=closeM;dUpd()}
function feed(k){const now=Date.now();if(inv(k)<1){toast('Hết '+IT[k][1]+' trong kho');return}if(S.d.full-now>SAT-DF[k]*1000){toast('Rồng đã no rồi!');return}accrue(now);add(k,-1);S.d.full=Math.max(now,S.d.full)+DF[k]*1000;S.d.xp+=DF[k]/10;S.xp+=1;hud();dUpd()}
function dUpd(){const L=dl(),a=30*(L-1)**2,b=30*L*L,now=Date.now(),r=Math.max(0,S.d.full-now);
 $('dE').textContent=L>=5?'🐉':'🐲';$('dN').textContent=(L>=5?'Rồng trưởng thành':L>=3?'Rồng trẻ':'Rồng con')+' · Cấp '+L;
 $('dX').style.width=Math.min(100,(S.d.xp-a)/(b-a)*100)+'%';$('dB').style.width=Math.min(100,r/SAT*100)+'%';$('dS').textContent=r>0?Math.ceil(r/1000)+'s':'(đói)';
 $('dG').textContent=Math.floor(S.d.acc);Object.keys(DF).forEach(k=>$('c_'+k).textContent=inv(k))}
/* kho */
function openKho(){dOpen=false;let h='<h2>🏚️ Nhà kho</h2><div style="font-size:13px;color:var(--mu)">Sức chứa '+tot()+'/'+cap()+' · Cấp '+(1+(S.wl||0))+'</div><div class="pb"><i style="width:'+Math.min(100,tot()/cap()*100)+'%"></i></div><div class="row"><span class="sp"></span><button class="btn g" id="up">Nâng cấp +30 chỗ (🪙'+uCost()+')</button></div>',any=0;
 Object.keys(IT).forEach(k=>{const n=inv(k);if(!n)return;any=1;h+='<div class="it"><span style="font-size:22px">'+IT[k][0]+'</span><span class="n">'+IT[k][1]+' ×'+n+'<br><small style="color:var(--mu)">🪙'+IT[k][2]+'/cái</small></span><button class="btn" data-s="'+k+'" data-n="1">Bán 1</button><button class="btn g" data-s="'+k+'" data-n="all">Bán hết</button></div>'});
 if(!any)h+='<p>Kho trống. Hãy trồng trọt, chăn nuôi và câu cá!</p>';
 h+='<div style="text-align:right;margin-top:10px"><button class="rs" id="rs">Chơi lại từ đầu</button> <button class="btn" id="kz">Đóng</button></div>';$('md').innerHTML=h;$('ov').classList.add('on');
 $('md').querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{const k=b.dataset.s,n=b.dataset.n==='all'?inv(k):1;add(k,-n);S.c+=n*IT[k][2];hud();openKho()});$('kz').onclick=closeM;$('rs').onclick=()=>{if(confirm('Xóa toàn bộ tiến trình và chơi lại?')){S=fresh();hud();tick();closeM()}};$('up').onclick=()=>{const k=uCost();if(S.c<k){toast('Cần 🪙'+k+' để nâng cấp');return}S.c-=k;S.wl=(S.wl||0)+1;hud();openKho();toast('Nhà kho đã nâng cấp!')}}
function closeM(){$('ov').classList.remove('on');dOpen=false}
$('ov').onclick=e=>{if(e.target===$('ov'))closeM()};$('kb').onclick=openKho;
function go(n){$('v1').style.display=n===1?'':'none';$('v2').style.display=n===2?'':'none';$('v3').style.display=n===3?'':'none';fit();center(n);if(n===1)toast('Chọn hạt giống bên dưới rồi chạm ô đất, vuốt để xem rộng hơn')}
let Z=1;
function fit(){const T=Math.ceil(document.querySelector('.top').getBoundingClientRect().bottom),H=innerHeight-T,nr=innerWidth<700,r=document.documentElement.style;r.setProperty('--T',T+'px');r.setProperty('--H',H+'px');r.setProperty('--W1',(nr?innerWidth:Math.min(innerWidth,H*1.5))*Z+'px');r.setProperty('--W2',(nr?innerWidth:Math.min(innerWidth,H*1.7778))*Z+'px');r.setProperty('--SH',nr?H*Z+'px':'auto')}
function center(n){const p=$('p'+n);p.scrollLeft=(p.scrollWidth-p.clientWidth)/2;p.scrollTop=(p.scrollHeight-p.clientHeight)/2}
$('zb').onclick=()=>{Z=Z===1?1.6:Z===1.6?2.3:1;$('zb').textContent='🔍 x'+Z;fit();center(1);center(2);center(3)};
['1','2','3'].forEach(n=>{$('b'+n).style.backgroundImage='url('+document.querySelector('#s'+n+' img').src+')'});
document.documentElement.style.setProperty('--tile','url('+$('ti').src+')');
addEventListener('resize',fit);
$('bk').onclick=()=>go(2);
/* ===== CHUỒNG TRẠI ===== */
const SPR=["img/spr-1.webp", "img/spr-2.webp", "img/spr-3.webp", "img/spr-4.webp", "img/spr-5.webp", "img/spr-6.webp", "img/spr-7.webp", "img/spr-8.webp", "img/spr-9.webp"];
Object.assign(IT,{truf:['🍄','Nấm cục',35],wool:['☁️','Len cừu',30],ice:['❄️','Tinh thể băng',90],gold:['🏅','Vàng thỏi',220]});
const SP={pig:{n:'Heo',e:'🐷',cost:60,baby:0,bw:6.5,aw:9,grow:60,vars:[{s:1,n:'Heo hồng',p:'truf',t:45,w:70},{s:6,n:'Heo hoa',p:'truf',t:30,w:20},{s:3,n:'Heo băng',p:'ice',t:70,w:7},{s:2,n:'Heo vàng bay',p:'gold',t:100,w:3}]},
 sheep:{n:'Cừu',e:'🐑',cost:90,baby:8,bw:6.5,aw:9,grow:80,vars:[{s:4,n:'Cừu sừng',p:'wool',t:60,w:50},{s:5,n:'Cừu hoa',p:'wool',t:40,w:50}]},
 cow:{n:'Bò',e:'🐄',cost:150,baby:7,bw:7.5,aw:11.5,grow:100,vars:[{s:7,n:'Bò sữa',p:'milk',t:50,w:100}]}};
const FOOD={carrot:60,wheat:90,tomato:120,sun:150,pump:240},SATR=600;
S.rn=S.rn||[];S.rf=S.rf||'carrot';let sellM=false,rc=0;const re={};
const rcap=()=>4+lvl()+2*(S.rx||0),rvar=a=>a.v>=0?SP[a.sp].vars[a.v]:null;
function rupd(a,now){const d=Math.max(0,Math.min(now,a.fed)-a.t)/1000;a.t=now;if(d<=0)return;const sp=SP[a.sp];
 if(a.v<0){a.g+=d;if(a.g>=sp.grow){let r=Math.random()*sp.vars.reduce((s,v)=>s+v.w,0),i=0;for(;i<sp.vars.length-1;i++){if(r<sp.vars[i].w)break;r-=sp.vars[i].w}a.v=i;a.pr=0;toast(sp.n+' đã lớn: '+sp.vars[i].n+(i>1&&a.sp==='pig'?' ✨ hiếm!':'!'))}}
 else{const v=sp.vars[a.v];a.pr+=d;while(a.pr>=v.t&&a.rd<3){a.pr-=v.t;a.rd++}if(a.rd>=3)a.pr=0}}
function rwalk(a,el){const nx=Math.min(86,Math.max(14,a.x+(Math.random()-.5)*30)),ny=Math.min(84,Math.max(44,a.y+(Math.random()-.5)*16));
 el.children[1].style.transform=nx>a.x?'scaleX(-1)':'';a.x=nx;a.y=ny;el.style.left=nx+'%';el.style.top=ny+'%';el.style.zIndex=Math.round(ny*10)}
function rmk(a){const d=document.createElement('div');d.className='an';d.innerHTML='<div class="pill"></div><img alt="">';a.x=a.x||50;a.y=a.y||60;d.style.left=a.x+'%';d.style.top=a.y+'%';d.style.zIndex=Math.round(a.y*10);d.onclick=()=>rclick(a,d);$('s3').appendChild(d);re[a.id]=d}
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
function rtick(){const now=Date.now();pill('ranch','🐷 Chuồng'+(S.rn.some(a=>a.rd>0)?' · Thu!':''),0);S.rn.forEach(a=>{if(!re[a.id])rmk(a);rupd(a,now);const el=re[a.id],sp=SP[a.sp],v=rvar(a),img=el.children[1],src=SPR[v?v.s:sp.baby];
  if(img.getAttribute('src')!==src)img.src=src;el.style.width=(v?sp.aw:sp.bw)+'%';
  const hu=a.fed<=now;let t,cd=0;if(!v){t=hu?'😋 Đói':'🍼 '+Math.floor(a.g/sp.grow*100)+'%';cd=!hu}else if(a.rd>0)t=IT[v.p][0]+' Thu!'+(a.rd>1?' ×'+a.rd:'');else if(hu)t='😋 Đói';else{t=IT[v.p][0]+' '+Math.ceil(v.t-a.pr)+'s';cd=1}
  if(el.firstChild.textContent!==t)el.firstChild.textContent=t;el.firstChild.classList.toggle('cd',!!cd);if(Math.random()<.18)rwalk(a,el)});
 Object.keys(re).forEach(id=>{if(!S.rn.some(a=>a.id===id)){re[id].remove();delete re[id]}});if(!(rc++%10))save()}
const _t=tick;tick=()=>{_t();rtick()};const _h=hud;hud=()=>{_h();rbar()};const _g=go;go=n=>{_g(n);if(n===3)toast('Chạm thú: thu sản phẩm / cho ăn (chọn thức ăn bên dưới)')};
spot('ranch',33,53,12,13,()=>go(3));$('bk3').onclick=()=>go(2);

/* Đã bỏ nhân vật chó và rồng khỏi màn hình đảo theo yêu cầu. */

/* ===== CỬA HÀNG & HỒ SƠ ===== */
const AVS=['img/avatar-1.webp','img/avatar-2.webp'];
S.av=S.av||0;S.nm=S.nm||'Nông dân';S.rx=S.rx||0;
function prof(){$('avi').src=AVS[S.av];$('pn').textContent=S.nm}
const _h2=hud;hud=()=>{_h2();prof()};
let stab='buy';
const row=(e,n,sub,b)=>'<div class="it"><span style="font-size:22px">'+e+'</span><span class="n">'+n+'<br><small style="color:var(--mu)">'+sub+'</small></span>'+b+'</div>';
const sb=(a,k,n,t,g)=>'<button class="btn'+(g?' g':'')+'" data-a="'+a+'" data-k="'+k+'" data-n="'+n+'">'+t+'</button>';
function openShop(t){dOpen=false;stab=t||stab;const L=lvl();
 let h='<h2>🏪 Cửa hàng</h2><div class="tabs2">'+[['buy','🛒 Mua'],['sell','💰 Bán'],['up','⬆️ Nâng cấp'],['staff','👥 Thuê'],['me','👤 Hồ sơ']].map(a=>'<button class="btn'+(stab===a[0]?' g':'')+'" data-t="'+a[0]+'">'+a[1]+'</button>').join('')+'</div><div class="row"><span>🪙 <b>'+Math.floor(S.c)+'</b></span><span class="sp"></span><span style="font-size:12px;color:var(--mu)">Kho '+tot()+'/'+cap()+'</span></div>';
 if(stab==='buy'){h+='<div style="font-size:12px;color:var(--mu)">Mua nông sản để cho thú ăn ngay, không cần chờ trồng.</div>';CROPS.forEach(c=>{const lk=L<c.lv;h+=row(c.e,c.n+(lk?' 🔒 Cấp '+c.lv:''),'🪙'+IT[c.id][2]*2+'/cái · Có: '+inv(c.id),lk?'':sb('b',c.id,1,'Mua 1')+sb('b',c.id,5,'×5',1))})}
 else if(stab==='sell'){let tv=0,any=0;Object.keys(IT).forEach(k=>{const n=inv(k);if(!n)return;any=1;tv+=n*IT[k][2];h+=row(IT[k][0],IT[k][1]+' ×'+n,'🪙'+IT[k][2]+'/cái',sb('s',k,1,'Bán 1')+sb('s',k,'all','Hết',1))});
  h+=any?'<div style="text-align:center;margin-top:8px">'+sb('sa','',0,'Bán tất cả · 🪙'+tv,1)+'</div>':'<p>Kho trống. Hãy trồng trọt, chăn nuôi và câu cá!</p>'}
 else if(stab==='staff'){h+=staffHtml()}
  else if(stab==='up'){const rk=150*(1+S.rx);h+=row('🏚️','Nhà kho cấp '+(1+S.wl),'+30 chỗ chứa · hiện '+cap(),sb('uw','',0,'🪙'+uCost(),1))+row('🐷','Chuồng thú +'+S.rx*2,'+2 chỗ nuôi · hiện '+rcap(),sb('ur','',0,'🪙'+rk,1))}
 else{h+='<div class="avs">'+AVS.map((s,i)=>'<div class="avc'+(S.av===i?' on':'')+'" data-a="av" data-n="'+i+'"><img src="'+s+'" alt="">'+['Cậu bé xanh','Nhà thám hiểm'][i]+'</div>').join('')+'</div><div class="row"><span>Tên:</span><input id="pnm" maxlength="16" value="'+S.nm+'" style="flex:1;padding:8px;border:2px solid var(--bd);border-radius:10px;background:var(--pn);color:var(--tx);font-size:14px"></div><div class="row"><span>Tuổi:</span><input id="pag" type="number" min="5" max="99" value="'+(S.age||'')+'" style="flex:1;padding:8px;border:2px solid var(--bd);border-radius:10px;background:var(--pn);color:var(--tx);font-size:14px"></div><div class="it"><span class="n">⭐ Cấp '+L+' · XP '+S.xp+'</span></div><div class="it"><span class="n">🐾 Thú nuôi: '+S.rn.length+'/'+rcap()+'</span></div><div class="it"><span class="n">🐲 Rồng cấp '+dl()+'</span></div>'}
 h+='<div style="text-align:right;margin-top:10px"><button class="btn" id="shz">Đóng</button></div>';$('md').innerHTML=h;$('ov').classList.add('on');
 $('shz').onclick=closeM;$('md').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>openShop(b.dataset.t));
 const pn=$('pnm');if(pn)pn.onchange=()=>{S.nm=pn.value.trim().slice(0,16)||'Nông dân';hud();cloudSave(true)};const pg=$('pag');if(pg)pg.onchange=()=>{const a=Math.floor(+pg.value);if(a>=5&&a<=99){S.age=a;cloudSave(true);toast('Đã lưu tuổi')}else toast('Tuổi từ 5 đến 99')};
 $('md').querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=b.dataset.a,k=b.dataset.k,n=b.dataset.n;
  if(a==='b'){const q=+n,c=IT[k][2]*2*q;if(tot()+q>cap()){full();return}if(S.c<c){toast('Cần 🪙'+c);return}S.c-=c;add(k,q)}
  else if(a==='s'){const q=n==='all'?inv(k):+n;add(k,-q);S.c+=q*IT[k][2]}
  else if(a==='sa'){Object.keys(IT).forEach(i=>{S.c+=inv(i)*IT[i][2];S.inv[i]=0})}
  else if(a==='uw'){const c=uCost();if(S.c<c){toast('Cần 🪙'+c);return}S.c-=c;S.wl++;toast('Nhà kho đã nâng cấp!')}
  else if(a==='ur'){const c=150*(1+S.rx);if(S.c<c){toast('Cần 🪙'+c);return}S.c-=c;S.rx++;toast('Chuồng đã mở rộng!')}
  else if(a==='av')S.av=+n;else if(a==='hire'){if(!hire(k))return}else if(a==='hup'){if(!hupg(k))return}
  hud();openShop()})}
spot('shop',48,39,13,14,()=>openSoc('mk'));he.shop.textContent='🛒 Chợ người chơi';
$('sb').onclick=()=>openShop('buy');$('av').onclick=()=>openShop('me');

/* ===== NHÂN VIÊN CHUỒNG TRẠI: Cậu bé xanh (chăm sóc) & Nhà thám hiểm (thu hoạch) ===== */
/* TEST_MODE đã chuyển sang config.js */ /* đặt false để tắt chế độ test 99999 xu & ngọc */
{const _f=fresh;fresh=()=>{const o=_f();o.hp=[];if(TEST_MODE){o.c=99999;o.inv.gem=99999}return o}}
S.hp=S.hp||[];S.inv=S.inv||{};
if(TEST_MODE){S.c=99999;S.inv.gem=99999}
const HP={
 boy:{n:'Cậu bé xanh',s:'Bé xanh',role:'Chăm sóc',ic:'🪣',av:0,face:'R',job:'care',cost:[500,3],d:'Tự động mang thức ăn cho thú đang đói, giúp thú lớn nhanh và luôn no. Hết thức ăn trong kho sẽ tự mua (có thể tắt).'},
 girl:{n:'Nhà thám hiểm',s:'Thám hiểm',role:'Thu hoạch',ic:'🎒',av:1,face:'L',job:'harvest',cost:[800,5],d:'Tự động đi quanh chuồng thu sản phẩm của thú (sữa, len, nấm cục...) vào nhà kho.'}};
const HMAX=5,hInt=h=>Math.max(1.5,5.5-.9*(h.lv-1))*1000,hUp=h=>[300*h.lv,2*h.lv];
const hpe={},hr={},hrt=k=>hr[k]||(hr[k]={st:0,nx:0,arr:0,tg:null,x:50,y:65,wt:0}),hget=k=>S.hp.find(h=>h.k===k);
function hWarn(h,m){const r=hrt(h.k);if(Date.now()-r.wt>15000){r.wt=Date.now();toast(HP[h.k].n+': '+m)}}
function hFood(h){let k=inv(S.rf)>0?S.rf:Object.keys(FOOD).find(x=>inv(x)>0);if(k)return{k,b:0};if(h.auto!==0){k=S.rf;if(S.c>=IT[k][2]*2)return{k,b:1}}return null}
function hFeed(a,f,now){if(f.b)S.c-=IT[f.k][2]*2;else add(f.k,-1);a.fed=Math.max(now,a.fed)+FOOD[f.k]*1000;S.xp+=1}
function hpFind(h,now){const P=HP[h.k];if(P.z==='f')return fFind(h,now);S.rn.forEach(a=>rupd(a,now));
 if(P.job==='harvest'){const l=S.rn.filter(a=>a.rd>0);if(!l.length)return null;if(tot()>=cap()){hWarn(h,'Kho đầy! Hãy bán bớt hoặc nâng cấp kho');return null}return l.sort((p,q)=>q.rd-p.rd)[0]}
 const need=S.rn.filter(a=>a.fed-now<120000);if(!need.length)return null;const f=hFood(h);if(!f){hWarn(h,'Hết thức ăn cho thú!');return null}
 return need.filter(a=>a.fed-now<=(SATR-FOOD[f.k])*1000).sort((p,q)=>p.fed-q.fed)[0]||null}
function hpAct(h,now){if(HP[h.k].z==='f'){fAct(h,now);return}const P=HP[h.k],r=hrt(h.k),a=S.rn.find(z=>z.id===r.tg);r.tg=null;if(!a)return;rupd(a,now);const el=re[a.id]||hpe[h.k];
 if(P.job==='harvest'){if(a.rd<1)return;if(tot()>=cap()){hWarn(h,'Kho đầy! Hãy bán bớt hoặc nâng cấp kho');return}const p=rvar(a).p;a.rd--;add(p,1);S.xp+=3;h.w++;hud();fl('+1 '+IT[p][0],el)}
 else{const f=hFood(h);if(!f)return;if(a.fed-now>(SATR-FOOD[f.k])*1000)return;hFeed(a,f,now);h.w++;hud();fl('-1 '+IT[f.k][0]+' 😋',el)}}
function hpGo(h,x,y){const el=hpe[h.k],r=hrt(h.k),P=HP[h.k];x=Math.min(88,Math.max(10,x));y=Math.min(86,Math.max(P.z==='f'?20:46,y));
 el.children[1].firstChild.style.transform=((x>r.x)!==(P.face==='R'))?'scaleX(-1)':'';
 r.x=x;r.y=y;el.style.left=x+'%';el.style.top=y+'%';el.style.zIndex=Math.round(y*10);
 el.classList.add('run');clearTimeout(r.rt);r.rt=setTimeout(()=>el.classList.remove('run'),1800)}
function hpMk(h){const P=HP[h.k],r=hrt(h.k),d=document.createElement('div');d.className='an hp'+(P.z==='f'?' hpf':'');d.innerHTML='<div class="pill"></div><span class="hw"><img alt=""></span>';
 d.children[1].firstChild.src=HAV[P.av];r.x=20+Math.random()*60;r.y=55+Math.random()*25;
 d.style.left=r.x+'%';d.style.top=r.y+'%';d.style.width=P.z==='f'?'7%':'8%';d.style.zIndex=Math.round(r.y*10);d.onclick=()=>openHelper(h.k);$(P.z==='f'?'s1':'s3').appendChild(d);hpe[h.k]=d;return d}
function hpTick(){const now=Date.now();
 Object.keys(hpe).forEach(k=>{if(!hget(k)){hpe[k].remove();delete hpe[k];delete hr[k]}});
 S.hp.forEach(h=>{const P=HP[h.k],el=hpe[h.k]||hpMk(h),r=hrt(h.k),lab=P.ic+' Lv'+h.lv+(r.st?' 🏃':'');if(el.firstChild.textContent!==lab)el.firstChild.textContent=lab;
  if(r.st===1){if(now>=r.arr){hpAct(h,now);r.st=0;r.nx=now+hInt(h)}return}
  if(now<r.nx)return;
  const a=hpFind(h,now);
  if(a){r.tg=a.id;r.st=1;r.arr=now+1800;hpGo(h,a.x+(P.face==='R'?-4:4),a.y+1)}
  else{r.nx=now+2500;if(Math.random()<.6)hpGo(h,20+Math.random()*65,(P.z==='f'?25:52)+Math.random()*(P.z==='f'?55:30))}})}
function hnow(k){const h=hget(k);if(!h)return;const P=HP[k],now=Date.now();if(P.z==='f'){const w0=h.w;for(let i=0;i<S.p.length;i++){hrt(k).tg=i;fAct(h,now)}toast(h.w>w0?'Đã làm '+(h.w-w0)+' việc 🌱':'Chưa có việc để làm');hud();return}let n=0;S.rn.forEach(a=>rupd(a,now));
 if(P.job==='harvest'){for(const a of S.rn){while(a.rd>0&&tot()<cap()){const p=rvar(a).p;a.rd--;add(p,1);S.xp+=3;n++}}
  toast(n?'Đã thu '+n+' sản phẩm 🎒':(tot()>=cap()?'Kho đầy!':'Chưa có sản phẩm để thu'))}
 else{for(const a of S.rn){const f=hFood(h);if(!f)break;if(a.fed-now>=120000||a.fed-now>(SATR-FOOD[f.k])*1000)continue;hFeed(a,f,now);n++}
  toast(n?'Đã cho '+n+' con ăn 🪣':'Thú chưa cần ăn')}
 h.w+=n;hud()}
function hire(k){const P=HP[k];if(hget(k)){toast('Đã thuê rồi');return false}
 if(S.c<P.cost[0]){toast('Cần 🪙'+P.cost[0]);return false}if(inv('gem')<P.cost[1]){toast('Cần 💎'+P.cost[1]);return false}
 S.c-=P.cost[0];add('gem',-P.cost[1]);S.hp.push({k,lv:1,w:0,auto:1});toast('Đã thuê '+P.n+'! Làm việc tự động 🎉');return true}
function hupg(k){const h=hget(k);if(!h||h.lv>=HMAX)return false;const u=hUp(h);
 if(S.c<u[0]){toast('Cần 🪙'+u[0]);return false}if(inv('gem')<u[1]){toast('Cần 💎'+u[1]);return false}
 S.c-=u[0];add('gem',-u[1]);h.lv++;toast(HP[k].n+' lên cấp '+h.lv+'! ⚡');return true}
function staffHtml(){let h='<div style="font-size:12px;color:var(--mu)">Thuê nhân viên tự động chăm sóc và thu hoạch thú nuôi trong chuồng.</div>';
 Object.keys(HP).forEach(k=>{const P=HP[k],x=hget(k),u=x&&hUp(x);
  h+=row('<img src="'+HAV[P.av]+'" alt="" style="height:44px;width:32px;object-fit:contain;display:block">',P.n+(x?' · Cấp '+x.lv:''),P.role+' · '+(x?'đã làm '+x.w+' lần':'🪙'+P.cost[0]+' 💎'+P.cost[1]),x?(x.lv<HMAX?sb('hup',k,0,'⬆️ 🪙'+u[0]+' 💎'+u[1],1):'<small>Tối đa</small>'):sb('hire',k,0,'Thuê',1))});
 return h}
function openHelper(k){dOpen=false;const P=HP[k],h=hget(k);
 let t='<h2>'+P.ic+' '+P.n+'</h2><div style="text-align:center"><img src="'+HAV[P.av]+'" alt="" style="height:130px"></div><div style="text-align:center;font-weight:800;margin:4px 0">'+P.role+'</div><div style="font-size:13px;color:var(--mu);margin-bottom:8px">'+P.d+'</div>';
 if(!h)t+='<div class="row"><span class="sp"></span><button class="btn g" id="h1">Thuê · 🪙'+P.cost[0]+' 💎'+P.cost[1]+'</button></div>';
 else{const u=hUp(h);t+='<div class="it"><span class="n">⭐ Cấp '+h.lv+'/'+HMAX+' · mỗi '+(hInt(h)/1000).toFixed(1)+'s làm 1 lần<br><small style="color:var(--mu)">Đã làm: '+h.w+' lần</small></span></div><div class="row">'+(h.lv<HMAX?'<button class="btn g" id="h2">⬆️ Nâng cấp · 🪙'+u[0]+' 💎'+u[1]+'</button>':'<span>Cấp tối đa</span>')+'<span class="sp"></span><button class="btn" id="h3">⚡ '+(P.z==='f'?'Làm ngay tất cả ô':P.job==='care'?'Cho ăn tất cả':'Thu hoạch tất cả')+'</button></div>';
  if(P.job==='care'&&!P.z)t+='<div class="row"><span style="font-size:13px">Tự mua thức ăn khi hết kho</span><span class="sp"></span><button class="btn" id="h4">'+(h.auto!==0?'BẬT':'tắt')+'</button></div>'}
 t+='<div style="text-align:right;margin-top:10px"><button class="btn" id="hz">Đóng</button></div>';$('md').innerHTML=t;$('ov').classList.add('on');
 const on=(id,fn)=>{const b=$(id);if(b)b.onclick=fn};
 on('hz',closeM);on('h1',()=>{if(hire(k)){hud();openHelper(k)}});on('h2',()=>{if(hupg(k)){hud();openHelper(k)}});
 on('h3',()=>{hnow(k);openHelper(k)});on('h4',()=>{h.auto=h.auto===0?1:0;hud();openHelper(k)})}
{const _rb=rbar;rbar=()=>{_rb();const B=$('rb');if(!B)return;const ref=B.children[5]||null;
 Object.keys(HP).filter(k=>!HP[k].z).forEach(k=>{const P=HP[k],h=hget(k),d=document.createElement('div');d.className='seed'+(h?' on':'');
  d.innerHTML='<b><img src="'+HAV[P.av]+'" alt=""></b>'+P.s+'<br>'+P.role+'<br>'+(h?'✔ Cấp '+h.lv:'🪙'+P.cost[0]+' 💎'+P.cost[1]);
  d.onclick=()=>openHelper(k);B.insertBefore(d,ref)})}}
{const _h4=hud;hud=()=>{_h4();$('gm').textContent=Math.floor(inv('gem'))}}
{const _rt=rtick;rtick=()=>{_rt();hpTick()}}

/* ===== NÔNG TRẠI: 3 nông dân + bắt sâu / tưới nước / bón phân ===== */
const HAV=[...AVS,'img/helper-3.webp','img/helper-4.webp','img/helper-5.webp'];
Object.assign(HP,{
 f1:{n:'Bé cà rốt',s:'Bé cà rốt',role:'Trồng cây',ic:'🥕',av:2,face:'R',job:'plant',z:'f',cost:[400,2],d:'Tự động gieo hạt đang chọn vào các ô đất trống (trả tiền hạt giống).'},
 f2:{n:'Chú nông dân',s:'Chú nông dân',role:'Thu hoạch',ic:'⛏️',av:3,face:'R',job:'reap',z:'f',cost:[600,4],d:'Tự động thu hoạch những ô cây đã chín vào nhà kho.'},
 f3:{n:'Cô bé giỏ rau',s:'Bé giỏ rau',role:'Chăm sóc',ic:'🧺',av:4,face:'R',job:'care',z:'f',cost:[700,5],d:'Tự động bắt sâu, tưới nước và bón phân (🪙15/ô) cho cây đang lớn.'}});
let fertOn=false;
function fFind(h,now){const P=HP[h.k],g=f=>S.p.findIndex(p=>p.u&&f(p));let i=-1;
 if(P.job==='plant'){const c=cr(S.seed);if(lvl()>=c.lv&&S.c>=c.cost)i=g(p=>!p.c)}
 else if(P.job==='reap'){i=g(p=>p.c&&now>=p.e);if(i>=0&&tot()>=cap()){hWarn(h,'Kho đầy!');return null}}
 else{i=g(p=>p.c&&now<p.e&&p.pt);if(i<0&&S.c>=15)i=g(p=>p.c&&now<p.e&&!p.f);if(i<0)i=g(p=>p.c&&now<p.e&&now-p.w>=15000)}
 return i<0?null:{id:i,x:PL[i][0],y:PL[i][1]}}
function fAct(h,now){const r=hrt(h.k),i=+r.tg,p=S.p[i],P=HP[h.k],el=pe[i];r.tg=null;if(!p||!p.u)return;
 if(P.job==='plant'){if(p.c)return;const c=cr(S.seed);if(lvl()<c.lv||S.c<c.cost)return;S.c-=c.cost;p.c=c.id;p.s=now;p.e=now+c.t*1000;p.w=0;p.f=0;p.pt=0;fl('-'+c.cost,el)}
 else if(P.job==='reap'){if(!p.c||now<p.e||tot()>=cap())return;const c=cr(p.c);add(c.id,1);S.xp+=c.xp;p.c=null;p.f=0;p.pt=0;fl('+1 '+c.e,el)}
 else{if(!p.c)return;if(p.pt){p.pt=0;S.c+=2;S.xp+=1;fl('🐛 +🪙2',el)}
  else if(now>=p.e)return;else if(!p.f&&S.c>=15){S.c-=15;p.f=1;p.e-=(p.e-now)*.4;fl('🧪 -40%',el)}
  else if(now-p.w>=15000){p.w=now;p.e-=(p.e-p.s)*.2;fl('💧 -20%',el)}else return}
 h.w++;hud()}
{const _cp=clickPlot;clickPlot=(i,el)=>{const p=S.p[i],now=Date.now();if(!p.c){p.f=0;p.pt=0}
 if(p.u&&p.c&&p.pt){p.pt=0;S.xp+=1;S.c+=2;hud();fl('🐛 +🪙2',el);return}
 if(fertOn&&p.u&&p.c&&now<p.e){if(p.f){toast('Ô này đã bón phân rồi 🧪');return}if(S.c<15){toast('Cần 🪙15 để bón phân');return}S.c-=15;p.f=1;p.e-=(p.e-now)*.4;hud();fl('🧪 -40%',el);return}
 _cp(i,el);if(!S.p[i].c){S.p[i].f=0;S.p[i].pt=0}}}
{const _t2=tick;tick=()=>{_t2();const now=Date.now();S.p.forEach((p,i)=>{if(!p.u||!p.c||now>=p.e){p.pt=0;return}
 if(!p.pt&&Math.random()<.006){p.pt=1;toast('🐛 Có sâu trên ô đất! Chạm để bắt')}
 if(p.pt){p.e+=500;pe[i].children[0].innerHTML='🐛<small>Bắt sâu!</small>'}})}}
{const _su=seedsUI;seedsUI=()=>{_su();const B=$('sd');if(!B)return;
 const f=document.createElement('div');f.className='seed'+(fertOn?' on':'');f.innerHTML='<b>🧪</b>Bón phân<br>🪙15/ô<br>'+(fertOn?'BẬT':'tắt');
 f.onclick=()=>{fertOn=!fertOn;toast(fertOn?'Chạm ô đang lớn để bón phân (-40% thời gian)':'Đã tắt bón phân');seedsUI()};B.appendChild(f);
 Object.keys(HP).filter(k=>HP[k].z).forEach(k=>{const P=HP[k],h=hget(k),d=document.createElement('div');d.className='seed'+(h?' on':'');
  d.innerHTML='<b><img src="'+HAV[P.av]+'" alt=""></b>'+P.s+'<br>'+P.role+'<br>'+(h?'✔ Cấp '+h.lv:'🪙'+P.cost[0]+' 💎'+P.cost[1]);d.onclick=()=>openHelper(k);B.appendChild(d)})}}


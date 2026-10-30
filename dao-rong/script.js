const EL={fire:{n:'Lửa',c:'#ef5b2b',d:'#b8341a',l:'#ffd9a8',e:'🔥'},leaf:{n:'Mộc',c:'#46c15f',d:'#2a8a40',l:'#e0f7c8',e:'🍃'},water:{n:'Nước',c:'#3aa0ff',d:'#1f6fc4',l:'#cdeaff',e:'💧'},ice:{n:'Băng',c:'#8fd3f4',d:'#4a9bd1',l:'#e8f7ff',e:'❄️'},lightning:{n:'Sấm',c:'#f6c90e',d:'#c98a0a',l:'#fff3b0',e:'⚡'},dark:{n:'Bóng Tối',c:'#6b3fa0',d:'#3a2060',l:'#d9c6f0',e:'🌑'},rainbow:{n:'Cầu Vồng',c:'#f49ac1',d:'#c46a9a',l:'#ffe3f1',e:'🌈'}};
const IMG={ice:'assets/ice.webp',fire:'assets/fire.webp',leaf:'assets/leaf.webp',rainbow:'assets/rainbow.webp',dark:'assets/dark.webp',lightning:'assets/lightning.webp',water:'assets/water.webp'};const KEY='rong_con_v1',$=id=>document.getElementById(id),cp=v=>Math.max(0,Math.min(100,v));
const fresh=()=>({el:null,taps:0,hatched:false,xp:0,coins:20,wins:0,stg:0,gem:{},st:{hp:0,atk:0,def:0,mp:0},inv:[],eq:{},h:80,f:80,cl:80,en:80,t:Date.now()});
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&typeof s==='object')return Object.assign(fresh(),s)}catch(e){}return fresh()}
let S=load(),key='',sleepUntil=0,armed=false;
if(S.stg===undefined)S.stg=S.hatched?(S.xp<30?0:S.xp<100?1:2):0;
function save(){S.t=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function decay(n){S.h=cp(S.h-n);S.f=cp(S.f-n);S.cl=cp(S.cl-.7*n);S.en=cp(S.en-.6*n)}
decay(Math.min(120,Math.floor((Date.now()-S.t)/5000)));
const STG=['baby','teen','adult'],stage=()=>!S.el?'pick':!S.hatched?'egg':STG[S.stg||0];
const avg=()=>(S.h+S.f+S.cl+S.en)/4;
const mood=()=>Date.now()<sleepUntil?3:avg()>60?0:avg()>30?1:2;
const MOOD=['Vui vẻ 😄','Bình thường 🙂','Buồn bã 😢','Đang ngủ 😴'];
const SN={baby:'Rồng Con',teen:'Rồng Thiếu Niên',adult:'Rồng Trưởng Thành'};
function toast(m){const t=$('ts');t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2200)}
function pop(e){const p=document.createElement('span');p.className='pop';p.textContent=e;p.style.left=(30+Math.random()*40)+'%';p.style.top='55%';$('st').appendChild(p);setTimeout(()=>p.remove(),1200)}
function eggSvg(){const x=S.taps,c=EL[S.el];
 return `<svg viewBox="0 0 200 220" onclick="tap()"><ellipse cx="100" cy="125" rx="62" ry="80" fill="${c.l}" stroke="${c.c}" stroke-width="5"/><circle cx="75" cy="100" r="11" fill="${c.c}"/><circle cx="125" cy="140" r="14" fill="${c.c}"/><circle cx="110" cy="85" r="7" fill="${c.d}"/>${x>=2?`<path d="M80 60 l12 14 l-10 8" stroke="#5a3a2a" stroke-width="4" fill="none"/>`:''}${x>=5?`<path d="M130 70 l-12 16 l12 8 l-8 14" stroke="#5a3a2a" stroke-width="4" fill="none"/>`:''}${x>=7?`<path d="M60 150 l16 -8 l8 14" stroke="#5a3a2a" stroke-width="4" fill="none"/>`:''}</svg>`}
function dragonSvg(e,sg,mo,pl){const st=sg||stage(),m=mo!==undefined?mo:mood(),k=e||S.el,w=st==='baby'?62:st==='teen'?80:100,f=m===2?'saturate(.55)':m===3?'brightness(.82)':'none';
 return `<div class="dg" ${e?'':'onclick="pet()"'} style="width:${w}%;filter:${f}"><img src="${IMG[k]}" alt="">${!e||pl?gear():''}${m===3?'<span class="zz">💤</span>':''}</div>`}
function bar(l,v,col){return `<div class="b">${l} ${Math.round(v)}%<div class="t"><i style="width:${v}%;background:${col}"></i></div></div>`}
function render(force){if(B)return rb();
 const st=stage(),k=st+S.el+mood()+S.taps;
 if(force||k!==key){key=k;let h='';
  if(st==='pick')h=`<div class="nm">Chọn một quả trứng rồng</div><div class="sub">Mỗi nguyên tố có màu sắc riêng</div><div class="pick">${Object.keys(EL).map(e=>`<button onclick="choose('${e}')"><img src="${IMG[e]}" style="width:100%;max-width:64px;height:64px;object-fit:contain"><br>${EL[e].e} ${EL[e].n}</button>`).join('')}</div>`;
  else if(st==='egg')h=eggSvg()+`<div class="nm">Trứng ${EL[S.el].n}</div><div class="sub">Chạm vào trứng để ấp nở (${S.taps}/8)</div>`;
  else h=dragonSvg()+`<div class="nm">${EL[S.el].e} ${SN[st]} ${EL[S.el].n}</div><div class="sub">${MOOD[mood()]} · chạm vào rồng để vuốt ve</div>`;
  $('st').innerHTML=h;
  $('bx').innerHTML=st==='baby'||st==='teen'||st==='adult'?`<div class="bars" id="br"></div><div class="acts"><button onclick="act('feed')"><span>🍖</span>Cho ăn<br>-5🪙</button><button onclick="act('play')"><span>🎾</span>Chơi</button><button onclick="act('wash')"><span>🛁</span>Tắm</button><button onclick="act('sleep')"><span>🌙</span>Ngủ</button></div><div class="acts" style="grid-template-columns:1fr 1fr"><button id="pb" onclick="po()" style="padding:12px"></button><button id="gb" onclick="ev()" style="padding:12px"></button></div><button style="width:100%;margin-top:8px;padding:12px" onclick="eo()">🎒 Trang bị</button><button style="width:100%;margin-top:8px;padding:12px" onclick="arena()">⚔️ Đấu trường</button>`:'';
 }
 if($('gb')){$('gb').textContent=gtxt();$('pb').textContent=ptxt()}
 if($('br'))$('br').innerHTML=bar('🍖 No bụng',S.h,'#f08c00')+bar('🎾 Vui vẻ',S.f,'#e64980')+bar('🛁 Sạch sẽ',S.cl,'#1c7ed6')+bar('⚡ Năng lượng',S.en,'#37b24d');
 $('co').textContent='🪙 '+S.coins;
 $('lv').textContent=st==='pick'||st==='egg'?'Trứng rồng':'Cấp '+lvl()+' · '+S.xp+' XP · 🏆'+(S.wins||0);
}
function choose(e){S.el=e;S.taps=0;save();render()}
function tap(){S.taps++;const s=$('st').querySelector('svg');s.classList.add('wob');setTimeout(()=>s.classList.remove('wob'),350);
 if(S.taps>=8){S.hatched=true;S.xp=0;toast('Trứng đã nở! Chào Rồng Con 🐉')}save();render(S.hatched)}
function pet(){S.f=cp(S.f+2);S.coins++;pop('❤️');save();render()}
function gain(n){const b=lvl();S.xp+=n;if(lvl()>b){toast('Lên cấp '+lvl()+'! +1 điểm 🎯');render(true)}}
function act(a){
 if(a==='feed'){if(S.coins<5)return toast('Không đủ xu 🪙 — hãy vuốt ve rồng để kiếm xu');S.coins-=5;S.h=cp(S.h+30);gain(3);pop('🍖')}
 if(a==='play'){if(S.en<15)return toast('Rồng mệt rồi, cho ngủ đi 🌙');S.f=cp(S.f+25);S.en=cp(S.en-15);S.coins+=3;gain(4);pop('🎾')}
 if(a==='wash'){S.cl=cp(S.cl+35);gain(2);pop('🫧')}
 if(a==='sleep'){S.en=cp(S.en+40);S.h=cp(S.h-5);gain(1);sleepUntil=Date.now()+2500;pop('💤');setTimeout(()=>render(),2600)}
 save();render(true)}
function reset(){const b=$('rs');if(!armed){armed=true;b.textContent='Chạm lần nữa để xác nhận xoá dữ liệu';setTimeout(()=>{armed=false;b.textContent='Chơi lại từ đầu'},3000);return}
 armed=false;S=fresh();save();b.textContent='Chơi lại từ đầu';render(true)}
const IT={h1:{s:'hat',n:'Mũ Cỏ',e:'👒',p:30,v:15},h2:{s:'hat',n:'Vương Miện',e:'👑',p:100,v:40},a1:{s:'armor',n:'Áo Da',e:'🧥',p:40,v:10},a2:{s:'armor',n:'Giáp Vàng',e:'🛡️',p:120,v:25},w1:{s:'weapon',n:'Gậy Gỗ',e:'🪵',p:35,v:3},w2:{s:'weapon',n:'Kiếm Thép',e:'🗡️',p:110,v:8}};
const SL={hat:'Mũ',armor:'Giáp',weapon:'Vũ khí'};
const bn=s=>S.eq&&S.eq[s]?IT[S.eq[s]].v:0;
function gear(){const q=S.eq||{},g=(id,l,t,z)=>`<span class="gr" style="left:${l}%;top:${t}%;font-size:${z}em">${IT[id].e}</span>`;let h='';
 if(q.hat)h+=g(q.hat,50,-8,2.2);if(q.armor)h+=g(q.armor,50,60,1.8);if(q.weapon)h+=g(q.weapon,14,66,2.2);
 return h}
function eqp(){const q=S.eq||(S.eq={}),inv=S.inv||(S.inv=[]);
 let h=`<div class="sl">${Object.keys(SL).map(s=>`<div><span>${q[s]?IT[q[s]].e:'➕'}</span>${SL[s]}</div>`).join('')}</div><div class="sub" style="margin:8px 0">🪙 ${S.coins}</div>`;
 for(const id in IT){const t=IT[id],own=inv.includes(id),on=q[t.s]===id,d=t.s==='armor'?'giảm '+t.v+'% sát thương':t.s==='hat'?'+'+t.v+' máu':'+'+t.v+' sức đánh';
  h+=`<div class="it"><span style="font-size:26px">${t.e}</span><b>${t.n}<br><small style="font-weight:400;color:var(--mut)">${SL[t.s]}: ${d}</small></b><button onclick="ie('${id}')">${on?'Tháo':own?'Trang bị':'Mua '+t.p+'🪙'}</button></div>`}
 h+=`<button style="width:100%;margin-top:12px;padding:12px" onclick="ec()">Đóng</button>`;
 $('pi').innerHTML=h}
function eo(){eqp();$('pn').style.display='flex'}
function ec(){$('pn').style.display='none';render(true)}
function ie(id){const t=IT[id],q=S.eq||(S.eq={}),inv=S.inv||(S.inv=[]);
 if(q[t.s]===id)q[t.s]=null;
 else if(inv.includes(id))q[t.s]=id;
 else if(S.coins>=t.p){S.coins-=t.p;inv.push(id);q[t.s]=id;toast('Đã mua '+t.n+' '+t.e)}
 else return toast('Không đủ xu 🪙');
 save();eqp();render(true)}
const NEED=[5,12],lvl=()=>Math.floor(S.xp/20)+1,sp=k=>(S.st&&S.st[k])||0;
const pts=()=>lvl()-1-Object.values(S.st||{}).reduce((a,b)=>a+b,0),gc=()=>(S.gem&&S.gem[S.el])||0;
const gtxt=()=>(S.stg||0)>=2?'💎 Tối đa':'💎 '+gc()+'/'+NEED[S.stg||0]+' Ngọc '+EL[S.el].n,ptxt=()=>'🎯 Cộng điểm'+(pts()>0?' ('+pts()+')':'');
function ev(){const g=S.stg||0;if(g>=2)return toast('Rồng đã tiến hoá tối đa 🌟');
 if(gc()<NEED[g])return toast('Cần '+NEED[g]+' Ngọc '+EL[S.el].n+' — thắng trận Đấu trường để nhận 💎');
 S.gem[S.el]-=NEED[g];S.stg=g+1;save();toast('Tiến hoá thành '+SN[STG[S.stg]]+'! ✨');render(true);pop('✨');pop('🌟')}
function po(){const s=S.st||(S.st={hp:0,atk:0,def:0,mp:0}),R=[['hp','❤️ Máu','+10 máu mỗi điểm'],['atk','⚔️ Sức đánh','+2 sức đánh mỗi điểm'],['def','🛡️ Phòng thủ','giảm thêm 2% sát thương mỗi điểm'],['mp','⚡ Mana','+8 mana khởi đầu mỗi điểm']];
 let h=`<div class="nm">Cộng điểm chiến đấu</div><div class="sub" style="margin:4px 0 8px">Điểm còn lại: ${pts()} · mỗi cấp được 1 điểm</div>`;
 R.forEach(r=>h+=`<div class="it"><b>${r[1]}: ${s[r[0]]||0}<br><small style="font-weight:400;color:var(--mut)">${r[2]}</small></b><button onclick="ap('${r[0]}')">+1</button></div>`);
 h+=`<button style="width:100%;margin-top:12px;padding:12px" onclick="ec()">Đóng</button>`;$('pi').innerHTML=h;$('pn').style.display='flex'}
function ap(k){if(pts()<1)return toast('Hết điểm, hãy lên cấp 🎯');S.st=S.st||{};S.st[k]=(S.st[k]||0)+1;save();po();render(true)}
let B=null,busy=false;
const RING=['fire','leaf','water','ice','lightning','dark','rainbow'],ORD={};RING.forEach((k,i)=>ORD[k]=RING[(i+1)%7]);
const mul=(a,d)=>ORD[a]===d?1.5:ORD[d]===a?.67:1;
function arena(){if(S.en<10)return toast('Rồng quá mệt, hãy cho ngủ trước 🌙');
 const lv=Math.floor(S.xp/20)+1,g=.7+avg()/100*.6,w=S.wins||0,boss=w%5===4,ks=Object.keys(EL),e=ks[Math.floor(Math.random()*ks.length)],hp=60+lv*10+bn('hat')+sp('hp')*10+(S.stg||0)*20,eh=Math.round((50+w*15)*(boss?1.8:1));
 B={p:{hp:hp,max:hp,atk:(8+lv*2)*g+bn('weapon')+sp('atk')*2+(S.stg||0)*4,mp:40+sp('mp')*8,def:false},e:{el:e,hp:eh,max:eh,atk:(7+w*2)*(boss?1.3:1),boss:boss},log:boss?'👑 Boss xuất hiện!':'Trận đấu bắt đầu!',over:false};rb()}
function hb(n,h,m){return `<div class="b">${n} ${Math.max(0,Math.round(h))}/${m}<div class="t"><i style="width:${Math.max(0,h)/m*100}%;background:#e03131"></i></div></div>`}
function rb(a,d){const w=S.wins||0,e=B.e,sg=e.boss||w>=7?'adult':w>=3?'teen':'baby';
 $('st').innerHTML=`<div class="bt"><div>${hb((e.boss?'👑 Boss ':'Rồng hoang ')+EL[e.el].n,e.hp,e.max)}<div class="${a==='p'?'hit':a==='e'?'lr':''}"><div style="transform:scaleX(-1)">${dragonSvg(e.el,sg,1)}</div></div></div><div>${hb('Rồng bạn',B.p.hp,B.p.max)}<div class="${a==='p'?'ll':a==='e'?'hit':''}">${dragonSvg(S.el,stage(),0,1)}</div></div></div><div class="sub" style="margin-top:6px;min-height:42px">${B.log}</div>`;
 $('bx').innerHTML=B.over?`<button style="width:100%;padding:12px" onclick="leave()">Quay về chuồng 🏠</button>`:`<div class="sub" style="text-align:center">⚡ Mana ${B.p.mp}/100 · Khắc hệ (vòng): 🔥>🍃>💧>❄️>⚡>🌑>🌈>🔥</div><div class="acts" style="grid-template-columns:repeat(3,1fr)"><button onclick="mv(0)"><span>⚔️</span>Đánh<br>+10 mana</button><button onclick="mv(1)"><span>${EL[S.el].e}</span>Chiêu<br>-25 mana</button><button onclick="mv(2)"><span>🛡️</span>Thủ<br>+hồi máu</button></div><button style="width:100%;margin-top:8px;padding:10px" onclick="tg()">🤖 Tự động đánh: ${B.auto?'BẬT':'TẮT'}</button>`;
 $('co').textContent='🪙 '+S.coins;$('lv').textContent='⚔️ Đấu trường · 🏆'+(S.wins||0);if(a&&d)dm((a==='d'?'+':'-')+d,a==='p'?'e':'p',a==='d'?'#37b24d':'#e03131')}
function mv(i){if(busy||B.over)return;const p=B.p,e=B.e;let l='',dd=0;
 if(i===1&&p.mp<25)return toast('Không đủ mana ⚡');
 p.def=false;
 if(i===0){const d=Math.round(p.atk*(.9+Math.random()*.2));e.hp-=d;dd=d;p.mp=Math.min(100,p.mp+10);l=`Bạn đánh thường: -${d} máu.`}
 if(i===1){p.mp-=25;const m=mul(S.el,e.el),d=Math.round(p.atk*1.8*m);e.hp-=d;dd=d;l=`Chiêu ${EL[S.el].n}: -${d} máu${m>1?' (khắc hệ! 💥)':m<1?' (bị kháng)':''}.`}
 if(i===2){p.def=true;p.mp=Math.min(100,p.mp+15);const h=Math.round(p.max*.08);p.hp=Math.min(p.max,p.hp+h);dd=h;l=`Bạn phòng thủ, hồi ${h} máu.`}
 if(e.hp<=0)return end(true,l,'p',dd);
 busy=true;B.log=l;rb(i===2?'d':'p',dd);
 setTimeout(()=>{const st=Math.random()<.25,m=st?mul(e.el,S.el):1;let d=Math.round(e.atk*(st?1.5:1)*m*(.9+Math.random()*.2));if(p.def)d=Math.round(d/2);d=Math.round(d*(1-Math.min(60,bn('armor')+sp('def')*2)/100));p.hp-=d;B.log=l+` Địch ${st?'tung chiêu mạnh':'tấn công'}: -${d} máu.`;busy=false;if(p.hp<=0)return end(false,B.log,'e',d);rb('e',d);if(B.auto)setTimeout(au,800)},700)}
function end(win,l,a,d){B.over=true;busy=false;
 if(win){const w=S.wins||0,c=10+w*3,x=B.e.boss?20:8;S.wins=w+1;S.coins+=c;const gm=B.e.boss?3:1;S.gem=S.gem||{};S.gem[S.el]=(S.gem[S.el]||0)+gm;B.log=l+` 🎉 Thắng! +${c}🪙 +${x} XP +${gm}💎`+(B.e.boss?' (hạ boss!)':'');gain(x)}
 else{S.en=cp(S.en-10);B.log=l+' 💀 Bạn thua, rồng mất chút năng lượng.'}
 save();rb(a,d)}
function leave(){B=null;render(true)}
function dm(t,s,c){const x=document.createElement('span');x.className='dm';x.textContent=t;x.style.cssText='left:'+(s==='e'?'22%':'70%')+';top:38%;color:'+c;$('st').appendChild(x);setTimeout(()=>x.remove(),1000)}
function tg(){B.auto=!B.auto;rb();if(B.auto)setTimeout(au,500)}
function au(){if(!B||B.over||!B.auto||busy)return;const p=B.p;mv(p.hp<p.max*.3&&Math.random()<.6?2:p.mp>=25?1:0)}
setInterval(()=>{if(S.hatched&&!B){decay(1);if(avg()>50)S.xp+=0;save();render()}},5000);
render(true);

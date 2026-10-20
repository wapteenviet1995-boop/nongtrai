/* ===== XÃ HỘI: đăng nhập, lưu đám mây, bạn bè, tặng quà, thăm nhà, chat (Firebase) ===== */
/* FB_CONFIG đã chuyển sang config.js */
let wasIn=false,pendReg=null;
function newAcc(){const r=pendReg||{};pendReg=null;S=fresh();S.nm=r.nm||'Nông dân';S.age=r.age||0;S.av=0;S.rx=0;S.wl=0;S.hp=[];S.fr=[];S.rn=[];S.rf='carrot';S.inv=S.inv||{};try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}prof();hud()}
const SOCX={}; /* tab mở rộng: SOCX.ten={label,body(),init(),leave(),badge(),local} */
let fb=null,usr=null,cloudT=0,msgs=[],stt='chat',giftTo='',gPoll=0,chatT=0,unCh=null;
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ldJs=u=>new Promise((r,j)=>{const e=document.createElement('script');e.src=u;e.onload=r;e.onerror=j;document.head.appendChild(e)});
const SIN='width:100%;padding:8px;border:2px solid var(--bd);border-radius:10px;background:var(--pn);color:var(--tx);font-size:14px;margin:3px 0';
const ERR={'auth/invalid-email':'Email không hợp lệ','auth/email-already-in-use':'Email đã được đăng ký','auth/weak-password':'Mật khẩu cần ít nhất 6 ký tự','auth/invalid-credential':'Sai email hoặc mật khẩu','auth/wrong-password':'Sai mật khẩu','auth/user-not-found':'Không có tài khoản này','auth/too-many-requests':'Thử quá nhiều lần, đợi chút nhé'};
async function fbInit(){if(fb||!FB_CONFIG)return !!fb;const b='https://www.gstatic.com/firebasejs/10.12.2/firebase-';
 try{for(const m of['app','auth','firestore'])await ldJs(b+m+'-compat.js');firebase.initializeApp(FB_CONFIG);fb={a:firebase.auth(),d:firebase.firestore()};fb.a.onAuthStateChanged(onAuth);return true}catch(e){toast('Không tải được Firebase');return false}}
async function onAuth(u){usr=u;clearInterval(gPoll);if(unCh){unCh();unCh=null}
  if(!u&&wasIn){wasIn=false;msgs=[];newAcc()}if(u)wasIn=true;
 if(u){await cloudLoad();unCh=fb.d.collection('chat').orderBy('t','desc').limit(40).onSnapshot(sn=>{msgs=sn.docs.map(d=>d.data()).reverse();renderChat()});getGifts();gPoll=setInterval(getGifts,25000);toast('Xin chào '+S.nm+'! ☁️')}
 if($('ov').classList.contains('on')&&$('sx'))openSoc()}
async function cloudLoad(){const sn=await fb.d.doc('users/'+usr.uid).get();
 if(sn.exists&&sn.data().save){try{const o=JSON.parse(sn.data().save);if(o&&o.p&&o.d){if(o.p.length!==PL.length)o.p=fresh().p;o.rn=o.rn||[];o.hp=o.hp||[];o.inv=o.inv||{};o.fr=o.fr||[];o.nm=o.nm||'Nông dân';o.av=o.av||0;o.rx=o.rx||0;o.wl=o.wl||0;o.rf=o.rf||'carrot';S=o;prof();hud()}}catch(e){}}
 else{newAcc();cloudSave(true)}}
async function cloudSave(f){if(!usr||!fb)return;const n=Date.now();if(!f&&n-cloudT<20000)return;cloudT=n;
 try{await fb.d.doc('users/'+usr.uid).set({name:S.nm,nl:S.nm.toLowerCase(),age:S.age||0,av:S.av,lv:lvl(),val:typeof gval==='function'?Math.floor(gval()):0,code:usr.uid.slice(0,6).toUpperCase(),save:JSON.stringify(S),
  farm:JSON.stringify({p:S.p.map(p=>({u:p.u,c:p.c,r:p.c&&n>=p.e?1:0})),rn:S.rn.map(a=>({s:a.sp,v:a.v}))}),t:n},{merge:true})}catch(e){}}
{const _s=save;save=()=>{_s();cloudSave()}}
async function getGifts(){if(!usr)return;try{const sn=await fb.d.collection('users/'+usr.uid+'/gifts').get();let t=[];
 for(const d of sn.docs){const g=d.data(),q=Math.min(999,Math.floor(g.qty)||0);if(q>0){if(g.item==='coin')S.c+=q;else if(IT[g.item])add(g.item,q);t.push(esc(g.fn)+' tặng '+q+' '+(g.item==='coin'?'🪙':IT[g.item]?IT[g.item][0]:''))}await d.ref.delete()}
 if(t.length){hud();cloudSave(true);toast('🎁 '+t.join(', '))}}catch(e){}}
async function sendGift(uid,item,q){q=Math.floor(q);if(!(q>=1&&q<=999))return toast('Số lượng từ 1 đến 999');
 if(item==='coin'?S.c<q:inv(item)<q)return toast('Bạn không đủ để tặng');
 try{await fb.d.collection('users/'+uid+'/gifts').add({from:usr.uid,fn:S.nm,item,qty:q,t:Date.now()});if(item==='coin')S.c-=q;else add(item,-q);hud();cloudSave(true);if(typeof achInc==='function')achInc('gs',1);toast('Đã gửi quà 🎁')}catch(e){toast('Gửi quà thất bại')}}
function pushFr(id,o){S.fr=S.fr||[];if(S.fr.some(f=>f.u===id))return toast('Đã là bạn rồi');S.fr.push({u:id,n:o.name,c:o.code||''});hud();cloudSave(true);toast('Đã thêm bạn '+o.name+' 🤝');openSoc('fr')}
async function addFriendById(id){try{const sn=await fb.d.doc('users/'+id).get();if(!sn.exists)return toast('Không tìm thấy');pushFr(id,sn.data())}catch(e){toast('Lỗi kết nối')}}
async function addFriend(v){v=(v||'').trim();if(!v)return;const up=v.toUpperCase();if(up===usr.uid.slice(0,6).toUpperCase())return toast('Đó là mã của bạn');
  try{let q=await fb.d.collection('users').where('code','==',up).limit(1).get();if(q.empty)q=await fb.d.collection('users').where('nl','==',v.toLowerCase()).limit(1).get();if(q.empty)return toast('Không tìm thấy mã hoặc tên này');const d=q.docs[0];if(d.id===usr.uid)return toast('Đó là bạn mà 😄');pushFr(d.id,d.data())}catch(e){toast('Lỗi kết nối')}}
async function loadPeople(){const box=$('ppl');if(!box)return;try{const sn=await fb.d.collection('users').orderBy('t','desc').limit(20).get();S.fr=S.fr||[];const l=sn.docs.filter(d=>d.id!==usr.uid&&!S.fr.some(f=>f.u===d.id)&&d.data().name);box.innerHTML=l.map(d=>{const o=d.data();return row('🧑',esc(o.name),'Cấp '+(o.lv||1),'<button class="btn g" data-af="'+d.id+'">+ Kết bạn</button>')}).join('')||'<small>Chưa có người chơi nào khác.</small>';box.querySelectorAll('[data-af]').forEach(b=>b.onclick=()=>addFriendById(b.dataset.af))}catch(e){box.innerHTML='<small>Không tải được danh sách.</small>'}}
async function visit(uid){try{const sn=await fb.d.doc('users/'+uid).get();if(!sn.exists)return toast('Không tìm thấy nhà bạn');const o=sn.data(),f=JSON.parse(o.farm||'{}');
 const cell=p=>!p.u?'🔒':!p.c?'🟫':p.r?(cr(p.c)?cr(p.c).e:'🌾'):'🌱';
 let h='<h2>🏡 Nhà của '+esc(o.name)+'</h2><div style="text-align:center;font-size:13px">Cấp '+(o.lv||1)+(o.age?' · '+o.age+' tuổi':'')+(o.val?' · 🏆 '+Math.floor(o.val).toLocaleString('vi-VN')+' giá trị vườn':'')+'</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:26px;text-align:center;background:rgba(120,180,90,.25);padding:10px;border-radius:12px;margin:8px 0">'+(f.p||[]).map(p=>'<div>'+cell(p)+'</div>').join('')+'</div>';
 const an=(f.rn||[]).map(a=>SP[a.s]?SP[a.s].n:'').filter(Boolean);
 h+='<div style="font-size:13px">🐾 Thú nuôi: '+(an.length?esc(an.join(', ')):'chưa có')+'</div><div class="row" style="margin-top:10px"><button class="btn g" id="vg">🎁 Tặng quà</button> <button class="btn" id="vm">✉️ Nhắn tin</button><span class="sp"></span><button class="btn" id="vb">⬅ Quay lại</button></div>';
 dOpen=false;$('md').innerHTML=h;$('md').className='md ui-'+(stt==='mk'?'market':stt==='ach'?'achievements':stt==='daily'?'daily':stt==='chat'?'community':stt==='dm'?'messages':stt==='acc'?(usr?'profile':'login'):'community');$('ov').classList.add('on');$('vg').onclick=()=>{giftTo=uid;openSoc('gift')};$('vm').onclick=()=>dmOpen(uid);$('vb').onclick=()=>openSoc('fr')}catch(e){toast('Không vào được nhà bạn')}}
function renderChat(){const l=$('chl');if(!l)return;l.innerHTML=msgs.map(m=>'<div style="margin:3px 0"><b>'+esc(m.n)+':</b> '+esc(m.text)+'</div>').join('')||'<small>Chưa có tin nhắn, hãy chào mọi người!</small>';l.scrollTop=l.scrollHeight}
async function sendChat(){const i=$('cin'),t=i.value.trim().slice(0,200);if(!t)return;if(Date.now()-chatT<2000)return toast('Nhắn chậm thôi nhé');chatT=Date.now();i.value='';
 try{await fb.d.collection('chat').add({uid:usr.uid,n:S.nm,text:t,t:Date.now()})}catch(e){toast('Gửi tin thất bại')}}
function socBody(){
  if(SOCX[stt])return SOCX[stt].body();
  if(stt==='mk')return '<div class="row"><button class="btn'+(mkv==='buy'?' g':'')+'" data-mv="buy">🛍️ Mua</button><button class="btn'+(mkv==='sell'?' g':'')+'" data-mv="sell">🏷️ Đăng bán</button><button class="btn'+(mkv==='my'?' g':'')+'" data-mv="my">📦 Của tôi</button></div><div id="mkb"><small>Đang tải...</small></div>';
 if(stt==='chat')return '<div id="chl" style="height:210px;overflow:auto;font-size:13px;background:rgba(0,0,0,.05);padding:6px;border-radius:10px"></div><div class="row"><input id="cin" maxlength="200" placeholder="Nhập tin nhắn..." style="flex:1;'+SIN+'"><button class="btn g" id="csd">Gửi</button></div>';
 if(stt==='fr'){S.fr=S.fr||[];return '<div style="font-size:13px">Mã của bạn: <b>'+usr.uid.slice(0,6).toUpperCase()+'</b> <button class="btn" id="cpc">📋 Chép</button><br><small>Gửi mã này cho bạn, hoặc nhập mã/tên của bạn ở ô dưới.</small></div><div class="row"><input id="fcd" maxlength="16" placeholder="Nhập mã hoặc tên bạn" style="flex:1;'+SIN+'"><button class="btn g" id="fad">Thêm</button></div>'+(S.fr.map((f,i)=>row('🧑',esc(f.n),'Mã '+f.c,'<button class="btn" data-v="'+f.u+'">Thăm</button> <button class="btn g" data-g="'+f.u+'">🎁</button> <button class="btn" data-dm="'+f.u+'">✉️</button>')).join('')||'<small>Chưa có bạn bè.</small>')+'<h3 style="margin:12px 0 4px;font-size:14px">🌟 Người chơi gần đây</h3><div id="ppl"><small>Đang tải...</small></div>'}
 if(stt==='gift'){S.fr=S.fr||[];if(!S.fr.length)return '<small>Hãy thêm bạn bè ở tab 🤝 Bạn trước.</small>';
  const its=Object.keys(S.inv).filter(k=>inv(k)>0&&IT[k]);return '<div style="font-size:13px">Tặng cho:</div><select id="gto" style="'+SIN+'">'+S.fr.map(f=>'<option value="'+f.u+'"'+(f.u===giftTo?' selected':'')+'>'+esc(f.n)+'</option>').join('')+'</select><select id="git" style="'+SIN+'"><option value="coin">🪙 Xu (bạn có '+S.c+')</option>'+its.map(k=>'<option value="'+k+'">'+IT[k][0]+' '+IT[k][1]+' (có '+inv(k)+')</option>').join('')+'</select><input id="gq" type="number" min="1" max="999" value="1" style="'+SIN+'"><div style="text-align:right"><button class="btn g" id="gsd">🎁 Gửi quà</button></div>'}
 return ''}
function openSoc(t){stt=t||stt;Object.keys(SOCX).forEach(k=>{if(k!==stt&&SOCX[k].leave)SOCX[k].leave()});if(FB_CONFIG&&fb&&!usr&&!(SOCX[stt]&&SOCX[stt].local))stt='acc';const T=[['chat','💬 Chat'],['fr','🤝 Bạn'],['gift','🎁 Quà'],['mk','🛒 Chợ']].concat(Object.keys(SOCX).map(k=>[k,SOCX[k].label+(SOCX[k].badge?SOCX[k].badge():'')]),[['acc','👤 TK']]);
 let h='<h2>👥 Cộng đồng</h2><div class="tabs2">'+T.map(x=>'<button class="btn'+(x[0]===stt?' g':'')+'" data-t="'+x[0]+'">'+x[1]+'</button>').join('')+'</div>';
 if(SOCX[stt]&&SOCX[stt].local)h+=socBody();
 else if(!FB_CONFIG)h+='<p style="font-size:13px">Chưa kết nối máy chủ. Tạo project Firebase miễn phí rồi dán <b>firebaseConfig</b> vào biến <b>FB_CONFIG</b> trong file game để bật đăng nhập, bạn bè, quà tặng và chat.</p>';
 else if(!fb)h+='<p>Đang kết nối...</p>';
 else if(stt==='acc')h+=usr?'<div style="font-size:14px;margin:8px 0">Đã đăng nhập: <b>'+esc(usr.email)+'</b><br>Tên hiển thị: <b>'+esc(S.nm)+'</b>'+(S.age?' · '+S.age+' tuổi':'')+' (đổi trong 🏪 Shop → Hồ sơ)</div><div class="row"><button class="btn g" id="asy">☁️ Lưu ngay</button><span class="sp"></span><button class="btn" id="alo">Đăng xuất</button></div>':'<input id="aem" type="email" placeholder="Email" style="'+SIN+'"><input id="apw" type="password" placeholder="Mật khẩu (từ 6 ký tự)" style="'+SIN+'"><div style="font-size:12px;color:var(--mu);margin-top:6px">Chỉ cần điền khi ĐĂNG KÝ:</div><input id="anm" maxlength="16" placeholder="Tên hiển thị (tối đa 16 ký tự)" style="'+SIN+'"><input id="aag" type="number" min="5" max="99" placeholder="Tuổi" style="'+SIN+'"><div class="row"><button class="btn g" id="ali">Đăng nhập</button><button class="btn" id="arg">Đăng ký</button></div><small>Mỗi tài khoản có tiến trình riêng. Đăng ký tài khoản mới sẽ bắt đầu từ đầu.</small>';
 else if(!usr)h+='<p style="font-size:13px">Hãy đăng nhập ở tab 👤 TK để dùng tính năng này.</p>';
 else h+=socBody();
 h+='<div style="text-align:right;margin-top:10px"><button class="btn" id="sx">Đóng</button></div>';dOpen=false;$('md').innerHTML=h;$('ov').classList.add('on');
 const on=(i,f)=>{const b=$(i);if(b)b.onclick=f};$('md').querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>openSoc(b.dataset.t));
 on('sx',closeM);on('csd',sendChat);on('fad',()=>addFriend($('fcd').value));
 $('md').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>visit(b.dataset.v));$('md').querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{giftTo=b.dataset.g;openSoc('gift')});
 on('gsd',()=>sendGift($('gto').value,$('git').value,+$('gq').value));on('asy',()=>{cloudSave(true);toast('Đã lưu ☁️')});on('alo',()=>{fb.a.signOut();toast('Đã đăng xuất')});
 const au=async reg=>{const e=$('aem').value.trim(),p=$('apw').value;
  if(reg){const nm=$('anm').value.trim().slice(0,16),ag=Math.floor(+$('aag').value);if(!nm)return toast('Hãy nhập tên hiển thị');if(!(ag>=5&&ag<=99))return toast('Tuổi từ 5 đến 99');pendReg={nm,age:ag}}
  try{if(reg)await fb.a.createUserWithEmailAndPassword(e,p);else await fb.a.signInWithEmailAndPassword(e,p)}catch(x){pendReg=null;toast(ERR[x.code]||'Lỗi đăng nhập')}};
 on('ali',()=>au(0));on('arg',()=>au(1));if($('cin'))$('cin').onkeydown=e=>{if(e.key==='Enter')sendChat()};renderChat();if(stt==='fr'&&usr)loadPeople();$('md').querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{mkv=b.dataset.mv;openSoc('mk')});if(stt==='mk'&&usr)mkRender();$('md').querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>dmOpen(b.dataset.dm));if(SOCX[stt]&&SOCX[stt].init&&(usr||SOCX[stt].local))SOCX[stt].init();const cp=$('cpc');if(cp)cp.onclick=()=>{try{navigator.clipboard.writeText(usr.uid.slice(0,6).toUpperCase());toast('Đã chép mã 📋')}catch(e){toast('Không chép được')}}}

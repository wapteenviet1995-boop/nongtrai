/* ===== NHẮN TIN RIÊNG (tab ✉️): dm/{cid}/msgs + hộp thư users/{uid}/inbox/{người gửi} ===== */
let dmWith='',dmName='',dmMsgs=[],dmUnsub=null,dmInUnsub=null,dmInUid='',dmInbox={},dmFirst=true,dmT=0;
const dmCid=o=>[usr.uid,o].sort().join('_'),dmRead=()=>S.dmr||(S.dmr={});
const dmNameOf=u=>{const f=(S.fr||[]).find(x=>x.u===u);return f?f.n:(dmInbox[u]&&dmInbox[u].fn)||'Bạn'};
const dmUnread=()=>Object.keys(dmInbox).filter(u=>dmInbox[u].t>(dmRead()[u]||0)).length;
function dmBadge(){const n=dmUnread(),b=$('soc');if(b)b.textContent='👥'+(n?' '+n:'')}
const dmViewing=id=>dmWith===id&&stt==='dm'&&$('ov').classList.contains('on');
function dmStopConv(){if(dmUnsub){dmUnsub();dmUnsub=null}}
function dmStopIn(){if(dmInUnsub){dmInUnsub();dmInUnsub=null}dmInUid=''}
function dmReset(){dmStopConv();dmStopIn();dmInbox={};dmMsgs=[];dmWith='';dmBadge()}
function dmStart(){if(!usr||!fb){dmReset();return}if(dmInUid===usr.uid&&dmInUnsub)return;dmStopIn();dmInUid=usr.uid;dmFirst=true;
 dmInUnsub=fb.d.collection('users/'+usr.uid+'/inbox').onSnapshot(sn=>{
  dmInbox={};sn.docs.forEach(d=>{dmInbox[d.id]=d.data()});
  if(!dmFirst)sn.docChanges().forEach(c=>{if(c.type==='removed')return;const o=c.doc.data(),id=c.doc.id;
   if(o.t>(dmRead()[id]||0)){if(dmViewing(id)){dmRead()[id]=o.t}else toast('✉️ '+(o.fn||'Bạn')+': '+String(o.text||'').slice(0,40))}});
  dmFirst=false;dmBadge();
  if(stt==='dm'&&!dmWith&&$('dmlist'))dmRenderList();
 },e=>{})}
function dmOpen(uid){dmWith=uid;dmName=dmNameOf(uid);openSoc('dm')}
function dmRender(){const l=$('dml');if(!l)return;
 l.innerHTML=dmMsgs.map(m=>{const me=m.from===usr.uid;return '<div style="display:flex;justify-content:'+(me?'flex-end':'flex-start')+';margin:3px 0"><span style="max-width:78%;padding:5px 9px;border-radius:12px;background:'+(me?'var(--ac)':'rgba(127,127,127,.25)')+';color:'+(me?'#fff':'inherit')+';word-break:break-word">'+esc(m.text)+'</span></div>'}).join('')||'<small>Hãy gửi lời chào đầu tiên! 👋</small>';
 l.scrollTop=l.scrollHeight}
function dmListen(){dmStopConv();const w=dmWith;dmMsgs=[];
 const b=$('dmb');if(b)b.onclick=()=>{dmWith='';openSoc('dm')};const sd=$('dms');if(sd)sd.onclick=dmSend;const i=$('dmi');if(i)i.onkeydown=e=>{if(e.key==='Enter')dmSend()};
 dmUnsub=fb.d.collection('dm/'+dmCid(w)+'/msgs').orderBy('t','desc').limit(50).onSnapshot(sn=>{
  dmMsgs=sn.docs.map(d=>d.data()).reverse();dmRender();
  if(dmInbox[w]&&dmInbox[w].t>(dmRead()[w]||0)){dmRead()[w]=dmInbox[w].t;save();dmBadge()}},
  e=>{const l=$('dml');if(l)l.innerHTML='<small>'+(e.code==='permission-denied'?'Chưa cấp quyền Firestore cho tin nhắn (xem Rules).':'Không tải được tin nhắn.')+'</small>'})}
async function dmSend(){const i=$('dmi');if(!i||!dmWith||!usr)return;const t=i.value.trim().slice(0,300);if(!t)return;
 if(Date.now()-dmT<1500)return toast('Nhắn chậm thôi nhé');dmT=Date.now();i.value='';
 try{const n=Date.now(),b=fb.d.batch();
  b.set(fb.d.collection('dm/'+dmCid(dmWith)+'/msgs').doc(),{from:usr.uid,to:dmWith,text:t,t:n});
  b.set(fb.d.doc('users/'+dmWith+'/inbox/'+usr.uid),{from:usr.uid,fn:S.nm,text:t.slice(0,80),t:n});
  await b.commit();if(typeof achInc==='function')achInc('dm',1)}
 catch(e){toast(e.code==='permission-denied'?'Chưa cấp quyền Firestore cho tin nhắn':'Gửi tin thất bại')}}
function dmRenderList(){const B=$('dmlist');if(!B)return;const ids={};
 (S.fr||[]).forEach(f=>{ids[f.u]=f.n});Object.keys(dmInbox).forEach(u=>{if(!ids[u])ids[u]=dmInbox[u].fn||'Bạn'});
 const L=Object.keys(ids).map(u=>({u,n:ids[u],i:dmInbox[u]})).sort((a,b)=>(b.i?b.i.t:0)-(a.i?a.i.t:0));
 B.innerHTML=L.map(x=>{const un=x.i&&x.i.t>(dmRead()[x.u]||0);return row('🧑',esc(x.n)+(un?' <span style="color:#e53935">●</span>':''),x.i?esc(x.i.text):'Chưa có tin nhắn','<button class="btn'+(un?' g':'')+'" data-dm="'+x.u+'">Mở</button>')}).join('')||'<small>Hãy thêm bạn ở tab 🤝 Bạn rồi bấm ✉️ để nhắn tin.</small>';
 B.querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>dmOpen(b.dataset.dm))}

SOCX.dm={label:'✉️ Tin nhắn',badge:()=>{const n=dmUnread();return n?' '+n:''},
 body(){if(dmWith)return '<div class="row"><button class="btn" id="dmb">⬅ Danh sách</button><span class="sp"></span><b>✉️ '+esc(dmName)+'</b></div><div id="dml" style="height:230px;overflow:auto;font-size:13px;background:rgba(0,0,0,.05);padding:6px;border-radius:10px"></div><div class="row"><input id="dmi" maxlength="300" placeholder="Nhắn cho '+esc(dmName)+'..." style="flex:1;'+SIN+'"><button class="btn g" id="dms">Gửi</button></div>';
  return '<div style="font-size:12px;color:var(--mu);margin-bottom:4px">Tin nhắn riêng giữa hai người. Thêm bạn ở tab 🤝 rồi bấm ✉️.</div><div id="dmlist"></div>'},
 init(){dmStart();if(dmWith)dmListen();else dmRenderList()},
 leave(){dmStopConv()}};

/* nối vào luồng có sẵn: theo dõi hộp thư khi đăng nhập, dọn khi đăng xuất / đóng cửa sổ */
{const _gg=getGifts;getGifts=async()=>{await _gg();dmStart()}}
{const _oa=onAuth;onAuth=async u=>{if(!u)dmReset();return _oa(u)}}
{const _cm=closeM;closeM=()=>{dmStopConv();dmWith='';_cm()}}

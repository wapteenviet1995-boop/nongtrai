/* ===== CHỢ NGƯỜI CHƠI (Firestore: market, users/{uid}/sales) ===== */
let mkv='buy';
async function mSell(k,q,p){q=Math.floor(q);p=Math.floor(p);if(!IT[k]||!(q>=1&&q<=999)){toast('Số lượng từ 1 đến 999');return false}if(!(p>=1&&p<=9999)){toast('Giá từ 1 đến 9999 xu/cái');return false}if(inv(k)<q){toast('Không đủ hàng');return false}
  try{const mine=await fb.d.collection('market').where('sid','==',usr.uid).get();if(mine.size>=10){toast('Tối đa 10 gian hàng cùng lúc');return false}if(inv(k)<q){toast('Không đủ hàng');return false}
   add(k,-q);hud();save();
   try{await fb.d.collection('market').add({sid:usr.uid,sn:S.nm,item:k,qty:q,price:p,t:Date.now()})}catch(e){add(k,q);hud();save();throw e}
   cloudSave(true);toast('Đã đăng bán '+IT[k][0]+' ×'+q+' 🏷️');return true}catch(e){toast(e.code==='permission-denied'?'Chưa cấp quyền Firestore cho chợ':'Đăng bán thất bại');return false}}
async function mBuy(id){const ref=fb.d.doc('market/'+id);let L=null;
  try{await fb.d.runTransaction(async tx=>{const sn=await tx.get(ref);if(!sn.exists)throw new Error('gone');L=sn.data();if(L.sid===usr.uid)throw new Error('own');
     const cost=L.qty*L.price,need=L.item==='gem'?0:L.qty;if(S.c<cost)throw new Error('coin');if(tot()+need>cap())throw new Error('full');
     tx.delete(ref);tx.set(fb.d.doc('users/'+L.sid+'/sales/'+id),{coins:cost,buyer:usr.uid,bn:S.nm,item:L.item,qty:L.qty,t:Date.now()})});
   S.c-=L.qty*L.price;add(L.item,L.qty);hud();save();cloudSave(true);if(typeof achInc==='function')achInc('mb',1);toast('Đã mua '+(IT[L.item]?IT[L.item][0]:'')+' ×'+L.qty+' 🛍️')}
  catch(e){const m={gone:'Hàng đã có người mua hoặc đã gỡ',own:'Đây là hàng của bạn',coin:'Bạn không đủ xu',full:'Kho đầy! Hãy bán bớt hoặc nâng cấp nhà kho'}[e.message];toast(m||(e.code==='permission-denied'?'Chưa cấp quyền Firestore cho chợ':'Mua thất bại, thử lại nhé'))}
  mkRender()}
async function mCancel(id){const ref=fb.d.doc('market/'+id);let L=null;
  try{await fb.d.runTransaction(async tx=>{const sn=await tx.get(ref);if(!sn.exists)throw new Error('gone');L=sn.data();if(L.sid!==usr.uid)throw new Error('own');tx.delete(ref)});
   add(L.item,L.qty);hud();save();cloudSave(true);toast('Đã thu hồi hàng về kho 📦')}
  catch(e){toast(e.message==='gone'?'Đã có người mua rồi 🎉':'Lỗi kết nối')}
  mkRender()}
async function mkRender(){const B=$('mkb');if(!B)return;const v=mkv;
  if(v==='sell'){const its=Object.keys(S.inv).filter(k=>inv(k)>0&&IT[k]);
   B.innerHTML=!its.length?'<small>Kho trống, chưa có gì để bán.</small>':'<div style="font-size:12px;color:var(--mu);margin:4px 0">Hàng rời kho ngay khi đăng. Có người mua thì xu tự về túi bạn. Chưa ai mua có thể thu hồi ở tab 📦.</div><select id="mki" style="'+SIN+'">'+its.map(k=>'<option value="'+k+'">'+IT[k][0]+' '+IT[k][1]+' (có '+inv(k)+') · NPC mua '+IT[k][2]+'🪙, shop bán '+IT[k][2]*2+'🪙</option>').join('')+'</select><input id="mkq" type="number" min="1" max="999" value="1" placeholder="Số lượng" style="'+SIN+'"><input id="mkp" type="number" min="1" max="9999" placeholder="Giá mỗi cái (xu)" style="'+SIN+'"><div style="text-align:right"><button class="btn g" id="mks">🏷️ Đăng bán</button></div>';
   const b=$('mks');if(b)b.onclick=()=>mSell($('mki').value,+$('mkq').value,+$('mkp').value).then(ok=>{if(ok){mkv='my';openSoc('mk')}});return}
  B.innerHTML='<small>Đang tải...</small>';
  try{let docs;if(v==='my')docs=(await fb.d.collection('market').where('sid','==',usr.uid).get()).docs;else docs=(await fb.d.collection('market').orderBy('t','desc').limit(40).get()).docs.filter(d=>d.data().sid!==usr.uid);
   if(stt!=='mk'||mkv!==v||!$('mkb'))return;const L=docs.map(d=>({id:d.id,o:d.data()})).filter(x=>IT[x.o.item]);
   $('mkb').innerHTML=L.map(x=>{const o=x.o;return row(IT[o.item][0],esc(IT[o.item][1])+' ×'+o.qty,o.price+'🪙/cái · tổng '+o.qty*o.price+'🪙'+(v==='buy'?' · '+esc(o.sn||'?'):''),v==='buy'?'<button class="btn g" data-mb="'+x.id+'">Mua</button>':'<button class="btn" data-mc="'+x.id+'">Thu hồi</button>')}).join('')||'<small>'+(v==='buy'?'Chưa có hàng nào. Hãy là người đầu tiên đăng bán!':'Bạn chưa đăng bán gì.')+'</small>';
   $('mkb').querySelectorAll('[data-mb]').forEach(b=>b.onclick=()=>{const x=L.find(y=>y.id===b.dataset.mb);if(x&&confirm('Mua '+x.o.qty+' '+IT[x.o.item][1]+' với giá '+x.o.qty*x.o.price+' xu?'))mBuy(x.id)});
   $('mkb').querySelectorAll('[data-mc]').forEach(b=>b.onclick=()=>mCancel(b.dataset.mc))}
  catch(e){if($('mkb'))$('mkb').innerHTML='<small>'+(e.code==='permission-denied'?'Chưa cấp quyền Firestore cho chợ (xem Rules).':'Không tải được chợ.')+'</small>'}}
async function getSales(){if(!usr)return;try{const sn=await fb.d.collection('users/'+usr.uid+'/sales').get();let c=0,t=[];
  for(const d of sn.docs){const g=d.data(),q=Math.min(10000000,Math.floor(g.coins)||0);if(q>0){c+=q;if(typeof achInc==='function')achInc('ms',1);t.push(esc(g.bn||'?')+' mua '+(g.qty|0)+' '+(IT[g.item]?IT[g.item][0]:''))}await d.ref.delete()}
  if(c>0){S.c+=c;hud();save();cloudSave(true);toast('💰 +'+c+' xu: '+t.join(', '))}}catch(e){}}
{const _gg=getGifts;getGifts=async()=>{await _gg();await getSales()}}

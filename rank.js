/* ===== BẢNG XẾP HẠNG (tab 🏆 trong 👥) — đọc từ Firestore users (trường val, lv) ===== */
let rkv='val';
SOCX.rank={label:'🏆 BXH',
 body(){const g=gvalParts();
  return '<div class="it"><span class="n"><b>🏡 Giá trị vườn của bạn: '+fmtN(g.total)+'</b><br><small style="color:var(--mu)">Tài sản đang có, không tính xu. Cập nhật khi game lưu lên ☁️</small></span></div><div class="row"><button class="btn'+(rkv==='val'?' g':'')+'" data-rk="val">🏡 Giá trị vườn</button><button class="btn'+(rkv==='lv'?' g':'')+'" data-rk="lv">⭐ Cấp độ</button></div><div id="rkb"><small>Đang tải...</small></div>'},
 async init(){const v=rkv;$('md').querySelectorAll('[data-rk]').forEach(b=>b.onclick=()=>{rkv=b.dataset.rk;openSoc('rank')});
  try{await cloudSave(true);const sn=await fb.d.collection('users').orderBy(v==='lv'?'lv':'val','desc').limit(20).get();
   if(stt!=='rank'||rkv!==v||!$('rkb'))return;
   $('rkb').innerHTML=sn.docs.map((d,i)=>{const o=d.data(),me=d.id===usr.uid;
    return '<div class="it" style="'+(me?'background:rgba(255,200,0,.18);border-radius:8px;padding-left:4px':'')+'"><span style="font-size:20px;width:30px;text-align:center">'+(i<3?['🥇','🥈','🥉'][i]:(i+1)+'.')+'</span><span class="n" style="flex:1"><b>'+esc(o.name||'?')+(me?' (bạn)':'')+'</b><br><small style="color:var(--mu)">'+(v==='lv'?'⭐ Cấp '+(o.lv||1):'🏡 '+fmtN(o.val)+' · Cấp '+(o.lv||1))+'</small></span>'+(me?'':'<button class="btn" data-v="'+d.id+'">Thăm</button> <button class="btn" data-dm="'+d.id+'">✉️</button>')+'</div>'}).join('')||'<small>Chưa có ai trong bảng xếp hạng.</small>';
   $('rkb').querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>visit(b.dataset.v));$('rkb').querySelectorAll('[data-dm]').forEach(b=>b.onclick=()=>dmOpen(b.dataset.dm))}
  catch(e){if($('rkb'))$('rkb').innerHTML='<small>'+(e.code==='permission-denied'?'Chưa cấp quyền Firestore (xem Rules).':'Không tải được bảng xếp hạng.')+'</small>'}}};

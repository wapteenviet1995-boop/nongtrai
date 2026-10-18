/* ===== THÀNH TỰU + GIÁ TRỊ VƯỜN (tab 🏅 trong 👥) — chạy được cả khi chưa đăng nhập ===== */
const ST=()=>S.stt||(S.stt={}),AC=()=>S.ac||(S.ac={}),AD=()=>S.ad||(S.ad={});
const fmtN=n=>Math.floor(+n||0).toLocaleString('vi-VN');
function achInc(k,n){const s=ST();s[k]=(s[k]||0)+(n||1)}

/* Giá trị vườn = tài sản đang có (KHÔNG tính xu): đất + cây + thú + nhân viên + công trình + kho */
function gvalParts(){
 const n=S.p.filter(p=>p.u).length,ex=Math.max(0,n-FREE.length);let land=0;for(let i=0;i<ex;i++)land+=40+20*i;
 let crop=0;S.p.forEach(p=>{if(p.u&&p.c&&IT[p.c])crop+=IT[p.c][2]});
 let pets=0;(S.rn||[]).forEach(a=>{const sp=SP[a.sp];if(sp)pets+=Math.round(sp.cost*(a.v>=0?1.5:.5))});
 let staff=0;(S.hp||[]).forEach(h=>{const P=HP[h.k];if(!P)return;staff+=P.cost[0]+P.cost[1]*IT.gem[2];for(let l=1;l<h.lv;l++)staff+=300*l+2*l*IT.gem[2]});
 let bld=0;for(let i=0;i<(S.wl||0);i++)bld+=100*(1+i);for(let i=0;i<(S.rx||0);i++)bld+=150*(1+i);bld+=Math.max(0,dl()-1)*300;
 let stock=0;Object.keys(S.inv||{}).forEach(k=>{if(IT[k])stock+=Math.max(0,S.inv[k])*IT[k][2]});
 const total=land+crop+pets+staff+bld+stock;
 return{land,crop,pets,staff,bld,stock,total:Number.isFinite(total)?total:0}}
const gval=()=>gvalParts().total;

/* Danh sách thành tựu: g = tiến độ hiện tại, m = mốc, r = [xu, ngọc] */
const ACH=[
 {id:'h1',ic:'🌱',n:'Gieo hạt đầu tiên',d:'Thu hoạch 10 cây',g:()=>ST().h||0,m:10,r:[50,0]},
 {id:'h2',ic:'🌾',n:'Nông dân chăm chỉ',d:'Thu hoạch 100 cây',g:()=>ST().h||0,m:100,r:[300,0]},
 {id:'h3',ic:'🚜',n:'Vua nông sản',d:'Thu hoạch 500 cây',g:()=>ST().h||0,m:500,r:[1500,2]},
 {id:'f1',ic:'🎣',n:'Cần thủ',d:'Câu 10 con cá',g:()=>ST().fc||0,m:10,r:[60,0]},
 {id:'f2',ic:'🐟',n:'Ngư dân',d:'Câu 50 con cá',g:()=>ST().fc||0,m:50,r:[400,1]},
 {id:'f3',ic:'🦈',n:'Thợ săn cá mập',d:'Câu được 1 cá mập',g:()=>ST().sk||0,m:1,r:[500,2]},
 {id:'a1',ic:'🐷',n:'Trang trại nhỏ',d:'Nuôi 3 con thú',g:()=>(S.rn||[]).length,m:3,r:[100,0]},
 {id:'a2',ic:'🐄',n:'Người chăn nuôi',d:'Thu 30 sản phẩm từ thú',g:()=>ST().ap||0,m:30,r:[300,0]},
 {id:'a3',ic:'🏞️',n:'Chủ trại lớn',d:'Nuôi 10 con thú',g:()=>(S.rn||[]).length,m:10,r:[1200,2]},
 {id:'l1',ic:'⭐',n:'Tân binh',d:'Đạt cấp 5',g:lvl,m:5,r:[150,0]},
 {id:'l2',ic:'🌟',n:'Nông dân lão luyện',d:'Đạt cấp 10',g:lvl,m:10,r:[600,1]},
 {id:'l3',ic:'💫',n:'Huyền thoại nông trại',d:'Đạt cấp 20',g:lvl,m:20,r:[3000,3]},
 {id:'p1',ic:'🟩',n:'Mở rộng đất',d:'Mở 12 ô đất',g:()=>S.p.filter(p=>p.u).length,m:12,r:[200,0]},
 {id:'p2',ic:'🟨',n:'Đại điền chủ',d:'Mở 24 ô đất',g:()=>S.p.filter(p=>p.u).length,m:24,r:[1000,1]},
 {id:'p3',ic:'🟫',n:'Chủ cả đảo',d:'Mở hết 36 ô đất',g:()=>S.p.filter(p=>p.u).length,m:36,r:[4000,3]},
 {id:'s1',ic:'👥',n:'Có bạn',d:'Kết bạn với 1 người',g:()=>(S.fr||[]).length,m:1,r:[50,0]},
 {id:'s2',ic:'🤝',n:'Quảng giao',d:'Kết bạn với 5 người',g:()=>(S.fr||[]).length,m:5,r:[400,1]},
 {id:'g1',ic:'🎁',n:'Hào phóng',d:'Tặng quà 5 lần',g:()=>ST().gs||0,m:5,r:[150,0]},
 {id:'m1',ic:'🏷️',n:'Thương nhân',d:'Bán được 5 gian hàng ở chợ',g:()=>ST().ms||0,m:5,r:[300,0]},
 {id:'m2',ic:'💼',n:'Đại gia chợ',d:'Bán được 30 gian hàng ở chợ',g:()=>ST().ms||0,m:30,r:[2000,2]},
 {id:'m3',ic:'🛍️',n:'Khách quen',d:'Mua 5 món ở chợ',g:()=>ST().mb||0,m:5,r:[150,0]},
 {id:'d1',ic:'✉️',n:'Hay chuyện',d:'Gửi 10 tin nhắn riêng',g:()=>ST().dm||0,m:10,r:[100,0]},
 {id:'r1',ic:'🐲',n:'Bạn của rồng',d:'Rồng đạt cấp 3',g:dl,m:3,r:[300,1]},
 {id:'r2',ic:'🐉',n:'Chủ nhân rồng',d:'Rồng đạt cấp 5',g:dl,m:5,r:[1500,3]},
 {id:'e1',ic:'🤖',n:'Ông chủ',d:'Thuê 1 nhân viên',g:()=>(S.hp||[]).length,m:1,r:[200,0]},
 {id:'e2',ic:'🏢',n:'Tập đoàn nông nghiệp',d:'Thuê đủ 5 nhân viên',g:()=>(S.hp||[]).length,m:5,r:[3000,5]},
 {id:'w1',ic:'🏚️',n:'Kho khổng lồ',d:'Nâng nhà kho 3 lần',g:()=>S.wl||0,m:3,r:[500,1]},
 {id:'c1',ic:'💰',n:'Có của ăn của để',d:'Kiếm tổng cộng 5.000 xu',g:()=>ST().earn||0,m:5000,r:[300,0]},
 {id:'c2',ic:'🤑',n:'Triệu phú tập sự',d:'Kiếm tổng cộng 100.000 xu',g:()=>ST().earn||0,m:100000,r:[3000,3]},
 {id:'v1',ic:'🏡',n:'Vườn có giá',d:'Giá trị vườn đạt 2.000',g:gval,m:2000,r:[300,0]},
 {id:'v2',ic:'🏆',n:'Vườn đáng giá',d:'Giá trị vườn đạt 10.000',g:gval,m:10000,r:[1500,2]},
 {id:'v3',ic:'👑',n:'Vườn triệu đô',d:'Giá trị vườn đạt 50.000',g:gval,m:50000,r:[8000,6]}
];
const achClaimable=()=>ACH.filter(a=>!AC()[a.id]&&a.g()>=a.m);

/* ---- đếm thống kê bằng cách bọc các hàm có sẵn ---- */
{const _cp=clickPlot;clickPlot=(i,el)=>{const p=S.p[i],was=!!(p&&p.u&&p.c&&Date.now()>=p.e);_cp(i,el);if(was&&!S.p[i].c)achInc('h',1)}}
{const _cf=clickFish;clickFish=el=>{const f=S.fi,was=f.st===2||(f.st===1&&Date.now()>=f.e),s0=inv('f4');_cf(el);if(was&&f.st===0){achInc('fc',1);if(inv('f4')>s0)achInc('sk',1)}}}
{const _rc=rclick;rclick=(a,el)=>{const v=rvar(a),p=v?v.p:null,b=p?inv(p):0;_rc(a,el);if(p&&inv(p)>b)achInc('ap',1)}}
/* tổng xu kiếm được: cộng các lần xu tăng giữa 2 lần cập nhật */
let _acS=null,_acC=0;
{const _hh=hud;hud=()=>{_hh();if(S!==_acS){_acS=S;_acC=S.c}else{const d=S.c-_acC;if(d>0)ST().earn=(ST().earn||0)+d;_acC=S.c}}}

/* ---- phát hiện thành tựu mới ---- */
function achCheck(){const d=AD(),nw=[];ACH.forEach(a=>{if(!d[a.id]&&a.g()>=a.m){d[a.id]=1;nw.push(a)}});
 if(nw.length)toast(nw.length>1?'🏅 '+nw.length+' thành tựu mới! Mở 👥 → 🏅 để nhận thưởng':'🏅 '+nw[0].n+'! Mở 👥 → 🏅 để nhận thưởng')}
setInterval(achCheck,3000);

function achClaim(id){const a=ACH.find(x=>x.id===id);if(!a||AC()[id]||a.g()<a.m)return null;AC()[id]=1;S.c+=a.r[0];if(a.r[1])add('gem',a.r[1]);return a}
const achRew=a=>'🪙'+fmtN(a.r[0])+(a.r[1]?' 💎'+a.r[1]:'');

SOCX.ach={label:'🏅 Thành tựu',local:true,
 badge:()=>{const n=achClaimable().length;return n?' '+n:''},
 body(){const g=gvalParts(),done=ACH.filter(a=>AC()[a.id]).length,cl=achClaimable();
  let h='<div class="it"><span class="n"><b>🏡 Giá trị vườn: '+fmtN(g.total)+'</b><br><small style="color:var(--mu)">Đất '+fmtN(g.land)+' · Cây '+fmtN(g.crop)+' · Thú '+fmtN(g.pets)+' · Nhân viên '+fmtN(g.staff)+' · Công trình '+fmtN(g.bld)+' · Kho '+fmtN(g.stock)+' (không tính xu)</small></span></div>';
  h+='<div class="row"><span>🏅 Đã nhận '+done+'/'+ACH.length+'</span><span class="sp"></span>'+(cl.length>1?'<button class="btn g" id="acA">🎁 Nhận tất cả ('+cl.length+')</button>':'')+'</div>';
  const pct=a=>Math.min(1,a.g()/a.m),rank=a=>AC()[a.id]?2:(a.g()>=a.m?0:1);
  const L=ACH.slice().sort((p,q)=>rank(p)-rank(q)||(rank(p)===1?pct(q)-pct(p):0));
  L.forEach(a=>{const cur=Math.min(a.g(),a.m),r=rank(a);
   h+='<div class="it"><span style="font-size:24px">'+a.ic+'</span><span class="n" style="flex:1"><b>'+a.n+(r===2?' ✅':'')+'</b><br><small style="color:var(--mu)">'+a.d+' · '+fmtN(cur)+'/'+fmtN(a.m)+' · '+achRew(a)+'</small><div class="pb" style="margin:3px 0 0"><i style="width:'+Math.floor(pct(a)*100)+'%"></i></div></span>'+(r===0?'<button class="btn g" data-ac="'+a.id+'">Nhận</button>':'')+'</div>'});
  return h},
 init(){$('md').querySelectorAll('[data-ac]').forEach(b=>b.onclick=()=>{const a=achClaim(b.dataset.ac);if(a){hud();if(typeof cloudSave==='function')cloudSave(true);toast('🎁 +'+achRew(a)+' · '+a.n);openSoc('ach')}});
  const A=$('acA');if(A)A.onclick=()=>{let c=0,g=0,n=0;achClaimable().forEach(a=>{if(achClaim(a.id)){c+=a.r[0];g+=a.r[1];n++}});if(n){hud();if(typeof cloudSave==='function')cloudSave(true);toast('🎁 Nhận '+n+' thành tựu: +🪙'+fmtN(c)+(g?' 💎'+g:''))}openSoc('ach')}}};

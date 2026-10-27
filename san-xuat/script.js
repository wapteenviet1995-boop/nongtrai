/* ====== CẤU HÌNH – chỉnh ở đây cho khớp game của bạn ====== */
// [emoji, tên, loại, giá bán]  loại: crop = cây trồng, pet = sản phẩm vật nuôi, prod = thành phẩm
const ITEMS={
  lua:['🌾','Lúa mì','crop',5],  carot:['🥕','Cà rốt','crop',6], cachua:['🍅','Cà chua','crop',8],
  ngo:['🌽','Ngô','crop',9],     dau:['🍓','Dâu tây','crop',12], bi:['🎃','Bí ngô','crop',14],
  trung:['🥚','Trứng','pet',10], sua:['🥛','Sữa bò','pet',18],  thit:['🥓','Thịt heo','pet',25], len:['🧶','Len cừu','pet',20],
  banhmi:['🍞','Bánh mì','prod',45], banhdau:['🍰','Bánh kem dâu','prod',110], banhbi:['🥧','Bánh bí ngô','prod',95],
  phomai:['🧀','Phô mai','prod',70], kem:['🍦','Kem dâu','prod',85], bo:['🧈','Bơ sữa','prod',60],
  sup:['🍲','Súp cà chua thịt','prod',90], bapbo:['🍿','Bắp rang bơ','prod',75], salad:['🥗','Salad trứng','prod',65],
  khan:['🧣','Khăn len','prod',60], mu:['🧢','Mũ len','prod',95], ao:['🧥','Áo len','prod',150],
  // vật liệu (giá = giá mua ở xưởng cơ khí) và linh kiện (dùng để nâng cấp, không bán)
  sat:['🔗','Sắt thanh','mat',30], go:['🪵','Gỗ','mat',15], than:['⚫','Than','mat',20],
  oc:['🔩','Ốc vít','part',0], banhrang:['⚙️','Bánh răng','part',0], dongco:['🛠️','Động cơ','part',0]
};
// Nhà máy: cost = giá mở khoá, slots = số ô sản xuất
const BUILDINGS={
  lo:{em:'🔥',name:'Lò bánh',cost:0,slots:2},
  sua:{em:'🏺',name:'Xưởng sữa',cost:300,slots:2},
  bep:{em:'🍳',name:'Nhà bếp',cost:500,slots:2},
  det:{em:'🧵',name:'Xưởng dệt',cost:800,slots:2},
  co:{em:'⚙️',name:'Xưởng cơ khí',cost:400,slots:2}
};
// Công thức: b = nhà máy, in = nguyên liệu, t = giây, out = thành phẩm
const RECIPES=[
  {b:'lo',out:'banhmi',in:{lua:3,trung:1},t:20},
  {b:'lo',out:'banhdau',in:{lua:2,dau:2,sua:1},t:45},
  {b:'lo',out:'banhbi',in:{bi:2,lua:2,trung:1},t:40},
  {b:'sua',out:'phomai',in:{sua:2},t:30},
  {b:'sua',out:'bo',in:{sua:2,lua:1},t:25},
  {b:'sua',out:'kem',in:{sua:1,dau:2},t:35},
  {b:'bep',out:'sup',in:{cachua:2,thit:1},t:40},
  {b:'bep',out:'bapbo',in:{ngo:2,bo:1},t:30},
  {b:'bep',out:'salad',in:{carot:2,cachua:1,trung:1},t:25},
  {b:'det',out:'khan',in:{len:2},t:30},
  {b:'det',out:'mu',in:{len:2,bi:1},t:45},
  {b:'det',out:'ao',in:{len:4,carot:1},t:70},
  {b:'co',out:'oc',in:{sat:1},t:10},
  {b:'co',out:'banhrang',in:{sat:2,than:1},t:20},
  {b:'co',out:'dongco',in:{banhrang:2,oc:2,than:2},t:45}
];
const MAX_SLOTS=4, SLOT_COST=200;
// Nâng cấp máy: key = cấp hiện tại. Mỗi cấp giảm 20% thời gian sản xuất (tối đa cấp 3)
const UPG={1:{coins:250,parts:{oc:3,banhrang:2}},2:{coins:600,parts:{banhrang:4,oc:6,dongco:1}}};
const SPEED=lv=>0.8**((lv||1)-1);
/* ========================================================== */

const KEY='nt_san_xuat_v1';
let S={coins:500,items:{},bld:{lo:{own:1,n:2,q:[]}},tab:'lo'};
try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
const $=id=>document.getElementById(id);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const have=k=>S.items[k]||0;
const add=(k,n)=>{S.items[k]=have(k)+n;if(S.items[k]<=0)delete S.items[k]};
const fmt=s=>{s=Math.max(0,Math.ceil(s));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
let tt;function toast(m){const t=$('toast');t.textContent=m;t.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('on'),1600)}

function render(){
  $('coin').textContent='🪙 '+S.coins;
  $('tabs').innerHTML=Object.entries(BUILDINGS).map(([id,b])=>{
    const own=S.bld[id]?.own;
    return `<button class="tab ${S.tab===id?'on':''}" data-tab="${id}">${b.em} ${b.name}${own?'':' 🔒'}</button>`}).join('');
  const id=S.tab,b=BUILDINGS[id],st=S.bld[id];
  if(!st){
    $('main').innerHTML=`<div class="card" style="text-align:center"><div style="font-size:48px">${b.em}</div><h2>${b.name}</h2><p>Mở khoá để chế biến thêm nhiều sản phẩm.</p><button class="btn" data-unlock="${id}" ${S.coins<b.cost?'disabled':''}>Mở khoá 🪙 ${b.cost}</button></div>`;
  }else{
    const now=Date.now();let slots='';
    for(let i=0;i<st.n;i++){
      const q=st.q[i];
      if(!q)slots+=`<div class="slot">Ô trống</div>`;
      else{const it=ITEMS[q.out],left=(q.end-now)/1000;
        if(left<=0)slots+=`<div class="slot done" data-take="${i}"><span class="em">${it[0]}</span>Xong! Chạm để nhận</div>`;
        else slots+=`<div class="slot busy"><span class="em">${it[0]}</span>${it[1]}<br>⏳ ${fmt(left)}<div class="bar" style="width:${100-left*1000/q.dur*100}%"></div></div>`}
    }
    if(st.n<MAX_SLOTS)slots+=`<div class="slot" style="border-style:solid"><button class="btn o" data-slot="${id}" ${S.coins<SLOT_COST?'disabled':''}>+ Ô (🪙${SLOT_COST})</button></div>`;
    const lv=st.lv||1,U=UPG[lv];let upg='';
    if(!U)upg=`<div class="card"><h2>🔧 Nâng cấp</h2><span class="sub">Đã đạt cấp tối đa – nhanh hơn ${Math.round((1-SPEED(lv))*100)}%</span></div>`;
    else{let ok=S.coins>=U.coins;
      const need=`<span class="chip ${S.coins>=U.coins?'':'no'}">🪙 ${S.coins}/${U.coins}</span>`+Object.entries(U.parts).map(([k,n])=>{const h=have(k)>=n;if(!h)ok=false;return `<span class="chip ${h?'':'no'}">${ITEMS[k][0]} ${have(k)}/${n}</span>`}).join('');
      upg=`<div class="card"><h2>🔧 Nâng cấp lên cấp ${lv+1}</h2><div class="sub" style="margin:0 0 6px">Mỗi cấp sản xuất nhanh hơn 20%. Linh kiện chế tạo ở Xưởng cơ khí.</div><div class="need">${need}</div><button class="btn o" style="margin-top:8px" data-upg="${id}" ${ok?'':'disabled'}>Nâng cấp</button></div>`}
    if(id==='co')upg+=`<div class="card"><h2>🛒 Mua vật liệu</h2><div class="row">${Object.keys(ITEMS).filter(k=>ITEMS[k][2]==='mat').map(k=>`<button class="btn o" data-buy="${k}" ${S.coins>=ITEMS[k][3]?'':'disabled'}>${ITEMS[k][0]} ${ITEMS[k][1]} 🪙${ITEMS[k][3]}</button>`).join('')}</div></div>`;
    const recs=RECIPES.filter(r=>r.b===id).map(r=>{
      const it=ITEMS[r.out];let ok=true;
      const need=Object.entries(r.in).map(([k,n])=>{const h=have(k)>=n;if(!h)ok=false;return `<span class="chip ${h?'':'no'}">${ITEMS[k][0]} ${have(k)}/${n}</span>`}).join('');
      return `<div class="rec"><span class="em">${it[0]}</span><div class="inf"><b>${it[1]}</b><div class="need">${need}</div><div class="sub" style="margin:3px 0 0">⏱ ${fmt(r.t*SPEED(st.lv))} · ${it[2]==='part'?'linh kiện nâng cấp':'bán 🪙'+it[3]}</div></div><button class="btn" data-make="${RECIPES.indexOf(r)}" ${ok?'':'disabled'}>Làm</button></div>`}).join('');
    $('main').innerHTML=`<div class="card"><h2>${b.em} ${b.name} <span class="chip">Cấp ${st.lv||1}</span></h2><div class="slots">${slots}</div></div>${upg}<div class="card"><h2>📜 Công thức</h2>${recs}</div>`;
  }
  const grp=t=>Object.entries(S.items).filter(([k])=>ITEMS[k][2]===t).map(([k,n])=>`<div class="it"><span class="em">${ITEMS[k][0]}</span>${ITEMS[k][1]}<br><b>×${n}</b>${t==='prod'?`<br><button data-sell="${k}">Bán 🪙${ITEMS[k][3]*n}</button>`:''}</div>`).join('');
  const sec=(t,l)=>{const g=grp(t);return g?`<div class="sub">${l}</div><div class="grid">${g}</div>`:''};
  $('kho').innerHTML=(sec('crop','Cây trồng')+sec('pet','Sản phẩm vật nuôi')+sec('mat','Vật liệu')+sec('part','Linh kiện cơ khí')+sec('prod','Thành phẩm'))||'<span class="sub">Kho trống – bấm “Nhận nguyên liệu thử”.</span>';
}

document.addEventListener('click',e=>{
  const t=e.target.closest('[data-tab],[data-unlock],[data-slot],[data-make],[data-take],[data-sell],[data-upg],[data-buy]');if(!t)return;
  const d=t.dataset;
  if(d.tab){S.tab=d.tab}
  else if(d.unlock){const b=BUILDINGS[d.unlock];if(S.coins>=b.cost){S.coins-=b.cost;S.bld[d.unlock]={own:1,n:b.slots,q:[]};toast('Đã mở khoá '+b.name)}}
  else if(d.slot){if(S.coins>=SLOT_COST){S.coins-=SLOT_COST;S.bld[d.slot].n++}}
  else if(d.make){
    const r=RECIPES[+d.make],st=S.bld[r.b];
    if(!Object.entries(r.in).every(([k,n])=>have(k)>=n))return toast('Thiếu nguyên liệu');
    let i=0;while(i<st.n&&st.q[i])i++;
    if(i>=st.n)return toast('Hết ô trống, chờ ô xong!');
    for(const [k,n] of Object.entries(r.in))add(k,-n);
    const dur=r.t*1000*SPEED(st.lv);st.q[i]={out:r.out,dur,end:Date.now()+dur};
  }
  else if(d.take){const st=S.bld[S.tab],q=st.q[+d.take];if(q&&q.end<=Date.now()){add(q.out,1);st.q[+d.take]=null;toast('+1 '+ITEMS[q.out][1]+' '+ITEMS[q.out][0])}}
  else if(d.upg){const st=S.bld[d.upg],U=UPG[st.lv||1];
    if(U&&S.coins>=U.coins&&Object.entries(U.parts).every(([k,n])=>have(k)>=n)){S.coins-=U.coins;for(const [k,n] of Object.entries(U.parts))add(k,-n);st.lv=(st.lv||1)+1;toast('Nâng cấp thành công! Cấp '+st.lv)}else toast('Chưa đủ vật liệu')}
  else if(d.buy){const p=ITEMS[d.buy][3];if(S.coins>=p){S.coins-=p;add(d.buy,1)}else toast('Không đủ xu')}
  else if(d.sell){const n=have(d.sell),g=n*ITEMS[d.sell][3];delete S.items[d.sell];S.coins+=g;toast('Bán được 🪙 '+g)}
  save();render();
});
$('demo').onclick=()=>{for(const k in ITEMS)if(['crop','pet','mat'].includes(ITEMS[k][2]))add(k,5);toast('Đã thêm nguyên liệu thử');save();render()};
$('sellAll').onclick=()=>{let g=0;for(const k of Object.keys(S.items))if(ITEMS[k][2]==='prod'){g+=S.items[k]*ITEMS[k][3];delete S.items[k]}
  if(!g)return toast('Chưa có thành phẩm');S.coins+=g;toast('Bán được 🪙 '+g);save();render()};
setInterval(()=>{if(S.bld[S.tab])render()},1000);
render();

/* ====== NỐI VỚI GAME CỦA BẠN ======
   Game gọi các hàm này để đồng bộ kho và xu: */
window.KhuSanXuat={
  themKho:(k,n)=>{add(k,n);save();render()},          // vd: KhuSanXuat.themKho('sua',2)
  layKho:()=>({...S.items}),
  themXu:n=>{S.coins+=n;save();render()},
  layXu:()=>S.coins
};

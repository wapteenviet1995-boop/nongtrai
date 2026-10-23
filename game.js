(()=> {
  'use strict';

  /* =========================================================
     NÔNG TRẠI — GAME CORE MỚI
     CSS chỉ là phần giao diện. Logic game nằm toàn bộ ở đây.
     ========================================================= */

  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'nongtrai_new_v1';

  /* ---------- Firebase / đăng nhập ---------- */
  if (typeof firebase === 'undefined' || typeof FB_CONFIG === 'undefined') {
    location.replace('./auth.html');
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(FB_CONFIG);
  } catch (e) {
    console.error(e);
    location.replace('./auth.html');
    return;
  }

  const auth = firebase.auth();

  /* ---------- Dữ liệu game ---------- */
  const CROPS = {
    carrot: {
      id:'carrot', name:'Cà rốt', icon:'🥕',
      seedCost:5, sell:12, growTime:3000, xp:3
    },
    corn: {
      id:'corn', name:'Ngô', icon:'🌽',
      seedCost:8, sell:19, growTime:5000, xp:5
    },
    tomato: {
      id:'tomato', name:'Cà chua', icon:'🍅',
      seedCost:12, sell:28, growTime:7000, xp:8
    },
    wheat: {
      id:'wheat', name:'Lúa mì', icon:'🌾',
      seedCost:15, sell:35, growTime:9000, xp:10
    }
  };

  const DEFAULT_STATE = {
    version:1,
    coins:100,
    gems:0,
    xp:0,
    level:1,
    selectedCrop:'carrot',
    inventory:{
      carrot:0,
      corn:0,
      tomato:0,
      wheat:0
    },
    plots:Array.from({length:8},()=>({
      state:'empty',
      crop:null,
      plantedAt:0,
      readyAt:0
    })),
    stats:{
      planted:0,
      harvested:0,
      earned:0
    }
  };

  let S = loadState();
  let currentUser = null;
  let saveTimer = null;

  function cloneDefault(){
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function loadState(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw){
        const data=JSON.parse(raw);
        return mergeState(cloneDefault(),data);
      }
    }catch(e){
      console.warn('Không đọc được save:',e);
    }
    return cloneDefault();
  }

  function mergeState(base,data){
    if(!data || typeof data!=='object') return base;
    Object.keys(base).forEach(k=>{
      if(data[k]!==undefined){
        if(base[k] && typeof base[k]==='object' && !Array.isArray(base[k]) &&
           data[k] && typeof data[k]==='object'){
          base[k]=mergeState(base[k],data[k]);
        }else{
          base[k]=data[k];
        }
      }
    });
    return base;
  }

  function saveLocal(){
    try{
      localStorage.setItem(SAVE_KEY,JSON.stringify(S));
    }catch(e){}
  }

  function scheduleSave(){
    saveLocal();
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveCloud,500);
  }

  async function saveCloud(){
    if(!currentUser) return;
    try{
      await firebase.firestore().collection('users').doc(currentUser.uid).set({
        game:S,
        updatedAt:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
    }catch(e){
      console.warn('Cloud save:',e);
    }
  }

  async function loadCloud(user){
    try{
      const snap=await firebase.firestore().collection('users').doc(user.uid).get();
      if(snap.exists){
        const data=snap.data();
        if(data.game){
          S=mergeState(cloneDefault(),data.game);
          saveLocal();
        }
      }
    }catch(e){
      console.warn('Cloud load:',e);
    }
  }

  /* ---------- Level ---------- */
  function xpNeed(level){
    return 50 + (level-1)*35;
  }

  function addXP(amount){
    S.xp += amount;
    let leveled=false;
    while(S.xp >= xpNeed(S.level)){
      S.xp -= xpNeed(S.level);
      S.level++;
      leveled=true;
    }
    if(leveled) toast('🎉 Lên cấp '+S.level+'!');
  }

  /* ---------- UI ---------- */
  function updateHUD(){
    const coin=$('coins');
    if(coin) coin.textContent=Math.floor(S.coins);

    let levelEl=document.getElementById('level');
    if(!levelEl){
      const top=document.querySelector('.top');
      if(top){
        levelEl=document.createElement('div');
        levelEl.id='level';
        levelEl.className='coin';
        top.insertBefore(levelEl,document.getElementById('logout'));
      }
    }
    if(levelEl) levelEl.textContent='⭐ Lv.'+S.level;

    renderPlots();
  }

  function renderPlots(){
    const field=$('field');
    if(!field) return;

    field.innerHTML='';

    S.plots.forEach((p,index)=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='plot '+(p.state==='grow'?'grow ':'')+(p.state==='ready'?'ready':'');
      b.dataset.index=index;

      if(p.state==='empty'){
        b.innerHTML='<span>🟫</span>';
        b.setAttribute('aria-label','Ô đất trống');
      }else if(p.state==='grow'){
        const crop=CROPS[p.crop];
        const remaining=Math.max(0,p.readyAt-Date.now());
        b.innerHTML='<span>'+crop.icon+'</span><small>'+formatTime(remaining)+'</small>';
        b.setAttribute('aria-label',crop.name+' đang lớn');
      }else{
        const crop=CROPS[p.crop];
        b.innerHTML='<span>'+crop.icon+'</span><small>Thu hoạch</small>';
        b.setAttribute('aria-label',crop.name+' đã chín');
      }

      b.onclick=()=>plotClick(index);
      field.appendChild(b);
    });
  }

  function formatTime(ms){
    if(ms<=0) return 'Chín!';
    const sec=Math.ceil(ms/1000);
    return sec+'s';
  }

  function toast(message){
    let box=document.getElementById('toast');
    if(!box){
      box=document.createElement('div');
      box.id='toast';
      box.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;background:#fffdf6;border:2px solid #9b8154;border-radius:14px;padding:10px 16px;font-weight:900;box-shadow:0 8px 30px #0003;pointer-events:none';
      document.body.appendChild(box);
    }
    box.textContent=message;
    box.style.opacity='1';
    clearTimeout(box._timer);
    box._timer=setTimeout(()=>box.style.opacity='0',1800);
  }

  function showModal(title,body){
    const modal=$('modal'),mt=$('mt'),mb=$('mb');
    if(!modal) return;
    if(mt) mt.textContent=title;
    if(mb) mb.innerHTML=body;
    modal.classList.add('on');
  }

  /* ---------- Ruộng ---------- */
  function plotClick(index){
    const p=S.plots[index];

    if(p.state==='grow'){
      if(Date.now()>=p.readyAt){
        p.state='ready';
        renderPlots();
        scheduleSave();
      }else{
        const crop=CROPS[p.crop];
        showModal('🌱 '+crop.name,
          'Cây đang lớn.<br><br>⏱️ Còn <b>'+formatTime(p.readyAt-Date.now())+'</b>.');
      }
      return;
    }

    if(p.state==='ready'){
      harvest(index);
      return;
    }

    plant(index);
  }

  function plant(index){
    const crop=CROPS[S.selectedCrop];

    if(S.coins<crop.seedCost){
      showModal('💰 Không đủ xu',
        'Cần <b>🪙'+crop.seedCost+'</b> để trồng '+crop.icon+' '+crop.name+'.');
      return;
    }

    S.coins-=crop.seedCost;
    S.plots[index]={
      state:'grow',
      crop:crop.id,
      plantedAt:Date.now(),
      readyAt:Date.now()+crop.growTime
    };
    S.stats.planted++;
    addXP(1);
    scheduleSave();
    updateHUD();
  }

  function harvest(index){
    const p=S.plots[index];
    const crop=CROPS[p.crop];

    S.coins+=crop.sell;
    S.inventory[crop.id]=(S.inventory[crop.id]||0)+1;
    S.stats.harvested++;
    S.stats.earned+=crop.sell;
    addXP(crop.xp);

    S.plots[index]={
      state:'empty',
      crop:null,
      plantedAt:0,
      readyAt:0
    };

    scheduleSave();
    updateHUD();
    toast('🎉 +🪙'+crop.sell+' '+crop.icon);
  }

  /* ---------- Hạt giống ---------- */
  function openSeedShop(){
    let html='<p>Chọn loại cây muốn trồng:</p><div style="display:grid;gap:8px">';
    Object.values(CROPS).forEach(c=>{
      const selected=S.selectedCrop===c.id?' g':'';
      html+='<button class="btn'+selected+'" data-crop="'+c.id+'">'+
        c.icon+' <b>'+c.name+'</b> · 🪙'+c.seedCost+
        ' · Bán 🪙'+c.sell+'</button>';
    });
    html+='</div>';

    showModal('🌱 Hạt giống',html);

    document.querySelectorAll('[data-crop]').forEach(btn=>{
      btn.onclick=()=>{
        S.selectedCrop=btn.dataset.crop;
        scheduleSave();
        updateHUD();
        $('modal').classList.remove('on');
        toast('Đã chọn '+CROPS[S.selectedCrop].icon+' '+CROPS[S.selectedCrop].name);
      };
    });
  }

  /* ---------- Thông tin nông trại ---------- */
  function openFarmInfo(){
    showModal('📊 Nông Trại',
      '<b>⭐ Cấp:</b> '+S.level+
      '<br><b>XP:</b> '+S.xp+'/'+xpNeed(S.level)+
      '<br><b>🪙 Xu:</b> '+S.coins+
      '<br><b>💎 Kim cương:</b> '+S.gems+
      '<br><br><b>🌱 Đã trồng:</b> '+S.stats.planted+
      '<br><b>🥕 Đã thu hoạch:</b> '+S.stats.harvested+
      '<br><b>💰 Thu nhập:</b> 🪙'+S.stats.earned
    );
  }

  /* ---------- Các khu game mới ---------- */
  function openFeature(name,icon,description){
    showModal(icon+' '+name,
      '<p>'+description+'</p><p><b>🚧 Khu vực đang được xây dựng.</b></p><p>Phần này sẽ được nối vào hệ thống game chính mà không cần thay lại đăng nhập.</p>');
  }

  function addGameButtons(){
    const top=document.querySelector('.top');
    if(!top) return;

    const buttons=[
      ['🌱 Hạt giống',openSeedShop],
      ['📊 Thống kê',openFarmInfo],
      ['🏪 Kho',()=>openFeature('Kho','📦','Quản lý nông sản, vật phẩm và sức chứa.')],
      ['🐉 Đảo Rồng',()=>openFeature('Đảo Rồng','🐉','Khu nuôi rồng và nâng cấp rồng.')],
      ['🏆 Thành tựu',()=>openFeature('Thành tựu','🏆','Theo dõi thành tựu và bảng xếp hạng.')],
      ['⛏️ Đào Mỏ',()=>openFeature('Đào Mỏ','⛏️','Mini game đào mỏ, quặng và tầng hầm.')]
    ];

    buttons.forEach(([label,fn])=>{
      const id='gameBtn_'+label;
      if(document.getElementById(id)) return;
      const b=document.createElement('button');
      b.id=id;
      b.className='btn';
      b.type='button';
      b.textContent=label;
      b.onclick=fn;
      top.insertBefore(b,document.getElementById('logout'));
    });
  }

  /* ---------- Đồng hồ cây ---------- */
  setInterval(()=>{
    let changed=false;
    S.plots.forEach(p=>{
      if(p.state==='grow' && Date.now()>=p.readyAt){
        p.state='ready';
        changed=true;
      }
    });
    if(changed){
      renderPlots();
      scheduleSave();
    }else{
      renderPlots();
    }
  },1000);

  /* ---------- Modal ---------- */
  const closeModal=$('mc');
  if(closeModal) closeModal.onclick=()=>$('modal').classList.remove('on');

  const modal=$('modal');
  if(modal) modal.addEventListener('click',e=>{
    if(e.target===modal) modal.classList.remove('on');
  });

  /* ---------- Đăng xuất ---------- */
  const logout=$('logout');
  if(logout){
    logout.onclick=async()=>{
      try{
        await saveCloud();
        await auth.signOut();
      }catch(e){
        console.error(e);
      }finally{
        location.replace('./auth.html');
      }
    };
  }

  /* ---------- Khởi động ---------- */
  auth.onAuthStateChanged(async user=>{
    if(!user){
      location.replace('./auth.html');
      return;
    }

    currentUser=user;
    await loadCloud(user);

    addGameButtons();
    updateHUD();
  });

})();
(()=> {
  'use strict';

  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'nongtrai_new_v1';

  if (typeof firebase === 'undefined' || typeof FB_CONFIG === 'undefined') {
    location.replace('./login.html');
    return;
  }

  try {
    if (!firebase.apps.length) firebase.initializeApp(FB_CONFIG);
  } catch (e) {
    console.error(e);
    location.replace('./login.html');
    return;
  }

  const auth = firebase.auth();

  const CROPS = {
    carrot:{id:'carrot',name:'Cà rốt',icon:'🥕',seedCost:5,sell:12,growTime:3000,xp:3},
    corn:{id:'corn',name:'Ngô',icon:'🌽',seedCost:8,sell:19,growTime:5000,xp:5},
    tomato:{id:'tomato',name:'Cà chua',icon:'🍅',seedCost:12,sell:28,growTime:7000,xp:8},
    wheat:{id:'wheat',name:'Lúa mì',icon:'🌾',seedCost:15,sell:35,growTime:9000,xp:10}
  };

  const DEFAULT_STATE={
    version:1,coins:100,gems:0,xp:0,level:1,selectedCrop:'carrot',
    inventory:{carrot:0,corn:0,tomato:0,wheat:0},
    plots:Array.from({length:8},()=>({state:'empty',crop:null,plantedAt:0,readyAt:0})),
    stats:{planted:0,harvested:0,earned:0},
    achievements:{},
    pets:{animals:[],capacity:4,feed:0}
  };

  let S=loadState();
  let currentUser=null;
  let saveTimer=null;

  function cloneDefault(){return JSON.parse(JSON.stringify(DEFAULT_STATE));}
  function mergeState(base,data){
    if(!data||typeof data!=='object')return base;
    Object.keys(base).forEach(k=>{
      if(data[k]!==undefined){
        if(base[k]&&typeof base[k]==='object'&&!Array.isArray(base[k])&&data[k]&&typeof data[k]==='object')
          base[k]=mergeState(base[k],data[k]);
        else base[k]=data[k];
      }
    });
    return base;
  }
  function loadState(){
    try{
      const raw=localStorage.getItem(SAVE_KEY);
      if(raw)return mergeState(cloneDefault(),JSON.parse(raw));
    }catch(e){console.warn('Không đọc được save:',e);}
    return cloneDefault();
  }
  function saveLocal(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}}
  function refreshFromLocal(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return;const d=JSON.parse(raw);S=mergeState(cloneDefault(),d);updateHUD();}catch(e){}}
  function scheduleSave(){
    saveLocal();
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveCloud,500);
  }
  async function saveCloud(){
    if(!currentUser)return;
    try{
      await firebase.firestore().collection('users').doc(currentUser.uid).set({
        game:S,updatedAt:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
    }catch(e){console.warn('Cloud save:',e);}
  }
  async function loadCloud(user){
    try{
      const snap=await firebase.firestore().collection('users').doc(user.uid).get();
      if(snap.exists&&snap.data().game){
        S=mergeState(cloneDefault(),snap.data().game);
        saveLocal();
      }
    }catch(e){console.warn('Cloud load:',e);}
  }

  const ACHIEVEMENTS=[
    {id:'plant1',icon:'🌱',name:'Bắt đầu gieo trồng',desc:'Trồng cây lần đầu tiên.',need:1,reward:10,xp:5,ok:s=>s.stats.planted>=1},
    {id:'plant10',icon:'🌾',name:'Nông dân chăm chỉ',desc:'Trồng đủ 10 cây.',need:10,reward:30,xp:10,ok:s=>s.stats.planted>=10},
    {id:'harvest1',icon:'🧺',name:'Vụ mùa đầu tiên',desc:'Thu hoạch cây đầu tiên.',need:1,reward:15,xp:5,ok:s=>s.stats.harvested>=1},
    {id:'harvest20',icon:'🌽',name:'Bội thu',desc:'Thu hoạch 20 cây.',need:20,reward:60,xp:20,ok:s=>s.stats.harvested>=20},
    {id:'earn100',icon:'🪙',name:'Xu đầu tiên',desc:'Kiếm 100 Xu từ nông trại.',need:100,reward:40,xp:15,ok:s=>s.stats.earned>=100},
    {id:'earn1000',icon:'💰',name:'Kho bạc nông trại',desc:'Kiếm 1.000 Xu từ nông trại.',need:1000,reward:120,xp:35,ok:s=>s.stats.earned>=1000},
    {id:'level5',icon:'⭐',name:'Nông dân cấp 5',desc:'Đạt cấp 5.',need:5,reward:80,xp:25,ok:s=>s.level>=5},
    {id:'level10',icon:'🏅',name:'Nông dân kỳ cựu',desc:'Đạt cấp 10.',need:10,reward:180,xp:50,ok:s=>s.level>=10},
    {id:'level20',icon:'👑',name:'Bậc thầy nông trại',desc:'Đạt cấp 20.',need:20,reward:500,xp:100,ok:s=>s.level>=20}
  ];
  function achievementDone(id){return !!(S.achievements&&S.achievements[id]);}
  function achievementProgress(a){
    if(a.id==='plant1'||a.id==='plant10')return Math.min(S.stats.planted,a.need);
    if(a.id==='harvest1'||a.id==='harvest20')return Math.min(S.stats.harvested,a.need);
    if(a.id==='earn100'||a.id==='earn1000')return Math.min(S.stats.earned,a.need);
    return Math.min(S.level,a.need);
  }
  function refreshAchievements(){
    S.achievements=S.achievements||{};
    let changed=false;
    ACHIEVEMENTS.forEach(a=>{
      if(!S.achievements[a.id] && a.ok(S)){ S.achievements[a.id]={unlocked:true,claimed:false}; changed=true; }
    });
    if(changed)saveLocal();
  }
  function openAchievements(){
    refreshAchievements();
    const unlocked=ACHIEVEMENTS.filter(a=>S.achievements[a.id]?.unlocked).length;
    let html='<p><b>🏆 '+unlocked+'/'+ACHIEVEMENTS.length+' thành tựu đã mở</b></p><div style="display:grid;gap:8px">';
    ACHIEVEMENTS.forEach(a=>{
      const st=S.achievements[a.id];
      const progress=achievementProgress(a);
      const claimed=!!st?.claimed;
      html+='<div style="padding:10px;border:2px solid '+(st?'#d6a63a':'#cdbb99')+';border-radius:14px;background:'+(st?'#fff4bd':'#eee8d8')+';color:#3b2919">'+
        '<div style="display:flex;gap:8px;align-items:center"><span style="font-size:28px">'+a.icon+'</span><div style="flex:1"><b>'+a.name+'</b><br><small>'+a.desc+'</small></div><b>'+progress+'/'+a.need+'</b></div>'+
        '<div style="margin-top:6px">🎁 +🪙'+a.reward+' · ⭐'+a.xp+' XP '+(claimed?'<span>✅ Đã nhận</span>':st?'<button class="ach-claim" data-ach="'+a.id+'" style="float:right;border:0;border-radius:9px;background:#4ca54b;color:white;padding:6px 10px;font-weight:900">Nhận thưởng</button>':'<span style="float:right">🔒 Chưa mở</span>')+'</div></div>';
    });
    html+='</div>';
    showModal('🏆 Thành tựu',html);
    document.querySelectorAll('.ach-claim').forEach(btn=>btn.onclick=()=>claimAchievement(btn.dataset.ach));
  }
  function claimAchievement(id){
    refreshAchievements();
    const a=ACHIEVEMENTS.find(x=>x.id===id), st=S.achievements[id];
    if(!a||!st?.unlocked||st.claimed)return;
    st.claimed=true; S.coins+=a.reward; addXP(a.xp); scheduleSave(); updateHUD();
    toast('🏆 '+a.name+' · +🪙'+a.reward);
    openAchievements();
  }
  function xpNeed(level){return 50+(level-1)*35;}
  function addXP(amount){
    S.xp+=amount;
    let leveled=false;
    while(S.xp>=xpNeed(S.level)){S.xp-=xpNeed(S.level);S.level++;leveled=true;}
    if(leveled)toast('🎉 Lên cấp '+S.level+'!');
  }

  function updateHUD(){
    refreshAchievements();
    const coin=$('coins');
    if(coin)coin.textContent=Math.floor(S.coins);
    const gem=$('gems');
    if(gem)gem.textContent=Math.floor(S.gems);
    const levelText=document.querySelector('.player small');
    const xpBar=document.querySelector('.xp i');
    if(levelText)levelText.textContent='⭐ Lv.'+S.level+' · '+S.xp+'/'+xpNeed(S.level)+' XP';
    if(xpBar)xpBar.style.width=Math.min(100,(S.xp/xpNeed(S.level))*100)+'%';
    renderPlots();
  }

  function renderPlots(){
    const field=$('field');
    if(!field)return;
    field.innerHTML='';
    S.plots.forEach((p,index)=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='plot '+(p.state==='grow'?'grow ':'')+(p.state==='ready'?'ready':'');
      b.dataset.index=index;
      if(p.state==='empty'){
        b.innerHTML='<span>🟫</span>';
      }else if(p.state==='grow'){
        const crop=CROPS[p.crop];
        b.innerHTML='<span>'+crop.icon+'</span><small>'+formatTime(Math.max(0,p.readyAt-Date.now()))+'</small>';
      }else{
        const crop=CROPS[p.crop];
        b.innerHTML='<span>'+crop.icon+'</span><small>Thu hoạch</small>';
      }
      b.onclick=()=>plotClick(index);
      field.appendChild(b);
    });
  }

  function formatTime(ms){
    if(ms<=0)return 'Chín!';
    return Math.ceil(ms/1000)+'s';
  }

  function toast(message){
    let box=$('toast');
    if(!box){
      box=document.createElement('div');
      box.id='toast';
      box.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;background:#fffdf6;color:#3b2f1e;border:2px solid #9b8154;border-radius:14px;padding:10px 16px;font-weight:900;box-shadow:0 8px 30px #0003;pointer-events:none';
      document.body.appendChild(box);
    }
    box.textContent=message;
    box.style.opacity='1';
    clearTimeout(box._timer);
    box._timer=setTimeout(()=>box.style.opacity='0',1800);
  }

  function showModal(title,body){
    const modal=$('modal');
    if(!modal)return;
    if($('mt'))$('mt').textContent=title;
    if($('mb'))$('mb').innerHTML=body;
    modal.classList.add('on');
  }

  function plotClick(index){
    const p=S.plots[index];
    if(p.state==='grow'){
      if(Date.now()>=p.readyAt){
        p.state='ready';renderPlots();scheduleSave();
      }else{
        const crop=CROPS[p.crop];
        showModal('🌱 '+crop.name,'Cây đang lớn.<br><br>⏱️ Còn <b>'+formatTime(p.readyAt-Date.now())+'</b>.');
      }
      return;
    }
    if(p.state==='ready'){harvest(index);return;}
    plant(index);
  }

  function plant(index){
    const crop=CROPS[S.selectedCrop];
    if(S.coins<crop.seedCost){
      showModal('💰 Không đủ xu','Cần <b>🪙'+crop.seedCost+'</b> để trồng '+crop.icon+' '+crop.name+'.');
      return;
    }
    S.coins-=crop.seedCost;
    S.plots[index]={state:'grow',crop:crop.id,plantedAt:Date.now(),readyAt:Date.now()+crop.growTime};
    S.stats.planted++;addXP(1);scheduleSave();updateHUD();
  }

  function harvest(index){
    const p=S.plots[index];
    const crop=CROPS[p.crop];
    S.coins+=crop.sell;
    S.inventory[crop.id]=(S.inventory[crop.id]||0)+1;
    S.stats.harvested++;S.stats.earned+=crop.sell;addXP(crop.xp);
    S.plots[index]={state:'empty',crop:null,plantedAt:0,readyAt:0};
    scheduleSave();updateHUD();toast('🎉 +🪙'+crop.sell+' '+crop.icon);
  }

  function openSeedShop(){
    let html='<p>Chọn loại cây muốn trồng:</p><div style="display:grid;gap:8px">';
    Object.values(CROPS).forEach(c=>{
      html+='<button class="btn" data-crop="'+c.id+'">'+c.icon+' <b>'+c.name+'</b> · 🪙'+c.seedCost+' · Bán 🪙'+c.sell+'</button>';
    });
    html+='</div>';
    showModal('🌱 Hạt giống',html);
    document.querySelectorAll('[data-crop]').forEach(btn=>{
      btn.onclick=()=>{
        S.selectedCrop=btn.dataset.crop;scheduleSave();updateHUD();
        $('modal').classList.remove('on');
        toast('Đã chọn '+CROPS[S.selectedCrop].icon+' '+CROPS[S.selectedCrop].name);
      };
    });
  }

  function openFarmInfo(){
    showModal('📊 Nông Trại',
      '<b>⭐ Cấp:</b> '+S.level+
      '<br><b>XP:</b> '+S.xp+'/'+xpNeed(S.level)+
      '<br><b>🪙 Xu:</b> '+S.coins+
      '<br><b>💎 Kim cương:</b> '+S.gems+
      '<br><br><b>🌱 Đã trồng:</b> '+S.stats.planted+
      '<br><b>🥕 Đã thu hoạch:</b> '+S.stats.harvested+
      '<br><b>💰 Thu nhập:</b> 🪙'+S.stats.earned);
  }

  setInterval(()=>{
    let changed=false;
    S.plots.forEach(p=>{
      if(p.state==='grow'&&Date.now()>=p.readyAt){p.state='ready';changed=true;}
    });
    if(changed)scheduleSave();
    renderPlots();
  },1000);

  const closeModal=$('mc');
  if(closeModal)closeModal.onclick=()=>$('modal').classList.remove('on');

  const modal=$('modal');
  if(modal)modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.remove('on');});

  const logout=$('logout');
  if(logout){
    logout.onclick=async()=>{
      try{await saveCloud();await auth.signOut();}
      catch(e){console.error(e);}
      finally{location.replace('./login.html');}
    };
  }

  window.addEventListener('storage',e=>{if(e.key===SAVE_KEY)refreshFromLocal();});
  window.addEventListener('pageshow',()=>refreshFromLocal());
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshFromLocal();});

  auth.onAuthStateChanged(async user=>{
    if(!user){location.replace('./login.html');return;}
    currentUser=user;
    await loadCloud(user);
    updateHUD();
    const profileLevel=document.getElementById('profileLevel');
    if(profileLevel)profileLevel.textContent='⭐ Lv.'+S.level+' · '+S.xp+'/'+xpNeed(S.level)+' XP';
    document.body.classList.add('auth-ready');
  });

  async function openPets(){
    location.href='./chuong.html';
    return true;
    /*
    if(!window.__nongPetLoading){
      window.__nongPetLoading=new Promise((resolve,reject)=>{
        const old=document.querySelector('script[data-nong-pet]');
        if(old){ old.addEventListener('load',resolve,{once:true}); old.addEventListener('error',reject,{once:true}); return; }
        const s=document.createElement('script');
        s.src='./nuoipet/pets.js?v=20261024-newpet';
        s.async=false;
        s.dataset.nongPet='1';
        s.onload=()=>resolve();
        s.onerror=()=>reject(new Error('Không tải được Nuôi Thú'));
        document.body.appendChild(s);
      });
    }
    await window.__nongPetLoading;
    if(!window.nongPet||typeof window.nongPet.open!=='function') throw new Error('Nuôi Thú chưa khởi tạo');
    window.nongPet.open();
    return true;
    */
  }

  window.nongTrai={
    openSeeds:openSeedShop,
    openInfo:openFarmInfo,
    openPets,
    openAchievements,
    state:()=>S,
    save:scheduleSave,
    refresh:updateHUD,
    toast
  };
})();
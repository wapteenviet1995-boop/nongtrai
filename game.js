(()=> {
  'use strict';

  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'nongtrai_new_v1';

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

  function xpNeed(level){return 50+(level-1)*35;}
  function addXP(amount){
    S.xp+=amount;
    let leveled=false;
    while(S.xp>=xpNeed(S.level)){S.xp-=xpNeed(S.level);S.level++;leveled=true;}
    if(leveled)toast('🎉 Lên cấp '+S.level+'!');
  }

  function updateHUD(){
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
      finally{location.replace('./auth.html');}
    };
  }

  auth.onAuthStateChanged(async user=>{
    if(!user){location.replace('./auth.html');return;}
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
    state:()=>S,
    save:scheduleSave,
    refresh:updateHUD,
    toast
  };
})();
(()=> {
  'use strict';

  const $ = id => document.getElementById(id);
  const SAVE_KEY = 'nongtrai_new_v1';
  const CLAIM_KEY = 'nongtrai_claimed_achievements_v1';

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
    profile:{displayName:'',age:null,photoURL:''},
    pets:{animals:[],capacity:4,feed:0}
  };

  let S=loadState();
  loadClaimedAchievements();
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
  function saveClaimedAchievements(){
    try{
      const ids=Object.keys(S.achievements||{}).filter(id=>S.achievements[id]?.claimed);
      localStorage.setItem(CLAIM_KEY,JSON.stringify(ids));
    }catch(e){}
  }
  function loadClaimedAchievements(){
    try{
      const ids=JSON.parse(localStorage.getItem(CLAIM_KEY)||'[]');
      if(Array.isArray(ids)){
        S.achievements=S.achievements||{};
        ids.forEach(id=>{
          S.achievements[id]={...(S.achievements[id]||{}),unlocked:true,claimed:true};
        });
      }
    }catch(e){}
  }
  function refreshFromLocal(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)return;const d=JSON.parse(raw);S=mergeState(cloneDefault(),d);updateHUD();}catch(e){}}
  function scheduleSave(){
    saveLocal();
    clearTimeout(saveTimer);
    saveTimer=setTimeout(saveCloud,500);
  }
  async function saveCloud(){
    if(!currentUser)return;
    try{
      const db=firebase.firestore();
      await db.collection('users').doc(currentUser.uid).set({
        game:S,updatedAt:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
      await syncLeaderboard(db);
    }catch(e){console.warn('Cloud save:',e);}
  }
  function playerName(){
    if(currentUser){
      return currentUser.displayName || (currentUser.email ? currentUser.email.split('@')[0] : 'Nông Dân');
    }
    return 'Nông Dân';
  }
  function leaderboardScore(){
    return (Number(S.level)||1)*100000+(Number(S.xp)||0);
  }
  async function syncLeaderboard(db){
    if(!currentUser)return;
    try{
      await db.collection('leaderboard').doc(currentUser.uid).set({
        uid:currentUser.uid,
        name:playerName(),
        level:Number(S.level)||1,
        xp:Number(S.xp)||0,
        score:leaderboardScore(),
        updatedAt:firebase.firestore.FieldValue.serverTimestamp()
      },{merge:true});
    }catch(e){console.warn('Leaderboard save:',e);}
  }
  async function loadLeaderboard(){
    try{
      const snap=await firebase.firestore().collection('leaderboard').orderBy('score','desc').limit(20).get();
      return {rows:snap.docs.map((d,i)=>({rank:i+1,...d.data()})),error:''};
    }catch(e){
      console.warn('Leaderboard load:',e);
      return {rows:[],error:(e&&e.code)||'permission-denied'};
    }
  }
  function renderLeaderboard(rows){
    const medals=['🥇','🥈','🥉'];
    if(!rows.length)return '<div style="padding:14px;text-align:center;background:#fff7dc;border-radius:12px">Chưa có dữ liệu BXH. Hãy chơi và lưu lại để xuất hiện trên BXH.</div>';
    return '<div style="display:grid;gap:7px">'+rows.map(r=>{
      const me=currentUser&&r.uid===currentUser.uid;
      const medal=medals[r.rank-1]||(''+r.rank);
      return '<div style="display:grid;grid-template-columns:42px 1fr auto;gap:8px;align-items:center;padding:9px;border:2px solid '+(me?'#d99b35':'#d6c49f')+';border-radius:12px;background:'+(me?'#fff0b0':'#fffdf3')+';color:#3b2919">'+
        '<b style="font-size:20px;text-align:center">'+medal+'</b><div><b>'+(r.name||'Nông Dân')+(me?' ⭐':'')+'</b><br><small>Lv.'+(Number(r.level)||1)+' · '+(Number(r.xp)||0)+' XP</small></div><b>🏆 '+(Number(r.score)||0)+'</b></div>';
    }).join('')+'</div>';
  }
  async function openLeaderboard(){
    const html='<p>🏆 <b>Top 20 người chơi</b> — xếp theo cấp độ và XP.</p><div id="leaderboardList">Đang tải BXH...</div>';
    showModal('🏆 Bảng xếp hạng',html);
    const result=await loadLeaderboard();
    const box=document.getElementById('leaderboardList');
    if(box){
      box.innerHTML=result.rows.length?renderLeaderboard(result.rows):
        '<div style="padding:14px;background:#fff7dc;border-radius:12px;color:#6b3d19"><b>⚠️ Chưa tải được BXH.</b><br><small>Mã lỗi Firebase: '+result.error+'</small><br><br>Phần lưu BXH cần quyền đọc/ghi collection <b>leaderboard</b> trong Firestore Rules.</div>';
    }
  }
  async function loadCloud(user){
    try{
      const snap=await firebase.firestore().collection('users').doc(user.uid).get();
      if(snap.exists&&snap.data().game){
        const data=snap.data()||{};
        const cloudGame=data.game||{};
        const localBefore=S;
        S=mergeState(cloneDefault(),cloudGame);

        // Hợp nhất trạng thái đã nhận từ cả game.achievements, achievementClaims và máy hiện tại.
        // achievementClaims là dấu vết server bền vững để UI không hiện lại nút "Nhận thưởng".
        S.achievements=S.achievements||{};
        const localAch=localBefore.achievements||{};
        Object.keys(localAch).forEach(id=>{
          if(localAch[id]?.claimed===true){
            S.achievements[id]={...(S.achievements[id]||{}),...localAch[id],claimed:true,unlocked:true};
          }
        });
        const cloudClaims=data.achievementClaims||{};
        Object.keys(cloudClaims).forEach(id=>{
          if(cloudClaims[id]===true){
            S.achievements[id]={...(S.achievements[id]||{}),unlocked:true,claimed:true};
          }
        });

        loadClaimedAchievements();
        saveClaimedAchievements();
        saveLocal();
      }else{
        loadClaimedAchievements();
        saveLocal();
      }
    }catch(e){
      console.warn('Cloud load:',e);
      loadClaimedAchievements();
      saveLocal();
    }
  }

  const ACHIEVEMENTS=[
    {id:'warehouse5',icon:'📦',name:'Kho rộng rãi',desc:'Nâng cấp Kho ít nhất 5 lần.',need:5,reward:100,xp:25,ok:s=>getUpgradeCount(s,'warehouse')>=5},
    {id:'warehouse10',icon:'🏭',name:'Đại kho nông trại',desc:'Nâng cấp Kho ít nhất 10 lần.',need:10,reward:250,xp:60,ok:s=>getUpgradeCount(s,'warehouse')>=10},
    {id:'machine5',icon:'⚙️',name:'Máy sản xuất mạnh',desc:'Nâng cấp máy sản xuất ít nhất 5 lần.',need:5,reward:120,xp:30,ok:s=>getUpgradeCount(s,'production')>=5},
    {id:'machine10',icon:'🔧',name:'Bậc thầy sản xuất',desc:'Nâng cấp máy sản xuất ít nhất 10 lần.',need:10,reward:300,xp:70,ok:s=>getUpgradeCount(s,'production')>=10},
    {id:'dragon3',icon:'🐉',name:'Người sưu tập Rồng',desc:'Sưu tập 3 con rồng.',need:3,reward:180,xp:45,ok:s=>getDragonCount(s)>=3},
    {id:'dragon10',icon:'🐲',name:'Bộ sưu tập Rồng',desc:'Sưu tập 10 con rồng.',need:10,reward:500,xp:120,ok:s=>getDragonCount(s)>=10},
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
  function getUpgradeCount(s,type){
    const candidates=type==='warehouse'?['warehouse','storage','kho']:['production','machine','sanXuat'];
    for(const k of candidates){
      const v=s[k]?.upgrades ?? s[k]?.upgradeCount ?? s[k]?.level;
      if(Number.isFinite(Number(v))) return Number(v);
    }
    return 0;
  }
  function getDragonCount(s){
    const candidates=[s.dragons,s.dragon?.collection,s.dragon?.dragons,s.dragonCollection,s.daoRong?.dragons];
    for(const v of candidates){
      if(Array.isArray(v)) return v.length;
      if(v&&typeof v==='object') return Object.keys(v).filter(k=>v[k]&&v[k].collected!==false).length;
      if(Number.isFinite(Number(v))) return Number(v);
    }
    return 0;
  }
  function achievementDone(id){return !!(S.achievements&&S.achievements[id]);}
  function achievementProgress(a){
    if(a.id==='plant1'||a.id==='plant10')return Math.min(S.stats.planted,a.need);
    if(a.id==='harvest1'||a.id==='harvest20')return Math.min(S.stats.harvested,a.need);
    if(a.id==='earn100'||a.id==='earn1000')return Math.min(S.stats.earned,a.need);
    if(a.id.startsWith('warehouse'))return Math.min(getUpgradeCount(S,'warehouse'),a.need);
    if(a.id.startsWith('machine'))return Math.min(getUpgradeCount(S,'production'),a.need);
    if(a.id.startsWith('dragon'))return Math.min(getDragonCount(S),a.need);
    return Math.min(S.level,a.need);
  }
  function refreshAchievements(){
    S.achievements=S.achievements||{};
    let changed=false;
    ACHIEVEMENTS.forEach(a=>{
      if(!S.achievements[a.id] && a.ok(S)){ S.achievements[a.id]={unlocked:true,claimed:false}; changed=true; }
    });
    if(changed){saveLocal();saveClaimedAchievements();}
  }
  function isAchievementClaimed(id){
    if(S.achievements?.[id]?.claimed===true)return true;
    try{
      const ids=JSON.parse(localStorage.getItem(CLAIM_KEY)||'[]');
      return Array.isArray(ids)&&ids.includes(id);
    }catch(e){return false;}
  }

  function openAchievements(){
    refreshAchievements();
    const unlocked=ACHIEVEMENTS.filter(a=>S.achievements[a.id]?.unlocked).length;
    let html='<div style="display:flex;gap:7px;margin-bottom:10px"><button id="achTab" class="btn" style="flex:1">🏆 Thành tựu</button><button id="rankTab" class="btn" style="flex:1">🥇 BXH</button></div><div id="achContent"><p><b>'+unlocked+'/'+ACHIEVEMENTS.length+' thành tựu đã mở</b></p><div style="display:grid;gap:8px">';
    ACHIEVEMENTS.forEach(a=>{
      const st=S.achievements[a.id];
      const progress=achievementProgress(a);
      const claimed=isAchievementClaimed(a.id);
      html+='<div style="padding:10px;border:2px solid '+(st?'#d6a63a':'#cdbb99')+';border-radius:14px;background:'+(st?'#fff4bd':'#eee8d8')+';color:#3b2919">'+
        '<div style="display:flex;gap:8px;align-items:center"><span style="font-size:28px">'+a.icon+'</span><div style="flex:1"><b>'+a.name+'</b><br><small>'+a.desc+'</small></div><b>'+progress+'/'+a.need+'</b></div>'+
        '<div style="margin-top:6px">🎁 +🪙'+a.reward+' · ⭐'+a.xp+' XP '+(claimed?'<span>✅ Đã nhận</span>':st?'<button class="ach-claim" data-ach="'+a.id+'" style="float:right;border:0;border-radius:9px;background:#4ca54b;color:white;padding:6px 10px;font-weight:900">Nhận thưởng</button>':'<span style="float:right">🔒 Chưa mở</span>')+'</div></div>';
    });
    html+='</div></div>';
    showModal('🏆 Thành tựu & BXH',html);
    document.querySelectorAll('.ach-claim').forEach(btn=>btn.onclick=()=>claimAchievement(btn.dataset.ach));
    const at=document.getElementById('achTab'),rt=document.getElementById('rankTab');
    if(at)at.onclick=()=>openAchievements();
    if(rt)rt.onclick=()=>openLeaderboard();
  }
  let achievementClaimBusy=false;
  async function claimAchievement(id){
    if(achievementClaimBusy)return;
    const a=ACHIEVEMENTS.find(x=>x.id===id);
    if(!a)return;
    refreshAchievements();
    const st=S.achievements?.[id];
    if(!st?.unlocked||isAchievementClaimed(id))return;

    achievementClaimBusy=true;
    try{
      if(currentUser){
        const ref=firebase.firestore().collection('users').doc(currentUser.uid);
        let granted=false;
        await firebase.firestore().runTransaction(async tx=>{
          const snap=await tx.get(ref);
          const data=snap.exists?(snap.data()||{}):{};
          const game=mergeState(cloneDefault(),data.game||{});
          game.achievements=game.achievements||{};
          const claims={...(data.achievementClaims||{})};

          // Kiểm tra trên server để chống nhận trùng dù mở game trên nhiều thiết bị/tab.
          if(claims[id]===true || game.achievements[id]?.claimed===true){
            S=mergeState(cloneDefault(),game);
            S.achievements=S.achievements||{};
            S.achievements[id]={...(S.achievements[id]||{}),unlocked:true,claimed:true};
            return;
          }

          if(!game.achievements[id]?.unlocked){
            game.achievements[id]={...(game.achievements[id]||{}),unlocked:true,claimed:false};
          }

          game.achievements[id].unlocked=true;
          game.achievements[id].claimed=true;
          game.coins=(Number(game.coins)||0)+a.reward;

          let xp=Number(game.xp)||0, level=Number(game.level)||1;
          xp+=a.xp;
          while(xp>=xpNeed(level)){xp-=xpNeed(level);level++;}
          game.xp=xp;
          game.level=level;
          claims[id]=true;

          tx.set(ref,{
            game,
            achievementClaims:claims,
            updatedAt:firebase.firestore.FieldValue.serverTimestamp()
          },{merge:true});

          S=game;
          granted=true;
        });

        saveClaimedAchievements();
        saveLocal();
        updateHUD();

        if(!granted){
          S.achievements=S.achievements||{};
          S.achievements[id]={...(S.achievements[id]||{}),unlocked:true,claimed:true};
          saveClaimedAchievements();
          saveLocal();
        }
        if(granted) toast('🏆 '+a.name+' · +🪙'+a.reward);
        else toast('✅ Thành tựu này đã nhận trước đó');
      }else{
        // Chế độ cục bộ: đánh dấu trước khi cộng để reload không nhận lại.
        st.claimed=true;
        S.coins=(Number(S.coins)||0)+a.reward;
        addXP(a.xp);
        saveClaimedAchievements();
        saveLocal();
        updateHUD();
        toast('🏆 '+a.name+' · +🪙'+a.reward);
      }
    }catch(e){
      console.warn('Achievement claim:',e);
      toast('❌ Không nhận được thưởng: '+(e.code||'firebase-error'));
    }finally{
      achievementClaimBusy=false;
    }
    openAchievements();
  }

  let profileData={displayName:'',age:null,photoURL:''};
  async function loadProfile(){
    const u=currentUser;if(!u)return;
    let p={displayName:u.displayName||u.email?.split('@')[0]||'Nông Dân',age:null,photoURL:u.photoURL||''};
    try{const snap=await firebase.firestore().collection('users').doc(u.uid).get();if(snap.exists&&snap.data().profile)p={...p,...snap.data().profile};}catch(e){console.warn('Profile load:',e);}
    profileData=p;renderProfile();
  }
  function renderProfile(){
    const p=profileData||{};const av=$('profileAvatar'),fb=$('profileAvatarFallback');
    if(av){if(p.photoURL){av.src=p.photoURL;av.style.display='block';if(fb)fb.style.display='none';}else{av.style.display='none';if(fb)fb.style.display='grid';}}
    if($('profileNameView'))$('profileNameView').textContent=p.displayName||'Nông Dân';
    if($('profileAgeView'))$('profileAgeView').textContent=p.age?String(p.age)+' tuổi':'Chưa cập nhật';
    if($('profileEmailView'))$('profileEmailView').textContent=currentUser?.email||'—';
    if($('profileLevel'))$('profileLevel').textContent='Lv.'+S.level+' · '+S.xp+'/'+xpNeed(S.level)+' XP';
    if($('profileCoins'))$('profileCoins').textContent=Math.floor(S.coins);
    if($('profileGems'))$('profileGems').textContent=Math.floor(S.gems);
    const input=$('profileNameInput'),age=$('profileAgeInput');if(input)input.value=p.displayName||'';if(age)age.value=p.age||'';
  }
  function setProfileEdit(on){
    ['profileNameInput','profileAgeInput'].forEach(id=>{const e=$(id);if(e)e.style.display=on?'block':'none';});
    ['profileNameView','profileAgeView'].forEach(id=>{const e=$(id);if(e)e.style.display=on?'none':'block';});
    if($('profileEditBtn'))$('profileEditBtn').style.display=on?'none':'block';
    if($('profileSave'))$('profileSave').style.display=on?'block':'none';
    if($('profileCancel'))$('profileCancel').style.display=on?'block':'none';
  }
  async function saveProfile(){
    if(!currentUser)return;
    const name=($('profileNameInput')?.value||'').trim()||'Nông Dân';
    const ageRaw=Number($('profileAgeInput')?.value);const age=Number.isFinite(ageRaw)&&ageRaw>=1&&ageRaw<=120?Math.floor(ageRaw):null;
    try{
      await currentUser.updateProfile({displayName:name});
      profileData={...profileData,displayName:name,age,photoURL:currentUser.photoURL||profileData.photoURL||''};
      await firebase.firestore().collection('users').doc(currentUser.uid).set({email:currentUser.email,profile:profileData,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      saveLocal();renderProfile();setProfileEdit(false);updateHUD();await syncLeaderboard(firebase.firestore());toast('✅ Đã lưu hồ sơ');
    }catch(e){console.warn('Profile save:',e);toast('❌ Không lưu được hồ sơ');}
  }
  function openProfile(){renderProfile();setProfileEdit(false);$('profilePanel')?.classList.add('on');}
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
    const topName=document.querySelector('.player b');
    if(topName)topName.textContent=profileData?.displayName||currentUser?.displayName||currentUser?.email?.split('@')[0]||'Nông Dân';
    const topAvatar=document.querySelector('.player .avatar');
    if(topAvatar){if(profileData?.photoURL){topAvatar.innerHTML='<img src="'+profileData.photoURL.replace(/"/g,'&quot;')+'" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">';}else topAvatar.textContent='👨‍🌾';}
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

  $('profileBtn')?.addEventListener('click',openProfile);
  $('profileDockBtn')?.addEventListener('click',openProfile);
  $('profileClose')?.addEventListener('click',()=>{setProfileEdit(false);$('profilePanel')?.classList.remove('on');});
  $('profileCancel')?.addEventListener('click',()=>{renderProfile();setProfileEdit(false);});
  $('profileEditBtn')?.addEventListener('click',()=>setProfileEdit(true));
  $('profileSave')?.addEventListener('click',saveProfile);
  $('profilePanel')?.addEventListener('click',e=>{if(e.target===$('profilePanel'))$('profilePanel').classList.remove('on');});

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
    await loadProfile();
    await syncLeaderboard(firebase.firestore());
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
    openLeaderboard,
    checkAchievements:refreshAchievements,
    state:()=>S,
    save:scheduleSave,
    refresh:updateHUD,
    toast
  };
})();
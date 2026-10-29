(()=>{'use strict';
const MAIN_KEY='nongtrai_new_v1',DRAGON_KEY='nongtrai_dragons_v1';
const TYPES={
 ice:{name:'Rồng Băng',icon:'❄️',img:'../img/rong-bang.png',lv:15,rarity:'Hiếm',power:'Giảm thời gian bảo quản',cls:'ice'},
 fire:{name:'Rồng Lửa',icon:'🔥',img:'../img/rong-lua.png',lv:18,rarity:'Hiếm',power:'Tăng tốc sản xuất',cls:'fire'},
 grass:{name:'Rồng Cỏ',icon:'🌿',img:'../img/rong-co.png',lv:15,rarity:'Thường',power:'Tăng sản lượng cây trồng',cls:'grass'},
 gem:{name:'Rồng Ngọc',icon:'💎',img:'../img/rong-ngoc.png',lv:35,rarity:'Huyền thoại',power:'Tăng phần thưởng nhiệm vụ',cls:'gem'}
};
let G=load(MAIN_KEY,{coins:100,gems:0,level:1}),D=load(DRAGON_KEY,{owned:{grass:1},eggs:[],selected:'grass'});
const field=document.getElementById('dragonField'),panel=document.getElementById('panel'),body=document.getElementById('panelBody');
function load(k,d){try{return Object.assign(d,JSON.parse(localStorage.getItem(k)||'{}'))}catch(e){return d}}
function save(){localStorage.setItem(DRAGON_KEY,JSON.stringify(D))}
function hud(){document.getElementById('coins').textContent=Math.floor(Number(G.coins)||0);document.getElementById('gems').textContent=Math.floor(Number(G.gems)||0)}
function toast(s){const x=document.getElementById('toast');x.textContent=s;x.style.opacity=1;clearTimeout(x.t);x.t=setTimeout(()=>x.style.opacity=0,1600)}
function makeDragon(id,d,i){
 const el=document.createElement('button');el.className='dragon dragon-'+d.cls+(G.level<d.lv?' locked':'');el.dataset.id=id;
 el.style.left=(8+(i%2)*55)+'%';el.style.top=(8+Math.floor(i/2)*42)+'%';
 el.innerHTML='<span class="sprite"><img src="'+d.img+'" alt="'+d.name+'"><span class="fallback" hidden>'+d.icon+'</span></span><label>'+d.icon+' '+d.name+'</label>';
 const img=el.querySelector('img'),fb=el.querySelector('.fallback');img.onerror=()=>{img.hidden=true;fb.hidden=false};
 el.onclick=()=>openDragon(id);field.appendChild(el);wander(el);return el
}
function wander(el){const go=()=>{if(!document.body.contains(el))return;const old=parseFloat(el.style.left)||20,nx=5+Math.random()*72,ny=8+Math.random()*66;el.classList.toggle('flip',nx>old);el.classList.add('moving');el.style.left=nx+'%';el.style.top=ny+'%';setTimeout(()=>el.classList.remove('moving'),3200);el._t=setTimeout(go,3800+Math.random()*2200)};el._t=setTimeout(go,500+Math.random()*1500)}
function render(){field.innerHTML='';Object.entries(TYPES).forEach(([id,d],i)=>makeDragon(id,d,i));hud()}
function openDragon(id){const d=TYPES[id];if(G.level<d.lv){toast('🔒 Mở '+d.name+' ở cấp '+d.lv);return}
 const owned=Number(D.owned?.[id])||0;
 body.innerHTML='<div class="dragon-info"><h2>'+d.icon+' '+d.name+'</h2><img class="big" src="'+d.img+'" onerror="this.style.display=\'none\'"><div class="stat">⭐ Độ hiếm: '+d.rarity+'</div><div class="stat">🔓 Cấp mở: '+d.lv+'</div><div class="stat">✨ '+d.power+'</div><div class="stat">🐉 Đang sở hữu: '+owned+'</div><p>Rồng sẽ đi lại tự động trên Đảo Rồng. Hệ thống ấp trứng sẽ dùng để mở thêm rồng sau.</p></div>';panel.classList.add('on')}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{const t=b.dataset.tab;if(t==='dragons'){toast('🐉 Đang xem rồng trên đảo');return}const names={eggs:'🥚 Ấp trứng',explore:'🗺️ Thám hiểm',book:'📖 Bộ sưu tập'};body.innerHTML='<h2>'+names[t]+'</h2><p>Chức năng đã dựng sẵn để bổ sung khi bạn tải các rồng và trứng tiếp theo.</p>';panel.classList.add('on')});
document.getElementById('close').onclick=()=>panel.classList.remove('on');panel.onclick=e=>{if(e.target===panel)panel.classList.remove('on')};document.getElementById('back').onclick=()=>location.href='../game.html';
window.addEventListener('storage',e=>{if(e.key===MAIN_KEY){G=load(MAIN_KEY,G);hud()}});render();
})();
(()=>{'use strict';
const root=document.createElement('div');root.id='pvp-root';
root.innerHTML='<button id="pvp-open" type="button">⚔️ PvP Online</button><div id="pvp-overlay" aria-hidden="true"><section id="pvp-card"><header><b>🐉 Đấu trường PvP</b><button id="pvp-close" aria-label="Đóng">×</button></header><main id="pvp-content"></main></section></div>';
document.body.appendChild(root);
const $=id=>document.getElementById(id);
const projectId='nongtrai-b8a27';
const elements={fire:'Lửa',leaf:'Cỏ',water:'Nước',ice:'Băng',lightning:'Sấm Sét',dark:'Hắc Ám',gem:'Ngọc'};
const images={fire:'rong_lua2.png',leaf:'rong_co2.png',water:'rong_nuoc2.png',ice:'rong_bang2.png',lightning:'rong_set2.png',dark:'rong_hacam2.png',gem:'rong_ngoc2.png'};
let socket=null,uid='',status='Chọn cách tham gia',match=null,mode='home',selectedElement='fire',rankRows=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function show(){ $('pvp-overlay').classList.add('show');$('pvp-overlay').setAttribute('aria-hidden','false');render(); }
function hide(){ $('pvp-overlay').classList.remove('show');$('pvp-overlay').setAttribute('aria-hidden','true'); }
$('pvp-open').addEventListener('click',async()=>{show();try{await connect()}catch(e){status=e.message||'Không kết nối được';render()}});
$('pvp-close').addEventListener('click',hide);
$('pvp-overlay').addEventListener('click',e=>{if(e.target===$('pvp-overlay'))hide()});
function getUser(){
 if(!window.firebase||!window.FB_CONFIG) return Promise.reject(new Error('Thiếu cấu hình Firebase'));
 if(!firebase.apps.length)firebase.initializeApp(FB_CONFIG);
 const auth=firebase.auth();
 if(auth.currentUser)return Promise.resolve(auth.currentUser);
 return new Promise((resolve,reject)=>{
  let off=()=>{};off=auth.onAuthStateChanged(user=>{off();if(user)resolve(user);else reject(new Error('Bạn cần đăng nhập lại'))},reject);
 });
}
async function connect(){
 if(socket&&socket.readyState===WebSocket.OPEN)return;
 if(socket&&socket.readyState===WebSocket.CONNECTING){await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',()=>reject(new Error('Không kết nối được máy chủ PvP')),{once:true})});return}
 const user=await getUser(),token=await user.getIdToken();
 const url=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/api/pvp/ws';
 status='Đang kết nối máy chủ...';render();
 const ws=new WebSocket(url,['firebase',token]);socket=ws;
 ws.onopen=()=>{status='Đã kết nối Đảo Rồng';render()};
 ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}handle(m)};
 ws.onclose=()=>{if(socket===ws){socket=null;status='Mất kết nối máy chủ. Hãy kết nối lại.';render()}};
 ws.onerror=()=>{status='Máy chủ PvP chưa sẵn sàng';render()};
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',()=>reject(new Error('Không kết nối được máy chủ PvP')),{once:true})});
}
function send(o){if(socket&&socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify(o));else{status='Chưa kết nối máy chủ';render()}}
function handle(m){
 if(m.type==='connected'){uid=m.uid;status='Đã kết nối · '+m.name}
 else if(m.type==='queued'){status=m.message;mode='queue'}
 else if(m.type==='queue_cancelled'){status='Đã hủy tìm trận';mode='home'}
 else if(m.type==='invite_sent'){status='Đã gửi lời mời, chờ phản hồi';}
 else if(m.type==='invite_received'){
  const yes=confirm(m.fromName+' mời bạn đấu PvP. Chấp nhận?');
  if(yes)send({type:'accept_invite',fromUid:m.fromUid,element:selectedElement});
  else send({type:'decline_invite'});
 }
 else if(m.type==='invite_declined'){status=m.name+' đã từ chối lời mời'}
 else if(m.type==='match_start'){match={id:m.matchId,players:m.players,turnUid:m.turnUid,over:false,log:m.note};mode='match';status='Trận đấu bắt đầu!'}
 else if(m.type==='match_update'&&match){match.players=m.players;match.turnUid=m.turnUid;match.log=m.log}
 else if(m.type==='match_end'&&match){match.players=m.players;match.over=true;match.winnerUid=m.winnerUid;match.log=m.message;status=m.winnerUid===uid?'Bạn thắng! +3 điểm BXH':'Trận đấu kết thúc'}
 else if(m.type==='error'){status=m.message}
 render();
}
function elementPicker(){return '<label class="pvp-label">Nguyên tố rồng <select id="pvp-element">'+Object.keys(elements).map(k=>'<option value="'+k+'" '+(selectedElement===k?'selected':'')+'>'+elements[k]+'</option>').join('')+'</select></label>'}
function home(){
 $('pvp-content').innerHTML='<p class="pvp-status">'+esc(status)+'</p>'+elementPicker()+
 '<button class="pvp-action" id="pvp-find">🔎 Ghép trận ngẫu nhiên</button>'+
 '<button class="pvp-action secondary" id="pvp-invite">✉️ Mời bạn bè bằng UID</button>'+
 '<button class="pvp-action secondary" id="pvp-rank">🏆 Bảng xếp hạng PvP</button>'+
 '<p class="pvp-hint">Cả hai người phải cùng online tại Đảo Rồng. Trận đấu cân bằng: 100 máu, 30 mana; mỗi lượt được đánh, dùng chiêu hoặc phòng thủ. Thắng nhận 3 điểm BXH.</p>';
 $('pvp-element').addEventListener('change',e=>selectedElement=e.target.value);
 $('pvp-find').onclick=async()=>{try{await connect();selectedElement=$('pvp-element').value;mode='queue';status='Đang tìm đối thủ...';send({type:'queue',element:selectedElement});render()}catch(e){status=e.message;render()}};
 $('pvp-invite').onclick=async()=>{try{await connect();selectedElement=$('pvp-element').value;const toUid=prompt('Nhập UID của bạn bè. Người đó cần đang online ở Đảo Rồng:');if(toUid)send({type:'invite',toUid:toUid.trim(),element:selectedElement})}catch(e){status=e.message;render()}};
 $('pvp-rank').onclick=loadRank;
}
function queueView(){
 $('pvp-content').innerHTML='<p class="pvp-status">'+esc(status)+'</p><div class="pvp-wait">🐉 Đang tìm người chơi online...</div><button class="pvp-action secondary" id="pvp-cancel">Hủy tìm trận</button><button class="pvp-action secondary" id="pvp-back">Quay lại</button>';
 $('pvp-cancel').onclick=()=>{send({type:'cancel_queue'});mode='home';render()};
 $('pvp-back').onclick=()=>{send({type:'cancel_queue'});mode='home';render()};
}
function matchView(){
 const ps=match.players||[],me=ps.find(p=>p.uid===uid),op=ps.find(p=>p.uid!==uid),myTurn=match.turnUid===uid&&!match.over;
 const card=(p,mine)=>p?'<article class="pvp-fighter"><img src="rong-tien-hoa/'+images[p.element]+'" alt="Rồng"><b>'+esc(p.name)+(mine?' (Bạn)':'')+'</b><span>❤️ '+p.hp+'/'+p.maxHp+'</span><i><u style="width:'+Math.max(0,p.hp)/p.maxHp*100+'%"></u></i><small>⚡ '+p.mana+' mana</small></article>':'';
 $('pvp-content').innerHTML='<div class="pvp-fighters">'+card(me,true)+'<strong class="pvp-vs">VS</strong>'+card(op,false)+'</div><p class="pvp-log">'+esc(match.log)+'</p><p class="pvp-status">'+(match.over?'Trận đấu đã kết thúc':myTurn?'Đến lượt bạn!':'Đang chờ đối thủ ra đòn...')+'</p>'+
 (match.over?'<button class="pvp-action" id="pvp-again">Đấu trận khác</button><button class="pvp-action secondary" id="pvp-rank">🏆 Xem BXH PvP</button>':'<div class="pvp-moves">'+(myTurn?'<button id="pvp-attack">⚔️ Đánh<br>+10 mana</button><button id="pvp-special">✨ Chiêu<br>-20 mana</button><button id="pvp-defend">🛡️ Thủ<br>+8 máu</button>':'<button disabled>⏳ Chờ đối thủ...</button>')+'</div><button class="pvp-action secondary" id="pvp-leave">Rời trận</button>');
 if(myTurn){$('pvp-attack').onclick=()=>send({type:'move',action:'attack'});$('pvp-special').onclick=()=>send({type:'move',action:'special'});$('pvp-defend').onclick=()=>send({type:'move',action:'defend'})}
 if(match.over){$('pvp-again').onclick=()=>{match=null;mode='home';render()};$('pvp-rank').onclick=loadRank}
 else $('pvp-leave').onclick=()=>send({type:'leave_match'});
}
async function loadRank(){
 mode='rank';$('pvp-content').innerHTML='<p class="pvp-status">Đang tải bảng xếp hạng...</p>';
 try{const r=await fetch('/api/pvp/leaderboard');if(!r.ok)throw new Error('Máy chủ PvP chưa được triển khai');const data=await r.json();rankRows=data.rows||[]}
 catch(e){status=e.message;rankRows=[]}
 render();
}
function rankView(){
 $('pvp-content').innerHTML='<h3>🏆 Top 50 PvP</h3><p class="pvp-status">'+esc(status)+'</p><div class="pvp-ranks">'+(rankRows.length?rankRows.map((r,i)=>'<div><b>'+(i+1)+'. '+esc(r.name)+'</b><span>🏆 '+r.points+' điểm · '+r.wins+' thắng · '+r.losses+' thua</span></div>').join(''):'Chưa có dữ liệu PvP.')+'</div><button class="pvp-action secondary" id="pvp-back">‹ Quay lại</button>';
 $('pvp-back').onclick=()=>{mode='home';render()};
}
function render(){
 if(!$('pvp-overlay').classList.contains('show'))return;
 if(mode==='match'&&match)return matchView();
 if(mode==='queue')return queueView();
 if(mode==='rank')return rankView();
 home();
}
window.addEventListener('beforeunload',()=>{if(socket)socket.close()});
})();
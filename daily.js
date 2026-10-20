/* ===== NHIỆM VỤ NGÀY: lưu tiến độ trong dữ liệu người chơi ===== */
const DQ=[
 {id:'harvest',icon:'🌾',name:'Thu hoạch nông sản',desc:'Thu hoạch 3 ô cây',goal:3,reward:[80,0]},
 {id:'animal',icon:'🐮',name:'Chăm sóc vật nuôi',desc:'Thu sản phẩm từ vật nuôi 2 lần',goal:2,reward:[60,0]},
 {id:'chat',icon:'💬',name:'Giao lưu cộng đồng',desc:'Gửi 1 tin nhắn cộng đồng',goal:1,reward:[40,0]},
 {id:'market',icon:'🛍️',name:'Ghé thăm khu chợ',desc:'Mua 1 món ở chợ người chơi',goal:1,reward:[50,0]}
];
const dqDay=()=>new Date().toLocaleDateString('en-CA');
function dqState(){
 const day=dqDay();
 if(!S.dq||S.dq.day!==day) S.dq={day,progress:{},claimed:{}};
 S.dq.progress=S.dq.progress||{};S.dq.claimed=S.dq.claimed||{};
 return S.dq;
}
function dqInc(k,n=1){const d=dqState();d.progress[k]=Math.min(999,(d.progress[k]||0)+n);if(typeof save==='function')save()}
function dqReward(id){
 const q=DQ.find(x=>x.id===id),d=dqState();
 if(!q||d.claimed[id]||(d.progress[id]||0)<q.goal)return;
 d.claimed[id]=1;S.c+=q.reward[0];if(q.reward[1])add('gem',q.reward[1]);
 hud();save();if(typeof cloudSave==='function')cloudSave(true);
 toast('🎁 Nhận thưởng nhiệm vụ: +'+q.reward[0]+' xu');openSoc('daily');
}
SOCX.daily={label:'📅 Nhiệm vụ ngày',local:true,
 badge(){const d=dqState();return DQ.some(q=>!d.claimed[q.id]&&(d.progress[q.id]||0)>=q.goal)?' !':''},
 body(){const d=dqState();let h='<div class="dq-intro">Hoàn thành nhiệm vụ để nhận xu. Tiến độ làm mới mỗi ngày.</div>';
  h+='<div class="dq-list">';
  DQ.forEach(q=>{const n=Math.min(q.goal,d.progress[q.id]||0),done=!!d.claimed[q.id],ready=n>=q.goal;
   h+='<div class="dq-item"><div class="dq-icon">'+q.icon+'</div><div class="dq-info"><b>'+q.name+'</b><small>'+q.desc+'</small><div class="dq-track"><i style="width:'+Math.floor(n/q.goal*100)+'%"></i></div><small>'+n+'/'+q.goal+' · 🎁 '+q.reward[0]+' xu</small></div>'+(done?'<span class="dq-done">✓</span>':ready?'<button class="btn g" data-dq="'+q.id+'">Nhận</button>':'<span class="dq-count">'+n+'/'+q.goal+'</span>')+'</div>';
  });
  return h+'</div>'},
 init(){$('md').querySelectorAll('[data-dq]').forEach(b=>b.onclick=()=>dqReward(b.dataset.dq))}
};
/* Theo dõi một số hành động hiện có mà không thay thế logic gốc. */
{const _cp=clickPlot;clickPlot=(i,el)=>{const p=S.p[i],ready=!!(p&&p.u&&p.c&&Date.now()>=p.e);_cp(i,el);if(ready&&S.p[i]&&!S.p[i].c)dqInc('harvest')}}
{const _rc=rclick;rclick=(a,el)=>{const v=rvar(a),p=v?v.p:null,b=p?inv(p):0;_rc(a,el);if(p&&inv(p)>b)dqInc('animal')}}
{const _sc=sendChat;sendChat=async()=>{const i=$('cin'),before=i&&i.value.trim();await _sc();if(before)dqInc('chat')}}
{const _mb=mBuy;mBuy=async id=>{const before=S.c;await _mb(id);if(S.c<before)dqInc('market')}}

(()=> {
  if(typeof firebase==='undefined'||typeof FB_CONFIG==='undefined'){location.replace('./auth.html');return}
  try{if(!firebase.apps.length)firebase.initializeApp(FB_CONFIG)}catch(e){location.replace('./auth.html');return}
  const auth=firebase.auth();
  const $=id=>document.getElementById(id);
  let coins=100;
  const plots=Array.from({length:8},()=>({state:'empty'}));
  function render(){
    $('coins').textContent=coins;
    $('field').innerHTML='';
    plots.forEach((p,i)=>{
      const b=document.createElement('button');b.className='plot '+(p.state==='grow'?'grow ':'')+(p.state==='ready'?'ready':'');
      b.textContent=p.state==='empty'?'🟫':p.state==='grow'?'🌱':'🥕';b.title='Ô '+(i+1);
      b.onclick=()=>clickPlot(i);$('field').appendChild(b);
    });
  }
  function clickPlot(i){
    const p=plots[i];
    if(p.state==='empty'){
      if(coins<5)return show('Thiếu xu','Cần 🪙5 xu để trồng cà rốt.');
      coins-=5;p.state='grow';render();setTimeout(()=>{p.state='ready';render()},3000);
    }else if(p.state==='ready'){coins+=12;p.state='empty';render();show('Thu hoạch!','Bạn nhận được 🪙12 xu.');}
    else show('Đang lớn 🌱','Cây sẽ chín sau một chút.');
  }
  function show(t,b){$('mt').textContent=t;$('mb').textContent=b;$('modal').classList.add('on')}
  $('mc').onclick=()=> $('modal').classList.remove('on');
  $('logout').onclick=()=>auth.signOut().then(()=>location.replace('./auth.html'));
  auth.onAuthStateChanged(u=>{if(!u)location.replace('./auth.html');else render()});
})();
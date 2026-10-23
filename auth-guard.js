/* Bắt buộc Firebase Authentication trước khi vào game.
   File này phải được tải sau config.js + firebase app/auth compat và trước game scripts. */
(()=>{if(typeof firebase==='undefined'||typeof FB_CONFIG==='undefined'||!FB_CONFIG){location.replace('./auth.html');return}
 try{
   if(!firebase.apps.length)firebase.initializeApp(FB_CONFIG);
   const auth=firebase.auth();
   document.documentElement.style.visibility='hidden';
   let done=false;
   const timer=setTimeout(()=>{if(!done)location.replace('./auth.html')},8000);
   auth.onAuthStateChanged(user=>{
     done=true;clearTimeout(timer);
     if(!user){location.replace('./auth.html');return}
     window.NONGTRAI_AUTH_USER=user;
     document.documentElement.style.visibility='visible';
     window.dispatchEvent(new CustomEvent('nongtrai-auth-ready',{detail:{uid:user.uid}}));
   },()=>{done=true;clearTimeout(timer);location.replace('./auth.html')});
 }catch(e){location.replace('./auth.html')}
})();
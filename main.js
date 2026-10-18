/* ===== KHỞI ĐỘNG GAME — file này tải cuối cùng ===== */
$('soc').onclick=()=>{openSoc();if(FB_CONFIG&&!fb)fbInit().then(()=>openSoc())};
if(FB_CONFIG)fbInit();

{const bv=$('bgv'),pl=()=>{if(bv.paused)bv.play().catch(()=>{})};pl();addEventListener('pointerdown',pl);document.addEventListener('visibilitychange',pl)}
fit();hud();fit();tick();center(2);setInterval(tick,500);

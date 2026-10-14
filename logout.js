/* Local prototype navigation; no server session is connected. */
(() => {
 const key='orchestra-demo-signed-out';
 const redirect=()=>location.replace('./login.html');
 document.querySelector('#logoutButton').addEventListener('click',()=>{
  try{localStorage.setItem(key,'true')}catch{}
  document.querySelectorAll('audio,video').forEach(media=>media.pause());
  redirect();
 });
 try{if(localStorage.getItem(key)==='true')redirect()}catch{}
 window.addEventListener('pageshow',()=>{try{if(localStorage.getItem(key)==='true')redirect()}catch{}});
})();

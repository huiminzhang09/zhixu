/* Local prototype navigation; no server session is connected. */
(() => {
 const key='orchestra-demo-signed-out';
 const redirect=()=>location.replace('./login.html');
 const signedOut=()=>localStorage.getItem(key)==='true'||(localStorage.getItem('orchestra-keep-login')==='false'&&!sessionStorage.getItem('orchestra-demo-password-verifier'));
 document.querySelector('#logoutButton').addEventListener('click',()=>{
  try{sessionStorage.removeItem('orchestra-demo-password-verifier')}catch{}
  try{localStorage.setItem(key,'true')}catch{}
  document.querySelectorAll('audio,video').forEach(media=>media.pause());
  redirect();
 });
 try{if(signedOut())redirect()}catch{}
 window.addEventListener('pageshow',()=>{try{if(signedOut())redirect()}catch{}});
})();

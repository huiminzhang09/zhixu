/* Demonstration only: credentials are validated locally and never persisted. */
(() => {
 const form=document.querySelector('form'),mode=form.dataset.mode;
 const account=form.elements.account,password=form.elements.password,confirm=form.elements.confirm;
 const message=document.querySelector('#message');
 // These memberships mirror the prototype's existing workspace switcher.
 const defaultOrganizations=[
  {id:'orchestra-studio',name:'Orchestra Studio',role:'团队最高管理员'},
  {id:'sound-lab',name:'Sound Lab',role:'团队管理员'},
  {id:'indie-makers',name:'Indie Makers',role:'生产者'}
 ];
 let organizations=[];
 function membershipsForAccount(loginAccount){
  const initial=loginAccount==='18500760312'?[]:defaultOrganizations;
  const stored=JSON.parse(localStorage.getItem('orchestra-account-organizations:'+loginAccount)||'null');
  return Array.isArray(stored)?stored:initial;
 }
 function enterOrganization(organization){
  try{
   localStorage.setItem('orchestra-workspace',organization.id);
   localStorage.removeItem('orchestra-demo-signed-out');
  }catch{show('无法保存登录状态，请允许浏览器使用本地存储后重试。');return}
  location.replace('./index.html');
 }
 function chooseOrganization(){
  if(organizations.length===1){enterOrganization(organizations[0]);return}
  if(!organizations.length){try{localStorage.removeItem('orchestra-demo-signed-out')}catch{}location.replace('./index.html');return}
  try{localStorage.setItem('orchestra-demo-signed-out','true')}catch{}
  form.hidden=true;
  document.querySelector('.auth-links').hidden=true;
  document.querySelector('h1').textContent='选择组织';
  document.querySelector('.intro').textContent='请选择一个组织进行登录';
  const selection=document.createElement('form');selection.className='organization-selection';
  const group=document.createElement('fieldset');
  const legend=document.createElement('legend');legend.textContent='可登录的组织';group.append(legend);
  organizations.forEach(organization=>{
   const label=document.createElement('label');label.className='organization-option';
   const radio=document.createElement('input');radio.type='radio';radio.name='organization';radio.value=organization.id;radio.required=true;
   const details=document.createElement('span');const name=document.createElement('b');name.textContent=organization.name;
   const role=document.createElement('small');role.textContent=organization.role;details.append(name,role);label.append(radio,details);group.append(label);
  });
  const submit=document.createElement('button');submit.type='submit';submit.className='primary';submit.textContent='登录所选组织';submit.disabled=true;
  const back=document.createElement('a');back.href='./login.html';back.className='organization-back';back.textContent='返回登录';
  selection.append(group,submit,back);form.after(selection);
  selection.addEventListener('change',()=>{submit.disabled=!selection.elements.organization.value});
  selection.addEventListener('submit',event=>{event.preventDefault();const chosen=organizations.find(item=>item.id===selection.elements.organization.value);if(chosen)enterOrganization(chosen)});
  group.querySelector('input').focus();
 }
 let codeIssued=false,timer;
 const show=(text,success=false)=>{message.textContent=text;message.classList.toggle('success',success)};
 function validateAccount(){
  account.value=account.value.trim();
  const value=account.value;
  const phone=/^1[3-9]\d{9}$/.test(value);
  account.setCustomValidity(!value?'请输入手机号。':phone?'':'请输入有效的十一位手机号。');
  return account.reportValidity();
 }
 account.addEventListener('blur',()=>{account.value=account.value.trim()});
 form.addEventListener('input',()=>{show('');if(confirm)confirm.setCustomValidity('');});
 const send=document.querySelector('#sendCode');
 if(send)send.addEventListener('click',()=>{
  if(send.disabled||!validateAccount())return;
  codeIssued=true;document.querySelector('#codeHint').textContent='演示验证码：123456（未发送真实短信）';
  let seconds=60;send.disabled=true;send.textContent=`${seconds}秒后重试`;
  clearInterval(timer);timer=setInterval(()=>{seconds--;send.textContent=seconds?`${seconds}秒后重试`:'发送验证码';if(!seconds){clearInterval(timer);send.disabled=false}},1000);
 });
 account.addEventListener('input',()=>{account.setCustomValidity('');codeIssued=false;if(send){clearInterval(timer);send.disabled=false;send.textContent='发送验证码';document.querySelector('#codeHint').textContent=''}});
 form.addEventListener('submit',event=>{
  event.preventDefault();if(!validateAccount())return;
  if(!password.value.trim()){show('密码不能全部为空格。');password.focus();return}
  if(confirm&&confirm.value!==password.value){confirm.setCustomValidity('两次输入的密码不一致，请重新输入。');confirm.reportValidity();return}
  if((mode==='reset-password'||mode==='register')&&(!codeIssued||form.elements.code.value!=='123456')){show('请先获取演示验证码，并填写正确的验证码。');form.elements.code.focus();return}
  if(mode==='login'){
   try{
    const loginAccount=account.value.trim().replace(/^\+?86(?=1\d{10}$)/,'');
    organizations=membershipsForAccount(loginAccount);
    localStorage.setItem('orchestra-demo-account',loginAccount);
    localStorage.setItem('orchestra-login-organizations',JSON.stringify(organizations));
    localStorage.removeItem('orchestra-workspace');
   }catch{show('无法保存登录状态，请允许本地存储后重试。');return}
   form.reset();chooseOrganization();return;
  }
  form.reset();codeIssued=false;
  if(send){clearInterval(timer);send.disabled=false;send.textContent='发送验证码';document.querySelector('#codeHint').textContent=''}
  show(mode==='register'?'注册流程演示完成，未创建真实账号。请点击“返回登录”继续。':'密码修改流程演示完成，未修改真实账号。请点击“返回登录”继续。',true);
 });
})();

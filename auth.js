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
 let organizations=[],loginAccount='',selectionMessage=null;
 function membershipsForAccount(loginAccount){
  const initial=loginAccount==='18500760312'?[]:defaultOrganizations;
  const stored=JSON.parse(localStorage.getItem('orchestra-account-organizations:'+loginAccount)||'null');
  return Array.isArray(stored)?stored:initial;
 }
 function enterOrganization(organization,newMemberships=null,feedback=null){
  const memberships=newMemberships||organizations,accountKey='orchestra-account-organizations:'+loginAccount;
  if(!organization&&memberships.length){show('请选择一个企业进行登录。');return false}
  const keys=['orchestra-login-organizations','orchestra-workspace','orchestra-demo-signed-out',...(newMemberships?[accountKey]:[])];
  let previous=[];
  try{
   previous=keys.map(key=>[key,localStorage.getItem(key)]);
   if(newMemberships)localStorage.setItem(accountKey,JSON.stringify(memberships));
   localStorage.setItem('orchestra-login-organizations',JSON.stringify(memberships));
   if(organization)localStorage.setItem('orchestra-workspace',organization.id);
   else localStorage.removeItem('orchestra-workspace');
   localStorage.removeItem('orchestra-demo-signed-out');
  }catch{
   previous.forEach(([key,value])=>{try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value)}catch{}});
   const error='无法保存登录状态，请允许浏览器使用本地存储后重试。';
   if(feedback)feedback.textContent=error;else show(error);
   return false;
  }
  organizations=memberships;
  location.replace('./index.html');
  return true;
 }
 function openCreateOrganization(){
  if(document.querySelector('.organization-create-dialog[open]'))return;
  const dialog=document.createElement('dialog');dialog.className='organization-create-dialog';dialog.setAttribute('aria-labelledby','createOrganizationTitle');
  dialog.innerHTML='<form novalidate><header><h2 id="createOrganizationTitle">新建企业</h2><button type="button" class="organization-dialog-close" data-close aria-label="关闭新建企业弹窗">×</button></header><p class="organization-create-intro">创建成功后，将以管理员身份进入该企业。</p><label for="organizationName">企业名称 <span class="required-mark">*</span></label><input id="organizationName" name="organizationName" placeholder="请输入企业名称" required maxlength="50" autocomplete="organization" aria-describedby="organizationNameHint createOrganizationMessage" autofocus><p class="hint" id="organizationNameHint">必填，最多五十个字符。</p><p class="message" id="createOrganizationMessage" role="alert"></p><footer><button type="button" class="secondary" data-close>取消</button><button type="submit" class="primary">创建并进入</button></footer></form>';
  const createForm=dialog.querySelector('form'),nameInput=dialog.querySelector('input'),feedback=dialog.querySelector('.message');
  dialog.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  nameInput.addEventListener('input',()=>{feedback.textContent='';nameInput.removeAttribute('aria-invalid')});
  createForm.addEventListener('submit',event=>{
   event.preventDefault();
   const name=nameInput.value.trim();nameInput.value=name;
   let error='';
   if(!name)error='请输入企业名称。';
   else if(name.length>50)error='企业名称最多五十个字符。';
   else if(organizations.some(item=>item.name.toLowerCase()===name.toLowerCase()))error='企业名称已存在，请更换名称。';
   if(error){feedback.textContent=error;nameInput.setAttribute('aria-invalid','true');nameInput.focus();return}
   const organization={id:'team-'+crypto.randomUUID(),name,role:'团队最高管理员',createdLocally:true};
   const submit=createForm.querySelector('[type="submit"]');submit.disabled=true;
   if(enterOrganization(organization,[...organizations,organization],feedback))dialog.close();
   else submit.disabled=false;
  });
  document.body.append(dialog);dialog.showModal();
 }
 function chooseOrganization(){
  if(organizations.length===1){enterOrganization(organizations[0]);return}
  try{localStorage.setItem('orchestra-demo-signed-out','true')}catch{}
  form.hidden=true;
  document.querySelector('.auth-links').hidden=true;
  document.querySelector('h1').textContent='选择企业';
  document.querySelector('.intro').textContent=organizations.length?'请选择一个企业进行登录':'新建企业或跳过进入首页';
  const selection=document.createElement('form');selection.className='organization-selection';
  const group=document.createElement('fieldset');
  const legend=document.createElement('legend');legend.textContent='可登录的企业';group.append(legend);
  organizations.forEach(organization=>{
   const label=document.createElement('label');label.className='organization-option';
   const radio=document.createElement('input');radio.type='radio';radio.name='organization';radio.value=organization.id;radio.required=true;
   const details=document.createElement('span');const name=document.createElement('b');name.textContent=organization.name;
   const role=document.createElement('small');role.textContent=organization.role;details.append(name,role);label.append(radio,details);group.append(label);
  });
  if(!organizations.length){
   const empty=document.createElement('div');empty.className='organization-empty';
   empty.innerHTML='<span class="organization-empty-icon" aria-hidden="true">＋</span><b>暂无可登录的企业</b><p>你还未加入任何企业，可以新建企业，或跳过进入首页。</p>';
   group.append(empty);
  }
  const submit=document.createElement('button');submit.type='submit';submit.className='primary';submit.textContent='登录所选企业';submit.disabled=true;submit.hidden=!organizations.length;
  const create=document.createElement('button');create.type='button';create.className=`organization-create ${organizations.length?'secondary':'primary'}`;create.textContent='＋ 新建企业';create.addEventListener('click',openCreateOrganization);
  selectionMessage=document.createElement('p');selectionMessage.className='message';selectionMessage.setAttribute('role','status');selectionMessage.setAttribute('aria-live','polite');
  const back=document.createElement('a');back.href='./login.html';back.className='organization-back';back.textContent='返回登录';
  selection.append(group,selectionMessage,submit,create);
  if(!organizations.length){
   const skip=document.createElement('button');skip.type='button';skip.className='organization-skip secondary';skip.textContent='跳过';skip.setAttribute('aria-label','跳过企业选择，进入首页');
   skip.addEventListener('click',()=>{skip.disabled=true;if(!enterOrganization(null))skip.disabled=false});
   selection.append(skip);
  }
  selection.append(back);form.after(selection);
  selection.addEventListener('change',()=>{submit.disabled=!selection.querySelector('[name="organization"]:checked');show('')});
  selection.addEventListener('submit',event=>{event.preventDefault();const chosenId=selection.querySelector('[name="organization"]:checked')?.value;const chosen=organizations.find(item=>item.id===chosenId);if(chosen)enterOrganization(chosen)});
  (group.querySelector('input')||create).focus();
 }
 let codeIssued=false,timer;
 const show=(text,success=false)=>{const target=selectionMessage||message;target.textContent=text;target.classList.toggle('success',success)};
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
  if(password.value.length<6||password.value.length>18){show('密码长度为 6～18 位。');password.focus();return}
  if(confirm&&confirm.value!==password.value){confirm.setCustomValidity('两次输入的密码不一致，请重新输入。');confirm.reportValidity();return}
  if((mode==='reset-password'||mode==='register')&&(!codeIssued||form.elements.code.value!=='123456')){show('请先获取演示验证码，并填写正确的验证码。');form.elements.code.focus();return}
  if(mode==='login'){
   try{loginAccount=window.orchestraAccountPhone.resolveLogin(account.value.trim())}
   catch(error){show(error.message);account.focus();return}
   try{
    organizations=membershipsForAccount(loginAccount);
    localStorage.setItem('orchestra-demo-signed-out','true');
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

/* Team availability comes from the prototype login membership list. */
(()=>{
 const key='orchestra-login-organizations';
 let memberships;
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(saved))memberships=saved}catch{}
 const dialog=document.createElement('dialog');dialog.className='team-invite-dialog team-create-dialog';dialog.setAttribute('aria-labelledby','createTeamTitle');
 dialog.innerHTML='<form novalidate><header><h2 id="createTeamTitle">新建团队</h2><button type="button" data-close aria-label="关闭">×</button></header><p class="team-create-intro">新团队将拥有独立的工作空间</p><div class="account-team-notice"><b>⚠ 重要提示</b><p>新团队将独立管理资产，初始积分为 0，请创建后为团队补充创作积分。</p></div><label for="newTeamName">团队名称 <em>*</em></label><div class="account-team-name"><i aria-hidden="true">T</i><input id="newTeamName" placeholder="请输入团队名称" required maxlength="100" aria-describedby="newTeamNameHint newTeamMessage"></div><p class="hint" id="newTeamNameHint">团队名称长度需在 1～50 个字符之间</p><p id="newTeamMessage" role="alert" data-message></p><footer><button type="button" data-close>取消</button><button class="invite-submit" type="submit" disabled>确认创建</button></footer></form>';
 document.body.append(dialog);
 function addOption(team){
  if(workspaceOptions.some(option=>option.dataset.workspaceId===team.id))return;
  const option=document.createElement('button');option.type='button';option.className='workspace-option';option.setAttribute('aria-pressed','false');
  Object.assign(option.dataset,{workspaceId:team.id,workspaceContext:team.name+' · '+team.role,workspacePlan:'免费版',workspaceStatus:team.role,workspaceCredits:'0 创作积分',workspaceSongs:'0 次',teamIntro:'新创建的团队',teamMembers:'1',teamProjects:'0'});
  option.innerHTML='<i class="workspace-avatar violet" aria-hidden="true">团</i><span><b></b><small>团队最高管理员</small></span><em class="workspace-check" aria-hidden="true">✓</em>';option.querySelector('b').textContent=team.name;
  accountSwitcher.querySelector('.workspace-group').append(option);workspaceOptions.push(option);option.onclick=()=>selectWorkspace(option);
 }
 if(memberships){
  memberships.filter(team=>team.createdLocally).forEach(addOption);
  for(let i=workspaceOptions.length-1;i>=0;i--){if(!memberships.some(team=>team.id===workspaceOptions[i].dataset.workspaceId)){workspaceOptions[i].remove();workspaceOptions.splice(i,1)}}
  const active=workspaceOptions.find(option=>option.dataset.workspaceId===localStorage.getItem('orchestra-workspace'))||workspaceOptions[0];
  if(active)selectWorkspace(active,false);
  else{document.querySelector('#avatarAccountContext').textContent='暂未加入组织';document.querySelector('#avatarWorkspaceStatus').textContent='暂无团队';document.querySelector('#avatarPlanName').textContent='个人账号';document.querySelector('#avatarWorkspaceCredits').textContent='—';document.querySelector('#avatarWorkspaceSongs').textContent='—';localStorage.removeItem('orchestra-workspace')}
 }
 function refresh(){
  const available=workspaceOptions.filter(option=>!option.hidden&&!option.disabled),canSwitch=available.length>1;
  window.noOrganizationMode=available.length===0;
  document.documentElement.classList.toggle('no-organization',window.noOrganizationMode);
  if(window.noOrganizationMode&&document.querySelector('.page-view.active')?.id!=='homePage')switchPage('home');
  accountSwitchButton.textContent=canSwitch?'⇄ 切换':'＋创建团队';accountSwitchButton.setAttribute('aria-label',canSwitch?'切换团队':'创建团队');
  accountSwitchButton.setAttribute('aria-controls',canSwitch?'accountSwitcher':'createTeamDialog');
  accountSwitcher.querySelector('.workspace-group-title small').textContent=`${available.length} 个团队`;
 }
 dialog.id='createTeamDialog';
 function openCreate(){setAvatarMenu(false);dialog.querySelector('form').reset();dialog.querySelector('[data-message]').textContent='';dialog.querySelector('input').setCustomValidity('');dialog.querySelector('input').removeAttribute('aria-invalid');dialog.querySelector('[type="submit"]').disabled=true;dialog.showModal();dialog.querySelector('input').focus()}
 accountSwitchButton.onclick=()=>{refresh();if(workspaceOptions.filter(option=>!option.hidden&&!option.disabled).length>1)setAccountSwitcher(accountSwitcher.hidden);else openCreate()};
 document.querySelector('#createTeamFromSwitcher').onclick=openCreate;
 dialog.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>dialog.close());
 dialog.addEventListener('close',()=>avatarButton.focus());
 dialog.querySelector('form').onsubmit=event=>{
  event.preventDefault();const input=dialog.querySelector('input'),name=input.value.trim();
  if(!name||Array.from(name).length>50){const message=!name?'请输入团队名称。':'团队名称最多 50 个字符。';input.setCustomValidity(message);input.setAttribute('aria-invalid','true');dialog.querySelector('[data-message]').textContent=message;input.reportValidity();return}
  if(workspaceOptions.some(option=>option.querySelector('b').textContent===name)){input.setCustomValidity('团队名称已存在，请更换名称。');input.reportValidity();return}
  const team={id:'team-'+crypto.randomUUID(),name,role:'团队最高管理员',createdLocally:true};
  const current=memberships||workspaceOptions.map(option=>({id:option.dataset.workspaceId,name:option.querySelector('b').textContent,role:option.dataset.workspaceStatus}));
  try{const saved=JSON.stringify([...current,team]);const account=localStorage.getItem('orchestra-demo-account');if(account)localStorage.setItem('orchestra-account-organizations:'+account,saved);localStorage.setItem(key,saved)}catch{dialog.querySelector('[data-message]').textContent='保存失败，请重试。';return}
  memberships=[...current,team];addOption(team);selectWorkspace(workspaceOptions.find(option=>option.dataset.workspaceId===team.id),false);refresh();dialog.close();showToast('团队已创建（本地演示）');
 };
 dialog.querySelector('input').oninput=event=>{const input=event.target,length=Array.from(input.value.trim()).length;input.setCustomValidity('');if(length>50)input.setAttribute('aria-invalid','true');else input.removeAttribute('aria-invalid');dialog.querySelector('[data-message]').textContent=length>50?'团队名称最多 50 个字符。':'';dialog.querySelector('[type="submit"]').disabled=length<1||length>50};
 dialog.querySelector('input').addEventListener('blur',event=>{if(!event.target.value.trim()){event.target.setAttribute('aria-invalid','true');dialog.querySelector('[data-message]').textContent='请输入团队名称。'}});
 const originalMenu=setAvatarMenu;setAvatarMenu=function(open){refresh();originalMenu(open)};
 refresh();
})();

/* Team availability comes from the prototype login membership list. */
(()=>{
 const key='orchestra-login-organizations';
 let memberships;
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(Array.isArray(saved))memberships=saved}catch{}
 const dialog=document.createElement('dialog');dialog.className='team-invite-dialog';dialog.setAttribute('aria-labelledby','createTeamTitle');
 dialog.innerHTML='<form><header><h2 id="createTeamTitle">新建团队</h2><button type="button" data-close aria-label="关闭">×</button></header><label class="invite-phone-label" for="newTeamName">团队名称（必填）</label><input id="newTeamName" placeholder="请输入团队名称" required maxlength="50" style="box-sizing:border-box;width:100%;padding:12px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--text)"><p role="status" data-message></p><footer><button type="button" data-close>取消</button><button class="invite-submit" type="submit">创建团队</button></footer><p class="invite-demo-note">原型演示：团队仅保存在当前浏览器。</p></form>';
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
 function openCreate(){setAvatarMenu(false);dialog.querySelector('form').reset();dialog.querySelector('[data-message]').textContent='';dialog.showModal()}
 accountSwitchButton.onclick=()=>{refresh();if(workspaceOptions.filter(option=>!option.hidden&&!option.disabled).length>1)setAccountSwitcher(accountSwitcher.hidden);else openCreate()};
 document.querySelector('#createTeamFromSwitcher').onclick=openCreate;
 dialog.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>dialog.close());
 dialog.addEventListener('close',()=>avatarButton.focus());
 dialog.querySelector('form').onsubmit=event=>{
  event.preventDefault();const input=dialog.querySelector('input'),name=input.value.trim();
  if(!name){input.setCustomValidity('请输入团队名称。');input.reportValidity();return}
  if(workspaceOptions.some(option=>option.querySelector('b').textContent===name)){input.setCustomValidity('团队名称已存在，请更换名称。');input.reportValidity();return}
  const team={id:'team-'+crypto.randomUUID(),name,role:'团队最高管理员',createdLocally:true};
  const current=memberships||workspaceOptions.map(option=>({id:option.dataset.workspaceId,name:option.querySelector('b').textContent,role:option.dataset.workspaceStatus}));
  try{const saved=JSON.stringify([...current,team]);const account=localStorage.getItem('orchestra-demo-account');if(account)localStorage.setItem('orchestra-account-organizations:'+account,saved);localStorage.setItem(key,saved)}catch{dialog.querySelector('[data-message]').textContent='保存失败，请重试。';return}
  memberships=[...current,team];addOption(team);selectWorkspace(workspaceOptions.find(option=>option.dataset.workspaceId===team.id),false);refresh();dialog.close();showToast('团队已创建（本地演示）');
 };
 dialog.querySelector('input').oninput=event=>event.target.setCustomValidity('');
 const originalMenu=setAvatarMenu;setAvatarMenu=function(open){refresh();originalMenu(open)};
 refresh();
})();

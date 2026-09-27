/* Organize team settings into three focused pages. */
(()=>{
 const trigger=document.querySelector('#profileTeamsTab'),wrap=document.querySelector('.avatar-menu-wrap');
 const categories=[['members','成员管理','<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20v-1.6a6.5 6.5 0 0 1 13 0V20zM16 5a3.5 3.5 0 0 1 0 6.8M18 14a5.5 5.5 0 0 1 3.5 5.1V20h-3"/></svg>'],['resources','积分管理','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 10-13h-7z"/></svg>'],['permissions','角色设置','<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="10" width="16" height="12" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v4"/></svg>']];
 const menu=document.createElement('div');menu.id='teamManagementMenu';menu.className='team-management-flyout';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','团队设置');
 menu.innerHTML=categories.map(([key,label])=>`<button type="button" role="menuitem" data-team-category="${key}">${label}</button>`).join('');wrap.append(menu);
 trigger.setAttribute('aria-haspopup','menu');trigger.setAttribute('aria-controls',menu.id);trigger.setAttribute('aria-expanded','false');trigger.querySelector('b').textContent='团队设置';trigger.querySelector('small').textContent='成员、积分与权限';
 let closeTimer;
 function position(){const rect=trigger.getBoundingClientRect(),parent=wrap.getBoundingClientRect(),width=Math.min(220,window.innerWidth-24);menu.style.width=`${width}px`;let left=rect.left-width-18;if(left<12)left=Math.max(12,Math.min(rect.right+12,window.innerWidth-width-12));menu.style.left=`${left-parent.left}px`;menu.style.top=`${Math.max(12,Math.min(rect.top,window.innerHeight-menu.offsetHeight-12))-parent.top}px`}
 function close(){clearTimeout(closeTimer);menu.hidden=true;trigger.setAttribute('aria-expanded','false')}
 function open(){clearTimeout(closeTimer);if(avatarMenu.hidden)return;menu.hidden=false;trigger.setAttribute('aria-expanded','true');position()}
 function leave(){clearTimeout(closeTimer);closeTimer=setTimeout(close,180)}
 trigger.addEventListener('pointerenter',open);trigger.addEventListener('pointerleave',leave);trigger.addEventListener('focus',open);
 trigger.onclick=event=>{event.stopPropagation();open()};menu.addEventListener('pointerenter',()=>clearTimeout(closeTimer));menu.addEventListener('pointerleave',leave);
 trigger.addEventListener('keydown',event=>{if(['ArrowRight','Enter',' '].includes(event.key)){event.preventDefault();event.stopPropagation();open();menu.querySelector('button').focus()}});
 menu.addEventListener('keydown',event=>{const buttons=[...menu.querySelectorAll('button')],i=buttons.indexOf(document.activeElement);if(['Escape','ArrowLeft'].includes(event.key)){event.preventDefault();event.stopPropagation();trigger.focus();close();return}if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();event.stopPropagation();const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(i+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next].focus()}});
 wrap.addEventListener('focusout',()=>setTimeout(()=>{if(!menu.contains(document.activeElement)&&document.activeElement!==trigger)close()},0));
 new MutationObserver(()=>{if(avatarMenu.hidden)close()}).observe(avatarMenu,{attributes:true,attributeFilter:['hidden']});
 window.addEventListener('resize',()=>{if(!menu.hidden)position()});avatarMenu.addEventListener('scroll',()=>{if(!menu.hidden)position()});

 const members=document.querySelector('#teamMembersPanel'),credits=document.querySelector('#teamResourcesPanel'),permissions=document.querySelector('#teamInfoPanel'),dashboard=document.querySelector('#teamDashboardPanel');
 const nav=document.querySelector('.team-admin-nav');
 const roleSummary=members.querySelector('.permission-summary');
 let roleItems=[...roleSummary.children].map(item=>({name:item.querySelector('b').textContent,description:item.querySelector('small').textContent,locked:item.querySelector('b').textContent==='团队最高管理员'}));
 const infoHeader=document.createElement('div');infoHeader.className='member-toolbar';infoHeader.innerHTML='<div><h3>角色管理</h3><p>为各角色分配系统菜单，并将角色分配给团队成员。</p></div>';
 roleSummary?.remove();permissions.replaceChildren(infoHeader);permissions.dataset.teamAdminPanel='permissions';permissions.setAttribute('aria-labelledby','teamPermissionsTab');
 const roleSection=document.createElement('section');roleSection.className='role-menu-management';roleSection.innerHTML='<div class="role-menu-toolbar"><button type="button" class="primary-button" data-add-team-role>＋ 增加角色</button></div><div class="role-menu-cards"></div>';
 infoHeader.after(roleSection);
 const roleDialog=document.createElement('dialog');roleDialog.className='team-config-dialog';document.body.append(roleDialog);
 const menuLabels=[...document.querySelectorAll('#primaryNav .nav-item')].map(item=>item.querySelector('.nav-label-full')?.textContent.trim()).filter(Boolean);
 const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const getTeamKey=()=>document.querySelector('#managedTeamId').textContent.trim()||'default-team';
 const readStore=key=>{try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}};
 const writeStore=(key,value)=>localStorage.setItem(key,JSON.stringify(value));
 const builtInRoleItems=roleItems.slice();
 function syncRoleItems(){const stored=readStore(`team-custom-roles:${getTeamKey()}`),custom=Array.isArray(stored)?stored:[];roleItems=[...builtInRoleItems,...custom.filter(item=>item&&typeof item.name==='string'&&!builtInRoleItems.some(role=>role.name===item.name))]}
 const roleMenuDefaults={
  '团队最高管理员':menuLabels,
  '团队管理员':menuLabels.filter(name=>name!=='更多'),
  '生产者':['首页','待办','项目','资产']
 };
 function renderRoleCards(){
  syncRoleItems();const saved=readStore(`team-role-menus:${getTeamKey()}`),cards=roleSection.querySelector('.role-menu-cards');
  cards.innerHTML=roleItems.map(role=>{const chosen=Array.isArray(saved[role.name])?saved[role.name].filter(name=>menuLabels.includes(name)):(roleMenuDefaults[role.name]||[]);return `<article class="role-menu-card"><div><b>${escapeHtml(role.name)}</b><small>${escapeHtml(role.description)}</small><span>${chosen.length} / ${menuLabels.length} 个菜单已开放</span></div><button type="button" class="secondary-button" data-configure-role="${escapeHtml(role.name)}" ${role.locked?'disabled title="最高管理员默认开放全部菜单"':''}>${role.locked?'全部菜单已开放':'配置菜单'}</button></article>`}).join('');
 }
 function openRoleMenuEditor(roleName){
  const role=roleItems.find(item=>item.name===roleName);if(!role||role.locked)return;
  const saved=readStore(`team-role-menus:${getTeamKey()}`),selected=Array.isArray(saved[roleName])?saved[roleName]:roleMenuDefaults[roleName]||[];
  roleDialog.innerHTML=`<form class="team-config-form"><header><div><h3>配置${escapeHtml(roleName)}可访问菜单</h3><p>勾选后，该角色可使用对应系统菜单。</p></div><button type="button" class="dialog-close" data-dialog-close aria-label="关闭">×</button></header><div class="team-menu-selection-actions"><button type="button" data-menu-select-all>全选</button><button type="button" data-menu-clear-all>清空</button></div><div class="team-menu-checklist">${menuLabels.map((name,index)=>`<label><input type="checkbox" name="menu" value="${escapeHtml(name)}" ${selected.includes(name)?'checked':''}><span><b>${escapeHtml(name)}</b><small>${index===0?'工作流与创作入口':'系统主导航菜单'}</small></span></label>`).join('')}</div><footer><button type="button" class="ghost-button" data-dialog-close>取消</button><button type="submit" class="primary-button">保存菜单权限</button></footer></form>`;
  roleDialog.querySelector('[data-menu-select-all]').onclick=()=>roleDialog.querySelectorAll('input[name="menu"]').forEach(input=>input.checked=true);roleDialog.querySelector('[data-menu-clear-all]').onclick=()=>roleDialog.querySelectorAll('input[name="menu"]').forEach(input=>input.checked=false);
  roleDialog.querySelector('form').onsubmit=event=>{event.preventDefault();const checked=[...roleDialog.querySelectorAll('input[name="menu"]:checked')].map(input=>input.value);const current=readStore(`team-role-menus:${getTeamKey()}`);current[roleName]=checked;writeStore(`team-role-menus:${getTeamKey()}`,current);roleDialog.close();renderRoleCards();showToast(`已保存${roleName}的菜单权限`)};
  roleDialog.querySelectorAll('[data-dialog-close]').forEach(button=>button.onclick=()=>roleDialog.close());roleDialog.showModal();
 }
 function openAddRoleEditor(){
  roleDialog.innerHTML=`<form class="team-config-form"><header><div><h3>增加角色</h3><p>设置角色名称，并勾选可访问的系统菜单。</p></div><button type="button" class="dialog-close" data-dialog-close aria-label="关闭">×</button></header><label class="member-role-picker"><span>角色名称</span><input name="roleName" type="text" maxlength="24" required placeholder="请输入角色名称"></label><div class="team-menu-selection-actions"><button type="button" data-menu-select-all>全选</button><button type="button" data-menu-clear-all>清空</button></div><div class="team-menu-checklist">${menuLabels.map((name,index)=>`<label><input type="checkbox" name="menu" value="${escapeHtml(name)}"><span><b>${escapeHtml(name)}</b><small>${index===0?'工作流与创作入口':'系统主导航菜单'}</small></span></label>`).join('')}</div><footer><button type="button" class="ghost-button" data-dialog-close>取消</button><button type="submit" class="primary-button">创建角色</button></footer></form>`;
  roleDialog.querySelector('[data-menu-select-all]').onclick=()=>roleDialog.querySelectorAll('input[name="menu"]').forEach(input=>input.checked=true);roleDialog.querySelector('[data-menu-clear-all]').onclick=()=>roleDialog.querySelectorAll('input[name="menu"]').forEach(input=>input.checked=false);
  roleDialog.querySelector('form').onsubmit=event=>{event.preventDefault();const name=roleDialog.querySelector('[name="roleName"]').value.trim();if(!name){showToast('请输入角色名称','error');return}if(roleItems.some(role=>role.name===name)){showToast('角色名称已存在','error');return}const menus=[...roleDialog.querySelectorAll('input[name="menu"]:checked')].map(input=>input.value),customKey=`team-custom-roles:${getTeamKey()}`,storedCustom=readStore(customKey),custom=Array.isArray(storedCustom)?storedCustom:[];custom.push({name,description:'自定义角色',locked:false});writeStore(customKey,custom);roleItems.push({name,description:'自定义角色',locked:false});const key=`team-role-menus:${getTeamKey()}`,current=readStore(key);current[name]=menus;writeStore(key,current);roleDialog.close();renderRoleCards();showToast(`已增加角色：${name}`)};
  roleDialog.querySelectorAll('[data-dialog-close]').forEach(button=>button.onclick=()=>roleDialog.close());roleDialog.showModal();
 }
 function renderMemberRoles(){
  syncRoleItems();const saved=readStore(`team-member-roles:${getTeamKey()}`);
  members.querySelectorAll('[data-member-row]').forEach(row=>{const role=saved[row.dataset.memberId]||row.dataset.defaultRole,badge=row.querySelector('.role-badge');if(!badge)return;badge.textContent=role;badge.className=`role-badge ${role==='团队最高管理员'?'owner':role==='团队管理员'?'admin':role==='生产者'?'producer':'custom'}`;const edit=row.querySelector('[data-edit-member-role]');if(edit)edit.dataset.memberRole=role});
 }
 function openMemberRoleEditor(memberId){
  const row=members.querySelector(`[data-member-id="${CSS.escape(memberId)}"]`);if(!row||memberId==='huimin-zhang')return;
  const current=row.querySelector('.role-badge')?.textContent||row.dataset.defaultRole;
  roleDialog.innerHTML=`<form class="team-config-form"><header><div><h3>编辑成员角色</h3><p>成员：${escapeHtml(row.dataset.memberName)}</p></div><button type="button" class="dialog-close" data-dialog-close aria-label="关闭">×</button></header><label class="member-role-picker"><span>选择角色</span><select name="role">${roleItems.filter(role=>!role.locked).map(role=>`<option value="${escapeHtml(role.name)}" ${role.name===current?'selected':''}>${escapeHtml(role.name)}</option>`).join('')}</select></label><footer><button type="button" class="ghost-button" data-dialog-close>取消</button><button type="submit" class="primary-button">保存角色</button></footer></form>`;
  roleDialog.querySelector('form').onsubmit=event=>{event.preventDefault();const chosen=roleDialog.querySelector('select[name="role"]').value,currentRoles=readStore(`team-member-roles:${getTeamKey()}`);currentRoles[memberId]=chosen;writeStore(`team-member-roles:${getTeamKey()}`,currentRoles);roleDialog.close();renderMemberRoles();showToast(`已更新${row.dataset.memberName}的角色`)};
  roleDialog.querySelectorAll('[data-dialog-close]').forEach(button=>button.onclick=()=>roleDialog.close());roleDialog.showModal();
 }
 const originalSetTeamAdminSection=setTeamAdminSection;window.setTeamAdminSection=section=>{originalSetTeamAdminSection(section);if(section==='permissions')renderRoleCards();if(section==='members')renderMemberRoles()};
 roleSection.addEventListener('click',event=>{const add=event.target.closest('[data-add-team-role]');if(add){openAddRoleEditor();return}const button=event.target.closest('[data-configure-role]');if(button)openRoleMenuEditor(button.dataset.configureRole)});
 members.addEventListener('click',event=>{const button=event.target.closest('[data-edit-member-role]');if(button)openMemberRoleEditor(button.dataset.editMemberRole)});
 roleDialog.addEventListener('click',event=>{if(event.target===roleDialog)roleDialog.close()});
 roleDialog.addEventListener('close',()=>{if(document.activeElement===document.body)nav.querySelector('[data-team-section="permissions"]')?.focus()});
 const scope=members.querySelector('#managerScopeNote');if(scope)scope.textContent='管理团队成员、分组与邀请申请。';members.querySelector('.permission-summary')?.remove();
 const memberCreditButton=members.querySelector('[data-toast="成员积分配置已打开"]');if(memberCreditButton){const actions=credits.querySelector('.resource-actions');actions?.prepend(memberCreditButton);memberCreditButton.textContent='成员积分配置'}
 credits.querySelector('.member-toolbar h3').textContent='积分管理';credits.querySelector('.member-toolbar p').textContent='查看团队套餐、积分、生成额度和资源用量。';
 const metricCards=document.querySelector('.team-overview-metrics'),renewal=document.querySelector('.team-renewal-note');credits.querySelector('.member-toolbar').after(metricCards,renewal);metricCards.setAttribute('aria-label','团队套餐与积分资源概览');
 document.querySelector('.team-header-actions')?.setAttribute('hidden','');
 const logArticles=[...dashboard.querySelectorAll('.log-list article')];
 for(const [panel,title,match] of [[members,'成员管理记录',t=>/成员|邀请/.test(t)],[credits,'积分与资源记录',t=>/额度|积分|资源/.test(t)],[permissions,'角色设置记录',t=>/角色|权限/.test(t)]]){
  const items=logArticles.filter(node=>match(node.textContent));if(!items.length)continue;
  const details=document.createElement('details');details.className='team-category-details';details.innerHTML=`<summary>${title}</summary>`;const list=document.createElement('div');list.className='log-list';items.forEach(item=>list.append(item));details.append(list);panel.append(details)
 }
 dashboard.remove();
 nav.setAttribute('aria-label','团队设置菜单');
 nav.innerHTML=categories.map(([key,label,icon],index)=>`<button id="team${key==='members'?'Members':key==='resources'?'Resources':'Permissions'}Tab" type="button" data-team-section="${key}" aria-current="${index===0?'page':'false'}" aria-controls="${key==='members'?'teamMembersPanel':key==='resources'?'teamResourcesPanel':'teamInfoPanel'}"><i aria-hidden="true">${icon}</i><span><b>${label}</b></span></button>`).join('');
 const tabs=[...nav.querySelectorAll('button')];tabs.forEach((tab,index)=>{tab.onclick=()=>setTeamAdminSection(tab.dataset.teamSection);tab.onkeydown=event=>{let i;if(event.key==='ArrowDown'||event.key==='ArrowRight')i=(index+1)%tabs.length;if(event.key==='ArrowUp'||event.key==='ArrowLeft')i=(index+tabs.length-1)%tabs.length;if(event.key==='Home')i=0;if(event.key==='End')i=tabs.length-1;if(i!==undefined){event.preventDefault();tabs[i].click();tabs[i].focus()}}});
 menu.querySelectorAll('[data-team-category]').forEach(button=>button.onclick=()=>{const category=button.dataset.teamCategory;close();openTeamManagementProfile();if(!teamManager.hidden&&profilePage.classList.contains('team-management-active')){setTeamAdminSection(category);requestAnimationFrame(()=>nav.querySelector(`[data-team-section="${category}"]`).focus({preventScroll:true}))}});
 setTeamAdminSection('members');
})();

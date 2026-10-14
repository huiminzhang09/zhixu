/* Local user lookup and invitation examples; no external user directory is queried. */
(()=>{
 const trigger=document.querySelector('#inviteMembersButton');
 const users=[{phone:'18500760312',username:'创作用户十二',nickname:'音乐旅人'},{phone:'18500760311',username:'创作用户十一',nickname:'星河'}];
 const dialog=document.createElement('dialog');dialog.className='team-invite-dialog';dialog.setAttribute('aria-labelledby','inviteTitle');
 dialog.innerHTML=`<form novalidate><header><div><h2 id="inviteTitle">邀请成员</h2><p id="inviteTeamName"></p></div><button type="button" data-close aria-label="关闭邀请窗口">×</button></header><label class="invite-phone-label" for="invitePhone">手机号 <span aria-hidden="true">*</span></label><div class="invite-phone-query"><input id="invitePhone" type="tel" autocomplete="tel" inputmode="numeric" placeholder="请输入被邀请人的手机号" maxlength="11" required aria-describedby="invitePhoneHint inviteFeedback"><button type="button" id="queryInviteUser">查询</button></div><p id="invitePhoneHint" class="invite-phone-hint">查询用户信息，确认后再邀请加入当前组织。</p><section class="invite-user-result" aria-label="查询到的用户信息" hidden><h3>用户信息</h3><dl><div><dt>用户名</dt><dd id="inviteUsername"></dd></div><div><dt>昵称</dt><dd id="inviteNickname"></dd></div></dl></section><p id="inviteFeedback" class="invite-feedback" role="status" aria-live="polite"></p><footer><button type="button" data-close>取消</button><button type="submit" class="invite-submit" disabled>确认邀请</button></footer><p class="invite-demo-note">原型演示：可查询示例手机号 18500760312、18500760311，展示示例用户名及昵称；不会发送真实邀请。</p></form>`;
 document.body.append(dialog);
 const q=selector=>dialog.querySelector(selector),form=q('form'),phone=q('#invitePhone'),feedback=q('#inviteFeedback'),submit=q('[type="submit"]'),result=q('.invite-user-result');
 const pending=new Set();let teamId='',selectedUser=null;
 function resetLookup(){selectedUser=null;result.hidden=true;q('#inviteUsername').textContent='';q('#inviteNickname').textContent='';submit.disabled=true;feedback.textContent='';phone.setCustomValidity('');phone.removeAttribute('aria-invalid')}
 trigger.addEventListener('click',()=>{
  teamId=document.querySelector('#managedTeamId').textContent.trim();
  q('#inviteTeamName').textContent=document.querySelector('#managedTeamName')?.textContent||'当前组织';
  form.reset();resetLookup();dialog.showModal();phone.focus();
 });
 dialog.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>dialog.close());
 dialog.addEventListener('close',()=>{form.reset();resetLookup();trigger.focus()});
 phone.addEventListener('input',resetLookup);
 function query(){
  resetLookup();const value=phone.value.trim();phone.value=value;
  if(!/^1[3-9]\d{9}$/.test(value)){
   const message=value?'请输入有效的十一位手机号。':'请输入被邀请人的手机号。';
   phone.setCustomValidity(message);phone.setAttribute('aria-invalid','true');feedback.textContent=message;phone.reportValidity();return;
  }
  const user=users.find(item=>item.phone===value);
  if(!user){feedback.textContent='未查询到该手机号对应的用户，请核对手机号或请对方先注册。';return}
  selectedUser=user;q('#inviteUsername').textContent=user.username;q('#inviteNickname').textContent=user.nickname||'未设置';result.hidden=false;
  if(pending.has(teamId+':'+value)){feedback.textContent='该用户已有本次演示的邀请记录，请勿重复邀请。';return}
  submit.disabled=false;feedback.textContent='已查询到用户，请核对用户名和昵称后确认邀请。';
 }
 q('#queryInviteUser').onclick=query;
 phone.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();query()}});
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(!selectedUser||selectedUser.phone!==phone.value.trim()){resetLookup();feedback.textContent='请先查询并确认用户信息。';return}
  const key=teamId+':'+selectedUser.phone;
  if(pending.has(key)){submit.disabled=true;feedback.textContent='该用户已有本次演示的邀请记录，请勿重复邀请。';return}
  pending.add(key);submit.disabled=true;feedback.textContent=`已完成对“${selectedUser.username}”的邀请演示，未发送真实邀请。`;
 });
})();

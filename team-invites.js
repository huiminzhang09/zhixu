/* Local phone invitation demonstration; no SMS or server invitation is sent. */
(()=>{
 const trigger=document.querySelector('#inviteMembersButton');
 const dialog=document.createElement('dialog');dialog.className='team-invite-dialog';dialog.setAttribute('aria-labelledby','inviteTitle');
 dialog.innerHTML=`<form novalidate><header><div><h2 id="inviteTitle">邀请成员</h2><p id="inviteTeamName"></p></div><button type="button" data-close aria-label="关闭邀请窗口">×</button></header><label class="invite-phone-label" for="invitePhone">手机号 <span aria-hidden="true">*</span></label><input id="invitePhone" type="tel" autocomplete="tel" inputmode="tel" placeholder="请输入被邀请人的手机号" maxlength="20" required aria-describedby="invitePhoneHint inviteFeedback"><p id="invitePhoneHint" class="invite-phone-hint">通过手机号邀请成员加入当前组织。</p><p id="inviteFeedback" class="invite-feedback" role="status" aria-live="polite"></p><footer><button type="button" data-close>取消</button><button type="submit" class="invite-submit">确认邀请</button></footer><p class="invite-demo-note">原型演示：不会发送真实短信，也不会直接添加成员。</p></form>`;
 document.body.append(dialog);
 const form=dialog.querySelector('form'),phone=dialog.querySelector('#invitePhone'),feedback=dialog.querySelector('#inviteFeedback');
 const pending=new Set();let teamId='';
 trigger.addEventListener('click',()=>{
  teamId=document.querySelector('#managedTeamId').textContent.trim();
  dialog.querySelector('#inviteTeamName').textContent=document.querySelector('#managedTeamName')?.textContent||'当前组织';
  form.reset();phone.setCustomValidity('');phone.removeAttribute('aria-invalid');feedback.textContent='';dialog.showModal();phone.focus();
 });
 dialog.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>dialog.close());
 dialog.addEventListener('close',()=>{form.reset();trigger.focus()});
 phone.addEventListener('input',()=>{phone.setCustomValidity('');phone.removeAttribute('aria-invalid');feedback.textContent=''});
 form.addEventListener('submit',event=>{
  event.preventDefault();const value=phone.value.trim().replace(/[\s-]/g,'').replace(/^\+?86(?=1\d{10}$)/,'');
  if(!/^1[3-9]\d{9}$/.test(value)){
   const message=value?'请输入有效的十一位手机号。':'请输入被邀请人的手机号。';
   phone.setCustomValidity(message);phone.setAttribute('aria-invalid','true');feedback.textContent=message;phone.reportValidity();return;
  }
  const key=teamId+':'+value;
  if(pending.has(key)){feedback.textContent='该手机号已有本次演示的邀请记录，请勿重复邀请。';return}
  pending.add(key);phone.value='';feedback.textContent=`已完成对 ${value.slice(0,3)}****${value.slice(-4)} 的邀请演示，未发送真实邀请。`;
 });
})();

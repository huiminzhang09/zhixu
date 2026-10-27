/* Account security interactions for this local prototype. */
(() => {
  const api = window.orchestraAccountPhone, trigger = document.querySelector('#changeAccountPassword');
  if (!api || !trigger) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'profile-phone-dialog profile-password-dialog';
  dialog.setAttribute('aria-labelledby', 'changePasswordTitle');
  dialog.innerHTML = `<form novalidate>
    <header><h2 id="changePasswordTitle">修改密码</h2><button type="button" data-password-close aria-label="关闭修改密码弹窗">×</button></header>
    <p class="phone-intro">验证原密码后设置新密码，密码长度为 6～18 位。</p>
    <label for="securityCurrentPassword">原密码 <em>*</em></label>
    <input id="securityCurrentPassword" name="password" type="password" autocomplete="current-password" minlength="6" maxlength="18" required placeholder="请输入原密码" aria-describedby="changePasswordMessage">
    <label for="securityNewPassword">新密码 <em>*</em></label>
    <input id="securityNewPassword" name="newPassword" type="password" autocomplete="new-password" minlength="6" maxlength="18" required placeholder="请输入 6～18 位新密码" aria-describedby="changePasswordMessage">
    <label for="securityConfirmPassword">确认新密码 <em>*</em></label>
    <input id="securityConfirmPassword" name="confirmation" type="password" autocomplete="new-password" minlength="6" maxlength="18" required placeholder="请再次输入新密码" aria-describedby="changePasswordMessage">
    <p id="changePasswordMessage" class="phone-message" role="alert"></p>
    <a href="./login.html" data-password-login hidden>重新登录</a>
    <footer><button type="button" class="ghost-button" data-password-close>取消</button><button type="submit" class="primary-button">确认修改</button></footer>
    <p class="phone-demo-note">交互演示：修改仅在当前浏览器生效，不保存明文密码。修改后再次登录需使用新密码。</p>
  </form>`;
  document.body.append(dialog);
  const q = selector => dialog.querySelector(selector), form = q('form'), submit = q('[type="submit"]');
  const message = q('#changePasswordMessage'), loginLink = q('[data-password-login]');
  const fields = Object.fromEntries(['password', 'newPassword', 'confirmation'].map(name => [name, q(`[name="${name}"]`)]));
  let openedAccount, attempt, canVerify = false;
  function clearMessage() {message.textContent = '';Object.values(fields).forEach(input => input.removeAttribute('aria-invalid'));}
  function cancelAttempt() {attempt?.abort();attempt = null;submit.disabled = !canVerify;submit.textContent = '确认修改';}
  function closeDialog() {cancelAttempt();dialog.close();}
  function report(error) {
    message.textContent = error.message;
    if (fields[error.field]) {fields[error.field].setAttribute('aria-invalid', 'true');fields[error.field].focus();}
  }
  function refresh() {
    try {
      const changedAt = api.passwordChangedAt();
      document.querySelector('#securityPasswordHint').textContent = changedAt ? `上次修改于 ${new Date(changedAt).toLocaleString('zh-CN', {hour12:false})}` : '密码长度为 6～18 位。';
    } catch (error) {document.querySelector('#securityPasswordHint').textContent = error.message;}
  }
  trigger.addEventListener('click', () => {
    if (dialog.open) return;
    form.reset();clearMessage();loginLink.hidden = true;
    try {
      openedAccount = api.currentAccount();canVerify = api.hasPasswordVerification();cancelAttempt();
      loginLink.hidden = canVerify;
      if (!canVerify) message.textContent = '当前演示会话尚无有效密码校验信息，请重新登录后修改密码。';
      dialog.showModal();(canVerify ? fields.password : loginLink).focus();
    } catch (error) {showToast(error.message);}
  });
  dialog.querySelectorAll('[data-password-close]').forEach(button => button.addEventListener('click', closeDialog));
  dialog.addEventListener('keydown', event => {if (event.key === 'Escape') event.stopPropagation();});
  dialog.addEventListener('cancel', cancelAttempt);
  dialog.addEventListener('close', () => {cancelAttempt();form.reset();clearMessage();trigger.focus();});
  Object.values(fields).forEach(input => input.addEventListener('input', () => {cancelAttempt();if (canVerify) clearMessage();}));
  form.addEventListener('submit', async event => {
    event.preventDefault();if (submit.disabled) return;clearMessage();
    const submission = new AbortController();attempt = submission;submit.disabled = true;submit.textContent = '正在修改…';
    try {
      if (openedAccount !== api.currentAccount()) throw new Error('登录状态已变化，请重新打开弹窗。');
      await api.changePassword(fields.password.value, fields.newPassword.value, fields.confirmation.value, {signal:submission.signal});
      if (submission.signal.aborted) return;
      dialog.close();refresh();showToast('密码修改成功，下次登录请使用新密码');
    } catch (error) {if (!submission.signal.aborted) report(error);}
    finally {if (attempt === submission) cancelAttempt();}
  });
  window.addEventListener('orchestra:password-changed', refresh);
  window.addEventListener('storage', event => {
    if (event.key === null || event.key?.startsWith(api.savedPasswordPrefix) || ['orchestra-demo-account', 'orchestra-demo-signed-out'].includes(event.key)) {
      if (dialog.open) closeDialog();refresh();
    }
  });
  window.addEventListener('pagehide', () => {if (dialog.open) closeDialog();});
  window.addEventListener('pageshow', refresh);
  refresh();
})();

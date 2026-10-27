/* SMS verification UI for the local prototype; no real SMS is sent. */
(() => {
  const api = window.orchestraAccountPhone;
  const triggers = [...document.querySelectorAll('[data-change-phone]')];
  if (!api || !triggers.length) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'profile-phone-dialog';
  dialog.setAttribute('aria-labelledby', 'changePhoneTitle');
  dialog.innerHTML = `<form novalidate>
    <header><h2 id="changePhoneTitle">更换手机号</h2><button type="button" data-phone-close aria-label="关闭更换手机号弹窗">×</button></header>
    <p class="phone-intro">请输入原账号密码，并验证新手机号的短信验证码。</p>
    <p class="phone-current">当前手机号：<b data-current-phone></b></p>
    <div class="phone-password-field" hidden><label for="profileCurrentPassword">原账号密码 <em>*</em></label><input id="profileCurrentPassword" name="currentPassword" type="password" autocomplete="current-password" minlength="6" maxlength="18" placeholder="请输入原账号密码" aria-describedby="profileCurrentPasswordHint changePhoneMessage"><p id="profileCurrentPasswordHint" class="phone-code-hint"></p><a href="./login.html" data-phone-login hidden>重新登录</a></div>
    <label for="profileNewPhone"><span data-phone-label>新手机号</span> <em>*</em></label>
    <input id="profileNewPhone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="11" placeholder="请输入十一位新手机号" required aria-describedby="changePhoneMessage">
    <label for="profilePhoneCode">验证码 <em>*</em></label>
    <div class="phone-code-row"><input id="profilePhoneCode" name="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="请输入六位验证码" required aria-describedby="profilePhoneCodeHint changePhoneMessage"><button type="button" class="secondary-button" data-phone-send>发送验证码</button></div>
    <p id="profilePhoneCodeHint" class="phone-code-hint" role="status"></p>
    <p id="changePhoneMessage" class="phone-message" role="alert"></p>
    <footer><button type="button" class="ghost-button" data-phone-close>取消</button><button type="submit" class="primary-button">验证并更换</button></footer>
    <p class="phone-demo-note">交互演示：未接入短信服务，手机号设置仅保存在当前浏览器。</p>
  </form>`;
  document.body.append(dialog);
  const q = selector => dialog.querySelector(selector);
  const form = q('form'), phone = q('[name="phone"]'), code = q('[name="code"]'), password = q('[name="currentPassword"]');
  const send = q('[data-phone-send]'), submit = q('[type="submit"]'), hint = q('#profilePhoneCodeHint'), message = q('#changePhoneMessage');
  let timer, trigger, openedAccount, submission;
  function cancelSubmission() {submission?.abort();submission = null;submit.disabled = false;}
  function clearMessage() {
    message.textContent = '';
    phone.removeAttribute('aria-invalid');code.removeAttribute('aria-invalid');password.removeAttribute('aria-invalid');
  }
  function report(error) {
    message.textContent = error.message;
    const field = error.field === 'phone' ? phone : error.field === 'code' ? code : error.field === 'password' ? password : null;
    if (field) {field.setAttribute('aria-invalid', 'true');field.focus();}
  }
  function refresh() {
    try {
      const current = api.phoneFor();
      document.querySelector('#securityPhoneNumber').textContent = current ? api.mask(current) : '用于登录验证与账号找回';
      const status = document.querySelector('#securityPhoneStatus');
      status.textContent = current ? '已绑定' : '未绑定';status.className = 'setting-status ' + (current ? 'success' : 'warning');
      triggers.forEach(button => {button.disabled = false;button.textContent = current ? '更换手机号' : '绑定手机号';});
    } catch {
      document.querySelector('#securityPhoneNumber').textContent = '手机号读取失败，请刷新后重试';
      triggers.forEach(button => {button.disabled = true;});
    }
  }
  function syncCountdown() {
    try {
      if (openedAccount !== api.currentAccount() || localStorage.getItem('orchestra-demo-signed-out') === 'true') {dialog.close();refresh();return;}
      const challenge = api.verification(), seconds = Math.max(0, Math.ceil(((challenge?.resendAt || 0) - Date.now()) / 1000));
      send.disabled = seconds > 0;send.textContent = seconds ? `${seconds} 秒后重试` : '发送验证码';
      hint.textContent = challenge?.phone === phone.value
        ? Date.now() < challenge.expiresAt ? `演示验证码：123456，五分钟内有效（未发送真实短信）。验证码对应 ${api.mask(phone.value)}。` : '验证码已过期，请重新获取。'
        : challenge ? '手机号已变化，请在倒计时结束后重新发送验证码。' : '';
    } catch (error) {send.disabled = true;report(error);}
  }
  triggers.forEach(button => button.addEventListener('click', () => {
    if (dialog.open) return;
    trigger = button;form.reset();clearMessage();submit.disabled = false;
    try {
      openedAccount = api.currentAccount();
      const current = api.phoneFor(), action = current ? '更换手机号' : '绑定手机号';
      q('#changePhoneTitle').textContent = action;
      q('header [data-phone-close]').setAttribute('aria-label', `关闭${action}弹窗`);
      q('.phone-intro').textContent = current ? '请输入原账号密码，并验证新手机号的短信验证码。验证通过后可使用新手机号登录。' : '当前账号尚未绑定手机号，请输入手机号并完成短信验证码验证。';
      q('.phone-current').hidden = !current;q('[data-current-phone]').textContent = api.mask(current);
      q('.phone-password-field').hidden = !current;password.disabled = !current;password.required = Boolean(current);password.value = '';
      const canVerifyPassword = api.hasPasswordVerification();
      q('#profileCurrentPasswordHint').textContent = canVerifyPassword ? '请输入当前账号密码，长度为 6～18 位。' : '当前演示会话尚无密码校验信息，请重新登录后再更换手机号。';
      q('[data-phone-login]').hidden = !current || canVerifyPassword;
      q('[data-phone-label]').textContent = current ? '新手机号' : '手机号';
      phone.placeholder = current ? '请输入十一位新手机号' : '请输入十一位手机号';
      submit.textContent = current ? '验证并更换' : '验证并绑定';
      const pending = api.verification();if (pending && Date.now() < pending.expiresAt) phone.value = pending.phone;
      dialog.showModal();syncCountdown();clearInterval(timer);timer = setInterval(syncCountdown, 1000);phone.focus();
    } catch (error) {showToast(error.message);}
  }));
  dialog.querySelectorAll('[data-phone-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('keydown', event => {if (event.key === 'Escape') event.stopPropagation();});
  dialog.addEventListener('close', () => {cancelSubmission();clearInterval(timer);form.reset();password.value = '';clearMessage();trigger?.focus();});
  phone.addEventListener('input', () => {cancelSubmission();phone.value = phone.value.replace(/\D/g, '').slice(0, 11);code.value = '';clearMessage();syncCountdown();});
  code.addEventListener('input', () => {cancelSubmission();code.value = code.value.replace(/\D/g, '').slice(0, 6);clearMessage();});
  password.addEventListener('input', () => {cancelSubmission();clearMessage();});
  send.addEventListener('click', () => {
    if (send.disabled) return;
    clearMessage();
    try {api.sendCode(phone.value);code.value = '';syncCountdown();code.focus();} catch (error) {report(error);}
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();if (submit.disabled) return;clearMessage();submit.disabled = true;
    const attempt = new AbortController();submission = attempt;
    try {
      if (openedAccount !== api.currentAccount()) throw new Error('登录状态已变化，请重新打开弹窗。');
      const wasBound = Boolean(api.phoneFor());
      await api.confirmChange(phone.value, code.value, password.value, {signal:attempt.signal});
      if (attempt.signal.aborted) return;
      refresh();dialog.close();showToast(wasBound ? '手机号已更换，可使用新手机号登录' : '手机号绑定成功，可使用该手机号登录');
    } catch (error) {if (!attempt.signal.aborted) report(error);} finally {if (submission === attempt) {submission = null;submit.disabled = false;}}
  });
  window.addEventListener('orchestra:phone-changed', refresh);
  window.addEventListener('storage', event => {
    if (event.key === null || [api.storageKey, 'orchestra-demo-account', 'orchestra-demo-signed-out'].includes(event.key)) {
      if (dialog.open) dialog.close();refresh();
    }
  });
  window.addEventListener('pagehide', () => {if (dialog.open) dialog.close();clearInterval(timer);});
  window.addEventListener('pageshow', refresh);
  refresh();
})();

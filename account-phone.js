/* Local prototype phone verification. A phone changes the login alias, never the account identity. */
(() => {
  const storageKey = 'orchestra-account-phone-bindings';
  const passwordKey = 'orchestra-demo-password-verifier';
  const savedPasswordPrefix = 'orchestra-account-password:';
  const validPhone = value => /^1[3-9]\d{9}$/.test(value);
  const currentAccount = () => localStorage.getItem('orchestra-demo-account') || 'demo-user';
  const challenges = new Map();
  function fail(message, field = 'phone') { throw Object.assign(new Error(message), {field}); }
  function validatePassword(password, field = 'password', label = '原账号密码') {
    if (typeof password !== 'string' || !password.trim()) fail(`请输入${label}。`, field);
    if (password.length < 6 || password.length > 18) fail('密码长度为 6～18 位。', field);
  }
  const bytes = (value, length) => Array.isArray(value) && value.length === length && value.every(byte => Number.isInteger(byte) && byte >= 0 && byte <= 255);
  const validProof = (record, account) => record?.account === account && bytes(record.salt, 16) && bytes(record.hash, 32);
  function savedPassword(account = currentAccount()) {
    try {
      const raw = localStorage.getItem(savedPasswordPrefix + account);
      if (raw === null) return null;
      const record = JSON.parse(raw);
      if (!validProof(record, account) || !Number.isFinite(record.changedAt)) throw Error();
      return record;
    } catch { fail('密码资料读取失败，请刷新后重试。', 'form'); }
  }
  async function passwordDigest(password, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return [...new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2', salt:new Uint8Array(salt), iterations:100000, hash:'SHA-256'}, key, 256))];
  }
  async function rememberLoginPassword(account, password) {
    validatePassword(password);
    const saved = savedPassword(account);
    let record;
    try {
      const salt = saved?.salt || [...crypto.getRandomValues(new Uint8Array(16))], hash = await passwordDigest(password, salt);
      if (saved && hash.some((byte, index) => byte !== saved.hash[index])) fail('密码不正确，请使用修改后的密码登录。', 'password');
      record = saved || {account, salt, hash};
    } catch (error) {
      if (error.field) throw error;
      fail('无法建立演示密码校验，请重新登录。', 'form');
    }
    if (JSON.stringify(savedPassword(account)) !== JSON.stringify(saved)) fail('密码已在其他页面修改，请重新登录。', 'password');
    try { sessionStorage.setItem(passwordKey, JSON.stringify(record)); }
    catch { fail('无法建立演示密码校验，请允许会话存储后重新登录。', 'form'); }
  }
  function passwordProof(account = currentAccount()) {
    try {
      const record = JSON.parse(sessionStorage.getItem(passwordKey) || 'null');
      return validProof(record, account) ? record : null;
    } catch { return null; }
  }
  const hasPasswordVerification = () => {
    const proof = passwordProof(), saved = savedPassword();
    return Boolean(proof && (!saved || JSON.stringify(proof) === JSON.stringify(saved)));
  };
  async function verifyPassword(account, password) {
    validatePassword(password);
    const proof = passwordProof(account);
    if (!proof || !hasPasswordVerification()) fail('当前演示会话无法核验原密码，请重新登录后操作。', 'password');
    let hash;
    try { hash = await passwordDigest(password, proof.salt); }
    catch { fail('密码验证失败，请重新登录后重试。', 'password'); }
    if (JSON.stringify(passwordProof(account)) !== JSON.stringify(proof) || !hasPasswordVerification()) fail('登录状态已变化，请重新登录后操作。', 'form');
    if (hash.some((byte, index) => byte !== proof.hash[index])) fail('原账号密码不正确，请重新输入。', 'password');
  }
  async function changePassword(password, newPassword, confirmation, {signal} = {}) {
    const account = currentAccount(), proof = passwordProof(account), saved = savedPassword(account);
    const assertActive = () => {
      if (signal?.aborted) throw new DOMException('操作已取消', 'AbortError');
      if (account !== currentAccount() || localStorage.getItem('orchestra-demo-signed-out') === 'true' || JSON.stringify(passwordProof(account)) !== JSON.stringify(proof) || JSON.stringify(savedPassword(account)) !== JSON.stringify(saved)) fail('登录状态或密码已变化，请重新登录后操作。', 'form');
    };
    assertActive();
    validatePassword(password);
    validatePassword(newPassword, 'newPassword', '新密码');
    if (!confirmation) fail('请再次输入新密码。', 'confirmation');
    if (confirmation !== newPassword) fail('两次输入的新密码不一致。', 'confirmation');
    if (newPassword === password) fail('新密码不能与原密码相同。', 'newPassword');
    await verifyPassword(account, password);
    assertActive();
    let record;
    try {
      const salt = [...crypto.getRandomValues(new Uint8Array(16))], hash = await passwordDigest(newPassword, salt);
      record = {account, salt, hash, changedAt:Date.now()};
    } catch { fail('密码处理失败，请重试。', 'form'); }
    assertActive();
    const previous = sessionStorage.getItem(passwordKey);
    try {
      sessionStorage.setItem(passwordKey, JSON.stringify(record));
      localStorage.setItem(savedPasswordPrefix + account, JSON.stringify(record));
    } catch {
      try { if (previous === null) sessionStorage.removeItem(passwordKey); else sessionStorage.setItem(passwordKey, previous); }
      catch { try { sessionStorage.removeItem(passwordKey); } catch {} }
      fail('密码未修改成功，请允许浏览器存储后重试。', 'form');
    }
    window.dispatchEvent(new Event('orchestra:password-changed'));
    return record.changedAt;
  }
  const passwordChangedAt = () => savedPassword()?.changedAt || null;
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (!data || Array.isArray(data) || typeof data !== 'object' || Object.values(data).some(record =>
        !record || !validPhone(record.phone) || !Array.isArray(record.previousPhones) || record.previousPhones.some(phone => !validPhone(phone)))) throw Error();
      return data;
    } catch { fail('手机号资料读取失败，请刷新后重试。', 'form'); }
  }
  const phoneFor = (account = currentAccount(), data = read()) => data[account]?.phone || (validPhone(account) ? account : '');
  const mask = phone => validPhone(phone) ? phone.slice(0, 3) + '****' + phone.slice(7) : '未绑定';
  function resolveLogin(phone) {
    if (!validPhone(phone)) fail('请输入有效的十一位手机号。');
    const data = read();
    const match = Object.entries(data).find(([, record]) => record.phone === phone);
    if (match) return match[0];
    if (data[phone] || Object.values(data).some(record => record.previousPhones.includes(phone))) fail('该手机号已更换，请使用新的手机号登录。');
    return phone;
  }
  function validateChange(account, phone, previousPhone = phoneFor(account)) {
    if (account !== currentAccount() || localStorage.getItem('orchestra-demo-signed-out') === 'true') fail('登录状态已变化，请重新登录后操作。', 'form');
    if (!validPhone(phone)) fail('请输入有效的十一位手机号。');
    const data = read(), current = phoneFor(account, data);
    if (current !== previousPhone) fail('手机号已在其他页面更新，请关闭弹窗后重试。', 'form');
    if (phone === current) fail('新手机号不能与当前手机号相同。');
    const accounts = new Set(['18500760311', '18500760312', ...Object.keys(data)]);
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith('orchestra-account-organizations:')) accounts.add(key.slice('orchestra-account-organizations:'.length));
    }
    if ([...accounts].some(id => id !== account && (phoneFor(id, data) === phone || id === phone || data[id]?.previousPhones.includes(phone)))) fail('该手机号已被其他账号使用，请更换手机号。');
    return {data, current};
  }
  function verification() {
    const challenge = challenges.get(currentAccount());
    return challenge ? {...challenge} : null;
  }
  function sendCode(phone) {
    const account = currentAccount(), {current} = validateChange(account, phone), previous = challenges.get(account);
    if (previous && previous.resendAt > Date.now()) fail('请等待倒计时结束后再发送验证码。', 'code');
    const challenge = {phone, previousPhone: current, expiresAt: Date.now() + 5 * 60 * 1000, resendAt: Date.now() + 60 * 1000};
    challenges.set(account, challenge);
    return {...challenge};
  }
  async function confirmChange(phone, code, password = '', {signal} = {}) {
    const account = currentAccount(), challenge = challenges.get(account);
    if (!challenge || challenge.phone !== phone) fail('请先向当前填写的手机号发送验证码。', 'code');
    if (Date.now() >= challenge.expiresAt) fail('验证码已过期，请重新获取。', 'code');
    const initial = validateChange(account, phone, challenge.previousPhone);
    if (initial.current) await verifyPassword(account, password);
    if (signal?.aborted) throw new DOMException('操作已取消', 'AbortError');
    if (challenges.get(account) !== challenge) fail('验证码状态已变化，请重新获取。', 'code');
    if (Date.now() >= challenge.expiresAt) fail('验证码已过期，请重新获取。', 'code');
    const {data, current} = validateChange(account, phone, challenge.previousPhone);
    if (code !== '123456') fail('验证码不正确，请输入六位验证码。', 'code');
    const previousPhones = [...new Set([...(data[account]?.previousPhones || []), current].filter(value => validPhone(value) && value !== phone))];
    data[account] = {phone, previousPhones};
    try { localStorage.setItem(storageKey, JSON.stringify(data)); }
    catch { fail('无法保存手机号，请允许本地存储后重试。', 'form'); }
    challenges.delete(account);
    window.dispatchEvent(new Event('orchestra:phone-changed'));
    return phone;
  }
  window.orchestraAccountPhone = {storageKey, savedPasswordPrefix, currentAccount, phoneFor, mask, resolveLogin, verification, sendCode, confirmChange, rememberLoginPassword, hasPasswordVerification, changePassword, passwordChangedAt};
})();

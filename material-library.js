/* Generated audio saved independently of workflow output selection. */
(() => {
  const panel = document.querySelector('#assetMaterialsPanel');
  const activeTeam = () => document.querySelector('.workspace-option.active')?.dataset.workspaceId || 'orchestra-studio';
  const taskTeam = task => projectData.find(project => project.id === task.projectId)?.teamId || 'orchestra-studio';
  const storageKey = team => 'orchestra-material-library-v1:' + team;
  const recordId = (task, candidate) => JSON.stringify([task.id, candidate.generationId || candidate.id]);
  function read(team) {
    const records = JSON.parse(localStorage.getItem(storageKey(team)) || '[]');
    if (!Array.isArray(records)) throw new Error('Invalid material library');
    return records;
  }
  function hasSaved(task, candidate) {
    try { return read(taskTeam(task)).some(record => record.id === recordId(task, candidate)); }
    catch { return false; }
  }
  function save(task, candidate) {
    if (!task?.referenceSongDemo || !task.candidates?.includes(candidate) || !candidate?.url) return false;
    try {
      const team = taskTeam(task), records = read(team), id = recordId(task, candidate);
      if (records.some(record => record.id === id)) { showToast('该歌曲已保存至素材库'); return true; }
      const material = {
        id, title: candidate.title, url: candidate.url, durationSeconds: candidate.durationSeconds,
        taskId: task.id, runId: task.workId, projectId: task.projectId,
        projectName: task.projectName, planName: task.planName, nodeTitle: task.nodeTitle,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(storageKey(team), JSON.stringify([material, ...records]));
    } catch { showToast('保存失败，请检查浏览器存储空间后重试', 'error'); return false; }
    render();
    showToast('已保存至素材库，可在「资产 → 素材库」查看');
    return true;
  }
  function stopAudio() { panel.querySelectorAll('audio').forEach(audio => audio.pause()); }
  function render() {
    stopAudio();
    try {
      const records = read(activeTeam());
      document.querySelector('#materialCount').textContent = `共 ${records.length} 个素材`;
      document.querySelector('#materialRows').innerHTML = records.map(record => `<tr><td>${escapeHtml(record.title)}</td><td>音频</td><td><audio controls preload="none" src="${escapeHtml(record.url)}" aria-label="试听 ${escapeHtml(record.title)}"></audio></td><td>${escapeHtml(record.projectName || '—')}</td><td>${escapeHtml(new Date(record.createdAt).toLocaleString('zh-CN', { hour12: false }))}</td><td><a href="${escapeHtml(record.url)}" download="${escapeHtml(record.title)}.wav">下载</a></td></tr>`).join('') || '<tr><td colspan="6" class="finished-empty">暂无素材，可在待办的生成歌曲中点击「保存至素材库」</td></tr>';
    } catch {
      document.querySelector('#materialCount').textContent = '素材读取失败';
      document.querySelector('#materialRows').innerHTML = '<tr><td colspan="6" class="finished-empty">无法读取素材，请刷新页面重试。</td></tr>';
    }
  }
  panel.addEventListener('play', event => {
    if (event.target.tagName !== 'AUDIO') return;
    document.querySelectorAll('audio').forEach(audio => { if (audio !== event.target) audio.pause(); });
  }, true);
  new MutationObserver(render).observe(document.querySelector('#assetsPage'), { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(() => { if (panel.hidden) stopAudio(); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  document.querySelectorAll('.workspace-option').forEach(button => button.addEventListener('click', render));
  window.orchestraMaterialLibrary = { hasSaved, save };
  render();
})();

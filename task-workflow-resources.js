/* Read selected outputs and backups from the current task's workflow run. */
(() => {
  const team = () => document.querySelector('.workspace-option.active')?.dataset.workspaceId || 'orchestra-studio';
  const typeOf = resource => ({ lyrics: 'text', text: 'text', '歌词': 'text', '文字': 'text', '文本': 'text', audio: 'audio', song: 'audio', '音频': 'audio', '歌曲': 'audio' }[resource.type || resource.kind]);
  function list(task, type) {
    if (!task || window.noOrganizationMode || typeof projectData === 'undefined') return [];
    const project = projectData.find(item => item.id === task.projectId);
    if (!project || (project.teamId || 'orchestra-studio') !== team()) return [];
    const run = (project.runs || []).find(item => String(item.id) === String(task.workId));
    if (!run) return [];
    const tasks = typeof productionTasks === 'undefined' ? [] : productionTasks.filter(item => item.projectId === project.id && String(item.workId) === String(run.id) && (!task.workflowId || !item.workflowId || item.workflowId === task.workflowId) && (!task.workflowVersion || !item.workflowVersion || item.workflowVersion === task.workflowVersion));
    const records = new Map();
    function add(resource, selection, node, id) {
      if (!['selected', 'backup'].includes(selection) || typeOf(resource) !== type) return;
      if (type === 'text' ? !String(resource.content || '').trim() : !resource.url && !resource.blobId) return;
      const record = { ...resource, id, type, title: resource.title || `${node || '结果资源'} · ${selection === 'selected' ? '输出' : '备选'}${type === 'text' ? '文本' : '音频'}`, sourceLibrary: 'workflow', projectId: project.id, runId: run.id, node: node || '工作流节点', selectionState: selection };
      record.folderPath = `${record.node} · ${selection === 'selected' ? '输出' : '备选'}`;
      records.set(JSON.stringify([resource.sourceTaskId || resource.nodeId || record.node, type === 'text' ? resource.content : resource.blobId || resource.url]), record);
    }
    for (const resource of run.resources || []) {
      if (resource.runId != null && String(resource.runId) !== String(run.id)) continue;
      if (resource.projectId && resource.projectId !== project.id) continue;
      if (resource.sourceTaskId && tasks.some(item => item.id === resource.sourceTaskId)) continue;
      add(resource, resource.selectionState, resource.node, `run:${JSON.stringify([project.id, run.id, resource.id])}`);
    }
    for (const item of tasks) {
      if (item.status === 'terminated') continue;
      const candidates = item.candidates || [], output = item.selectedOutput;
      const selectedId = item.selectedCandidateId || (item.status === 'completed' ? output?.candidateId : '');
      const fallbackType = ['aiSong', 'refSong', 'sampleSong', 'playlistSong', 'uploadSong'].includes(item.nodeType) ? 'audio' : ['aiLyrics', 'refLyrics', 'writeLyrics', 'textInput'].includes(item.nodeType) ? 'text' : '';
      for (const candidate of candidates) {
        const selection = candidate.id === selectedId ? 'selected' : (item.backupCandidateIds || []).includes(candidate.id) ? 'backup' : '';
        const payload = selection === 'selected' && output && (!output.candidateId || output.candidateId === candidate.id) ? { ...candidate, ...output } : { ...candidate };
        const resource = { ...payload, type: payload.type || payload.kind || fallbackType, sourceTaskId: item.id, sourceCandidateId: candidate.id, sourceGenerationId: candidate.generationId || '' };
        if (selection === 'selected' && typeOf(resource) === 'text' && typeof item.selectedCandidateText === 'string') resource.content = item.selectedCandidateText;
        add(resource, selection, item.nodeTitle, `task:${JSON.stringify([item.id, candidate.generationId || candidate.id])}`);
      }
      if (item.status === 'completed' && output && !candidates.some(candidate => candidate.id === selectedId)) {
        add({ ...output, type: output.type || output.kind || fallbackType, sourceTaskId: item.id }, 'selected', item.nodeTitle, `task:${JSON.stringify([item.id, output.candidateId || 'output'])}`);
      }
    }
    return [...records.values()].sort((a, b) => Number(a.selectionState === 'backup') - Number(b.selectionState === 'backup'));
  }
  window.orchestraTaskResultResources = { list };
})();

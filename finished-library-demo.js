/* Finished-library examples use independent completed runs and preserve saved edits. */
(() => {
  const planName = '成品库展示示例';
  const clone = value => JSON.parse(JSON.stringify(value));
  const examples = [
    {key:'morning', name:'晨间来信', creator:'张三', colors:['#35355b','#bf8096','#f3d3a0'], audio:'./assets/reference-song-result-a.wav', count:3,
      lyrics:'清晨的风推开窗\n把昨日心事轻轻放\n沿着光亮去远方\n每一步都有回响\n\n把平凡的日子写成诗行\n让微小的愿望慢慢生长\n你寄来的每一句早安\n都是我心里的晴朗',
      backup:'第一束光落在肩上\n远方的歌轻轻回响\n那些还没说完的话\n开成窗边清晨的花'},
    {key:'seaside', name:'海风与远方', creator:'李四', colors:['#143d4e','#458f97','#f2cc96'], audio:'./assets/reference-song-result-b.wav', count:4,
      lyrics:'海风翻过蓝色的书页\n浪花把脚印轻轻改写\n沿着海岸慢慢走远\n听见夏天停在耳边\n\n把梦装进行李箱\n把爱写在白帆上\n越过人海和山岗\n有你就是我的远方',
      backup:'潮声落在晚风里\n云朵路过旧码头\n我们并肩望向海\n把明天交给自由'},
    {key:'night', name:'夜色回声', creator:'王五', colors:['#171b3e','#5e528b','#b8b5e6'], audio:'./assets/reference-song-result-a.wav', count:2,
      lyrics:'霓虹点亮安静街头\n月光停在你的眼眸\n把没说出口的温柔\n留在夜色的回声中',
      backup:'最后一班车驶过路口\n城市慢慢收起白昼\n我把星光放进口袋\n陪你走到下一个以后'}
  ];
  function cover(example) {
    const [top,bottom,light] = example.colors;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><defs><linearGradient id="sky" x2="0.5" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="600" height="600" fill="url(#sky)"/><circle cx="420" cy="190" r="68" fill="${light}" opacity=".9"/><path d="M0 330Q150 240 300 330T600 310V600H0Z" fill="${top}" opacity=".55"/><path d="M0 405Q170 330 320 405T600 385V600H0Z" fill="${top}" opacity=".7"/><path d="M360 293h115l-42 265H235Z" fill="${light}" opacity=".1"/><path d="M44 50h512M44 550h512" stroke="${light}" stroke-opacity=".4"/><text x="44" y="90" fill="${light}" font-family="sans-serif" font-size="16" letter-spacing="6">音乐成品示例</text><text x="42" y="484" fill="#fff8ec" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="48" letter-spacing="6">${example.name}</text><text x="46" y="523" fill="${light}" font-family="sans-serif" font-size="14" letter-spacing="4">让每一段灵感，都有回响</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function ensure(teamId) {
    if (!teamId || window.noOrganizationMode) return null;
    // An organization-less login must remain limited to the home page.
    try {
      const memberships = JSON.parse(localStorage.getItem('orchestra-login-organizations') || 'null');
      if (Array.isArray(memberships) && !memberships.some(item => item.id === teamId)) return null;
    } catch { return null; }
    const belongs = item => (item.teamId || 'orchestra-studio') === teamId;
    let project = projectData.find(item => belongs(item) && (item.id === 'orchestra-theme-album' || item.finishedLibraryDemoProject))
      || projectData.find(belongs);
    const isNewProject = !project;
    if (!project) project = {
      id:'DEMO-FINISHED-PROJECT-' + encodeURIComponent(teamId), teamId, finishedLibraryDemoProject:true,
      title:'成品展示示例', desc:'用于体验成品查看、编辑与下载', type:'成品示例', progress:100,
      date:'刚刚', color:'linear-gradient(135deg,#35355b,#bf8096)', members:['H'], scope:'owned', risk:false,
      customer:'演示客户', owner:'张三', batches:[], runs:[], works:[], calls:[], metricTasks:[]
    };
    const suffix = project.id === 'orchestra-theme-album' ? '' : '-' + encodeURIComponent(project.id);
    const planId = 'DEMO-FINISHED-LIBRARY-PLAN' + suffix;
    const previous = {batches:project.batches, runs:project.runs, works:project.works};
    const batches = [...(project.batches || [])], runs = [...(project.runs || [])], works = [...(project.works || [])];
    let changed = false;
    if (!batches.some(item => item.id === planId)) {
      batches.push({id:planId, name:planName, quantity:examples.length, completed:examples.length, productionStatus:'已完成', status:'已完成', workflowId:'work-output-production', workflowName:'词曲与成品组装流程', workflowVersion:'V1.0', delivery:'2026-10-31', notes:'用于体验成品查看、编辑与下载。'});
      changed = true;
    }
    examples.forEach((example,index) => {
      const runId = `DEMO-FINISHED-RUN-${example.key}${suffix}`, workId = `DEMO-FINISHED-WORK-${example.key}${suffix}`;
      const createdAt = works.find(item => item.id === workId)?.createdAt || new Date(Date.now() - index * 86400000 - 600000).toISOString();
      let run = runs.find(item => item.id === runId);
      if (!run) {
        const base = {runId, planId, version:'V1', selectionState:'selected'};
        const resources = [
          {...base, id:runId+'-lyrics', type:'text', kind:'歌词', title:example.name+'歌词', node:'基于参考生成歌词', content:example.lyrics},
          {...base, id:runId+'-audio', type:'audio', kind:'音频', title:example.name+'试听版', node:'基于参考曲生成歌曲', url:example.audio, label:'演示试听音频'},
          {...base, id:runId+'-cover', type:'image', kind:'图片', title:example.name+'封面', node:'封面资源', url:cover(example)},
          {...base, id:runId+'-lyrics-backup', type:'text', kind:'歌词', title:example.name+'备选歌词', node:'基于参考生成歌词', selectionState:'backup', version:'V2', content:example.backup},
          {...base, id:runId+'-audio-backup', type:'audio', kind:'音频', title:example.name+'另一种旋律', node:'基于参考曲生成歌曲', selectionState:'backup', version:'V2', url:example.audio.includes('result-a')?'./assets/reference-song-result-b.wav':'./assets/reference-song-result-a.wav', label:'演示试听音频'}
        ];
        run = {id:runId, serial:reserveDailyProductionNumbers({flow:1})?.flow[0] || runId, name:example.name+'成品示例', planId, planName, status:'已完成', stage:'已完成', owner:example.creator, createdAt, startedAt:createdAt, completedAt:createdAt, finishedLibraryDemo:true, resources,
          composition:{batchId:workId+'-batch', committedAt:createdAt, workIds:[workId]}};
        runs.push(run);changed = true;
      }
      if (!works.some(item => item.id === workId)) {
        const selected = example.count === 2 ? [run.resources[1],run.resources[2]] : example.count === 4 ? [run.resources[0],run.resources[1],run.resources[2],run.resources[4]] : run.resources.slice(0,3);
        works.push({id:workId, name:example.name, planId, runId, projectId:project.id, resources:clone(selected), creator:example.creator, createdAt, compositionBatchId:workId+'-batch', finishedLibraryDemo:true});
        changed = true;
      }
    });
    if (!changed) return project;
    Object.assign(project,{batches,runs,works});
    if (isNewProject) projectData.push(project);
    if (modelPersist() === false) {
      Object.assign(project,previous);
      if (isNewProject) projectData.splice(projectData.indexOf(project),1);
      return null;
    }
    syncProjectPlanProductionProgress(project);
    return project;
  }
  window.orchestraFinishedExamples = {ensure};
  ensure(document.querySelector('.workspace-option.active')?.dataset.workspaceId || 'orchestra-studio');
})();

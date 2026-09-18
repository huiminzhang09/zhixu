const navItems=[['✣','创作集合','','集合'],['🏠','首页','active','首页'],['🔔','待办','','待办'],['📂','项目','','项目'],['💰','资产','','资产'],['•••','更多','','更多']];
const navPageMap={'首页':'home','待办':'tasks','项目':'projects','创作集合':'workflows','资产':'assets'};
const recordImages=['photo-1493225457124-a3eb161ffa5f','photo-1514525253161-7a46d19cd819','photo-1501386761578-eac5c94b800a','photo-1521337581100-8ca9a73a5f79','photo-1524368535928-5b5e00ddc76b','photo-1496293455970-f8581aae0e3b','photo-1459749411175-04bf5292ceea','photo-1471478331149-c72f17e33c73'];
const records=['绯红海岸','雨过后的风景','Dear D（亲爱的告白）','爱过的你','零距离的思念','一半一半','single','single'];
const photos=['photo-1516280440614-37939bbacd81','photo-1500530855697-b586d89ba3ee','photo-1511671782779-c97d3d27a1d4','photo-1506157786151-b8491531f063','photo-1460661419201-fd4cecdf8a8b','photo-1501612780327-45045538702b','photo-1494232410401-ad00d5433cfa','photo-1511379938547-c1f69419868d','photo-1507838153414-b4b713384a76','photo-1524650359799-842906ca1c06','photo-1519508234439-4f23643125c1','photo-1525362081669-2b476bb628c3','photo-1524368535928-5b5e00ddc76b','photo-1496293455970-f8581aae0e3b','photo-1459749411175-04bf5292ceea'];
const titles=['深夜回声','城市失重','旧唱片新表达','雨后散步','雨后散步','远方来信','夏夜循环','潮汐之后','一镜到底的春天','一镜到底的春天','深夜回声','公路交换','星际唱片','坠入光中','模糊边界'];
const url=id=>`https://images.unsplash.com/${id}?auto=format&fit=crop&w=700&q=82`;
const nav=document.querySelector('#primaryNav');nav.innerHTML=navItems.map(([i,t,c,s])=>{const page=navPageMap[t];return `<button class="nav-item ${c}" ${page?`data-page="${page}"`:`data-toast="${t+'功能即将开放'}"`}><span class="icon">${i}</span><span class="nav-label-full">${t}</span><span class="nav-label-short">${s}</span></button>`}).join('');
const recordCarousel=document.querySelector('#records');
recordCarousel.innerHTML=[...records,...records].map((recordName,index)=>{const sourceIndex=index%records.length;const clone=index>=records.length;return `<article class="record ${sourceIndex===2?'active':''}" data-record-index="${sourceIndex}" ${clone?'aria-hidden="true"':''}><div class="record-art" style="background-image:url('${url(recordImages[sourceIndex])}')"></div><b>${recordName}</b><small>${sourceIndex%2?'Dizzy Dizzo':'艺术家 · 灵感频道'}</small></article>`}).join('');
const recordCards=Array.from(recordCarousel.querySelectorAll('.record'));
let recordCarouselIndex=0;
let recordCarouselPaused=false;
let recordCarouselResetTimer;
function setActiveRecord(position){const activeIndex=(position+2)%records.length;recordCards.forEach(card=>card.classList.toggle('active',Number(card.dataset.recordIndex)===activeIndex))}
function scrollRecordCarousel(position,behavior='smooth'){const card=recordCards[position];if(!card)return;recordCarousel.scrollTo({left:card.offsetLeft-recordCards[0].offsetLeft,behavior});setActiveRecord(position)}
function advanceRecordCarousel(){if(recordCarouselPaused||document.hidden||!document.querySelector('#homePage').classList.contains('active'))return;recordCarouselIndex+=1;scrollRecordCarousel(recordCarouselIndex);if(recordCarouselIndex===records.length){clearTimeout(recordCarouselResetTimer);recordCarouselResetTimer=setTimeout(()=>{recordCarousel.style.scrollBehavior='auto';recordCarousel.scrollLeft=0;recordCarouselIndex=0;setActiveRecord(0);requestAnimationFrame(()=>recordCarousel.style.scrollBehavior='')},620)}}
if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(advanceRecordCarousel,2800);
recordCarousel.addEventListener('mouseenter',()=>recordCarouselPaused=true);
recordCarousel.addEventListener('mouseleave',()=>recordCarouselPaused=false);
recordCarousel.addEventListener('focusin',()=>recordCarouselPaused=true);
recordCarousel.addEventListener('focusout',()=>requestAnimationFrame(()=>{recordCarouselPaused=recordCarousel.contains(document.activeElement)}));
recordCarousel.addEventListener('pointerdown',()=>recordCarouselPaused=true);
window.addEventListener('pointerup',()=>{if(!recordCarousel.matches(':hover')&&!recordCarousel.contains(document.activeElement))recordCarouselPaused=false});
recordCarousel.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();if(event.key==='ArrowRight')recordCarouselIndex=(recordCarouselIndex+1)%records.length;if(event.key==='ArrowLeft')recordCarouselIndex=(recordCarouselIndex-1+records.length)%records.length;if(event.key==='Home')recordCarouselIndex=0;if(event.key==='End')recordCarouselIndex=records.length-1;scrollRecordCarousel(recordCarouselIndex)});
const tools=[['▣','金曲翻唱','上传歌曲，探索表达方式','#6255ff'],['✎','灵感创作','从一个想法找到创作方向','#22b8a7'],['▤','采样经典','从热门歌曲提取听感线索','#f39c24'],['♫','歌词生成','从主题开始写一首歌词','#28a7a0']];
document.querySelector('#createTools').innerHTML=tools.map(([i,t,d,c])=>`<button class="tool" style="--accent:${c}" data-toast="已选择：${t}"><span class="tool-icon">${i}</span><span><b>${t}</b><small>${d}</small></span></button>`).join('');
const filterNames=['精选','排行榜','欧美','电音','情歌','摇滚','华语','Jazz','Hip-Hop/Rap','•••'];
document.querySelector('#filters').innerHTML=filterNames.map((x,i)=>`<button class="filter ${i===0?'active':''}">${x}</button>`).join('');
const grid=document.querySelector('#musicGrid');grid.innerHTML=photos.map((p,i)=>`<article class="card" data-index="${i}"><div class="art-wrap"><img src="${url(p)}" alt="${titles[i]} 封面" loading="lazy"><span class="badge ${i%3?'video':''}">${i%3?'视频':'音频'}</span><span class="duration">05:10</span><button class="hover-play" aria-label="播放 ${titles[i]}">▶</button></div><h3>${titles[i]}</h3><small>${i%3===1?'氛围短片':'城市流行 Demo'}</small><div class="stats"><span>▷ 344</span><span>♡ 128</span><span>▢ 4</span></div></article>`).join('');
const projectData=[
  {id:'orchestra-theme-album',title:'项目名称',desc:'客户：番茄平台    负责人：张三',type:'团队专辑',progress:68,date:'今天 10:20',color:'linear-gradient(135deg,#4f28c8,#c34767)',members:['H','L','M','+3'],scope:'owned',risk:false},
  {id:'indie-artist-support',title:'独立音乐人扶持计划',desc:'为新锐音乐人提供制作与发行支持',type:'团队企划',progress:52,date:'8月24日',color:'linear-gradient(135deg,#057b8c,#41bd9c)',members:['H','Y','K'],scope:'owned',risk:true},
  {id:'new-media-sound-lab',title:'新媒体声音实验室',desc:'探索生成式音乐与视觉互动的跨媒介表达',type:'创意实验',progress:39,date:'8月24日',color:'linear-gradient(135deg,#d14a42,#ec9f37)',members:['H','A','J','+2'],scope:'joined',risk:true},
  {id:'city-music-festival',title:'城市音乐节片头',desc:'音乐节宣传片配乐与动态声音标识设计',type:'商业协作',progress:81,date:'8月21日',color:'linear-gradient(135deg,#26529a,#7272dd)',members:['H','R','C'],scope:'joined',risk:false},
  {id:'oriental-sample-archive',title:'东方采样档案',desc:'传统乐器与民间声音的数字采样工程',type:'声音档案',progress:26,date:'8月19日',color:'linear-gradient(135deg,#7f3430,#d66d42)',members:['H','S','W','+4'],scope:'team',risk:false},
  {id:'midnight-radio-vol3',title:'午夜电台 Vol.3',desc:'团队播客的配乐、片头与声音包装',type:'播客制作',progress:100,date:'8月16日',color:'linear-gradient(135deg,#343052,#7d5cb0)',members:['H','F'],scope:'joined',risk:false}
];
projectData.forEach((project,index)=>{const quantity=24+index*6;const completed=Math.min(quantity,Math.round(quantity*project.progress/100));project.batches=[{id:`BATCH-202609-${String(index+1).padStart(3,'0')}`,name:`${project.type}首轮制作`,quantity,completed,delivered:index===5?quantity:0,terminated:0,inProgress:completed>0&&completed<quantity?1:0,owner:['张三','Lin Chen','Ming Xu'][index%3],workflowId:index%2?'reference-lab':'midnight-melody',workflowName:index%2?'参考歌实验室':'午夜旋律',workflowVersion:index%2?'V1.0':'V2.1',start:`2026-08-${String(20+index).padStart(2,'0')}`,delivery:`2026-09-${String(6+index).padStart(2,'0')}`,priority:project.risk?'高':'普通',status:project.progress===100?'已完成':project.risk?'需关注':'进行中',progress:project.progress,notes:''}]});
projectData[0].batches.push({id:'BATCH-202609-007',name:'主打歌人声与混音',quantity:18,completed:5,delivered:2,terminated:0,inProgress:1,owner:'Lin Chen',workflowId:'reference-lab',workflowName:'参考歌实验室',workflowVersion:'V1.0',start:'2026-09-03',delivery:'2026-09-12',priority:'高',status:'进行中',progress:28,notes:'优先完成主打歌的人声版本。'});
projectData[0].batches[0].name='第一批生产计划';
projectData[0].batches[1].name='第二批生产计划';
projectData.forEach((project,index)=>{const batch=project.batches[0];project.works=[{name:index%2===0?`${project.type}样片`:'',planId:batch.id,planName:batch.name,serial:`FLOW20260907${String(index+4).padStart(5,'0')}`,status:batch.status==='已完成'?'已完成':'制作中',stage:batch.status==='已完成'?'已完成':'作曲',lyrics:'查看',audio:batch.completed>0?'播放':'暂无',cover:batch.status==='已完成'?'查看':'暂无',owner:batch.owner,updated:`09-0${Math.min(7,index+2)} ${15-index}:30`}]});
projectData[0].works=[
  {name:'窗外',planId:projectData[0].batches[0].id,planName:'第一批生产计划',serial:'FLOW2026090700001',status:'制作中',stage:'作曲',lyrics:'查看',audio:'暂无',cover:'暂无',owner:'张三',updated:'09-07 15:30'},
  {name:'晚风',planId:projectData[0].batches[0].id,planName:'第一批生产计划',serial:'FLOW2026090700002',status:'待审核',stage:'曲审核',lyrics:'查看',audio:'播放',cover:'暂无',owner:'李四',updated:'09-07 14:20'},
  {name:'远方',planId:projectData[0].batches[1].id,planName:'第二批生产计划',serial:'FLOW2026090700003',status:'已完成',stage:'已完成',lyrics:'查看',audio:'播放',cover:'查看',owner:'王五',updated:'09-06 18:40'}
];
projectData[0].batches.unshift({id:'BATCH-202609-REF',name:'参考词曲完整任务',quantity:1,completed:0,delivered:0,terminated:0,inProgress:1,owner:'李四',workflowId:'reference-production',workflowName:'参考词曲完整流程',workflowVersion:'V1.0',start:'2026-09-08',delivery:'2026-09-15',priority:'高',status:'生产中',progress:5,notes:'从参考歌词改写到参考曲生成的完整四节点任务。'});
projectData[0].works.unshift({id:'complete-reference-work',name:'参考词曲创作任务',planId:'BATCH-202609-REF',planName:'参考词曲完整任务',serial:'FLOW2026090800001',status:'制作中',stage:'基于参考生成歌词',lyrics:'暂无',audio:'暂无',cover:'暂无',owner:'李四',updated:'今天 10:30',taskReached:0,taskFeatured:true});
const teamMemberRoster=[
  {id:'huimin-zhang',name:'Huimin Zhang',initial:'H',mark:'H',role:'团队最高管理员',specialty:'统筹与审核'},
  {id:'lin-chen',name:'Lin Chen',initial:'L',mark:'L',role:'团队管理员',specialty:'项目与制作管理'},
  {id:'ming-xu',name:'Ming Xu',initial:'M',mark:'M',role:'制作人',specialty:'歌曲制作'},
  {id:'zhang-san',name:'张三',initial:'张',role:'制作负责人',specialty:'作曲与编曲'},
  {id:'li-si',name:'李四',initial:'李',role:'制作人',specialty:'歌词与内容审核'},
  {id:'wang-wu',name:'王五',initial:'王',role:'音频制作人',specialty:'混音与母带'},
  {id:'yun-li',name:'Yun Li',initial:'Y',mark:'Y',role:'制作人',specialty:'歌词创作'},
  {id:'kai-zhou',name:'Kai Zhou',initial:'K',mark:'K',role:'制作人',specialty:'歌曲生成'},
  {id:'an-qi',name:'An Qi',initial:'A',mark:'A',role:'制作人',specialty:'声音设计'},
  {id:'jia-he',name:'Jia He',initial:'J',mark:'J',role:'制作人',specialty:'采样制作'},
  {id:'rui-chen',name:'Rui Chen',initial:'R',mark:'R',role:'制作人',specialty:'编曲'},
  {id:'chen-yu',name:'Chen Yu',initial:'C',mark:'C',role:'制作人',specialty:'音频审核'},
  {id:'song-lin',name:'Song Lin',initial:'S',mark:'S',role:'制作人',specialty:'人声制作'},
  {id:'wei-luo',name:'Wei Luo',initial:'W',mark:'W',role:'制作人',specialty:'混音'},
  {id:'fang-yuan',name:'Fang Yuan',initial:'F',mark:'F',role:'制作人',specialty:'交付审核'}
];
const projectWorkAssignmentStorageKey='orchestra-project-work-assignments-v3';
let savedProjectWorkAssignments={};
try{savedProjectWorkAssignments=JSON.parse(localStorage.getItem(projectWorkAssignmentStorageKey)||'{}')||{}}catch{savedProjectWorkAssignments={}}
projectData.forEach(project=>(project.works||[]).forEach((work,index)=>{work.id=work.id||work.serial||`${project.id}-work-${index+1}`;const saved=savedProjectWorkAssignments[`${project.id}:${work.id}`];if(saved){work.nodeAssignments=saved.nodeAssignments||{};work.lastAssigneeId=saved.lastAssigneeId||'';work.lastAssignmentNode=saved.lastAssignmentNode||'';work.owner=saved.owner||work.owner;work.updated=saved.updated||work.updated}}));
function persistProjectWorkAssignments(){const payload={};projectData.forEach(project=>(project.works||[]).forEach(work=>{if(!work.nodeAssignments||!Object.keys(work.nodeAssignments).length)return;payload[`${project.id}:${work.id}`]={nodeAssignments:work.nodeAssignments,lastAssigneeId:work.lastAssigneeId,lastAssignmentNode:work.lastAssignmentNode,owner:work.owner,updated:work.updated}}));try{localStorage.setItem(projectWorkAssignmentStorageKey,JSON.stringify(payload));return true}catch{return false}}
const projectWorkNamesStorageKey='orchestra-project-work-names-v1';
try{const names=JSON.parse(localStorage.getItem(projectWorkNamesStorageKey)||'{}');projectData.forEach(project=>(project.works||[]).forEach(work=>{const record=names[JSON.stringify([project.id,String(work.id)])],name=typeof record==='string'?record:record?.name;if(typeof name==='string'&&name.trim())work.name=name;if(record?.updatedAt&&(!/^\d{4}[-/]/.test(work.updated||'')||new Date(record.updatedAt)>new Date(work.updated)))work.updated=record.updatedAt}))}catch{}
function saveProjectWorkName(project,work,value){
  const name=String(value||'').trim();
  if(!name){showToast('请输入作品名称','error');return false}
  if(Array.from(name).length>100){showToast('作品名称不能超过 100 个字符','error');return false}
  const updatedAt=new Date().toISOString();
  try{const names=JSON.parse(localStorage.getItem(projectWorkNamesStorageKey)||'{}');names[JSON.stringify([project.id,String(work.id)])]={name,updatedAt};localStorage.setItem(projectWorkNamesStorageKey,JSON.stringify(names))}catch{showToast('作品名称保存失败，请稍后重试','error');return false}
  work.name=name;work.updated=updatedAt;
  productionTasks.filter(task=>task.projectId===project.id&&String(task.workId)===String(work.id)).forEach(task=>task.workName=name);
  persistProductionTasks();
  return true;
}
function projectAssignableMembers(project){const target=Math.max(1,projectMemberCount(project)),members=[];const add=member=>{if(member&&!members.some(item=>item.id===member.id)&&members.length<target)members.push(member)};(project.members||[]).filter(mark=>!mark.startsWith('+')).forEach(mark=>add(teamMemberRoster.find(member=>member.mark===mark)));(project.works||[]).forEach(work=>add(teamMemberRoster.find(member=>member.name===work.owner)));teamMemberRoster.forEach(add);return members}
const projectGrid=document.querySelector('#projectGrid'),projectEmpty=document.querySelector('#projectEmpty');
const projectFilterTabs=Array.from(document.querySelectorAll('[data-project-filter]'));
const projectFilterLabels={all:'全部项目',owned:'我负责的',joined:'我参与的'};
const projectCustomerManagement=document.querySelector('#projectCustomerManagement');
const projectDetailTabs=Array.from(document.querySelectorAll('[data-project-detail-tab]'));
const projectDetailPanels=Array.from(document.querySelectorAll('[data-project-detail-panel]'));
const projectPlanList=document.querySelector('#projectPlanList');
const projectPlanTableWrap=document.querySelector('#projectPlanTableWrap');
const projectPlanEmpty=document.querySelector('#projectPlanEmpty');
const projectWorksGrid=document.querySelector('#projectWorksGrid');
const projectWorksTableWrap=document.querySelector('#projectWorksTableWrap');
const projectWorksEmpty=document.querySelector('#projectWorksEmpty');
const projectWorksPlanFilter=document.querySelector('#projectWorksPlanFilter');
const projectWorksResultCount=document.querySelector('#projectWorksResultCount');
const projectWorksSelectAllMobile=document.querySelector('#projectWorksSelectAllMobile');
const projectWorksBulkbar=document.querySelector('#projectWorksBulkbar');
const projectWorksSelectedCount=document.querySelector('#projectWorksSelectedCount');
const clearProjectWorksSelection=document.querySelector('#clearProjectWorksSelection');
const assignProjectWorks=document.querySelector('#assignProjectWorks');
const projectWorksEmptyTitle=document.querySelector('#projectWorksEmptyTitle');
const projectWorksEmptyDescription=document.querySelector('#projectWorksEmptyDescription');
const projectEfficiencyList=document.querySelector('#projectEfficiencyList');
const projectWorkAssignmentDialog=document.querySelector('#projectWorkAssignmentDialog');
const projectWorkAssignmentForm=document.querySelector('#projectWorkAssignmentForm');
const projectWorkAssignmentNodeList=document.querySelector('#projectWorkAssignmentNodeList');
const projectWorkAssignmentAllMember=document.querySelector('#projectWorkAssignmentAllMember');
const projectWorkAssignmentNodeHint=document.querySelector('#projectWorkAssignmentNodeHint');
const projectWorkAssignmentProgress=document.querySelector('#projectWorkAssignmentProgress');
let selectedProjectId=projectData[0].id;
let currentProjectFilter='all';
const PROJECT_LOAD_BATCH_SIZE=6;
let projectVisibleCount=PROJECT_LOAD_BATCH_SIZE;
let projectMatchingItems=[];
let projectLoadFrame=null;
const projectLoadStatus=document.createElement('div');
projectLoadStatus.className='project-load-status';
projectLoadStatus.setAttribute('role','status');
projectLoadStatus.setAttribute('aria-live','polite');
document.querySelector('#projectsPage .project-pagination')?.remove();
projectGrid.after(projectLoadStatus);
let currentProjectWorksPlan='all';
let selectedProjectWorkIds=new Set();
let activeProjectWorkAssignment=null;
let projectWorkAssignmentReturnFocus=null;
const escapeHtml=value=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
function projectMemberCount(project){return project.members.reduce((total,member)=>total+(member.startsWith('+')?Number(member.slice(1))||0:1),0)}
function projectWorkCount(project){return (project.works||[]).length}
function formatProjectDate(value){return value?String(value).replaceAll('-','.'):'—'}
function richTextPlainText(value){const template=document.createElement('template');template.innerHTML=String(value||'');return (template.content.textContent||'').replace(/\s+/g,' ').trim()}
function sanitizeRichText(value){const template=document.createElement('template');template.innerHTML=String(value||'');const allowed=new Set(['B','STRONG','I','EM','U','P','DIV','BR','UL','OL','LI']);Array.from(template.content.querySelectorAll('*')).forEach(node=>{if(!allowed.has(node.tagName)){node.replaceWith(...node.childNodes);return}Array.from(node.attributes).forEach(attribute=>node.removeAttribute(attribute.name))});return template.innerHTML.trim()}
function projectPlanNotesText(value){return richTextPlainText(value)||'—'}
const projectPlanStatusMeta={
  '生产中':{className:'active',description:'生产计划尚未全部完成生产'},
  '已完成':{className:'delivered',description:'生产计划下的所有作品均已完成'}
};
function syncProjectPlanProductionProgress(project){
  for(const batch of project.batches||[]){
    const works=(project.works||[]).filter(work=>String(work.planId)===String(batch.id));
    batch.completed=works.filter(work=>['已完成','已交付'].includes(work.status)).length;
    batch.productionStatus=works.length>0&&batch.completed===works.length?'已完成':'生产中';
    batch.status=batch.productionStatus;
  }
}
function projectPlanProductionStatus(batch){return batch.productionStatus==='已完成'?'已完成':'生产中'}
function projectPlanRow(batch){const notes=projectPlanNotesText(batch.notes),workflowName=batch.workflowName||'—',workflowVersion=batch.workflowVersion?` · ${batch.workflowVersion}`:'',quantity=Number(batch.quantity),rawCompleted=Number(batch.completed),completed=Number.isFinite(rawCompleted)?Math.max(0,Math.min(Number.isFinite(quantity)?quantity:rawCompleted,Math.floor(rawCompleted))):0,status=projectPlanProductionStatus(batch),statusMeta=projectPlanStatusMeta[status];return `<div class="project-plan-row" role="row"><div class="project-plan-cell primary" role="cell" data-label="计划名称"><b>${escapeHtml(batch.name||'—')}</b></div><div class="project-plan-cell" role="cell" data-label="生产数量">${escapeHtml(batch.quantity??'—')}</div><div class="project-plan-cell project-plan-completed" role="cell" data-label="生产完成数量">${escapeHtml(completed)}</div><div class="project-plan-cell" role="cell" data-label="生产进度"><span class="project-plan-status ${statusMeta.className}" title="${escapeHtml(statusMeta.description)}">${escapeHtml(status)}</span></div><div class="project-plan-cell" role="cell" data-label="工作流">${escapeHtml(workflowName)}${escapeHtml(workflowVersion)}</div><div class="project-plan-cell" role="cell" data-label="交付日期">${formatProjectDate(batch.delivery)}</div><div class="project-plan-cell project-plan-notes" role="cell" data-label="备注" title="${escapeHtml(notes)}">${escapeHtml(notes)}</div><div class="project-plan-cell project-plan-actions" role="cell" data-label="操作"><button type="button" data-plan-works="${escapeHtml(batch.id)}">查看作品</button></div></div>`}
function renderProjectPlans(project){syncProjectPlanProductionProgress(project);const batches=project.batches||[];projectPlanList.innerHTML=`<div class="project-plan-row head" role="row"><span role="columnheader">计划名称</span><span role="columnheader">生产数量</span><span role="columnheader">生产完成数量</span><span role="columnheader">生产进度</span><span role="columnheader">工作流</span><span role="columnheader">交付日期</span><span role="columnheader">备注</span><span role="columnheader">操作</span></div>${batches.map(projectPlanRow).join('')}`;projectPlanTableWrap.hidden=!batches.length;projectPlanEmpty.hidden=Boolean(batches.length)}
function projectWorkDisplayName(work,index){const name=String(work.name||'').trim();if(name)return name;const sequence=Number(work.planNameSequence);if(Number.isSafeInteger(sequence)&&sequence>0){const prefix=String(work.defaultNamePrefix||work.planName||'未命名生产计划').trim()||'未命名生产计划';return `${prefix}-${String(sequence).padStart(3,'0')}`}return `未命名-${work.serial?String(work.serial).slice(-4):String(index+1).padStart(4,'0')}`}
function projectWorkStatusLabel(status){return status==='已终止'?'已终止':['已完成','已交付'].includes(status)?'已完成':'制作中'}
function projectWorkStatusClass(status){return {已完成:'completed',已终止:'terminated',制作中:'making'}[projectWorkStatusLabel(status)]}
function projectWorkUpdateDate(work,now=new Date()){
  const raw=String(work.updated||'');
  if(/^\d{4}[-/]\d{2}[-/]\d{2}/.test(raw)){const date=new Date(raw.replace(/^(\d{4})\/(\d{2})\/(\d{2})/,'$1-$2-$3'));if(!Number.isNaN(date.getTime()))return date}
  const partial=raw.match(/^(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
  if(partial){const year=String(work.serial||'').match(/^FLOW(\d{4})/)?.[1]||now.getFullYear();return new Date(Number(year),Number(partial[1])-1,Number(partial[2]),Number(partial[3]),Number(partial[4]))}
  const relative=raw.match(/^(今天|昨天)\s*(\d{1,2}):(\d{2})$/);
  if(relative){const date=new Date(now);if(relative[1]==='昨天')date.setDate(date.getDate()-1);date.setHours(Number(relative[2]),Number(relative[3]),0,0);return date}
  const stored=new Date(work.updatedAt||work.createdAt||now);return Number.isNaN(stored.getTime())?now:stored;
}
function projectWorkUpdatedLabel(work){const date=projectWorkUpdateDate(work);return `${localDateValue(date)} ${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`}
function projectWorkAssetCell(kind,value,name){const action=String(value||'暂无');if(action==='暂无')return '<span class="project-work-missing">暂无</span>';const message=action==='播放'?`正在播放「${name}」音频`:`已打开「${name}」${kind}`;return `<button class="project-work-action" type="button" data-toast="${escapeHtml(message)}">${escapeHtml(action)}</button>`}
function projectWorkName(project,work){const unnamed=(project.works||[]).filter(item=>!String(item.name||'').trim()),index=Math.max(0,unnamed.indexOf(work));return projectWorkDisplayName(work,index)}
function visibleProjectWorks(project){const works=project.works||[];return currentProjectWorksPlan==='all'?works:works.filter(work=>String(work.planId)===currentProjectWorksPlan)}
function projectWorkOwnerName(project,work){
  if(['已完成','已交付'].includes(work.status))return '-';
  const placeholders=new Set(['多人协作','未分配','待分配','—']);
  const context=projectWorkAssignmentContext(project,work),nodes=context?.snapshot?.nodes||[];
  const tasks=productionTasks.filter(task=>task.projectId===project.id&&String(task.workId)===String(work.id));
  const ended=['已完成','已交付','已终止'].includes(work.status);
  const task=tasks.find(item=>item.status==='in_progress')||(ended?tasks.slice().sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)||b.nodeIndex-a.nodeIndex)[0]:null);
  const stageTypes={'作词':'refLyrics','歌词生成':'refLyrics','作曲':'refSong','歌曲生成':'refSong','曲审核':'songReview'};
  const node=task?(nodes.find(item=>item.id===task.nodeId)||{id:task.nodeId}):nodes.find(item=>item.title===work.stage||item.type===stageTypes[work.stage])||(ended?nodes[nodes.length-1]:null);
  const hasAssignments=Object.keys(work.nodeAssignments||{}).length>0;
  let assignee=node&&context?taskAssigneeForNode(context,node):null;
  if(!hasAssignments&&task?.assigneeId)assignee={id:task.assigneeId,name:task.assigneeName};
  const name=String(assignee?(teamMemberRoster.find(member=>member.id===assignee.id)?.name||assignee.name||''):hasAssignments?'':teamMemberRoster.find(member=>member.id===work.lastAssigneeId)?.name||work.owner||'').trim();
  return name&&!placeholders.has(name)?name:'—';
}
function projectWorkRow(work,index,planNameMap,project){const name=projectWorkDisplayName(work,index),planName=planNameMap.get(String(work.planId))||work.planName||'—',checked=selectedProjectWorkIds.has(String(work.id)),owner=projectWorkOwnerName(project,work),stage=projectWorkStatusLabel(work.status)==='已完成'?'—':work.stage||'—';return `<div class="project-work-row${checked?' is-selected':''}" role="row" data-work-row="${escapeHtml(work.id)}"><div class="project-work-cell project-work-select-cell" role="cell" data-label="选择"><label class="project-work-select"><input type="checkbox" data-work-select="${escapeHtml(work.id)}" aria-label="选择作品 ${escapeHtml(name)}" ${checked?'checked':''} /></label></div><div class="project-work-cell primary" role="cell" data-label="作品名称"><button class="project-work-name-button" type="button" data-edit-work-name title="${escapeHtml(name)} · 点击编辑" aria-label="编辑作品名称：${escapeHtml(name)}"><b>${escapeHtml(name)}</b><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"/></svg></button></div><div class="project-work-cell project-work-plan" role="cell" data-label="所属生产计划">${escapeHtml(planName)}</div><div class="project-work-cell serial" role="cell" data-label="作品编号" title="${escapeHtml(work.workNumber||'')}">${escapeHtml(work.workNumber||'—')}</div><div class="project-work-cell" role="cell" data-label="状态"><span class="project-work-status ${projectWorkStatusClass(work.status)}">${escapeHtml(projectWorkStatusLabel(work.status))}</span></div><div class="project-work-cell" role="cell" data-label="当前执行节点">${escapeHtml(stage)}</div><div class="project-work-cell project-work-owner" role="cell" data-label="负责人"><b title="${escapeHtml(owner)}">${escapeHtml(owner)}</b></div><div class="project-work-cell" role="cell" data-label="歌词">${projectWorkAssetCell('歌词',work.lyrics,name)}</div><div class="project-work-cell" role="cell" data-label="音频">${projectWorkAssetCell('音频',work.audio,name)}</div></div>`}
function syncProjectWorkSelectionUI(works){const ids=works.map(work=>String(work.id)),selectedVisible=ids.filter(id=>selectedProjectWorkIds.has(id)).length,allSelected=ids.length>0&&selectedVisible===ids.length;projectWorksBulkbar.hidden=selectedProjectWorkIds.size===0;projectWorksSelectedCount.textContent=`已选择 ${selectedProjectWorkIds.size} 个作品`;const master=projectWorksGrid.querySelector('[data-work-select-all]');if(master){master.checked=allSelected;master.indeterminate=selectedVisible>0&&!allSelected}projectWorksSelectAllMobile.checked=allSelected;projectWorksSelectAllMobile.indeterminate=selectedVisible>0&&!allSelected;projectWorksSelectAllMobile.disabled=!ids.length}
function setVisibleProjectWorksSelection(checked){const project=projectData.find(item=>item.id===selectedProjectId);if(!project)return;visibleProjectWorks(project).forEach(work=>{const id=String(work.id);if(checked)selectedProjectWorkIds.add(id);else selectedProjectWorkIds.delete(id)});renderProjectWorks(project)}
function clearSelectedProjectWorks(restoreFocus=false){selectedProjectWorkIds.clear();const project=projectData.find(item=>item.id===selectedProjectId);if(project)renderProjectWorks(project);if(restoreFocus)requestAnimationFrame(()=>projectWorksPlanFilter.focus({preventScroll:true}))}
function renderProjectWorks(project){ensureProjectWorkNumbers();const plans=project.batches||[],planNameMap=new Map(plans.map(plan=>[String(plan.id),plan.name||'未命名生产计划'])),validPlanIds=new Set(planNameMap.keys());if(currentProjectWorksPlan!=='all'&&!validPlanIds.has(currentProjectWorksPlan))currentProjectWorksPlan='all';projectWorksPlanFilter.innerHTML=`<option value="all">全部生产计划</option>${plans.map(plan=>`<option value="${escapeHtml(plan.id)}">${escapeHtml(plan.name||'未命名生产计划')}</option>`).join('')}`;projectWorksPlanFilter.value=currentProjectWorksPlan;const allWorks=project.works||[],unnamedOrder=new Map();let unnamedIndex=0;allWorks.forEach((work,index)=>{work.id=work.id||work.serial||`${project.id}-work-${index+1}`;if(!String(work.name||'').trim())unnamedOrder.set(work,unnamedIndex++)});const validWorkIds=new Set(allWorks.map(work=>String(work.id)));selectedProjectWorkIds=new Set([...selectedProjectWorkIds].filter(id=>validWorkIds.has(id)));const works=visibleProjectWorks(project),rows=works.map(work=>projectWorkRow(work,unnamedOrder.get(work)||0,planNameMap,project));projectWorksGrid.innerHTML=`<div class="project-work-row head" role="row"><div class="project-work-select-cell" role="columnheader"><label class="project-work-select"><input type="checkbox" data-work-select-all aria-label="全选当前筛选结果" /></label></div><span role="columnheader">作品名称</span><span role="columnheader">所属生产计划</span><span role="columnheader">作品编号</span><span role="columnheader">状态</span><span role="columnheader">当前执行节点</span><span role="columnheader">负责人</span><span role="columnheader">歌词</span><span role="columnheader">音频</span></div>${rows.join('')}`;projectWorksResultCount.textContent=`${works.length} 个作品`;projectWorksTableWrap.hidden=!works.length;projectWorksEmpty.hidden=Boolean(works.length);projectWorksEmptyTitle.textContent=currentProjectWorksPlan==='all'?'暂无作品':'该生产计划暂无作品';projectWorksEmptyDescription.textContent=currentProjectWorksPlan==='all'?'生产开始后，作品会在这里持续沉淀。':'可切换其他生产计划查看已生成的作品。';syncProjectWorkSelectionUI(works)}
function selectedProjectWorks(project){return (project.works||[]).filter(work=>selectedProjectWorkIds.has(String(work.id)))}
function projectWorkAssignmentContext(project,work){const plan=(project.batches||[]).find(batch=>String(batch.id)===String(work.planId));if(!plan)return null;const published=window.orchestraWorkflowCanvas?.getPublishedSnapshot?.(plan.workflowId,plan.workflowVersion);const snapshot=published?{...published,nodes:operationalWorkflowNodes(published.nodes)}:null;return {work,plan,snapshot}}
function projectWorkAssignmentKey(context,nodeId){return `${context.plan.workflowId}:${context.plan.workflowVersion}:${nodeId}`}
function projectWorkMemberOptions(members,selectedId=''){const mixed=selectedId==='__mixed__'?'<option value="__mixed__" selected>多名负责人（保持原分配）</option>':'';return '<option value="">请选择负责人</option>'+mixed+members.map(member=>`<option value="${escapeHtml(member.id)}" ${member.id===selectedId?'selected':''}>${escapeHtml(member.name)} · ${escapeHtml(member.role)}</option>`).join('')}
function commonProjectWorkNodeAssignee(contexts,nodeId){const assignees=contexts.map(context=>context.work.nodeAssignments?.[projectWorkAssignmentKey(context,nodeId)]?.memberId||''),unique=new Set(assignees);if(unique.size===1)return assignees[0];return assignees.some(Boolean)?'__mixed__':''}
function populateProjectWorkAssignmentNodes(nodes,members,contexts){const categoryMeta={input:{label:'输入节点',symbol:'入'},lyrics:{label:'歌词节点',symbol:'文'},song:{label:'歌曲节点',symbol:'音'}};projectWorkAssignmentNodeList.innerHTML=nodes.map((node,index)=>{const category=node.category||'song',meta=categoryMeta[category]||{label:'工作流节点',symbol:'节'},selectedId=commonProjectWorkNodeAssignee(contexts,node.id);return `<article class="project-work-node-row${selectedId?' is-assigned':''}${selectedId==='__mixed__'?' is-mixed':''}" role="listitem" data-node-row="${escapeHtml(node.id)}"><span class="project-work-node-index">${String(index+1).padStart(2,'0')}</span><div class="project-work-node-copy"><div><i class="${escapeHtml(category)}">${meta.symbol}</i><b>${escapeHtml(node.title)}</b><span>${meta.label}</span></div><small>${escapeHtml(node.subtitle||'工作流生产节点')}</small></div><label class="project-work-node-member"><span>负责人 <em>*</em></span><select data-node-assignee="${escapeHtml(node.id)}" aria-label="为${escapeHtml(node.title)}节点选择负责人" required>${projectWorkMemberOptions(members,selectedId)}</select></label></article>`}).join('');updateProjectWorkAssignmentProgress()}
function updateProjectWorkAssignmentProgress(){const selects=Array.from(projectWorkAssignmentNodeList.querySelectorAll('[data-node-assignee]')),assigned=selects.filter(select=>Boolean(select.value)).length;selects.forEach(select=>{const row=select.closest('[data-node-row]');row?.classList.toggle('is-assigned',Boolean(select.value));row?.classList.toggle('is-mixed',select.value==='__mixed__');if(select.value)select.removeAttribute('aria-invalid')});projectWorkAssignmentProgress.textContent=`${assigned} / ${selects.length} 已分配`}
function openProjectWorkAssignmentDialog(){const project=projectData.find(item=>item.id===selectedProjectId),works=project?selectedProjectWorks(project):[];if(!project||!works.length){showToast('请先勾选需要分配的作品','error');return}const contexts=works.map(work=>projectWorkAssignmentContext(project,work));if(contexts.some(context=>!context)){showToast('部分作品未关联生产计划，暂无法分配','error');return}const signatures=new Set(contexts.map(context=>`${context.plan.workflowId}:${context.plan.workflowVersion}`));if(signatures.size!==1){showToast('批量分配需选择同一工作流版本下的作品','error');return}const snapshot=contexts[0].snapshot;if(!snapshot){showToast('未找到该生产计划绑定的已发布工作流版本','error');return}if(!snapshot.nodes.length){showToast('该工作流版本暂无可分配节点','error');return}const members=projectAssignableMembers(project);if(!members.length){showToast('当前项目暂无可分配成员','error');return}activeProjectWorkAssignment={project,works,contexts,snapshot,members};projectWorkAssignmentReturnFocus=document.activeElement;projectWorkAssignmentForm.reset();projectWorkAssignmentAllMember.innerHTML='<option value="">选择后应用到全部节点</option>'+members.map(member=>`<option value="${escapeHtml(member.id)}">${escapeHtml(member.name)} · ${escapeHtml(member.role)}</option>`).join('');populateProjectWorkAssignmentNodes(snapshot.nodes,members,contexts);document.querySelector('#projectWorkAssignmentCount').textContent=`已选择 ${works.length} 个作品`;const planNames=[...new Set(contexts.map(context=>context.plan.name))];document.querySelector('#projectWorkAssignmentWorkflow').textContent=`${planNames.join('、')} · ${contexts[0].plan.workflowName} ${contexts[0].plan.workflowVersion}`;document.querySelector('#projectWorkAssignmentNames').innerHTML=works.map(work=>`<span title="${escapeHtml(projectWorkName(project,work))}">${escapeHtml(projectWorkName(project,work))}</span>`).join('');document.querySelector('#projectWorkAssignmentDescription').textContent=`为已选择的 ${works.length} 个作品配置节点分工，每个环节只能选择一位负责人。`;projectWorkAssignmentNodeHint.textContent=`当前工作流：${contexts[0].plan.workflowName} ${contexts[0].plan.workflowVersion}（已发布，共 ${snapshot.nodes.length} 个节点）`;projectWorkAssignmentDialog.hidden=false;document.body.classList.add('order-dialog-open');requestAnimationFrame(()=>projectWorkAssignmentNodeList.querySelector('[data-node-assignee]')?.focus({preventScroll:true}))}
function closeProjectWorkAssignmentDialog(restoreFocus=true){projectWorkAssignmentDialog.hidden=true;document.body.classList.remove('order-dialog-open');activeProjectWorkAssignment=null;if(restoreFocus){const target=projectWorkAssignmentReturnFocus?.isConnected?projectWorkAssignmentReturnFocus:projectWorksPlanFilter;requestAnimationFrame(()=>target.focus({preventScroll:true}))}}
projectWorkAssignmentAllMember.addEventListener('change',()=>{if(!projectWorkAssignmentAllMember.value)return;projectWorkAssignmentNodeList.querySelectorAll('[data-node-assignee]').forEach(select=>{select.value=projectWorkAssignmentAllMember.value});projectWorkAssignmentAllMember.value='';updateProjectWorkAssignmentProgress()});
projectWorkAssignmentNodeList.addEventListener('change',event=>{if(event.target.matches('[data-node-assignee]'))updateProjectWorkAssignmentProgress()});
projectWorkAssignmentForm.addEventListener('submit',event=>{event.preventDefault();if(!activeProjectWorkAssignment)return;const selects=Array.from(projectWorkAssignmentNodeList.querySelectorAll('[data-node-assignee]')),missing=selects.find(select=>!select.value);if(missing){missing.setAttribute('aria-invalid','true');const node=activeProjectWorkAssignment.snapshot.nodes.find(item=>item.id===missing.dataset.nodeAssignee);return requireOrderControl(missing,`请为「${node?.title||'工作流节点'}」选择负责人`)}const assignments=selects.map(select=>({node:activeProjectWorkAssignment.snapshot.nodes.find(item=>item.id===select.dataset.nodeAssignee),member:select.value==='__mixed__'?null:activeProjectWorkAssignment.members.find(item=>item.id===select.value),preserve:select.value==='__mixed__'}));if(assignments.some(item=>!item.node||(!item.preserve&&!item.member))){showToast('节点或成员信息无效，请重新选择','error');return}const count=activeProjectWorkAssignment.works.length,project=activeProjectWorkAssignment.project,assignedAt=Date.now(),previousTasks=productionTasks.map(task=>({...task})),previousStates=activeProjectWorkAssignment.contexts.map(context=>({work:context.work,nodeAssignments:{...(context.work.nodeAssignments||{})},lastAssigneeId:context.work.lastAssigneeId,lastAssignmentNode:context.work.lastAssignmentNode,owner:context.work.owner,updated:context.work.updated,status:context.work.status,stage:context.work.stage}));activeProjectWorkAssignment.contexts.forEach(context=>{context.work.nodeAssignments||={};assignments.forEach(({node,member,preserve})=>{const assignmentKey=projectWorkAssignmentKey(context,node.id);if(preserve){const existing=context.work.nodeAssignments[assignmentKey];if(existing)context.work.nodeAssignments[assignmentKey]={...existing,assignedAt};return;}context.work.nodeAssignments[assignmentKey]={workflowId:context.plan.workflowId,workflowVersion:context.plan.workflowVersion,nodeId:node.id,nodeName:node.title,memberId:member.id,memberName:member.name,assignedAt}});const currentAssignments=activeProjectWorkAssignment.snapshot.nodes.map(node=>context.work.nodeAssignments[projectWorkAssignmentKey(context,node.id)]).filter(Boolean),uniqueMemberIds=new Set(currentAssignments.map(item=>item.memberId));if(uniqueMemberIds.size===1){const only=currentAssignments[0];context.work.lastAssigneeId=only.memberId;context.work.owner=only.memberName}else if(uniqueMemberIds.size>1){context.work.lastAssigneeId='';context.work.owner='多人协作'}context.work.lastAssignmentNode=currentAssignments.length?`${currentAssignments.length} 个节点已分配`:'';context.work.updated=new Date().toISOString()});const createdTasks=ensureAssignedProductionTasks(project,activeProjectWorkAssignment.works);if(!persistProjectWorkAssignments()||!persistProductionTasks()){productionTasks=previousTasks;previousStates.forEach(previous=>Object.assign(previous.work,{nodeAssignments:previous.nodeAssignments,lastAssigneeId:previous.lastAssigneeId,lastAssignmentNode:previous.lastAssignmentNode,owner:previous.owner,updated:previous.updated,status:previous.status,stage:previous.stage}));persistProjectWorkAssignments();persistProductionTasks();showToast('人员分配保存失败，请稍后重试','error');return}selectedProjectWorkIds.clear();closeProjectWorkAssignmentDialog(false);renderProjectWorks(project);renderTaskCenter();showToast(createdTasks?`已分配 ${count} 个作品，${createdTasks} 个当前节点任务已加入待办`:`已更新 ${count} 个作品的节点分工及待办负责人`);requestAnimationFrame(()=>projectWorksPlanFilter.focus({preventScroll:true}))});
function renderProjectEfficiency(project){const memberNameMap={H:'Huimin Zhang',L:'Lin Chen',M:'Ming Xu',Y:'Yun Li',K:'Kai Zhou',A:'An Qi',J:'Jia He',R:'Rui Chen',C:'Chen Yu',S:'Song Lin',W:'Wei Luo',F:'Fang Yuan'};const members=project.members.filter(member=>!member.startsWith('+')).map(member=>({mark:member,name:memberNameMap[member]||`成员 ${member}`}));projectEfficiencyList.innerHTML=`<div class="project-efficiency-row head"><span>成员</span><span>负责批次</span><span>计划产量</span><span>完成效率</span></div>${members.map((member,index)=>{const owned=(project.batches||[]).filter(batch=>batch.owner===member.name||batch.owner.startsWith(member.name.split(' ')[0]));const planned=owned.reduce((total,batch)=>total+batch.quantity,0);const efficiency=Math.max(18,Math.min(100,project.progress-index*7));return `<div class="project-efficiency-row"><div class="efficiency-member"><i>${escapeHtml(member.mark)}</i><b>${escapeHtml(member.name)}</b></div><span>${owned.length||index+1} 个</span><span>${planned||12+index*6} 份</span><div class="efficiency-rate"><span><i style="--efficiency:${efficiency}%"></i></span><b>${efficiency}%</b></div></div>`}).join('')}`}
function renderProjectReferenceInfo(project){
  const order=businessOrders.find(item=>item.id===project.orderId);
  const references=project.references??order?.references??[];
  document.querySelector('#projectDetailReferences').innerHTML=references.length?references.map(reference=>{
    const file=typeof reference==='string'?{name:reference}:reference;
    const size=Number.isFinite(file.size)?(file.size<1024?`${file.size} B`:file.size<1024*1024?`${(file.size/1024).toFixed(1)} KB`:`${(file.size/1024/1024).toFixed(1)} MB`):'';
    return `<li title="${escapeHtml(file.name||'未命名文件')}"><span>${escapeHtml(file.name||'未命名文件')}</span>${size?`<small>${size}</small>`:''}</li>`;
  }).join(''):'<li class="project-detail-empty">暂无参考资料</li>';
  const notes=sanitizeRichText(project.notes??order?.notes??'');
  const notesElement=document.querySelector('#projectDetailNotes');
  notesElement.textContent=richTextPlainText(notes)||'暂无项目备注';
  notesElement.title=notesElement.textContent;
  document.querySelector('#projectDetailReferences').title=references.map(reference=>typeof reference==='string'?reference:reference.name).join('、')||'暂无参考资料';
}
function renderProjectDetail(){const project=projectData.find(item=>item.id===selectedProjectId);if(!project)return;document.querySelector('#projectDetailTitle').textContent=project.title;document.querySelector('#projectDetailDescription').textContent=project.desc;renderProjectReferenceInfo(project);document.querySelector('#projectDetailRisk')?.remove();document.querySelector('#projectDetailPlanCount').textContent=project.batches.length;document.querySelector('#projectDetailWorkCount').textContent=projectWorkCount(project);document.querySelector('#projectDetailMemberCount').textContent=projectMemberCount(project);document.querySelector('#projectDetailUpdated').textContent=project.date;renderProjectPlans(project);renderProjectWorks(project);renderProjectEfficiency(project)}
function setProjectDetailTab(tabName,focus=false){projectDetailTabs.forEach(tab=>{const active=tab.dataset.projectDetailTab===tabName;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus({preventScroll:true})});projectDetailPanels.forEach(panel=>{const active=panel.dataset.projectDetailPanel===tabName;panel.classList.toggle('active',active);panel.hidden=!active})}
function openProjectDetail(projectId){if(!projectData.some(project=>project.id===projectId)){showToast('未找到该项目信息','error');return}selectedProjectId=projectId;currentProjectWorksPlan='all';selectedProjectWorkIds.clear();renderProjectDetail();setProjectDetailTab('plan');switchPage('project-detail',document.querySelector('.nav-item[data-page="projects"]'))}
function projectCard(project){const bars=[42,72,24,84,55,34,68,46,78,31,61,48];return `<article class="project-card" data-project-open="${escapeHtml(project.id)}" aria-label="项目 ${escapeHtml(project.title)}"><div class="project-cover" style="background:${project.color}"><div class="wave">${bars.map(h=>`<i style="--h:${h}%"></i>`).join('')}</div></div><div class="project-card-body"><div class="project-card-title"><h3><button type="button" class="project-title-open" title="${escapeHtml(project.title)}">${escapeHtml(project.title)}</button></h3><button class="project-more" type="button" aria-label="${escapeHtml(project.title)}的操作" aria-haspopup="menu" aria-expanded="false" aria-controls="project-menu-${escapeHtml(project.id)}">•••</button></div><p title="${escapeHtml(project.desc)}">${escapeHtml(project.desc)}</p></div><div class="project-card-menu" id="project-menu-${escapeHtml(project.id)}" role="menu" aria-label="项目操作" hidden><button type="button" role="menuitem" data-project-action="add-plan">新增生产计划</button><button type="button" role="menuitem" data-project-action="edit">编辑</button></div></article>`}
function closeProjectCardMenus(restoreFocus=false){projectGrid.querySelectorAll('.project-card.menu-open').forEach(card=>{card.classList.remove('menu-open');card.querySelector('.project-card-menu').hidden=true;const trigger=card.querySelector('.project-more');trigger.setAttribute('aria-expanded','false');if(restoreFocus)trigger.focus({preventScroll:true})})}
function updateProjectLoadStatus(){
  const total=projectMatchingItems.length;
  projectLoadStatus.hidden=!total;
  projectLoadStatus.textContent=projectVisibleCount<total?`已加载 ${projectVisibleCount} / ${total} 个项目，向下滚动加载更多`:`已加载全部 ${total} 个项目`;
}
function projectLoadIsNearViewport(){
  return !projectLoadStatus.hidden&&projectLoadStatus.getClientRects().length>0&&projectLoadStatus.getBoundingClientRect().top<=window.innerHeight+180;
}
function requestMoreProjects(){
  if(projectLoadFrame!==null||projectVisibleCount>=projectMatchingItems.length||!projectLoadIsNearViewport())return;
  projectLoadStatus.textContent='正在加载更多项目…';
  projectLoadFrame=requestAnimationFrame(()=>{
    projectLoadFrame=null;
    if(!projectLoadIsNearViewport()){updateProjectLoadStatus();return}
    const nextCount=Math.min(projectVisibleCount+PROJECT_LOAD_BATCH_SIZE,projectMatchingItems.length);
    projectGrid.insertAdjacentHTML('beforeend',projectMatchingItems.slice(projectVisibleCount,nextCount).map(projectCard).join(''));
    projectVisibleCount=nextCount;
    updateProjectLoadStatus();
    requestMoreProjects();
  });
}
function resetProjectLoading(){projectVisibleCount=PROJECT_LOAD_BATCH_SIZE;renderProjects()}
if('IntersectionObserver' in window){
  const projectLoadObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))requestMoreProjects()},{rootMargin:'180px 0px'});
  projectLoadObserver.observe(projectLoadStatus);
}
window.addEventListener('scroll',requestMoreProjects,{passive:true,capture:true});
window.addEventListener('resize',requestMoreProjects,{passive:true});
function renderProjects(){const keyword=document.querySelector('#projectSearch').value.trim().toLowerCase();let items=projectData.filter(project=>currentProjectFilter==='all'||project.scope===currentProjectFilter);items=items.filter(project=>(project.title+project.desc+project.type).toLowerCase().includes(keyword));const sort=document.querySelector('#projectSort').value;if(sort==='name')items.sort((a,b)=>a.title.localeCompare(b.title,'zh-CN'));if(sort==='progress')items.sort((a,b)=>b.progress-a.progress);if(projectLoadFrame!==null){cancelAnimationFrame(projectLoadFrame);projectLoadFrame=null}projectMatchingItems=items;projectVisibleCount=Math.min(Math.max(PROJECT_LOAD_BATCH_SIZE,projectVisibleCount),items.length);projectGrid.innerHTML=items.slice(0,projectVisibleCount).map(projectCard).join('');updateProjectLoadStatus();projectGrid.style.display=items.length?'grid':'none';projectEmpty.style.display=items.length?'none':'block';document.querySelector('#projectFilterTitle').textContent=projectFilterLabels[currentProjectFilter];document.querySelector('#projectResultCount').textContent=`${items.length} 个项目`;document.querySelector('#projectEmpty p').textContent=keyword?'换一个关键词试试吧':'当前分类暂无项目';document.querySelector('#projectTotal').textContent=projectData.length;document.querySelector('#projectActiveCount').textContent=projectData.filter(project=>project.progress<100).length;document.querySelector('#projectRiskCount').textContent=projectData.filter(project=>project.risk).length;document.querySelector('#projectCompleteCount').textContent=projectData.filter(project=>project.progress===100).length;requestMoreProjects()}
function setProjectFilter(filter){if(!projectFilterLabels[filter])return;projectVisibleCount=PROJECT_LOAD_BATCH_SIZE;currentProjectFilter=filter;projectFilterTabs.forEach(tab=>{const active=tab.dataset.projectFilter===filter;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active))});renderProjects()}
renderProjects();

const taskCenterStorageKey='orchestra-production-tasks-v7';
const taskStatusTabs=Array.from(document.querySelectorAll('[data-task-status]'));
const taskList=document.querySelector('#taskList');
const taskEmpty=document.querySelector('#taskEmpty');
const taskDetailPanel=document.querySelector('#taskDetailPanel');
const taskSearch=document.querySelector('#taskSearch');
const taskStatusMeta={
  in_progress:{label:'进行中',className:'active'},
  completed:{label:'已完成',className:'completed'},
  terminated:{label:'已终止',className:'terminated'}
};
const taskCategoryMeta={
  input:{label:'输入节点',symbol:'入'},
  lyrics:{label:'歌词节点',symbol:'文'},
  song:{label:'歌曲节点',symbol:'音'},
  review:{label:'审核节点',symbol:'审'}
};
const lyricProductionNodeTypes=new Set(['writeLyrics','aiLyrics','refLyrics']);
const songProductionNodeTypes=new Set(['aiSong','refSong','sampleSong','playlistSong']);
const taskCreationConfigurationPresets={
  lyrics:{
    urban:{prompt:'保留参考歌词的核心主题与叙事结构，使用中文流行表达，强化副歌记忆点。',systemPrompt:'你是一名专业中文流行歌词创作者，保持语言自然、画面清晰并避免陈词滥调。',goldenLine:'沿着海岸线，把告别写成新的起点',rhyme:'ang / iang',avoidWords:'网络热词、过度口语化表达',imagery:'夜色、海岸、旧站台、灯火',lyricsFormat:'verse-chorus',count:'3'},
    cinematic:{prompt:'延续参考歌词的情绪线索，以电影化场景推进叙事，主歌克制、副歌释放。',systemPrompt:'使用具象镜头语言完成歌词改写，段落之间保持时间和空间的连续性。',goldenLine:'雨停以后，整座城市开始透明',rhyme:'ing / in',avoidWords:'空泛抒情、重复意象',imagery:'雨幕、路灯、车窗、清晨',lyricsFormat:'verse-chorus',count:'3'},
    indie:{prompt:'提取参考歌词的情绪与意象，用简洁留白的独立音乐表达重新创作。',systemPrompt:'控制句长和修饰语，保留可演唱性与个人化观察。',goldenLine:'让风替沉默的人完成回答',rhyme:'自由押韵',avoidWords:'宏大口号、密集形容词',imagery:'旧街、收音机、晚风、影子',lyricsFormat:'free',count:'2'}
  },
  song:{
    v3:{prompt:'Dream Pop，女声，海岸夜行氛围；以温暖合成器铺底，副歌层次逐渐增强，保留清晰人声与宽阔空间感。',negativePrompt:'重金属失真、过密鼓组、尖锐高频、过度自动调音',count:'3'},
    v2:{prompt:'Indie Pop，中性声线，清晰木吉他与轻量电子节奏；结构紧凑，突出旋律记忆点和自然动态。',negativePrompt:'复杂转调、厚重低频、冗长前奏、强烈现场噪声',count:'2'},
    studio:{prompt:'Cinematic Pop，细腻女声，钢琴与弦乐逐层展开；主歌保持克制，副歌形成具有电影感的情绪高点。',negativePrompt:'低保真质感、嘈杂环境声、过度压缩、模糊人声',count:'3'}
  }
};
const referenceLyricsPresetValues={
  'no-theory':{prompt:'围绕参考歌词的主题和情绪进行自然改写，保持叙事清晰与可演唱性。',systemPrompt:'不套用固定理论，优先保证语言自然、画面连贯。',goldenLine:'',rhyme:'',avoidWords:'',imagery:'',lyricsFormat:'standard',count:'3'},
  'young-pop':{prompt:'保留参考歌词的核心主题与叙事结构，使用中文流行表达，强化副歌记忆点。',systemPrompt:'你是一名专业中文流行歌词创作者，保持语言自然、画面清晰并避免陈词滥调。',goldenLine:'沿着海岸线，把告别写成新的起点',rhyme:'ang / iang',avoidWords:'网络热词、过度口语化表达',imagery:'夜色、海岸、旧站台、灯火',lyricsFormat:'verse-chorus',count:'3'},
  'urban-folk':{prompt:'提取参考歌词中的生活化意象，以城市民谣的克制口吻重新组织段落。',systemPrompt:'使用朴素、真诚的叙事语言，保留细节与呼吸感。',goldenLine:'让晚风把没说完的话带远',rhyme:'an / ang',avoidWords:'空泛口号、堆叠形容词',imagery:'街巷、车站、晚风、旧唱片',lyricsFormat:'verse-chorus',count:'2'},
  cinematic:{prompt:'延续参考歌词的情绪线索，以电影化场景推进叙事，主歌克制、副歌释放。',systemPrompt:'使用具象镜头语言完成歌词改写，段落之间保持时间和空间的连续性。',goldenLine:'雨停以后，整座城市开始透明',rhyme:'ing / in',avoidWords:'空泛抒情、重复意象',imagery:'雨幕、路灯、车窗、清晨',lyricsFormat:'verse-chorus',count:'3'}
};
const lyricFormatLabels={standard:'标准段落','verse-chorus':'主歌 / 副歌',free:'自由格式'};
function lyricFormatLabel(value){return lyricFormatLabels[value]||value||''}
let productionTasks=[];
let currentTaskStatus='active';
let selectedTaskId='';
let taskCenterReady=false;

function operationalWorkflowNodes(nodes){
  const lyrics=nodes.find(node=>node.type==='refLyrics')||nodes.find(node=>lyricProductionNodeTypes.has(node.type));
  const song=nodes.find(node=>node.type==='refSong')||nodes.find(node=>songProductionNodeTypes.has(node.type));
  const lyricsId=lyrics?.id||'complete-reference-lyrics',songId=song?.id||'complete-reference-song';
  return [
    {id:lyricsId,type:'refLyrics',title:'基于参考生成歌词',subtitle:'配置生成歌词，选择结果后提交审核',category:'lyrics'},
    {id:`${lyricsId}--lyrics-review`,type:'lyricsReview',title:'歌词审核',subtitle:'审核歌词产物',category:'review',sourceNodeId:lyricsId},
    {id:songId,type:'refSong',title:'基于参考曲生成歌曲',subtitle:'配置生成歌曲，选择结果后提交审核',category:'song'},
    {id:`${songId}--song-review`,type:'songReview',title:'歌曲审核',subtitle:'审核歌曲产物',category:'review',sourceNodeId:songId}
  ];
}
function resolveTaskWorkflowContext(project,work){
  const plan=(project.batches||[]).find(item=>String(item.id)===String(work.planId));
  if(!plan)return null;
  const published=window.orchestraWorkflowCanvas?.getPublishedSnapshot?.(plan.workflowId,plan.workflowVersion);
  if(!published)return null;
  const snapshot={...published,nodes:operationalWorkflowNodes(published.nodes)};
  return {project,work,plan,snapshot};
}
function productionTaskId(project,work,node){return `${project.id}::${work.id}::${node.id}`}
function taskAssigneeForNode(context,node){
  const key=`${context.plan.workflowId}:${context.plan.workflowVersion}:${node.id}`;
  const assignment=context.work.nodeAssignments?.[key];
  if(assignment)return {id:assignment.memberId||'',name:teamMemberRoster.find(member=>member.id===assignment.memberId)?.name||assignment.memberName||'待分配'};
  const legacyOwner=Object.keys(context.work.nodeAssignments||{}).length?'':context.work.owner;
  return {id:'',name:legacyOwner&&!['多人协作','未分配','—'].includes(legacyOwner)?legacyOwner:'待分配'};
}
function createProductionTask(context,node,nodeIndex,status,createdAt=Date.now()){
  const assignee=taskAssigneeForNode(context,node);
  return {
    id:productionTaskId(context.project,context.work,node),projectId:context.project.id,projectName:context.project.title,
    workId:String(context.work.id),workName:projectWorkName(context.project,context.work),planId:String(context.plan.id),planName:context.plan.name,
    workflowId:context.plan.workflowId,workflowName:context.plan.workflowName,workflowVersion:context.plan.workflowVersion,
    nodeId:node.id,nodeType:node.type,nodeTitle:node.title,nodeSubtitle:node.subtitle,nodeCategory:node.category||'song',sourceNodeId:node.sourceNodeId||'',
    nodeIndex,nodeCount:context.snapshot.nodes.length,status,featured:Boolean(context.work.taskFeatured),assigneeId:assignee.id,assigneeName:assignee.name,
    createdAt,updatedAt:createdAt,updatedLabel:status==='in_progress'?'今天 10:24':'09-07 18:40'
  };
}
function buildDefaultProductionTasks(){
  const tasks=[];
  const reachedByProject=[[1,2,3],[1],[0],[2],[0],[2]];
  let sequence=0;
  projectData.forEach((project,projectIndex)=>(project.works||[]).forEach((work,workIndex)=>{
    const context=resolveTaskWorkflowContext(project,work);
    if(!context||!context.snapshot.nodes.length)return;
    const terminated=projectIndex===2&&workIndex===0;
    const configuredReached=Number.isInteger(work.taskReached)?work.taskReached:(reachedByProject[projectIndex]?.[workIndex]??1);
    const reached=work.status==='已完成'?context.snapshot.nodes.length-1:Math.min(context.snapshot.nodes.length-1,configuredReached);
    context.snapshot.nodes.slice(0,reached+1).forEach((node,nodeIndex)=>{
      let status=work.status==='已完成'||nodeIndex<reached?'completed':'in_progress';
      if(terminated)status='terminated';
      const createdAt=Date.parse('2026-09-08T10:30:00+08:00')-(sequence++*37*60*1000);
      tasks.push(createProductionTask(context,node,nodeIndex,status,createdAt));
    });
  }));
  return tasks;
}
function normalizeProductionTaskConcurrency(){
  const byWork=new Map();
  productionTasks.filter(task=>task.status==='in_progress').sort((a,b)=>b.nodeIndex-a.nodeIndex).forEach(task=>{
    const key=`${task.projectId}:${task.workId}`;
    if(!byWork.has(key)){byWork.set(key,task.id);return}
    task.status='completed';
  });
}
function taskWorkKey(projectId,workId){return JSON.stringify([projectId,String(workId)])}
function removedProductionTaskWorks(saved){
  const storageKey='orchestra-task-cleanup-20260911-v1';
  const entries=projectData.flatMap(project=>(project.works||[]).map(work=>({project,work,key:taskWorkKey(project.id,work.id)})));
  const retained=entries.find(entry=>entry.work.taskFeatured);
  if(!retained)return new Set();
  let cleanup;
  try{cleanup=JSON.parse(localStorage.getItem(storageKey)||'null')}catch{}
  if(!cleanup){
    cleanup={retainedWorkKey:retained.key,removedAssignments:{},archivedTasks:saved.filter(task=>taskWorkKey(task.projectId,task.workId)!==retained.key),createdAt:Date.now()};
    entries.filter(entry=>entry.key!==retained.key).forEach(({work,key})=>cleanup.removedAssignments[key]=JSON.stringify(work.nodeAssignments||{}));
    // Archive removed records and remember their old assignments so reload cannot recreate them.
    try{localStorage.setItem(storageKey,JSON.stringify(cleanup))}catch{throw Error('任务清理备份保存失败，请检查浏览器存储后重试')}
  }
  const entriesByKey=new Map(entries.map(entry=>[entry.key,entry]));
  return new Set(Object.entries(cleanup.removedAssignments).filter(([key,signature])=>{const entry=entriesByKey.get(key);return !entry||JSON.stringify(entry.work.nodeAssignments||{})===signature}).map(([key])=>key));
}
function loadProductionTasks(){
  const defaults=buildDefaultProductionTasks().filter(task=>task.featured),defaultIds=new Set(defaults.map(task=>task.id));
  let saved=[];
  try{saved=JSON.parse(localStorage.getItem(taskCenterStorageKey)||'[]')||[]}catch{saved=[]}
  let removedWorks=new Set();
  try{removedWorks=removedProductionTaskWorks(saved)}catch(error){showToast(error.message,'error')}
  saved=saved.filter(task=>!removedWorks.has(taskWorkKey(task.projectId,task.workId)));
  const savedMap=new Map(saved.map(task=>[task.id,task]));
  productionTasks=defaults.map(task=>({...task,...(savedMap.get(task.id)||{})}));
  saved.filter(task=>!defaultIds.has(task.id)&&(task.featured||task.assignmentCreated)&&projectData.some(project=>project.id===task.projectId&&(project.works||[]).some(work=>String(work.id)===String(task.workId)))).forEach(task=>productionTasks.push(task));
  const featuredWork=projectData.flatMap(project=>(project.works||[]).map(work=>({project,work}))).find(item=>item.work.taskFeatured);
  if(featuredWork){
    const context=resolveTaskWorkflowContext(featuredWork.project,featuredWork.work),firstNode=context?.snapshot.nodes[0];
    if(context&&firstNode){
      const firstId=productionTaskId(context.project,context.work,firstNode);
      productionTasks=productionTasks.filter(task=>task.projectId!==context.project.id||String(task.workId)!==String(context.work.id)||task.id===firstId);
      let firstTask=productionTasks.find(task=>task.id===firstId);
      if(!firstTask){firstTask=createProductionTask(context,firstNode,0,'in_progress');productionTasks.push(firstTask)}
      Object.assign(firstTask,{status:'in_progress',generationStage:'idle',candidates:[],selectedCandidateId:'',selectedCandidateText:'',selectedOutput:null,formValues:{},updatedAt:Date.now(),updatedLabel:'刚刚'});
      context.work.status='制作中';context.work.stage=firstNode.title;context.work.updated=new Date().toISOString();
    }
  }
  normalizeProductionTaskConcurrency();
  projectData.forEach(project=>ensureAssignedProductionTasks(project,(project.works||[]).filter(work=>Object.keys(work.nodeAssignments||{}).length&&!removedWorks.has(taskWorkKey(project.id,work.id)))));
  persistProductionTasks();
}
function ensureAssignedProductionTasks(project,works,allowUnassigned=false){
  let created=0;
  works.forEach(work=>{
    const context=resolveTaskWorkflowContext(project,work);
    if(!context?.snapshot.nodes.length)return;
    const tasks=productionTasks.filter(task=>task.projectId===project.id&&String(task.workId)===String(work.id));
    tasks.forEach(task=>{task.assignmentCreated=true;const node=context.snapshot.nodes.find(item=>item.id===task.nodeId);if(node){const assignee=taskAssigneeForNode(context,node);task.assigneeId=assignee.id;task.assigneeName=assignee.name}});
    let active=tasks.find(task=>task.status==='in_progress');
    if(!active&&tasks.length)return;
    if(!active){
      if(['已完成','已终止','已交付'].includes(work.status))return;
      const nodeIndex=0,node=context.snapshot.nodes[nodeIndex];
      if(!allowUnassigned&&!taskAssigneeForNode(context,node).id)return;
      active=createProductionTask(context,node,nodeIndex,'in_progress');
      active.assignmentCreated=true;active.updatedLabel='刚刚';productionTasks.push(active);created++;
    }
    work.status='制作中';work.stage=active.nodeTitle;work.updated=new Date().toISOString();
  });
  return created;
}
function startProductionPlanTasks(project,works){
  const created=ensureAssignedProductionTasks(project,works,true);
  syncProjectPlanProductionProgress(project);
  if(!persistProductionTasks())showToast('待办任务已生成，但保存失败，请重试','error');
  if(created<works.length&&!works.every(work=>productionTasks.some(task=>task.projectId===project.id&&String(task.workId)===String(work.id))))showToast('部分作品未生成任务，请检查已发布工作流的节点配置','error');
  return created;
}
function persistProductionTasks(){try{localStorage.setItem(taskCenterStorageKey,JSON.stringify(productionTasks));return true}catch{return false}}
function taskMatchesStatus(task){if(currentTaskStatus==='active')return task.status==='in_progress';if(currentTaskStatus==='finished')return ['completed','terminated'].includes(task.status);return true}
function filteredProductionTasks(){
  const keyword=taskSearch.value.trim().toLowerCase();
  return productionTasks.filter(task=>taskMatchesStatus(task)&&`${task.workName} ${task.projectName} ${task.planName} ${task.nodeTitle}`.toLowerCase().includes(keyword)).sort((a,b)=>{
    const priority={in_progress:0,completed:1,terminated:2};
    return priority[a.status]-priority[b.status]||b.updatedAt-a.updatedAt;
  });
}
function productionTaskRow(task){
  const status=taskStatusMeta[task.status],category=taskCategoryMeta[task.nodeCategory]||taskCategoryMeta.song,active=task.id===selectedTaskId;
  return `<div class="task-item${active?' active':''}${task.featured?' featured':''}" role="group" tabindex="0" data-task-id="${escapeHtml(task.id)}" aria-label="打开任务：${escapeHtml(task.workName)}" aria-current="${active?'true':'false'}"><span class="task-item-head"><i class="task-node-icon ${escapeHtml(task.nodeCategory)}" aria-hidden="true">${category.symbol}</i><span class="task-item-title"><b><span class="task-inline-name" data-task-inline-name="${escapeHtml(task.id)}" title="${escapeHtml(task.workName)}"${task.status==='in_progress'?' contenteditable="plaintext-only" role="textbox" aria-label="任务名称（直接编辑，Enter 保存，Esc 取消）" aria-multiline="false" tabindex="0" spellcheck="false"':''}>${escapeHtml(task.workName)}</span></b><small>${escapeHtml(task.nodeTitle)} · 第 ${task.nodeIndex+1}/${task.nodeCount} 节点</small></span><span class="task-status ${status.className}">${status.label}</span></span><span class="task-item-body"><span><b>${escapeHtml(task.projectName)}</b><small>${escapeHtml(task.planName)} · ${escapeHtml(task.workflowName)} ${escapeHtml(task.workflowVersion)}</small></span></span></div>`;
}
function taskContextByTask(task){
  const project=projectData.find(item=>item.id===task.projectId),work=project?.works?.find(item=>String(item.id)===String(task.workId));
  return project&&work?resolveTaskWorkflowContext(project,work):null;
}
function syncProductionTaskAssignees(){
  productionTasks.forEach(task=>{const context=taskContextByTask(task),node=context?.snapshot.nodes.find(item=>item.id===task.nodeId);if(!context||!node)return;task.workName=projectWorkName(context.project,context.work);const assignee=taskAssigneeForNode(context,node);task.assigneeId=assignee.id;task.assigneeName=assignee.name});
}
function taskNodePageSpec(task){
  const specs={
    writeLyrics:{required:'无',optional:'无',output:'歌名、歌词',next:'歌词审核'},
    aiLyrics:{required:'无',optional:'无',output:'歌词',next:'歌词审核'},
    refLyrics:{required:'参考歌词',optional:'无',output:'歌词',next:'歌词审核'},
    lyricsReview:{required:'待审核歌词',optional:'无',output:'审核通过的歌词',next:'工作流中的下一创作节点'},
    aiSong:{required:'无',optional:'歌词',output:'歌曲',next:'曲审核'},
    refSong:{required:'参考歌曲',optional:'歌词',output:'歌曲',next:'曲审核'},
    sampleSong:{required:'参考歌曲',optional:'歌词',output:'歌曲',next:'曲审核'},
    playlistSong:{required:'参考歌曲（最多 4 首）',optional:'歌词',output:'歌曲',next:'曲审核'},
    songReview:{required:'待审核歌曲',optional:'无',output:'审核通过的歌曲',next:'工作流中的下一创作节点'}
  };
  const spec=specs[task.nodeType]||{required:'按节点配置',optional:'无',output:'节点产物',next:'工作流中的下一节点'};
  if(task.workflowId!=='reference-production')return spec;
  if(task.nodeType==='lyricsReview')return {...spec,next:'基于参考曲生成歌曲'};
  if(task.nodeType==='refSong')return {...spec,next:'歌曲审核'};
  if(task.nodeType==='songReview')return {...spec,next:'流程完成'};
  return spec;
}
function taskNodeSpecPanel(task){
  const spec=taskNodePageSpec(task);
  return `<div class="task-node-spec task-node-spec-three" aria-label="节点输入输出规则"><div><small>依赖输入</small><b>${escapeHtml(spec.required)}</b></div><div><small>可选输入</small><b>${escapeHtml(spec.optional)}</b></div><div><small>输出内容</small><b>${escapeHtml(spec.output)}</b></div></div>`;
}
function taskFormValue(task,key,fallback=''){return escapeHtml(task.formValues?.[key]??fallback)}
function taskSelectedOption(task,key,value){return task.formValues?.[key]===value?'selected':''}
function applyTaskCreationConfiguration(task,configurationId){
  if(!task||!configurationId)return false;
  const kind=songProductionNodeTypes.has(task.nodeType)?'song':'lyrics',configuration=taskCreationConfigurationPresets[kind]?.[configurationId];
  if(!configuration)return false;
  task.formValues={...(task.formValues||{}),...configuration,config:configurationId};
  if(kind==='song'&&!task.formValues.title)task.formValues.title=task.workName;
  task.generationStage='';task.candidates=[];task.selectedCandidateId='';task.selectedCandidateText='';task.updatedAt=Date.now();task.updatedLabel='刚刚';
  return true;
}
function taskCandidateCards(task,kind){
  const candidates=task.candidates||[];
  const cards=kind==='song'?candidates.map((candidate,index)=>{const selected=task.selectedCandidateId===candidate.id,duration=Number(candidate.durationSeconds)||[222,216,241][index]||222;return `<article class="task-candidate-card song-result${selected?' selected':''}" data-task-song-card="${escapeHtml(candidate.id)}"><button class="task-song-select" type="button" data-task-candidate="${escapeHtml(candidate.id)}" aria-pressed="${selected}" ${task.status!=='in_progress'?'disabled':''}><i>${selected?'✓':String(index+1).padStart(2,'0')}</i><span><b>${escapeHtml(candidate.title)}</b><small>${escapeHtml(candidate.summary)}</small></span></button><button class="task-song-play" type="button" data-task-song-play="${escapeHtml(candidate.id)}" data-song-duration="${duration}" aria-label="播放 ${escapeHtml(candidate.title)}"><i>▶</i><span>试听</span><time data-task-song-time>0:00 / ${formatTaskSongTime(duration)}</time></button></article>`}).join(''):candidates.map((candidate,index)=>{const selected=task.selectedCandidateId===candidate.id;return `<button class="task-candidate-card${selected?' selected':''}" type="button" data-task-candidate="${escapeHtml(candidate.id)}" aria-pressed="${selected}" ${task.status!=='in_progress'?'disabled':''}><i>${selected?'✓':String(index+1).padStart(2,'0')}</i><span><b>${escapeHtml(candidate.title)}</b><small>${escapeHtml(candidate.summary)}</small></span></button>`}).join('');
  return `<section class="task-generation-results task-form-field wide" aria-label="${kind==='lyrics'?'歌词':'歌曲'}生成结果"><header><div><b>选择一个生成结果</b><small>${kind==='lyrics'?'选定后可直接提交审核，也可按需编辑。':'可播放试听，并单独选择需要提交审核的歌曲版本。'}</small></div><span>${candidates.length} 个候选</span></header><div class="task-candidate-grid ${kind}">${cards}</div></section>`;
}
function formatTaskSongTime(seconds){const value=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(value/60)}:${String(value%60).padStart(2,'0')}`}
const taskSongPreview={candidateId:'',playing:false,elapsed:0,duration:0,startedAt:0,timer:null,audioContext:null,nodes:[]};
function stopTaskSongAudio(){taskSongPreview.nodes.forEach(node=>{try{node.stop()}catch{}});taskSongPreview.nodes=[];if(taskSongPreview.audioContext){taskSongPreview.audioContext.close().catch(()=>{});taskSongPreview.audioContext=null}}
function updateTaskSongPreviewUI(){taskDetailPanel.querySelectorAll('[data-task-song-play]').forEach(button=>{const active=button.dataset.taskSongPlay===taskSongPreview.candidateId,playing=active&&taskSongPreview.playing,duration=Number(button.dataset.songDuration)||0,elapsed=active?Math.min(taskSongPreview.elapsed,duration):0;button.classList.toggle('playing',playing);button.setAttribute('aria-label',`${playing?'暂停':'播放'} ${button.closest('[data-task-song-card]')?.querySelector('b')?.textContent||'歌曲版本'}`);button.querySelector('i').textContent=playing?'❚❚':'▶';button.querySelector('span').textContent=playing?'暂停':'试听';button.querySelector('[data-task-song-time]').textContent=`${formatTaskSongTime(elapsed)} / ${formatTaskSongTime(duration)}`;button.closest('[data-task-song-card]')?.classList.toggle('playing',playing)})}
function startTaskSongAudio(candidateId){try{const AudioContextClass=window.AudioContext||window.webkitAudioContext;if(!AudioContextClass)return;const context=new AudioContextClass(),gain=context.createGain(),base={"song-a":220,"song-b":196,"song-c":246.94}[candidateId]||220;gain.gain.setValueAtTime(.014,context.currentTime);gain.connect(context.destination);[base,base*1.5].forEach((frequency,index)=>{const oscillator=context.createOscillator();oscillator.type=index?'sine':'triangle';oscillator.frequency.setValueAtTime(frequency,context.currentTime);oscillator.connect(gain);oscillator.start();taskSongPreview.nodes.push(oscillator)});taskSongPreview.audioContext=context}catch{taskSongPreview.audioContext=null}}
function stopTaskSongPreview(reset=true){clearInterval(taskSongPreview.timer);taskSongPreview.timer=null;stopTaskSongAudio();taskSongPreview.playing=false;if(reset){taskSongPreview.candidateId='';taskSongPreview.elapsed=0;taskSongPreview.duration=0}updateTaskSongPreviewUI()}
function toggleTaskSongPreview(button){
  const candidateId=button.dataset.taskSongPlay,duration=Number(button.dataset.songDuration)||222;
  if(taskSongPreview.candidateId===candidateId&&taskSongPreview.playing){taskSongPreview.elapsed=Math.min(duration,(performance.now()-taskSongPreview.startedAt)/1000);stopTaskSongPreview(false);return}
  if(taskSongPreview.candidateId!==candidateId){stopTaskSongPreview();taskSongPreview.candidateId=candidateId;taskSongPreview.elapsed=0}
  taskSongPreview.duration=duration;taskSongPreview.playing=true;taskSongPreview.startedAt=performance.now()-taskSongPreview.elapsed*1000;startTaskSongAudio(candidateId);updateTaskSongPreviewUI();
  clearInterval(taskSongPreview.timer);taskSongPreview.timer=setInterval(()=>{taskSongPreview.elapsed=(performance.now()-taskSongPreview.startedAt)/1000;if(taskSongPreview.elapsed>=taskSongPreview.duration){stopTaskSongPreview();return}updateTaskSongPreviewUI()},250);
}
function renderReferenceLyricsWorkspace(task){
  const locked=task.status!=='in_progress',disabled=locked?'disabled':'',generated=task.generationStage==='generated'||Boolean(task.candidates?.length),status=taskStatusMeta[task.status];
  const result=generated?taskCandidateCards(task,'lyrics'):`<div class="ref-output-empty"><i>▧</i><b>暂无生成结果</b><small>完成左侧配置后，点击“开始运行”生成候选歌词。</small></div>`;
  const editor=task.selectedCandidateId?`<label class="task-form-field task-selected-output"><span>已选用歌词（可选修改）</span><textarea data-task-required data-selected-lyrics-editor ${disabled} placeholder="可直接提交当前歌词，也可按需修改…">${escapeHtml(task.selectedCandidateText||'')}</textarea><small>确认歌词后即可提交审核，无需修改。</small></label>`:'';
return `<div class="ref-task-workbench"><header class="ref-workbench-header"><div class="ref-workbench-meta"><span>歌词生成</span><em>可配置</em></div><div class="ref-workbench-title"><div><h2>歌词生成 · 配置并运行</h2><p><span data-task-display-name>${escapeHtml(task.workName)}</span> · 基于参考歌词生成新的歌词版本</p></div><span class="task-status ${status.className}">${status.label}</span></div></header><div class="ref-workbench-columns"><section class="ref-workbench-panel ref-workbench-input"><header><b>输入</b></header><div class="ref-workbench-content"><label class="task-form-field ref-reference-lyrics"><span>参考歌词 <em>*</em></span><textarea readonly>夜色沿着海岸线慢慢退潮\n旧站台还留着昨日的风\n我把没说完的话写进灯火\n等清晨替我们重新命名</textarea></label><div class="ref-config-grid"><label class="task-form-field"><span>创作配置 <em>*</em></span><select data-task-required data-generation-required data-task-field="config" ${disabled}><option value="">请选择配置</option><option value="urban" ${taskSelectedOption(task,'config','urban')}>都市叙事 · 中文流行</option><option value="cinematic" ${taskSelectedOption(task,'config','cinematic')}>电影感 · 抒情</option><option value="indie" ${taskSelectedOption(task,'config','indie')}>极简意象 · Indie</option></select></label><label class="task-form-field"><span>用户提示词 <em>*</em></span><textarea data-task-required data-generation-required data-task-field="prompt" ${disabled} placeholder="描述希望保留与调整的歌词方向…">${taskFormValue(task,'prompt')}</textarea></label><label class="task-form-field"><span>系统提示词（选填）</span><input data-task-field="systemPrompt" ${disabled} value="${taskFormValue(task,'systemPrompt')}" placeholder="补充创作规则" /></label><label class="task-form-field"><span>金句（选填）</span><input data-task-field="goldenLine" ${disabled} value="${taskFormValue(task,'goldenLine')}" placeholder="填写希望保留的核心句" /></label><label class="task-form-field"><span>韵脚（选填）</span><input data-task-field="rhyme" ${disabled} value="${taskFormValue(task,'rhyme')}" placeholder="例如 ang / iang" /></label><label class="task-form-field"><span>规避词（选填）</span><input data-task-field="avoidWords" ${disabled} value="${taskFormValue(task,'avoidWords')}" placeholder="填写不希望出现的词语" /></label><label class="task-form-field"><span>意象（选填）</span><input data-task-field="imagery" ${disabled} value="${taskFormValue(task,'imagery')}" placeholder="例如 夜雨、海岸、霓虹" /></label><label class="task-form-field"><span>歌词格式（选填）</span><select data-task-field="lyricsFormat" ${disabled}><option value="standard">标准段落</option><option value="verse-chorus" ${taskSelectedOption(task,'lyricsFormat','verse-chorus')}>主歌 / 副歌</option><option value="free" ${taskSelectedOption(task,'lyricsFormat','free')}>自由格式</option></select></label></div></div></section><section class="ref-workbench-panel ref-workbench-output"><header><b>输出</b></header><div class="ref-workbench-content">${result}<div class="ref-run-row"><select data-task-field="count" aria-label="生成数量" ${disabled}><option value="3">3 份歌词</option><option value="2" ${taskSelectedOption(task,'count','2')}>2 份歌词</option><option value="1" ${taskSelectedOption(task,'count','1')}>1 份歌词</option></select>${!locked?`<button type="button" data-task-generate="lyrics">${generated?'重新运行':'▶ 开始运行'}</button>`:''}</div>${editor}${task.status==='terminated'?'<div class="task-termination-note">任务已终止，后续节点未生成。</div>':''}${task.status==='in_progress'?`<div class="ref-workbench-actions"><button class="task-complete-button" type="button" data-task-action="complete" ${taskNodeCanComplete(task)?'':'disabled'}>确认提交</button></div>`:''}</div></section></div></div>`;
}
function renderReferenceSongWorkspace(task){
  const locked=task.status!=='in_progress',disabled=locked?'disabled':'',generated=task.generationStage==='generated'||Boolean(task.candidates?.length),status=taskStatusMeta[task.status];
  const lyricsTask=productionTasks.find(item=>item.projectId===task.projectId&&String(item.workId)===String(task.workId)&&item.nodeType==='refLyrics');
  const approvedLyrics=lyricsTask?.selectedOutput?.content||lyricsTask?.selectedCandidateText||'已自动带入上一节点审核通过的歌词。';
  const result=generated?taskCandidateCards(task,'song'):`<div class="ref-output-empty ref-song-output-empty"><i>♪</i><b>暂无生成结果</b><small>完成左侧配置后，点击“开始运行”生成可试听的候选歌曲。</small></div>`;
  const selected=task.selectedCandidateId?`<div class="ref-selected-song"><i>✓</i><div><b>已选择：${escapeHtml((task.candidates||[]).find(candidate=>candidate.id===task.selectedCandidateId)?.title||'歌曲版本')}</b><small>试听确认无误后，可提交进入歌曲审核。</small></div></div>`:'';
return `<div class="ref-task-workbench ref-song-workbench"><header class="ref-workbench-header"><div class="ref-workbench-meta"><span>歌曲生成</span><em>可配置</em></div><div class="ref-workbench-title"><div><h2>歌曲生成 · 配置并运行</h2><p><span data-task-display-name>${escapeHtml(task.workName)}</span> · 基于参考曲与已审核歌词生成新的歌曲版本</p></div><span class="task-status ${status.className}">${status.label}</span></div></header><div class="ref-workbench-columns"><section class="ref-workbench-panel ref-workbench-input"><header><b>输入</b></header><div class="ref-workbench-content"><div class="ref-song-materials"><span>参考素材</span><button class="ref-source-audio" type="button" data-toast="正在试听参考歌曲：海岸线 Demo"><i>▶</i><span><b>海岸线 Demo</b><small>参考歌曲 · 03:42 · 已载入</small></span><em>必需</em></button><label class="task-form-field ref-approved-lyrics"><span>歌词输入（选填）</span><textarea readonly>${escapeHtml(approvedLyrics)}</textarea></label></div><div class="ref-config-grid"><label class="task-form-field"><span>歌曲生成配置 <em>*</em></span><select data-task-required data-generation-required data-task-field="config" ${disabled}><option value="">请选择配置</option><option value="v3" ${taskSelectedOption(task,'config','v3')}>Orchestra Music V3 · 高品质</option><option value="v2" ${taskSelectedOption(task,'config','v2')}>Orchestra Music V2 · 快速</option><option value="studio" ${taskSelectedOption(task,'config','studio')}>Studio Mix · 精细编曲</option></select></label><label class="task-form-field"><span>Prompt <em>*</em></span><textarea data-task-required data-generation-required data-task-field="prompt" ${disabled} placeholder="描述曲风、编曲、演唱与氛围…">${taskFormValue(task,'prompt')}</textarea></label><label class="task-form-field"><span>标题（选填）</span><input data-task-field="title" ${disabled} value="${taskFormValue(task,'title',task.workName)}" placeholder="歌曲标题" /></label><label class="task-form-field"><span>反向提示词（选填）</span><input data-task-field="negativePrompt" ${disabled} value="${taskFormValue(task,'negativePrompt')}" placeholder="填写不希望出现的元素" /></label></div></div></section><section class="ref-workbench-panel ref-workbench-output"><header><b>输出</b></header><div class="ref-workbench-content">${result}<div class="ref-run-row"><select data-task-field="count" aria-label="生成轮数" ${disabled}><option value="3">3 个歌曲版本</option><option value="2" ${taskSelectedOption(task,'count','2')}>2 个歌曲版本</option><option value="1" ${taskSelectedOption(task,'count','1')}>1 个歌曲版本</option></select>${!locked?`<button type="button" data-task-generate="song">${generated?'重新运行':'▶ 开始运行'}</button>`:''}</div>${selected}${task.status==='terminated'?'<div class="task-termination-note">任务已终止，后续节点未生成。</div>':''}${task.status==='in_progress'?`<div class="ref-workbench-actions"><button class="task-complete-button" type="button" data-task-action="complete" ${taskNodeCanComplete(task)?'':'disabled'}>确认提交</button></div>`:''}</div></section></div></div>`;
}
function taskNodeEditor(task){
  const locked=task.status!=='in_progress',disabled=locked?'disabled':'',completed=task.status==='completed',category=taskCategoryMeta[task.nodeCategory]||taskCategoryMeta.song;
  const header=`<header><div><h3>${escapeHtml(task.nodeTitle)}页面</h3><p>${locked?'任务已结束，页面内容仅供查看。':'请在当前页面完成节点操作，运行或提交成功后进入下一节点。'}</p></div><span>${escapeHtml(category.label)}</span></header>`;
  const spec=taskNodeSpecPanel(task);
  if(task.nodeType==='writeLyrics')return `<section class="task-node-form ref-lyrics-task-form">${header}${spec}<div class="task-form-grid"><label class="task-form-field"><span>歌名 <em>*</em></span><input data-task-required data-task-field="title" ${disabled} value="${taskFormValue(task,'title',completed?task.workName:'')}" placeholder="填写歌名" /></label><div class="task-output-card"><b>歌名输出</b><small>可作为歌曲标题传递给后续节点。</small></div><label class="task-form-field wide"><span>歌词 <em>*</em></span><textarea data-task-required data-task-field="lyrics" ${disabled} placeholder="填写歌词正文…">${taskFormValue(task,'lyrics',completed?'窗外的风吹过旧街，城市在灯火里醒来。':'')}</textarea></label><div class="task-output-card task-form-field wide"><b>歌词输出</b><small>提交后先进入歌词审核，审核通过后才继续创作。</small></div></div></section>`;
  if(task.nodeType==='refLyrics'){
    const generated=task.generationStage==='generated'||completed;
    const editor=task.selectedCandidateId?`<label class="task-form-field wide task-selected-output"><span>已选用歌词（可选修改）</span><textarea data-task-required data-selected-lyrics-editor ${disabled} placeholder="可直接提交当前歌词，也可按需修改…">${escapeHtml(task.selectedCandidateText||'')}</textarea><small>确认歌词后即可提交审核，无需修改。</small></label>`:'';
    return `<section class="task-node-form task-generation-form ref-lyrics-task-form">${header}${spec}<div class="task-form-grid"><div class="task-output-card task-form-field wide"><b>参考歌词 <em>*</em></b><small>已载入参考歌词：《沿海公路》· 仅参考歌词的主题、结构与情绪。</small></div><label class="task-form-field"><span>歌词生成配置 <em>*</em></span><select data-task-required data-generation-required data-task-field="config" ${disabled}><option value="">请选择配置</option><option value="urban" ${taskSelectedOption(task,'config','urban')}>都市叙事 · 中文流行</option><option value="cinematic" ${taskSelectedOption(task,'config','cinematic')}>电影感 · 抒情</option><option value="indie" ${taskSelectedOption(task,'config','indie')}>极简意象 · Indie</option></select></label><label class="task-form-field"><span>生成数量</span><select data-task-field="count" ${disabled}><option value="3">3 份</option><option value="2" ${taskSelectedOption(task,'count','2')}>2 份</option><option value="1" ${taskSelectedOption(task,'count','1')}>1 份</option></select></label><label class="task-form-field wide"><span>用户提示词 <em>*</em></span><textarea data-task-required data-generation-required data-task-field="prompt" ${disabled} placeholder="描述希望保留与调整的歌词方向…">${taskFormValue(task,'prompt')}</textarea></label><label class="task-form-field"><span>系统提示词（选填）</span><input data-task-field="systemPrompt" ${disabled} value="${taskFormValue(task,'systemPrompt')}" placeholder="补充创作规则" /></label><label class="task-form-field"><span>金句（选填）</span><input data-task-field="goldenLine" ${disabled} value="${taskFormValue(task,'goldenLine')}" placeholder="填写希望保留的核心句" /></label><label class="task-form-field"><span>韵脚（选填）</span><input data-task-field="rhyme" ${disabled} value="${taskFormValue(task,'rhyme')}" placeholder="例如 ang / iang" /></label><label class="task-form-field"><span>规避词（选填）</span><input data-task-field="avoidWords" ${disabled} value="${taskFormValue(task,'avoidWords')}" placeholder="填写不希望出现的词语" /></label><label class="task-form-field"><span>意象（选填）</span><input data-task-field="imagery" ${disabled} value="${taskFormValue(task,'imagery')}" placeholder="例如 夜雨、海岸、霓虹" /></label><label class="task-form-field wide"><span>歌词格式（选填）</span><select data-task-field="lyricsFormat" ${disabled}><option value="standard">标准段落</option><option value="verse-chorus" ${taskSelectedOption(task,'lyricsFormat','verse-chorus')}>主歌 / 副歌</option><option value="free" ${taskSelectedOption(task,'lyricsFormat','free')}>自由格式</option></select></label>${!locked?`<div class="task-inline-actions task-form-field wide"><span>${generated?'可修改配置后重新生成，原选择将被清空。':'配置完成后调用 AI 生成候选歌词。'}</span><button type="button" data-task-generate="lyrics">${generated?'重新生成歌词':'调用 AI 生成歌词'}</button></div>`:''}${generated?taskCandidateCards(task,'lyrics'):''}${editor}</div></section>`;
  }
  if(task.nodeType==='aiLyrics'){
    const generated=task.generationStage==='generated'||Boolean(task.candidates?.length),editor=task.selectedCandidateId?`<label class="task-form-field wide task-selected-output"><span>已选用歌词（可选修改）</span><textarea data-task-required data-selected-lyrics-editor ${disabled} placeholder="可直接提交当前歌词，也可按需修改…">${escapeHtml(task.selectedCandidateText||'')}</textarea><small>确认歌词后即可提交审核，无需修改。</small></label>`:'';
    return `<section class="task-node-form task-generation-form ref-lyrics-task-form">${header}${spec}<div class="task-form-grid"><label class="task-form-field"><span>歌词生成配置 <em>*</em></span><select data-task-required data-generation-required data-task-field="config" ${disabled}><option value="">请选择配置</option><option value="urban" ${taskSelectedOption(task,'config','urban')}>都市叙事 · 中文流行</option><option value="cinematic" ${taskSelectedOption(task,'config','cinematic')}>电影感 · 抒情</option><option value="indie" ${taskSelectedOption(task,'config','indie')}>极简意象 · Indie</option></select></label><label class="task-form-field"><span>生成数量</span><select data-task-field="count" ${disabled}><option value="3">3 份</option><option value="2" ${taskSelectedOption(task,'count','2')}>2 份</option><option value="1" ${taskSelectedOption(task,'count','1')}>1 份</option></select></label><label class="task-form-field wide"><span>用户提示词 <em>*</em></span><textarea data-task-required data-generation-required data-task-field="prompt" ${disabled} placeholder="描述主题、情绪、叙事或创作方向…">${taskFormValue(task,'prompt')}</textarea></label><label class="task-form-field wide"><span>系统提示词（选填）</span><input data-task-field="systemPrompt" ${disabled} value="${taskFormValue(task,'systemPrompt')}" placeholder="补充创作规则" /></label>${!locked?`<div class="task-inline-actions task-form-field wide"><span>${generated?'可修改配置后重新生成，原选择将被清空。':'配置完成后调用 AI 生成候选歌词。'}</span><button type="button" data-task-generate="lyrics">${generated?'重新生成歌词':'调用 AI 生成歌词'}</button></div>`:''}${generated?taskCandidateCards(task,'lyrics'):''}${editor}${completed&&!task.candidates?.length?'<div class="task-output-card task-form-field wide"><b>歌词已生成并提交</b><small>生成内容已经进入歌词审核。</small></div>':''}</div></section>`;
  }
  if(['lyricsReview','songReview'].includes(task.nodeType)){
    const isSong=task.nodeType==='songReview';
    const rejected=task.reviewResult==='rejected',reviewLabel=rejected?'退回修改':'审核通过';
    const sourceTask=productionTasks.find(item=>item.projectId===task.projectId&&String(item.workId)===String(task.workId)&&item.nodeId===task.sourceNodeId);
    const sourceLyrics=sourceTask?.selectedOutput?.content||sourceTask?.selectedCandidateText||'窗外的风吹过旧街，城市在灯火里醒来……',sourceSong=sourceTask?.selectedOutput?.title||'待审核歌曲版本 01';
    const preview=isSong?`<div class="task-audio-preview task-form-field wide"><i>▶</i><div><b>${escapeHtml(sourceSong)}</b><small>${completed?'03:42 · 审核完成':'03:42 · 点击播放并检查已选择歌曲'}</small></div></div>`:`<div class="task-output-card task-form-field wide task-review-preview"><b>待审核歌词 · 已选并编辑</b><small>${escapeHtml(sourceLyrics).replaceAll('\n','<br>')}</small></div>`;
    const reviewControl=completed?`<select disabled><option>${reviewLabel}</option></select>`:`<select data-task-required data-review-result><option value="">请选择审核结果</option><option value="approved">审核通过</option><option value="rejected">退回修改</option></select>`;
    return `<section class="task-node-form task-review-form ref-lyrics-task-form">${header}${spec}<div class="task-form-grid">${preview}<label class="task-form-field"><span>审核结果 <em>*</em></span>${reviewControl}</label><label class="task-form-field"><span>审核版本</span><input disabled value="${escapeHtml(task.workflowVersion)}" /></label><label class="task-form-field wide"><span>审核意见（选填）</span><textarea data-task-field="reviewOpinion" ${disabled} placeholder="记录修改建议或通过说明…">${taskFormValue(task,'reviewOpinion',completed?(rejected?'产物已退回上一创作页面修改。':'内容符合当前项目生产要求。'):'')}</textarea></label><div class="task-output-card task-form-field wide"><b>${completed?(rejected?'审核已退回':'审核已通过'):'等待审核结论'}</b><small>${completed?(rejected?'上一创作页面已重新开启。':'产物已解锁，可进入工作流下一节点。'):'审核通过后进入下一节点；退回后重新开启上一创作页面。'}</small></div></div></section>`;
  }
  if(task.nodeType==='refSong'){
    const generated=task.generationStage==='generated'||completed;
    const lyricsTask=productionTasks.find(item=>item.projectId===task.projectId&&String(item.workId)===String(task.workId)&&item.nodeType==='refLyrics'),approvedLyrics=lyricsTask?.selectedOutput?.content||lyricsTask?.selectedCandidateText||'已自动带入上一节点审核通过的歌词。';
    return `<section class="task-node-form task-generation-form ref-lyrics-task-form">${header}${spec}<div class="task-form-grid"><div class="task-audio-preview task-form-field wide"><i>▶</i><div><b>参考歌曲 · 海岸线 Demo</b><small>03:42 · 已加载为必需参考曲</small></div></div><div class="task-output-card task-form-field wide task-review-preview"><b>歌词输入 · 已审核通过</b><small>${escapeHtml(approvedLyrics).replaceAll('\n','<br>')}</small></div><label class="task-form-field"><span>歌曲生成配置 <em>*</em></span><select data-task-required data-generation-required data-task-field="config" ${disabled}><option value="">请选择配置</option><option value="v3" ${taskSelectedOption(task,'config','v3')}>Orchestra Music V3 · 高品质</option><option value="v2" ${taskSelectedOption(task,'config','v2')}>Orchestra Music V2 · 快速</option><option value="studio" ${taskSelectedOption(task,'config','studio')}>Studio Mix · 精细编曲</option></select></label><label class="task-form-field"><span>生成轮数</span><select data-task-field="count" ${disabled}><option value="3">3 轮</option><option value="2" ${taskSelectedOption(task,'count','2')}>2 轮</option><option value="1" ${taskSelectedOption(task,'count','1')}>1 轮</option></select></label><label class="task-form-field wide"><span>Prompt <em>*</em></span><textarea data-task-required data-generation-required data-task-field="prompt" ${disabled} placeholder="描述曲风、编曲、演唱与氛围…">${taskFormValue(task,'prompt')}</textarea></label><label class="task-form-field"><span>标题（选填）</span><input data-task-field="title" ${disabled} value="${taskFormValue(task,'title',task.workName)}" placeholder="歌曲标题" /></label><label class="task-form-field"><span>反向提示词（选填）</span><input data-task-field="negativePrompt" ${disabled} value="${taskFormValue(task,'negativePrompt')}" placeholder="填写不希望出现的元素" /></label>${!locked?`<div class="task-inline-actions task-form-field wide"><span>${generated?'可调整配置后重新生成歌曲版本。':'配置完成后生成可试听的候选歌曲。'}</span><button type="button" data-task-generate="song">${generated?'重新生成歌曲':'选择配置并生成歌曲'}</button></div>`:''}${generated?taskCandidateCards(task,'song'):''}${task.selectedCandidateId?`<div class="task-selected-song task-form-field wide"><i>✓</i><div><b>已选择：${escapeHtml((task.candidates||[]).find(candidate=>candidate.id===task.selectedCandidateId)?.title||'歌曲版本')}</b><small>确认无误后，提交进入歌曲审核。</small></div></div>`:''}</div></section>`;
  }
  const needsReference=['refSong','sampleSong','playlistSong'].includes(task.nodeType),referenceCount=task.nodeType==='playlistSong'?4:1;
  const references=needsReference?`<div class="task-reference-grid task-form-field wide">${Array.from({length:referenceCount},(_,index)=>`<div class="task-audio-preview"><i>▶</i><div><b>参考歌曲 ${index+1}${index===0?' *':''}</b><small>${completed?'已接收上游歌曲':'等待上游歌曲输入'}</small></div></div>`).join('')}</div>`:'';
  const generated=task.generationStage==='generated'||Boolean(task.candidates?.length);
  return `<section class="task-node-form task-generation-form ref-lyrics-task-form">${header}${spec}<div class="task-form-grid">${references}<div class="task-output-card task-form-field wide"><b>歌词输入（选填）</b><small>${completed?'已接收歌词内容':'可自动带入当前作品已审核通过的歌词'}</small></div><label class="task-form-field"><span>歌曲生成配置 <em>*</em></span><select data-task-required data-generation-required data-task-field="config" ${disabled}><option value="">请选择配置</option><option value="v3" ${taskSelectedOption(task,'config','v3')}>Orchestra Music V3 · 高品质</option><option value="v2" ${taskSelectedOption(task,'config','v2')}>Orchestra Music V2 · 快速</option><option value="studio" ${taskSelectedOption(task,'config','studio')}>Studio Mix · 精细编曲</option></select></label><label class="task-form-field"><span>生成轮数</span><select data-task-field="count" ${disabled}><option value="3">3 轮</option><option value="2" ${taskSelectedOption(task,'count','2')}>2 轮</option><option value="1" ${taskSelectedOption(task,'count','1')}>1 轮</option></select></label><label class="task-form-field wide"><span>Prompt <em>*</em></span><textarea data-task-required data-generation-required data-task-field="prompt" ${disabled} placeholder="描述曲风、编曲、演唱与氛围…">${taskFormValue(task,'prompt')}</textarea></label><label class="task-form-field"><span>标题（选填）</span><input data-task-field="title" ${disabled} value="${taskFormValue(task,'title',task.workName)}" placeholder="歌曲标题" /></label><label class="task-form-field"><span>反向提示词（选填）</span><input data-task-field="negativePrompt" ${disabled} value="${taskFormValue(task,'negativePrompt')}" placeholder="填写不希望出现的元素" /></label>${!locked?`<div class="task-inline-actions task-form-field wide"><span>${generated?'可调整配置后重新生成歌曲版本。':'配置完成后生成可试听的候选歌曲。'}</span><button type="button" data-task-generate="song">${generated?'重新生成歌曲':'选择配置并生成歌曲'}</button></div>`:''}${generated?taskCandidateCards(task,'song'):''}${task.selectedCandidateId?`<div class="task-selected-song task-form-field wide"><i>✓</i><div><b>已选择：${escapeHtml((task.candidates||[]).find(candidate=>candidate.id===task.selectedCandidateId)?.title||'歌曲版本')}</b><small>确认无误后，提交进入歌曲审核。</small></div></div>`:''}${completed&&!task.candidates?.length?'<div class="task-audio-preview task-form-field wide"><i>▶</i><div><b>生成歌曲版本 01</b><small>03:38 · 已提交曲审核</small></div></div>':''}</div></section>`;
}
function taskNodeActionLabel(){return '确认提交'}
function taskNodeCanComplete(task){return !['aiLyrics','refLyrics','aiSong','refSong','sampleSong','playlistSong'].includes(task.nodeType)||Boolean(task.selectedCandidateId)}
function renderProductionTaskDetail(task){
  const isReferenceLyrics=Boolean(task&&(task.nodeType==='refLyrics'||task.nodeTitle==='基于参考生成歌词'));
  const isReferenceSong=Boolean(task&&(task.nodeType==='refSong'||task.nodeTitle==='基于参考曲生成歌曲'||task.nodeTitle==='基于参考生成歌曲'));
  taskDetailPanel.classList.toggle('is-reference-lyrics',isReferenceLyrics);
  taskDetailPanel.classList.toggle('is-reference-song',isReferenceSong);
  taskDetailPanel.classList.toggle('task-reference-workspace',isReferenceLyrics||isReferenceSong);
  if(!task){taskDetailPanel.innerHTML='<div class="task-detail-empty"><span aria-hidden="true">▤</span><h2>选择一条任务</h2><p>右侧将根据工作流节点类型展示对应的任务处理页面。</p></div>';return}
  if(isReferenceLyrics){taskDetailPanel.innerHTML=renderReferenceLyricsWorkspace(task);const formatSelect=taskDetailPanel.querySelector('[data-task-field="lyricsFormat"]');if(formatSelect){const formatInput=document.createElement('input');formatInput.type='text';formatInput.dataset.taskField='lyricsFormat';formatInput.value=lyricFormatLabel(formatSelect.value);formatInput.placeholder='例如：主歌 / 副歌';formatInput.disabled=formatSelect.disabled;formatInput.className=formatSelect.className;formatSelect.replaceWith(formatInput)}taskDetailPanel.querySelector('[data-task-field="config"]')?.closest('.task-form-field')?.remove();return}
  if(isReferenceSong){taskDetailPanel.innerHTML=renderReferenceSongWorkspace(task);return}
  const context=taskContextByTask(task),status=taskStatusMeta[task.status],category=taskCategoryMeta[task.nodeCategory]||taskCategoryMeta.song;
  const siblingTasks=productionTasks.filter(item=>item.projectId===task.projectId&&String(item.workId)===String(task.workId)),taskByNode=new Map(siblingTasks.map(item=>[item.nodeId,item]));
  const nodes=context?.snapshot.nodes||[{id:task.nodeId,title:task.nodeTitle}];
  const steps=nodes.map((node,index)=>{const generated=taskByNode.get(node.id),activeView=task.status==='in_progress',state=activeView?(index<task.nodeIndex?'done':index===task.nodeIndex?'current':'locked'):(generated?.status==='in_progress'?'current':generated?'done':'locked'),icon=state==='current'?'▷':state==='done'?'✓':'⌁';return `<div class="task-flow-step ${state}" title="${state==='locked'?'尚未到达该节点，任务未生成':state==='current'?'当前处理页面':'该页面已处理'}"><i>${icon}</i><span>${escapeHtml(node.title)}</span></div>`}).join('');
taskDetailPanel.innerHTML=`<header class="task-detail-header"><span class="task-detail-kicker">NODE TASK · ${escapeHtml(task.workflowVersion)}</span><div class="task-detail-title"><i class="task-node-icon ${escapeHtml(task.nodeCategory)}" aria-hidden="true">${category.symbol}</i><div><h2>${escapeHtml(task.nodeTitle)}</h2><p><span data-task-display-name>${escapeHtml(task.workName)}</span> · ${escapeHtml(task.nodeSubtitle||category.label)}</p></div><span class="task-status ${status.className}">${status.label}</span></div><div class="task-detail-context"><span>${escapeHtml(task.projectName)}</span><span>${escapeHtml(task.planName)}</span><span>${escapeHtml(task.workflowName)} ${escapeHtml(task.workflowVersion)}</span>${task.featured?'<span class="task-featured-context">完整四节点任务</span>':''}</div></header><div class="task-detail-body"><div class="task-flow-caption"><b>任务页面进度</b><small>仅展示已到达的页面节点</small></div><div class="task-flow-path" style="--task-node-count:${nodes.length}">${steps}</div><div class="task-node-rule"><i>i</i><span>同一作品同时只允许一个进行中任务；完成当前页面操作后才生成下一节点任务，歌词和歌曲产物必须分别经过审核。</span></div>${taskNodeEditor(task)}${task.status==='terminated'?'<div class="task-termination-note">该任务已终止，并归入“已完成”任务视图；后续节点任务未生成。</div>':''}${task.status==='in_progress'?`<div class="task-detail-actions"><button class="task-complete-button" type="button" data-task-action="complete" ${taskNodeCanComplete(task)?'':'disabled'}>${taskNodeActionLabel(task)}</button></div>`:''}</div>`;
}
function updateTaskFieldTooltip(control){
  if(!control?.matches?.('[data-task-field], .ref-reference-lyrics textarea'))return;
  const value=control.matches('select')?control.selectedOptions?.[0]?.textContent?.trim()||'':String(control.value||'').trim();
  if(value){control.setAttribute('title',value);control.setAttribute('data-echo-tooltip','true')}
  else{control.removeAttribute('title');control.removeAttribute('data-echo-tooltip')}
}
function annotateTaskFieldTooltips(){
  const reference=taskDetailPanel.querySelector('.ref-reference-lyrics');
  if(reference){
    const task=productionTasks.find(item=>item.id===selectedTaskId),field=reference.querySelector('textarea');
    field.dataset.taskField='referenceLyrics';
    field.value=task?.formValues?.referenceLyrics??field.value;
  }
  taskDetailPanel.querySelectorAll('[data-task-field], .ref-reference-lyrics textarea').forEach(updateTaskFieldTooltip);
}
function openReferenceLyricsPicker(task){
  if(!task||task.status!=='in_progress')return;
  saveTaskPageValues(task);
  const choices=getAvailableReferenceSongs();
  if(!choices.length){showToast('暂无可用对标歌曲，请先在资产的对标歌曲中入库或启用歌曲','error');return}
  const dialog=document.createElement('dialog');dialog.className='reference-picker';
  dialog.innerHTML='<form method="dialog"><header><h2>更换对标歌词</h2><button value="cancel" aria-label="关闭">×</button></header><label>对标歌词<select aria-label="选择对标歌词"></select></label><label>歌词预览<textarea readonly aria-label="对标歌词预览"></textarea></label><footer><button value="cancel">取消</button><button value="confirm" class="reference-confirm">确认更换</button></footer></form>';
  const select=dialog.querySelector('select'),preview=dialog.querySelector('textarea');
  choices.forEach((choice,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`${choice.title} · ${choice.singer}`;select.append(option)});
  const selected=choices.findIndex(choice=>choice.id===getWorkReferenceId(task));
  select.value=String(Math.max(0,selected));preview.value=choices[Number(select.value)].content;
  select.addEventListener('change',()=>{preview.value=choices[Number(select.value)].content});
  dialog.addEventListener('close',()=>{
    if(dialog.returnValue==='confirm'){
      const choice=choices[Number(select.value)];
      if(!associateReferenceSong(task,choice.id)){showToast('该对标已禁用或保存失败，请重新选择','error');dialog.remove();return}
      task.formValues={...task.formValues,referenceLyrics:choice.content,referenceTitle:choice.title};
      persistProductionTasks();renderTaskCenter();renderReferenceLibrary();showToast('已更换对标歌词');
    }
    dialog.remove();
  },{once:true});
  document.body.append(dialog);dialog.showModal();
}
function renderTaskCenter(){
  if(!taskCenterReady)return;
  syncProductionTaskAssignees();
  const items=filteredProductionTasks();
  if(!items.some(task=>task.id===selectedTaskId))selectedTaskId=items[0]?.id||'';
  taskList.innerHTML=items.map(productionTaskRow).join('');
  taskList.hidden=!items.length;taskEmpty.hidden=Boolean(items.length);
  document.querySelector('#taskResultCount').textContent=`${items.length} 条`;
  document.querySelector('#taskListTitle').textContent=currentTaskStatus==='active'?'进行中任务':currentTaskStatus==='finished'?'已完成任务':'全部任务';
  const activeCount=productionTasks.filter(task=>task.status==='in_progress').length,finishedCount=productionTasks.filter(task=>['completed','terminated'].includes(task.status)).length;
  document.querySelector('#taskActiveTabCount').textContent=activeCount;
  document.querySelector('#taskFinishedTabCount').textContent=finishedCount;
  renderProductionTaskDetail(productionTasks.find(task=>task.id===selectedTaskId));
  annotateTaskFieldTooltips();
}
function setTaskStatusFilter(status){
  currentTaskStatus=status;
  taskStatusTabs.forEach(tab=>{const active=tab.dataset.taskStatus===status;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
  selectedTaskId='';renderTaskCenter();
}
function saveTaskPageValues(task){
  if(!task)return;
  const values={...(task.formValues||{})};
  taskDetailPanel.querySelectorAll('[data-task-field]').forEach(control=>{values[control.dataset.taskField]=control.value});
  task.formValues=values;
  const lyricsEditor=taskDetailPanel.querySelector('[data-selected-lyrics-editor]');
  if(lyricsEditor)task.selectedCandidateText=lyricsEditor.value;
}
function validateTaskControls(selector){
  const missing=Array.from(taskDetailPanel.querySelectorAll(selector)).find(control=>!String(control.value||'').trim());
  if(!missing)return true;
  const label=missing.closest('.task-form-field')?.querySelector('span')?.textContent.replace('*','').trim()||'必填项';
  missing.setAttribute('aria-invalid','true');missing.focus({preventScroll:true});
  showToast(`请填写或选择${label}`,'error');return false;
}
function validateActiveTaskPage(){return validateTaskControls('[data-task-required]')}
function taskGeneratedCandidates(kind){
  if(kind==='lyrics')return [
    {id:'lyrics-a',title:'歌词方案 A · 沿海夜行',summary:'叙事完整 · 都市抒情',content:'夜色沿着海岸线慢慢退潮\n旧站台还留着昨日的风\n我把没说完的话写进灯火\n等清晨替我们重新命名'},
    {id:'lyrics-b',title:'歌词方案 B · 雨停以后',summary:'情绪克制 · 电影感',content:'雨停以后城市变得透明\n你的背影穿过最后一盏路灯\n那些来不及抵达的约定\n在海风里轻轻回声'},
    {id:'lyrics-c',title:'歌词方案 C · 向光而行',summary:'副歌突出 · 温暖坚定',content:'如果远方还亮着微光\n就让我们沿着浪花去闯\n把每一次告别写成开场\n明天会替今夜回答'}
  ];
  return [
    {id:'song-a',title:'歌曲版本 A · 海岸夜行',summary:'03:42 · Dream Pop · 女声',durationSeconds:222},
    {id:'song-b',title:'歌曲版本 B · 雨后公路',summary:'03:36 · Indie Pop · 中性声线',durationSeconds:216},
    {id:'song-c',title:'歌曲版本 C · 向光',summary:'04:01 · Cinematic Pop · 女声',durationSeconds:241}
  ];
}
function generateTaskCandidates(task,kind){
  if(!task||task.status!=='in_progress')return;
  stopTaskSongPreview();
  saveTaskPageValues(task);
  if(!validateTaskControls('[data-generation-required]'))return;
  const count=Math.max(1,Math.min(3,Number(task.formValues?.count)||3));
  task.candidates=taskGeneratedCandidates(kind).slice(0,count);task.generationStage='generated';task.selectedCandidateId='';task.selectedCandidateText='';task.updatedAt=Date.now();task.updatedLabel='刚刚';
  if(!persistProductionTasks()){showToast('生成结果保存失败，请稍后重试','error');return}
  renderTaskCenter();showToast(kind==='lyrics'?`AI 已生成 ${count} 份候选歌词，请选择并编辑`:`已生成 ${count} 个歌曲版本，请试听选择`);
}
function selectTaskCandidate(task,candidateId){
  const candidate=task?.candidates?.find(item=>item.id===candidateId);if(!task||task.status!=='in_progress'||!candidate)return;
  stopTaskSongPreview();
  task.selectedCandidateId=candidate.id;task.selectedCandidateText=candidate.content||'';task.updatedAt=Date.now();task.updatedLabel='刚刚';
  persistProductionTasks();renderTaskCenter();
}
function advanceProductionTask(task,outcome){
  if(!task||task.status!=='in_progress'){showToast('该任务已结束，无法重复处理','error');return}
  saveTaskPageValues(task);
  if(outcome==='complete'&&!validateActiveTaskPage())return;
  if(outcome==='complete'&&['aiLyrics','refLyrics'].includes(task.nodeType)){
    if(!task.selectedCandidateId){showToast('请先生成并选择一份歌词','error');return}
    if(!task.selectedCandidateText.trim()){
      const editor=taskDetailPanel.querySelector('[data-selected-lyrics-editor]');editor?.setAttribute('aria-invalid','true');editor?.focus({preventScroll:true});showToast('歌词内容不能为空','error');return;
    }
    task.selectedOutput={type:'lyrics',candidateId:task.selectedCandidateId,content:task.selectedCandidateText};
  }
  if(outcome==='complete'&&['aiSong','refSong','sampleSong','playlistSong'].includes(task.nodeType)){
    const candidate=task.candidates?.find(item=>item.id===task.selectedCandidateId);if(!candidate){showToast('请先生成并选择一个歌曲版本','error');return}
    task.selectedOutput={type:'song',candidateId:candidate.id,title:candidate.title};
  }
  if(outcome==='complete'&&task.nodeType==='writeLyrics')task.selectedOutput={type:'lyrics',title:task.formValues?.title||'',content:task.formValues?.lyrics||''};
  const context=taskContextByTask(task);if(!context){showToast('未找到任务关联的作品或工作流','error');return}
  const beforeTasks=productionTasks.map(item=>({...item})),beforeWork={status:context.work.status,stage:context.work.stage,updated:context.work.updated};
  const reviewResult=taskDetailPanel.querySelector('[data-review-result]')?.value||'';
  task.status=outcome==='complete'?'completed':'terminated';task.updatedAt=Date.now();task.updatedLabel='刚刚';
  let nextTask=null;
  if(outcome==='complete'){
    if(['lyricsReview','songReview'].includes(task.nodeType)){
      task.reviewResult=reviewResult;
      if(reviewResult==='rejected'){
        const sourceTask=productionTasks.find(item=>item.projectId===task.projectId&&String(item.workId)===String(task.workId)&&item.nodeId===task.sourceNodeId);
        if(!sourceTask){productionTasks=beforeTasks;showToast('未找到需要退回的创作任务','error');return}
        sourceTask.status='in_progress';sourceTask.updatedAt=Date.now();sourceTask.updatedLabel='刚刚';
        context.work.status='制作中';context.work.stage=sourceTask.nodeTitle;context.work.updated=new Date().toISOString();selectedTaskId=sourceTask.id;
        normalizeProductionTaskConcurrency();
        if(!persistProductionTasks()){productionTasks=beforeTasks;Object.assign(context.work,beforeWork);showToast('审核结果保存失败，请稍后重试','error');return}
        syncProjectPlanProductionProgress(context.project);renderTaskCenter();showToast(`审核已退回「${sourceTask.nodeTitle}」重新处理`);return;
      }
    }
    const nextNode=context.snapshot.nodes[task.nodeIndex+1];
    if(nextNode){
      nextTask=productionTasks.find(item=>item.id===productionTaskId(context.project,context.work,nextNode));
      if(!nextTask){nextTask=createProductionTask(context,nextNode,task.nodeIndex+1,'in_progress');productionTasks.push(nextTask)}
      else nextTask.status='in_progress';
      nextTask.assignmentCreated=Boolean(task.assignmentCreated);
      context.work.status='制作中';context.work.stage=nextNode.title;context.work.updated=new Date().toISOString();selectedTaskId=nextTask.id;
    }else{context.work.status='已完成';context.work.stage='已完成';context.work.updated=new Date().toISOString();selectedTaskId=task.id}
  }else{context.work.status='已终止';context.work.stage='已终止';context.work.updated=new Date().toISOString();selectedTaskId=task.id}
  normalizeProductionTaskConcurrency();
  if(!persistProductionTasks()){productionTasks=beforeTasks;Object.assign(context.work,beforeWork);showToast('任务状态保存失败，请稍后重试','error');return}
  renderTaskCenter();
  syncProjectPlanProductionProgress(context.project);
  showToast(outcome==='complete'?(nextTask?`当前任务已完成，已生成「${nextTask.nodeTitle}」任务`:'当前任务已完成，作品工作流已结束'):'任务已终止并归入已完成');
}
function initializeTaskCenter(){ensureProjectWorkNumbers();loadProductionTasks();taskCenterReady=true;renderTaskCenter()}
taskStatusTabs.forEach(tab=>tab.addEventListener('click',()=>setTaskStatusFilter(tab.dataset.taskStatus)));
taskStatusTabs.forEach((tab,index)=>tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();let next=index;if(event.key==='ArrowLeft')next=(index-1+taskStatusTabs.length)%taskStatusTabs.length;if(event.key==='ArrowRight')next=(index+1)%taskStatusTabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=taskStatusTabs.length-1;setTaskStatusFilter(taskStatusTabs[next].dataset.taskStatus);taskStatusTabs[next].focus({preventScroll:true})}));
taskSearch.addEventListener('input',()=>{selectedTaskId='';renderTaskCenter()});
function renameProductionTask(taskId,value){
  const task=productionTasks.find(item=>item.id===taskId);
  if(!task||task.status!=='in_progress'){showToast('只有进行中的任务可以编辑名称','error');return false}
  const context=taskContextByTask(task);
  if(!context){showToast('未找到任务关联的作品','error');return false}
  return saveProjectWorkName(context.project,context.work,value);
}
function finishTaskInlineName(editor,cancel=false){
  const task=productionTasks.find(item=>item.id===editor.dataset.taskInlineName);if(!task)return false;
  const name=editor.textContent.replace(/[\r\n]+/g,' ').trim();
  if(cancel||name===task.workName){editor.textContent=task.workName;editor.removeAttribute('aria-invalid');return true}
  if(!renameProductionTask(task.id,name)){editor.setAttribute('aria-invalid','true');return false}
  editor.textContent=task.workName;editor.title=task.workName;editor.removeAttribute('aria-invalid');
  editor.closest('[data-task-id]').setAttribute('aria-label','打开任务：'+task.workName);
  taskList.querySelectorAll('[data-task-inline-name]').forEach(element=>{if(element===editor)return;const sibling=productionTasks.find(item=>item.id===element.dataset.taskInlineName);if(sibling?.projectId===task.projectId&&String(sibling.workId)===String(task.workId)){element.textContent=task.workName;element.title=task.workName;element.closest('[data-task-id]').setAttribute('aria-label','打开任务：'+task.workName)}});
  const selected=productionTasks.find(item=>item.id===selectedTaskId);
  if(selected?.projectId===task.projectId&&String(selected.workId)===String(task.workId))taskDetailPanel.querySelectorAll('[data-task-display-name]').forEach(element=>element.textContent=task.workName);
  showToast('任务名称已保存');return true;
}
taskList.addEventListener('click',event=>{
  if(event.target.closest('[contenteditable]'))return;
  const row=event.target.closest('[data-task-id]');if(!row)return;stopTaskSongPreview();selectedTaskId=row.dataset.taskId;renderTaskCenter();if(window.matchMedia('(max-width: 900px)').matches)taskDetailPanel.scrollIntoView({behavior:'smooth',block:'start'});
});
taskList.addEventListener('focusout',event=>{
  const editor=event.target;if(!editor.matches('[data-task-inline-name][contenteditable]'))return;
  if(!finishTaskInlineName(editor)){const task=productionTasks.find(item=>item.id===editor.dataset.taskInlineName);editor.textContent=task?.workName||'';editor.removeAttribute('aria-invalid')}
});
taskList.addEventListener('input',event=>{if(event.target.matches('[data-task-inline-name][contenteditable]'))event.target.removeAttribute('aria-invalid')});
taskList.addEventListener('keydown',event=>{
  const editor=event.target.closest('[data-task-inline-name][contenteditable]');
  if(editor){event.stopPropagation();if(event.isComposing||event.keyCode===229)return;if(event.key==='Enter'||event.key==='Escape'){event.preventDefault();if(finishTaskInlineName(editor,event.key==='Escape'))editor.blur()}return}
  if(event.target.matches('[data-task-id]')&&['Enter',' '].includes(event.key)){event.preventDefault();event.target.click()}
});
taskList.addEventListener('paste',event=>{
  const editor=event.target.closest('[data-task-inline-name][contenteditable]');if(!editor)return;
  event.preventDefault();const text=event.clipboardData.getData('text/plain').replace(/[\r\n]+/g,' '),selection=window.getSelection();
  if(!selection.rangeCount)return;const range=selection.getRangeAt(0);if(!editor.contains(range.commonAncestorContainer))return;
  range.deleteContents();const node=document.createTextNode(text);range.insertNode(node);range.setStartAfter(node);range.collapse(true);selection.removeAllRanges();selection.addRange(range);
});
taskDetailPanel.addEventListener('click',event=>{
  const task=productionTasks.find(item=>item.id===selectedTaskId);
  const songPlay=event.target.closest('[data-task-song-play]');if(songPlay){toggleTaskSongPreview(songPlay);return}
  const generate=event.target.closest('[data-task-generate]');if(generate){generateTaskCandidates(task,generate.dataset.taskGenerate);return}
  const candidate=event.target.closest('[data-task-candidate]');if(candidate){selectTaskCandidate(task,candidate.dataset.taskCandidate);return}
  const action=event.target.closest('[data-task-action]');if(action)advanceProductionTask(task,action.dataset.taskAction);
});
taskDetailPanel.addEventListener('input',event=>{event.target.removeAttribute?.('aria-invalid');updateTaskFieldTooltip(event.target);const task=productionTasks.find(item=>item.id===selectedTaskId);saveTaskPageValues(task);persistProductionTasks()});
taskDetailPanel.addEventListener('change',event=>{event.target.removeAttribute?.('aria-invalid');updateTaskFieldTooltip(event.target);const task=productionTasks.find(item=>item.id===selectedTaskId);saveTaskPageValues(task);if(event.target.matches('[data-task-field="config"]')&&applyTaskCreationConfiguration(task,event.target.value)){persistProductionTasks();renderTaskCenter();showToast('已根据创作配置反填页面数据');return}persistProductionTasks()});
window.addEventListener('load',initializeTaskCenter,{once:true});

const businessOrders=[
  {id:'ORD-202609-028',name:'星河品牌年度音乐订单',customer:'星河品牌',owner:'张三',nature:'共同开发',projects:2,status:'进行中',created:'2026-09-03'},
  {id:'ORD-202609-027',name:'城市音乐节片头订单',customer:'城市文化中心',owner:'Lin Chen',nature:'买断',projects:1,status:'待交付',created:'2026-09-01'},
  {id:'ORD-202608-026',name:'独立音乐人专辑订单',customer:'北岛工作室',owner:'Ming Xu',nature:'分成-独家',projects:3,status:'进行中',created:'2026-08-28'},
  {id:'ORD-202608-025',name:'夏日品牌主题曲订单',customer:'极光传媒',owner:'张三',nature:'独家',projects:1,status:'已完成',created:'2026-08-20'},
  {id:'ORD-202608-024',name:'新媒体声音实验订单',customer:'镜像互动',owner:'Lin Chen',nature:'共同开发',projects:2,status:'进行中',created:'2026-08-16'},
  {id:'ORD-202608-023',name:'东方采样档案订单',customer:'声音博物馆',owner:'Ming Xu',nature:'非独家',projects:1,status:'待交付',created:'2026-08-11'}
];
const businessCustomers=[
  {name:'星河品牌',company:'星河品牌管理有限公司',type:'平台方',businessLine:'品牌年度音乐与短视频传播',demands:['全案','人声','混音'],contact:'张三',status:'长期合作中',priority:'P1',notes:'年度合作方案已确认，进入持续制作阶段；企微群：星河年度音乐项目。',code:'CUS000001',enabled:true,orders:4,projects:6,createdAt:'2026-09-03T10:20:00'},
  {name:'城市文化中心',company:'城市文化传播中心',type:'版权方',businessLine:'城市活动配乐与公共文化内容',demands:['全案','伴奏'],contact:'Lin Chen',status:'制作进行',priority:'P1',notes:'音乐节片头已进入第一轮制作；飞书项目群：城市音乐节。',code:'CUS000002',enabled:true,orders:3,projects:4,createdAt:'2026-09-01T10:20:00'},
  {name:'北岛工作室',company:'北岛音乐工作室',type:'制作方',businessLine:'独立音乐人专辑制作',demands:['人声','混音','伴奏'],contact:'Ming Xu',status:'持续合作',priority:'P2',notes:'本季度专辑合作按计划推进；每周三同步制作进展。',code:'CUS000003',enabled:true,orders:6,projects:9,createdAt:'2026-08-28T10:20:00'},
  {name:'极光传媒',company:'极光新媒体有限公司',type:'渠道方',businessLine:'短视频音乐授权与分发',demands:['抢热度','分发端口','销售渠道'],contact:'张三',status:'合同签署',priority:'P2',notes:'合同已完成法务审核，等待盖章；合同链接：内部协作空间。',code:'CUS000004',enabled:true,orders:8,projects:11,createdAt:'2026-08-20T10:20:00'},
  {name:'镜像互动',company:'镜像互动科技有限公司',type:'制作方',businessLine:'互动内容与生成式音乐实验',demands:['DJ','其他'],demandNote:'定制实验型音乐接口',contact:'Lin Chen',status:'初步接触',priority:'P3',notes:'已完成首次需求沟通，等待技术方案；会议纪要：互动音乐方案沟通。',code:'CUS000005',enabled:false,orders:2,projects:2,createdAt:'2026-08-16T10:20:00'}
];
const businessSearch=document.querySelector('#businessSearch');
const businessStatus=document.querySelector('#businessStatus');
const businessAvailability=document.querySelector('#businessAvailability');
const businessAddButton=document.querySelector('#businessAddButton');
const businessTable=document.querySelector('#businessTable');
const businessEmpty=document.querySelector('#businessEmpty');
const businessPagination=document.querySelector('#businessPagination');
const businessPageSizeSelect=document.querySelector('#businessPageSize');
const businessPageSummary=document.querySelector('#businessPageSummary');
const businessPageIndicator=document.querySelector('#businessPageIndicator');
const businessPrevPage=document.querySelector('#businessPrevPage');
const businessNextPage=document.querySelector('#businessNextPage');
let businessPage=1,businessPageSize=30,businessSearchTimer=0;
function businessStatusClass(status){return {'进行中':'running','待交付':'pending','已完成':'done','商务推进':'running','合同签署':'pending','确定意向':'pending','持续合作':'active','初步接触':'paused','制作进行':'running','内部决策':'pending','前置合作待后置推进':'paused','长期合作中':'active'}[status]||'paused'}
function normalizeCustomerName(value){return String(value||'').trim()}
function generateCustomerCode(){const latest=businessCustomers.reduce((max,item)=>{const match=String(item.code||'').match(/^CUS(\d{6})$/);return match?Math.max(max,Number(match[1])):max},0);return `CUS${String(latest+1).padStart(6,'0')}`}
function businessOrderRow(item){return `<div class="business-row" role="row"><div class="business-cell primary" role="cell"><b>${escapeHtml(item.id)}</b><small>${escapeHtml(item.created)}</small></div><div class="business-cell primary" role="cell"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.customer)}</small></div><div class="business-cell" role="cell">${escapeHtml(item.owner)}</div><div class="business-cell" role="cell">${escapeHtml(item.nature)}</div><div class="business-cell" role="cell">${item.projects}</div><div class="business-cell" role="cell"><span class="business-status ${businessStatusClass(item.status)}">${escapeHtml(item.status)}</span></div><div class="business-cell" role="cell">${escapeHtml(item.created)}</div><div class="business-cell" role="cell"><button class="business-action" data-toast="查看订单：${escapeHtml(item.name)}">查看</button></div></div>`}
function businessCustomerRow(item){const enabled=item.enabled!==false,notes=richTextPlainText(item.notes||[item.progressNotes,item.communication].filter(Boolean).join('；'))||'—';const demands=(item.demands||[]).map(demand=>`<span>${escapeHtml(demand)}</span>`).join('')||'<span>未填写</span>';return `<div class="business-row customer-row ${enabled?'':'is-disabled'}" role="row" data-customer-code="${escapeHtml(item.code)}"><div class="business-cell customer-code" role="cell">${escapeHtml(item.code)}</div><div class="business-cell primary" role="cell"><b>${escapeHtml(item.name)}</b></div><div class="business-cell" role="cell" title="${escapeHtml(item.company||'-')}">${escapeHtml(item.company||'-')}</div><div class="business-cell" role="cell">${escapeHtml(item.type||'-')}</div><div class="business-cell business-wrap" role="cell" title="${escapeHtml(item.businessLine||'-')}">${escapeHtml(item.businessLine||'-')}</div><div class="business-cell business-tags" role="cell">${demands}</div><div class="business-cell business-wrap" role="cell" title="${escapeHtml(item.demandNote||'-')}">${escapeHtml(item.demandNote||'-')}</div><div class="business-cell" role="cell">${escapeHtml(item.contact||'-')}</div><div class="business-cell" role="cell"><span class="business-status ${businessStatusClass(item.status)}">${escapeHtml(item.status||'-')}</span></div><div class="business-cell" role="cell"><span class="customer-priority ${String(item.priority||'P2').toLowerCase()}">${escapeHtml(item.priority||'P2')}</span></div><div class="business-cell business-wrap" role="cell" title="${escapeHtml(notes)}">${escapeHtml(notes)}</div><div class="business-cell" role="cell"><span class="customer-availability ${enabled?'enabled':'disabled'}">${enabled?'启用':'禁用'}</span></div><div class="business-cell customer-actions" role="cell"><button class="business-action edit" type="button" data-customer-edit="${escapeHtml(item.code)}" aria-label="编辑客户 ${escapeHtml(item.name)}">编辑</button><button class="business-action ${enabled?'disable':'enable'}" type="button" data-customer-toggle="${escapeHtml(item.code)}" aria-label="${enabled?'禁用':'启用'}客户 ${escapeHtml(item.name)}">${enabled?'禁用':'启用'}</button></div></div>`}
function filteredBusinessCustomers(){
  const keyword=normalizeCustomerName(businessSearch.value).toLowerCase(),status=businessStatus.value,availability=businessAvailability.value;
  return businessCustomers.filter(item=>normalizeCustomerName(item.name).toLowerCase().includes(keyword)&&(status==='all'||item.status===status)&&(availability==='all'||(item.enabled!==false)===(availability==='enabled'))).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
}
function renderBusiness(){
  const items=filteredBusinessCustomers(),totalPages=Math.max(1,Math.ceil(items.length/businessPageSize));businessPage=Math.min(businessPage,totalPages);
  const start=(businessPage-1)*businessPageSize,visible=items.slice(start,start+businessPageSize);
  businessTable.innerHTML=`<div class="business-row business-head customer-row" role="row"><span>客户编号</span><span>客户名称</span><span>公司名称</span><span>客户类型</span><span>客户业务线</span><span>制作需求</span><span>制作需求备注</span><span>对接人</span><span>推进状态</span><span>优先级</span><span>备注</span><span>客户状态</span><span>操作</span></div>${visible.map(businessCustomerRow).join('')}`;
  businessTable.parentElement.hidden=!items.length;businessEmpty.hidden=Boolean(items.length);businessPagination.hidden=!items.length;
  document.querySelector('#businessListTitle').textContent='客户信息';document.querySelector('#businessResultCount').textContent=`${items.length} 条记录`;
  businessPageSummary.textContent=`共 ${items.length} 条`;businessPageIndicator.textContent=`${businessPage} / ${totalPages}`;businessPrevPage.disabled=businessPage<=1;businessNextPage.disabled=businessPage>=totalPages;
  const emptyTitle=businessEmpty.querySelector('h3'),emptyText=businessEmpty.querySelector('p');emptyTitle.textContent=businessCustomers.length?'未找到符合条件的客户。':'暂无客户。';emptyText.textContent=businessCustomers.length?'请调整搜索关键词或筛选条件。':'请点击“新增客户”创建第一条客户信息。';
}
businessSearch.addEventListener('input',()=>{businessSearch.value=Array.from(businessSearch.value).slice(0,50).join('');clearTimeout(businessSearchTimer);businessSearchTimer=setTimeout(()=>{businessPage=1;renderBusiness()},300)});
businessStatus.addEventListener('change',()=>{businessPage=1;renderBusiness()});
businessAvailability.addEventListener('change',()=>{businessPage=1;renderBusiness()});
businessPageSizeSelect.addEventListener('change',()=>{businessPageSize=Number(businessPageSizeSelect.value)||30;businessPage=1;renderBusiness()});
businessPrevPage.addEventListener('click',()=>{if(businessPage>1){businessPage-=1;renderBusiness()}});
businessNextPage.addEventListener('click',()=>{businessPage+=1;renderBusiness()});
businessAddButton.addEventListener('click',()=>openCustomerDialog('business',businessAddButton));
businessTable.addEventListener('click',event=>{
  const editButton=event.target.closest('[data-customer-edit]');
  const toggleButton=event.target.closest('[data-customer-toggle]');
  const actionButton=editButton||toggleButton;
  if(!actionButton)return;
  const customer=businessCustomers.find(item=>item.code===(editButton?.dataset.customerEdit||toggleButton?.dataset.customerToggle));
  if(!customer){showToast('未找到该客户信息','error');return}
  if(editButton){openCustomerDialog('edit',editButton,customer);return}
  if(customer.enabled!==false&&!window.confirm('禁用后，该客户不能用于新增项目，已关联项目不受影响。是否继续？'))return;
  customer.enabled=customer.enabled===false;
  populateCustomerSelects();
  renderBusiness();
  showToast(customer.enabled?'客户已启用。':'客户已禁用。');
});
renderBusiness();
let workflowData=[
  {id:'workflow-830305',name:'新建创作流程 830305',description:'内容中心创作音乐',creator:'qiyin',draft:'已保存',draftTime:'2026-09-02 12:25',publish:'有未发布修改',publishTime:'2026-09-02 11:21',publishClass:'pending',version:'V1.0',updated:'刚刚',editable:true},
  {id:'midnight-melody',name:'午夜旋律',description:'内容中心创作音乐',creator:'qiyin',draft:'已保存',draftTime:'2026-09-01 14:25',publish:'已发布',publishTime:'2026-09-01 14:25',publishClass:'published',version:'V2.1',updated:'昨天 18:42',editable:true},
  {id:'reference-lab',name:'参考歌实验室',description:'内容中心创作音乐',creator:'团队成员',draft:'已保存',draftTime:'2026-08-24 12:25',publish:'已发布',publishTime:'2026-08-24 12:25',publishClass:'published',version:'V1.0',updated:'8月22日',editable:false}
];
const workflowList=document.querySelector('#workflowList'),workflowEmpty=document.querySelector('#workflowEmpty'),workflowTable=document.querySelector('.workflow-table');
function workflowRow(item){return `<article class="workflow-row" role="row" data-workflow-id="${item.id}"><div class="workflow-name" role="cell"><span class="workflow-mark" aria-hidden="true"></span><div><b>${item.name}</b><small>${item.description}</small></div></div><span class="workflow-creator" role="cell">${item.creator}</span><div class="workflow-state workflow-draft" role="cell"><b>${item.draft}</b><small>${item.draftTime}</small></div><div class="workflow-state workflow-publish ${item.publishClass}" role="cell"><b>${item.publish}</b><small>${item.publishTime}</small></div><div class="workflow-version" role="cell"><b>${item.version}</b><small>${item.updated}</small></div><div class="workflow-actions" role="cell"><button class="workflow-enter" data-workflow-open="${item.id}" aria-label="进入 ${item.name} 画布">进入画布</button>${item.editable?`<button data-workflow-edit="${item.id}" aria-label="编辑 ${item.name}">编辑</button>`:''}<button data-workflow-copy="${item.id}" aria-label="复制 ${item.name}">复制</button></div></article>`}
function renderWorkflows(){const keyword=document.querySelector('#workflowSearch').value.trim().toLowerCase();const items=workflowData.filter(item=>(item.name+item.description+item.creator).toLowerCase().includes(keyword));workflowList.innerHTML=items.map(workflowRow).join('');document.querySelector('#workflowCount').textContent=`${items.length} 个创作流程`;workflowTable.style.display=items.length?'block':'none';workflowEmpty.style.display=items.length?'none':'block'}
function enterWorkflowCanvas(id){const item=workflowData.find(workflow=>workflow.id===id);if(!item)return;window.orchestraWorkflowCanvas?.open({id:item.id,name:item.name,version:item.version,published:item.publishClass==='published'});switchPage('canvas')}
renderWorkflows();
const projectBatchDialog=document.querySelector('#projectBatchDialog');
const projectBatchForm=document.querySelector('#projectBatchForm');
const newBatchName=document.querySelector('#newBatchName');
const newBatchNameCount=document.querySelector('#newBatchNameCount');
const projectBatchQuantity=document.querySelector('#projectBatchQuantity');
const projectBatchWorkflow=document.querySelector('#projectBatchWorkflow');
const projectBatchDelivery=document.querySelector('#projectBatchDelivery');
const projectBatchNotes=document.querySelector('#projectBatchNotes');
function localDateValue(date){const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');return `${year}-${month}-${day}`}
function beijingDateKey(value=new Date()){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(value)),part=type=>parts.find(item=>item.type===type)?.value||'';return `${part('year')}${part('month')}${part('day')}`}
function populateBatchWorkflows(){projectBatchWorkflow.innerHTML='<option value="">请选择已发布工作流</option>';workflowData.filter(item=>item.publishClass==='published').forEach(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=`${item.name} · ${item.version}`;projectBatchWorkflow.append(option)})}
function reserveDailyProductionNumbers(counts,now=new Date()){
  const day=beijingDateKey(now),storageKey='orchestra-daily-production-numbers-v1';
  const prefixes={project:`PROJECT-${day}-`,plan:`BATCH-${day}-`,flow:`FLOW${day}`,work:day};
  const existing={project:projectData.map(project=>project.id),plan:projectData.flatMap(project=>(project.batches||[]).map(plan=>plan.id)),flow:projectData.flatMap(project=>(project.works||[]).map(work=>work.serial)),work:projectData.flatMap(project=>(project.works||[]).map(work=>work.workNumber))};
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');
    const counters={...(saved[day]||{})},result={};
    Object.entries(counts).forEach(([kind,count])=>{
      if(!prefixes[kind]||!Number.isSafeInteger(count)||count<1)throw Error('编号数量无效');
      const prefix=prefixes[kind];
      const latest=existing[kind].reduce((max,value)=>{const serial=String(value||''),suffix=serial.slice(prefix.length);return serial.startsWith(prefix)&&/^\d+$/.test(suffix)?Math.max(max,Number(suffix)):max},0);
      const stored=Number(counters[kind])||0,start=Math.max(latest,stored);
      if(!Number.isSafeInteger(start+count)||(kind==='work'&&start+count>999999))throw Error('编号已超出范围');
      result[kind]=Array.from({length:count},(_,index)=>prefix+String(start+index+1).padStart(kind==='work'?6:5,'0'));
      counters[kind]=start+count;
    });
    saved[day]=counters;
    localStorage.setItem(storageKey,JSON.stringify(saved));
    return result;
  }catch{showToast('编号保存失败，请检查浏览器存储后重试','error');return null}
}
function ensureProjectWorkNumbers(){
  const storageKey='orchestra-work-identities-v1';
  try{
    const saved=JSON.parse(localStorage.getItem(storageKey)||'{}'),entries=projectData.flatMap(project=>(project.works||[]).map(work=>({project,work,key:JSON.stringify([project.id,String(work.id)])}))),used=new Set(),missingByDay=new Map();
    entries.forEach(entry=>{const {work,key}=entry,record=saved[key],candidate=record?.workNumber||work.workNumber;if(typeof candidate==='string'&&/^\d{14}$/.test(candidate)&&!used.has(candidate)){work.workNumber=candidate;used.add(candidate)}else{const createdAt=new Date(work.createdAt||Date.now()),day=beijingDateKey(Number.isNaN(createdAt.getTime())?new Date():createdAt);if(!missingByDay.has(day))missingByDay.set(day,[]);missingByDay.get(day).push(entry)}if(record?.updatedAt&&!/^\d{4}[-/]/.test(work.updated||''))work.updated=record.updatedAt});
    for(const entriesForDay of missingByDay.values()){const createdAt=new Date(entriesForDay[0].work.createdAt||Date.now()),numbers=reserveDailyProductionNumbers({work:entriesForDay.length},Number.isNaN(createdAt.getTime())?new Date():createdAt);if(!numbers)return false;entriesForDay.forEach((entry,index)=>{entry.work.workNumber=numbers.work[index];used.add(numbers.work[index])})}
    entries.forEach(({work,key})=>{const updatedAt=projectWorkUpdateDate(work).toISOString();saved[key]={workNumber:work.workNumber,updatedAt};work.updated=updatedAt});
    localStorage.setItem(storageKey,JSON.stringify(saved));return true;
  }catch{showToast('作品编号保存失败，请检查浏览器存储后重试','error');return false}
}
function createPlanWorks(plan,reservedSerials,reservedWorkNumbers){
  const quantity=Number(plan.quantity);if(!Number.isSafeInteger(quantity)||quantity<1)throw Error('生产数量必须为正整数');
  const now=new Date(),reserved=(!reservedSerials||!reservedWorkNumbers)?reserveDailyProductionNumbers({...(!reservedSerials?{flow:quantity}:{}),...(!reservedWorkNumbers?{work:quantity}:{})},now):{},serials=reservedSerials||reserved?.flow,workNumbers=reservedWorkNumbers||reserved?.work;
  if(!serials||serials.length!==quantity||!workNumbers||workNumbers.length!==quantity)throw Error('作品编号生成失败');
  const start=Number.isSafeInteger(plan.nextWorkNameSequence)&&plan.nextWorkNameSequence>0?plan.nextWorkNameSequence:1,planName=String(plan.name||'未命名生产计划').trim()||'未命名生产计划';plan.nextWorkNameSequence=start+quantity;
  return serials.map((serial,index)=>{const planNameSequence=start+index;return {id:serial,serial,workNumber:workNumbers[index],name:`${planName}-${String(planNameSequence).padStart(3,'0')}`,planId:plan.id,planName,defaultNamePrefix:planName,planNameSequence,status:'制作中',stage:'基于参考生成歌词',lyrics:'暂无',audio:'暂无',cover:'暂无',owner:'未分配',createdAt:now.toISOString(),updated:now.toISOString()}});
}
function openProjectBatchDialog(){const start=new Date(),delivery=new Date(start);delivery.setDate(delivery.getDate()+7);projectBatchForm.reset();projectBatchNotes.innerHTML='';newBatchNameCount.textContent='0 / 50';populateBatchWorkflows();projectBatchDelivery.value=localDateValue(delivery);projectBatchDialog.hidden=false;document.body.classList.add('order-dialog-open');requestAnimationFrame(()=>newBatchName.focus({preventScroll:true}))}
function closeProjectBatchDialog(restoreFocus=true){projectBatchDialog.hidden=true;document.body.classList.remove('order-dialog-open');if(restoreFocus)requestAnimationFrame(()=>document.querySelector('#addProjectBatch').focus({preventScroll:true}))}
newBatchName.addEventListener('input',()=>{if(Array.from(newBatchName.value).length>50)newBatchName.value=Array.from(newBatchName.value).slice(0,50).join('');newBatchNameCount.textContent=`${Array.from(newBatchName.value).length} / 50`});
projectBatchForm.onsubmit=event=>{event.preventDefault();const project=projectData.find(item=>item.id===selectedProjectId);if(!project){showToast('未找到当前项目','error');return}const name=newBatchName.value.trim();if(!name)return requireOrderControl(newBatchName,'请输入计划名称');if(project.batches.some(batch=>batch.name===name)){showToast('当前项目中已存在同名计划','error');newBatchName.focus({preventScroll:true});return}if(!Number.isSafeInteger(Number(projectBatchQuantity.value))||Number(projectBatchQuantity.value)<1)return requireOrderControl(projectBatchQuantity,'生产数量必须为正整数');if(!projectBatchWorkflow.value)return requireOrderControl(projectBatchWorkflow,'请选择已发布工作流');const workflow=workflowData.find(item=>item.id===projectBatchWorkflow.value);if(!workflow)return requireOrderControl(projectBatchWorkflow,'请选择有效的已发布工作流');const numbers=reserveDailyProductionNumbers({plan:1,flow:Number(projectBatchQuantity.value),work:Number(projectBatchQuantity.value)});if(!numbers)return;project.batches.unshift({id:numbers.plan[0],name,quantity:Number(projectBatchQuantity.value),completed:0,delivered:0,terminated:0,inProgress:0,owner:'未分配',workflowId:workflow.id,workflowName:workflow.name,workflowVersion:workflow.version,start:localDateValue(new Date()),delivery:projectBatchDelivery.value||'待排期',priority:'普通',status:'待生产',progress:0,notes:projectBatchNotes.innerHTML.trim()});const newWorks=createPlanWorks(project.batches[0],numbers.flow,numbers.work);project.works=[...newWorks,...(project.works||[])];startProductionPlanTasks(project,newWorks);project.date='刚刚';renderProjectDetail();renderProjects();closeProjectBatchDialog();showToast(`生产计划「${name}」已新增`)};
document.querySelector('#addProjectBatch').onclick=openProjectBatchDialog;
document.querySelector('#closeProjectBatch').onclick=()=>closeProjectBatchDialog();
document.querySelector('#cancelProjectBatch').onclick=()=>closeProjectBatchDialog();
projectBatchDialog.addEventListener('click',event=>{if(event.target===projectBatchDialog)closeProjectBatchDialog()});
projectBatchDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeProjectBatchDialog();return}if(event.key!=='Tab')return;const focusable=Array.from(projectBatchDialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contenteditable="true"]')).filter(element=>element.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
const projectCreateForm=document.querySelector('#projectCreateForm');
const projectWorkflowSelect=document.querySelector('#projectWorkflow');
const projectBatchName=document.querySelector('#projectBatchName');
const batchNameCount=document.querySelector('#batchNameCount');
const MAX_PROJECT_PLAN_GROUPS=5;
const projectPlanGroups=document.querySelector('#projectPlanGroups');
const addProjectPlanGroupButton=document.querySelector('#addProjectPlanGroup');
const projectPlanGroupTemplate=projectPlanGroups.firstElementChild.cloneNode(true);
let projectPlanGroupSequence=1;
function updateProjectPlanGroups(){
  const groups=Array.from(projectPlanGroups.querySelectorAll('[data-project-plan-group]'));
  groups.forEach((group,index)=>{
    group.querySelector('[data-plan-group-title]').textContent=`生产计划 ${index+1}`;
    group.setAttribute('aria-label',`生产计划 ${index+1}`);
    group.querySelector('[data-remove-plan-group]').disabled=index===0;
  });
  document.querySelector('#projectPlanGroupCount').textContent=`${groups.length} / ${MAX_PROJECT_PLAN_GROUPS} 组`;
  addProjectPlanGroupButton.disabled=groups.length>=MAX_PROJECT_PLAN_GROUPS;
  addProjectPlanGroupButton.textContent=addProjectPlanGroupButton.disabled?'已达上限（最多 5 组生产计划）':'＋ 添加一组生产计划（最多 5 组）';
}
function addProjectPlanGroup(){
  if(projectPlanGroups.children.length>=MAX_PROJECT_PLAN_GROUPS)return;
  const group=projectPlanGroupTemplate.cloneNode(true),suffix=`-group-${++projectPlanGroupSequence}`;
  group.querySelectorAll('[id]').forEach(element=>element.id+=suffix);
  group.querySelectorAll('label[for]').forEach(label=>label.htmlFor+=suffix);
  projectPlanGroups.append(group);
  populatePublishedWorkflows();updateProjectPlanGroups();
  group.querySelector('[name="productionName"]').focus();
}
addProjectPlanGroupButton.addEventListener('click',addProjectPlanGroup);
projectPlanGroups.addEventListener('click',event=>{
  const button=event.target.closest('[data-remove-plan-group]');
  if(!button||button.disabled)return;
  button.closest('[data-project-plan-group]').remove();
  updateProjectPlanGroups();addProjectPlanGroupButton.focus({preventScroll:true});
});
function collectProjectPlanDrafts(){
  const groups=Array.from(projectPlanGroups.querySelectorAll('[data-project-plan-group]')),drafts=[];
  if(!groups.length||groups.length>MAX_PROJECT_PLAN_GROUPS){showToast('请添加 1 至 5 组生产计划','error');return null}
  for(const [index,group] of groups.entries()){
    const name=group.querySelector('[name="productionName"]'),quantity=group.querySelector('[name="quantity"]'),workflowSelect=group.querySelector('[name="workflow"]');
    const prefix=`第 ${index+1} 组：`,length=Array.from(name.value.trim()).length;
    const invalid=(control,message)=>{invalidateProjectField(control,prefix+message);return null};
    if(!length)return invalid(name,'请输入生产计划名称');
    if(length>50)return invalid(name,'生产计划名称不能超过 50 个字符');
    if(!Number.isSafeInteger(Number(quantity.value))||Number(quantity.value)<1)return invalid(quantity,'生产数量必须为正整数');
    const workflow=workflowData.find(item=>item.id===workflowSelect.value&&item.publishClass==='published');
    if(!workflow)return invalid(workflowSelect,'请选择已发布工作流');
    const notes=group.querySelector('.rich-input');
    drafts.push({name:name.value.trim(),quantity:Number(quantity.value),workflow,delivery:group.querySelector('[name="deliveryDate"]').value,notes:sanitizeRichText(notes.innerHTML.trim()),summary:notes.textContent.trim()});
  }
  return drafts;
}
function buildInitialProjectPlans(drafts,owner,numbers){
  const batches=[],works=[];let offset=0;
  drafts.forEach((draft,index)=>{
    const {workflow}=draft;
    const plan={id:numbers.plan[index],name:draft.name,quantity:draft.quantity,completed:0,delivered:0,terminated:0,inProgress:0,owner,workflowId:workflow.id,workflowName:workflow.name,workflowVersion:workflow.version,start:localDateValue(new Date()),delivery:draft.delivery||'待排期',priority:'普通',status:'生产中',progress:0,notes:draft.notes};
    batches.push(plan);
    works.push(...createPlanWorks(plan,numbers.flow.slice(offset,offset+draft.quantity),numbers.work.slice(offset,offset+draft.quantity)));
    offset+=draft.quantity;
  });
  return {batches,works};
}
const projectCustomer=document.querySelector('#projectCustomer');
const projectNameInput=document.querySelector('#projectName');
const projectOrderReference=document.querySelector('#projectOrderReference');
const projectOrderFileList=document.querySelector('#projectOrderFileList');
const newOrderDialog=document.querySelector('#newOrderDialog');
const newOrderForm=document.querySelector('#newOrderForm');
const newOrderName=document.querySelector('#newOrderName');
const newOrderCustomer=document.querySelector('#newOrderCustomer');
const newOrderReference=document.querySelector('#newOrderReference');
const orderFileList=document.querySelector('#orderFileList');
const newCustomerDialog=document.querySelector('#newCustomerDialog');
const newCustomerForm=document.querySelector('#newCustomerForm');
const newCustomerName=document.querySelector('#newCustomerName');
const newCustomerCompany=document.querySelector('#newCustomerCompany');
const newCustomerType=document.querySelector('#newCustomerType');
const newCustomerBusinessLine=document.querySelector('#newCustomerBusinessLine');
const newCustomerContact=document.querySelector('#newCustomerContact');
const newCustomerProgressStatus=document.querySelector('#newCustomerProgressStatus');
const newCustomerPriority=document.querySelector('#newCustomerPriority');
const customerDemandField=document.querySelector('#customerDemandField');
const customerDemandTrigger=document.querySelector('#customerDemandTrigger');
const customerDemandMenu=document.querySelector('#customerDemandMenu');
const customerDemandSummary=document.querySelector('#customerDemandSummary');
const customerDemandOptions=Array.from(newCustomerForm.querySelectorAll('[name="customerDemand"]'));
const customerDemandNoteField=document.querySelector('#customerDemandNoteField');
const newCustomerDemandNote=document.querySelector('#newCustomerDemandNote');
const newCustomerNotes=document.querySelector('#newCustomerNotes');
const newCustomerNotesCount=document.querySelector('#newCustomerNotesCount');
const saveCustomerButton=document.querySelector('#saveCustomerButton');
let editingCustomerCode=null,customerNameCheckTimer=0;
function populatePublishedWorkflows(){
  const published=workflowData.filter(item=>item.publishClass==='published');
  projectPlanGroups.querySelectorAll('[name="workflow"]').forEach(select=>{
    const previous=select.value;select.innerHTML='<option value="">请选择已发布工作流</option>';
    published.forEach(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=`${item.name} · ${item.version}`;select.append(option)});
    if(published.some(item=>item.id===previous))select.value=previous;
  });
}
let editingProjectId=null;
function setProjectEditMode(projectId=null){
  editingProjectId=projectId;
  const editing=Boolean(projectId),planFields=document.querySelector('#projectInitialPlanFields');
  planFields.hidden=editing;
  planFields.querySelectorAll('input,select,textarea').forEach(control=>control.disabled=editing);
  document.querySelector('#projectCreateTitle').textContent=editing?'编辑项目':'新增项目';
  document.querySelector('#projectCreateTitle + p').textContent=editing?'编辑项目信息、参考资料与备注。':'填写项目与生产计划信息、选择已发布工作流并补充协作备注。';
  document.querySelector('.project-create-status').innerHTML=`<i></i> ${editing?'编辑中':'新项目'}`;
  projectCreateForm.querySelector('.project-submit-button').textContent=editing?'保存修改':'创建项目';
}
function resetProjectCreateForm(){setProjectEditMode();Array.from(projectPlanGroups.children).slice(1).forEach(group=>group.remove());projectCreateForm.reset();populateCustomerSelects();populatePublishedWorkflows();projectOrderFileList.textContent='';projectCreateForm.querySelectorAll('.rich-input').forEach(editor=>editor.innerHTML='');projectCreateForm.querySelectorAll('.project-field.is-invalid').forEach(field=>field.classList.remove('is-invalid'));batchNameCount.textContent='0 / 50';updateProjectPlanGroups()}
function openProjectCreatePage(){resetProjectCreateForm();switchPage('project-create',document.querySelector('.nav-item[data-page="projects"]'));requestAnimationFrame(()=>projectCustomer.focus({preventScroll:true}))}
function openProjectEditPage(projectId){
  const project=projectData.find(item=>item.id===projectId);if(!project)return;
  const order=businessOrders.find(item=>item.id===project.orderId);
  resetProjectCreateForm();setProjectEditMode(project.id);
  projectNameInput.value=project.title;
  const customer=project.customer||order?.customer||(project.desc.match(/客户：(.+?)\s+负责人：/)||[])[1];
  if(customer)projectCustomer.value=ensureCustomerOption(projectCustomer,customer).value;
  const owner=document.querySelector('#projectOwner'),ownerName=project.owner||order?.owner||project.batches?.[0]?.owner;
  if(ownerName)owner.value=ensureCustomerOption(owner,ownerName).value;
  document.querySelector('#projectOrderNotes').innerHTML=sanitizeRichText(project.notes??order?.notes??'');
  const references=project.references??order?.references??[];
  projectOrderFileList.textContent=references.length?`已有 ${references.length} 个文件：${references.map(file=>typeof file==='string'?file:file.name).join('、')}（选择新文件将替换；未选择则保留）`:'';
  switchPage('project-create',document.querySelector('.nav-item[data-page="projects"]'));
  requestAnimationFrame(()=>projectNameInput.focus({preventScroll:true}));
}
function saveProjectEdit(){
  const project=projectData.find(item=>item.id===editingProjectId);if(!project){showToast('项目不存在','error');return}
  const order=businessOrders.find(item=>item.id===project.orderId),oldCustomer=project.customer||order?.customer;
  const customer=projectCustomer.selectedOptions[0].textContent,owner=document.querySelector('#projectOwner').selectedOptions[0].textContent;
  const references=projectOrderReference.files.length?Array.from(projectOrderReference.files).map(file=>({name:file.name,size:file.size,type:file.type})):(project.references??order?.references??[]);
  Object.assign(project,{title:projectNameInput.value.trim(),customer,owner,notes:sanitizeRichText(document.querySelector('#projectOrderNotes').innerHTML),references,date:new Date().toLocaleString('zh-CN',{hour12:false})});
  if(/^客户：.*负责人：/.test(project.desc))project.desc=`客户：${customer}    负责人：${owner}`;
  if(order)Object.assign(order,{name:project.title,customer,owner,notes:project.notes,references:references.map(file=>typeof file==='string'?file:file.name)});
  if(oldCustomer&&oldCustomer!==customer){const previous=businessCustomers.find(item=>item.name===oldCustomer),next=businessCustomers.find(item=>item.name===customer);if(previous){previous.projects=Math.max(0,previous.projects-1);if(order)previous.orders=Math.max(0,previous.orders-1)}if(next){next.projects+=1;if(order)next.orders+=1}}
  productionTasks.filter(task=>task.projectId===project.id).forEach(task=>task.projectName=project.title);
  persistProductionTasks();renderBusiness();renderProjects();setProjectEditMode();
  switchPage('projects',document.querySelector('.nav-item[data-page="projects"]'));showToast('项目已更新');
}
let orderDialogSource='business';
let customerDialogSource='order';
let orderDialogTrigger=businessAddButton;
let customerDialogTrigger=document.querySelector('#addCustomerButton');
function closeOrderDialog(restoreFocus=true){newCustomerDialog.hidden=true;newOrderDialog.hidden=true;document.body.classList.remove('order-dialog-open');if(restoreFocus)requestAnimationFrame(()=>orderDialogTrigger?.focus({preventScroll:true}))}
function openOrderDialog(source='business',trigger=businessAddButton){orderDialogSource=source;orderDialogTrigger=trigger;document.querySelector('#newOrderDescription').textContent='创建后将同步到订单列表。';newOrderForm.reset();orderFileList.textContent='';newOrderDialog.hidden=false;document.body.classList.add('order-dialog-open');requestAnimationFrame(()=>newOrderCustomer.focus({preventScroll:true}))}
function setCustomerDemandOpen(open,focusOption=false){customerDemandMenu.hidden=!open;customerDemandTrigger.setAttribute('aria-expanded',String(open));customerDemandField.classList.toggle('is-open',open);if(open&&focusOption)requestAnimationFrame(()=>(customerDemandOptions.find(option=>option.checked)||customerDemandOptions[0])?.focus({preventScroll:true}))}
function updateCustomerDemandSummary(){const selected=customerDemandOptions.filter(option=>option.checked);customerDemandSummary.textContent=!selected.length?'请选择制作需求':selected.length<=2?selected.map(option=>option.value).join('、'):`${selected.slice(0,2).map(option=>option.value).join('、')} 等 ${selected.length} 项`;customerDemandTrigger.classList.toggle('has-value',Boolean(selected.length));customerDemandOptions.forEach(option=>option.closest('[role="option"]')?.setAttribute('aria-selected',String(option.checked)));customerDemandNoteField.hidden=!selected.some(option=>option.value==='其他');if(selected.length)customerDemandField.classList.remove('is-invalid')}
function closeCustomerDialog(restoreFocus=true){setCustomerDemandOpen(false);newCustomerDialog.hidden=true;editingCustomerCode=null;if(newOrderDialog.hidden)document.body.classList.remove('order-dialog-open');if(restoreFocus)requestAnimationFrame(()=>customerDialogTrigger?.focus({preventScroll:true}))}
function updateCustomerNotesCount(){let characters=Array.from(richTextPlainText(newCustomerNotes.innerHTML));if(characters.length>200){newCustomerNotes.textContent=characters.slice(0,200).join('');characters=Array.from(richTextPlainText(newCustomerNotes.innerHTML));const range=document.createRange(),selection=window.getSelection();range.selectNodeContents(newCustomerNotes);range.collapse(false);selection.removeAllRanges();selection.addRange(range);showToast('客户备注最多支持200个字符。','error')}newCustomerNotesCount.textContent=`${characters.length} / 200`}
function openCustomerDialog(source='order',trigger=document.querySelector('#addCustomerButton'),customer=null){customerDialogSource=source;customerDialogTrigger=trigger;editingCustomerCode=source==='edit'&&customer?customer.code:null;const editing=Boolean(editingCustomerCode);const descriptions={business:'新增后将同步到客户列表。',project:'新增后将自动回填到当前项目。',order:'新增后将自动回填到当前订单。',edit:'修改客户基础信息、业务属性与推进记录。'};document.querySelector('#newCustomerTitle').textContent=editing?'编辑客户':'新增客户';document.querySelector('#newCustomerDescription').textContent=descriptions[source]||descriptions.order;saveCustomerButton.textContent=editing?'保存修改':'确认新增';newCustomerForm.reset();newCustomerNotes.innerHTML='';newCustomerDemandNote.value='';newCustomerContact.value='张三';customerDemandField.classList.remove('is-invalid');setCustomerDemandOpen(false);if(editing){newCustomerName.value=customer.name||'';newCustomerCompany.value=customer.company||'';newCustomerType.value=customer.type||'';newCustomerBusinessLine.value=customer.businessLine||'';customerDemandOptions.forEach(input=>input.checked=(customer.demands||[]).includes(input.value));newCustomerContact.value=customer.contact||'';newCustomerProgressStatus.value=customer.status||'';newCustomerPriority.value=customer.priority||'';newCustomerDemandNote.value=customer.demandNote||'';newCustomerNotes.innerHTML=sanitizeRichText(customer.notes||[customer.progressNotes,customer.communication].filter(Boolean).join('<br>'))}updateCustomerDemandSummary();updateCustomerNotesCount();newCustomerDialog.hidden=false;document.body.classList.add('order-dialog-open');requestAnimationFrame(()=>newCustomerName.focus({preventScroll:true}))}
function requireOrderControl(control,message){if(String(control.value||'').trim())return true;control.focus({preventScroll:true});control.scrollIntoView({behavior:'smooth',block:'center'});showToast(message,'error');return false}
function invalidateProjectField(control,message){control.closest('.project-field')?.classList.add('is-invalid');control.focus({preventScroll:true});control.scrollIntoView({behavior:'smooth',block:'center'});showToast(message,'error');return false}
projectPlanGroups.addEventListener('input',event=>{const input=event.target;if(input.name!=='productionName')return;input.value=Array.from(input.value).slice(0,50).join('');input.closest('[data-project-plan-group]').querySelector('[data-plan-name-count]').textContent=`${Array.from(input.value).length} / 50`;input.closest('.project-field').classList.remove('is-invalid')});
projectCreateForm.addEventListener('change',event=>event.target.closest('.project-field')?.classList.remove('is-invalid'));
document.addEventListener('mousedown',event=>{const button=event.target.closest('.rich-toolbar button');if(!button)return;event.preventDefault();const editor=button.closest('.rich-editor').querySelector('.rich-input');editor.focus();if(button.dataset.richCommand==='clear')editor.innerHTML='';else document.execCommand(button.dataset.richCommand,false,null);editor.dispatchEvent(new Event('input',{bubbles:true}))});
newCustomerNotes.addEventListener('input',updateCustomerNotesCount);
newCustomerName.addEventListener('input',()=>{newCustomerName.value=Array.from(newCustomerName.value).slice(0,50).join('');clearTimeout(customerNameCheckTimer);customerNameCheckTimer=setTimeout(()=>{const name=normalizeCustomerName(newCustomerName.value),duplicate=businessCustomers.some(item=>normalizeCustomerName(item.name)===name&&item.code!==editingCustomerCode);newCustomerName.toggleAttribute('aria-invalid',Boolean(name&&duplicate));if(name&&duplicate)showToast('客户名称已存在，请更换后再试。','error')},300)});
document.querySelector('#addProjectCustomerButton').onclick=()=>openCustomerDialog('project',document.querySelector('#addProjectCustomerButton'));
document.querySelector('#closeNewOrder').onclick=()=>closeOrderDialog();
document.querySelector('#cancelNewOrder').onclick=()=>closeOrderDialog();
document.querySelector('#addCustomerButton').onclick=()=>openCustomerDialog('order',document.querySelector('#addCustomerButton'));
document.querySelector('#closeNewCustomer').onclick=()=>closeCustomerDialog();
document.querySelector('#backNewCustomer').onclick=()=>closeCustomerDialog();
document.querySelector('#cancelNewCustomer').onclick=()=>closeCustomerDialog();
newOrderDialog.addEventListener('click',event=>{if(event.target===newOrderDialog)closeOrderDialog()});
newOrderDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeOrderDialog()}});
newCustomerDialog.addEventListener('click',event=>{if(event.target===newCustomerDialog)closeCustomerDialog()});
newCustomerDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeCustomerDialog()}});
customerDemandTrigger.addEventListener('click',()=>setCustomerDemandOpen(customerDemandMenu.hidden));
customerDemandTrigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();setCustomerDemandOpen(true,true)}});
customerDemandOptions.forEach(option=>option.addEventListener('change',updateCustomerDemandSummary));
customerDemandField.addEventListener('keydown',event=>{if(event.key==='Escape'&&!customerDemandMenu.hidden){event.preventDefault();event.stopPropagation();setCustomerDemandOpen(false);customerDemandTrigger.focus()}});
document.addEventListener('click',event=>{if(!event.target.closest('#customerDemandSelect'))setCustomerDemandOpen(false)});
function bindReferenceUpload(drop,input,fileList){drop.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();input.click()}});input.addEventListener('change',()=>{const files=Array.from(input.files||[]);if(files.length>6){input.value='';fileList.textContent='';showToast('参考资料最多上传 6 个文件','error');return}const oversized=files.find(file=>file.size>60*1024*1024);if(oversized){input.value='';fileList.textContent='';showToast(`文件「${oversized.name}」超过 60M`,'error');return}fileList.textContent=files.length?`已选择 ${files.length} 个文件：${files.map(file=>file.name).join('、')}`:''})}
bindReferenceUpload(document.querySelector('#orderReferenceDrop'),newOrderReference,orderFileList);
bindReferenceUpload(document.querySelector('#projectOrderReferenceDrop'),projectOrderReference,projectOrderFileList);
function ensureCustomerOption(select,name){let option=Array.from(select.options).find(item=>item.textContent===name);if(!option){option=document.createElement('option');option.value=`customer-${Date.now()}-${select.id}`;option.textContent=name;select.append(option)}return option}
function customerFromSelect(select){return businessCustomers.find(item=>item.code===select.value)||businessCustomers.find(item=>item.name===select.selectedOptions?.[0]?.textContent)}
function populateCustomerSelects(preferredCode=''){[newOrderCustomer,projectCustomer].forEach(select=>{const previous=preferredCode||select.value;select.innerHTML='<option value="">请选择客户</option>';businessCustomers.filter(item=>item.enabled!==false).forEach(item=>{const option=document.createElement('option');option.value=item.code;option.textContent=item.name;select.append(option)});if(Array.from(select.options).some(option=>option.value===previous))select.value=previous})}
function validateCustomerText(control,max,requiredMessage,overflowMessage){const value=normalizeCustomerName(control.value);control.value=value;if(!value)return requireOrderControl(control,requiredMessage);if(Array.from(value).length>max){control.focus({preventScroll:true});showToast(overflowMessage,'error');return false}return true}
populateCustomerSelects();
newCustomerForm.onsubmit=event=>{
  event.preventDefault();
  if(!validateCustomerText(newCustomerName,50,'请输入客户名称。','客户名称最多支持50个字符。'))return;
  if(!validateCustomerText(newCustomerCompany,50,'请输入公司名称。','公司名称最多支持50个字符。'))return;
  if(!newCustomerType.value)return requireOrderControl(newCustomerType,'请选择客户类型。');
  if(!validateCustomerText(newCustomerBusinessLine,200,'请输入客户业务线。','客户业务线最多支持200个字符。'))return;
  const name=newCustomerName.value;
  const demands=Array.from(newCustomerForm.querySelectorAll('[name="customerDemand"]:checked')).map(item=>item.value);
  if(!demands.length){customerDemandField.classList.add('is-invalid');setCustomerDemandOpen(true);customerDemandTrigger.focus({preventScroll:true});customerDemandTrigger.scrollIntoView({behavior:'smooth',block:'center'});showToast('请选择制作需求。','error');return}
  if(!newCustomerContact.value)return requireOrderControl(newCustomerContact,'请选择对接人。');
  if(!newCustomerProgressStatus.value)return requireOrderControl(newCustomerProgressStatus,'请选择推进状态。');
  if(!newCustomerPriority.value)return requireOrderControl(newCustomerPriority,'请选择推进优先级。');
  const editingCustomer=editingCustomerCode?businessCustomers.find(item=>item.code===editingCustomerCode):null;
  const duplicateCustomer=businessCustomers.find(item=>normalizeCustomerName(item.name)===name&&item.code!==editingCustomerCode);
  if(duplicateCustomer){newCustomerName.setAttribute('aria-invalid','true');showToast('客户名称已存在，请更换后再试。','error');newCustomerName.focus({preventScroll:true});return}
  const notesHtml=sanitizeRichText(newCustomerNotes.innerHTML),notesText=richTextPlainText(notesHtml);
  if(Array.from(notesText).length>200){newCustomerNotes.focus({preventScroll:true});showToast('客户备注最多支持200个字符。','error');return}
  const payload={name,company:newCustomerCompany.value,type:newCustomerType.value,businessLine:newCustomerBusinessLine.value,demands,demandNote:normalizeCustomerName(newCustomerDemandNote.value),contact:newCustomerContact.value,priority:newCustomerPriority.value,notes:notesText?notesHtml:'',status:newCustomerProgressStatus.value};
  if(editingCustomer){
    const previousName=editingCustomer.name;
    Object.assign(editingCustomer,payload);
    businessOrders.forEach(order=>{if(order.customerCode===editingCustomer.code||order.customer===previousName){order.customer=name;order.customerCode=editingCustomer.code}});
    projectData.forEach(project=>{if(project.customerCode===editingCustomer.code||project.customer===previousName){project.customer=name;project.customerCode=editingCustomer.code}});
    populateCustomerSelects(editingCustomer.enabled!==false?editingCustomer.code:'');
    renderBusiness();
    closeCustomerDialog(false);
    showToast('客户信息已更新。');
    return;
  }
  const code=generateCustomerCode();
  businessCustomers.unshift({...payload,orders:0,projects:0,code,enabled:true,createdAt:new Date().toISOString()});
  populateCustomerSelects(code);
  if(customerDialogSource==='order')newOrderCustomer.value=code;
  if(customerDialogSource==='project'){projectCustomer.value=code;projectCustomer.closest('.project-field').classList.remove('is-invalid')}
  renderBusiness();
  const fromBusiness=customerDialogSource==='business';
  closeCustomerDialog();
  showToast('客户新增成功。');
};
newOrderForm.onsubmit=event=>{event.preventDefault();if(!requireOrderControl(newOrderCustomer,'请选择客户名称'))return;if(!requireOrderControl(newOrderName,'请输入订单名称'))return;if(!requireOrderControl(document.querySelector('#newOrderOwner'),'请选择负责人'))return;if(!requireOrderControl(document.querySelector('#newOrderProductionType'),'请选择生产类型'))return;if(!requireOrderControl(document.querySelector('#newOrderNature'),'请选择订单性质'))return;if(!requireOrderControl(document.querySelector('#newOrderCycle'),'请选择生产周期'))return;const name=newOrderName.value.trim();if(businessOrders.some(item=>item.name===name)){showToast('该订单名称已存在','error');newOrderName.focus({preventScroll:true});return}const owner=document.querySelector('#newOrderOwner');const productionType=document.querySelector('#newOrderProductionType');const nature=document.querySelector('#newOrderNature');const cycle=document.querySelector('#newOrderCycle');businessOrders.unshift({id:`ORD-202609-${String(businessOrders.length+29).padStart(3,'0')}`,name,customer:newOrderCustomer.options[newOrderCustomer.selectedIndex].text,owner:owner.options[owner.selectedIndex].text,nature:nature.value,productionType:productionType.value,cycle:cycle.value,projects:0,status:'进行中',created:'2026-09-04',notes:document.querySelector('#newOrderNotes').value.trim(),references:Array.from(newOrderReference.files||[]).map(file=>file.name)});renderBusiness();closeOrderDialog();showToast('订单已新增')};
document.querySelector('#backProjectList').onclick=()=>switchPage('projects',document.querySelector('.nav-item[data-page="projects"]'));
document.querySelector('#cancelProjectCreate').onclick=()=>switchPage('projects',document.querySelector('.nav-item[data-page="projects"]'));
projectCreateForm.onsubmit=event=>{
  event.preventDefault();
  const owner=document.querySelector('#projectOwner');
  const projectName=projectNameInput.value.trim();
  if(!projectCustomer.value)return invalidateProjectField(projectCustomer,'请选择客户名称');
  if(!projectName)return invalidateProjectField(projectNameInput,'请输入项目名称');
  if(projectData.some(item=>item.id!==editingProjectId&&item.title===projectName))return invalidateProjectField(projectNameInput,'该项目名称已存在');
  if(!owner.value)return invalidateProjectField(owner,'请选择负责人');
  if(editingProjectId){saveProjectEdit();return}
  const drafts=collectProjectPlanDrafts();if(!drafts)return;
  const totalQuantity=drafts.reduce((sum,plan)=>sum+plan.quantity,0);
  if(!Number.isSafeInteger(totalQuantity)){showToast('生产总数量超出有效范围','error');return}
  const numbers=reserveDailyProductionNumbers({project:1,plan:drafts.length,flow:totalQuantity,work:totalQuantity});
  if(!numbers)return;
  const orderId=`ORD-202609-${String(businessOrders.length+29).padStart(3,'0')}`;
  const customerName=projectCustomer.options[projectCustomer.selectedIndex].text;
  const ownerName=owner.options[owner.selectedIndex].text;
  const deliveryDate=drafts.map(plan=>plan.delivery).filter(Boolean).sort().pop()||'';
  const orderNotes=document.querySelector('#projectOrderNotes').innerHTML.trim();
  const productionPlanNotes=drafts.map(plan=>plan.notes).filter(Boolean).join('<br>');
  const initialPlans=buildInitialProjectPlans(drafts,ownerName,numbers);
  const references=Array.from(projectOrderReference.files||[]).map(file=>({name:file.name,size:file.size,type:file.type}));
  businessOrders.unshift({id:orderId,name:projectName,customer:customerName,owner:ownerName,nature:'—',productionType:'—',cycle:'—',projects:1,status:'进行中',created:'2026-09-04',notes:orderNotes,references:Array.from(projectOrderReference.files||[]).map(file=>file.name)});
  const matchedCustomer=businessCustomers.find(item=>item.name===customerName);
  if(matchedCustomer){matchedCustomer.orders+=1;matchedCustomer.projects+=1;matchedCustomer.last='刚刚'}
  const description=drafts.length===1?(drafts[0].summary||`${drafts[0].name} · ${totalQuantity} 份`):`${drafts.length} 组生产计划 · ${totalQuantity} 份`;
  projectData.unshift({id:numbers.project[0],title:projectName,desc:description,type:'生产项目',progress:0,date:'刚刚',color:'linear-gradient(135deg,#5c3bd1,#b64f88)',members:['H'],scope:'owned',risk:false,...initialPlans,orderId,quantity:totalQuantity,workflowId:drafts[0].workflow.id,deliveryDate,notes:orderNotes,productionPlanNotes});
  projectData[0].references=references;
  projectData[0].customer=customerName;
  projectData[0].owner=ownerName;
  startProductionPlanTasks(projectData[0],projectData[0].works);
  renderBusiness();
  setProjectFilter('all');
  switchPage('projects',document.querySelector('.nav-item[data-page="projects"]'));
  showToast(`项目「${projectName}」创建成功，已添加 ${drafts.length} 组生产计划`);
};
const root=document.documentElement;const saved=localStorage.getItem('orchestra-theme');if(saved)root.dataset.theme=saved;
document.querySelector('#themeToggle').onclick=()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';localStorage.setItem('orchestra-theme',root.dataset.theme)};
document.querySelector('#sidebarToggle').onclick=()=>document.body.classList.toggle('collapsed');
document.querySelector('#mobileMenu').onclick=()=>document.querySelector('#sidebar').classList.toggle('open');
let canvasReturnPage='projects';
function getCanvasReturnPage(){return canvasReturnPage}
function setProfileIsolation(active){document.querySelectorAll('body > .sidebar,body > .topbar,body > .player,.page-view:not(#profilePage)').forEach(element=>{if(active)element.setAttribute('inert','');else element.removeAttribute('inert')})}
function switchPage(page,item){const pages={assets:'#assetsPage',home:'#homePage',tasks:'#taskPage',projects:'#projectsPage','project-detail':'#projectDetailPage',business:'#businessPage','project-create':'#projectCreatePage',workflows:'#workflowsPage',canvas:'#canvasPage',profile:'#profilePage'};const currentPage=document.querySelector('.page-view.active')?.id;if(page==='canvas'&&currentPage!=='profilePage'){canvasReturnPage=currentPage==='workflowsPage'?'workflows':'projects';document.querySelector('#canvasBreadcrumb').textContent=canvasReturnPage==='workflows'?'创作集合 / 节点编排':'项目管理 / 节点编排'}document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));const projectChild=['business','project-create','project-detail'].includes(page);const navItem=item||document.querySelector(`.nav-item[data-page="${page}"]`)||(projectChild?document.querySelector('.nav-item[data-page="projects"]'):null);navItem?.classList.add('active');document.querySelectorAll('.page-view').forEach(x=>x.classList.remove('active'));document.querySelector(pages[page]||pages.home).classList.add('active');document.body.classList.toggle('task-mode',page==='tasks');document.body.classList.toggle('project-mode',page==='projects');document.body.classList.toggle('project-detail-mode',page==='project-detail');document.body.classList.toggle('business-mode',page==='business');document.body.classList.toggle('project-create-mode',page==='project-create');document.body.classList.toggle('workflow-mode',page==='workflows');document.body.classList.toggle('canvas-mode',page==='canvas');document.body.classList.toggle('profile-mode',page==='profile');setProfileIsolation(page==='profile');document.querySelector('#avatarButton').classList.toggle('active',page==='profile');document.querySelector('#sidebar').classList.remove('open');if(page==='tasks')renderTaskCenter();window.scrollTo(0,0);if(page==='projects')requestMoreProjects()}
function openPrimaryCanvas(item){window.orchestraWorkflowCanvas?.open({id:'primary',name:'未命名音乐工作流'});switchPage('canvas',item)}
const assetTabs=Array.from(document.querySelectorAll('.asset-tabs [role="tab"]'));
function selectAssetTab(selected){
  assetTabs.forEach(tab=>{const active=tab===selected;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!active});
}
assetTabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectAssetTab(tab));
  tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?assetTabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+assetTabs.length)%assetTabs.length;
    selectAssetTab(assetTabs[next]);assetTabs[next].focus();
  });
});
nav.addEventListener('click',e=>{const item=e.target.closest('.nav-item[data-page]');if(!item)return;if(item.dataset.page==='canvas')openPrimaryCanvas(item);else switchPage(item.dataset.page,item)});
document.querySelector('#projectSearch').addEventListener('input',resetProjectLoading);
document.querySelector('#projectSort').addEventListener('change',resetProjectLoading);
projectFilterTabs.forEach(tab=>tab.addEventListener('click',()=>setProjectFilter(tab.dataset.projectFilter)));
projectGrid.addEventListener('click',event=>{
  const card=event.target.closest('[data-project-open]');if(!card)return;
  const trigger=event.target.closest('.project-more');
  if(trigger){const open=trigger.getAttribute('aria-expanded')!=='true';closeProjectCardMenus();if(open){card.classList.add('menu-open');card.querySelector('.project-card-menu').hidden=false;trigger.setAttribute('aria-expanded','true');card.querySelector('[role="menuitem"]').focus({preventScroll:true})}return}
  const action=event.target.closest('[data-project-action]');
  if(action){closeProjectCardMenus();if(action.dataset.projectAction==='add-plan'){openProjectDetail(card.dataset.projectOpen);openProjectBatchDialog()}else openProjectEditPage(card.dataset.projectOpen);return}
  if(event.target.closest('.project-card-menu'))return;
  closeProjectCardMenus();openProjectDetail(card.dataset.projectOpen);
});
projectGrid.addEventListener('keydown',event=>{
  if(event.key==='Escape'){closeProjectCardMenus(true);return}
  const card=event.target.closest('.project-card.menu-open');if(!card||!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  event.preventDefault();const items=Array.from(card.querySelectorAll('[role="menuitem"]')),index=items.indexOf(document.activeElement);
  items[event.key==='Home'?0:event.key==='End'?items.length-1:(index+(event.key==='ArrowDown'?1:-1)+items.length)%items.length].focus();
});
document.addEventListener('click',event=>{if(!event.target.closest('.project-more,.project-card-menu'))closeProjectCardMenus()});
document.addEventListener('focusin',event=>{const open=projectGrid.querySelector('.menu-open');if(open&&!open.contains(event.target))closeProjectCardMenus()});
projectDetailTabs.forEach(tab=>tab.addEventListener('click',()=>setProjectDetailTab(tab.dataset.projectDetailTab)));
projectWorksPlanFilter.addEventListener('change',()=>{currentProjectWorksPlan=projectWorksPlanFilter.value;selectedProjectWorkIds.clear();const project=projectData.find(item=>item.id===selectedProjectId);if(project)renderProjectWorks(project)});
projectWorksGrid.addEventListener('click',event=>{
  const action=event.target.closest('[data-edit-work-name],[data-save-work-name],[data-cancel-work-name]');if(!action)return;
  const row=action.closest('[data-work-row]'),project=projectData.find(item=>item.id===selectedProjectId),work=project?.works?.find(item=>String(item.id)===row?.dataset.workRow);if(!work)return;
  if(action.hasAttribute('data-edit-work-name')){
    const cell=action.closest('.primary');cell.innerHTML=`<div class="project-work-name-editor"><input data-work-name-input aria-label="作品名称" placeholder="请输入作品名称" value="${escapeHtml(projectWorkName(project,work))}" /><div><button type="button" data-save-work-name>保存</button><button type="button" data-cancel-work-name>取消</button></div></div>`;
    const input=cell.querySelector('input');input.focus();input.select();return;
  }
  if(action.hasAttribute('data-save-work-name')){
    const input=row.querySelector('[data-work-name-input]');if(!saveProjectWorkName(project,work,input.value)){input.setAttribute('aria-invalid','true');input.focus();return}
    renderTaskCenter();showToast('作品名称已保存');
  }
  renderProjectWorks(project);
  Array.from(projectWorksGrid.querySelectorAll('[data-work-row]')).find(item=>item.dataset.workRow===String(work.id))?.querySelector('[data-edit-work-name]')?.focus({preventScroll:true});
});
projectWorksGrid.addEventListener('keydown',event=>{if(!event.target.matches('[data-work-name-input]')||event.isComposing)return;const selector=event.key==='Enter'?'[data-save-work-name]':event.key==='Escape'?'[data-cancel-work-name]':null;if(selector){event.preventDefault();event.stopPropagation();event.target.closest('[data-work-row]').querySelector(selector).click()}});
projectWorksGrid.addEventListener('change',event=>{const checkbox=event.target.closest('[data-work-select-all],[data-work-select]');if(!checkbox)return;if(checkbox.matches('[data-work-select-all]')){setVisibleProjectWorksSelection(checkbox.checked);return}const id=String(checkbox.dataset.workSelect);if(checkbox.checked)selectedProjectWorkIds.add(id);else selectedProjectWorkIds.delete(id);checkbox.closest('.project-work-row')?.classList.toggle('is-selected',checkbox.checked);const project=projectData.find(item=>item.id===selectedProjectId);if(project)syncProjectWorkSelectionUI(visibleProjectWorks(project))});
projectWorksSelectAllMobile.addEventListener('change',()=>setVisibleProjectWorksSelection(projectWorksSelectAllMobile.checked));
clearProjectWorksSelection.addEventListener('click',()=>clearSelectedProjectWorks(true));
assignProjectWorks.addEventListener('click',openProjectWorkAssignmentDialog);
document.querySelector('#closeProjectWorkAssignment').addEventListener('click',()=>closeProjectWorkAssignmentDialog());
document.querySelector('#cancelProjectWorkAssignment').addEventListener('click',()=>closeProjectWorkAssignmentDialog());
projectWorkAssignmentDialog.addEventListener('click',event=>{if(event.target===projectWorkAssignmentDialog)closeProjectWorkAssignmentDialog()});
projectWorkAssignmentDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeProjectWorkAssignmentDialog();return}if(event.key!=='Tab')return;const focusable=Array.from(projectWorkAssignmentDialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[contenteditable="true"]')).filter(element=>element.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
projectPlanList.addEventListener('click',event=>{const button=event.target.closest('[data-plan-works]');if(!button)return;currentProjectWorksPlan=button.dataset.planWorks;selectedProjectWorkIds.clear();const project=projectData.find(item=>item.id===selectedProjectId);if(project)renderProjectWorks(project);setProjectDetailTab('works',true)});
document.querySelector('.project-detail-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!event.target.closest('[data-project-detail-tab]'))return;event.preventDefault();const current=Math.max(0,projectDetailTabs.indexOf(document.activeElement));let next=current;if(event.key==='ArrowRight')next=(current+1)%projectDetailTabs.length;if(event.key==='ArrowLeft')next=(current-1+projectDetailTabs.length)%projectDetailTabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=projectDetailTabs.length-1;setProjectDetailTab(projectDetailTabs[next].dataset.projectDetailTab,true)});
document.querySelector('#backProjectDetails').onclick=()=>switchPage('projects',document.querySelector('.nav-item[data-page="projects"]'));
projectCustomerManagement.onclick=()=>switchPage('business',document.querySelector('.nav-item[data-page="projects"]'));
document.querySelector('#businessBackButton').onclick=()=>switchPage('projects');
document.querySelector('#newProject').onclick=openProjectCreatePage;
document.querySelector('#startProject').onclick=()=>openPrimaryCanvas();
document.querySelector('#workflowSearch').addEventListener('input',renderWorkflows);
document.querySelector('#newWorkflow').onclick=()=>{const item={id:`workflow-${Date.now()}`,name:'未命名创作流程',description:'新建创作流程草稿',creator:'qiyin',draft:'已保存',draftTime:'刚刚',publish:'未发布',publishTime:'尚未发布',publishClass:'review',version:'V1.0',updated:'刚刚',editable:true};workflowData.unshift(item);renderWorkflows();enterWorkflowCanvas(item.id)};
workflowList.addEventListener('click',event=>{const openButton=event.target.closest('[data-workflow-open]');if(openButton)return enterWorkflowCanvas(openButton.dataset.workflowOpen);const editButton=event.target.closest('[data-workflow-edit]');if(editButton)return enterWorkflowCanvas(editButton.dataset.workflowEdit);const copyButton=event.target.closest('[data-workflow-copy]');if(!copyButton)return;const source=workflowData.find(item=>item.id===copyButton.dataset.workflowCopy);if(!source)return;const copy={...source,id:`${source.id}-copy-${Date.now()}`,name:`${source.name} 副本`,draftTime:'刚刚',publish:'未发布',publishTime:'尚未发布',publishClass:'review',version:'V1.0',updated:'刚刚',editable:true};workflowData.unshift(copy);window.orchestraWorkflowCanvas?.copy(source.id,copy.id,copy.name);renderWorkflows();showToast(`已复制「${source.name}」`)});
const avatarButton=document.querySelector('#avatarButton');
const avatarMenuWrap=document.querySelector('.avatar-menu-wrap');
const avatarMenu=document.querySelector('#avatarMenu');
const accountSwitcher=document.querySelector('#accountSwitcher');
const accountSwitchButton=document.querySelector('#accountSwitchButton');
const closeAccountSwitcher=document.querySelector('#closeAccountSwitcher');
const workspaceOptions=Array.from(document.querySelectorAll('[data-workspace-id]'));
const profilePage=document.querySelector('#profilePage');
const profileClose=document.querySelector('#closeProfile');
const profileTabs=Array.from(document.querySelectorAll('[data-profile-tab]'));
const profilePageMap={homePage:'home',projectsPage:'projects',projectDetailPage:'project-detail',businessPage:'business',projectCreatePage:'project-create',workflowsPage:'workflows',canvasPage:'canvas'};
let profileReturnPage='home';
let profileReturnScrollY=0;
function setAccountSwitcher(open,restoreFocus=true){const focusedInside=!open&&accountSwitcher.contains(document.activeElement);accountSwitcher.hidden=!open;accountSwitchButton.setAttribute('aria-expanded',String(open));avatarMenu.classList.toggle('switcher-active',open);if(open)requestAnimationFrame(()=>(workspaceOptions.find(item=>item.classList.contains('active'))||workspaceOptions[0])?.focus());else if(focusedInside&&restoreFocus)requestAnimationFrame(()=>{if(accountSwitcher.hidden&&!avatarMenu.hidden)accountSwitchButton.focus({preventScroll:true})})}
function setAvatarMenu(open){const focusedInside=!open&&avatarMenuWrap.contains(document.activeElement)&&document.activeElement!==avatarButton;if(!open)setAccountSwitcher(false,false);avatarMenu.hidden=!open;avatarButton.setAttribute('aria-expanded',String(open));document.body.classList.toggle('avatar-menu-open',open);if(open)requestAnimationFrame(()=>accountSwitchButton.focus());else if(focusedInside)requestAnimationFrame(()=>{if(avatarMenu.hidden&&!document.body.classList.contains('profile-mode'))avatarButton.focus({preventScroll:true})})}
function selectWorkspace(option,announce=true){const wasActive=option.classList.contains('active');workspaceOptions.forEach(item=>{const active=item===option;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});const name=option.querySelector('b')?.textContent||'所选团队';document.querySelector('#avatarAccountContext').textContent=option.dataset.workspaceContext;document.querySelector('#avatarPlanName').textContent=option.dataset.workspacePlan;document.querySelector('#avatarWorkspaceStatus').textContent=option.dataset.workspaceStatus;document.querySelector('#avatarWorkspaceCredits').textContent=option.dataset.workspaceCredits;document.querySelector('#avatarWorkspaceSongs').textContent=option.dataset.workspaceSongs;document.querySelector('#projectTeamName').textContent=name;document.querySelector('#projectTeamIntro').textContent=option.dataset.teamIntro;document.querySelector('#projectTeamMeta').textContent=`${option.dataset.teamMembers} 位成员 · ${option.dataset.teamProjects} 个项目`;localStorage.setItem('orchestra-workspace',option.dataset.workspaceId);if(announce){setAccountSwitcher(false);showToast(wasActive?`当前已是 ${name}`:`已切换至 ${name}`)}}
const savedWorkspace=workspaceOptions.find(item=>item.dataset.workspaceId===localStorage.getItem('orchestra-workspace'))||workspaceOptions[0];
if(savedWorkspace)selectWorkspace(savedWorkspace,false);
function setProfileSection(section){
  const profileHeaders={details:['PROFILE','个人资料','管理头像、公开信息与个人偏好。'],security:['SECURITY','账号安全','维护登录凭据与多重身份验证方式。'],teams:['TEAM CENTER','团队管理','管理所属团队、角色权限和团队资源。'],quota:['RESOURCES','资源与额度','查看积分、生成额度、存储空间与本月用量。']};
  const [eyebrow,title,subtitle]=profileHeaders[section]||profileHeaders.details;
  document.querySelector('#profileEyebrow').textContent=eyebrow;document.querySelector('#profileTitle').textContent=title;document.querySelector('#profileSubtitle').textContent=subtitle;
  profilePage.classList.remove('team-management-active');
  profileTabs.forEach(item=>{const active=item.dataset.profileTab===section;item.classList.toggle('active',active);if(active)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current')});
  document.querySelectorAll('.profile-panel').forEach(panel=>{const active=panel.dataset.profilePanel===section;panel.classList.toggle('active',active);panel.hidden=!active});
  if(section==='teams'){teamOverview.hidden=false;teamMemberView.hidden=true;teamManager.hidden=true}
}
function openProfileSection(section){
  const currentId=document.querySelector('.page-view.active')?.id;
  if(currentId&&currentId!=='profilePage'){profileReturnPage=profilePageMap[currentId]||'home';profileReturnScrollY=window.scrollY}
  setProfileSection(section);setAvatarMenu(false);switchPage('profile');profilePage.scrollTop=0;requestAnimationFrame(()=>profileClose.focus({preventScroll:true}));
}
function closeProfileSection(){setAvatarMenu(false);switchPage(profileReturnPage);requestAnimationFrame(()=>{const previousBehavior=document.documentElement.style.scrollBehavior;document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,profileReturnScrollY);document.documentElement.style.scrollBehavior=previousBehavior;avatarButton.focus({preventScroll:true})})}
function openTeamManagementProfile(){const activeWorkspace=document.querySelector('.workspace-option.active')?.dataset.workspaceId||'orchestra-studio';const managementTargets={'orchestra-studio':['Orchestra Studio','团队最高管理员'],'sound-lab':['Sound Lab','团队管理员'],'indie-makers':['Indie Makers','生产者']};const [teamName,teamRole]=managementTargets[activeWorkspace]||managementTargets['orchestra-studio'];openProfileSection('teams');openTeamManager(teamName,teamRole,'overview')}
profileTabs.forEach(item=>item.onclick=()=>item.dataset.profileTab==='teams'?openTeamManagementProfile():openProfileSection(item.dataset.profileTab));
avatarButton.onclick=event=>{event.stopPropagation();setAvatarMenu(avatarMenu.hidden)};
avatarButton.onkeydown=event=>{if(event.key==='ArrowDown'){event.preventDefault();setAvatarMenu(true)}};
accountSwitchButton.onclick=()=>setAccountSwitcher(accountSwitcher.hidden);
closeAccountSwitcher.onclick=()=>setAccountSwitcher(false);
workspaceOptions.forEach(item=>item.onclick=()=>selectWorkspace(item));
document.querySelector('#createTeamFromSwitcher').onclick=()=>{openProfileSection('teams');showToast('新建团队功能已准备')};
avatarMenu.onkeydown=event=>{
  if(event.key==='Escape'){event.preventDefault();if(!accountSwitcher.hidden)setAccountSwitcher(false);else{setAvatarMenu(false);avatarButton.focus()}return}
  if(!event.target.closest('[data-profile-tab]'))return;
  if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
  event.preventDefault();const current=Math.max(0,profileTabs.indexOf(document.activeElement));let next=current;
  if(event.key==='ArrowDown')next=(current+1)%profileTabs.length;
  if(event.key==='ArrowUp')next=(current-1+profileTabs.length)%profileTabs.length;
  if(event.key==='Home')next=0;
  if(event.key==='End')next=profileTabs.length-1;
  profileTabs[next].focus();
};
accountSwitcher.onkeydown=event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();setAccountSwitcher(false);return}if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key)||!event.target.closest('[data-workspace-id]'))return;event.preventDefault();const current=Math.max(0,workspaceOptions.indexOf(document.activeElement));let next=current;if(event.key==='ArrowDown')next=(current+1)%workspaceOptions.length;if(event.key==='ArrowUp')next=(current-1+workspaceOptions.length)%workspaceOptions.length;if(event.key==='Home')next=0;if(event.key==='End')next=workspaceOptions.length-1;workspaceOptions[next].focus()};
avatarMenuWrap.addEventListener('focusout',()=>requestAnimationFrame(()=>{if(!avatarMenu.hidden&&!avatarMenuWrap.contains(document.activeElement))setAvatarMenu(false)}));
profilePage.addEventListener('keydown',event=>{if(event.key!=='Tab')return;const focusable=Array.from(profilePage.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')).filter(element=>!element.closest('[hidden]')&&element.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
profileClose.onclick=closeProfileSection;
document.addEventListener('click',event=>{if(!event.target.closest('.avatar-menu-wrap'))setAvatarMenu(false)});
document.addEventListener('keydown',event=>{if(event.key!=='Escape'||event.defaultPrevented)return;if(!accountSwitcher.hidden){event.preventDefault();setAccountSwitcher(false);return}if(!avatarMenu.hidden){event.preventDefault();setAvatarMenu(false);requestAnimationFrame(()=>avatarButton.focus({preventScroll:true}));return}if(document.body.classList.contains('profile-mode')){event.preventDefault();closeProfileSection()}});
document.querySelector('#profileForm').onsubmit=event=>{event.preventDefault();showToast('个人资料已保存')};
document.querySelector('#twoFactorToggle').onchange=event=>showToast(event.target.checked?'双重验证已开启':'双重验证已关闭');
const teamOverview=document.querySelector('#teamOverview');
const teamMemberView=document.querySelector('#teamMemberView');
const teamManager=document.querySelector('#teamManager');
let teamManagerReturnView='overview';
let lastTeamViewTrigger=null;
const teamDirectory={
  'Orchestra Studio':{logo:'O',logoClass:'violet',owner:'Huimin Zhang',created:'2026年6月12日',members:'8',description:'AI 音乐产品与创作实验团队',id:'ORCH-20260902',plan:'创作者团队版',credits:2480,songs:186,seats:8,seatTotal:20,storage:68,storageTotal:100,nextGrant:'2026-10-01',remainingInvites:3},
  'Sound Lab':{logo:'S',logoClass:'cyan',owner:'An Yu',created:'2026年5月20日',members:'12',description:'声音采样、生成式音乐与跨媒体协作',id:'SOUND-20260520',plan:'创作者团队版',credits:860,songs:120,seats:12,seatTotal:20,storage:42,storageTotal:100,nextGrant:'2026-10-01',remainingInvites:5},
  'Indie Makers':{logo:'I',logoClass:'orange',owner:'Mia Zhou',created:'2026年7月8日',members:'16',description:'独立音乐项目制作与交付协作团队',id:'INDIE-20260708',plan:'团队协作版',credits:300,songs:34,seats:16,seatTotal:20,storage:24,storageTotal:50,nextGrant:'2026-10-01',remainingInvites:2}
};
const teamRoleProfiles={
  '团队最高管理员':{
    badge:'owner',canManage:true,
    roleScope:'拥有团队最高控制权，可查看和管理全部数据',
    projectCount:'全部 4 个项目',resourceUsage:'团队视角 · 本月 328 积分',
    permissions:['查看与修改团队基本信息','管理全部成员与角色','查看全部项目、客户与订单','查看全部批次与交付','充值及分配团队积分与接口额度','管理全部团队资源','查看全部数据看板与操作日志','转让或解散团队'],
    projects:[
      {name:'项目名称',detail:'全部项目 · 12 个待处理任务',status:'进行中',tone:'green'},
      {name:'城市音乐节片头',detail:'商业协作 · 9月8日交付',status:'待交付',tone:'orange'},
      {name:'东方采样档案',detail:'团队资源项目 · 4 位成员',status:'进行中',tone:''}
    ],
    resources:[
      {name:'个人创作积分',value:'328 / 800',detail:'本月个人消耗 328 积分',used:41},
      {name:'项目接口额度',value:'62 / 180',detail:'参与项目当前可用额度',used:34},
      {name:'授权团队资源',value:'18 项',detail:'可管理团队全部资源',used:78}
    ]
  },
  '团队管理员':{
    badge:'admin',canManage:true,
    roleScope:'管理已授权成员、项目和日常业务',
    projectCount:'授权范围 2 个项目',resourceUsage:'可分配额度 · 860 积分',
    permissions:['查看团队基本信息','按授权修改团队信息','管理授权范围内的生产者','查看或管理普通角色','查看授权范围内的数据','分配积分与接口额度','按权限管理团队资源','查看管理范围数据与日志'],
    projects:[
      {name:'Sound Lab 声音实验',detail:'授权项目 · 6 个待处理任务',status:'进行中',tone:'green'},
      {name:'品牌声音标识',detail:'客户项目 · 9月12日交付',status:'待确认',tone:'orange'}
    ],
    resources:[
      {name:'个人创作积分',value:'214 / 500',detail:'本月个人消耗 214 积分',used:43},
      {name:'可分配接口额度',value:'86 / 160',detail:'只能分配授权范围内额度',used:54},
      {name:'授权团队资源',value:'11 项',detail:'按权限管理和使用',used:61}
    ]
  },
  '生产者':{
    badge:'producer',canManage:false,
    roleScope:'参与项目并处理生产任务，仅查看本人数据',
    projectCount:'参与 2 个项目',resourceUsage:'本月个人消耗 126 积分',
    permissions:['只读查看团队基本信息','查看自己的角色与权限','查看参与项目和待处理任务','查看本人任务与生产数据','查看个人积分与接口消耗','使用已授权团队资源'],
    projects:[
      {name:'独立单曲生产计划',detail:'参与项目 · 3 个待处理任务',status:'制作中',tone:'green'},
      {name:'午夜电台 Vol.3',detail:'参与项目 · 已完成 8 个任务',status:'待验收',tone:'orange'}
    ],
    resources:[
      {name:'个人创作积分',value:'126 / 300',detail:'仅展示本人本月消耗',used:42},
      {name:'参与项目可用额度',value:'34 次',detail:'不展示团队总额度',used:57},
      {name:'可用团队资源',value:'6 项',detail:'仅限已授权素材与模型',used:38}
    ]
  }
};
const managerRoles=new Set(['团队最高管理员','团队管理员']);
const getTeamRoleProfile=role=>teamRoleProfiles[role]||teamRoleProfiles['生产者'];
function setTeamAdminSection(section){
  document.querySelectorAll('[data-team-section]').forEach(tab=>{const active=tab.dataset.teamSection===section;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
  document.querySelectorAll('[data-team-admin-panel]').forEach(panel=>{const active=panel.dataset.teamAdminPanel===section;panel.hidden=!active;panel.classList.toggle('active',active)});
}
function setTeamMemberSection(section){
  document.querySelectorAll('[data-team-view-tab]').forEach(tab=>{const active=tab.dataset.teamViewTab===section;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
  document.querySelectorAll('[data-team-view-panel]').forEach(panel=>{const active=panel.dataset.teamViewPanel===section;panel.hidden=!active;panel.classList.toggle('active',active)});
}
function openTeamMemberView(teamName,teamRole,teamMembers){
  profilePage.classList.remove('team-management-active');
  const profile=getTeamRoleProfile(teamRole);
  const team=teamDirectory[teamName]||{logo:Array.from(teamName)[0]||'T',logoClass:'violet',owner:'—',created:'—',members:teamMembers||'—',description:'团队信息'};
  teamOverview.hidden=true;teamManager.hidden=true;teamMemberView.hidden=false;
  document.querySelector('#viewedTeamName').textContent=teamName;
  const roleBadge=document.querySelector('#viewedTeamRole');roleBadge.textContent=teamRole;roleBadge.className=`role-badge ${profile.badge}`;
  document.querySelector('#viewedTeamMembers').textContent=`${teamMembers||team.members} 位成员 · 正常协作`;
  document.querySelector('#viewedRoleName').textContent=teamRole;
  document.querySelector('#viewedRoleScope').textContent=profile.roleScope;
  document.querySelector('#viewedProjectCount').textContent=profile.projectCount;
  document.querySelector('#viewedResourceUsage').textContent=profile.resourceUsage;
  const teamLogo=document.querySelector('#viewedTeamLogo');teamLogo.textContent=team.logo;teamLogo.className=`team-logo ${team.logoClass}`;
  document.querySelector('#viewedTeamBasicName').textContent=teamName;
  document.querySelector('#viewedTeamDescription').textContent=team.description;
  document.querySelector('#viewedTeamOwner').textContent=team.owner;
  document.querySelector('#viewedTeamCreated').textContent=team.created;
  document.querySelector('#teamRolePermissions').innerHTML=profile.permissions.map(item=>`<span>✓ ${item}</span>`).join('');
  document.querySelector('#teamScopedProjects').innerHTML=profile.projects.map(item=>`<article><span class="project-status-dot ${item.tone}"></span><div><b>${item.name}</b><small>${item.detail}</small></div><em>${item.status}</em></article>`).join('');
  document.querySelector('#teamScopedResources').innerHTML=profile.resources.map(item=>`<article><div><b>${item.name}</b><strong>${item.value}</strong></div><p>${item.detail}</p><span><i style="--used:${item.used}%"></i></span></article>`).join('');
  const manageButton=document.querySelector('#memberViewManage');manageButton.hidden=!profile.canManage;manageButton.dataset.teamName=teamName;manageButton.dataset.teamRole=teamRole;
  setTeamMemberSection('basic');
  requestAnimationFrame(()=>teamMemberView.scrollIntoView({block:'start'}));
}
function openTeamManager(teamName,teamRole,returnView='overview'){
  if(!managerRoles.has(teamRole)){showToast('您暂无团队管理权限','error');return false}
  teamManagerReturnView=returnView;
  const highest=teamRole==='团队最高管理员';
  const team=teamDirectory[teamName]||{logo:Array.from(teamName)[0]||'T',logoClass:'violet',owner:'—',description:'团队信息'};
  teamOverview.hidden=true;teamMemberView.hidden=true;teamManager.hidden=false;
  profilePage.classList.add('team-management-active');
  teamManager.classList.toggle('manager-highest',highest);teamManager.classList.toggle('manager-admin',!highest);
  document.querySelector('#managedTeamName').textContent=teamName;
  const roleBadge=document.querySelector('#managedTeamRole');roleBadge.textContent=teamRole;roleBadge.className=`role-badge ${highest?'owner':'admin'}`;
  document.querySelector('#managedTeamId').textContent=team.id||'—';
  document.querySelector('#managedTeamPlanBadge').textContent=team.plan||'团队版';
  document.querySelector('#managedPlanName').textContent=team.plan||'团队版';
  document.querySelector('#managedCredits').textContent=Number(team.credits||0).toLocaleString('zh-CN');
  document.querySelector('#managedCreditBalance').textContent=Number(team.credits||0).toLocaleString('zh-CN');
  document.querySelector('#managedSongBalance').textContent=`${team.songs||0} 次`;
  document.querySelector('#managedSeats').textContent=team.seats||0;
  document.querySelector('#managedSeatUsage').textContent=`${team.seats||0} / ${team.seatTotal||0}`;
  document.querySelector('#managedSeatProgress').style.setProperty('--used',`${team.seatTotal?Math.min(100,Math.round(team.seats/team.seatTotal*100)):0}%`);
  document.querySelector('#managedStorage').textContent=`${team.storage||0} GB`;
  document.querySelector('#managedStorageUsage').textContent=`${team.storage||0} / ${team.storageTotal||0} GB`;
  document.querySelector('#managedStorageProgress').style.setProperty('--used',`${team.storageTotal?Math.min(100,Math.round(team.storage/team.storageTotal*100)):0}%`);
  document.querySelector('.team-renewal-note').textContent=`下次额度发放时间：${team.nextGrant||'—'} · 本周期剩余邀请成员次数：${team.remainingInvites||0} 次`;
  document.querySelector('#teamNameInput').value=teamName;
  document.querySelectorAll('[data-managed-team-logo]').forEach(teamLogo=>{teamLogo.textContent=team.logo;teamLogo.className=`team-logo ${team.logoClass}`});
  document.querySelector('#teamOwnerInput').value=team.owner;
  document.querySelector('#teamDescriptionInput').value=team.description;
  document.querySelector('#managerScopeNote').textContent=highest?'管理全部成员、管理员设置和角色权限。':'仅可管理授权范围内的生产者，不可修改同级或更高等级成员。';
  setTeamAdminSection('members');
  requestAnimationFrame(()=>teamManager.scrollIntoView({block:'start'}));
  showToast(`已进入 ${teamName} 团队管理`);
  return true
}
document.querySelectorAll('.team-view-button').forEach(button=>button.onclick=()=>{lastTeamViewTrigger=button;openTeamMemberView(button.dataset.teamName,button.dataset.teamRole,button.dataset.teamMembers)});
document.querySelectorAll('.team-manage-button').forEach(button=>button.onclick=()=>openTeamManager(button.dataset.teamName,button.dataset.teamRole,'overview'));
document.querySelector('#memberViewManage').onclick=event=>openTeamManager(event.currentTarget.dataset.teamName,event.currentTarget.dataset.teamRole,'member');
document.querySelector('#backMemberTeamList').onclick=()=>{teamMemberView.hidden=true;teamOverview.hidden=false;requestAnimationFrame(()=>lastTeamViewTrigger?.focus())};
document.querySelector('#backTeamList').onclick=()=>{profilePage.classList.remove('team-management-active');teamManager.hidden=true;if(teamManagerReturnView==='member'){teamMemberView.hidden=false;requestAnimationFrame(()=>document.querySelector('#memberViewManage').focus())}else{teamOverview.hidden=false}};
const teamMemberTabs=Array.from(document.querySelectorAll('[data-team-view-tab]'));
teamMemberTabs.forEach((tab,index)=>{
  tab.onclick=()=>setTeamMemberSection(tab.dataset.teamViewTab);
  tab.onkeydown=event=>{
    let nextIndex;
    if(event.key==='ArrowRight')nextIndex=(index+1)%teamMemberTabs.length;
    if(event.key==='ArrowLeft')nextIndex=(index-1+teamMemberTabs.length)%teamMemberTabs.length;
    if(event.key==='Home')nextIndex=0;
    if(event.key==='End')nextIndex=teamMemberTabs.length-1;
    if(nextIndex===undefined)return;
    event.preventDefault();
    const nextTab=teamMemberTabs[nextIndex];
    setTeamMemberSection(nextTab.dataset.teamViewTab);
    nextTab.focus();
  };
});
const teamAdminTabs=Array.from(document.querySelectorAll('[data-team-section]'));
teamAdminTabs.forEach((tab,index)=>{
  tab.onclick=()=>setTeamAdminSection(tab.dataset.teamSection);
  tab.onkeydown=event=>{
    let nextIndex;
    if(event.key==='ArrowRight')nextIndex=(index+1)%teamAdminTabs.length;
    if(event.key==='ArrowLeft')nextIndex=(index-1+teamAdminTabs.length)%teamAdminTabs.length;
    if(event.key==='Home')nextIndex=0;
    if(event.key==='End')nextIndex=teamAdminTabs.length-1;
    if(nextIndex===undefined)return;
    event.preventDefault();
    const nextTab=teamAdminTabs[nextIndex];
    setTeamAdminSection(nextTab.dataset.teamSection);
    nextTab.focus();
  };
});
document.querySelector('#teamInfoForm').onsubmit=event=>{event.preventDefault();const teamName=document.querySelector('#teamNameInput').value.trim();if(!teamName){showToast('请输入团队名称','error');return}document.querySelector('#managedTeamName').textContent=teamName;showToast('团队信息已保存')};
document.addEventListener('click',e=>{const target=e.target.closest('[data-toast]');if(target)showToast(target.dataset.toast)});
document.querySelectorAll('.filter').forEach(el=>el.onclick=()=>{document.querySelector('.filter.active')?.classList.remove('active');el.classList.add('active');grid.animate([{opacity:.35,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:300})});
let current=0,playing=false,timer;const play=document.querySelector('#mainPlay'),seek=document.querySelector('#seek');
function selectTrack(i){current=(i+titles.length)%titles.length;document.querySelector('#nowTitle').textContent=titles[current];document.querySelector('#miniCover').style.backgroundImage=`url('${url(photos[current])}')`;playing=true;play.textContent='❚❚';clearInterval(timer);timer=setInterval(()=>{seek.value=(+seek.value+1)%238;updateTime()},1000)}
function updateTime(){const v=+seek.value;document.querySelector('#currentTime').textContent=`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`}
play.onclick=()=>{playing=!playing;play.textContent=playing?'❚❚':'▶';if(playing)selectTrack(current);else clearInterval(timer)};
document.querySelector('#prevTrack').onclick=()=>selectTrack(current-1);document.querySelector('#nextTrack').onclick=()=>selectTrack(current+1);seek.oninput=updateTime;
grid.addEventListener('click',e=>{const card=e.target.closest('.card');if(card)selectTrack(+card.dataset.index)});
document.querySelector('#miniCover').style.backgroundImage=`url('${url(photos[0])}')`;
let toastTimer;function showToast(msg,type='info'){const t=document.querySelector('#toast');t.textContent=msg;t.classList.toggle('error',type==='error');t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>{t.classList.remove('show');t.classList.remove('error')},2200)}

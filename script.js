const navItems=[['✦','创建项目','create active','创建'],['⌂','首页','','首页'],['▣','待办','','待办'],['▰','项目','','项目'],['✣','创作集合','','集合'],['▤','资产','','资产'],['•••','更多','','更多']];
const navPageMap={'创建项目':'canvas','首页':'home','项目':'projects','创作集合':'workflows'};
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
  {id:'orchestra-theme-album',title:'Orchestra 主题专辑',desc:'团队联合制作的品牌年度概念专辑',type:'团队专辑',progress:68,date:'今天 10:20',color:'linear-gradient(135deg,#4f28c8,#c34767)',members:['H','L','M','+3'],scope:'owned',risk:false},
  {id:'indie-artist-support',title:'独立音乐人扶持计划',desc:'为新锐音乐人提供制作与发行支持',type:'团队企划',progress:52,date:'昨天',color:'linear-gradient(135deg,#057b8c,#41bd9c)',members:['H','Y','K'],scope:'owned',risk:true},
  {id:'new-media-sound-lab',title:'新媒体声音实验室',desc:'探索生成式音乐与视觉互动的跨媒介表达',type:'创意实验',progress:39,date:'8月24日',color:'linear-gradient(135deg,#d14a42,#ec9f37)',members:['H','A','J','+2'],scope:'joined',risk:true},
  {id:'city-music-festival',title:'城市音乐节片头',desc:'音乐节宣传片配乐与动态声音标识设计',type:'商业协作',progress:81,date:'8月21日',color:'linear-gradient(135deg,#26529a,#7272dd)',members:['H','R','C'],scope:'joined',risk:false},
  {id:'oriental-sample-archive',title:'东方采样档案',desc:'传统乐器与民间声音的数字采样工程',type:'声音档案',progress:26,date:'8月19日',color:'linear-gradient(135deg,#7f3430,#d66d42)',members:['H','S','W','+4'],scope:'team',risk:false},
  {id:'midnight-radio-vol3',title:'午夜电台 Vol.3',desc:'团队播客的配乐、片头与声音包装',type:'播客制作',progress:100,date:'8月16日',color:'linear-gradient(135deg,#343052,#7d5cb0)',members:['H','F'],scope:'joined',risk:false}
];
projectData.forEach((project,index)=>{const quantity=24+index*6;const completed=Math.min(quantity,Math.round(quantity*project.progress/100));project.batches=[{id:`BATCH-202609-${String(index+1).padStart(3,'0')}`,name:`${project.type}首轮制作`,quantity,completed,owner:['张三','Lin Chen','Ming Xu'][index%3],workflowId:index%2?'reference-lab':'midnight-melody',workflowName:index%2?'参考歌实验室':'午夜旋律',workflowVersion:index%2?'V1.0':'V2.1',start:`2026-08-${String(20+index).padStart(2,'0')}`,delivery:`2026-09-${String(6+index).padStart(2,'0')}`,priority:project.risk?'高':'普通',status:project.progress===100?'已完成':project.risk?'需关注':'进行中',progress:project.progress,notes:''}]});
projectData[0].batches.push({id:'BATCH-202609-007',name:'主打歌人声与混音',quantity:18,completed:5,owner:'Lin Chen',workflowId:'reference-lab',workflowName:'参考歌实验室',workflowVersion:'V1.0',start:'2026-09-03',delivery:'2026-09-12',priority:'高',status:'进行中',progress:28,notes:'优先完成主打歌的人声版本。'});
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
const projectWorksEmpty=document.querySelector('#projectWorksEmpty');
const projectEfficiencyList=document.querySelector('#projectEfficiencyList');
let selectedProjectId=projectData[0].id;
let currentProjectFilter='all';
const escapeHtml=value=>String(value).replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
function projectMemberCount(project){return project.members.reduce((total,member)=>total+(member.startsWith('+')?Number(member.slice(1))||0:1),0)}
function projectWorkCount(project){return project.batches.filter(batch=>batch.completed>0).length}
function projectPlanStatusClass(status){return {'进行中':'running','待开始':'pending','已完成':'done','需关注':'late'}[status]||'pending'}
function formatProjectDate(value){return value?String(value).replaceAll('-','.'):'-'}
function projectPlanRow(batch){const priorityClass=batch.priority==='紧急'?'urgent':batch.priority==='高'?'high':'normal';return `<div class="project-plan-row" role="row"><div class="project-plan-cell primary" role="cell"><b>${escapeHtml(batch.name)}</b><small>${escapeHtml(batch.id)}</small></div><div class="project-plan-cell" role="cell">${escapeHtml(batch.workflowName)} · ${escapeHtml(batch.workflowVersion)}</div><div class="project-plan-cell" role="cell">${batch.completed} / ${batch.quantity}</div><div class="project-plan-cell" role="cell">${escapeHtml(batch.owner)}</div><div class="project-plan-cell project-plan-period" role="cell"><b>${formatProjectDate(batch.start)}</b><small>至 ${formatProjectDate(batch.delivery)}</small></div><div class="project-plan-cell project-plan-progress" role="cell"><span><i style="--plan-progress:${batch.progress}%"></i></span><b>${batch.progress}%</b></div><div class="project-plan-cell" role="cell"><span class="project-plan-status ${projectPlanStatusClass(batch.status)}">${escapeHtml(batch.status)}</span></div><div class="project-plan-cell" role="cell"><span class="project-plan-priority ${priorityClass}">${escapeHtml(batch.priority)}</span></div><div class="project-plan-cell" role="cell"><button class="project-plan-action" type="button" data-toast="查看批次：${escapeHtml(batch.name)}">查看</button></div></div>`}
function renderProjectPlans(project){const batches=project.batches||[];projectPlanList.innerHTML=`<div class="project-plan-row head" role="row"><span>批次信息</span><span>工作流</span><span>生产数量</span><span>负责人</span><span>计划周期</span><span>完成进度</span><span>状态</span><span>优先级</span><span>操作</span></div>${batches.map(projectPlanRow).join('')}`;projectPlanTableWrap.hidden=!batches.length;projectPlanEmpty.hidden=Boolean(batches.length)}
function renderProjectWorks(project){const works=(project.batches||[]).filter(batch=>batch.completed>0);projectWorksGrid.innerHTML=works.map((batch,index)=>`<article class="project-work-card"><span class="project-work-cover" style="background:${project.color}" aria-hidden="true">♫</span><div><b>${escapeHtml(batch.name)} · 阶段作品</b><small>${escapeHtml(batch.owner)} · ${batch.completed} 份已完成</small></div><em>${batch.status==='已完成'?'已归档':'制作中'}</em></article>`).join('');projectWorksGrid.hidden=!works.length;projectWorksEmpty.hidden=Boolean(works.length)}
function renderProjectEfficiency(project){const memberNameMap={H:'Huimin Zhang',L:'Lin Chen',M:'Ming Xu',Y:'Yun Li',K:'Kai Zhou',A:'An Qi',J:'Jia He',R:'Rui Chen',C:'Chen Yu',S:'Song Lin',W:'Wei Luo',F:'Fang Yuan'};const members=project.members.filter(member=>!member.startsWith('+')).map(member=>({mark:member,name:memberNameMap[member]||`成员 ${member}`}));projectEfficiencyList.innerHTML=`<div class="project-efficiency-row head"><span>成员</span><span>负责批次</span><span>计划产量</span><span>完成效率</span></div>${members.map((member,index)=>{const owned=(project.batches||[]).filter(batch=>batch.owner===member.name||batch.owner.startsWith(member.name.split(' ')[0]));const planned=owned.reduce((total,batch)=>total+batch.quantity,0);const efficiency=Math.max(18,Math.min(100,project.progress-index*7));return `<div class="project-efficiency-row"><div class="efficiency-member"><i>${escapeHtml(member.mark)}</i><b>${escapeHtml(member.name)}</b></div><span>${owned.length||index+1} 个</span><span>${planned||12+index*6} 份</span><div class="efficiency-rate"><span><i style="--efficiency:${efficiency}%"></i></span><b>${efficiency}%</b></div></div>`}).join('')}`}
function renderProjectDetail(){const project=projectData.find(item=>item.id===selectedProjectId);if(!project)return;document.querySelector('#projectDetailTitle').textContent=project.title;document.querySelector('#projectDetailDescription').textContent=project.desc;const risk=document.querySelector('#projectDetailRisk');risk.classList.toggle('risk',project.risk);risk.innerHTML=`<i></i> ${project.risk?'存在延期风险':'正常推进'}`;document.querySelector('#projectDetailProgress').textContent=`${project.progress}%`;document.querySelector('#projectDetailPlanCount').textContent=project.batches.length;document.querySelector('#projectDetailWorkCount').textContent=projectWorkCount(project);document.querySelector('#projectDetailMemberCount').textContent=projectMemberCount(project);document.querySelector('#projectDetailUpdated').textContent=project.date;renderProjectPlans(project);renderProjectWorks(project);renderProjectEfficiency(project)}
function setProjectDetailTab(tabName,focus=false){projectDetailTabs.forEach(tab=>{const active=tab.dataset.projectDetailTab===tabName;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus({preventScroll:true})});projectDetailPanels.forEach(panel=>{const active=panel.dataset.projectDetailPanel===tabName;panel.classList.toggle('active',active);panel.hidden=!active})}
function openProjectDetail(projectId){if(!projectData.some(project=>project.id===projectId)){showToast('未找到该项目信息','error');return}selectedProjectId=projectId;renderProjectDetail();setProjectDetailTab('plan');switchPage('project-detail',document.querySelector('.nav-item[data-page="projects"]'))}
function projectCard(project){const bars=[42,72,24,84,55,34,68,46,78,31,61,48];return `<article class="project-card" role="button" tabindex="0" data-project-open="${escapeHtml(project.id)}" aria-label="进入项目 ${escapeHtml(project.title)}"><div class="project-cover" style="background:${project.color}"><span class="project-type">${escapeHtml(project.type)}</span><div class="wave">${bars.map(h=>`<i style="--h:${h}%"></i>`).join('')}</div></div><div class="project-card-body"><div class="project-card-title"><h3>${escapeHtml(project.title)}</h3><span class="project-more" aria-hidden="true">•••</span></div><p>${escapeHtml(project.desc)}</p><div class="project-progress-row"><span>项目进度</span><b>${project.progress}%</b></div><div class="progress-track"><i style="--progress:${project.progress}%"></i></div><footer class="project-card-footer"><div class="member-stack">${project.members.map((m,i)=>`<i style="--member:${['#7451e8','#e86876','#3aa891','#e19843'][i%4]}">${escapeHtml(m)}</i>`).join('')}</div><span>更新于 ${escapeHtml(project.date)}</span></footer></div></article>`}
function renderProjects(){const keyword=document.querySelector('#projectSearch').value.trim().toLowerCase();let items=projectData.filter(project=>currentProjectFilter==='all'||project.scope===currentProjectFilter);items=items.filter(project=>(project.title+project.desc+project.type).toLowerCase().includes(keyword));const sort=document.querySelector('#projectSort').value;if(sort==='name')items.sort((a,b)=>a.title.localeCompare(b.title,'zh-CN'));if(sort==='progress')items.sort((a,b)=>b.progress-a.progress);projectGrid.innerHTML=items.map(projectCard).join('');projectGrid.style.display=items.length?'grid':'none';projectEmpty.style.display=items.length?'none':'block';document.querySelector('#projectFilterTitle').textContent=projectFilterLabels[currentProjectFilter];document.querySelector('#projectResultCount').textContent=`${items.length} 个项目`;document.querySelector('#projectEmpty p').textContent=keyword?'换一个关键词试试吧':'当前分类暂无项目';document.querySelector('#projectTotal').textContent=projectData.length;document.querySelector('#projectActiveCount').textContent=projectData.filter(project=>project.progress<100).length;document.querySelector('#projectRiskCount').textContent=projectData.filter(project=>project.risk).length;document.querySelector('#projectCompleteCount').textContent=projectData.filter(project=>project.progress===100).length}
function setProjectFilter(filter){if(!projectFilterLabels[filter])return;currentProjectFilter=filter;projectFilterTabs.forEach(tab=>{const active=tab.dataset.projectFilter===filter;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active))});renderProjects()}
renderProjects();
const businessOrders=[
  {id:'ORD-202609-028',name:'星河品牌年度音乐订单',customer:'星河品牌',owner:'张三',nature:'共同开发',projects:2,status:'进行中',created:'2026-09-03'},
  {id:'ORD-202609-027',name:'城市音乐节片头订单',customer:'城市文化中心',owner:'Lin Chen',nature:'买断',projects:1,status:'待交付',created:'2026-09-01'},
  {id:'ORD-202608-026',name:'独立音乐人专辑订单',customer:'北岛工作室',owner:'Ming Xu',nature:'分成-独家',projects:3,status:'进行中',created:'2026-08-28'},
  {id:'ORD-202608-025',name:'夏日品牌主题曲订单',customer:'极光传媒',owner:'张三',nature:'独家',projects:1,status:'已完成',created:'2026-08-20'},
  {id:'ORD-202608-024',name:'新媒体声音实验订单',customer:'镜像互动',owner:'Lin Chen',nature:'共同开发',projects:2,status:'进行中',created:'2026-08-16'},
  {id:'ORD-202608-023',name:'东方采样档案订单',customer:'声音博物馆',owner:'Ming Xu',nature:'非独家',projects:1,status:'待交付',created:'2026-08-11'}
];
const businessCustomers=[
  {name:'星河品牌',company:'星河品牌管理有限公司',type:'平台方',businessLine:'品牌年度音乐与短视频传播',demands:['全案','人声','混音'],contact:'张三',status:'长期合作中',priority:'P1',progressNotes:'年度合作方案已确认，进入持续制作阶段。',communication:'企微群：星河年度音乐项目',code:'OP001',enabled:true,orders:4,projects:6,last:'2026-09-03'},
  {name:'城市文化中心',company:'城市文化传播中心',type:'版权方',businessLine:'城市活动配乐与公共文化内容',demands:['全案','伴奏'],contact:'Lin Chen',status:'制作进行',priority:'P1',progressNotes:'音乐节片头已进入第一轮制作。',communication:'飞书项目群：城市音乐节',code:'MP001',enabled:true,orders:3,projects:4,last:'2026-09-01'},
  {name:'北岛工作室',company:'北岛音乐工作室',type:'制作方',businessLine:'独立音乐人专辑制作',demands:['人声','混音','伴奏'],contact:'Ming Xu',status:'持续合作',priority:'P2',progressNotes:'本季度专辑合作按计划推进。',communication:'每周三同步制作进展',code:'MP002',enabled:true,orders:6,projects:9,last:'2026-08-28'},
  {name:'极光传媒',company:'极光新媒体有限公司',type:'渠道方',businessLine:'短视频音乐授权与分发',demands:['抢热度','分发端口','销售渠道'],contact:'张三',status:'合同签署',priority:'P2',progressNotes:'合同已完成法务审核，等待盖章。',communication:'合同链接：内部协作空间',code:'MP003',enabled:true,orders:8,projects:11,last:'2026-08-20'},
  {name:'镜像互动',company:'镜像互动科技有限公司',type:'制作方',businessLine:'互动内容与生成式音乐实验',demands:['DJ','其他'],contact:'Lin Chen',status:'初步接触',priority:'P3',progressNotes:'已完成首次需求沟通，等待技术方案。',communication:'会议纪要：互动音乐方案沟通',code:'MP004',enabled:false,orders:2,projects:2,last:'2026-08-16'}
];
const businessSearch=document.querySelector('#businessSearch');
const businessStatus=document.querySelector('#businessStatus');
const businessAddButton=document.querySelector('#businessAddButton');
const businessTable=document.querySelector('#businessTable');
const businessEmpty=document.querySelector('#businessEmpty');
function businessStatusClass(status){return {'进行中':'running','待交付':'pending','已完成':'done','商务推进':'running','合同签署':'pending','确定意向':'pending','持续合作':'active','初步接触':'paused','制作进行':'running','内部决策':'pending','前置合作待后置推进':'paused','长期合作中':'active'}[status]||'paused'}
function generateCustomerCode(type){const prefix=type==='平台方'?'OP':'MP';const latest=businessCustomers.reduce((max,item)=>{const match=String(item.code||'').match(new RegExp(`^${prefix}(\\d{3})$`));return match?Math.max(max,Number(match[1])):max},0);return `${prefix}${String(latest+1).padStart(3,'0')}`}
function businessOrderRow(item){return `<div class="business-row" role="row"><div class="business-cell primary" role="cell"><b>${escapeHtml(item.id)}</b><small>${escapeHtml(item.created)}</small></div><div class="business-cell primary" role="cell"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.customer)}</small></div><div class="business-cell" role="cell">${escapeHtml(item.owner)}</div><div class="business-cell" role="cell">${escapeHtml(item.nature)}</div><div class="business-cell" role="cell">${item.projects}</div><div class="business-cell" role="cell"><span class="business-status ${businessStatusClass(item.status)}">${escapeHtml(item.status)}</span></div><div class="business-cell" role="cell">${escapeHtml(item.created)}</div><div class="business-cell" role="cell"><button class="business-action" data-toast="查看订单：${escapeHtml(item.name)}">查看</button></div></div>`}
function businessCustomerRow(item){const enabled=item.enabled!==false;const demands=(item.demands||[]).map(demand=>`<span>${escapeHtml(demand)}</span>`).join('')||'<span>未填写</span>';return `<div class="business-row customer-row ${enabled?'':'is-disabled'}" role="row" data-customer-code="${escapeHtml(item.code)}"><div class="business-cell primary" role="cell"><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.code)}</small></div><div class="business-cell" role="cell" title="${escapeHtml(item.company||'-')}">${escapeHtml(item.company||'-')}</div><div class="business-cell" role="cell">${escapeHtml(item.type||'-')}</div><div class="business-cell business-wrap" role="cell" title="${escapeHtml(item.businessLine||'-')}">${escapeHtml(item.businessLine||'-')}</div><div class="business-cell business-tags" role="cell">${demands}</div><div class="business-cell" role="cell">${escapeHtml(item.contact||'-')}</div><div class="business-cell" role="cell"><span class="business-status ${businessStatusClass(item.status)}">${escapeHtml(item.status||'-')}</span></div><div class="business-cell" role="cell"><span class="customer-priority ${String(item.priority||'P2').toLowerCase()}">${escapeHtml(item.priority||'P2')}</span></div><div class="business-cell business-wrap" role="cell" title="${escapeHtml(item.progressNotes||'-')}">${escapeHtml(item.progressNotes||'-')}</div><div class="business-cell business-wrap" role="cell" title="${escapeHtml(item.communication||'-')}">${escapeHtml(item.communication||'-')}</div><div class="business-cell" role="cell"><span class="customer-availability ${enabled?'enabled':'disabled'}">${enabled?'启用':'禁用'}</span></div><div class="business-cell customer-actions" role="cell"><button class="business-action edit" type="button" data-customer-edit="${escapeHtml(item.code)}" aria-label="编辑客户 ${escapeHtml(item.name)}">编辑</button><button class="business-action ${enabled?'disable':'enable'}" type="button" data-customer-toggle="${escapeHtml(item.code)}" aria-label="${enabled?'禁用':'启用'}客户 ${escapeHtml(item.name)}">${enabled?'禁用':'启用'}</button></div></div>`}
function renderBusiness(){const keyword=businessSearch.value.trim().toLowerCase();const status=businessStatus.value;const items=businessCustomers.filter(item=>Object.values(item).flat().join(' ').toLowerCase().includes(keyword)&&(status==='all'||item.status===status));businessTable.innerHTML=`<div class="business-row business-head customer-row" role="row"><span>客户名称</span><span>公司名称</span><span>客户类型</span><span>客户业务线</span><span>制作需求</span><span>对接人</span><span>推进状态</span><span>优先级</span><span>进展备注</span><span>沟通记录</span><span>客户状态</span><span>操作</span></div>${items.map(businessCustomerRow).join('')}`;businessTable.parentElement.hidden=!items.length;businessEmpty.hidden=Boolean(items.length);document.querySelector('#businessListTitle').textContent='客户信息';document.querySelector('#businessResultCount').textContent=`${items.length} 条记录`}
businessSearch.addEventListener('input',renderBusiness);
businessStatus.addEventListener('change',renderBusiness);
businessAddButton.addEventListener('click',()=>openCustomerDialog('business',businessAddButton));
businessTable.addEventListener('click',event=>{
  const editButton=event.target.closest('[data-customer-edit]');
  const toggleButton=event.target.closest('[data-customer-toggle]');
  const actionButton=editButton||toggleButton;
  if(!actionButton)return;
  const customer=businessCustomers.find(item=>item.code===(editButton?.dataset.customerEdit||toggleButton?.dataset.customerToggle));
  if(!customer){showToast('未找到该客户信息','error');return}
  if(editButton){openCustomerDialog('edit',editButton,customer);return}
  customer.enabled=customer.enabled===false;
  renderBusiness();
  showToast(`客户「${customer.name}」已${customer.enabled?'启用':'禁用'}`);
});
renderBusiness();
let workflowData=[
  {id:'workflow-830305',name:'新建工作流 830305',description:'内容中心创作音乐',creator:'qiyin',draft:'已保存',draftTime:'2026-09-02 12:25',publish:'有未发布修改',publishTime:'2026-09-02 11:21',publishClass:'pending',version:'V1.0',updated:'刚刚',editable:true},
  {id:'midnight-melody',name:'午夜旋律',description:'内容中心创作音乐',creator:'qiyin',draft:'已保存',draftTime:'2026-09-01 14:25',publish:'已发布',publishTime:'2026-09-01 14:25',publishClass:'published',version:'V2.1',updated:'昨天 18:42',editable:true},
  {id:'reference-lab',name:'参考歌实验室',description:'内容中心创作音乐',creator:'团队成员',draft:'已保存',draftTime:'2026-08-24 12:25',publish:'已发布',publishTime:'2026-08-24 12:25',publishClass:'published',version:'V1.0',updated:'8月22日',editable:false}
];
const workflowList=document.querySelector('#workflowList'),workflowEmpty=document.querySelector('#workflowEmpty'),workflowTable=document.querySelector('.workflow-table');
function workflowRow(item){return `<article class="workflow-row" role="row" data-workflow-id="${item.id}"><div class="workflow-name" role="cell"><span class="workflow-mark" aria-hidden="true"></span><div><b>${item.name}</b><small>${item.description}</small></div></div><span class="workflow-creator" role="cell">${item.creator}</span><div class="workflow-state workflow-draft" role="cell"><b>${item.draft}</b><small>${item.draftTime}</small></div><div class="workflow-state workflow-publish ${item.publishClass}" role="cell"><b>${item.publish}</b><small>${item.publishTime}</small></div><div class="workflow-version" role="cell"><b>${item.version}</b><small>${item.updated}</small></div><div class="workflow-actions" role="cell"><button class="workflow-enter" data-workflow-open="${item.id}" aria-label="进入 ${item.name} 画布">进入画布</button>${item.editable?`<button data-workflow-edit="${item.id}" aria-label="编辑 ${item.name}">编辑</button>`:''}<button data-workflow-copy="${item.id}" aria-label="复制 ${item.name}">复制</button></div></article>`}
function renderWorkflows(){const keyword=document.querySelector('#workflowSearch').value.trim().toLowerCase();const items=workflowData.filter(item=>(item.name+item.description+item.creator).toLowerCase().includes(keyword));workflowList.innerHTML=items.map(workflowRow).join('');document.querySelector('#workflowCount').textContent=`${items.length} 个工作流`;workflowTable.style.display=items.length?'block':'none';workflowEmpty.style.display=items.length?'none':'block'}
function enterWorkflowCanvas(id){const item=workflowData.find(workflow=>workflow.id===id);if(!item)return;window.orchestraWorkflowCanvas?.open({id:item.id,name:item.name,version:item.version,published:item.publishClass==='published'});switchPage('canvas')}
renderWorkflows();
const projectBatchDialog=document.querySelector('#projectBatchDialog');
const projectBatchForm=document.querySelector('#projectBatchForm');
const newBatchName=document.querySelector('#newBatchName');
const newBatchNameCount=document.querySelector('#newBatchNameCount');
const projectBatchQuantity=document.querySelector('#projectBatchQuantity');
const projectBatchOwner=document.querySelector('#projectBatchOwner');
const projectBatchWorkflow=document.querySelector('#projectBatchWorkflow');
const projectBatchStart=document.querySelector('#projectBatchStart');
const projectBatchDelivery=document.querySelector('#projectBatchDelivery');
const projectBatchPriority=document.querySelector('#projectBatchPriority');
const projectBatchNotes=document.querySelector('#projectBatchNotes');
function localDateValue(date){const year=date.getFullYear(),month=String(date.getMonth()+1).padStart(2,'0'),day=String(date.getDate()).padStart(2,'0');return `${year}-${month}-${day}`}
function populateBatchWorkflows(){projectBatchWorkflow.innerHTML='<option value="">请选择已发布工作流</option>';workflowData.filter(item=>item.publishClass==='published').forEach(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=`${item.name} · ${item.version}`;projectBatchWorkflow.append(option)})}
function generateBatchId(){const latest=projectData.flatMap(project=>project.batches||[]).reduce((max,batch)=>{const match=String(batch.id||'').match(/^BATCH-202609-(\d{3})$/);return match?Math.max(max,Number(match[1])):max},0);return `BATCH-202609-${String(latest+1).padStart(3,'0')}`}
function openProjectBatchDialog(){const start=new Date(),delivery=new Date(start);delivery.setDate(delivery.getDate()+7);projectBatchForm.reset();newBatchNameCount.textContent='0 / 50';populateBatchWorkflows();projectBatchStart.value=localDateValue(start);projectBatchDelivery.value=localDateValue(delivery);projectBatchDialog.hidden=false;document.body.classList.add('order-dialog-open');requestAnimationFrame(()=>newBatchName.focus({preventScroll:true}))}
function closeProjectBatchDialog(restoreFocus=true){projectBatchDialog.hidden=true;document.body.classList.remove('order-dialog-open');if(restoreFocus)requestAnimationFrame(()=>document.querySelector('#addProjectBatch').focus({preventScroll:true}))}
newBatchName.addEventListener('input',()=>{if(Array.from(newBatchName.value).length>50)newBatchName.value=Array.from(newBatchName.value).slice(0,50).join('');newBatchNameCount.textContent=`${Array.from(newBatchName.value).length} / 50`});
projectBatchForm.onsubmit=event=>{event.preventDefault();const project=projectData.find(item=>item.id===selectedProjectId);if(!project){showToast('未找到当前项目','error');return}const name=newBatchName.value.trim();if(!name)return requireOrderControl(newBatchName,'请输入计划名称');if(project.batches.some(batch=>batch.name===name)){showToast('当前项目中已存在同名计划','error');newBatchName.focus({preventScroll:true});return}if(!projectBatchQuantity.value||Number(projectBatchQuantity.value)<1)return requireOrderControl(projectBatchQuantity,'生产数量必须大于 0');if(!projectBatchOwner.value)return requireOrderControl(projectBatchOwner,'请选择负责人');if(!projectBatchWorkflow.value)return requireOrderControl(projectBatchWorkflow,'请选择已发布工作流');if(!projectBatchStart.value)return requireOrderControl(projectBatchStart,'请选择计划开始日期');if(!projectBatchDelivery.value)return requireOrderControl(projectBatchDelivery,'请选择预计交付日期');if(projectBatchDelivery.value<projectBatchStart.value){showToast('预计交付日期不能早于计划开始日期','error');projectBatchDelivery.focus({preventScroll:true});return}const workflow=workflowData.find(item=>item.id===projectBatchWorkflow.value);project.batches.unshift({id:generateBatchId(),name,quantity:Number(projectBatchQuantity.value),completed:0,owner:projectBatchOwner.value,workflowId:workflow.id,workflowName:workflow.name,workflowVersion:workflow.version,start:projectBatchStart.value,delivery:projectBatchDelivery.value,priority:projectBatchPriority.value,status:'待开始',progress:0,notes:projectBatchNotes.value.trim()});project.date='刚刚';renderProjectDetail();renderProjects();closeProjectBatchDialog();showToast(`计划「${name}」已新增`)};
document.querySelector('#addProjectBatch').onclick=openProjectBatchDialog;
document.querySelector('#closeProjectBatch').onclick=()=>closeProjectBatchDialog();
document.querySelector('#cancelProjectBatch').onclick=()=>closeProjectBatchDialog();
projectBatchDialog.addEventListener('click',event=>{if(event.target===projectBatchDialog)closeProjectBatchDialog()});
projectBatchDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeProjectBatchDialog();return}if(event.key!=='Tab')return;const focusable=Array.from(projectBatchDialog.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')).filter(element=>element.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}});
const projectCreateForm=document.querySelector('#projectCreateForm');
const projectWorkflowSelect=document.querySelector('#projectWorkflow');
const projectBatchName=document.querySelector('#projectBatchName');
const batchNameCount=document.querySelector('#batchNameCount');
const projectCustomer=document.querySelector('#projectCustomer');
const projectOrderName=document.querySelector('#projectOrderName');
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
const saveCustomerButton=document.querySelector('#saveCustomerButton');
let editingCustomerCode=null;
function populatePublishedWorkflows(){const previous=projectWorkflowSelect.value;const published=workflowData.filter(item=>item.publishClass==='published');projectWorkflowSelect.innerHTML='<option value="">请选择已发布工作流</option>';published.forEach(item=>{const option=document.createElement('option');option.value=item.id;option.textContent=`${item.name} · ${item.version}`;projectWorkflowSelect.append(option)});if(published.some(item=>item.id===previous))projectWorkflowSelect.value=previous}
function resetProjectCreateForm(){projectCreateForm.reset();populatePublishedWorkflows();projectOrderFileList.textContent='';document.querySelectorAll('.rich-input').forEach(editor=>editor.innerHTML='');document.querySelectorAll('.project-field.is-invalid').forEach(field=>field.classList.remove('is-invalid'));batchNameCount.textContent='0 / 50'}
function openProjectCreatePage(){resetProjectCreateForm();switchPage('project-create',document.querySelector('.nav-item[data-page="projects"]'));requestAnimationFrame(()=>projectCustomer.focus({preventScroll:true}))}
let orderDialogSource='business';
let customerDialogSource='order';
let orderDialogTrigger=businessAddButton;
let customerDialogTrigger=document.querySelector('#addCustomerButton');
function closeOrderDialog(restoreFocus=true){newCustomerDialog.hidden=true;newOrderDialog.hidden=true;document.body.classList.remove('order-dialog-open');if(restoreFocus)requestAnimationFrame(()=>orderDialogTrigger?.focus({preventScroll:true}))}
function openOrderDialog(source='business',trigger=businessAddButton){orderDialogSource=source;orderDialogTrigger=trigger;document.querySelector('#newOrderDescription').textContent='创建后将同步到订单列表。';newOrderForm.reset();orderFileList.textContent='';newOrderDialog.hidden=false;document.body.classList.add('order-dialog-open');requestAnimationFrame(()=>newOrderCustomer.focus({preventScroll:true}))}
function closeCustomerDialog(restoreFocus=true){newCustomerDialog.hidden=true;editingCustomerCode=null;if(newOrderDialog.hidden)document.body.classList.remove('order-dialog-open');if(restoreFocus)requestAnimationFrame(()=>customerDialogTrigger?.focus({preventScroll:true}))}
function openCustomerDialog(source='order',trigger=document.querySelector('#addCustomerButton'),customer=null){customerDialogSource=source;customerDialogTrigger=trigger;editingCustomerCode=source==='edit'&&customer?customer.code:null;const editing=Boolean(editingCustomerCode);const descriptions={business:'新增后将同步到客户列表。',project:'新增后将自动回填到当前项目。',order:'新增后将自动回填到当前订单。',edit:'修改客户基础信息、业务属性与推进记录。'};document.querySelector('#newCustomerTitle').textContent=editing?'编辑客户':'新增客户';document.querySelector('#newCustomerDescription').textContent=descriptions[source]||descriptions.order;saveCustomerButton.textContent=editing?'保存修改':'确认新增';newCustomerForm.reset();if(editing){newCustomerName.value=customer.name||'';newCustomerCompany.value=customer.company||'';newCustomerType.value=customer.type||'';newCustomerBusinessLine.value=customer.businessLine||'';newCustomerForm.querySelectorAll('[name="customerDemand"]').forEach(input=>input.checked=(customer.demands||[]).includes(input.value));newCustomerContact.value=customer.contact||'';newCustomerProgressStatus.value=customer.status||'';newCustomerPriority.value=customer.priority||'P2';document.querySelector('#newCustomerProgressNotes').value=customer.progressNotes||'';document.querySelector('#newCustomerCommunication').value=customer.communication||''}newCustomerDialog.hidden=false;document.body.classList.add('order-dialog-open');requestAnimationFrame(()=>newCustomerName.focus({preventScroll:true}))}
function requireOrderControl(control,message){if(String(control.value||'').trim())return true;control.focus({preventScroll:true});control.scrollIntoView({behavior:'smooth',block:'center'});showToast(message,'error');return false}
function invalidateProjectField(control,message){control.closest('.project-field')?.classList.add('is-invalid');control.focus({preventScroll:true});control.scrollIntoView({behavior:'smooth',block:'center'});showToast(message,'error');return false}
projectBatchName.addEventListener('input',()=>{if(projectBatchName.value.length>50)projectBatchName.value=Array.from(projectBatchName.value).slice(0,50).join('');batchNameCount.textContent=`${Array.from(projectBatchName.value).length} / 50`;projectBatchName.closest('.project-field').classList.remove('is-invalid')});
document.querySelectorAll('#projectCreateForm input,#projectCreateForm select,#projectCreateForm textarea').forEach(control=>control.addEventListener('change',()=>control.closest('.project-field')?.classList.remove('is-invalid')));
document.querySelectorAll('.rich-toolbar button').forEach(button=>button.addEventListener('mousedown',event=>{event.preventDefault();const editor=button.closest('.rich-editor').querySelector('.rich-input');editor.focus();if(button.dataset.richCommand==='clear')editor.innerHTML='';else document.execCommand(button.dataset.richCommand,false,null);editor.dispatchEvent(new Event('input',{bubbles:true}))}));
document.querySelector('#addProjectCustomerButton').onclick=()=>openCustomerDialog('project',document.querySelector('#addProjectCustomerButton'));
document.querySelector('#closeNewOrder').onclick=()=>closeOrderDialog();
document.querySelector('#cancelNewOrder').onclick=()=>closeOrderDialog();
document.querySelector('#addCustomerButton').onclick=()=>openCustomerDialog('order',document.querySelector('#addCustomerButton'));
document.querySelector('#closeNewCustomer').onclick=()=>closeCustomerDialog();
document.querySelector('#cancelNewCustomer').onclick=()=>closeCustomerDialog();
newOrderDialog.addEventListener('click',event=>{if(event.target===newOrderDialog)closeOrderDialog()});
newOrderDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeOrderDialog()}});
newCustomerDialog.addEventListener('click',event=>{if(event.target===newCustomerDialog)closeCustomerDialog()});
newCustomerDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeCustomerDialog()}});
function bindReferenceUpload(drop,input,fileList){drop.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();input.click()}});input.addEventListener('change',()=>{const files=Array.from(input.files||[]);if(files.length>6){input.value='';fileList.textContent='';showToast('参考资料最多上传 6 个文件','error');return}const oversized=files.find(file=>file.size>60*1024*1024);if(oversized){input.value='';fileList.textContent='';showToast(`文件「${oversized.name}」超过 60M`,'error');return}fileList.textContent=files.length?`已选择 ${files.length} 个文件：${files.map(file=>file.name).join('、')}`:''})}
bindReferenceUpload(document.querySelector('#orderReferenceDrop'),newOrderReference,orderFileList);
bindReferenceUpload(document.querySelector('#projectOrderReferenceDrop'),projectOrderReference,projectOrderFileList);
function ensureCustomerOption(select,name){let option=Array.from(select.options).find(item=>item.textContent===name);if(!option){option=document.createElement('option');option.value=`customer-${Date.now()}-${select.id}`;option.textContent=name;select.append(option)}return option}
newCustomerForm.onsubmit=event=>{
  event.preventDefault();
  const name=newCustomerName.value.trim();
  if(!name)return requireOrderControl(newCustomerName,'请输入客户名称');
  if(!newCustomerCompany.value.trim())return requireOrderControl(newCustomerCompany,'请输入公司名称');
  if(!newCustomerType.value)return requireOrderControl(newCustomerType,'请选择客户类型');
  if(!newCustomerBusinessLine.value.trim())return requireOrderControl(newCustomerBusinessLine,'请输入客户业务线');
  const demands=Array.from(newCustomerForm.querySelectorAll('[name="customerDemand"]:checked')).map(item=>item.value);
  if(!demands.length){newCustomerForm.querySelector('[name="customerDemand"]').focus({preventScroll:true});showToast('请至少选择一项制作需求','error');return}
  if(!newCustomerContact.value)return requireOrderControl(newCustomerContact,'请选择对接人');
  if(!newCustomerProgressStatus.value)return requireOrderControl(newCustomerProgressStatus,'请选择推进状态');
  if(!newCustomerPriority.value)return requireOrderControl(newCustomerPriority,'请选择推进优先级');
  const editingCustomer=editingCustomerCode?businessCustomers.find(item=>item.code===editingCustomerCode):null;
  const duplicateCustomer=businessCustomers.find(item=>item.name===name&&item.code!==editingCustomerCode);
  if(duplicateCustomer){showToast('该客户已存在','error');newCustomerName.focus();return}
  const payload={name,company:newCustomerCompany.value.trim(),type:newCustomerType.value,businessLine:newCustomerBusinessLine.value.trim(),demands,contact:newCustomerContact.value,priority:newCustomerPriority.value,progressNotes:document.querySelector('#newCustomerProgressNotes').value.trim(),communication:document.querySelector('#newCustomerCommunication').value.trim(),status:newCustomerProgressStatus.value};
  if(editingCustomer){
    const previousName=editingCustomer.name;
    Object.assign(editingCustomer,payload);
    [newOrderCustomer,projectCustomer].forEach(select=>{const option=Array.from(select.options).find(item=>item.textContent===previousName);if(option)option.textContent=name;else ensureCustomerOption(select,name)});
    businessOrders.forEach(order=>{if(order.customer===previousName)order.customer=name});
    renderBusiness();
    closeCustomerDialog(false);
    showToast(`客户「${name}」信息已更新`);
    return;
  }
  const orderOption=ensureCustomerOption(newOrderCustomer,name);
  const projectOption=ensureCustomerOption(projectCustomer,name);
  if(customerDialogSource==='order')newOrderCustomer.value=orderOption.value;
  if(customerDialogSource==='project'){projectCustomer.value=projectOption.value;projectCustomer.closest('.project-field').classList.remove('is-invalid')}
  businessCustomers.unshift({...payload,orders:0,projects:0,last:'刚刚',code:generateCustomerCode(newCustomerType.value),enabled:true});
  renderBusiness();
  const fromBusiness=customerDialogSource==='business';
  closeCustomerDialog();
  showToast(fromBusiness?'客户已新增':'客户已新增并选中');
};
newOrderForm.onsubmit=event=>{event.preventDefault();if(!requireOrderControl(newOrderCustomer,'请选择客户名称'))return;if(!requireOrderControl(newOrderName,'请输入订单名称'))return;if(!requireOrderControl(document.querySelector('#newOrderOwner'),'请选择负责人'))return;if(!requireOrderControl(document.querySelector('#newOrderProductionType'),'请选择生产类型'))return;if(!requireOrderControl(document.querySelector('#newOrderNature'),'请选择订单性质'))return;if(!requireOrderControl(document.querySelector('#newOrderCycle'),'请选择生产周期'))return;const name=newOrderName.value.trim();if(businessOrders.some(item=>item.name===name)){showToast('该订单名称已存在','error');newOrderName.focus({preventScroll:true});return}const owner=document.querySelector('#newOrderOwner');const productionType=document.querySelector('#newOrderProductionType');const nature=document.querySelector('#newOrderNature');const cycle=document.querySelector('#newOrderCycle');businessOrders.unshift({id:`ORD-202609-${String(businessOrders.length+29).padStart(3,'0')}`,name,customer:newOrderCustomer.options[newOrderCustomer.selectedIndex].text,owner:owner.options[owner.selectedIndex].text,nature:nature.value,productionType:productionType.value,cycle:cycle.value,projects:0,status:'进行中',created:'2026-09-04',notes:document.querySelector('#newOrderNotes').value.trim(),references:Array.from(newOrderReference.files||[]).map(file=>file.name)});renderBusiness();closeOrderDialog();showToast('订单已新增')};
document.querySelector('#backProjectList').onclick=()=>switchPage('projects',document.querySelector('.nav-item[data-page="projects"]'));
document.querySelector('#cancelProjectCreate').onclick=()=>switchPage('projects',document.querySelector('.nav-item[data-page="projects"]'));
projectCreateForm.onsubmit=event=>{
  event.preventDefault();
  const owner=document.querySelector('#projectOwner');
  const orderProductionType=document.querySelector('#projectOrderProductionType');
  const orderNature=document.querySelector('#projectOrderNature');
  const orderCycle=document.querySelector('#projectOrderCycle');
  const quantity=document.querySelector('#projectQuantity');
  const batchLength=Array.from(projectBatchName.value.trim()).length;
  const orderName=projectOrderName.value.trim();
  if(!projectCustomer.value)return invalidateProjectField(projectCustomer,'请选择客户名称');
  if(!orderName)return invalidateProjectField(projectOrderName,'请输入订单名称');
  if(businessOrders.some(item=>item.name===orderName))return invalidateProjectField(projectOrderName,'该订单名称已存在');
  if(!owner.value)return invalidateProjectField(owner,'请选择负责人');
  if(!orderProductionType.value)return invalidateProjectField(orderProductionType,'请选择订单生产类型');
  if(!orderNature.value)return invalidateProjectField(orderNature,'请选择订单性质');
  if(!orderCycle.value)return invalidateProjectField(orderCycle,'请选择生产周期');
  if(!batchLength)return invalidateProjectField(projectBatchName,'请输入生产名称');
  if(batchLength>50)return invalidateProjectField(projectBatchName,'生产名称不能超过 50 个字符');
  if(!quantity.value||Number(quantity.value)<1)return invalidateProjectField(quantity,'生产数量必须大于 0');
  if(!projectWorkflowSelect.value)return invalidateProjectField(projectWorkflowSelect,'请选择已发布工作流');
  const workflow=workflowData.find(item=>item.id===projectWorkflowSelect.value);
  const productionType=document.querySelector('#projectProductionType').value;
  const productionMethod=document.querySelector('#projectProductionMethod').value;
  const title=projectBatchName.value.trim();
  const orderId=`ORD-202609-${String(businessOrders.length+29).padStart(3,'0')}`;
  const customerName=projectCustomer.options[projectCustomer.selectedIndex].text;
  const ownerName=owner.options[owner.selectedIndex].text;
  const deliveryCycle=document.querySelector('#projectDeliveryCycle').value.trim();
  const orderNotes=document.querySelector('#projectOrderNotes').value.trim();
  businessOrders.unshift({id:orderId,name:orderName,customer:customerName,owner:ownerName,nature:orderNature.value,productionType:orderProductionType.value,cycle:orderCycle.value,projects:1,status:'进行中',created:'2026-09-04',notes:orderNotes,references:Array.from(projectOrderReference.files||[]).map(file=>file.name)});
  const matchedCustomer=businessCustomers.find(item=>item.name===customerName);
  if(matchedCustomer){matchedCustomer.orders+=1;matchedCustomer.projects+=1;matchedCustomer.last='刚刚'}
  const description=document.querySelector('#projectProductionRequirement').textContent.trim()||`${orderName} · ${quantity.value} 份 · ${productionMethod}`;
  const initialBatch={id:generateBatchId(),name:title,quantity:Number(quantity.value),completed:0,owner:ownerName,workflowId:workflow.id,workflowName:workflow.name,workflowVersion:workflow.version,start:localDateValue(new Date()),delivery:deliveryCycle||'待排期',priority:productionMethod==='加急制作'?'高':'普通',status:'待开始',progress:0,notes:orderNotes};
  projectData.unshift({id:`project-${Date.now()}`,title,desc:description,type:productionType,progress:0,date:'刚刚',color:'linear-gradient(135deg,#5c3bd1,#b64f88)',members:['H'],scope:'owned',risk:false,batches:[initialBatch],orderId,quantity:Number(quantity.value),productionMethod,workflowId:workflow.id,deliveryCycle,requirements:{production:document.querySelector('#projectProductionRequirement').innerHTML,customer:document.querySelector('#projectCustomerRequirement').innerHTML,automation:document.querySelector('#projectCustomerAutomation').innerHTML,notes:document.querySelector('#projectNotes').innerHTML}});
  renderBusiness();
  setProjectFilter('all');
  switchPage('projects',document.querySelector('.nav-item[data-page="projects"]'));
  showToast(`项目「${title}」创建成功`);
};
const root=document.documentElement;const saved=localStorage.getItem('orchestra-theme');if(saved)root.dataset.theme=saved;
document.querySelector('#themeToggle').onclick=()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';localStorage.setItem('orchestra-theme',root.dataset.theme)};
document.querySelector('#sidebarToggle').onclick=()=>document.body.classList.toggle('collapsed');
document.querySelector('#mobileMenu').onclick=()=>document.querySelector('#sidebar').classList.toggle('open');
let canvasReturnPage='projects';
function getCanvasReturnPage(){return canvasReturnPage}
function setProfileIsolation(active){document.querySelectorAll('body > .sidebar,body > .topbar,body > .player,.page-view:not(#profilePage)').forEach(element=>{if(active)element.setAttribute('inert','');else element.removeAttribute('inert')})}
function switchPage(page,item){const pages={home:'#homePage',projects:'#projectsPage','project-detail':'#projectDetailPage',business:'#businessPage','project-create':'#projectCreatePage',workflows:'#workflowsPage',canvas:'#canvasPage',profile:'#profilePage'};const currentPage=document.querySelector('.page-view.active')?.id;if(page==='canvas'&&currentPage!=='profilePage'){canvasReturnPage=currentPage==='workflowsPage'?'workflows':'projects';document.querySelector('#canvasBreadcrumb').textContent=canvasReturnPage==='workflows'?'创作集合 / 节点编排':'项目管理 / 节点编排'}document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));const projectChild=['business','project-create','project-detail'].includes(page);const navItem=item||document.querySelector(`.nav-item[data-page="${page}"]`)||(projectChild?document.querySelector('.nav-item[data-page="projects"]'):null);navItem?.classList.add('active');document.querySelectorAll('.page-view').forEach(x=>x.classList.remove('active'));document.querySelector(pages[page]||pages.home).classList.add('active');document.body.classList.toggle('project-mode',page==='projects');document.body.classList.toggle('project-detail-mode',page==='project-detail');document.body.classList.toggle('business-mode',page==='business');document.body.classList.toggle('project-create-mode',page==='project-create');document.body.classList.toggle('workflow-mode',page==='workflows');document.body.classList.toggle('canvas-mode',page==='canvas');document.body.classList.toggle('profile-mode',page==='profile');setProfileIsolation(page==='profile');document.querySelector('#avatarButton').classList.toggle('active',page==='profile');document.querySelector('#sidebar').classList.remove('open');window.scrollTo(0,0)}
function openPrimaryCanvas(item){window.orchestraWorkflowCanvas?.open({id:'primary',name:'未命名音乐工作流'});switchPage('canvas',item)}
nav.addEventListener('click',e=>{const item=e.target.closest('.nav-item[data-page]');if(!item)return;if(item.dataset.page==='canvas')openPrimaryCanvas(item);else switchPage(item.dataset.page,item)});
document.querySelector('#projectSearch').addEventListener('input',renderProjects);
document.querySelector('#projectSort').addEventListener('change',renderProjects);
projectFilterTabs.forEach(tab=>tab.addEventListener('click',()=>setProjectFilter(tab.dataset.projectFilter)));
projectGrid.addEventListener('click',event=>{const card=event.target.closest('[data-project-open]');if(card)openProjectDetail(card.dataset.projectOpen)});
projectGrid.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key))return;const card=event.target.closest('[data-project-open]');if(!card)return;event.preventDefault();openProjectDetail(card.dataset.projectOpen)});
projectDetailTabs.forEach(tab=>tab.addEventListener('click',()=>setProjectDetailTab(tab.dataset.projectDetailTab)));
document.querySelector('.project-detail-tabs').addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||!event.target.closest('[data-project-detail-tab]'))return;event.preventDefault();const current=Math.max(0,projectDetailTabs.indexOf(document.activeElement));let next=current;if(event.key==='ArrowRight')next=(current+1)%projectDetailTabs.length;if(event.key==='ArrowLeft')next=(current-1+projectDetailTabs.length)%projectDetailTabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=projectDetailTabs.length-1;setProjectDetailTab(projectDetailTabs[next].dataset.projectDetailTab,true)});
document.querySelector('#backProjectDetails').onclick=()=>switchPage('projects',document.querySelector('.nav-item[data-page="projects"]'));
projectCustomerManagement.onclick=()=>switchPage('business',document.querySelector('.nav-item[data-page="projects"]'));
document.querySelector('#newProject').onclick=openProjectCreatePage;
document.querySelector('#startProject').onclick=()=>openPrimaryCanvas();
document.querySelector('#workflowSearch').addEventListener('input',renderWorkflows);
document.querySelector('#newWorkflow').onclick=()=>{const item={id:`workflow-${Date.now()}`,name:'未命名音乐工作流',description:'新建工作流草稿',creator:'qiyin',draft:'已保存',draftTime:'刚刚',publish:'未发布',publishTime:'尚未发布',publishClass:'review',version:'V1.0',updated:'刚刚',editable:true};workflowData.unshift(item);renderWorkflows();enterWorkflowCanvas(item.id)};
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
      {name:'Orchestra 主题专辑',detail:'全部项目 · 12 个待处理任务',status:'进行中',tone:'green'},
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

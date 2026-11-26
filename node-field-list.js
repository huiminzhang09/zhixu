(() => {
  const records=window.ORCHESTRA_NODE_FIELD_LIST||[];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nav=document.querySelector('#primaryNav'),main=document.querySelector('main');
  if(!nav||!main)return;
  const page=document.createElement('section');
  page.id='nodeFieldListPage';page.className='page-view node-field-list-page';page.setAttribute('aria-label','节点信息');
  page.innerHTML=`<header class="nfl-header"><div><span class="nfl-eyebrow">SYSTEM CONFIGURATION</span><h1>节点信息</h1><p>按节点查找字段配置，查看字段类型、控件和说明。</p></div></header>
    <div class="nfl-toolbar"><label class="nfl-search"><span aria-hidden="true">⌕</span><input type="search" data-nfl-search placeholder="搜索字段名称、标识或说明" aria-label="搜索字段名称、标识或说明"></label><label class="nfl-node-filter"><span>节点</span><select data-nfl-node aria-label="按节点筛选"><option value="">全部节点</option></select></label><span class="nfl-count" data-nfl-count></span></div>
    <div class="nfl-table-wrap"><table class="nfl-table"><thead><tr><th>节点名称</th><th>节点类型</th><th>子节点标识</th><th>字段标识</th><th>数据类型</th><th>表单名称</th><th>提示文案</th><th>占位内容</th><th>组件类型</th><th>可清空</th><th>最小值</th><th>最大值</th><th>步长</th><th>单位</th><th>默认值</th><th>展示值</th><th>选项值</th></tr></thead><tbody data-nfl-rows></tbody></table><div class="nfl-empty" data-nfl-empty hidden>没有匹配的字段信息</div></div>`;
  main.append(page);
  const item=document.createElement('button');item.type='button';item.className='nav-item';item.dataset.nodeFieldList='';item.setAttribute('aria-label','节点信息');item.innerHTML='<span class="icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h8l4 4V20H6z"/><path d="M14 3.5V8h4M9 12h6M9 15.5h6"/></svg></span><span class="nav-label-full">节点信息</span><span class="nav-label-short">节点</span>';
  nav.append(item);
  const $=(s,root=page)=>root.querySelector(s);
  const columns=[['节点名称','节点名称'],['节点类型','type'],['子节点标识','key（子节点）'],['字段标识','字段名'],['数据类型','类型'],['表单名称','表单名称'],['提示文案','tips'],['占位内容','placeholder'],['组件类型','组件类型'],['可清空','allowClear'],['最小值','min（最小值）'],['最大值','max（最大值）'],['步长','step（步长）'],['单位','单位'],['默认值','默认值（原值）'],['展示值','展示值'],['选项值','控件选项值']];
  const nodes=[...new Set(records.map(row=>row['节点名称']).filter(Boolean))];
  $('[data-nfl-node]').insertAdjacentHTML('beforeend',nodes.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join(''));
  function render(){const node=$('[data-nfl-node]').value,term=$('[data-nfl-search]').value.trim().toLocaleLowerCase();const rows=records.filter(row=>(!node||row['节点名称']===node)&&(!term||Object.values(row).join(' ').toLocaleLowerCase().includes(term)));$('[data-nfl-count]').textContent=`${rows.length} 条字段信息`;$('[data-nfl-rows]').innerHTML=rows.map(row=>`<tr>${columns.map(([label,key])=>{const value=row[key]||'';return `<td title="${esc(value)}">${esc(value)||'—'}</td>`}).join('')}</tr>`).join('');$('[data-nfl-empty]').hidden=rows.length>0;$('[data-nfl-table]')?.toggleAttribute('hidden',!rows.length)}
  function activate(){document.querySelectorAll('.page-view').forEach(view=>view.classList.remove('active'));page.classList.add('active');document.body.classList.remove('task-mode','project-mode','project-detail-mode','business-mode','project-create-mode','workflow-mode','canvas-mode','profile-mode','node-field-manager-mode');document.body.classList.add('node-field-list-mode');document.querySelectorAll('.nav-item').forEach(navItem=>navItem.classList.toggle('active',navItem===item));document.querySelector('#sidebar')?.classList.remove('open');window.scrollTo(0,0)}
  nav.addEventListener('click',event=>{if(!event.target.closest('[data-node-field-list]')){document.body.classList.remove('node-field-list-mode');return}event.preventDefault();event.stopImmediatePropagation();activate()},true);
  new MutationObserver(()=>{if(!page.classList.contains('active'))document.body.classList.remove('node-field-list-mode')}).observe(page,{attributes:true,attributeFilter:['class']});
  $('[data-nfl-search]').addEventListener('input',render);$('[data-nfl-node]').addEventListener('change',render);render();
})();

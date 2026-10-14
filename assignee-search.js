/* Searchable personnel controls keep the original selects as the assignment source. */
(()=>{
 const controls=new Map();let nextId=0;
 function enhance(select){
  if(controls.has(select))return;
  const label=select.parentElement;
  if(label.tagName==='LABEL'){const container=document.createElement('div');container.className=label.className;label.replaceWith(container);while(label.firstChild)container.append(label.firstChild)}
  const wrapper=document.createElement('div');wrapper.className='assignee-search';
  const button=document.createElement('button');button.type='button';button.className='assignee-search-trigger';button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
  const panel=document.createElement('div');panel.className='assignee-search-panel';panel.hidden=true;
  const input=document.createElement('input');input.type='search';input.placeholder='输入用户名搜索';input.setAttribute('aria-label','搜索用户名');input.autocomplete='off';
  const list=document.createElement('div');list.className='assignee-search-list';list.id=`assignee-options-${++nextId}`;list.setAttribute('role','listbox');list.setAttribute('aria-label','可分配人员');button.setAttribute('aria-controls',list.id);
  const status=document.createElement('p');status.className='assignee-search-count';status.setAttribute('role','status');
  panel.append(input,list,status);wrapper.append(button,panel);select.after(wrapper);select.hidden=true;select.tabIndex=-1;
  const close=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false')};
  function sync(){button.disabled=select.disabled;button.textContent=(select.selectedOptions[0]?.textContent||'请选择负责人')+' ▾';button.setAttribute('aria-label',(select.getAttribute('aria-label')||'全部节点统一分配')+'：'+(select.selectedOptions[0]?.textContent||'请选择'));button.setAttribute('aria-invalid',select.getAttribute('aria-invalid')||'false');if(select.disabled)close()}
  function render(){
   list.replaceChildren();const keyword=input.value.trim().toLocaleLowerCase();
   const members=activeProjectWorkAssignment?.members||[];
   const options=[...select.options].filter(option=>{if(!keyword)return true;const member=members.find(m=>m.id===option.value);return member&&member.name.toLocaleLowerCase().includes(keyword)});
   options.forEach(option=>{const item=document.createElement('button');item.type='button';item.className='assignee-search-option';item.setAttribute('role','option');item.setAttribute('aria-selected',String(option.value===select.value));item.textContent=option.textContent;item.disabled=option.disabled;
    item.onclick=()=>{select.value=option.value;select.dispatchEvent(new Event('change',{bubbles:true}));controls.forEach(control=>control.sync());close();button.focus()};list.append(item)});
   status.textContent=options.length?`共 ${options.filter(o=>members.some(m=>m.id===o.value)).length} 位人员`:'未找到匹配的用户名';
  }
  button.onclick=()=>{const opening=panel.hidden;controls.forEach(control=>control.close());if(opening){input.value='';render();panel.hidden=false;button.setAttribute('aria-expanded','true');input.focus()}};
  input.addEventListener('input',render);
  wrapper.addEventListener('keydown',event=>{
   if(event.key==='Escape'&&!panel.hidden){event.preventDefault();event.stopPropagation();close();button.focus();return}
   const options=[...list.querySelectorAll('button:not(:disabled)')];
   if(!panel.hidden&&['ArrowDown','ArrowUp'].includes(event.key)&&options.length){event.preventDefault();const current=options.indexOf(document.activeElement),direction=event.key==='ArrowDown'?1:-1;options[(current+direction+options.length)%options.length].focus()}
   if(event.key==='Enter'&&event.target===input){event.preventDefault();options[0]?.focus()}
  });
  wrapper.addEventListener('focusout',()=>setTimeout(()=>{if(!wrapper.contains(document.activeElement))close()},0));
  select.focus=options=>button.focus(options);
  controls.set(select,{sync,close});sync();
 }
 const oldOpen=openProjectWorkAssignmentDialog;
 openProjectWorkAssignmentDialog=function(){
  controls.forEach((control,select)=>{control.close();if(!select.isConnected)controls.delete(select)});
  oldOpen();if(!activeProjectWorkAssignment)return;
  [projectWorkAssignmentAllMember,...projectWorkAssignmentNodeList.querySelectorAll('[data-node-assignee]')].forEach(enhance);
  controls.forEach(control=>control.sync());
 };
 const oldProgress=updateProjectWorkAssignmentProgress;
 updateProjectWorkAssignmentProgress=function(){oldProgress();controls.forEach(control=>control.sync())};
 document.addEventListener('pointerdown',event=>{if(!event.target.closest('.assignee-search'))controls.forEach(control=>control.close())});
})();

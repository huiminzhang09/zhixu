// A binding identifies a published template version, so later drafts do not alter the preview.
(()=>{
  const key='orchestra-home-templates-v1';
  const items=[...document.querySelectorAll('#musicGrid .card,#createTools .tool')].map(el=>{
    const card=el.matches('.card'),label=el.querySelector(card?'h3':'b'),button=card?el.querySelector('[data-showcase-workflow]'):el;
    const index=card?Number(el.dataset.index):Array.from(el.parentElement.children).indexOf(el);
    const id=(card?'work-':'shortcut-')+index;
    const workflow=button.dataset.showcaseWorkflow||showcaseWorkflowIds[index%showcaseWorkflowIds.length];
    return {el,label,button,id,workflow,title:label.textContent,card,index};
  });
  function read(){return JSON.parse(localStorage.getItem(key)||'{}');}
  function display(){
    const settings=read();
    for(const item of items){
      const binding=settings[item.id]||{},title=binding.title||item.title;
      item.el.hidden=binding.visible===false;
      item.label.textContent=title;
      item.button.dataset.showcaseWorkflow=binding.workflow||item.workflow;
      item.button.dataset.version=binding.version||'';
      item.button.setAttribute('aria-label','查看「'+title+'」的创作流程');
      if(item.card){titles[item.index]=title;item.el.querySelector('img').alt=title+' 封面';item.el.querySelector('.hover-play').setAttribute('aria-label','播放 '+title);}
      else delete item.button.dataset.toast;
    }
  }
  document.querySelector('#createTools').addEventListener('click',event=>{
    const button=event.target.closest('[data-showcase-workflow]');
    if(button)openShowcaseWorkflow(button.dataset.showcaseWorkflow,button.dataset.version);
  });
  document.querySelector('#homeTemplateSettings').onclick=()=>{
    const dialog=document.createElement('dialog');dialog.className='library-form';
    dialog.innerHTML='<form><h3>首页展示设置</h3><label>作品或快捷入口<select name="entry"></select></label><label>展示名称<input name="title" maxlength="50" required></label><label>关联模板工作流<select name="workflow" required></select></label><label><span><input type="checkbox" name="visible"> 在首页展示</span></label><footer><button type="button">取消</button><button>保存</button></footer></form>';
    const form=dialog.querySelector('form'),f=form.elements;
    for(const item of items)f.entry.add(new Option((item.card?'作品 · ':'快捷入口 · ')+item.label.textContent,item.id));
    const available=workflowData.filter(w=>window.orchestraWorkflowCanvas.getPublishedSnapshot(w.id,w.version));
    for(const w of available)f.workflow.add(new Option(w.name+' '+w.version,w.id));
    function load(){const item=items.find(i=>i.id===f.entry.value);f.namedItem('title').value=item.label.textContent;f.workflow.value=item.button.dataset.showcaseWorkflow;f.visible.checked=!item.el.hidden;}
    load();f.entry.onchange=load;
    form.onsubmit=event=>{event.preventDefault();const w=available.find(w=>w.id===f.workflow.value),title=f.namedItem('title').value.trim();if(!w||!title)return showToast('请填写名称并选择已发布的模板','error');try{const config=read();config[f.entry.value]={title,visible:f.visible.checked,workflow:w.id,version:w.version};localStorage.setItem(key,JSON.stringify(config));display();dialog.close();showToast('首页展示已更新');}catch{showToast('保存失败，请重试','error');}};
    dialog.querySelector('[type=button]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();document.body.append(dialog);dialog.showModal();
  };
  display();
})();

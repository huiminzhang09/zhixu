/* Pagination is scoped to the production run list, including its selection controls. */
(()=>{
 let page=1,size=10,scope='';
 const allFiltered=visibleProjectWorks;
 const pager=document.createElement('nav');pager.className='run-pagination';pager.setAttribute('aria-label','生产运行分页');
 pager.innerHTML=`<span data-total aria-live="polite"></span><label>每页 <select aria-label="每页运行条数">${[10,20,30,40,50].map(n=>`<option value="${n}">${n} 条</option>`).join('')}</select></label><div class="run-page-buttons"><button type="button" data-prev>上一页</button><span data-pages aria-live="polite"></span><button type="button" data-next>下一页</button></div><form><label>跳至 <input type="number" min="1" step="1" value="1" aria-label="跳转页码" required> 页</label><button type="submit">跳转</button></form>`;
 document.querySelector('#projectWorksPanel').append(pager);
 function items(project){
  const key=JSON.stringify([project.id,currentProjectWorksPlan]);if(key!==scope){scope=key;page=1}
  const all=allFiltered(project);page=Math.min(page,Math.max(1,Math.ceil(all.length/size)));return all;
 }
 visibleProjectWorks=function(project){const all=items(project);return all.slice((page-1)*size,page*size)};
 const previousRender=renderProjectWorks;
 renderProjectWorks=function(project){
  previousRender(project);const all=items(project),pages=Math.max(1,Math.ceil(all.length/size));
  projectWorksResultCount.textContent=`${all.length} 个运行`;
  pager.querySelector('[data-total]').textContent=`共 ${all.length} 条`;
  pager.querySelector('[data-pages]').textContent=`第 ${page} / ${pages} 页`;
  pager.querySelector('[data-prev]').disabled=page===1;
  pager.querySelector('[data-next]').disabled=page===pages;
  const input=pager.querySelector('input');input.max=pages;input.value=page;input.disabled=!all.length;input.setCustomValidity('');
  pager.querySelector('[type=submit]').disabled=!all.length;
 };
 syncProjectWorkSelectionUI=function(works){
  const eligible=works.filter(run=>!modelDone(run)&&run.status!=='已终止'),selected=eligible.filter(run=>selectedProjectWorkIds.has(String(run.id))).length;
  projectWorksBulkbar.hidden=selectedProjectWorkIds.size===0;
  projectWorksSelectedCount.textContent=`已选择 ${selectedProjectWorkIds.size} 个运行`;
  const all=eligible.length>0&&selected===eligible.length;
  [projectWorksGrid.querySelector('[data-work-select-all]'),projectWorksSelectAllMobile].filter(Boolean).forEach(control=>{control.checked=all;control.indeterminate=selected>0&&!all;control.disabled=!eligible.length;control.setAttribute('aria-label','全选本页未完成运行')});
 };
 setVisibleProjectWorksSelection=function(checked){const project=modelProject();if(!project)return;visibleProjectWorks(project).filter(run=>!modelDone(run)&&run.status!=='已终止').forEach(run=>{const id=String(run.id);if(checked)selectedProjectWorkIds.add(id);else selectedProjectWorkIds.delete(id)});renderProjectWorks(project)};
 const refresh=()=>{selectedProjectWorkIds.clear();const project=modelProject();if(project)renderProjectWorks(project)};
 pager.querySelector('select').onchange=event=>{size=Number(event.target.value);page=1;refresh()};
 pager.querySelector('[data-prev]').onclick=()=>{if(page>1){page--;refresh()}};
 pager.querySelector('[data-next]').onclick=()=>{const project=modelProject();if(project&&page<Math.ceil(items(project).length/size)){page++;refresh()}};
 const input=pager.querySelector('input');input.oninput=()=>input.setCustomValidity('');
 pager.querySelector('form').onsubmit=event=>{event.preventDefault();const value=Number(input.value);if(!Number.isInteger(value)||value<1||value>Number(input.max)){input.setCustomValidity(`请输入 1 至 ${input.max} 的整数页码。`);input.reportValidity();return}page=value;refresh()};
 const mobileLabel=projectWorksSelectAllMobile.nextElementSibling;if(mobileLabel)mobileLabel.textContent='全选本页运行';
 const project=modelProject();if(project)renderProjectWorks(project);
})();

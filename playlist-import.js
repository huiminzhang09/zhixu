// Only same-origin application endpoints. Third-party parsing belongs on the server.
function parsePlaylistIds(text){
  const ids=text.trim().split(/[\s,，;；]+/).filter(Boolean);
  if(!ids.length||ids.some(id=>!/^\d+$/.test(id)))throw Error('请根据要求填写信息');
  return [...new Set(ids)];
}
function validatePlaylistSongs(songs){
  const accepted=[],filtered=[],invalid=[];
  songs.forEach((song,index)=>{
    const entry={...song,title:String(song.title||'').trim(),content:String(song.content||'').trim(),style:String(song.style||'').trim()};
    if(!entry.content||!/[\u3400-\u9fff]/.test(entry.content)){filtered.push({index,title:entry.title,reason:!entry.content?'歌词为空':'歌词不含汉字'});return}
    const missing=[!entry.title&&'歌名',!entry.style&&'风格',!entry.referenceId&&'对标 ID'].filter(Boolean);
    if(missing.length)invalid.push({index,title:entry.title,reason:`缺少${missing.join('、')}`});
    accepted.push(entry);
  });
  return {accepted,filtered,invalid};
}
async function playlistApi(action,payload,signal){
  let response;
  const controller=new AbortController(),cancel=()=>controller.abort();
  signal?.addEventListener('abort',cancel,{once:true});
  const timer=setTimeout(cancel,30000);
  try{response=await fetch(`/api/reference-playlists/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal})}catch(error){if(signal?.aborted)throw error;throw Error(controller.signal.aborted?'请求超时，请重试以确认最新结果':'批量导入失败，请稍后重试')}finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel)}
  if(response.status===403)throw Error('暂无批量导入权限');
  if([404,405,501].includes(response.status)||!response.headers.get('content-type')?.includes('application/json'))throw Error('歌单导入后端接口尚未接入，请联系管理员配置后重试');
  const result=await response.json();if(!response.ok||result.error)throw Error(result.message||'批量导入失败，请稍后重试');return result;
}
function openPlaylistImportDialog(){
  const dialog=document.createElement('dialog');dialog.className='playlist-import-dialog';
  const teamId=document.querySelector('.workspace-option.active')?.dataset.workspaceId||'orchestra-studio';
  let results=[],selectedId='',busy=false,aborter=null;
  dialog.innerHTML=`<header><div><span class="playlist-kicker">QQ MUSIC · IMPORT</span><h2>批量导入歌单</h2><p>解析 QQ 音乐歌单，预览并确认入库。</p></div><button type="button" class="playlist-close" aria-label="关闭">×</button></header><div class="playlist-message" role="alert" hidden></div><section class="playlist-query"><label for="playlistIds">QQ 音乐歌单 ID <em>*</em></label><textarea id="playlistIds" placeholder="输入纯数字歌单 ID，多个 ID 用换行、空格或逗号分隔"></textarea><div><small>仅支持 QQ 音乐歌单，不支持链接、文件或表格导入。</small><button type="button" data-query class="playlist-primary">查询歌单</button></div></section><section class="playlist-confirm" hidden><p>目前有解析好的数据未导入，是否要放弃并进行新数据解析？</p><button type="button" data-keep>保留当前结果</button><button type="button" data-discard class="playlist-primary">放弃并解析</button></section><div class="playlist-workspace"><aside><div class="playlist-section-heading"><b>歌单解析结果</b><button type="button" data-retry hidden>重新重试失败项</button></div><div data-playlists></div></aside><section class="playlist-song-pane" data-songs></section></div><footer>歌曲及歌词允许重复导入 · 空歌词和不含汉字的歌词会被过滤</footer>`;
  const field=dialog.querySelector('#playlistIds'),message=dialog.querySelector('.playlist-message');
  function notify(text,error=true){message.hidden=false;message.textContent=text;message.classList.toggle('success',!error)}
  function paint(){
    dialog.querySelectorAll('[data-query],[data-retry]').forEach(button=>button.disabled=busy);
    dialog.querySelector('[data-retry]').hidden=!results.some(item=>item.status==='failed');
    dialog.querySelector('[data-playlists]').innerHTML=results.map(item=>`<button type="button" class="playlist-card ${selectedId===item.id?'selected':''}" data-playlist="${item.id}" ${busy?'disabled':''}><b>歌单 ${item.id}</b><span class="${item.status==='failed'?'failure':''}">${item.status==='loading'?'解析中…':item.status==='failed'?'解析失败':'已解析'}</span><small>${item.songs?.length||0} 首歌曲 · ${escapeHtml(item.time||'等待结果')}</small></button>`).join('')||'<div class="playlist-empty">输入歌单 ID 后，解析结果将在这里展示</div>';
    const item=results.find(row=>row.id===selectedId),pane=dialog.querySelector('[data-songs]');
    if(!item||item.status!=='parsed'){pane.innerHTML=`<div class="playlist-empty"><h3>${item?.status==='failed'?'解析失败':item?.status==='loading'?'正在解析歌单':'歌曲预览'}</h3><p>${escapeHtml(item?.error||'选择已解析的歌单查看歌曲信息')}</p></div>`;return}
    const check=validatePlaylistSongs(item.songs);item.check=check;
    pane.innerHTML=`<div class="playlist-section-heading"><div><b>歌单 ${item.id}</b><small>可展示 ${check.accepted.length} 首 · 已过滤 ${check.filtered.length} 首 · 校验失败 ${check.invalid.length} 首</small></div><button type="button" data-import class="playlist-primary" ${busy||!check.accepted.length||check.invalid.length?'disabled':''}>${busy?'处理中…':'导入该歌单'}</button></div>${check.filtered.length||check.invalid.length?`<details class="playlist-validation"><summary>查看过滤与校验原因</summary>${[...check.filtered,...check.invalid].map(row=>`<p>第 ${row.index+1} 首 ${escapeHtml(row.title||'未命名')}：${escapeHtml(row.reason)}</p>`).join('')}</details>`:''}<div class="playlist-song-table"><table><thead><tr><th>歌名</th><th>歌手</th><th>歌词</th><th>风格</th></tr></thead><tbody>${check.accepted.map(song=>`<tr><td>${escapeHtml(song.title||'缺少歌名')}</td><td>${escapeHtml(song.singer||'—')}</td><td><details><summary title="${escapeHtml(song.content)}">${escapeHtml(song.content.slice(0,35))}…</summary><p>${escapeHtml(song.content)}</p></details></td><td>${escapeHtml(song.style||'缺少风格')}</td></tr>`).join('')||'<tr><td colspan="4">暂无符合要求的歌曲</td></tr>'}</tbody></table></div>`;
  }
  async function query(ids,retry=false){
    busy=true;message.hidden=true;aborter=new AbortController();
    if(!retry)results=ids.map(id=>({id,status:'loading'}));else results.forEach(item=>{if(ids.includes(item.id))item.status='loading'});
    selectedId=ids[0];paint();
    try{
      const data=await playlistApi('parse',{source:'qq',teamId,playlistIds:ids},aborter.signal);
      if(!Array.isArray(data.playlists))throw Error('未获取到完整解析结果，请重试失败项');
      ids.forEach(id=>{const row=results.find(item=>item.id===id),parsed=data.playlists.find(item=>String(item.id)===id);Object.assign(row,{time:new Date().toLocaleString('zh-CN'),status:parsed?.status==='parsed'&&Array.isArray(parsed.songs)?'parsed':'failed',songs:parsed?.songs||[],parseToken:parsed?.parseToken,error:parsed?.message||'未获取到完整解析结果，请重试失败项'})});
    }catch(error){if(error.name!=='AbortError'){results.forEach(item=>{if(ids.includes(item.id))Object.assign(item,{status:'failed',error:error.message,time:new Date().toLocaleString('zh-CN')})});notify(error.message)}}
    finally{busy=false;if(dialog.open)paint()}
  }
  dialog.addEventListener('click',async event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.classList.contains('playlist-close')){if(busy){notify('当前操作处理中，请等待结果后关闭');return}dialog.close();return}
    if(busy)return;
    if(button.hasAttribute('data-query')||button.hasAttribute('data-discard')){
      let ids;try{ids=parsePlaylistIds(field.value)}catch(error){notify(error.message);field.focus();return}
      if(button.hasAttribute('data-query')&&results.some(item=>item.status==='parsed')){dialog.querySelector('.playlist-confirm').hidden=false;return}
      dialog.querySelector('.playlist-confirm').hidden=true;await query(ids);return;
    }
    if(button.hasAttribute('data-keep')){dialog.querySelector('.playlist-confirm').hidden=true;return}
    if(button.hasAttribute('data-retry')){await query(results.filter(item=>item.status==='failed').map(item=>item.id),true);return}
    if(button.dataset.playlist){selectedId=button.dataset.playlist;paint();return}
    if(button.hasAttribute('data-import')){
      const item=results.find(row=>row.id===selectedId);if(!item||!item.check.accepted.length||item.check.invalid.length){notify('部分数据校验失败，请检查后重试');return}
      busy=true;message.hidden=true;paint();aborter=new AbortController();
      // Retain request ID across retries, but use a new one after re-parsing for deliberate reimports.
      item.requestId ||= crypto.randomUUID();
      try{
        const data=await playlistApi('import',{source:'qq',teamId,playlistId:item.id,parseToken:item.parseToken,requestId:item.requestId},aborter.signal);
        if(data.status!=='imported'||!Array.isArray(data.records)||data.records.length!==item.check.accepted.length||data.records.some(row=>!row.id||!row.title||!row.content||!row.style))throw Error('未获取到完整导入结果，请重试以确认结果');
        const library=readReferenceLibrary();data.records.forEach(row=>{if(!library.songs.some(song=>song.id===row.id))library.songs.unshift({...row,playlistId:item.id,disabled:false,createdAt:row.createdAt||new Date().toISOString()})});
        if(!writeReferenceLibrary(library))throw Error('服务端已导入，本地列表同步失败，请重试同步结果');
        results=results.filter(row=>row!==item);selectedId=results[0]?.id||'';renderReferenceLibrary();notify('导入对标成功',false);
      }catch(error){notify(error.message)}finally{busy=false;if(dialog.open)paint()}
    }
  });
  dialog.addEventListener('cancel',event=>event.preventDefault());
  dialog.addEventListener('close',()=>{aborter?.abort();dialog.remove()},{once:true});
  document.body.append(dialog);dialog.showModal();paint();
}

import { installPageSound } from './page-sound.js';
import { eventSource, event_types, getOneCharacter } from '/script.js';
import { extensionNames } from '/scripts/extensions.js';
import { world_names } from '/scripts/world-info.js';

function worldBookNames() {
  return Array.isArray(world_names) ? [...world_names] : [];
}

const themeExtensionId = 'third-party/' + decodeURIComponent(new URL('.', import.meta.url).pathname.split('/').filter(Boolean).pop());

// Keep the settings and chat metadata used by the earlier script.
const themeSettingsKey = 'lanjiu_lumeow_ui';
export function releaseThemeSettings() {
  const settings = window.SillyTavern?.getContext()?.extensionSettings;
  const saved = settings?.[themeSettingsKey];
  if (!saved) return;
  const disabled = new Set(settings.disabledExtensions || []);
  for (const [id, enabled] of Object.entries(saved.originalThemes || {})) {
    if (!extensionNames.includes(id)) continue;
    if (enabled) disabled.delete(id);
    else disabled.add(id);
  }
  settings.disabledExtensions = [...disabled];
  saved.enabled = false;
  saved.originalThemes = null;
}

(function (frame) {
  'use strict';
  const VERSION = '0.4.25';
  function countRounds(messages) {
    let waiting = false, count = 0;
    for (const message of Array.isArray(messages) ? messages : []) {
      if (!message || message.is_system || typeof message.mes !== 'string') continue;
      if (message.is_user) waiting = true;
      else if (waiting) { count++; waiting = false; }
    }
    return count;
  }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function chatFile(value) { return String(value || '').replace(/\.jsonl$/i, ''); }
  function archiveTitle(value) {
    return chatFile(value).replace(/(?:\s*-\s*)?(\d{4})-(\d{2})-(\d{2})@(\d{1,2})h(\d{1,2})m\d{1,2}s(?:\d+ms)?(?=$|\s|[（(])/g,(_s,y,m,d,h,n,at)=>(at?' · ':'')+y+'年'+m+'月'+d+'日 '+h.padStart(2,'0')+':'+n.padStart(2,'0'));
  }

  if (!frame) return;
  let W = frame;
  try { if (frame.parent?.SillyTavern) W = frame.parent; } catch (_) {}
  const D = W.document;

  const KEY = themeSettingsKey;
  const THEME_IDS = ['third-party/xingjian-cabin', 'third-party/forest-tavern'];
  const paths = {
    search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
    home:'<path d="m3 10 9-7 9 7v10H4V10"/><path d="M9 20v-7h6v7"/>',
    chat:'<path d="M21 11a9 9 0 0 1-9 9 10 10 0 0 1-4-.9L3 21l1.8-5A9 9 0 1 1 21 11Z"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    book:'<path d="M12 5c-4-3-9-2-9-2v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2v16"/>',
    preset:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    settings:'<path d="m10 3 4 0 1 3 3 1 3 3-2 3v4l-3 2-3-1-3 3-3-2v-3l-3-2v-4l3-2 1-3Z"/><circle cx="12" cy="12" r="3"/>',
    pin:'<path d="m8 3 8 0-1 6 4 4H5l4-4-1-6Z"/><path d="M12 13v8"/>',
    star:'<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.7l6.2-.9Z"/>',
    plus:'<path d="M12 4v16M4 12h16"/>',
    back:'<path d="m14 5-7 7 7 7"/>',
    close:'<path d="m6 6 12 12M18 6 6 18"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
    speaker:'<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    silent:'<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="m16 9 6 6m0-6-6 6"/>',
    panel:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/>',
    edit:'<path d="m14 4 6 6-11 11H3v-6L14 4ZM12 6l6 6"/>',
    link:'<path d="m8 16 8-8M9 7l2-2a5 5 0 0 1 7 7l-2 2M15 17l-2 2a5 5 0 0 1-7-7l2-2"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c6 6 6 12 0 18-6-6-6-12 0-18"/>',
    chart:'<path d="M4 3v18h17M8 16v-5m5 5V7m5 9V4"/>',
    leaf:'<path d="M20 3C9 2 1 7 5 16c9 6 15-2 15-13ZM5 19l9-10"/>',
    archive:'<rect x="4" y="7" width="16" height="14" rx="2"/><path d="M3 3h18v4H3zM9 12h6"/>',
    image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.preset}</svg>`;
  const ctx = () => W.SillyTavern?.getContext?.();
  const $ = selector => D.querySelector(selector);
  const all = selector => [...D.querySelectorAll(selector)];
  let root, portal, style, removeThemeSwitch, toolbar, toastTimer, refreshTimer, disposed = false;
  let pageSound;
  function updateSoundButton(button) {
    const muted = pageSound.muted;
    button.setAttribute('aria-pressed', String(muted));
    button.title = muted ? '恢复页面声音' : '静音整个页面';
    button.innerHTML = icon(muted ? 'silent' : 'speaker');
  }
  let backgroundScope='character';
  let route = 'home', search = '', nativeTitle = '', nativePanel = '', activeMemoryPrompt = '';
  let sessionData = new Map(), countPromises = new Map(), countQueue = Promise.resolve();
  const listeners = [], observers = [];
  const native = {
    generation:['ai-config-button','预设设置'], api:['sys-settings-button','模型连接'], format:['advanced-formatting-button','发给模型的消息格式'],
    worlds:['WI-SP-button','世界书编辑'], users:['user-settings-button','界面与阅读设置'], backgrounds:['backgrounds-button','背景管理'],
    extensions:['extensions-settings-button','扩展管理'], personas:['persona-management-button','人设面具'], characters:['right-nav-panel','角色管理'],
  };
    let readingScope='', entryFrame=null, entrySizes=null, entryPending=false, entryLast=null;
  let readingHistory=false, inputRevision=0, protectedPlace=null;

  function stopChatEntry(){
    if(entryFrame!==null)W.cancelAnimationFrame(entryFrame);
    entryFrame=null;entryPending=false;entryLast=null;
    entrySizes?.disconnect();entrySizes=null;
  }
  function interruptChatScroll(){
    stopChatEntry();
    inputRevision++;
    protectedPlace=null;
  }
  function bottomGap(chat){return chat.scrollHeight-chat.clientHeight-chat.scrollTop;}
  function readingPlace(chat){
    const top=chat.getBoundingClientRect().top;
    const first=Array.from(chat.children).find(el=>el.matches('.mes[mesid]') && el.getBoundingClientRect().bottom>top);
    return {scroll:chat.scrollTop,height:chat.scrollHeight,id:first?.getAttribute('mesid'),offset:first?first.getBoundingClientRect().top-top:0};
  }
  function restoreReadingPlace(chat,place){
    if(Math.abs(chat.scrollHeight-place.height)<=1 || place.id==null){
      chat.scrollTop=place.scroll;
      return;
    }
    const message=place.id!=null?Array.from(chat.children).find(el=>el.getAttribute('mesid')===place.id):null;
    chat.scrollTop=message?chat.scrollTop+message.getBoundingClientRect().top-chat.getBoundingClientRect().top-place.offset:place.scroll;
  }

  function syncChatReading(scope,enter=false){
    if(enter || scope!==readingScope){
      interruptChatScroll();readingScope=scope;readingHistory=false;entryPending=Boolean(scope);
    }
    if(!entryPending || entryFrame!==null)return;
    entryFrame=W.requestAnimationFrame(()=>{
      entryFrame=null;
      if(disposed || route!=='chat' || pairScope()!==scope)return;
      const chat=$('#chat');
      if(!chat)return;
      if(!entrySizes && W.ResizeObserver){
        entrySizes=new W.ResizeObserver(()=>{
          if(entryPending && readingScope===scope)syncChatReading(scope);
        });
        entrySizes.observe(chat);
      }
      const count=ctx().chat.length;
      const last=count && chat.querySelector(`:scope > .mes[mesid="${count-1}"]`);
      if(!chat.clientHeight || !count || !last){
        // A hidden transcript may already contain every row before it gets a height.
        // Resize and message events wake modern browsers without a polling loop.
        if(!entrySizes)syncChatReading(scope);
        return;
      }
      if(entrySizes && last!==entryLast){
        entrySizes.disconnect();
        entrySizes.observe(chat);
        for(const el of chat.children)if(el.matches('.mes'))entrySizes.observe(el);
      }
      entryLast=last;
      if(bottomGap(chat)>1)chat.scrollTop=chat.scrollHeight;
    });
  }
  function resumeChatReading(scope){
    interruptChatScroll();readingScope=scope;
  }
  function mountChatReading(context){
    const chat=$('#chat');
    if(!chat)return;
    const touch=()=>interruptChatScroll();
    for(const type of ['wheel','touchstart','touchmove','pointerdown'])
      on(chat,type,touch,{passive:true,capture:true});
    on(D,'keydown',e=>{
      if(route==='chat' && ['ArrowUp','ArrowDown','Home','End','PageUp','PageDown',' '].includes(e.key))touch();
    },true);
    on(chat,'scroll',()=>{
      if(route!=='chat')return;
      if(entryPending){
        if(bottomGap(chat)>1)syncChatReading(readingScope);
      }else if(!protectedPlace)readingHistory=bottomGap(chat)>2;
    },{passive:true});

    function protectReading(){
      if(route!=='chat' || !readingHistory || protectedPlace || !chat.clientHeight || bottomGap(chat)<=2)return;
      const place=readingPlace(chat), scope=readingScope;
      protectedPlace=place;
      // Native code may enqueue its own bottom jump after dispatching the render event.
      W.requestAnimationFrame(()=>W.requestAnimationFrame(()=>{
        if(protectedPlace!==place)return;
        protectedPlace=null;
        if(!disposed && route==='chat' && scope===pairScope() && bottomGap(chat)<=2)restoreReadingPlace(chat,place);
      }));
    }
    const messages=new W.MutationObserver(()=>{
      if(entryPending)syncChatReading(readingScope);
      else protectReading();
    });
    messages.observe(chat,{childList:true});
    observers.push(messages);
    for(const type of ['load','error','loadeddata'])on(chat,type,protectReading,true);
    function chatChanged(){if(route==='chat')syncChatReading(pairScope());}
    function messageChanged(){
      if(entryLast)stopChatEntry();
      else if(entryPending)syncChatReading(readingScope);
      protectReading();
    }
    for(const [name,handler] of Object.entries({CHAT_CHANGED:chatChanged,MESSAGE_SENT:messageChanged,MESSAGE_RECEIVED:messageChanged,
      CHARACTER_MESSAGE_RENDERED:protectReading,USER_MESSAGE_RENDERED:protectReading})){
      const type=context.eventTypes[name];
      if(type){context.eventSource.on(type,handler);listeners.push(()=>context.eventSource.removeListener(type,handler));}
    }
    listeners.push(()=>{interruptChatScroll();readingScope='';});
  }

    const pageTrail=[];
  const dialogParents=new WeakMap();
  let navigationRevision=0, returningPage=false, listOrder=null;
  function visibleDialog(){return portal?.querySelector('.lj-modal-backdrop');}
  function dialogName(layer){return layer?.getAttribute('aria-label') || layer?.querySelector('[role="dialog"]')?.getAttribute('aria-label') || '';}
  function pageName(){
    if(route==='workspace')return screenConfig[workspaceKey].name;
    if(route==='chat')return D.body.classList.contains('lj-details-open')?'角色'+profileTab:'聊天';
    return navItems.find(item=>item[0]===route)?.[2] || (route==='world-editor'?'世界书编辑':'预设编辑');
  }
  function pageBackButton(){
    const prev=pageTrail.at(-1);
    return prev?`<button type="button" class="lj-soft" data-action="page-back">返回${escapeHtml(prev.label)}</button>`:'';
  }
  function scrollState(){
    const state={};
    for(const selector of ['.lj-main','.lj-sidebar','.lj-profile','.lj-entry-nav','.lj-workspace-tabs']){
      const el=root?.querySelector(selector);
      if(el)state[selector]=el.scrollTop;
    }
    if(route==='recent'){
      state.expanded=[...root.querySelectorAll('[data-sessions]:not([hidden])')].map(el=>({
        avatar:ctx().characters[el.dataset.sessions]?.avatar,
        html:el.querySelector('[data-file]')?el.innerHTML:'',
      }));
    }
    return state;
  }
  function restoreScroll(state){
    for(const row of state.expanded||[]){
      const id=ctx().characters.findIndex(c=>c?.avatar===row.avatar), el=root.querySelector(`[data-sessions="${id}"]`);
      if(!el)continue;
      if(row.html){el.hidden=false;el.innerHTML=row.html;for(const item of el.querySelectorAll('[data-file]'))item.dataset.id=String(id);}
      else if(el.hidden)void toggleSessions(id);
    }
    for(const [selector,top] of Object.entries(state)){
      if(selector==='expanded')continue;
      const el=root.querySelector(selector);if(el)el.scrollTop=top;
    }
  }
  function capturePage(){
    const layer=visibleDialog(), chat=route==='chat' && $('#chat');
    return {route,search,listOrder,profileAvatar,label:dialogName(layer)||pageName(),layer,scroll:scrollState(),
      workspaceKey,workspaceTab,workspaceSearch,profileTab,details:D.body.classList.contains('lj-details-open'),
      toolOrigin,avatar:selected()?.avatar,file:ctx().chatId,
      chatPlace:chat && readingPlace(chat),chatKey:chat && pairScope(),
      world:route==='world-editor'?{worldDraft,worldName,worldUid,worldSearch,worldTab,worldDirty}:null,
      book:route==='preset-editor'?book:null};
  }
  function enterPage(page,origin=capturePage()){
    (origin?.layer || visibleDialog())?.remove();
    if(origin)pageTrail.push(origin);
    navigationRevision++;
    closeNative();route=page;search='';listOrder=null;
    D.body.classList.remove('lj-details-open');
  }
  function openPrimaryPage(page){
    if(page===route && !pageTrail.length && !visibleDialog() && !toolOrigin)return;
    pageTrail.length=0;
    toolOrigin=null;
    enterPage(page,null);
    render();
  }
  function suspendDialog(child,replace=false){
    const parent=visibleDialog();
    if(!parent)return;
    dialogParents.set(child,replace?dialogParents.get(parent):{layer:parent,focus:D.activeElement});
    parent.remove();
  }
  function closeDialog(layer=visibleDialog()){
    if(!layer)return;
    const prev=dialogParents.get(layer);
    layer.remove();
    if(prev){
      portal.append(prev.layer);
      prev.layer.dispatchEvent(new W.Event('lj-resume'));
      if(prev.focus?.isConnected)prev.focus.focus({preventScroll:true});
    }else if(route==='chat' && currentToolOrigin()){
      void returnToToolChat();
    }
  }
  async function backPage(){
    const prev=pageTrail.at(-1);
    if(!prev || returningPage)return;
    if(route==='world-editor' && worldDirty){
      if(!W.confirm('放弃尚未保存的世界书修改并返回吗？'))return;
      worldDirty=false;
    }
    returningPage=true;
    try{
      const needsCharacter=prev.route==='chat' || (prev.route==='workspace' && prev.workspaceKey==='characters');
      if(needsCharacter && prev.avatar && selected()?.avatar!==prev.avatar){
        const id=ctx().characters.findIndex(c=>c?.avatar===prev.avatar);
        if(id<0){toast('原角色已移除。');pageTrail.pop();return;}
        if(!await selectForPage(id,prev.route==='workspace'))return;
      }
      if(prev.route==='chat' && prev.file && ctx().chatId!==prev.file)await ctx().openCharacterChat(chatFile(prev.file));
      if(pageTrail.at(-1)!==prev)return;
      pageTrail.pop();navigationRevision++;closeNative();visibleDialog()?.remove();
      route=prev.route;search=prev.search;listOrder=prev.listOrder;profileAvatar=prev.profileAvatar;
      workspaceKey=prev.workspaceKey;workspaceTab=prev.workspaceTab;workspaceSearch=prev.workspaceSearch;
      profileTab=prev.profileTab;toolOrigin=prev.toolOrigin;
      if(prev.world)({worldDraft,worldName,worldUid,worldSearch,worldTab,worldDirty}=prev.world);
      if(prev.book)book=prev.book;
      D.body.classList.toggle('lj-details-open',prev.details);
      if(prev.chatPlace)resumeChatReading(prev.chatKey);
      render();restoreScroll(prev.scroll);
      if(prev.chatPlace && pairScope()===prev.chatKey){
        const chat=$('#chat');restoreReadingPlace(chat,prev.chatPlace);readingHistory=bottomGap(chat)>2;
      }
      if(prev.layer){portal.append(prev.layer);prev.layer.dispatchEvent(new W.Event('lj-resume'));}
    }finally{returningPage=false;}
  }
  async function selectForPage(id,edit){
    if(ctx().streamingProcessor){toast('请先等待当前回复完成。');return false;}
    await ctx().selectCharacterById(Number(id),{switchMenu:edit});
    if(String(ctx().characterId)===String(id))return true;
    toast('角色正在保存，请稍后再试。');return false;
  }

    let toolOrigin=null;
  function currentToolOrigin() {
    if (!toolOrigin) return null;
    if (pairScope() !== toolOrigin.chatKey) toolOrigin=null;
    return toolOrigin;
  }
  function beginChatTools() {
    const chatKey=pairScope();
    if (route==='chat' && chatKey) {
      interruptChatScroll();
      const chat=$('#chat');
      toolOrigin={chatKey,depth:pageTrail.length,place:chat?readingPlace(chat):{scroll:0}};
    }
  }
  function chatReturnButton() {
    return currentToolOrigin() ? `<button type="button" class="lj-chat-return" data-action="tool-return">${icon('back')}<span>返回聊天</span></button>` : '';
  }
  function changedToolField(field) {
    if (field.disabled || field.readOnly || field.type==='search' || field.hasAttribute('data-mask-setting')) return false;
    if (field.type==='file') return !!field.files?.length;
    if (field.type==='checkbox'||field.type==='radio') return field.checked!==field.defaultChecked;
    if (field.tagName==='SELECT') {
      const options=[...field.options], initial=options.some(o=>o.defaultSelected);
      return options.some((o,i)=>o.selected!==(o.defaultSelected||(!initial && !field.multiple && i===0)));
    }
    return field.value!==field.defaultValue;
  }
  function pendingToolEdits() {
    if (route==='world-editor' && worldDirty) return true;
    const draftSelector='.lj-modal-backdrop :is(.lj-mask-form, .lj-editor-fields, .lj-modal-content):not(.lj-mask-scroll) :is(input,textarea,select)';
    const roots=[portal];
    for(const page of pageTrail.slice(toolOrigin.depth))if(page.layer)roots.push(page.layer);
    for(let i=0;i<roots.length;i++){const layer=roots[i]===portal?visibleDialog():roots[i];const parent=layer && dialogParents.get(layer)?.layer;if(parent&&!roots.includes(parent))roots.push(parent);}
    return roots.some(root=>[...root.querySelectorAll(draftSelector)].some(field=>
      !field.closest('.lj-mask-search,.lj-mask-rows') && changedToolField(field)));
  }
  async function returnToToolChat() {
    const origin=currentToolOrigin();
    if (!origin || origin.returning) return;
    if (pendingToolEdits() && !W.confirm('有尚未保存的修改。要放弃这些修改并返回聊天吗？')) return;
    origin.returning=true;
    try {
      if (route==='world-editor' && worldDirty) {worldDraft=null;worldDirty=false;}
      portal.querySelector('.lj-modal-backdrop')?.remove();
      toolOrigin=null;
      resumeChatReading(origin.chatKey);
      pageTrail.splice(origin.depth);
      if (route!=='chat') {route='chat';navigationRevision++;render();}
      const list=$('#chat');
      if (list) {
        restoreReadingPlace(list,origin.place);
        readingHistory=bottomGap(list)>2;
        const revision=inputRevision;
        W.requestAnimationFrame(()=>{if (revision===inputRevision && route==='chat' && pairScope()===origin.chatKey && !toolOrigin) restoreReadingPlace(list,origin.place);});
      }
      toolbar?.querySelector('[data-action="toolbox"]')?.focus({preventScroll:true});
    } finally {origin.returning=false;}
  }

    // Translate interface strings only. Form values, user names and model identifiers stay verbatim.
  const labelOverrides = {
    'Rename World Info':'重命名这本世界书','Enter a new name:':'输入新名称','Enter folder name:':'输入背景文件夹名称','Enter new folder name:':'输入新的文件夹名称',
    'Create a new World Info?':'创建一本世界书','Enter a name for the new file:':'输入新世界书的名称','This action is irreversible!':'删除后无法撤销',
    'Images will not be deleted, only the folder grouping.':'只移除文件夹分组，图片保留在图库里','Apply Current Sorting':'把当前排序写入条目顺序','World/Lorebook renamed!':'世界书已重命名', 
    'Experimental new Macro Engine. Allows nested macros to be resolved correctly and has a dedicated, logical replacement order. The new engine is designed to cleanly replace the old regex-based macro system.':'使用实验性宏解析器，按固定顺序处理嵌套的占位符',
    'Determines which keys select an item from the AutoComplete suggestions':'设置用哪个按键选中自动补全建议',
    'Select backgrounds for bulk folder actions':'选择多张背景图后批量整理到文件夹','Back':'返回上一级文件夹','Add to folder':'加入文件夹',
    'Cut-off score for relevance. Helps to filter out irrelevant data.':'只取回相似度达到这个分数的内容',
    'Prioritize chunking on the preferred delimiter.':'拆分长文本时优先使用所选分隔符',
    'Query results can activate World Info entries.':'允许查找结果触发世界书条目',
    'Enable activation of World Info entries based on vector similarity.':'允许根据意思相近程度触发世界书条目',
    'Applies the regex pattern to filter text before TTS.':'朗读前先用这条规则过滤文字',
    'Edit quick reply set':'编辑这组快捷回复','Remove quick reply set':'移除这一组快捷回复','Clear':'清空',
    'Buttons':'显示快捷回复按钮','Show buttons':'显示这组快捷回复按钮','Caption':'图片描述','Quick Reply':'快捷回复','Quick Reply V2':'快捷回复','Speech Recognition (STT)':'语音识别','Horde':'分布式模型服务','Google AI Studio':'谷歌模型服务','OpenAI':'开放人工智能模型服务','Default':'默认','Auto':'自动','Disabled':'已停用','Enabled':'已启用','Download Extensions & Assets':'下载扩展和素材','Download Extensions and Assets':'下载扩展和素材','Restore Default':'恢复默认设置','Text Completion':'文本续写','Chat Completion':'聊天消息','Advanced Options':'高级选项','Image Generation Prompts':'图像提示词模板','World Info':'世界书','Data Bank':'资料库','Live2D':'二维动态立绘','Soundboard':'音效面板','Regex':'文本处理规则','TTS':'文字转语音','Assets':'扩展资源','Connection Profiles':'模型连接配置','Gallery':'相册',
    'Data Bank (Chat Attachments)':'资料库和聊天附件','Character Expressions':'角色表情','Quick Replies':'快速回复',
    'Summarize':'自动总结','Vector Storage':'按意思查找聊天和文件','Image Captioning':'图片描述','Image Generation':'图像生成',
    'Chat Translation':'聊天翻译','Token Counter':'文本用量统计','Speech Recognition':'语音识别',
    'Toggle Select All':'全选或取消全选','Restore default':'恢复这份模板的默认提示词','Summary Prompt:':'生成摘要用的提示词',
    'Summarize with:':'选择生成摘要的模型','Summarization retries per message':'每条消息总结失败后重试多少次',
    'Summarization min length (chars)':'达到多少个字符才生成摘要','How many past messages to insert as memories.':'取回多少条历史消息作为记忆',
    'Summarize chat messages before generating embeddings.':'先总结聊天消息，再建立检索索引',
    'Summarize sent chat messages before generating embeddings.':'先总结已发送的消息，再建立检索索引',
    'Verify and load the selected model.':'检查并加载所选模型','Vectorize all files in the Data Bank and current chat.':'为资料库和本聊天附件建立检索索引',
    'Purge all file vectors in the Data Bank and current chat.':'清除资料库和本聊天附件的检索索引',
    'How many last messages will be matched for relevance.':'用最近多少条消息查找相关内容',
    'How many chunks to retrieve when querying.':'每次查找取回多少段内容','Only files past this size will be vectorized.':'只为超过此大小的文件建立检索索引',
    'How many messages before the current end of the chat.':'插入到距最后一条消息多远的位置',
    'Add quick reply set':'添加要使用的快捷回复组','Rename quick reply set':'重命名本组','Create new quick reply set':'新建快捷回复组',
    'Import quick reply set':'导入快捷回复组','Export quick reply set':'导出本组','Duplicate quick reply set':'复制本组','Delete quick reply set':'删除本组',
    'Add quick reply':'在此处添加快捷回复','Add quick reply from clipboard':'从剪贴板插入快捷回复','Add quick reply from JSON file':'从文件插入快捷回复',
    'Paste quick reply from clipboard':'从剪贴板添加快捷回复','Import quick reply from file':'从文件导入快捷回复','Click to change icon':'更换此回复的图标',
    'Additional options: - large editor - context menu - auto-execution - tooltip':'编辑这条快捷回复的内容、菜单、自动执行和提示',
    'Move quick reply to other set':'移动这条回复到其他组','Copy quick reply to clipboard':'复制这条回复到剪贴板',
    'Cut quick reply to clipboard (copy and remove)':'剪切这条回复，复制后从本组移除','Export quick reply as file':'将这条回复下载为文件',
    'Remove Quick Reply --- Shift+Click to skip confirmation':'删除这条回复；按住上档键点击可跳过确认',
    'Move up':'上移','Move down':'下移','Click to set':'打开对应设置','Text-to-Speech':'文字转语音','None':'无',
    'Ignore previous instructions. Summarize the most important parts of the message. Limit yourself to 250 words or less. Your response should include nothing but the summary.':'忽略之前的指令。用不超过 250 个词概括消息中最重要的内容，只输出摘要。',
    'Token':'文本计量单位','Top P':'按累计概率筛选候选词','Top K':'最多保留的候选词数','API':'模型接口','JSON':'结构化数据文件','LLM':'大语言模型',
  };
  const localizedStrings=new Map(Object.entries(labelOverrides).map(([a,b])=>[a.toLowerCase(),b]));
  function translatedLabel(value,node,attribute=''){
    const text=tidy(value);
    if(!text||!/[a-z]{2}/i.test(text))return text;
    if(/^Delete the World\/Lorebook: ".*"\?$/.test(text))return text+'（确认删除这本世界书？）';
    if(/^Delete folder ".*"\?$/.test(text))return text+'（确认移除这个背景文件夹？）';
    if(/[\u3400-\u9fff]/.test(text)){
      return text.replace(/\b(API|LLM|TTS|Top P|Top K)\b(?![）(（])/gi,m=>localizedStrings.has(m.toLowerCase())?m+'（'+localizedStrings.get(m.toLowerCase())+'）':m);
    }
    const key=node?.getAttribute('data-i18n')?.split(';').map(x=>x.trim()).find(x=>attribute?x.startsWith('['+attribute+']'):!x.startsWith('['))?.replace(/^\[[^\]]+\]/,'');
    const cn=localizedStrings.get(text.toLowerCase())||localizedStrings.get(key?.toLowerCase());
    return cn && cn!==text ? text+'（'+cn+'）' : text;
  }
  async function loadControlLabels(){
    try{
      const read=async lang=>{const r=await W.fetch('/locales/'+lang+'.json');return r.ok?r.json():{};};
      const [cn,en]=await Promise.all([read('zh-cn'),read('en')]);
      for(const [key,value] of Object.entries(cn)){
        if(typeof value!=='string'||!/[\u3400-\u9fff]/.test(value))continue;
        for(const word of [key,en[key]])if(typeof word==='string'&&!localizedStrings.has(tidy(word).toLowerCase()))localizedStrings.set(tidy(word).toLowerCase(),value.trim());
      }
      if(!disposed && route==='workspace')refreshWorkspaceFields();
    }catch(error){console.warn('[酒馆界面] 读取本地中文词表失败',error);}
  }

    const formControl='input,select,textarea,toolcool-color-picker';
  const actionable='button,.menu_button,[role="button"],a[href],#options a,.list-group-item,.jg-button,.right_menu_button';
  function sourceButton(node,label,attrs=''){
    if(!node)return '';
    return `<button type="button" class="lj-soft" data-action="source-action" data-source="${fieldId(node)}" ${node.disabled||node.getAttribute('aria-disabled')==='true'?'disabled':''} ${attrs}>${escapeHtml(label)}</button>`;
  }
  function actionText(node){
    const explicit=fieldLabels[node.id];
    if(explicit)return translatedLabel(explicit);
    const raw=tidy(node.getAttribute('aria-label')||node.title||node.textContent||node.value);
    return translatedLabel(raw,node,node.title===raw?'title':'');
  }
  function detailsGroup(node,label,body,open=false){
    if(!node||!body)return '';
    return `<details class="lj-control-group" data-group="${fieldId(node)}" ${open||workspaceSearch?'open':''}><summary>${escapeHtml(label)}</summary><div class="lj-control-body">${body}</div></details>`;
  }
  function groupSection(label,body){
    return body?`<section class="lj-control-section">${label?`<h3>${escapeHtml(label)}</h3>`:''}${body}</section>`:'';
  }
  function sourceHidden(node){
    if(node.matches('select.select2-hidden-accessible'))return node.hidden;
    if(node.hidden||node.matches('.template_element,template,#hidden-divs,.select2-container,.displayNone,[aria-hidden="true"],input[type=hidden]'))return true;
    if(node.matches('.inline-drawer-content,.drawer-content'))return false;
    return W.getComputedStyle(node).display==='none';
  }
  function structuredControls(container,{includeActions=true,exclude=[]}={}){
    if(!container)return '';
    const term=(route==='workspace'?workspaceSearch:'').toLowerCase(), wanted=text=>!term||String(text).toLowerCase().includes(term);
    function read(node){
      if(node.nodeType!==1 || exclude.includes(node.id)||sourceHidden(node))return '';
      if(node.id==='favorite_button' || node.id==='group_favorite_button')return '';
      if(workspaceKey==='generation' && node.matches('[data-preset-manager-for],[data-preset-manager-action],.completion_prompt_manager_list,#completion_prompt_manager'))return '';
      if(node.matches('script,style,svg,option,.drag-handle,.drag-grabber,.drawer-icon,.inline-drawer-icon,.inline-drawer-header,.editor_maximize'))return '';
      if(node.matches('input[type=submit],input[type=button],input[type=reset],input[type=image]')){
        const label=fieldLabels[node.id]||translatedLabel(node.value||node.alt||node.title,node,'value');
        return includeActions&&label&&wanted(label)?sourceButton(node,label):'';
      }
      if(node.matches('[data-type="script"][data-script-id]')){
        const name=tidy(node.querySelector(':scope > .grow')?.textContent)||'未命名脚本';
        const toggle=node.querySelector('.fa-toggle-on,.fa-toggle-off')?.parentElement;
        const open=toggle?.querySelector('.fa-toggle-on');
        const buttons=[...node.querySelectorAll('.menu_button')].filter(el=>!sourceHidden(el));
        if(!wanted(name)&&!buttons.some(el=>wanted(actionText(el))))return '';
        const actions=buttons.map(el=>sourceButton(el,actionText(el))).join('');
        return `<article class="lj-control-card"><div class="lj-rule-head"><strong>${escapeHtml(name)}</strong>${sourceButton(toggle,open?'已启用 · 停用脚本':'已停用 · 启用脚本',`aria-pressed="${!!open}"`)}</div>${detailsGroup(node,'管理这份脚本',actions)}</article>`;
      }
      if(node.matches(formControl)){
        if(node.type==='range' && node.id && [...node.parentElement.querySelectorAll('input[type=number]')].some(counter=>
          !sourceHidden(counter) && (counter.dataset.for===node.id || counter.id===node.id+'_counter')))return '';
        return wanted(fieldLabel(node)+' '+(fieldNotes[node.id]||node.title))?mirrorField(node):'';
      }
      if(node.matches(actionable)&&!node.querySelector('button,.menu_button,[role=button],select,textarea')){
        if(!includeActions)return '';
        const label=actionText(node);
        return label && wanted(label)?sourceButton(node,label):'';
      }
      if(node.matches('label')&&node.querySelector(formControl)&&!node.querySelector('button,.menu_button')){
        return [...node.querySelectorAll(formControl)].map(read).join('');
      }
      if(node.matches('.inline-drawer')){
        const heading=node.querySelector(':scope > .inline-drawer-header');
        const body=node.querySelector(':scope > .inline-drawer-content');
        if(body&&exclude.includes(body.id))return '';
        if(body)return detailsGroup(node,translatedLabel(heading?.textContent||'更多选项',heading),[...body.children].map(read).join(''));
      }
      if(node.matches('details'))return detailsGroup(node,translatedLabel(node.querySelector('summary')?.textContent||'更多选项'),[...node.children].filter(el=>el.tagName!=='SUMMARY').map(read).join(''),node.open);
      if(node.matches('h2,h3,h4,h5,legend,.qr--title,.standoutHeader')&&!node.querySelector(formControl+','+actionable)){
        const name=translatedLabel(node.textContent,node);
        return name?`<h4 class="lj-control-heading">${escapeHtml(name)}</h4>`:'';
      }
      const body=[...node.children].map(read).join('');
      if(!body)return '';
      if(node.matches('.list-group-item,.extension_container,.qr--setListItem,.playlist,.range-block,.qr--head,fieldset'))return `<div class="lj-control-block">${body}</div>`;
      return body;
    }
    return `<div class="lj-structured">${[...container.children].map(read).join('')}</div>`;
  }
  function rulesWorkspace(group){
    const bulk=group.querySelector('#regex_bulk_edit');
    const button=(selector,name)=>sourceButton(group.querySelector(selector),name);
    function scope(name,block,create,scopeToggle){
      const section=group.querySelector('#'+block);
      if(!section || sourceHidden(section))return '';
      const toggle=scopeToggle && section.querySelector(scopeToggle);
      const rows=[...section.querySelectorAll('.regex-script-label')];
      const list=rows.map(row=>{
        const label=row.querySelector('.regex_script_name')?.textContent||'未命名规则';
        if(workspaceSearch && !label.toLowerCase().includes(workspaceSearch.toLowerCase()))return '';
        const off=row.querySelector('.disable_regex'),check=row.querySelector('.regex_bulk_checkbox');
        const actions=[['.edit_existing_regex','编辑这条规则'],['.export_regex','下载这条规则'],['.move_to_global','移到所有角色共用'],['.move_to_preset','移到当前预设'],['.move_to_scoped','移到当前角色'],['.delete_regex','删除这条规则']];
        const more=actions.map(([q,t])=>{const el=row.querySelector(q);return el&&!el.hidden&&W.getComputedStyle(el).display!=='none'?sourceButton(el,t):'';}).join('');
        return `<article class="lj-control-card"><div class="lj-rule-head">${bulk?.checked&&check?mirrorField(check,'选中这条规则'):''}<strong>${escapeHtml(label)}</strong>${off?sourceButton(off,off.checked?'已停用 · 启用':'已启用 · 停用',`aria-pressed="${!off.checked}"`):''}</div>${detailsGroup(row,'更多',more)}</article>`;
      }).join('');
      return groupSection(name,(toggle?mirrorField(toggle,'允许使用'+name+'的规则'):'')+button(create,'添加规则到'+name)+list+(rows.length?'':'<p>这里还没有规则。</p>'));
    }
    const bulkOps=group.querySelector('.regex_bulk_operations'),checked=group.querySelector('.regex_bulk_checkbox:checked');
    const controls=button('#import_regex','导入规则文件')+button('#open_regex_debugger','测试匹配和替换结果')+sourceButton(bulk,bulk?.checked?'退出批量编辑':'批量选择规则');
    const batch=bulk?.checked&&bulkOps?[...bulkOps.children].filter(el=>!el.hidden && (checked||el.id==='bulk_select_all_toggle')).map(el=>sourceButton(el,el.id==='bulk_select_all_toggle'?'全选或取消全选':actionText(el)+'选中的规则')).join(''):'';
    const presets=group.querySelector('#regex_presets_block');
    return '<p class="lj-muted">按规则查找和替换文字。角色卡可用它把回复里的数据展示成状态栏或小手机。</p>'+groupSection('',controls+batch)+
      scope('当前角色','scoped_scripts_block','#open_scoped_editor','#regex_scoped_toggle')+scope('当前预设','preset_scripts_block','#open_preset_editor','#regex_preset_toggle')+
      scope('所有角色','global_scripts_block','#open_regex_editor')+(presets?detailsGroup(presets,'保存或切换一组规则的启用状态',structuredControls(presets)):'');
  }
  function imagePromptsWorkspace(container){
    return [...container.querySelectorAll('textarea')].map(field=>{
      const header=field.previousElementSibling,label=tidy(header?.querySelector('label,span')?.textContent||fieldLabel(field));
      if(workspaceSearch&&!label.toLowerCase().includes(workspaceSearch.toLowerCase()))return '';
      return groupSection('',mirrorField(field,label)+sourceButton(header?.querySelector('button'),'Restore default（恢复「'+label+'」的默认提示词）'));
    }).join('');
  }
  function quickRepliesWorkspace(group){
    const edit=group.querySelector('#qr--editor');if(!edit)return structuredControls(group);
    const sets=['global','chat','character'].map((key,i)=>{
      const el=group.querySelector('#qr--'+key);
      return el&&!sourceHidden(el)?detailsGroup(el,['所有角色使用的回复组','本存档使用的回复组','本角色使用的回复组'][i],structuredControls(el)):'';
    }).join('');
    const root=group.querySelector('#qr--isEnabled')?.closest('.inline-drawer-content');
    const flags=[...(root?.querySelectorAll(':scope > label input')||[])].map(el=>mirrorField(el)).join('');
    const header=edit.querySelector('.qr--head'), settings=edit.querySelector('#qr--set-settings'), footer=edit.querySelector('.qr--set-qrListActions');
    const rows=[...edit.querySelectorAll('.qr--set-item')].map(row=>{
      const label=row.querySelector('.qr--set-itemLabel'),message=row.querySelector('.qr--set-itemMessage');
      if(!label||!message||workspaceSearch && !(label.value+' '+message.value).toLowerCase().includes(workspaceSearch.toLowerCase()))return '';
      const actions=[...row.querySelectorAll('.menu_button,[title]')].filter(el=>el.matches('.menu_button,.qr--set-itemIcon') && actionText(el)).map(el=>{
        const title=actionText(el);
        return sourceButton(el,el.closest('.qr--set-itemAdder')?'在这条回复前插入 · '+title:title);
      }).join('');
      return groupSection('',`<article class="lj-control-card"><strong>${escapeHtml(label.value||'未命名快捷回复')}</strong>${mirrorField(label,'按钮上显示的名称')}${mirrorField(message,'点击快捷回复时使用的内容')}${detailsGroup(row,'这条回复的操作',actions)}</article>`);
    }).join('');
    return groupSection('快捷回复',flags)+sets+groupSection('编辑回复组',structuredControls(header)+detailsGroup(settings,'本组发送设置',structuredControls(settings)))+rows+groupSection('添加到本组',structuredControls(footer));
  }
  function backgroundWorkspace(container){
    if(!container)return '';
    const fitting=container.querySelector('#background_fitting'),auto=container.querySelector('#auto_background');
    if(workspaceTab==='显示设置')return groupSection('背景铺放方式',(fitting?mirrorField(fitting):'')+sourceButton(auto,'根据对话选择背景')+['#bg_thumb_zoom_in','#bg_thumb_zoom_out'].map(q=>{const node=container.querySelector(q);return node?sourceButton(node,actionText(node)):'';}).join(''));
    const tile=node=>{
      const name=node.getAttribute('bgfile')||tidy(node.querySelector('.bg_folder_tile_name')?.textContent);
      if(!name || workspaceSearch&&!name.toLowerCase().includes(workspaceSearch.toLowerCase()))return '';
      const nativeImage=node.querySelector('.bg_example_img,.bg_folder_tile_cover');
      const image=nativeImage && W.getComputedStyle(nativeImage).backgroundImage;
      const existing=image?.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
      const src=existing||(node.hasAttribute('bgfile')?(node.getAttribute('custom')==='true'?name:'/backgrounds/'+encodeURIComponent(name)):'');
      const ops=[...node.querySelectorAll('.jg-button')].filter(el=>!sourceHidden(el)).map(el=>sourceButton(el,actionText(el))).join('');
      return `<article class="lj-control-card"><button class="lj-background-tile" data-action="source-action" data-source="${fieldId(node)}">${src?`<img alt="" loading="lazy" src="${escapeHtml(src)}">`:''}<strong>${escapeHtml(name)}</strong></button>${detailsGroup(node,'更多',ops)}</article>`;
    };
    const headers=['#bg_global_tab','#bg_chat_tab'].map((q,i)=>{const tab=container.querySelector(q);if(!tab)return '';
      const tiles=[...tab.querySelectorAll('.bg_example,.bg_folder_tile')].filter(el=>!el.hidden&&el.style.display!=='none').map(tile).join('');
      return groupSection(i?'当前聊天的背景':'我的背景',`<div class="lj-background-grid">${tiles||'<p>暂无背景</p>'}</div>`);
    }).join('');
    const tools=['#add_background_button_top','#bg_add_folder_button','#bg_selection_mode_button','#bg_group_add_to_folder_button','#bg-sort','#bg_back_to_folders','#bg_folder_remove_selected_button'].map(q=>{const el=container.querySelector(q);return !el||sourceHidden(el)?'':el.matches('select')?mirrorField(el):sourceButton(el,actionText(el));}).join('');
    return groupSection('',tools)+headers;
  }

    // Rebuilt settings screens. Existing controls are data/event adapters only.
  // Provider-specific inputs and drag controls can also be used in their original panel.
  let workspaceKey='generation', workspaceTab='', workspaceSearch='';
  let fieldCounter=0, dialogTimer, adapting=false;
  let extensionCatalog=null,extensionLoad=null;
  const fieldIds=new WeakMap(), fieldSources=new Map();
  const screenConfig={
    generation:{name:'当前接口的高级生成选项',subtitle:'调整酒馆当前使用的生成配置，保存时会写入当前预设',source:'#left-nav-panel',tabs:['常用参数','输出与推理','全部参数']},
    api:{name:'模型连接',subtitle:'选择服务商和模型，填写连接地址与密钥',source:'#rm_api_block',tabs:['连接设置','连接配置','全部选项']},
    users:{name:'界面与阅读',subtitle:'设置字号、聊天布局和消息操作',source:'#user-settings-block',tabs:['阅读显示','聊天行为','主题与字体','全部选项']},
    format:{name:'发给模型的消息格式',subtitle:'设置人设、聊天记录、指令和思考内容的排列方式',source:'#AdvancedFormatting',tabs:['上下文模板','指令模板','推理格式','全部选项']},
    extensions:{name:'扩展中心',subtitle:'启用、停用和设置已安装的扩展',source:'#rm_extensions_block',tabs:[]},
    backgrounds:{name:'背景图库',subtitle:'选择或管理聊天背景图',source:'#Backgrounds',tabs:['我的图库','显示设置']},
    characters:{name:'角色管理',subtitle:'编辑角色图、人设、多种开场白和群聊',source:'#right-nav-panel',tabs:['基础资料','人设与故事','高级设定','群聊与管理']},
    worlds:{name:'全局世界书设置',subtitle:'选择要启用的世界书，设置查找关键词的范围',source:'#WorldInfo',tabs:['所有角色共用的书','关键词触发设置']},
    account:{name:'下载备份',subtitle:'保存你的故事和界面',source:'#user-settings-block',tabs:['数据管理']},
  };
  const fieldLabels={
    bg_add_folder_button:'新建背景文件夹',
    instruct_activation_regex:'根据模型名称自动选择这份指令模板的匹配规则',
    tts_provider:'选择文字转语音服务',tts_refresh:'重新加载语音服务',tts_voices:'查看可选声音',
    memory_prompt_interval_auto:'按聊天长度估算两次总结的间隔',memory_prompt_words_auto:'按聊天长度估算摘要词数',
    sd_auto_validate:'连接 Stable Diffusion WebUI（绘图服务）',sd_sdcpp_validate:'连接 Stable Diffusion.cpp（本地绘图服务）',sd_drawthings_validate:'连接 Draw Things（绘图服务）',sd_vlad_validate:'连接 SD.Next（绘图服务）',sd_comfy_validate:'连接 ComfyUI（工作流绘图服务）',sd_comfy_runpod_validate:'连接 RunPod（云端绘图服务）',
    vectors_vectorize_all:'为当前聊天记录建立检索索引',vectors_purge:'清除当前聊天记录的检索索引',vectors_view_stats:'查看当前聊天的索引统计',vectors_files_vectorize_all:'为资料库和本聊天附件建立检索索引',vectors_files_purge:'清除资料库和本聊天附件的检索索引',
    option_toggle_AN:'作者注释（随对话发送的提醒）',option_toggle_CFG:'调整提示词引导强度',option_toggle_logprobs:'查看候选词的生成概率',
    openai_max_context_counter:'模型一次能处理的总长度（Token）',openai_max_context:'模型一次能处理的总长度（Token）',openai_max_tokens:'每次回复最多写多长（Token）',
    temp_counter_openai:'回复的随机程度',temp_openai:'回复的随机程度',freq_pen_counter_openai:'减少反复出现的词',pres_pen_counter_openai:'减少用过的词',
    top_p_counter_openai:'可选词的概率范围（Top P）',top_k_counter_openai:'最多从多少个候选词中选择（Top K）',min_p_counter_openai:'候选词最低相对概率（Min P）',
    seed_openai:'固定随机种子',n_openai:'一次生成几个回复版本',stream_toggle:'边生成边显示回复',oai_max_context_unlocked:'允许手动设置更长的上下文',
    openai_show_thoughts:'向模型请求思考过程',openai_reasoning_effort:'模型思考力度',openai_verbosity:'回复的详细程度',openai_enable_web_search:'允许模型联网搜索',
    openai_function_calling:'允许模型调用工具',openai_media_inlining:'把附件发给模型',openai_inline_image_quality:'发给模型的图片清晰度',
    openai_request_images:'让模型生成图片',squash_system_messages:'合并连续的系统指令',use_sysprompt:'单独发送系统指令',tool_call_recurse_limit_counter:'一次回复最多连续调用工具几次',
    openai_bypass_status_check:'跳过连接状态检查',openai_show_external_models:'列出服务商返回的其他模型',custom_prompt_post_processing:'发送前如何整理消息',
    'auto-connect-checkbox':'打开时自动连接',settings_preset_openai:'当前生成预设',send_if_empty_textarea:'留空发送时使用的文字',tags_textarea:'角色标签',
    talkativeness_slider:'群聊中主动发言的频率',world_info:'在所有聊天中启用的世界书',world_info_depth_counter:'查找最近多少条消息',
    world_info_budget_counter:'世界书最多占总长度的百分比',world_info_budget_cap_counter:'世界书长度上限（Token）',
    world_info_min_activations_counter:'尽量触发多少条设定',world_info_min_activations_depth_max_counter:'补找设定时最多查多少条消息',
    world_info_max_recursion_steps_counter:'最多连续触发几次',world_info_recursive:'允许已触发的条目引出其他条目',world_info_include_names:'查找关键词时也检查发言人姓名',
    world_info_case_sensitive:'英文关键词区分大小写',world_info_match_whole_words:'只匹配完整单词',world_info_use_group_scoring:'同组优先选择命中关键词更多的条目',
    context_story_string:'人设和背景的排列模板',context_story_string_position:'人设和背景放在哪里',context_story_string_depth:'距最新消息的条数',context_story_string_role:'以谁的身份发送',
    tool_reasoning_mode:'使用工具时，附上哪些先前的思考内容',sysprompt_content:'系统指令内容',sysprompt_post_history:'聊天记录之后的指令',reasoning_auto_expand:'自动展开思考内容',reasoning_add_to_prompts:'将思考内容随聊天记录发给模型',
    world_info_overflow_alert:'世界书超过长度上限时提醒',world_info_character_strategy:'角色世界书和全局世界书的排列方式',
    character_name_pole:'角色名称',description_textarea:'角色设定',personality_textarea:'性格',scenario_pole:'故事背景',
    firstmessage_textarea:'默认开场白',mes_example_textarea:'对话示例',creator_notes_textarea:'作品介绍',creator_textarea:'作者',
    character_version_textarea:'角色版本',system_prompt_textarea:'角色主提示词',post_history_instructions_textarea:'聊天记录之后发给模型的指令',
    depth_prompt_prompt:'插在聊天记录里的角色提醒',depth_prompt_depth:'距最新消息的条数',depth_prompt_role:'角色提醒以谁的身份发送',
    custom_api_url_text:'API 地址',custom_model_id:'服务商提供的模型名称',main_api:'接口类型',chat_completion_source:'服务商',
    api_button:'连接模型',api_button_openai:'连接模型',api_connect:'连接模型',api_key_openai:'API 密钥',api_key_custom:'API 密钥',
    send_if_empty:'空消息默认内容',user_name:'你的名字',persona_description:'面具设定',persona_description_position:'设定插入位置',
    persona_depth_value:'面具设定距最新消息的条数',persona_depth_role:'面具设定以谁的身份发送',font_scale:'阅读字号',chat_width_slider:'阅读宽度',
  };
  const fieldNotes={
    openai_max_context_counter:'总长度包含提示词、人设、聊天记录和预留给回复的空间。Token 是模型计算文本长度的单位。',
    openai_max_tokens:'给本次回复预留的长度。最终能写多少，还取决于模型和服务商的上限。',
    temp_counter_openai:'温度越低，用词通常越稳定。调高后，同一句话更容易得到不同写法。',
    freq_pen_counter_openai:'频率惩罚。数值越高，已经反复出现的词越难再次被选中。',
    pres_pen_counter_openai:'存在惩罚。提高数值后，已经出现过的词就更难再次被选中。',
    top_p_counter_openai:'从最可能的词开始累加概率，达到这个值后停止。数值越小，候选词通常越少。',
    seed_openai:'填 -1 时使用随机种子。填同一个数字，可在支持的模型上尝试复现相近的回复。',
    n_openai:'同一次请求生成的多个版本会归在同一条回复下。需要服务商支持。',
    stream_toggle:'开启后，回复会边写边出现在聊天里。关闭后，写完再整条显示。',
    oai_max_context_unlocked:'放宽界面的输入上限。实际可用长度仍由模型决定。',
    openai_show_thoughts:'服务商支持时，请求它返回可供显示的思考内容。',
    openai_media_inlining:'模型支持相应格式时，会收到聊天里的图片、音频或视频。',
    depth_prompt_depth:'填 0 放在最新消息之后，填 1 放在最新消息之前。',
    persona_depth_value:'选择插在聊天记录内时生效。填 0 放在最新消息之后。',
    world_info_budget_cap_counter:'填 0 表示只使用百分比限制。',
  };
  const promptRoles={system:'系统指令',user:'用户发言',assistant:'AI 发言'};
  const numberedRoles={0:'系统指令',1:'用户发言',2:'AI 发言'};
  const optionLabels={
    main_api:{textgenerationwebui:'文本续写接口',openai:'聊天消息接口'},
    openai_reasoning_effort:{auto:'交给模型',min:'最低',low:'较低',medium:'中等',high:'较高',max:'最高'},
    openai_verbosity:{auto:'交给模型',low:'简短',medium:'适中',high:'详细'},
    openai_inline_image_quality:{auto:'交给模型',low:'较低',high:'较高'},
    depth_prompt_role:promptRoles,context_story_string_role:numberedRoles,persona_depth_role:numberedRoles,
    world_info_character_strategy:{0:'全部按条目顺序排列',1:'角色世界书优先',2:'全局世界书优先'},
    context_story_string_position:{0:'放在全部内容开头',1:'插入聊天记录'},
    persona_description_position:{9:'不发送面具设定',0:'跟随模板或提示词列表',2:'放在作者注释开头',3:'放在作者注释末尾',4:'插入聊天记录'},
    tool_reasoning_mode:{disabled:'不附上',since_last_user:'从最近一次用户发言起',active_chain:'仅当前连续调用工具的过程'},
    custom_prompt_post_processing:{'':'按原样发送',merge_tools:'合并连续的同身份消息，保留工具',semi_tools:'让用户与 AI 交替发言，保留工具',strict_tools:'从用户开始交替发言，保留工具',merge:'合并连续的同身份消息，移除工具',semi:'让用户与 AI 交替发言，移除工具',strict:'从用户开始交替发言，移除工具',single:'合并成一条用户消息，移除工具'},
  };
  function mirrorOption(source,option){
    const labels=optionLabels[source.id];
    const text=labels&&Object.hasOwn(labels,option.value)?labels[option.value]:option.textContent;
    return `<option value="${escapeHtml(option.value)}" ${option.selected?'selected':''} ${option.disabled?'disabled':''}>${escapeHtml(source.matches('#world_info,#world_editor_select,#qr--set,[data-preset-manager-for],select[id*="model"],#connection_profiles')?text:translatedLabel(text,option))}</option>`;
  }
  const builtInPromptNames={
    'Main Prompt':'主要演绎指令','Chat History':'聊天记录','Persona Description':'用户面具设定',
    'Char Description':'角色设定','Char Personality':'角色性格','Scenario':'故事背景','Dialogue Examples':'对话示例',
    'World Info (before)':'世界书（角色设定之前）','World Info (after)':'世界书（角色设定之后）',
    'Post-History Instructions':'聊天记录之后的指令','Auxiliary Prompt':'补充指令','Enhance Definitions':'补充角色设定',
  };
  function promptName(prompt){return Object.hasOwn(builtInPromptNames,prompt.name)?builtInPromptNames[prompt.name]:prompt.name||prompt.identifier;}
  const tidy=value=>String(value||'').replace(/[\uE000-\uF8FF]/g,'').replace(/\s+/g,' ').trim();
  function fieldId(source){if(!source)return '';let id=fieldIds.get(source);if(!id){id=String(++fieldCounter);fieldIds.set(source,id);fieldSources.set(id,source);}return id;}
  function fieldLabel(source){
    if(fieldLabels[source.id])return fieldLabels[source.id];
    const label=source.labels?.[0] || source.closest('label');
    const candidates=[source.getAttribute('aria-label'),label?.textContent,source.title,source.getAttribute('placeholder')];
    const direct=candidates.map(tidy).find(t=>t.length>0&&t.length<170);if(direct)return direct;
    let parent=source.parentElement;
    for(let n=0;parent&&n<3;n++,parent=parent.parentElement){
      const heading=[...parent.children].find(e=>e!==source&&e.matches('label,small,b,strong,h3,h4,h5,.range-block-title,.title_restorable'));
      if(heading)candidates.push(heading.textContent);
    }
    candidates.push(source.nextElementSibling?.textContent,source.previousElementSibling?.textContent);
    for(let p=source.parentElement,n=0;p&&n<3;p=p.parentElement,n++){const clone=p.cloneNode(true);clone.querySelectorAll('input,select,textarea,button,svg,.fa-solid,.fa-fw').forEach(e=>e.remove());const text=tidy(clone.textContent);if(text&&text.length<170)candidates.push(text);}
    candidates.push(source.id?.replace(/[_-]/g,' '),source.name,'选项');
    return candidates.map(tidy).find(t=>t.length>0&&t.length<170) || '选项';
  }
  function mirrorField(source,explicit){
    const id=fieldId(source),label=translatedLabel(typeof explicit==='string'?explicit:fieldLabel(source),source.labels?.[0]||source),disabled=source.disabled?'disabled':source.readOnly?'readonly':'',value=String(source.value ?? '');
    const helpNode=source.closest('[title]');
    const help=fieldNotes[source.id] || translatedLabel(helpNode?.title,helpNode,'title');
    const summaryTranslation=source.id==='vectors_summary_prompt'&&localizedStrings.get(tidy(value).toLowerCase());
    let control;
    if(source.tagName==='TOOLCOOL-COLOR-PICKER'){
      control=`<input type="text" data-source="${id}" aria-label="${escapeHtml(label)}" value="${escapeHtml(source.getAttribute('color')||source.color?.rgba||source.color||'')}" placeholder="颜色值">`;
    }else if(source.matches('select')){
      const options=[...source.children].map(option=>option.tagName==='OPTGROUP'
        ?`<optgroup label="${escapeHtml(option.label)}" ${option.disabled?'disabled':''}>${[...option.children].map(child=>mirrorOption(source,child)).join('')}</optgroup>`
        :mirrorOption(source,option));
      control=`<select data-source="${id}" aria-label="${escapeHtml(label)}" ${source.multiple?'multiple size="6"':''} ${disabled}>${options.join('')}</select>`;
    }else if(source.type==='checkbox'||source.type==='radio'){
      const radioGroup=source.type==='radio' && source.name ? `name="lj-radio-${fieldId(source.form||source.getRootNode())}-${escapeHtml(source.name)}"` : '';
      control=`<label class="lj-switch"><input type="${source.type}" ${radioGroup} data-source="${id}" aria-label="${escapeHtml(label)}" ${source.checked?'checked':''} ${disabled}><span></span></label>`;
    }else if(source.type==='file'){
      control=`<button class="lj-soft" data-action="source-action" data-source="${id}">选择文件</button>`;
    }else if(source.tagName==='TEXTAREA'){
      control=`<textarea data-source="${id}" aria-label="${escapeHtml(label)}" rows="${Math.max(3,Math.min(12,source.rows||5))}" ${disabled}>${escapeHtml(value)}</textarea>`;
    }else{
      const type=source.type==='range'?'number':(/password|secret|api[_-]?key/i.test(source.id+' '+source.type)?'password':source.type==='number'?'number':source.type==='color'?'color':'text');
      control=`<input type="${type}" data-source="${id}" aria-label="${escapeHtml(label)}" value="${escapeHtml(value)}" ${['min','max','step'].map(a=>source.hasAttribute(a)?`${a}="${escapeHtml(source.getAttribute(a))}"`:'').join(' ')} ${disabled} autocomplete="off">`;
    }
    return `<div class="lj-field ${source.tagName==='TEXTAREA'?'lj-field-wide':''} ${source.type==='checkbox'||source.type==='radio'?'lj-field-switch':''}"><div><label>${escapeHtml(label)}</label>${help&&help!==label?`<p>${escapeHtml(help)}</p>`:''}</div>${control}${summaryTranslation?`<p>${escapeHtml(summaryTranslation)}</p>`:''}</div>`;
  }
  function mirrorGroup(container,options){
    return container?structuredControls(container,options):'<p class="lj-muted">当前版本或连接没有提供这一组选项。</p>';
  }
  function workspaceTabTitle(t){
    const names={'正则':'文字替换规则（正则）',Regex:'Regex（文字替换规则）','向量存储':'向量存储（按意思查找聊天和文件）','总结':'自动总结聊天','图像生成 ?':'图像生成'};
    return names[t]||translatedLabel(t);
  }
  async function openExtensionGroup(selector){
    const panel=$(selector)?.closest('.inline-drawer');
    if(!panel){toast('这项扩展还没有加载');return;}
    const tab=tidy(panel.querySelector(':scope>.inline-drawer-header')?.textContent);
    await openNative('extensions');workspaceTab=tab;render();
  }
  function workspaceTabs(){
    const config=screenConfig[workspaceKey];
    if(workspaceKey==='extensions')return ['已安装扩展',...new Set([...D.querySelectorAll('#rm_extensions_block .inline-drawer')].map(e=>tidy(e.querySelector('.inline-drawer-header')?.textContent)).filter(Boolean))];
    return config.tabs;
  }
  function commonGeneration(){
    const ids=['openai_max_context_counter','openai_max_tokens','n_openai','temp_counter_openai','freq_pen_counter_openai','pres_pen_counter_openai','top_p_counter_openai','seed_openai'];
    if(ctx().mainApi!=='openai')return mirrorGroup($('#left-nav-panel'));
    const fields=ids.map(id=>D.getElementById(id)).filter(Boolean);
    const toggles=['stream_toggle','oai_max_context_unlocked','openai_show_thoughts','openai_function_calling','openai_media_inlining'].map(id=>D.getElementById(id)).filter(Boolean);
    return `<section class="lj-form-section"><h2>生成参数</h2><div class="lj-form-grid">${[...fields,...toggles].filter(e=>!workspaceSearch || `${fieldLabel(e)} ${fieldNotes[e.id]||''}`.toLowerCase().includes(workspaceSearch.toLowerCase())).map(mirrorField).join('')}</div></section>`;
  }
  function promptWorkspace(){
    const settings=ctx().chatCompletionSettings;
    if(ctx().mainApi!=='openai'||!settings)return mirrorGroup($('#left-nav-panel'));
    const prompts=settings.prompts || [],order=settings.prompt_order?.find(x=>String(x.character_id)===String(ctx().characterId))?.order || settings.prompt_order?.find(x=>x.character_id===100001)?.order || settings.prompt_order?.[0]?.order || [];
    const list=order.map(o=>({p:prompts.find(p=>p.identifier===o.identifier),o})).filter(x=>x.p);
    const unused=prompts.filter(p=>!order.some(o=>o.identifier===p.identifier));
    return `<section class="lj-form-section"><div class="lj-row lj-space"><div><h2>提示词条目</h2><p class="lj-muted">${escapeHtml(currentPreset())}</p></div><button class="lj-primary" data-action="prompt-add">新建条目</button></div><div class="lj-prompt-list">${list.map(({p,o},i)=>`<article class="lj-prompt-row"><span class="lj-order">${i+1}</span><div class="lj-prompt-label"><strong>${escapeHtml(promptName(p))}</strong><small>${p.marker?'自动填入对应内容':escapeHtml(promptRoles[p.role]||p.role||promptRoles.system)} · ${p.injection_position===1?'插入聊天记录':'按列表顺序发送'}</small></div><label class="lj-switch"><input type="checkbox" aria-label="启用 ${escapeHtml(promptName(p))}" data-prompt-toggle="${escapeHtml(p.identifier)}" ${o.enabled?'checked':''}><span></span></label><button class="lj-iconbutton" data-action="prompt-move" data-id="${escapeHtml(p.identifier)}" data-direction="-1" aria-label="上移 ${escapeHtml(p.name)}">↑</button><button class="lj-iconbutton" data-action="prompt-move" data-id="${escapeHtml(p.identifier)}" data-direction="1" aria-label="下移 ${escapeHtml(p.name)}">↓</button><button class="lj-soft" data-action="prompt-edit" data-id="${escapeHtml(p.identifier)}">编辑</button></article>`).join('')}</div>${unused.length?`<h3 style="margin-top:24px">尚未加入发送列表</h3>${unused.map(p=>`<button class="lj-soft" style="margin:10px 8px 0 0" data-action="prompt-edit" data-id="${escapeHtml(p.identifier)}">${escapeHtml(promptName(p))}</button>`).join('')}`:''}</section>`;
  }
  function characterWorkspace(){
    const maps={
      '基础资料':['character_name_pole','creator_notes_textarea','creator_textarea','character_version_textarea','tags_textarea'],
      '人设与故事':['description_textarea','personality_textarea','scenario_pole','firstmessage_textarea','mes_example_textarea'],
      '高级设定':['system_prompt_textarea','post_history_instructions_textarea','depth_prompt_prompt','depth_prompt_depth','depth_prompt_role','talkativeness_slider'],
    };
    if(workspaceTab==='群聊与管理')return `<div class="lj-row lj-wrap" style="margin-bottom:20px"><button class="lj-primary" data-action="create-group">创建群聊</button><button class="lj-soft" data-action="import-char">导入角色</button><button class="lj-soft" data-action="character-actions">更多角色操作</button></div>`+mirrorGroup($('#rm_group_chats_block'),{showAll:true});
    const c=selected(),fields=(maps[workspaceTab]||maps['基础资料']).map(id=>D.getElementById(id)).filter(Boolean);
    return `<section class="lj-creator-hero">${c?`<img src="${escapeHtml(avatar(c))}" alt="角色封面">`:''}<div><h2>${escapeHtml(ctx().menuType==='create'?'创建新角色':c?.name||'角色资料')}</h2><p class="lj-muted">设定、开场与专属规则</p><div class="lj-row lj-wrap"><button class="lj-soft" data-action="source-action" data-source="${fieldId($('#avatar_load')||$('#add_avatar_button')||$('#character_import_file'))}">更换角色图</button><button class="lj-soft" data-action="greetings">开场故事</button><button class="lj-soft" data-action="world-binding">绑定世界书</button></div></div></section><section class="lj-form-section"><div class="lj-form-grid">${fields.map(mirrorField).join('')}</div><div class="lj-form-actions"><button class="lj-primary" data-action="save-character">保存角色</button></div></section>`;
  }
  function installedExtensions(){
    if(!extensionCatalog&&!extensionLoad)extensionLoad=loadExtensionCatalog();
    const disabled=ctx().extensionSettings.disabledExtensions||[];
    return `<section class="lj-form-section"><div class="lj-row lj-space"><h2>我的扩展</h2><button class="lj-primary" data-action="extension-install">安装扩展</button></div><p class="lj-muted lj-small">修改启用状态后刷新页面生效。原主题文件保留。</p><div class="lj-extension-grid">${(extensionCatalog||[]).map(item=>`<article class="lj-extension-card"><div class="lj-resource-icon">${icon('preset')}</div><h3>${escapeHtml(translatedLabel(item.display_name||item.name))}</h3><p class="lj-muted lj-small">${escapeHtml(item.version||'')} ${escapeHtml(item.author||'')}</p><div class="lj-row lj-space"><span class="lj-muted lj-small">${THEME_IDS.includes(item.name)?'原主题已保留':'启用'}</span>${THEME_IDS.includes(item.name)?'<button class="lj-soft" data-action="restore-theme">切回原主题</button>':`<label class="lj-switch"><input type="checkbox" data-extension-toggle="${escapeHtml(item.name)}" aria-label="启用 ${escapeHtml(translatedLabel(item.display_name||item.name))}" ${disabled.includes(item.name)?'':'checked'}><span></span></label>`}</div><div class="lj-form-actions">${item.name.startsWith('third-party/')?`<button class="lj-soft" data-action="extension-update" data-name="${escapeHtml(item.name)}">检查更新</button>`:''}</div></article>`).join('')||'<p class="lj-muted">正在读取已安装扩展…</p>'}</div></section>`;
  }
  async function loadExtensionCatalog(){try{const response=await W.fetch('/api/extensions/discover');if(!response.ok)throw Error(response.status);const discovered=await response.json();extensionCatalog=await Promise.all(discovered.map(async item=>{try{const res=await W.fetch(`/scripts/extensions/${item.name}/manifest.json`);if(!res.ok)return item;return {...await res.json(),...item};}catch(_){return item;}}));refreshWorkspaceFields();}catch(error){extensionCatalog=[];toast('扩展列表读取失败：'+error.message);}finally{extensionLoad=null;}}
  function extensionInstallModal(){modal('安装扩展',`<label>扩展仓库地址</label><input id="lj-extension-url" placeholder="https://github.com/作者/仓库"><p class="lj-muted lj-small">安装到当前用户。安装完成后刷新页面。</p><div class="lj-form-actions"><button class="lj-primary" data-action="extension-install-submit">安装</button></div>`,'560px');}
  function globalBookChoices(){
    const source=$('#world_info');
    if(!source)return '<p class="lj-muted">正在读取世界书…</p>';
    const options=Array.from(source.options).filter(option=>option.value!=='');
    const query=workspaceSearch.trim().toLowerCase();
    const visible=options.filter(option=>option.label.toLowerCase().includes(query));
    const rows=visible.map(option=>
      `<label class="lj-global-book"><input type="checkbox" data-global-book="${escapeHtml(option.label)}" ${option.selected?'checked':''} ${source.disabled||option.disabled?'disabled':''}><span>${escapeHtml(option.label)}</span></label>`);
    const empty=options.length?'没有找到这本世界书。':'还没有可选的世界书。';
    return `<section class="lj-global-books" aria-label="所有角色共用的书"><p class="lj-muted">勾选后会在所有聊天中启用。全部留空时，各角色仍使用各自绑定的世界书。</p>
      <div class="lj-global-book-count" role="status">已选 ${options.filter(o=>o.selected).length} 本 · 共 ${options.length} 本${query?' · 找到 '+visible.length+' 本':''}</div>
      <div class="lj-global-book-list">${rows.join('')||`<p class="lj-muted">${empty}</p>`}</div></section>`;
  }
  function toggleGlobalBook(control){
    const source=$('#world_info');
    const option=source && Array.from(source.options).find(o=>o.value!=='' && o.label===control.dataset.globalBook);
    if(!option || source.disabled || option.disabled){refreshWorkspaceFields();return;}
    option.selected=control.checked;
    source.dispatchEvent(new W.Event('change',{bubbles:true}));
  }
  function workspaceBody(){
    const config=screenConfig[workspaceKey],container=$(config.source);
    if(workspaceKey==='generation'){
      if(workspaceTab==='常用参数')return commonGeneration();
      if(workspaceTab==='提示词')return promptWorkspace();
      if(workspaceTab==='输出与推理')return mirrorGroup($('#openai_settings')||container,{exclude:['openai_max_context','openai_max_context_counter','openai_max_tokens']});
      return mirrorGroup(container,{showAll:true});
    }
    if(workspaceKey==='characters')return characterWorkspace();
    if(workspaceKey==='users'&&workspaceTab!=='全部选项'){
      const scope=workspaceTab==='聊天行为'?container.querySelector('[name="ChatMessageHandlingToggles"]'):workspaceTab==='主题与字体'?$('#UI-Theme-Block'):container.querySelector('[name="AvatarAndChatDisplay"]')?.parentElement;
      return `<section class="lj-form-section">${mirrorGroup(scope)}</section>`;
    }
    if(workspaceKey==='format'&&workspaceTab!=='全部选项'){
      const scope=workspaceTab==='上下文模板'?$('#ContextSettings'):workspaceTab==='指令模板'?$('#InstructSettingsColumn'):($('#ReasoningSettings')||$('#reasoning_auto_parse')?.closest('div:has(>h4 [data-i18n="Reasoning"])'));
      return `<section class="lj-form-section">${mirrorGroup(scope)}</section>`;
    }
    if(workspaceKey==='extensions'){
      if(workspaceTab==='已安装扩展')return installedExtensions();
      const group=[...D.querySelectorAll('#rm_extensions_block .inline-drawer')].find(e=>tidy(e.querySelector('.inline-drawer-header')?.textContent)===workspaceTab);
      if(!group)return '<p>这项扩展还没有载入。</p>';
      if(group.querySelector('#regex_presets_block'))return rulesWorkspace(group);
      if(group.querySelector('#qr--editor'))return quickRepliesWorkspace(group);
      const body=group.querySelector(':scope > .inline-drawer-content');
      if(body?.id==='sd_prompt_templates')return imagePromptsWorkspace(body);
      return mirrorGroup(body||group,{exclude:['sd_prompt_templates']});
    }
    if(workspaceKey==='backgrounds')return backgroundWorkspace(container);
    if(workspaceKey==='worlds'){
      return workspaceTab==='所有角色共用的书'?globalBookChoices():mirrorGroup($('#wiActivationSettings'));
    }
    if(workspaceKey==='account')return `<section class="lj-form-section"><h2>选择要下载的备份</h2><p class="lj-muted">完整用户备份包含酒馆用户数据。主题源码备份只包含界面程序。</p><div class="lj-form-actions"><button class="lj-primary" data-action="backup-download">下载完整用户备份</button>${installedThemeIds().length?'<button class="lj-soft" data-action="theme-source-backup">下载原主题源文件备份</button>':''}</div></section>`;
    return `<section class="lj-form-section">${mirrorGroup(container)}</section>`;
  }
  function settingsWorkspace(){
    const config=screenConfig[workspaceKey],tabs=workspaceTabs();if(!tabs.includes(workspaceTab))workspaceTab=tabs[0]||'';
    const choosingBooks=workspaceKey==='worlds' && workspaceTab==='所有角色共用的书';
    const searchLabel=choosingBooks?'搜索世界书名称':'搜索此页设置';
    return title(escapeHtml(config.name),`${workspaceKey==='generation'?'<button class="lj-primary" data-action="preset-save-current">保存到当前使用的预设</button>':''}`)+`<p class="lj-page-subtitle">${escapeHtml(config.subtitle)}</p><div class="lj-workspace"><nav class="lj-workspace-tabs" aria-label="${escapeHtml(config.name)}分类">${tabs.map(t=>`<button class="${workspaceTab===t?'active':''}" data-action="workspace-tab" data-tab="${escapeHtml(t)}">${escapeHtml(workspaceTabTitle(t))}</button>`).join('')}</nav><div class="lj-workspace-content"><div class="lj-row lj-space lj-workspace-toolbar ${choosingBooks?'lj-global-book-search':''}">${choosingBooks?'':`<div class="lj-muted lj-small">${escapeHtml(workspaceTabTitle(workspaceTab))}</div>`}<input type="search" id="lj-settings-search" placeholder="${searchLabel}" aria-label="${searchLabel}" value="${escapeHtml(workspaceSearch)}"></div><div id="lj-workspace-fields">${workspaceBody()}</div>${originalWorkspaceLink()}</div></div>`;
  }
  function changeSource(control,change=true){
    const source=fieldSources.get(control.dataset.source);if(!source?.isConnected)return;
    if(source.tagName==='TOOLCOOL-COLOR-PICKER'){source.color=control.value;if(change)source.dispatchEvent(new W.CustomEvent('change',{bubbles:true,detail:{rgba:control.value,hex:control.value}}));}
    else if(source.type==='checkbox'||source.type==='radio'){
      if(source.checked!==control.checked && (source.type!=='radio'||control.checked))source.click();
      control.checked=source.checked;
    }
    else{
      if(source.multiple){const selectedValues=[...control.selectedOptions].map(o=>o.value);for(const o of source.options)o.selected=selectedValues.includes(o.value);}else source.value=control.value;
      if(change && source.tagName==='SELECT')source.dispatchEvent(new W.Event('input',{bubbles:true}));
      source.dispatchEvent(new W.Event(change?'change':'input',{bubbles:true}));
    }
    if(change)W.setTimeout(refreshWorkspaceFields,200);
  }
  async function savePromptChanges(mutator){
    const settings=ctx().chatCompletionSettings;
    const draft=JSON.parse(JSON.stringify(settings));mutator(draft);
    // Preserve all current generation values while saving edited prompt data.
    await ctx().getPresetManager().savePreset(currentPreset(),draft);toast('预设已保存');render();
  }
  function activePromptOrder(settings){return settings.prompt_order?.find(x=>String(x.character_id)===String(ctx().characterId))?.order||settings.prompt_order?.find(x=>x.character_id===100001)?.order||settings.prompt_order?.[0]?.order||[];}
  function editPrompt(identifier){
    const p=ctx().chatCompletionSettings.prompts?.find(p=>p.identifier===identifier)||{identifier:ctx().uuidv4(),name:'新提示词',role:'system',content:'',injection_position:0,injection_depth:4,injection_order:100};
    modal('编辑提示词',`<div class="lj-editor-fields"><label>名称</label><input id="lj-prompt-name" value="${escapeHtml(p.name)}"><label>以谁的身份发送</label><select id="lj-prompt-role">${Object.entries(promptRoles).map(([role,label])=>`<option value="${role}" ${p.role===role?'selected':''}>${label}</option>`).join('')}</select><label>内容</label><textarea id="lj-prompt-content" ${p.marker?'disabled':''}>${escapeHtml(p.content||'')}</textarea><div class="lj-form-grid"><div><label>插入位置</label><select id="lj-prompt-position"><option value="0" ${p.injection_position!==1?'selected':''}>按列表顺序发送</option><option value="1" ${p.injection_position===1?'selected':''}>插入聊天记录</option></select></div><div><label>距最新消息的条数</label><input id="lj-prompt-depth" type="number" value="${Number(p.injection_depth)||0}"></div><div><label>同一位置的排列顺序</label><input id="lj-prompt-order" type="number" value="${Number(p.injection_order??100)}"></div></div><label><input type="checkbox" id="lj-prompt-system" ${p.system_prompt?'checked':''}> 作为系统提示词</label><div class="lj-form-actions"><button class="lj-primary" data-action="prompt-save" data-id="${escapeHtml(p.identifier)}">保存条目</button></div></div>`);
  }
  function refreshWorkspaceFields(){
    if(route!=='workspace'||originalView)return;
    const box=$('#lj-workspace-fields');if(!box)return;
    const open=new Set([...box.querySelectorAll('details[open]')].map(node=>node.dataset.group));
    const active=box.contains(D.activeElement)?D.activeElement:null, id=active?.dataset.source;
    const selection=active&&['text','search','textarea'].includes(active.type)?[active.selectionStart,active.selectionEnd]:null;
    const main=box.closest('.lj-main'), top=main?.scrollTop;
    box.innerHTML=workspaceBody();
    for(const node of box.querySelectorAll('details[data-group]'))if(open.has(node.dataset.group))node.open=true;
    if(id){const field=box.querySelector('[data-source="'+id+'"]');field?.focus({preventScroll:true});if(selection&&field?.setSelectionRange)field.setSelectionRange(...selection);}
    if(active?.hasAttribute('data-global-book')){
      const replacement=Array.from(box.querySelectorAll('[data-global-book]')).find(el=>el.dataset.globalBook===active.dataset.globalBook);
      replacement?.focus({preventScroll:true});
    }
    if(main)main.scrollTop=top;
  }
  // Native popups own their validation, document ordering and per-row event handlers.
  function adaptDialogs(){
    if(disposed||!D.body.classList.contains('lj-active'))return;
    for(const dialog of D.querySelectorAll('dialog.popup[open],.TH-popup[role="dialog"] .popup[role="dialog"]')){
      const content=dialog.querySelector('.popup-content');
      for(const child of content?.childNodes||[]){
        if(child.nodeType!==3||child.nextSibling?.classList?.contains('lj-popup-note'))continue;
        const original=tidy(child.textContent),display=translatedLabel(original);
        if(original && display.startsWith(original+'（')){
          const note=D.createElement('span');note.className='lj-popup-note';note.textContent=display.slice(original.length);child.after(note);
        }
      }
      for(const node of dialog.querySelectorAll('h2,h3,h4,p,button,[role=button],[data-i18n],label')){
        if(node.closest('textarea,pre,code,[contenteditable=true],.lj-adapted-popup')||node.children.length)continue;
        const original=tidy(node.textContent),display=translatedLabel(original,node);
        const suffix=display.startsWith(original+'（')?display.slice(original.length):'';
        if(suffix)node.dataset.ljTranslation=suffix;else if(node.dataset.ljTranslation)delete node.dataset.ljTranslation;
      }
    }
  }
  function observeDialogs(){
    let update;
    const observer=new W.MutationObserver(changes=>{
      if(disposed)return;
      const scope=route==='workspace'&&$(screenConfig[workspaceKey].source);
      if(scope&&changes.some(x=>scope.contains(x.target))){
        W.clearTimeout(update);update=W.setTimeout(refreshWorkspaceFields,110);
      }
      if(changes.some(x=>x.target.closest?.('dialog,.TH-popup')||[...x.addedNodes].some(n=>n.nodeType===1&&(n.matches('dialog,.TH-popup')||n.querySelector('dialog,.TH-popup'))))){
        W.clearTimeout(dialogTimer);dialogTimer=W.setTimeout(adaptDialogs,40);
      }
    });
    observer.observe(D.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open','style','hidden','class']});
    observers.push(observer);listeners.push(()=>{W.clearTimeout(update);W.clearTimeout(dialogTimer);});
  }
  function downloadData(name,data,type='application/json'){
    const blob=data instanceof W.Blob?data:new W.Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type});
    const url=W.URL.createObjectURL(blob),link=D.createElement('a');link.href=url;link.download=name;D.body.append(link);link.click();link.remove();W.setTimeout(()=>W.URL.revokeObjectURL(url),10000);
  }
  async function backupDownload(){
    toast('正在准备用户备份，请保持页面打开');
    const me=await W.fetch('/api/users/me',{headers:ctx().getRequestHeaders()});if(!me.ok)throw Error('无法读取当前用户');const profile=await me.json();
    const response=await W.fetch('/api/users/backup',{method:'POST',headers:ctx().getRequestHeaders(),body:JSON.stringify({handle:profile.handle})});
    if(!response.ok)throw Error('备份失败 '+response.status);
    downloadData(`用户备份_${new Date().toISOString().slice(0,10)}.zip`,await response.blob(),'application/zip');toast('用户备份已生成');
  }
  async function backupThemeSources(){
    const files={};
    for(const [theme,names]of Object.entries({'xingjian-cabin':['manifest.json','index.js','tavern.css'],'forest-tavern':['manifest.json','index.js','style.css']})){
      if(!installedThemeIds().includes('third-party/'+theme))continue;
      for(const file of names){const path=`/scripts/extensions/third-party/${theme}/${file}`,response=await W.fetch(path);if(!response.ok)throw Error('读取原主题失败 '+path);files[`${theme}/${file}`]=await response.text();}
    }
    const data={format:'theme-source-backup',version:1,created:new Date().toISOString(),themes:preferences().originalThemes,files};
    downloadData('原主题源文件备份.json',data);
    modal('原主题源文件备份',`<p class="lj-muted">已整理当前安装的主题核心文件。以下备份文本也可以直接复制保存。原素材目录继续保留原位。</p><textarea readonly aria-label="原主题备份文本" style="min-height:320px">${escapeHtml(JSON.stringify(data,null,2))}</textarea><p class="lj-muted lj-small">此文件包含核心源码，不包含全部图片、音频和视频素材。</p>`,'900px');
    toast('原主题核心源文件备份已生成');
  }
  let originalView=null;
  function originalWorkspaceLink(){
    const labels={
      extensions:workspaceTab==='已安装扩展'?'打开酒馆的扩展管理':('在原版中操作'+workspaceTabTitle(workspaceTab)),
      generation:'查看当前接口的完整生成选项', users:'查看酒馆原有的界面选项',
      format:'查看完整的消息格式选项',backgrounds:'在酒馆图库中批量整理背景',account:'打开酒馆的账户与数据选项',
    };
    const label=labels[workspaceKey];
    return label?`<div class="lj-form-actions"><button class="lj-soft" data-action="original-options" data-panel="${workspaceKey}">${escapeHtml(label)}</button></div>`:'';
  }
  function dismissOriginalView(){
    if(!originalView)return;
    const {bar,panel,previousTop,undoLabels}=originalView;
    undoLabels.forEach(undo=>undo());
    originalView=null;bar.remove();panel.classList.remove('lj-original-panel');
    panel.scrollTop=previousTop;
    D.body.classList.remove('lj-original-view');
  }
  async function openOriginalView(key,trigger){
    if(originalView||!Object.hasOwn(screenConfig,key))return;
    const panel=$(screenConfig[key].source);
    if(!panel)throw Error('酒馆还没有加载这个面板。');
    const editingWorld=key==='worlds'&&route==='world-editor';
    if(editingWorld&&worldDirty)throw Error('请先保存当前世界书的修改，再打开整本书管理。');
    const bar=D.createElement('header'),returnButton=D.createElement('button'),heading=D.createElement('strong');
    const origin=dialogName(visibleDialog())||pageName(), revision=navigationRevision;
    const session={key,panel,bar,trigger,previousTop:panel.scrollTop,editingWorld,revision,undoLabels:[]};
    originalView=session;
    bar.className='lj-original-toolbar';returnButton.type='button';
    returnButton.textContent='‹ 返回'+origin;
    heading.textContent=editingWorld?worldName:(key==='api'?'当前连接的服务商选项':screenConfig[key].name);
    bar.append(returnButton,heading);
    returnButton.addEventListener('click',()=>void returnFromOriginalView());
    try{
      if(editingWorld){
        const host=await loadRoleWorlds();
        const select=panel.querySelector('#world_editor_select');
        const opt=[...(select?.options||[])].find(o=>o.value!==''&&o.text===worldName);
        if(!opt||!host?.showWorldEditor)throw Error('暂时无法打开这本世界书。');
        if(originalView!==session||revision!==navigationRevision)return;
        select.value=opt.value;
        await host.showWorldEditor(worldName);
      }
      if(originalView!==session||revision!==navigationRevision)return;
      D.body.append(bar);panel.classList.add('lj-original-panel');D.body.classList.add('lj-original-view');
      panel.scrollTop=0;returnButton.focus({preventScroll:true});
      if(editingWorld){
        const labels={world_popup_name_button:'重命名这本书',world_duplicate:'复制整本书',world_popup_delete:'删除整本书',world_backfill_memos:'用关键词补全空标题',world_apply_current_sorting:'把当前排序写入条目顺序',world_popup_new:'新增条目',OpenAllWIEntries:'展开全部条目',CloseAllWIEntries:'收起全部条目',world_import_button:'导入世界书',world_popup_export:'下载世界书'};
        for(const [id,label] of Object.entries(labels)){
          const control=D.getElementById(id);if(!panel.contains(control))continue;
          const attrs=['aria-label','role','tabindex'],prior=attrs.map(a=>control.getAttribute(a));
          control.dataset.ljActionName=label;
          control.setAttribute('aria-label',label);control.setAttribute('role','button');control.tabIndex=0;
          const activate=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();control.click();}};
          control.addEventListener('keydown',activate);
          session.undoLabels.push(()=>{
            delete control.dataset.ljActionName;control.removeEventListener('keydown',activate);
            attrs.forEach((a,i)=>prior[i]===null?control.removeAttribute(a):control.setAttribute(a,prior[i]));
          });
        }
        panel.querySelector('#world_popup')?.scrollIntoView({block:'start'});
      }
      if(key==='extensions' && workspaceTab!=='已安装扩展'){
        const heading=[...panel.querySelectorAll('.inline-drawer-header')].find(h=>tidy(h.textContent)===workspaceTab);
        if(heading){
          const drawer=heading.closest('.inline-drawer'),body=drawer?.querySelector(':scope > .inline-drawer-content');
          if(body&&W.getComputedStyle(body).display==='none')heading.click();
          heading.scrollIntoView({block:'start'});
        }
      }
    }finally{if(!bar.isConnected&&originalView===session)dismissOriginalView();}
  }
  async function returnFromOriginalView(){
    const session=originalView;
    if(!session||session.returning)return;
    session.returning=true;
    try{
      if(session.editingWorld){
        const selectedOption=session.panel.querySelector('#world_editor_select')?.selectedOptions[0];
        const name=selectedOption?.value?selectedOption.text:'';
        const data=name&&await ctx().loadWorldInfo(name);
        if(originalView!==session)return;
        if(data){
          if(worldName!==name){worldSearch='';worldTab='内容';worldUid='';}
          worldName=name;worldDraft=JSON.parse(JSON.stringify(data));worldDirty=false;
          if(!Object.hasOwn(worldDraft.entries||{},worldUid))worldUid=String(Object.keys(worldDraft.entries||{})[0]||'');
        }else{
          dismissOriginalView();await backPage();return;
        }
      }
      dismissOriginalView();
      render();visibleDialog()?.dispatchEvent(new W.Event('lj-resume'));
      if(session.trigger?.isConnected)session.trigger.focus({preventScroll:true});
      else (root.querySelector('[data-action="original-options"]')||root.querySelector('[data-action="page-back"]'))?.focus({preventScroll:true});
    }catch(error){dismissOriginalView();toast(error.message);render();}
  }
  async function checkExtensionVersion(button){
    const item=extensionCatalog?.find(row=>row.name===button.dataset.name);
    if(!item||!item.name.startsWith('third-party/')||button.disabled)return;
    const args={extensionName:item.name.slice('third-party/'.length),global:item.type==='global'};
    button.disabled=true;
    const revision=navigationRevision,tab=workspaceTab;
    try{
      const data=await post('/api/extensions/version',args);
      if(revision!==navigationRevision||workspaceTab!==tab||disposed)return;
      const available=Boolean(data.currentCommitHash && data.isUpToDate===false);
      const status=!data.currentCommitHash?'这份扩展没有可比较的安装版本。':(available?'有新版本可以安装。':'当前已经是最新版本。');
      const layer=modal('检查扩展更新',`<strong>${escapeHtml(item.display_name||item.name)}</strong><p role="status">${status}</p>${available?'<button type="button" class="lj-primary" data-install-update>安装更新</button>':''}`,'460px');
      const install=layer.querySelector('[data-install-update]');
      if(install)install.onclick=async()=>{
        if(install.disabled)return;install.disabled=true;
        const message=layer.querySelector('[role="status"]');
        try{
          const result=await post('/api/extensions/update',args);
          if(!result.shortCommitHash)throw Error('酒馆未返回安装结果，请重新检查版本。');
          message.textContent=result.isUpToDate?'当前已经是最新版本。':'更新已安装，刷新酒馆后生效。';install.remove();extensionCatalog=null;
        }catch(error){message.textContent='安装失败。'+error.message;install.disabled=false;}
      };
    }finally{button.disabled=false;}
  }

    let worldDraft=null,worldName='',worldUid='',worldSearch='',worldTab='内容',worldDirty=false;
  const worldLabels={
    uid:'条目编号',key:'主要关键词',keysecondary:'辅助关键词',comment:'条目名称',content:'发给模型的设定',constant:'每次都使用',vectorized:'按意思相近的内容触发',selective:'同时检查辅助关键词',selectiveLogic:'辅助关键词要满足什么条件',
    addMemo:'添加备注',order:'插入顺序',position:'把这条设定放在哪里',disable:'停用这条设定',ignoreBudget:'超过世界书长度上限时仍使用',excludeRecursion:'其他条目不能触发本条',preventRecursion:'本条不能触发其他条目',
    matchPersonaDescription:'也在用户面具中找关键词',matchCharacterDescription:'也在角色设定中查找',matchCharacterPersonality:'也在角色性格中查找',matchCharacterDepthPrompt:'也在角色提示词中查找',matchScenario:'也在故事背景中查找',matchCreatorNotes:'也在作者备注中查找',
    delayUntilRecursion:'等待其他条目先触发的层级',probability:'触发机会（%）',useProbability:'按设定的概率使用',depth:'距最新消息的条数',outletName:'自定义插入位置的名称',group:'同组只选一条时使用的组名',groupOverride:'优先选用本条',groupWeight:'同组抽选时的权重',
    scanDepth:'查找最近多少条消息',caseSensitive:'英文关键词区分大小写',matchWholeWords:'只匹配完整单词',useGroupScoring:'同组优先选命中关键词较多的条目',automationId:'供自动操作识别的名字',role:'以谁的身份发送',
    sticky:'触发后持续多少条消息',cooldown:'再次触发前要隔多少条消息',delay:'聊天至少有多少条消息才能触发',characterFilter:'限定可用的角色与标签',triggers:'哪些聊天操作可以触发',
  };
  const worldChoices={
    selectiveLogic:[[0,'至少有一个辅助词出现'],[1,'至少有一个辅助词未出现'],[2,'所有辅助词都未出现'],[3,'所有辅助词都出现']],
    position:[[0,'角色设定之前'],[1,'角色设定之后'],[2,'作者注释之前'],[3,'作者注释之后'],[4,'插入聊天记录'],[5,'对话示例之前'],[6,'对话示例之后'],[7,'由模板指定的位置']],
    role:[[0,'系统指令'],[1,'用户发言'],[2,'AI 发言']],
  };
  const worldTriggerNames={normal:'正常发送消息',continue:'续写',impersonate:'让 AI 代写用户发言',swipe:'生成另一个回复版本',regenerate:'重新生成当前回复',quiet:'后台生成'};
  const worldHints={
    key:'聊天里出现任意一个主要关键词，就会检查这条设定。每行填一个词。',
    keysecondary:'开启辅助关键词检查后，还需满足所选条件。每行填一个词。',
    content:'条目生效时，这段文字会随聊天发给模型。',
    depth:'在聊天记录中插入时使用。填 0 放在最新消息之后，填 1 放在最新消息之前。',
    delayUntilRecursion:'填 0 表示无需等待。大于 0 时，只在后续查找中检查，数值小的层级先检查。',
    vectorized:'需要启用支持世界书的向量检索扩展。',
    groupWeight:'同组随机挑选时，数字越大，被选中的机会越高。',
    outletName:'插入位置选“由模板指定的位置”时使用，与模板调用的名称相同。',
  };
  const worldDefaults={key:[],keysecondary:[],comment:'新条目',content:'',constant:false,vectorized:false,selective:true,selectiveLogic:0,addMemo:false,order:100,position:0,disable:false,ignoreBudget:false,excludeRecursion:false,preventRecursion:false,matchPersonaDescription:false,matchCharacterDescription:false,matchCharacterPersonality:false,matchCharacterDepthPrompt:false,matchScenario:false,matchCreatorNotes:false,delayUntilRecursion:0,probability:100,useProbability:true,depth:4,outletName:'',group:'',groupOverride:false,groupWeight:100,scanDepth:null,caseSensitive:null,matchWholeWords:null,useGroupScoring:null,automationId:'',role:0,sticky:null,cooldown:null,delay:null,triggers:[]};
  async function openWorld(name){
    const revision=navigationRevision,origin=capturePage();
    const data=await ctx().loadWorldInfo(name);if(revision!==navigationRevision)return;if(!data)throw Error('无法读取世界书');
    worldDraft=JSON.parse(JSON.stringify(data));worldName=name;worldUid=String(Object.keys(worldDraft.entries||{})[0]||'');worldSearch='';worldTab='内容';worldDirty=false;navigate('world-editor',origin);
  }
  async function saveWorldDraft(){if(!worldDraft||!worldName)return;await ctx().saveWorldInfo(worldName,JSON.parse(JSON.stringify(worldDraft)),true);worldDirty=false;toast('世界书已保存');}
  function worldPropertyField(key,value){
    const label=Object.hasOwn(worldLabels,key)?worldLabels[key]:key;
    const attr=`data-world-property="${escapeHtml(key)}" aria-label="${escapeHtml(label)}"`;
    const heading=`<div><label>${escapeHtml(label)}</label>${worldHints[key]?`<p>${escapeHtml(worldHints[key])}</p>`:''}</div>`;
    const field=(control,classes='')=>`<div class="lj-field ${classes}">${heading}${control}</div>`;
    const choiceField=(choices,type)=>{
      const current=value==null?'':String(value);
      const choicesWithCurrent=choices.some(([v])=>String(v)===current)?choices:[...choices,[current,`原有设置（${current}）`]];
      return field(`<select ${attr} data-value-type="${type}">${choicesWithCurrent.map(([v,name])=>`<option value="${escapeHtml(v)}" ${String(v)===current?'selected':''}>${escapeHtml(name)}</option>`).join('')}</select>`);
    };
    if(Object.hasOwn(worldChoices,key))return choiceField(worldChoices[key],'number');
    if(['caseSensitive','matchWholeWords','useGroupScoring'].includes(key))return choiceField([['','跟随全局设置'],['true','开启'],['false','关闭']],'optional-boolean');
    if(key==='triggers'&&Array.isArray(value)){
      const known=Object.keys(worldTriggerNames),triggers=[...known,...value.filter(v=>!known.includes(v))];
      return field(`<div><small class="lj-muted">全部留空时，任何聊天操作都可以触发。</small><div class="lj-form-actions">${triggers.map(v=>`<label><input type="checkbox" data-world-property="triggers" data-value-type="trigger" value="${escapeHtml(v)}" ${value.includes(v)?'checked':''}> ${escapeHtml(Object.hasOwn(worldTriggerNames,v)?worldTriggerNames[v]:v)}</label>`).join('')}</div></div>`,'lj-field-wide');
    }
    if(['scanDepth','sticky','cooldown','delay'].includes(key))return field(`<input ${attr} type="number" min="0" step="1" data-value-type="number" placeholder="${key==='scanDepth'?'跟随全局设置':'不设置'}" value="${escapeHtml(value)}">`);
    if(typeof value==='boolean')return field(`<label class="lj-switch"><input type="checkbox" ${attr} ${value?'checked':''}><span></span></label>`,'lj-field-switch');
    if(Array.isArray(value))return field(`<textarea ${attr} rows="2" data-value-type="array">${escapeHtml(value.join('\n'))}</textarea>`,'lj-field-wide');
    if(value!==null&&typeof value==='object')return field(`<textarea ${attr} rows="5" data-value-type="object">${escapeHtml(JSON.stringify(value,null,2))}</textarea>`,'lj-field-wide');
    if(key==='content')return field(`<textarea ${attr} rows="18">${escapeHtml(value)}</textarea>`,'lj-field-wide');
    if(typeof value==='number')return field(`<input ${attr} type="number" data-value-type="number" value="${escapeHtml(value)}">`);
    return field(`<input ${attr} type="text" value="${escapeHtml(value)}">`);
  }
  function updateWorldProperty(source){
    const entry=worldDraft?.entries?.[worldUid];
    if(!entry)return;
    const key=source.dataset.worldProperty,type=source.dataset.valueType;
    let value=source.value;
    if(type==='trigger'){
      const triggers=new Set(entry[key]||[]);
      if(source.checked)triggers.add(value);else triggers.delete(value);
      value=[...triggers];
    }else if(type==='optional-boolean')value=value===''?null:value==='true';
    else if(type==='number')value=value===''?null:Number(value);
    else if(type==='array')value=value.split('\n').map(x=>x.trim()).filter(Boolean);
    else if(type==='object'){
      try{value=JSON.parse(value);source.setCustomValidity('');}
      catch(_){source.setCustomValidity('请检查括号、引号和逗号是否完整');return;}
    }else if(source.type==='checkbox')value=source.checked;
    entry[key]=value;
    worldDirty=true;
  }
  function worldEditor(){
    if(!worldDraft)return '<div class="lj-empty">请选择世界书</div>';
    const entries=Object.values(worldDraft.entries||{}).sort((a,b)=>Number(b.order)-Number(a.order)||Number(a.uid)-Number(b.uid));
    const entry=worldDraft.entries?.[worldUid],basic=['comment','content','key','keysecondary','constant','vectorized','disable','selective','selectiveLogic','position','order','depth','role'];
    const keys=worldTab==='内容'?['comment','content','key','keysecondary']:worldTab==='触发规则'?basic.filter(k=>!['comment','content','key','keysecondary'].includes(k)):Object.keys({...worldDefaults,...entry}).filter(k=>k!=='uid'&&!basic.includes(k));
    return title(escapeHtml(worldName),`<button class="lj-soft" data-action="original-options" data-panel="worlds">管理整本书与条目排序</button><button class="lj-soft" data-action="world-export">导出</button><button class="lj-primary" data-action="world-save">保存世界书</button>`)+`<div class="lj-world-workspace"><aside class="lj-entry-nav"><div class="lj-row lj-space"><h3>条目 ${entries.length}</h3><button class="lj-iconbutton" data-action="world-add-entry" aria-label="新建条目">${icon('plus')}</button></div><input id="lj-world-search" type="search" placeholder="搜索条目" value="${escapeHtml(worldSearch)}" aria-label="搜索条目"><div id="lj-world-entries">${entries.filter(e=>`${e.comment} ${e.key?.join(' ')} ${e.content}`.toLowerCase().includes(worldSearch.toLowerCase())).map(e=>`<button class="lj-entry-link ${String(e.uid)===worldUid?'active':''}" data-action="world-entry" data-id="${e.uid}"><span class="lj-entry-dot ${e.disable?'off':''}"></span><div><strong>${escapeHtml(e.comment||'未命名条目')}</strong><small>${escapeHtml(e.constant?'每次都使用':e.vectorized?'按意思触发':(e.key||[]).join(' / ')||'关键词')}</small></div></button>`).join('')}</div></aside><section class="lj-entry-editor"><div class="lj-tabs">${['内容','触发规则','高级设置'].map(t=>`<button class="${worldTab===t?'active':''}" data-action="world-tab" data-tab="${t}">${t}</button>`).join('')}</div>${entry?`<div class="lj-form-grid">${keys.map(k=>worldPropertyField(k,entry[k]??worldDefaults[k])).join('')}</div><div class="lj-form-actions"><button class="lj-soft" data-action="world-copy-entry">复制条目</button><button class="lj-soft" data-action="world-remove-entry">删除条目</button></div>`:'<div class="lj-empty">创建第一个条目</div>'}</section></div>`;
  }
  let worldHost=null, worldHostRequest;
  function loadRoleWorlds(){
    if(!worldHostRequest){
      worldHostRequest=(frame===W?import('/scripts/world-info.js'):W.Function('return import("/scripts/world-info.js")')()).then(host=>{
        worldHost=host;if(!disposed && route==='chat' && profileTab==='设置')render();
        return host;
      }).catch(()=>{worldHostRequest=null;return null;});
    }
    return worldHostRequest;
  }
  function worldFile(c){return c.avatar.replace(/\.[^/.]+$/,'');}
  function extraBooks(c){return worldHost?.world_info?.charLore?.find(x=>x.name===worldFile(c))?.extraBooks||[];}
  function roleBooks(c){
    const books=new Map();
    function add(name,source){if(!name)return;const origins=books.get(name)||[];if(!origins.includes(source))origins.push(source);books.set(name,origins);}
    add(c.data?.extensions?.world,'角色主书');
    for(const name of extraBooks(c))add(name,'额外角色书');
    add(ctx().chatMetadata?.world_info,'仅此存档');
    add(ctx().powerUserSettings?.persona_description_lorebook,'当前面具');
    return [...books];
  }
  async function importRoleBook(avatar){
    const c=selected();if(c?.avatar!==avatar||!c.data?.character_book)throw Error('角色已经切换，请重新打开角色侧栏。');
    const host=await loadRoleWorlds(),id=ctx().characterId;
    if(!host||selected()?.avatar!==avatar)throw Error('暂时无法读取这张卡的内置世界书。');
    const names=new Set(worldBookNames()),base=c.data.character_book.name||c.name+'的世界书';
    let name=base,n=0;
    while(names.has(name))name=base+'（'+c.name+(++n===1?'':' '+n)+'）';
    await ctx().saveWorldInfo(name,host.convertCharacterBook(c.data.character_book),true);
    await ctx().updateWorldInfoList();
    if(ctx().characters[id]?.avatar!==avatar)throw Error('已导入世界书，请在原角色页选择绑定。');
    await ctx().writeExtensionField(Number(id),'world',name);
    toast('已导入《'+name+'》并绑定到'+c.name);render();
  }
  async function worldBindingModal(){
    const c=selected();if(!c){toast('请从角色聊天右侧的设置中管理此角色的世界书。');return;}
    const key=pairScope(),host=await loadRoleWorlds();if(selected()?.avatar!==c.avatar||pairScope()!==key)return;
    const primary=c.data?.extensions?.world||'',chat=ctx().chatMetadata.world_info||'',extra=extraBooks(c);
    const names=[...new Set([...worldBookNames(),primary,chat,...extra].filter(Boolean))];
    const options=current=>names.map(n=>`<option ${current===n?'selected':''}>${escapeHtml(n)}</option>`).join('');
    const form=modal('管理角色和存档的世界书',`<h2>${escapeHtml(c.name)}</h2><label>角色主书（此角色的所有存档）</label><select id="lj-bind-primary"><option value="">不使用主书</option>${options(primary)}</select>
      ${host?.charSetAuxWorlds?`<details><summary>额外角色书（已选 ${extra.length} 本）</summary>${names.map(n=>`<label class="lj-extra-book"><input type="checkbox" data-extra-book value="${escapeHtml(n)}" ${extra.includes(n)?'checked':''}> ${escapeHtml(n)}</label>`).join('')}</details>`:''}
      <label>仅这个聊天存档使用的书</label><select id="lj-bind-chat"><option value="">不另加世界书</option>${options(chat)}</select><div class="lj-form-actions"><button class="lj-primary" data-action="world-bind-save">保存绑定</button></div>`,'560px');
    form.dataset.worldAvatar=c.avatar;form.dataset.worldScope=key;
  }
  async function saveWorldBinding(){
    const form=visibleDialog(),c=selected(),id=ctx().characterId,context=ctx(),meta=context.chatMetadata,scope=pairScope();
    if(!form||!c||form.dataset.worldAvatar!==c.avatar||form.dataset.worldScope!==scope)throw Error('聊天已经切换，请重新选择世界书。');
    const primary=form.querySelector('#lj-bind-primary').value,chat=form.querySelector('#lj-bind-chat').value;
    const extras=[...form.querySelectorAll('[data-extra-book]:checked')].map(x=>x.value);
    if(primary!==(c.data?.extensions?.world||''))await context.writeExtensionField(Number(id),'world',primary);
    if(scope!==pairScope()||selected()?.avatar!==c.avatar)throw Error('聊天已切换，请回到原存档核对绑定。');
    if(form.querySelector('[data-extra-book]'))worldHost?.charSetAuxWorlds(worldFile(c),extras);
    if(chat!==(meta.world_info||'')){meta.world_info=chat;await context.saveChat();}
    closeDialog(form);toast('已保存角色和此存档的世界书');render();
  }
  function newWorldModal(){modal('创建或导入世界书',`<label>世界书名称</label><input id="lj-world-new-name" placeholder="为这个世界起个名字"><div class="lj-form-actions"><button class="lj-primary" data-action="world-create">创建世界书</button><button class="lj-soft" data-action="world-import">导入世界书文件</button></div><p class="lj-muted">支持 JSON、.lorebook 和内含世界书的 PNG 图片。</p>`,'520px');}
  function importWorldFile(layer){
    chooseLibraryFile('.json,.lorebook,.png',async file=>{
      const host=await loadRoleWorlds();
      if(!host?.importWorldInfo)throw Error('世界书导入功能还没有加载，请稍后重试。');
      if(!layer.isConnected)return;
      const select=$('#world_editor_select');
      // The host returns undefined on both success and failure. A successful import
      // rebuilds the option list and selects the imported book.
      const previous=new Set(select?.options||[]);
      const result=await host.importWorldInfo(file);
      if(result===false||!layer.isConnected)return;
      const selectedOption=select?.selectedOptions[0];
      if(selectedOption?.value && !previous.has(selectedOption)){
        closeDialog(layer);
        await openWorld(selectedOption.text);
      }else render();
    });
  }

    let editingStoryIndex=0;
  function storyResources(){const c=selected();return c?[c.first_mes||c.data?.first_mes||'',...(c.data?.alternate_greetings||[])]:[];}
  function storyMeta(index){const c=selected();return c?(preferences().stories?.[c.avatar]?.[index]||{}):{};}
  function storyCards(){
    const greetings=storyResources();
    return `<div class="lj-story-grid">${greetings.map((g,i)=>{const meta=storyMeta(i);return `<article class="lj-story-card"><div class="lj-story-cover"><img src="${escapeHtml(meta.background||avatar(selected()))}" alt="故事封面"><span>${escapeHtml(openingLabel(i,greetings.length,meta.name))}</span></div><div class="lj-resource-body"><p>${escapeHtml(plain(g).slice(0,220))}</p><div class="lj-row lj-space"><button class="lj-soft" data-action="story-edit" data-index="${i}">编辑</button><button class="lj-primary" data-action="story-start" data-index="${i}">开始聊天</button></div></div></article>`;}).join('')}</div><div class="lj-form-actions"><button class="lj-soft" data-action="story-add">添加开场故事</button></div>`;
  }
  async function showStories(){if(!selected())return;await ctx().unshallowCharacter(ctx().characterId);modal('开场故事',storyCards(),'900px');}
  function editStory(index){
    editingStoryIndex=index;const meta=storyMeta(index),text=storyResources()[index]||'',names=worldBookNames();
    modal('编辑开场故事',`<div class="lj-editor-fields"><label>故事名称</label><input id="lj-story-name" value="${escapeHtml(meta.name||openingLabel(index,storyResources().length))}"><label>开场白</label><textarea id="lj-story-text" rows="12">${escapeHtml(text)}</textarea><label>此故事的聊天世界书</label><select id="lj-story-world"><option value="">沿用角色绑定</option>${names.map(n=>`<option ${n===meta.world?'selected':''}>${escapeHtml(n)}</option>`).join('')}</select><label>故事背景图地址</label><input id="lj-story-background" value="${escapeHtml(meta.background||'')}" placeholder="留空使用角色图"><label>故事阅读样式 CSS</label><textarea id="lj-story-css" rows="4" placeholder="选填，留空沿用当前角色的美化">${escapeHtml(meta.css||'')}</textarea><div class="lj-form-actions"><button class="lj-primary" data-action="story-save">保存故事</button></div></div>`);
  }
  async function saveStory(){
    const c=selected(),index=editingStoryIndex,greetings=storyResources(),text=$('#lj-story-text').value;
    if(index===0)greetings[0]=text;else greetings[index]=text;
    const meta={...storyMeta(index),date:new Date().toISOString(),name:$('#lj-story-name').value,world:$('#lj-story-world').value,background:$('#lj-story-background').value,css:$('#lj-story-css').value};
    await post('/api/characters/merge-attributes',{avatar:c.avatar,data:{first_mes:greetings[0],alternate_greetings:greetings.slice(1)}});
    preferences().stories||={};preferences().stories[c.avatar]||={};preferences().stories[c.avatar][index]=meta;await persist(true);
    await getOneCharacter(c.avatar);closeDialog();render();
    const parent=visibleDialog(),grid=parent?.querySelector('.lj-story-grid');
    if(grid)parent.querySelector('.lj-modal-content').innerHTML=(dialogName(parent)==='重启对话'?'<p>选择一个开场白，开始新的存档。</p>':'')+storyCards();toast('故事与全部开场白已保存');
  }
  async function startStory(index){
    if(openingStory)return;
    openingStory=true;
    try {
    if(ctx().streamingProcessor){toast('请先等待当前回复完成');return;}
    const greetings=storyResources(),meta=storyMeta(index);
    if(!greetings[index]){toast('这个开场故事还没有内容');return;}
    portal.querySelector('.lj-modal-backdrop')?.remove();
    if(hasUserMessage(ctx().chat))await ctx().executeSlashCommandsWithOptions('/newchat');
    const actualIndex=greetings[0]?index:index-1;
    const message=ctx().chat[0];
    if(message?.swipes?.length&&actualIndex>=0&&actualIndex<message.swipes.length)await ctx().swipe.to(null,'right',{source:'slash_command',forceMesId:0,forceSwipeId:actualIndex,forceDuration:0});
    ctx().chatMetadata[KEY]||={memory:{short:'',long:'',permanent:'',enabled:false}};
    ctx().chatMetadata[KEY].storyIndex=index;
    delete ctx().chatMetadata.world_info;
    delete ctx().chatMetadata[KEY].background;
    if(meta.world)ctx().chatMetadata.world_info=meta.world;
    if(meta.background)ctx().chatMetadata[KEY].background={...bgSettings(),url:meta.background};
    await ctx().saveChat();navigate('chat');applyStoryStyle();toast('已选择 '+(meta.name||openingLabel(index,storyResources().length)));
    } finally {openingStory=false;}
  }
  function applyStoryStyle(){
    const old=D.getElementById('lj-story-style');
    const index=ctx()?.chatMetadata?.[KEY]?.storyIndex;
    const css=route==='chat' && index!==undefined && selected() ? storyMeta(index).css : '';
    if(!css){old?.remove();return;}
    if(old?.textContent===css)return;
    const s=old||D.createElement('style');s.id='lj-story-style';s.textContent=css;if(!old)D.head.append(s);
  }
  function composeMenu(){
    beginChatTools();
    const items=[['chat-continue','续写'],['chat-regenerate','分支重说最后一条角色回复'],['greetings','开场故事'],['chat-files','发送图片或文件'],['chat-native-options','更多聊天操作']];
    modal('聊天操作',`<div class="lj-list">${items.map(([a,n])=>`<button class="lj-setting-card" data-action="${a}"><strong>${n}</strong></button>`).join('')}</div>`,'420px');
  }
  function chatOptions(){
    const classic=$('#options'),extensions=$('#extensionsMenu');
    // These native actions already have named message, archive or composer controls.
    const exclude=['option_new_bookmark','option_start_new_chat','option_select_chat','option_continue','option_regenerate'];
    const content=[classic,extensions].filter(Boolean).map(c=>structuredControls(c,{exclude})).join('');
    modal('更多聊天操作','<div data-chat-commands>'+content+'</div>','800px');
  }
  function openingLabel(i,total,name=''){
    const number=total>1?'开场白'+(i+1):'开场白';
    return name && !/^(?:开场故事|开场白)\s*\d*$/.test(name)?number+' · '+name:number;
  }
  const homeBannerFilename='jianshe-home-cover.webp';
  let savedBannerUrl='';
  async function saveHomeBanner(blob) {
    const data=new W.FormData();
    data.append('avatar',blob,homeBannerFilename);
    const headers={...ctx().getRequestHeaders()};
    delete headers['Content-Type'];delete headers['content-type'];
    const response=await W.fetch('/api/backgrounds/upload',{method:'POST',headers,body:data});
    if(!response.ok || (await response.text()).trim()!==homeBannerFilename) throw Error('横幅保存失败，请重试。');
    savedBannerUrl='/backgrounds/'+homeBannerFilename+'?v='+Date.now();
    preferences().homeBanner=savedBannerUrl;
    await persist();
  }
  // All positions are in source pixels. The display and the exported image use this same window.
  function bannerCropWindow(width,height,zoom=1,x=0.5,y=0.5,previous=null,fromX=x,fromY=y){
    const fitWidth=Math.min(width,height*3.5);
    const scale=Math.max(1,Math.min(5,zoom));
    const w=fitWidth/scale,h=w/3.5;
    const anchorX=previous?previous.left+previous.w*fromX:width/2;
    const anchorY=previous?previous.top+previous.h*fromY:height/2;
    return {left:Math.max(0,Math.min(width-w,anchorX-w*x)),top:Math.max(0,Math.min(height-h,anchorY-h*y)),w,h,scale};
  }
  function bannerContacts(points,frame){
    const [a,b=a]=points;
    return {x:((a.x+b.x)/2-frame.left)/frame.width,y:((a.y+b.y)/2-frame.top)/frame.height,
      distance:Math.hypot(a.x-b.x,a.y-b.y)};
  }
  let bannerDecode=0;
  async function uploadHomeBanner(file,menu){
    if(!menu?.isConnected)return;
    const revision=++bannerDecode, image=new W.Image(), url=W.URL.createObjectURL(file);
    try{
      image.src=url;
      await image.decode();
    }catch{throw Error('无法读取图片，请重新选图。');}
    finally{W.URL.revokeObjectURL(url);}
    if(revision!==bannerDecode || !menu.isConnected)return;
    menu.remove();
    const layer=modal('裁剪首页横幅',`<div class="lj-crop-frame"><canvas width="1050" height="300" tabindex="0" aria-label="裁剪预览，方向键可移动图片"></canvas></div>
      <p class="lj-muted lj-small">拖动图片选择范围。双指、滚轮或滑杆可缩放。</p>
      <label class="lj-crop-zoom">缩放<input type="range" min="100" max="500" step="1" value="100"><output>100%</output></label>
      <p role="status"></p><div class="lj-crop-footer"><button type="button" class="lj-soft" data-action="close-modal">取消</button><button type="button" class="lj-primary" data-apply>确认</button></div>`,'760px');
    const preview=layer.querySelector('canvas'), slider=layer.querySelector('input'), display=layer.querySelector('output');
    const width=image.naturalWidth,height=image.naturalHeight, contacts=new Map();
    let crop=bannerCropWindow(width,height),saving=false;
    function draw(canvas){
      canvas.getContext('2d').drawImage(image,crop.left,crop.top,crop.w,crop.h,0,0,canvas.width,canvas.height);
    }
    function update(scale,x=0.5,y=0.5,fromX=x,fromY=y){
      if(saving)return;
      crop=bannerCropWindow(width,height,scale,x,y,crop,fromX,fromY);
      slider.value=String(Math.round(crop.scale*100));display.textContent=slider.value+'%';
      draw(preview);
    }
    draw(preview);
    slider.oninput=()=>update(Number(slider.value)/100);
    preview.onpointerdown=e=>{
      if(e.button!==0 || contacts.size>=2 || saving)return;
      e.preventDefault();preview.setPointerCapture(e.pointerId);
      contacts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    };
    preview.onpointermove=e=>{
      if(!contacts.has(e.pointerId))return;
      const frame=preview.getBoundingClientRect();
      const before=bannerContacts([...contacts.values()],frame);
      contacts.set(e.pointerId,{x:e.clientX,y:e.clientY});
      const after=bannerContacts([...contacts.values()],frame);
      const ratio=before.distance>1 && after.distance>1?after.distance/before.distance:1;
      update(crop.scale*ratio,after.x,after.y,before.x,before.y);
    };
    preview.onpointerup=preview.onpointercancel=preview.onlostpointercapture=e=>contacts.delete(e.pointerId);
    preview.addEventListener('wheel',e=>{
      e.preventDefault();
      const frame=preview.getBoundingClientRect(), point=bannerContacts([{x:e.clientX,y:e.clientY}],frame);
      const unit=e.deltaMode===1?16:e.deltaMode===2?frame.height:1;
      update(crop.scale*Math.exp(-e.deltaY*unit*0.002),point.x,point.y);
    },{passive:false});
    preview.onkeydown=e=>{
      const moves={ArrowLeft:[-.03,0],ArrowRight:[.03,0],ArrowUp:[0,-.03],ArrowDown:[0,.03]};
      if(!moves[e.key])return;
      e.preventDefault();const [dx,dy]=moves[e.key];update(crop.scale,.5+dx,.5+dy,.5,.5);
    };
    layer.querySelector('[data-apply]').onclick=async()=>{
      if(saving)return;
      saving=true;
      const controls=[...layer.querySelectorAll('button,input')],status=layer.querySelector('[role=status]');
      controls.forEach(el=>el.disabled=true);status.textContent='正在保存横幅…';
      try{
        const out=D.createElement('canvas'),units=Math.max(1,Math.round(Math.min(crop.w,2100)/7));
        out.width=units*7;out.height=units*2;draw(out);
        const blob=await new Promise(resolve=>out.toBlob(resolve,'image/webp',0.92));
        if(!blob)throw Error('图片裁剪失败，请重新选图。');
        await saveHomeBanner(blob);
        if(layer.isConnected)closeDialog(layer);
        render();toast('首页横幅已更新');
      }catch(error){status.textContent=error.message;}
      finally{saving=false;controls.forEach(el=>el.disabled=false);}
    };
  }
  function homeBanner(){
    const src=savedBannerUrl||bookCover(preferences().homeBanner);
    return `<section class="lj-single-banner" tabindex="0" role="button" aria-label="更换首页横幅" aria-description="电脑右键或手机长按可更换横幅">${src?`<img src="${escapeHtml(src)}" alt="" draggable="false">`:''}</section>`;
  }
  function bannerMenu(){
    if(visibleDialog())return;
    const overlay=modal('更换首页横幅','<button type="button" class="lj-primary" data-action="home-cover-upload">上传图片</button>','360px');
    overlay.addEventListener('paste',async e=>{
      const file=[...(e.clipboardData?.files||[])].find(f=>f.type.startsWith('image/'));
      const image=(e.clipboardData?.getData('text/plain')||'').trim();
      if(!file && !(image.startsWith('data:image/') && bookCover(image)))return;
      e.preventDefault();
      try {
        await uploadHomeBanner(file||await (await W.fetch(image)).blob(),overlay);
      } catch(error){toast(error.message);}
    });
  }
  function mountBanner(){
    // The per-account background file survives saves from older open Tavern tabs.
    const savedImage=new W.Image();
    const url='/backgrounds/'+homeBannerFilename+'?v='+Date.now();
    savedImage.onload=()=>{
      if(disposed || savedBannerUrl)return;
      savedBannerUrl=url;
      const banner=root.querySelector('.lj-single-banner');
      if(banner)banner.outerHTML=homeBanner();
    };
    savedImage.src=url;
    let timer=0,origin=null;
    const cancel=()=>{W.clearTimeout(timer);timer=0;origin=null;};
    on(root,'contextmenu',e=>{if(e.target.closest('.lj-single-banner')){e.preventDefault();cancel();bannerMenu();}});
    on(root,'pointerdown',e=>{if(e.pointerType==='mouse'||!e.target.closest('.lj-single-banner'))return;cancel();origin=[e.clientX,e.clientY];timer=W.setTimeout(()=>{cancel();bannerMenu();},560);});
    on(root,'pointermove',e=>{if(origin&&Math.hypot(e.clientX-origin[0],e.clientY-origin[1])>10)cancel();});
    for(const event of ['pointerup','pointercancel','scroll'])on(D,event,cancel,true);
    on(root,'keydown',e=>{if(e.target.matches('.lj-single-banner')&&['Enter',' '].includes(e.key)){e.preventDefault();bannerMenu();}});
    listeners.push(cancel);
  }
  const archiveOpenings=new Map();
  async function labelArchiveOpenings(container,list,id){
    const original=ctx().characters?.[id];if(!original || !container?.isConnected)return;
    if(original.shallow)await ctx().unshallowCharacter(id);
    const c=ctx().characters?.[id];if(!c || c.avatar!==original.avatar)return;
    const starts=[c.first_mes||c.data?.first_mes||'',...(c.data?.alternate_greetings||[])];
    if(starts.length<2)return;
    const nodes=[...container.querySelectorAll('[data-file]')];
    for(let i=0;i<list.length;i++){
      if(!container.isConnected)return;
      const f=list[i],node=nodes.find(n=>n.dataset.file===f.file_name);
      if(!node)continue;
      const cacheKey=JSON.stringify([c.avatar,f.file_name,f.last_mes,f.file_size]);
      let idx=f.chat_metadata?.[KEY]?.storyIndex ?? archiveOpenings.get(cacheKey);
      if(idx==null){
        try{
          const data=await post('/api/chats/get',{avatar_url:c.avatar,file_name:chatFile(f.file_name)});
          const first=data?.find(m=>typeof m?.mes==='string');
          if(first && !first.is_user && !first.is_system){
            const text=String(first.mes||'').trim(),slot=first.swipe_id;
            idx=starts.findIndex(t=>t && t.trim()===text);
            if(idx<0 && Array.isArray(first.swipes) && Number.isInteger(slot) && first.swipes.length===starts.filter((v,i)=>i||v).length)idx=slot+(starts[0]?0:1);
          }
          archiveOpenings.set(cacheKey,idx??-1);
        }catch{continue;}
      }
      if(Number.isInteger(idx)&&idx>=0&&idx<starts.length){
        const label=openingLabel(idx,starts.length,preferences().stories?.[c.avatar]?.[idx]?.name);
        const prefix=node.querySelector('[data-archive-opening]');
        if(prefix)prefix.textContent=label+' · ';
      }
    }
  }

    // Active messages remain native Tavern messages. Each inactive node is stored only once.
  // Per-version identifiers live outside "extra": Tavern replaces extra when swiping.
  const branchTag = 'lanjiuBranchVersions';
  let branchBusy = false;

  function branchStore(context = ctx()) {
    context.chatMetadata[KEY] ||= {};
    return context.chatMetadata[KEY].branches ||= { lastSerial:0, parked:[], preferred:{} };
  }

  function branchIdentity() {
    const bytes = new Uint32Array(4);
    W.crypto.getRandomValues(bytes);
    return Array.from(bytes, n => n.toString(16).padStart(8, '0')).join('');
  }

  function branchClone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

  function branchGraph(context = ctx()) {
    if (!context?.chatMetadata || !Array.isArray(context.chat)) return { nodes:[], activeLeafId:null };
    const store = branchStore(context);
    const nodes = new Map(store.parked.map(node => [node.id, {...node, active:false, current:false}]));
    let parentId = null;
    for (let index = 0; index < context.chat.length; index++) {
      const message = context.chat[index];
      const texts = Array.isArray(message.swipes) && message.swipes.length ? message.swipes : [message.mes];
      const selectedSwipe = Math.min(Math.max(Number(message.swipe_id) || 0, 0), texts.length - 1);
      const stamps = message[branchTag] ||= [];
      for (let slot = 0; slot < texts.length; slot++) {
        const stamp = stamps[slot] ||= { id:branchIdentity(), serial:++store.lastSerial };
        store.lastSerial = Math.max(store.lastSerial, stamp.serial);
        const active = slot === selectedSwipe;
        const info = message.swipe_info?.[slot];
        const version = active ? message : {
          ...message, ...(info || {}), extra:info?.extra || {}, mes:texts[slot], swipe_id:slot,
        };
        nodes.set(stamp.id, {
          id:stamp.id, serial:stamp.serial, parentId, index, message:version,
          active, current:active && index === context.chat.length - 1,
        });
      }
      parentId = stamps[selectedSwipe].id;
    }
    const ordered = [...nodes.values()].sort((a,b) => a.serial - b.serial);
    const graph = {nodes:ordered, activeLeafId:parentId, byId:nodes, children:new Map(), activeAt:new Map()};
    for (const node of ordered) {
      if (!graph.children.has(node.parentId)) graph.children.set(node.parentId, []);
      graph.children.get(node.parentId).push(node);
      if (node.active) graph.activeAt.set(node.index, node);
    }
    return graph;
  }

  function branchVariants(index, graph = branchGraph()) {
    const node = graph.activeAt?.get(index);
    if (!node) return { ids:[], current:null };
    return {ids:graph.children.get(node.parentId).map(v => v.id), current:node.id};
  }

  function branchSubtree(graph, id) {
    const found = new Set();
    const stack = [id];
    while (stack.length) {
      const next = stack.pop();
      if (found.has(next)) continue;
      found.add(next);
      for (const child of graph.children.get(next) || []) stack.push(child.id);
    }
    return found;
  }

  function branchDeleteTargets(index) {
    const graph = branchGraph(), target = graph.activeAt?.get(index);
    return target && (index > 0 || target.message.is_user) ? [...branchSubtree(graph, target.id)] : [];
  }

  function branchPath(graph, id, preferred, excluded = new Set()) {
    const path = [], seen = new Set();
    let node = graph.byId.get(id);
    while (node && !seen.has(node.id) && !excluded.has(node.id)) {
      path.push(node); seen.add(node.id);
      node = graph.byId.get(node.parentId);
    }
    path.reverse();
    node = path.at(-1);
    while (node) {
      const choices = (graph.children.get(node.id) || []).filter(n => !excluded.has(n.id) && !seen.has(n.id));
      node = choices.find(n => n.id === preferred[node.id]) || choices.find(n => n.active) || choices.at(-1);
      if (node) { path.push(node); seen.add(node.id); }
    }
    return path;
  }

  function branchActivePrefix(graph, length) {
    return Array.from({length}, (_, i) => graph.activeAt.get(i));
  }

  function branchRecord(node) {
    const {id, serial, parentId, index} = node;
    const message = {...node.message};
    const family = message[branchTag]?.length > 1 ? message[branchTag].map(s => s.id) : node.family;
    delete message[branchTag];
    if (Array.isArray(message.swipes)) {
      message.swipes = [message.swipes[message.swipe_id || 0] ?? message.mes];
      message.swipe_info = [{extra:message.extra, send_date:message.send_date, gen_started:message.gen_started, gen_finished:message.gen_finished}];
      message.swipe_id = 0;
    }
    return {id, serial, parentId, index, message, ...(family ? {family} : {})};
  }

  function branchLiveMessage(node, graph, excluded) {
    const record = branchRecord(node);
    const family = (record.family || [node.id]).filter(id => graph.byId.has(id) && !excluded.has(id));
    const members = family.map(id => graph.byId.get(id));
    const message = branchClone(record.message);
    if (members.length > 1 || message.swipes) {
      message.swipes = members.map(n => n.message.swipes?.[n.message.swipe_id || 0] ?? n.message.mes);
      message.swipe_info = members.map(({message:m}) => branchClone({
        extra:m.extra || {}, send_date:m.send_date, gen_started:m.gen_started, gen_finished:m.gen_finished,
      }));
      message.swipe_id = members.findIndex(n => n.id === node.id);
    }
    message[branchTag] = members.map(n => ({id:n.id, serial:n.serial}));
    return message;
  }

  function branchApply(context, graph, path, excluded = new Set()) {
    const store = branchStore(context), selectedIds = new Set(path.map(n => n.id));
    const oldLeaf = graph.byId.get(graph.activeLeafId);
    const memory = context.chatMetadata[KEY].memory;
    if (oldLeaf) {
      oldLeaf.message.extra ||= {};
      oldLeaf.message.extra[KEY] ||= {};
      if (memory) oldLeaf.message.extra[KEY].memory = branchClone(memory);
      oldLeaf.message.extra[KEY].variables = branchClone(context.chatMetadata.variables ?? null);
    }
    for (const node of graph.activeAt.values()) {
      if (node.parentId) store.preferred[node.parentId] = node.id;
    }
    for (const node of path) {
      if (node.parentId) store.preferred[node.parentId] = node.id;
    }
    for (const [key, val] of Object.entries(store.preferred)) {
      if (excluded.has(key) || excluded.has(val)) delete store.preferred[key];
    }
    store.parked = graph.nodes.filter(n => !selectedIds.has(n.id) && !excluded.has(n.id)).map(branchRecord);
    const messages = path.map(n => branchLiveMessage(n, graph, excluded));
    context.chat.splice(0, context.chat.length);
    for (const m of messages) context.chat.push(m);
    const lastWithMemory = messages.slice().reverse().find(m => m.extra?.[KEY]?.memory);
    if (lastWithMemory) context.chatMetadata[KEY].memory = branchClone(lastWithMemory.extra[KEY].memory);
    else delete context.chatMetadata[KEY].memory;
    const variables = messages.slice().reverse().find(m => Object.hasOwn(m.extra?.[KEY] || {}, 'variables'))?.extra[KEY].variables;
    if (variables != null) context.chatMetadata.variables = branchClone(variables);
    else delete context.chatMetadata.variables;
  }

  function branchSession(context = ctx()) {
    const owner = context.groupId != null ? ['group',context.groupId] : ['character',context.characters?.[context.characterId]?.avatar];
    return JSON.stringify([...owner, context.chatId]);
  }

  function branchAssertSession(session) {
    if (branchSession() !== session) throw new Error('聊天已切换，请在原存档里查看结果。');
  }

  async function branchRemote(context) {
    const group = context.groupId != null;
    const data = group
      ? await post('/api/chats/group/get', {id:context.chatId})
      : await post('/api/chats/get', {avatar_url:context.characters[context.characterId].avatar, file_name:context.chatId});
    if (!Array.isArray(data)) throw new Error('未能读取这个聊天存档，请重新打开后再试。');
    const header = data[0]?.chat_metadata;
    return {revision:header?.[KEY]?.branches?.revision, messages:!group || Object.hasOwn(data[0] || {}, 'chat_metadata') ? data.slice(1) : data};
  }

  async function branchSave(session) {
    branchAssertSession(session);
    const context = ctx(), revision = branchIdentity();
    branchStore(context).revision = revision;
    await context.saveChat();
    if ((await branchRemote(context)).revision !== revision) throw new Error('分支保存未确认，请重新打开这个存档后再试。');
    branchAssertSession(session);
  }

  async function branchRedraw(session) {
    const draft = $('#send_textarea')?.value;
    const context = ctx();
    if (context.clearChat && context.printMessages && context.eventSource?.emit) {
      await context.clearChat();
      branchAssertSession(session);
      await context.printMessages();
      await context.eventSource.emit(context.eventTypes.CHAT_CHANGED, context.chatId);
    } else await context.reloadCurrentChat();
    branchAssertSession(session);
    const input = $('#send_textarea');
    if (draft && input && !input.value) {
      input.value = draft;
      input.dispatchEvent(new W.Event('input', {bubbles:true}));
    }
    // Tavern clears extension prompts when redrawing the chat.
    activeMemoryPrompt = null;
    syncMemoryPrompt();
    if (typeof decorateMessages === 'function') decorateMessages();
  }

  function branchRun(operation) {
    const context = ctx();
    const stop = $('#mes_stop');
    if (branchBusy || context?.streamingProcessor || (stop && stop.getClientRects().length)) {
      throw new Error('请等当前回复或分支操作完成。');
    }
    if (!context?.chatId) throw new Error('请先进入一个聊天存档。');
    const session = branchSession(context);
    branchBusy = true;
    const run = async () => {
      const saved = await branchRemote(context);
      branchAssertSession(session);
      const bodyMatches = saved.messages.length === context.chat.length && saved.messages.every((m, i) => {
        const live = context.chat[i];
        const select = Number(m.swipe_id) || 0;
        const storedText = m.mes;
        const opening = i === 0 && !m.is_user && !m.is_system;
        // Tavern expands names in the opening on display, including old cards that only saved the raw greeting.
        const expandNames = text => opening && typeof text === 'string'
          ? text.replace(/\{\{\s*(user|char)\s*\}\}/gi, (match,name) =>
            (name.toLowerCase() === 'user' ? context.name1 : m.name || context.name2) ?? match)
          : text;
        const sameBody = live.mes === storedText || (opening && (
          live.mes === expandNames(storedText) || (storedText?.includes('{{') && live.swipes?.[select] === storedText)
        ));
        const savedTexts = m.swipes?.length ? m.swipes : [storedText];
        const liveTexts = live.swipes?.length ? live.swipes : [live.mes];
        return sameBody && live.name === m.name && Boolean(live.is_user) === Boolean(m.is_user) &&
          Boolean(live.is_system) === Boolean(m.is_system) && (Number(live.swipe_id) || 0) === select &&
          savedTexts.length === liveTexts.length && savedTexts.every((v,k) => v === liveTexts[k] || (opening && expandNames(v) === liveTexts[k]));
      });
      if (saved.revision !== branchStore(context).revision || !bodyMatches) {
        throw new Error('另一页已更新这个存档，或刚刚编辑的消息尚未保存。请稍后重试或刷新。');
      }
      return operation(session);
    };
    return Promise.resolve().then(() => W.navigator?.locks?.request
      ? W.navigator.locks.request('lanjiu-branch-' + session, run) : run()).finally(() => { branchBusy = false; });
  }

  async function branchCommit(session, change) {
    const context = ctx();
    const before = branchClone({chat:context.chat, metadata:context.chatMetadata[KEY]});
    try {
      change();
      await branchSave(session);
    } catch (err) {
      if (branchSession() === session) {
        context.chat.splice(0, context.chat.length);
        for (const m of before.chat) context.chat.push(m);
        context.chatMetadata[KEY] = before.metadata;
      }
      throw err;
    }
    await branchRedraw(session);
  }

  async function branchSwitch(id) {
    return branchRun(async session => {
      const graph = branchGraph(), node = graph.byId.get(id);
      if (!node) throw new Error('找不到这条消息，请重新打开消息树。');
      if (!node.active) {
        const path = branchPath(graph, id, branchStore().preferred);
        await branchCommit(session, () => branchApply(ctx(), graph, path));
      }
      return node.index;
    });
  }

  function branchTarget(index, role, graph) {
    const node = graph.activeAt.get(index);
    if (!node || (index === 0 && !node.message.is_user) || node.message.is_system || Boolean(node.message.is_user) !== (role === 'user')) {
      throw new Error('这条消息无法执行此操作。');
    }
    return node;
  }

  async function branchGenerate(session, type, forceCharacter) {
    const context = ctx(), draftInput = $('#send_textarea');
    const draft = draftInput?.value;
    const readsDraft = type !== 'regenerate' || context.groupId != null;
    if (readsDraft && draftInput) draftInput.value = '';
    try {
      await context.generate(type, {automatic_trigger:true, ...(forceCharacter != null ? {force_chid:forceCharacter} : {})});
    } finally {
      if (readsDraft && draft && branchSession() === session && !draftInput.value) {
        draftInput.value = draft;
        draftInput.dispatchEvent(new W.Event('input', {bubbles:true}));
      }
    }
    branchAssertSession(session);
  }

  function branchRequireModel() {
    if (ctx().onlineStatus === 'no_connection') throw new Error('请先在模型设置里连接模型，再生成回复。');
  }

  async function branchAlternate(index, text, user) {
    return branchRun(async session => {
      const graph = branchGraph(), node = branchTarget(index, user ? 'user' : 'assistant', graph);
      if (user && !String(text ?? '').trim()) throw new Error('请先写下要发送的消息。');
      if (user && branchVariants(index, graph).ids.length >= 5) throw new Error('这里已有 5 个分支，请先删除一个再试。');
      branchRequireModel();
      const prefix = branchActivePrefix(graph, index);
      let forceCharacter;
      if (!user && ctx().groupId != null) {
        const member = node.message.original_avatar;
        const group = ctx().groups?.find(g => String(g.id) === String(ctx().groupId));
        const matching = ctx().characters.map((c,i) => ({c,i})).filter(({c}) => c && group?.members?.includes(c.avatar) && (member ? c.avatar === member : c.name === node.message.name));
        if (matching.length !== 1) throw new Error('这条回复的角色已不在群聊中。');
        forceCharacter = matching[0].i;
      }
      await branchCommit(session, () => {
        branchApply(ctx(), graph, prefix);
        if (user) {
          const next = branchClone(node.message);
          delete next[branchTag];
          delete next.swipes; delete next.swipe_info; delete next.swipe_id;
          next.mes = text;
          next.send_date = new Date().toISOString();
          if (next.extra) {
            for (const key of [KEY, 'branches','bookmark_link','memory','token_count','display_text']) delete next.extra[key];
          }
          ctx().chat.push(next);
          branchGraph();
        }
      });
      const beforeCount = ctx().chat.length;
      try {
        await branchGenerate(session, ctx().groupId == null && ctx().chat.at(-1)?.is_user ? 'regenerate' : 'normal', forceCharacter);
        const newMessages = ctx().chat.slice(beforeCount);
        if (!newMessages.some(m => !m.is_user && !m.is_system && String(m.mes || '').trim())) {
          throw new Error('这次没有生成回复。');
        }
        branchGraph();
        await branchSave(session);
        if (typeof decorateMessages === 'function') decorateMessages();
      } catch (err) {
        if (!user && branchSession() === session && ctx().chat.length <= beforeCount + 1 &&
          !ctx().chat.slice(beforeCount).some(m => String(m.mes || '').trim())) {
          const after = branchGraph();
          const oldPath = branchPath(after, graph.activeLeafId, branchStore().preferred);
          const empty = new Set(after.nodes.filter(n => n.active && n.index >= beforeCount).map(n => n.id));
          await branchCommit(session, () => branchApply(ctx(), after, oldPath, empty));
        }
        throw err;
      }
    });
  }

  function branchUser(index, text) { return branchAlternate(index, text, true); }
  function branchRetry(index) { return branchAlternate(index, null, false); }

  async function branchEdit(index, text) {
    return branchRun(async session => {
      const graph = branchGraph();
      const node = graph.activeAt.get(index);
      if (!node || node.message.is_user || node.message.is_system) throw new Error('请选择一条角色消息。');
      if (!String(text ?? '').trim()) throw new Error('消息内容不能为空。');
      await branchCommit(session, () => {
        const m = node.message;
        m.mes = text;
        if (Array.isArray(m.swipes)) m.swipes[m.swipe_id || 0] = text;
        for (const extra of [m.extra, m.swipe_info?.[m.swipe_id || 0]?.extra]) {
          if (extra) { delete extra.token_count; delete extra.display_text; }
        }
      });
    });
  }

  async function branchDelete(index) {
    return branchRun(async session => {
      const graph = branchGraph(), target = graph.activeAt.get(index);
      if (!target || (index === 0 && !target.message.is_user)) throw new Error('无法删除开场白。');
      const excluded = branchSubtree(graph, target.id);
      const start = target.parentId ?? graph.children.get(null)?.find(n => !excluded.has(n.id))?.id;
      const path = branchPath(graph, start, branchStore().preferred, excluded);
      await branchCommit(session, () => branchApply(ctx(), graph, path, excluded));
      return {text:target.message.mes, isUser:Boolean(target.message.is_user), count:excluded.size};
    });
  }

  async function branchContinue(index) {
    return branchRun(async session => {
      const m = ctx().chat[index];
      if (index !== ctx().chat.length - 1 || !m || m.is_user || m.is_system) throw new Error('请选择当前分支的最后一条角色回复。');
      branchRequireModel();
      const before = m.mes;
      await branchGenerate(session, 'continue');
      if (ctx().chat[index]?.mes === before) throw new Error('这次没有生成续写内容。');
      await branchSave(session);
    });
  }

    // Lay leaves in chronological order. Each fork sits midway between its outer children.
  function layoutMessageTree(nodes) {
    const byId = new Map();
    for (const node of nodes) byId.set(node.id, {...node, children: []});
    const roots = [];
    for (const node of byId.values()) {
      const parent = byId.get(node.parentId);
      if (parent && parent !== node) parent.children.push(node);
      else roots.push(node);
    }
    const bySerial = (a, b) => a.serial - b.serial;
    roots.sort(bySerial);
    for (const node of byId.values()) node.children.sort(bySerial);

    const stack = [...roots].reverse(), order = [];
    let leafCount = 0, maxDepth = 0;
    while (stack.length) {
      const node = stack.pop();
      order.push(node);
      maxDepth = Math.max(maxDepth, node.index);
      node.y = 160 + node.index * 128;
      if (!node.children.length) node.x = 80 + 84 * leafCount++;
      for (let i = node.children.length - 1; i >= 0; i--) stack.push(node.children[i]);
    }
    for (let i = order.length - 1; i >= 0; i--) {
      const node = order[i];
      if (node.children.length) node.x = (node.children[0].x + node.children.at(-1).x) / 2;
    }
    const active = [], inactive = [];
    for (const node of order) {
      const parent = byId.get(node.parentId);
      if (!parent || parent === node) continue;
      const top = parent.y + 34, bottom = node.y - 34;
      const dx = node.x - parent.x, dy = Math.min(84, Math.max(36, (bottom - top) * 0.58));
      const path = dx === 0 ? `M${node.x} ${top}V${bottom}` :
        `M${parent.x} ${top}C${parent.x + dx * 0.24} ${top + dy} ${node.x - dx * 0.24} ${bottom - dy} ${node.x} ${bottom}`;
      (parent.active && node.active ? active : inactive).push(path);
    }
    return {
      byId, order, width: 160 + Math.max(0, leafCount - 1) * 84, height: 320 + maxDepth * 128,
      activePath: active.join(' '), inactivePath: inactive.join(' '),
    };
  }

  function showMessageTree(messageIndex) {
    const context = ctx(), chatId = context.chatId, characterId = context.characterId, groupId = context.groupId;
    const graph = branchGraph();
    const layout = layoutMessageTree(graph.nodes);
    const current = layout.byId.get(graph.activeLeafId) || layout.order.findLast(node => node.active);
    const requested = Number.isInteger(messageIndex) ? layout.order.find(node => node.active && node.index === messageIndex) : null;
    let selection = requested || current, scale = W.matchMedia('(max-width: 767px)').matches ? 0.7 : 1;
    let loading = false, drag = null;
    const previousFocus = D.activeElement;
    const screen = D.createElement('section');
    suspendDialog(screen);
    screen.className = 'lj-modal-backdrop lj-message-tree';
    screen.setAttribute('role', 'dialog');
    screen.setAttribute('aria-modal', 'true');
    screen.setAttribute('aria-label', '消息树');
    const parent=dialogParents.get(screen);
    const backLabel=parent?'返回'+escapeHtml(dialogName(parent.layer)):'返回聊天';
    screen.innerHTML = `<header class="lj-tree-top"><button type="button" data-tree="back" aria-label="${backLabel}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m7-7-7 7 7 7"/></svg><span>${backLabel}</span></button><div class="lj-tree-zoom" role="group" aria-label="缩放控制"><button type="button" data-tree="minus" aria-label="缩小">−</button><output></output><button type="button" data-tree="plus" aria-label="放大">+</button><button type="button" data-tree="reset" aria-label="重置缩放">1:1</button></div></header>
      <div class="lj-tree-field"><div class="lj-tree-viewport" tabindex="0" role="region" aria-label="聊天树地图"><div class="lj-tree-sheet"><div class="lj-tree-map"><svg class="lj-tree-lines" aria-hidden="true" viewBox="0 0 ${layout.width} ${layout.height}"><path class="lj-tree-line-off" d="${layout.inactivePath}"/><path class="lj-tree-line-on" d="${layout.activePath}"/><path class="lj-tree-line-motion" d="${layout.activePath}"/></svg><button type="button" class="lj-tree-jump" data-tree="jump" aria-label="跳转到对应会话" hidden>跳转 <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M7 6h11v11"/></svg></button></div></div></div>
      <aside class="lj-tree-preview" aria-label="当前选中节点的消息" hidden><img class="lj-tree-portrait" alt=""><div class="lj-tree-detail"><div class="lj-tree-byline"><h2></h2><span class="lj-tree-current">当前</span><span class="lj-tree-serial"></span></div><div class="lj-tree-copy" aria-live="polite"></div></div></aside><p class="lj-tree-status" role="status" hidden></p></div>`;
    portal.append(screen);
    const query = selector => screen.querySelector(selector);
    const viewport = query('.lj-tree-viewport'), sheet = query('.lj-tree-sheet'), map = query('.lj-tree-map');
    const preview = query('.lj-tree-preview'), jump = query('.lj-tree-jump'), status = query('.lj-tree-status');
    const buttons = new Map(), seenContent = new Map();
    const personaImage = D.querySelector('#chat .mes[is_user="true"]:not([force_avatar="true"]) .avatar img')?.getAttribute('src');
    const persona = context.chatMetadata?.persona || Object.keys(context.powerUserSettings?.personas || {}).find(key => context.powerUserSettings.personas[key] === context.name1);
    function sender(node) {
      return node.message.name || (node.message.is_user ? context.name1 : context.name2) || (node.message.is_user ? '你' : '角色');
    }
    function portrait(node) {
      const message = node.message;
      if (message.force_avatar) return message.force_avatar;
      if (message.is_user) return personaImage || (persona && context.getThumbnailUrl('persona', persona)) || '/img/user-default.png';
      if (message.original_avatar) return context.getThumbnailUrl('avatar', message.original_avatar);
      return selected() ? thumb(selected()) : '/img/ai4.png';
    }
    function closeTree() {
      screen.remove();
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
      else toolbar?.querySelector('[data-action="toolbox"]')?.focus({preventScroll:true});
    }
    function report(message) {
      status.hidden = !message;
      status.textContent = message;
    }
    function updateSize() {
      const padX = Math.max(480, viewport.clientWidth / 2), padY = Math.max(520, viewport.clientHeight / 2);
      sheet.style.width = Math.ceil(layout.width * scale + padX * 2) + 'px';
      sheet.style.height = Math.ceil(layout.height * scale + padY * 2) + 'px';
      map.style.cssText = `width:${layout.width}px;height:${layout.height}px;left:${padX}px;top:${padY}px;transform:scale(${scale})`;
      query('output').textContent = Math.round(scale * 100) + '%';
      return {padX, padY};
    }
    function changeZoom(value, focusX = viewport.clientWidth / 2, focusY = viewport.clientHeight / 2) {
      const x = (viewport.scrollLeft + focusX - map.offsetLeft) / scale;
      const y = (viewport.scrollTop + focusY - map.offsetTop) / scale;
      scale = Math.max(0.5, Math.min(2, value));
      const {padX, padY} = updateSize();
      viewport.scrollLeft = padX + x * scale - focusX;
      viewport.scrollTop = padY + y * scale - focusY;
    }
    const nodes = D.createDocumentFragment();
    for (const node of layout.order) {
      const button = D.createElement('button'), img = D.createElement('img');
      button.type = 'button';
      button.className = 'lj-tree-avatar';
      button.classList.toggle('lj-tree-user', Boolean(node.message.is_user));
      button.classList.toggle('lj-tree-active', Boolean(node.active));
      button.setAttribute('aria-label', `节点 ${node.serial}，${sender(node)}`);
      button.dataset.treeNode = node.id;
      button.style.left = node.x + 'px';
      button.style.top = node.y + 'px';
      img.alt = ''; img.draggable = false; img.loading = 'lazy'; img.src = portrait(node);
      button.append(img); nodes.append(button); buttons.set(node.id, button);
    }
    map.append(nodes);

    function updatePreview(showContent = false) {
      for (const button of buttons.values()) button.classList.remove('lj-tree-ancestor', 'lj-tree-selected');
      preview.hidden = !selection;
      jump.hidden = !selection || (selection.message.is_user && selection.message.chatType === 1);
      if (!selection) return;
      buttons.get(selection.id)?.classList.add('lj-tree-selected');
      for (let node = selection; node; node = layout.byId.get(node.parentId)) {
        buttons.get(node.id)?.classList.add('lj-tree-ancestor');
        if (node.parentId === node.id) break;
      }
      jump.style.left = selection.x + 'px';
      jump.style.top = selection.y + 'px';
      const message = selection.message, body = query('.lj-tree-copy');
      const picture = query('.lj-tree-portrait');
      picture.src = portrait(selection); picture.classList.toggle('lj-tree-user', Boolean(message.is_user));
      query('.lj-tree-byline h2').textContent = sender(selection);
      query('.lj-tree-current').hidden = !selection.active;
      query('.lj-tree-serial').textContent = '#' + selection.serial;
      body.classList.toggle('lj-tree-placeholder', !showContent);
      body.scrollTop = 0;
      if (!showContent) { body.textContent = '点击节点查看消息内容'; return; }
      if (message.is_user) { body.textContent = message.mes ?? ''; return; }
      if (!seenContent.has(selection.id)) {
        const text = String(message.extra?.display_text ?? message.mes ?? '').split(/<state\b/i)[0];
        // Keep the chat's Markdown and role-specific display rules. A preview is read-only.
        try {
          // Index 0 in the host formatter can write substitutions back to the live greeting.
          const index = selection.active && selection.index > 0 ? selection.index : undefined;
          const options = {FORBID_TAGS:['style','custom-style','iframe','script','form','input','button','select','textarea','audio','video'], FORBID_ATTR:['id','autofocus'], ALLOW_DATA_ATTR:false};
          seenContent.set(selection.id, context.messageFormatting(text, sender(selection), Boolean(message.is_system), false, index, options));
        } catch (_) { seenContent.set(selection.id, escapeHtml(text)); }
      }
      body.innerHTML = seenContent.get(selection.id);
    }
    async function jumpToMessage() {
      if (loading || !selection) return;
      const target = selection;
      const sameChat = () => ctx().chatId === chatId && ctx().characterId === characterId && ctx().groupId === groupId;
      if (!sameChat()) { closeTree(); return; }
      loading = true; jump.disabled = true;
      try {
        const latest = branchGraph().nodes.find(node => node.id === target.id);
        if (!latest) throw new Error('这条消息已经变动，请重新打开消息树。');
        const index = latest.active ? latest.index : await branchSwitch(latest.id);
        if (!sameChat()) { closeTree(); return; }
        await ctx().executeSlashCommandsWithOptions('/chat-jump ' + index);
        closeTree();
      } catch (error) { report(error.message || '这条消息暂时无法打开'); }
      finally { loading = false; jump.disabled = false; }
    }
    screen.addEventListener('click', event => {
      if (event.target.closest('.lj-tree-copy a')) { event.preventDefault(); return; }
      const button = event.target.closest('button');
      if (!button || loading) return;
      if (button.dataset.treeNode !== undefined) {
        selection = layout.byId.get(button.dataset.treeNode);
        updatePreview(true);
        // A long preview can cover the selected node's jump button on a short screen.
        if (!jump.hidden) {
          const hit = jump.getBoundingClientRect(), card = preview.getBoundingClientRect();
          if (hit.left < card.right && hit.right > card.left && hit.bottom + 12 > card.top) {
            viewport.scrollTop += hit.bottom + 12 - card.top;
          }
        }
      } else {
        switch (button.dataset.tree) {
          case 'back': if(parent || currentToolOrigin())closeDialog(screen);else closeTree(); break;
          case 'minus': changeZoom(Math.round((scale - 0.1) * 100) / 100); break;
          case 'plus': changeZoom(Math.round((scale + 0.1) * 100) / 100); break;
          case 'reset': changeZoom(1); break;
          case 'jump': void jumpToMessage(); break;
        }
      }
    });
    viewport.addEventListener('wheel', event => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const bounds = viewport.getBoundingClientRect();
      changeZoom(scale * Math.exp(-event.deltaY * 0.002), event.clientX - bounds.left, event.clientY - bounds.top);
    }, {passive: false});
    viewport.addEventListener('pointerdown', event => {
      if (loading || drag || event.target.closest('button') || event.button !== 0) return;
      drag = {id:event.pointerId, x:event.clientX, y:event.clientY, left:viewport.scrollLeft, top:viewport.scrollTop};
      viewport.setPointerCapture(event.pointerId);
      viewport.classList.add('lj-tree-dragging');
    });
    viewport.addEventListener('pointermove', event => {
      if (event.pointerId !== drag?.id) return;
      viewport.scrollLeft = drag.left + drag.x - event.clientX;
      viewport.scrollTop = drag.top + drag.y - event.clientY;
    });
    function stopDrag(event) {
      if (event.pointerId !== drag?.id) return;
      viewport.classList.remove('lj-tree-dragging'); drag = null; selection = null;
      updatePreview();
    }
    viewport.addEventListener('pointerup', stopDrag);
    viewport.addEventListener('pointercancel', stopDrag);
    screen.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.stopPropagation(); if (!loading) query('[data-tree="back"]').click(); }
      if (event.key === 'Tab') {
        const first = query('[data-tree="back"]'), last = [...screen.querySelectorAll('button:not([hidden]):not(:disabled)')].filter(button => button.offsetWidth).at(-1);
        if (event.shiftKey && D.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && D.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    const {padX, padY} = updateSize();
    updatePreview(Boolean(requested));
    const anchor = requested || layout.order.reduce((latest, node) => !latest || node.y > latest.y || (node.y === latest.y && node.serial > latest.serial) ? node : latest, null);
    if (anchor) {
      viewport.scrollLeft = anchor.x * scale + padX - viewport.clientWidth / 2;
      viewport.scrollTop = anchor.y * scale + padY - viewport.clientHeight * 0.55;
    } else report('这个存档还没有消息');
    query('[data-tree="back"]').focus({preventScroll:true});
  }

    const messageGlyphs = {
    copy: '<rect x="8" y="8" width="13" height="13" rx="2.4"/><path d="M16 5.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h.5"/>',
    retry: '<path d="M3 3v6h6M21 21v-6h-6"/><path d="M4.6 8A8.2 8.2 0 0 1 18 5.9l2.3 2.5M3.7 15.6l2.3 2.5A8.2 8.2 0 0 0 19.4 16"/>',
    branch: '<path d="M2 12h6.3c2.4 0 3.5-1.2 5.3-3.2L21 2.8m-5 .2h5v5M13 15.5l7.9 5.5M16 21h5v-5"/>',
    trash: '<path d="M3 6h18M9 6V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6M5 7l1 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-13M10 10v7m4-7v7"/>',
    more: '<g fill="currentColor" stroke="none"><circle cx="4" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="20" cy="12" r="1.9"/></g>',
    pencil: '<path d="m4 16.6 11.8-12a2.6 2.6 0 0 1 3.8 3.6L7.5 20l-4.6 1zM14.4 6.1l3.6 3.5"/>',
    note: '<path d="M13 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8M10 13 19.1 4a1.6 1.6 0 0 1 2.3 2.3L12.5 15l-3 .8z"/>',
    memory:'<path d="M12 5c-3-4-7-1.8-6.7 1.6C2.6 7 2 10 3.3 12.1c-1.8 2.5-.1 5.7 2.7 6C6.3 21.8 10.7 22.3 12 19c1.5 3.4 5.4 2.6 6-.8 3-.4 4.2-3.5 2.8-6.1 1.2-2.3.3-4.5-2.1-5.5.1-3.3-4.1-5.7-6.7-1.6ZM12 5v14"/>',
    token: '<path d="M10 3a9 9 0 1 0 11 11h-8a3 3 0 0 1-3-3V3z"/><path d="M14 3.2A8 8 0 0 1 20.8 10H14z"/>',
    continue:'<path d="M5 20h14M4 13v5h5l11-11a2.6 2.6 0 0 0-4-3zM11 15l-3-3"/>',
    previous:'<path d="m14.5 5-7 7 7 7"/>',next:'<path d="m9.5 5 7 7-7 7"/>',
  };
  const messageIcon = key => `<svg viewBox="0 0 24 24" aria-hidden="true">${messageGlyphs[key]}</svg>`;
  let messageEditor, messagePopup, messageDeleteBar, messageDialog;

  function messageRow(index) {
    return D.querySelector(`#chat > .mes[mesid="${Number(index)}"]`);
  }
  function messageRef(index) {
    const c = ctx();
    return { index, chatId:c.chatId, avatar:selected()?.avatar, group:c.groupId, message:c.chat[index] };
  }
  function stillCurrent(ref) {
    const c = ctx();
    return ref && c.chatId === ref.chatId && c.groupId === ref.group &&
      selected()?.avatar === ref.avatar && c.chat[ref.index] === ref.message;
  }
  function rowIcon(action, glyph, label, disabled = false) {
    return `<button type="button" data-lj-msg="${action}" title="${label}" aria-label="${label}" ${disabled ? 'disabled' : ''}>${messageIcon(glyph)}</button>`;
  }
  function versionButtons(variants) {
    const count = variants?.ids.length || 0;
    if (count < 2) return '';
    const current = variants.ids.indexOf(variants.current) + 1;
    return `<span class="lj-msg-versions">${rowIcon('previous','previous','上一个分支',current<=1)}<span>${current} / ${count}</span>${rowIcon('next','next','下一个分支',current>=count)}</span>`;
  }
  function clearStaleMessageControls() {
    const leftChat = route!=='chat' || !D.body.matches('.lj-chat.lj-active');
    if (messageEditor && (leftChat || !messageEditor.el.isConnected || !stillCurrent(messageEditor.ref))) dismissEditor();
    if (messagePopup && (leftChat || !messagePopup.anchor.isConnected || !stillCurrent(messagePopup.ref))) dismissMessageMenu();
    if (messageDeleteBar && (leftChat || !stillCurrent(messageDeleteBar.ref))) closeDeleteBar();
    if (messageDialog && (leftChat || !messageDialog.el.isConnected || !stillCurrent(messageDialog.ref))) {
      messageDialog.el.remove();
      messageDialog = null;
    }
  }
  function messageModal(index, title, body, width) {
    const el = modal(title,body,width);
    messageDialog = {ref:messageRef(index),el};
    return el;
  }
  function decorateMessages() {
    clearStaleMessageControls();
    if (disposed || route!=='chat' || !D.body.matches('.lj-chat.lj-active')) return;
    const chat = ctx().chat;
    if (!chat.length) return;
    const graph = branchGraph();
    let round = 0, waiting = false;
    const rounds = chat.map(m => {
      if (m.is_user && !m.is_system) waiting = true;
      if (!m.is_user && !m.is_system && waiting) { round++; waiting = false; }
      return round;
    });
    for (const row of D.querySelectorAll('#chat > .mes[mesid]')) {
      const index = Number(row.getAttribute('mesid'));
      const message = chat[index];
      if (!message || row.classList.contains('smallSysMes')) continue;
      const opening = index === 0 && !message.is_user;
      const variants = branchVariants(index, graph);
      const remembered = Boolean(message.extra?.[KEY]?.permanentEntry || message.extra?.memory);
      const signature = JSON.stringify([index,message.is_user,opening,rounds[index],remembered,variants]);
      let bar = row.querySelector(':scope > .lj-message-actions');
      if (bar?.dataset.signature === signature) continue;
      if (!bar) { bar = D.createElement('div'); bar.className = 'lj-message-actions'; row.append(bar); }
      bar.dataset.signature = signature;
      if (opening) {
        bar.innerHTML = rowIcon('message-tools','more','更多') + versionButtons(variants);
      } else if (message.is_user) {
        bar.innerHTML = rowIcon('user-branch','branch','分支重说') + rowIcon('delete','trash','删除消息') + rowIcon('message-tools','more','更多') + versionButtons(variants);
      } else {
        const sequence = rounds[index] ? `<span>No.${rounds[index]}</span>` : '';
        const memory = remembered ? `<span>${messageIcon('memory')}已记忆</span>` : '';
        bar.innerHTML = rowIcon('copy','copy','复制消息') + rowIcon('retry','retry','重说') + rowIcon('menu','more','更多') +
          `<span class="lj-msg-status">${sequence}${memory}</span>` + versionButtons(variants);
      }
    }
  }

  function dismissMessageMenu(returnFocus = false) {
    if (!messagePopup) return;
    const { el, anchor } = messagePopup;
    el.remove();
    anchor?.setAttribute('aria-expanded','false');
    if (returnFocus && anchor?.isConnected) anchor.focus({preventScroll:true});
    messagePopup = null;
  }
  function closeDeleteBar() {
    if (!messageDeleteBar) return;
    messageDeleteBar.el.remove();
    D.querySelectorAll('.lj-pending-delete').forEach(el => el.classList.remove('lj-pending-delete'));
    messageDeleteBar = null;
  }
  function dismissEditor() {
    if (!messageEditor) return;
    messageEditor.el.remove();
    messageEditor.row.classList.remove('lj-msg-editing');
    messageEditor = null;
  }
  function observeMessages() {
    const chat = $('#chat');
    if (!chat) return;
    monitorTokenRequests();
    let timer;
    const sync = () => {
      W.clearTimeout(timer);
      timer = W.setTimeout(decorateMessages, 60);
    };
    const observer = new W.MutationObserver(records => {
      // Streaming rewrites the text block every token. The toolbar only needs row or branch changes.
      if (records.some(r => r.target === chat || (r.type === 'attributes' && r.target.matches('.mes')))) sync();
    });
    observer.observe(chat,{childList:true,subtree:true,attributes:true,attributeFilter:['mesid','is_user']});
    const pageObserver = new W.MutationObserver(clearStaleMessageControls);
    pageObserver.observe(D.body,{attributes:true,attributeFilter:['class']});
    observers.push(observer,pageObserver);
    on(chat,'click',handleMessageButton);
    on(portal,'click',handleMessageButton);
    on(D,'pointerdown',event => {
      if (messagePopup && !messagePopup.el.contains(event.target) && !messagePopup.anchor?.contains(event.target)) dismissMessageMenu();
    },true);
    on(D,'keydown',event => {
      if (event.key === 'Escape') {
        if (messagePopup) dismissMessageMenu(true);
        else if (messageDeleteBar) closeDeleteBar();
        else if (messageEditor && messageEditor.el.contains(event.target)) dismissEditor();
      }
      if (messagePopup && ['ArrowUp','ArrowDown','Home','End'].includes(event.key)) {
        const options = [...messagePopup.el.querySelectorAll('button:not(:disabled)')];
        if (!options.length) return;
        const i = options.indexOf(D.activeElement);
        const j = event.key==='Home'?0:event.key==='End'?options.length-1:(i+(event.key==='ArrowUp'?-1:1)+options.length)%options.length;
        options[j].focus(); event.preventDefault();
      }
    });
    on(chat,'scroll',() => dismissMessageMenu(),{passive:true});
    on(W,'resize',() => dismissMessageMenu());
    on(chat,'contextmenu',event => {
      if (!D.body.classList.contains('lj-chat') || event.target.closest('a,input,button,textarea,details,iframe,img') || W.getSelection()?.toString()) return;
      const row = event.target.closest('#chat > .mes');
      if (!row) return;
      event.preventDefault();
      messageMenu(Number(row.getAttribute('mesid')), row.querySelector('.lj-message-actions button') || row, true);
    });
    const c = ctx();
    for (const name of ['CHAT_CHANGED','MESSAGE_RECEIVED','MESSAGE_SENT','MESSAGE_SWIPED','MESSAGE_UPDATED','MESSAGE_DELETED','GENERATION_ENDED']) {
      const type=c.eventTypes[name];
      if (type) { c.eventSource.on(type,sync); listeners.push(() => c.eventSource.removeListener(type,sync)); }
    }
    listeners.push(() => { W.clearTimeout(timer); dismissEditor(); dismissMessageMenu(); closeDeleteBar(); });
    decorateMessages();
  }

  function inlineMessageEditor(index) {
    if (messageEditor?.row.isConnected) {
      messageEditor.el.querySelector('textarea').focus();
      if (messageEditor.ref.index !== index) toast('请先保存或取消正在编辑的消息');
      return;
    }
    const row = messageRow(index), ref = messageRef(index);
    if (!row || !ref.message) return;
    dismissEditor(); dismissMessageMenu(); closeDeleteBar();
    const user = ref.message.is_user, el = D.createElement('div');
    el.className = 'lj-inline-message-editor';
    el.innerHTML = `<textarea aria-label="${user?'编辑我的消息':'编辑角色回复'}" placeholder="${user?'编辑后保存将从此处开分支':'编辑 AI 回复内容'}"></textarea>
      <div class="lj-editor-foot"><small>${user?'保存后会创建新的对话分支。点消息下方的箭头可以来回切换。':'如果回复带有状态栏，请保留 &lt;state&gt; 和 &lt;/state&gt; 标签。'}</small>
      <div><button type="button" data-lj-msg="cancel-edit">取消</button><button type="button" data-lj-msg="save-edit">保存</button></div></div>`;
    const field = el.querySelector('textarea'); field.value = ref.message.mes;
    row.querySelector('.mes_block').append(el); row.classList.add('lj-msg-editing');
    messageEditor = {ref,row,el};
    field.style.height = Math.min(Math.max(88,field.scrollHeight+3),W.innerHeight*.45) + 'px';
    const saveButton=el.querySelector('[data-lj-msg="save-edit"]');
    field.addEventListener('input',() => { saveButton.disabled=!field.value.trim(); });
    field.addEventListener('keydown',event => {
      if (event.key!=='Enter' || event.shiftKey || event.isComposing || event.keyCode===229 || !W.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
      event.preventDefault();
      if(!saveButton.disabled) saveButton.click();
    });
    field.focus({preventScroll:true}); field.setSelectionRange(field.value.length,field.value.length);
  }

  function requestReplyBranch(index) {
    const ref=messageRef(index);
    if (!index || !ref.message || ref.message.is_user) { toast('请选择角色的一条回复'); return; }
    const round=countRounds(ctx().chat);
    const key = KEY + ':retry:' + JSON.stringify([ref.avatar,ref.group,ref.chatId]);
    let until=0;
    try { until=Number(W.localStorage.getItem(key)); } catch (_) {}
    if (round>0 && round<=until) return branchRetry(index);
    const overlay = messageModal(index,'确认分支重说',
      '<p>这条回复会生成一个新分支。原回复和后面的对话都保留，可以在工具箱的消息树里切换查看。</p><label class="lj-retry-option"><input type="checkbox">10 轮内不再提醒</label><div class="lj-confirm-buttons"><button data-action="close-modal" type="button">取消</button><button class="lj-commit" type="button" data-lj-confirm>分支重说</button></div>','360px');
    overlay.classList.add('lj-compact-confirm');
    overlay.querySelector('[data-lj-confirm]').addEventListener('click',async event => {
      if (!stillCurrent(ref)) { overlay.remove(); toast('当前对话已切换'); return; }
      event.currentTarget.disabled=true;
      if (round>0 && overlay.querySelector('input').checked) {
        try { W.localStorage.setItem(key,String(round+10)); } catch (_) {}
      }
      overlay.remove();
      try { await branchRetry(index); } catch (error) { toast(error.message); }
      decorateMessages();
    });
  }
  function requestMessageDelete(index) {
    const ref = messageRef(index);
    if (!ref.message || (!index && !ref.message.is_user)) {toast('开场白可在右侧的故事选择中切换。');return;}
    const targets = branchDeleteTargets(index);
    dismissMessageMenu(); closeDeleteBar();
    const el = D.createElement('div');
    el.className = 'lj-delete-message-bar';
    el.setAttribute('role','alertdialog'); el.setAttribute('aria-label','删除消息');
    el.innerHTML = `<div><strong>删除这条消息？</strong><small>将删除这条消息和从它继续的所有消息、分支及记忆，共 ${targets.length} 条。</small></div><button type="button" data-lj-msg="cancel-delete">取消</button><button type="button" data-lj-msg="confirm-delete">确认删除</button>`;
    portal.append(el); messageDeleteBar={el,ref};
    const targetSet = new Set(targets);
    const graph=branchGraph();
    for (const row of D.querySelectorAll('#chat > .mes[mesid]')) {
      const id=branchVariants(Number(row.getAttribute('mesid')),graph).current;
      row.classList.toggle('lj-pending-delete',targetSet.has(id));
    }
    el.querySelector('button').focus({preventScroll:true});
  }

  const nativeMessageLabels = {
    mes_translate:'翻译这条消息', sd_message_gen:'为这条消息生成图片', mes_narrate:'朗读这条消息',
    mes_prompt:'查看这次发给 AI 的内容', mes_hide:'让 AI 跳过这条消息', mes_unhide:'让 AI 重新读到这条消息',
    mes_media_gallery:'把附件排成列表', mes_media_list:'把附件排成相册', mes_embed:'给这条消息添加附件',
    mes_swipe_picker:'查看这条回复的其他版本', mes_create_bookmark:'另存一份到这里的对话', mes_bookmark:'打开这里另存的对话',
    mes_create_branch:'从这里另开存档', mes_copy:'复制消息', mes_edit:'移动或复制这条消息', mes_edit_copy:'复制为一条新消息',
    mes_edit_add_reasoning:'添加思考记录', mes_edit_up:'把消息上移', mes_edit_down:'把消息下移',
    mes_edit_cancel:'取消编辑',mes_edit_done:'保存编辑',mes_edit_delete:'只删除这一条消息',
  };
  const archiveKeys = ['mes_create_bookmark','mes_bookmark','mes_create_branch'];
  function nativeMessageTools(index, archives=false) {
    const row=messageRow(index), message=ctx().chat[index];
    if(!row || !message) return [];
    return Array.from(row.querySelectorAll('.mes_buttons .mes_button')).flatMap(source=>{
      const key=Object.keys(nativeMessageLabels).find(k=>source.classList.contains(k));
      if(source.hidden || source.disabled || source.classList.contains('extraMesButtonsHint') ||
        key==='mes_copy' || archiveKeys.includes(key)!==archives || W.getComputedStyle(source).display==='none' ||
        (key==='mes_bookmark' && !message.extra?.bookmark_link)) return [];
      const label=nativeMessageLabels[key]||source.title||source.getAttribute('aria-label');
      return label?[{source,label,key}]:[];
    });
  }
  function runNativeMessageTool(index, tool) {
    const row=messageRow(index);
    if(!tool || !row?.contains(tool.source)) return;
    if(tool.key==='mes_edit') {
      if(messageEditor && messageEditor.el.querySelector('textarea').value!==messageEditor.ref.message.mes) {
        toast('请先保存或取消正在编辑的消息'); return;
      }
      dismissEditor();
      for(const control of row.querySelectorAll('.mes_edit_buttons > [title]')) {
        const key=Object.keys(nativeMessageLabels).find(name=>control.classList.contains(name));
        if(key) { control.title=nativeMessageLabels[key]; control.setAttribute('aria-label',nativeMessageLabels[key]); }
      }
    }
    if(tool.key==='mes_edit')visibleDialog()?.remove();
    tool.source.click();
  }
  function chooseMessageTools(archiveKey) {
    const c = ctx();
    if (!c.chat.length) { toast('当前聊天还没有消息'); return; }
    const overlay=messageModal(c.chat.length-1,nativeMessageLabels[archiveKey]||'选择要操作的消息','<div class="lj-message-picker"></div>','520px');
    const list=overlay.querySelector('.lj-message-picker');
    const renderOptions=()=>{
      const rows=[...D.querySelectorAll('#chat > .mes[mesid]')].reverse();
      list.innerHTML=rows.map(row=>{
        const index=Number(row.getAttribute('mesid')), m=c.chat[index];
        if(!m || (archiveKey && !nativeMessageTools(index,true).some(t=>t.key===archiveKey)))return '';
        const name=m.is_user?(m.name||c.name1):(m.name||c.name2);
        return `<button type="button" data-pick-msg="${index}"><strong>${escapeHtml(name)} · 第 ${index+1} 条</strong><span>${escapeHtml(String(row.querySelector('.mes_text')?.textContent||m.mes||'').replace(/\s+/g,' ').slice(0,90)||'附件或空消息')}</span></button>`;
      }).join('')+($('#show_more_messages')?'<button type="button" data-load-earlier>载入更早的消息</button>':'');
    };
    renderOptions();
    list.addEventListener('click',event=>{
      const target=event.target.closest('button');
      if(!target) return;
      if(target.hasAttribute('data-load-earlier')) {
        $('#show_more_messages')?.click();
        renderOptions();
      } else {
        const index=Number(target.dataset.pickMsg);
        if(archiveKey) runNativeMessageTool(index,nativeMessageTools(index,true).find(t=>t.key===archiveKey));
        else extraMessageTools(index);
      }
    });
  }
  function extraMessageTools(index) {
    const row=messageRow(index), ref=messageRef(index);
    if (!row) return;
    const tools=nativeMessageTools(index);
    const buttons=tools.map((t,i)=>`<button class="lj-soft" type="button" data-native-index="${i}">${escapeHtml(t.label)}</button>`).join('');
    const overlay=messageModal(index,'其他消息工具',`<div class="lj-extra-msg-tools">${(ref.message.is_user||index===0)?'<button type="button" class="lj-soft" data-copy-message>复制消息</button>':''}<button type="button" class="lj-soft" data-lj-open-tree>在消息树中查看</button>${buttons}</div>`,'480px');
    overlay.querySelector('.lj-extra-msg-tools').addEventListener('click',async event=>{
      const btn=event.target.closest('button');
      if (!btn) return;
      if (!stillCurrent(ref)) { overlay.remove();toast('当前对话已切换');return; }
      if (btn.hasAttribute('data-copy-message')) {
        await copyWithFeedback(ref.message.mes);
      } else if (btn.hasAttribute('data-lj-open-tree')) {
        try { await showMessageTree(index); } catch (error) { toast(error.message); }
      } else {
        runNativeMessageTool(index,tools[Number(btn.dataset.nativeIndex)]);
      }
    });
  }
  function messageMenu(index, anchor, advanced=false) {
    if(advanced) { dismissMessageMenu(); extraMessageTools(index); return; }
    if (messagePopup?.anchor===anchor) { dismissMessageMenu(true); return; }
    dismissMessageMenu();
    const ref=messageRef(index),el=D.createElement('div');
    if (!ref.message) return;
    anchor ||= messageRow(index)?.querySelector('[data-lj-msg="menu"]');
    if(!anchor) return;
    const items=[
      ['edit','pencil','编辑对话'],['delete','trash','删除消息'],['note','note','反馈问题'],
      ['remember','memory',ref.message.extra?.[KEY]?.permanentEntry?'编辑永久记忆':'添加到永久记忆'],
      ['tokens','token','Token 统计'],
    ];
    if (index===ctx().chat.length-1) items.push(['continue','continue','截断续写']);
    el.className='lj-msg-popover'; el.setAttribute('role','menu'); el.setAttribute('aria-label','消息操作');
    el.innerHTML=items.map(([action,glyph,label])=>`<button role="menuitem" type="button" data-lj-msg="${action}">${messageIcon(glyph)}<span>${label}</span></button>`).join('');
    const nativeTools=nativeMessageTools(index);
    el.insertAdjacentHTML('beforeend',nativeTools.map((tool,i)=>`<button role="menuitem" type="button" data-lj-msg="native" data-native-index="${i}"><span>${escapeHtml(tool.label)}</span></button>`).join('') +
      '<button role="menuitem" type="button" data-lj-msg="tree"><span>在消息树中查看</span></button>');
    messagePopup={el,anchor,ref,nativeTools}; portal.append(el);
    anchor.setAttribute('aria-expanded','true');
    const rect=anchor.getBoundingClientRect(),size=el.getBoundingClientRect();
    const gap=8,below=W.innerHeight-rect.bottom-gap;
    el.style.left=Math.max(gap,Math.min(rect.left,W.innerWidth-size.width-gap))+'px';
    el.style.top=Math.max(gap,Math.min(below>=size.height?rect.bottom+gap:rect.top-size.height-gap,W.innerHeight-size.height-gap))+'px';
    el.querySelector('button').focus({preventScroll:true});
  }

  function editMessageNote(index,remember) {
    const ref=messageRef(index), entry=ref.message.extra?.[KEY]?.permanentEntry;
    const title=remember ? (entry?'编辑永久记忆':'添加到永久记忆') : '反馈问题';
    const overlay=messageModal(index,title,`<div class="lj-msg-note">${remember?'<label>标题<input type="text" data-note-title placeholder="新的记忆"></label>':'<p>记录这条回复的问题，保存在当前聊天中。</p>'}
      <label>${remember?'内容':'问题描述'}<textarea data-note-text rows="7"></textarea></label>
      <div class="lj-confirm-buttons"><button type="button" data-action="close-modal">取消</button><button class="lj-commit" type="button" data-note-save>保存</button></div></div>`,'520px');
    const field=overlay.querySelector('[data-note-text]'), heading=overlay.querySelector('[data-note-title]');
    if (heading) heading.value=entry?.title||'';
    field.value=remember?(entry?.text??ref.message.mes):(ref.message.extra?.[KEY]?.issue||'');
    overlay.querySelector('[data-note-save]').addEventListener('click',async event=>{
      const button=event.currentTarget, text=field.value.trim();
      if(!text) { field.focus(); return; }
      if(!stillCurrent(ref)) { overlay.remove(); toast('当前对话已切换'); return; }
      button.disabled=true;
      try {
        ref.message.extra||={}; const extra=ref.message.extra[KEY]||={};
        if (remember) {
          const memory=memoryData().memory, title=heading.value.trim()||'新的记忆', block=title+'\n'+text;
          if (entry && memory.permanent.includes(entry.block)) memory.permanent=memory.permanent.replace(entry.block,()=>block);
          else memory.permanent=[memory.permanent,block].filter(Boolean).join('\n\n');
          extra.permanentEntry={title,text,block};
          saveMemorySnapshot(); syncMemoryPrompt();
        } else extra.issue=text;
        await ctx().saveChat(); overlay.remove(); decorateMessages();
        toast(remember?'已保存到永久记忆':'问题已记录');
      } catch(error) {toast(error.message);} finally {button.disabled=false;}
    });
  }
  async function copyMessageText(text){
    if(typeof D.execCommand==='function'){
      const before=D.activeElement,field=D.createElement('textarea');
      field.value=text;field.setAttribute('readonly','');field.style.cssText='position:fixed;left:0;top:0;opacity:0;width:2px;height:2px';
      D.body.append(field);field.focus({preventScroll:true});field.select();field.setSelectionRange?.(0,text.length);
      try{if(D.execCommand('copy'))return;}catch{}
      finally{field.remove();before?.focus?.({preventScroll:true});}
    }
    if(W.navigator.clipboard?.writeText){
      let timer;
      try{
        await Promise.race([W.navigator.clipboard.writeText(text),new Promise((_,reject)=>{timer=W.setTimeout(()=>reject(Error()),1800);})]);return;
      }catch{}finally{W.clearTimeout?.(timer);}
    }
    throw Error('浏览器未允许自动复制。');
  }
  async function copyWithFeedback(text){
    try{await copyMessageText(text);toast('已复制消息');}
        catch{const view=modal('复制消息','<p>浏览器未允许自动复制。长按选中的文字或按复制快捷键即可复制原文。</p><textarea readonly aria-label="消息原文"></textarea>','580px');const field=view.querySelector('textarea');field.value=text;field.focus();field.select();}
  }
  async function handleMessageButton(event) {
    const button=event.target.closest('[data-lj-msg]');
    if(!button || disposed || !D.body.classList.contains('lj-chat')) return;
    event.stopPropagation();
    const action=button.dataset.ljMsg;
    const ref=messagePopup?.el.contains(button)?messagePopup.ref:
      messageDeleteBar?.el.contains(button)?messageDeleteBar.ref:
      messageEditor?.el.contains(button)?messageEditor.ref:
      messageRef(Number(button.closest('.mes')?.getAttribute('mesid')));
    if(!ref || !stillCurrent(ref)) { dismissMessageMenu(); closeDeleteBar(); dismissEditor(); return; }
    const index=ref.index;
    const nativeTool=messagePopup?.nativeTools?.[Number(button.dataset.nativeIndex)];
    if(action!=='menu') dismissMessageMenu();
    try {
      if(action==='copy') {
        await copyWithFeedback(ref.message.mes);
      } else if(action==='user-branch'||action==='edit') inlineMessageEditor(index);
      else if(action==='cancel-edit') dismissEditor();
      else if(action==='save-edit') {
        const editor=messageEditor, text=editor?.el.querySelector('textarea').value.trim();
        if(!text) return;
        button.disabled=true;
        const save=ref.message.is_user?branchUser:branchEdit;
        await save(index,text);
        if (messageEditor===editor) dismissEditor();
      } else if(action==='retry') await requestReplyBranch(index);
      else if(action==='menu') messageMenu(index,button);
      else if(action==='message-tools') extraMessageTools(index);
      else if(action==='native') runNativeMessageTool(index,nativeTool);
      else if(action==='tree') await showMessageTree(index);
      else if(action==='delete') requestMessageDelete(index);
      else if(action==='cancel-delete') closeDeleteBar();
      else if(action==='confirm-delete') {
        button.disabled=true;button.textContent='正在删除…';
        const result=await branchDelete(index);
        closeDeleteBar();
        if(result?.isUser && result.text) {
          const input=$('#send_textarea');
          if(input && !input.value) { input.value=result.text; input.dispatchEvent(new W.Event('input',{bubbles:true})); }
        }
        toast('已删除 '+result.count+' 条消息');
      } else if(action==='previous'||action==='next') {
        const siblings=branchVariants(index), i=siblings.ids.indexOf(siblings.current)+(action==='next'?1:-1);
        if(siblings.ids[i]) { button.disabled=true; await branchSwitch(siblings.ids[i]); }
      } else if(action==='continue') await branchContinue(index);
      else if(action==='remember'||action==='note') editMessageNote(index,action==='remember');
      else if(action==='tokens') await showMessageTokens(index);
    } catch(error) {
      const text=error.message || '操作未完成';
      if(action==='confirm-delete' && messageDeleteBar?.el.isConnected){const hint=messageDeleteBar.el.querySelector('small');if(hint)hint.textContent=text;button.textContent='重试删除';}
      toast(text);
    }
    finally { if(button.isConnected && ['save-edit','confirm-delete','previous','next'].includes(action)) button.disabled=false; decorateMessages(); }
  }
  function saveMemorySnapshot(){
    const context=ctx(),memory=context.chatMetadata?.[KEY]?.memory;if(!memory)return;
    const last=context.chat?.at(-1);if(!last)return;
    last.extra||={};last.extra[KEY]||={};last.extra[KEY].memory=JSON.parse(JSON.stringify(memory));
    const swipe=last.swipe_info?.[last.swipe_id];
    if(swipe){swipe.extra||={};swipe.extra[KEY]||={};swipe.extra[KEY].memory=JSON.parse(JSON.stringify(memory));}
  }
  function restoreMemorySnapshot(){
    const context=ctx();let memory;
    for(let i=context.chat.length-1;i>=0;i--){const m=context.chat[i],snapshot=m.swipe_info?.[m.swipe_id]?.extra?.[KEY]?.memory||m.extra?.[KEY]?.memory;if(snapshot){memory=JSON.parse(JSON.stringify(snapshot));break;}}
    if(memory){context.chatMetadata[KEY]||={};context.chatMetadata[KEY].memory=memory;syncMemoryPrompt();}
  }

    let profileTab='资料', profileAvatar='';
  function storyPlain(value) {
    return plain(String(value||'').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/```(?:html)?\s*|```/gi,'')).replace(/\s+/g,' ').trim();
  }
  function cardIntroduction(c) {
    const data=c.data||{}, matchName=/开场白首页|首页与目录|封面(?:介绍|展示|页面)|(?:角色|作品)(?:首页|封面|介绍页)/;
    const isPage=value=>typeof value==='string' && /<(?:html|body|main|section|div|article|iframe)\b/i.test(value);
    const scripts=data.extensions?.regex_scripts;
    const cover=Array.isArray(scripts) && scripts.find(x=>!x.disabled && matchName.test(x.scriptName||'') && isPage(x.replaceString));
    if(cover)return cover.replaceString;
    if(isPage(data.creator_notes) && /<(?:html|style|main|article|section)\b/i.test(data.creator_notes))return data.creator_notes;
    const first=c.first_mes||data.first_mes;
    if(isPage(first) && /<(?:title|h1|h2)[^>]*>[^<]{0,50}(?:角色介绍|作品介绍|开场目录|封面)/i.test(first))return first;
    return '';
  }
  function openCardIntroduction(c) {
    const raw=cardIntroduction(c);
    if(!raw)return;
    const fence=raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
    const source=(fence?fence[1]:raw).replace(/{{char}}/gi,()=>escapeHtml(c.name)).replace(/{{user}}/gi,()=>escapeHtml(ctx().name1));
    const dialog=modal('放映室','<iframe class="lj-cover-frame" sandbox="allow-scripts" referrerpolicy="no-referrer" title="角色卡封面介绍"></iframe>','840px');
    const policy="default-src 'none'; img-src data: blob: http: https:; media-src data: blob: http: https:; font-src data: https:; style-src 'unsafe-inline' https:; script-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";
    dialog.querySelector('iframe').srcdoc='<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="'+policy+'">'+source;
  }
  function profileStories(c) {
    const list=storyResources().map((g,i)=>{
      if(!String(g).trim()) return '';
      const meta=storyMeta(i), preview=storyPlain(g), name=openingLabel(i,storyResources().length,meta.name);
      const labels=Array.isArray(meta.tags)?meta.tags:tags(c);
      const time=meta.date && new Date(meta.date);
      return `<article class="lj-side-story"><div class="lj-story-intro"><img alt="" src="${escapeHtml(meta.cover||meta.background||avatar(c))}"><div><h4>${escapeHtml(name)}</h4>${time && Number.isFinite(+time)?`<time>${escapeHtml(time.toLocaleString('zh-CN',{hour12:false}))}</time>`:''}<div class="lj-tags">${labels.map(t=>`<span class="lj-tag">${escapeHtml(t)}</span>`).join('')}</div></div></div><p>${escapeHtml(meta.description||preview.slice(0,180))}</p><div class="lj-story-choices"><button data-action="story-start" data-index="${i}">开始聊天</button></div></article>`;
    }).join('');
    return (cardIntroduction(c)?'<button class="lj-profile-row lj-cover-link" data-action="profile-cover">'+icon('image')+'<span>放映室</span><span aria-hidden="true">›</span></button>':'')+'<h3>故事选择</h3>'+(list||'<p class="lj-muted">这张卡还没有开场白。</p>')+'<button class="lj-soft" data-action="greetings">管理开场故事</button>';
  }
  function streamControl() {
    const id={openai:'stream_toggle',textgenerationwebui:'streaming_textgenerationwebui',novel:'streaming_novel',kobold:'streaming_kobold'}[ctx().mainApi];
    return id?D.getElementById(id):null;
  }
  function profileRow(action,glyph,label,attrs='') {
    return `<button class="lj-profile-row" data-action="${action}" ${attrs}>${icon(glyph)}<span>${label}</span><span aria-hidden="true">›</span></button>`;
  }
  function profileSettings(c) {
    const context=ctx(), persona=context.powerUserSettings?.persona_description||'', stream=streamControl();
    const worlds=roleBooks(c), embed=!c.data?.extensions?.world && c.data?.character_book;
    const global=worldHost?.selected_world_info||[];
    return `<h3>人设面具</h3><div class="lj-profile-block"><div class="lj-profile-summary"><strong>${escapeHtml(context.name1||'当前面具')}</strong><p>${escapeHtml(storyPlain(persona))}</p></div>${profileRow('native','user','面具设置','data-panel="personas"')}</div>
      <h3>世界书 <small>${worlds.length}</small></h3><div class="lj-profile-block">${worlds.map(([name,origins])=>`<div class="lj-bound-world"><button data-action="edit-world" data-name="${escapeHtml(name)}">${icon('book')} ${escapeHtml(name)}<small>${escapeHtml(origins.join(' · '))}</small></button></div>`).join('')}${embed?`<button class="lj-profile-row" data-action="import-role-world" data-avatar="${escapeHtml(c.avatar)}">导入并绑定卡内《${escapeHtml(embed.name||'世界书')}》</button>`:''}${profileRow('world-binding','book','管理角色和此存档的绑定')}${global.length?`<details><summary>所有角色共用的书（${global.length}）</summary>${global.map(n=>`<button class="lj-soft" data-action="edit-world" data-name="${escapeHtml(n)}">${escapeHtml(n)}</button>`).join('')}</details>`:''}</div>
      <h3>对话功能</h3><div class="lj-profile-block">${profileRow('profile-restart','refresh','重启（选开场白建新存档）')}${profileRow('profile-archives','box','存档')}${profileRow('profile-export','download','导出当前对话')}</div>
      <h3>聊天设置</h3><div class="lj-profile-block">${profileRow('profile-regex','settings','文字替换规则（正则）')}<div class="lj-profile-summary"><strong>流式输出</strong><p>${stream?'流式逐段显示，非流式在生成结束后一次显示。':'当前接口没有提供流式开关。'}</p><div class="lj-stream" role="group" aria-label="流式输出模式">${['流式','非流式'].map((s,i)=>`<button data-action="profile-stream" data-mode="${i}" ${stream?'':'disabled'} aria-pressed="${!!stream && stream.checked===(i===0)}">${s}</button>`).join('')}</div></div></div>`;
  }
  function chatProfile(c) {
    if(c.avatar!==profileAvatar) { profileTab='资料'; profileAvatar=c.avatar; }
    const tabs=['资料','私有备注','设置'];
    return `<aside class="lj-profile" aria-label="角色侧栏"><div class="lj-profile-title"><button class="lj-iconbutton lj-mobile-back" data-action="close-details" aria-label="返回聊天">${icon('back')}</button><strong>${escapeHtml(c.name)}</strong></div><div class="lj-profile-tabs" role="group" aria-label="角色资料栏目">${tabs.map(t=>`<button data-action="profile-tab" data-tab="${t}" aria-pressed="${t===profileTab}">${t}</button>`).join('')}</div><div class="lj-profile-sections">${profileTab==='设置'?profileSettings(c):profileTab==='私有备注'?`<h3>私有备注</h3><p>${escapeHtml(preferences().notes[c.avatar]||'还没有备注')}</p><button class="lj-soft" data-action="notes">编辑备注</button>`:profileStories(c)}</div></aside>`;
  }
  async function refreshShallowProfile(c) {
    if(!c.shallow) return;
    await ctx().unshallowCharacter(ctx().characterId);
    if(route==='chat' && selected()?.avatar===c.avatar && !selected().shallow) render();
  }
  let archivePopup, archiveBusy=false, openingStory=false;
  function dismissArchiveMenu(){
    if(!archivePopup)return;
    archivePopup.anchor.setAttribute('aria-expanded','false');
    archivePopup.el.remove();archivePopup=null;
  }
  async function profileArchives(id=ctx().characterId) {
    const c=ctx().characters[id];if(!c)return;
    const dialog=modal('存档管理',
      '<div class="lj-list" data-archives>正在读取存档…</div>'+
      (selected()?.avatar===c.avatar?'<details class="lj-archive-advanced"><summary>更多存档操作</summary><div class="lj-archive-tools">'+archiveKeys.filter(k=>k!=='mes_bookmark'||ctx().chat.some(m=>m.extra?.bookmark_link)).map(k=>'<button class="lj-soft" data-action="archive-pick" data-key="'+k+'">'+nativeMessageLabels[k]+'</button>').join('')+'</div></details>':''), '460px');
    dialog.classList.add('lj-archives-sheet');
    const header=dialog.querySelector('.lj-modal-header');
    header.querySelectorAll('button').forEach(button=>button.remove());
    const back=D.createElement('button');back.type='button';back.className='lj-iconbutton';
    back.dataset.action='close-modal';back.setAttribute('aria-label','返回原页面');back.innerHTML=icon('back');header.prepend(back);
    dialog.dataset.archiveAvatar=c.avatar;
    const list=await sessions(c,true,true);
    if(!dialog.isConnected)return;
    const started=list.filter(f=>f.started), previews=list.filter(f=>!f.started);
    const area=dialog.querySelector('[data-archives]');
    area.innerHTML=sessionItems(started,id)||'<p class="lj-muted">发出第一条消息后，聊天会显示在这里。</p>';
    if(previews.length)area.insertAdjacentHTML('beforeend',
      '<details class="lj-preview-archives"><summary>未开始的预览（'+previews.length+'）</summary>'+sessionItems(previews,id)+'</details>');
    await labelArchiveOpenings(area,list,id);
  }
  function archiveMenu(id,file,anchor){
    if(archivePopup?.anchor===anchor){dismissArchiveMenu();return;}
    dismissArchiveMenu();
    const c=ctx().characters[id];if(!c)return;
    const el=D.createElement('div');el.className='lj-msg-popover lj-archive-menu';
    el.setAttribute('role','menu');el.setAttribute('aria-label','存档操作');
    el.innerHTML='<button type="button" role="menuitem" data-rename>'+icon('edit')+'重命名</button><button type="button" role="menuitem" data-delete>'+messageIcon('trash')+'删除</button>';
    archivePopup={el,anchor};portal.append(el);anchor.setAttribute('aria-expanded','true');
    const r=anchor.getBoundingClientRect(),size=el.getBoundingClientRect();
    el.style.left=Math.max(8,Math.min(r.right-size.width,W.innerWidth-size.width-8))+'px';
    el.style.top=Math.max(8,Math.min(r.bottom+6,W.innerHeight-size.height-8))+'px';
    const open=remove=>{dismissArchiveMenu();editArchive(c.avatar,file,remove);};
    el.querySelector('[data-rename]').onclick=()=>open(false);
    el.querySelector('[data-delete]').onclick=()=>open(true);
    el.querySelector('button').focus({preventScroll:true});
  }
  function editArchive(avatar,file,remove){
    const label=archiveTitle(file);
    const layer=modal(remove?'删除存档':'重命名存档',remove?
      '<p>确认删除「'+escapeHtml(label)+'」及其中的全部聊天记录？删除后无法撤销。</p>':
      '<label for="lj-archive-name">存档名称</label><input id="lj-archive-name" maxlength="120" value="'+escapeHtml(archiveTitle(file))+'" autocomplete="off">', '420px');
    layer.querySelector('.lj-modal-content').insertAdjacentHTML('beforeend',
      '<p data-archive-error role="status" class="lj-muted"></p><div class="lj-form-actions"><button type="button" class="lj-soft" data-action="close-modal">取消</button><button type="button" class="lj-primary" data-save-archive>'+ (remove?'确认删除':'保存名称')+'</button></div>');
    const save=layer.querySelector('[data-save-archive]'),field=layer.querySelector('input'),error=layer.querySelector('[data-archive-error]');
    if(field){field.focus();field.select();field.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();save.click();}});}
    save.onclick=async()=>{
      if(archiveBusy)return;
      archiveBusy=true;const controls=[...layer.querySelectorAll('button,input')];controls.forEach(el=>el.disabled=true);
      try {
        const context=ctx(),id=context.characters.findIndex(c=>c?.avatar===avatar),c=context.characters[id];
        if(!c)throw Error('这个角色已被移除。');
        if(context.streamingProcessor)throw Error('请先等待当前回复完成。');
        const list=await sessions(c,true,true), item=list.find(f=>chatFile(f.file_name)===chatFile(file));
        if(!item)throw Error('存档已被移走，请关闭后重新打开存档管理。');
        const oldName=chatFile(item.file_name),current=selected()?.avatar===avatar && chatFile(ctx().chatId)===oldName;
        const host=await import('/script.js');
        if(host.is_send_press || host.isGenerating?.())throw Error('请先等待当前回复完成。');
        if(current)await ctx().saveChat();
        host.cancelDebouncedChatSave?.();
        if(remove){
          // Switch first so delayed native saves cannot recreate the deleted file.
          const next=list.find(f=>f.started && f.file_name!==item.file_name)||list.find(f=>f.file_name!==item.file_name);
          if(current){
            if(next)await ctx().openCharacterChat(chatFile(next.file_name));
            else if(host.closeCurrentChat){if(!await host.closeCurrentChat())throw Error('请先停止当前回复。');}
            else {
              const closed=await new Promise(resolve=>{
                const type=context.eventTypes.CHAT_CHANGED;
                const done=()=>{if(selected()?.avatar===avatar)return;finish(true);};
                const finish=value=>{W.clearTimeout(timer);context.eventSource.removeListener(type,done);resolve(value);};
                const timer=W.setTimeout(()=>finish(false),8000);
                context.eventSource.on(type,done);$('#option_close_chat')?.click();
              });
              if(!closed)throw Error('请先退出当前对话，再删除这个存档。');
            }
            if(selected()?.avatar===avatar && chatFile(ctx().chatId)===oldName)throw Error('当前存档尚未退出，请重试。');
          }
          await post('/api/chats/delete',{avatar_url:avatar,chatfile:item.file_name});
          if(chatFile(c.chat)===oldName){
            c.chat=next?chatFile(next.file_name):'';
            const response=await W.fetch('/api/characters/merge-attributes',{method:'POST',headers:ctx().getRequestHeaders(),body:JSON.stringify({avatar,chat:c.chat})});
            if(!response.ok)console.warn('[建设主题] 最近存档指向未保存');
          }
          if(preferences().lastChats[avatar]===oldName)delete preferences().lastChats[avatar];
          for(let i=pageTrail.length-1;i>=0;i--)if(pageTrail[i].avatar===avatar && chatFile(pageTrail[i].file)===oldName)pageTrail.splice(i,1);
          const type=context.eventTypes.CHAT_DELETED;if(type)await context.eventSource.emit(type,oldName);
        }else{
          const name=chatFile(field.value.trim());
          if(!name || name==='.' || name==='..' || /[\\/:*?"<>|\x00-\x1f]/.test(name))throw Error('请填写名称，并去掉路径符号。');
          if(name===oldName){closeDialog(layer);return;}
          if(list.some(f=>chatFile(f.file_name).toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('已有同名存档，请换一个名称。');
          const result=await post('/api/chats/rename',{is_group:false,avatar_url:avatar,original_file:item.file_name,renamed_file:name+'.jsonl'});
          if(result?.error)throw Error('名称未能保存，请重试。');
          const actual=result.sanitizedFileName||name;
          if(chatFile(c.chat)===oldName){
            c.chat=actual;
            const response=await W.fetch('/api/characters/merge-attributes',{method:'POST',headers:ctx().getRequestHeaders(),body:JSON.stringify({avatar,chat:actual})});
            if(!response.ok)console.warn('[建设主题] 最近存档指向未保存');
          }
          if(preferences().lastChats[avatar]===oldName)preferences().lastChats[avatar]=actual;
          for(const page of pageTrail)if(page.avatar===avatar && chatFile(page.file)===oldName){page.file=actual;page.chatKey=JSON.stringify([avatar,actual]);}
          if(current){if($('#selected_chat_pole'))$('#selected_chat_pole').value=actual;await ctx().reloadCurrentChat();}
          const type=context.eventTypes.CHAT_RENAMED;if(type)await context.eventSource.emit(type,{avatarId:avatar,oldFileName:item.file_name,newFileName:actual+'.jsonl'});
        }
        sessionData.delete(avatar);ctx().saveSettingsDebounced();
        const remaining=await sessions(c,true,true);applyArchiveCount(c,remaining.filter(f=>f.started),true);
        if(!layer.isConnected)return;
        closeDialog(layer);const parent=visibleDialog();
        if(parent?.dataset.archiveAvatar===avatar){
          const area=parent.querySelector('[data-archives]'),started=remaining.filter(f=>f.started),previews=remaining.filter(f=>!f.started);
          area.innerHTML=sessionItems(started,id)||'<p class="lj-muted">还没有已开始的存档。</p>';
          if(previews.length)area.insertAdjacentHTML('beforeend','<details class="lj-preview-archives" open><summary>未开始的预览（'+previews.length+'）</summary>'+sessionItems(previews,id)+'</details>');
        }
        const expanded=root?.querySelector('[data-sessions="'+id+'"]');
        if(expanded&&!expanded.hidden)expanded.innerHTML='<button class="lj-soft" data-action="manage-archives" data-id="'+id+'">管理存档</button>'+sessionItems(remaining.filter(f=>f.started),id);
        render();toast(remove?'存档已删除':'存档名称已保存');
      }catch(e){error.textContent=e.message;}
      finally{archiveBusy=false;controls.forEach(el=>el.disabled=false);}
    };
  }
  async function exportCurrentChat(format) {
    const c=ctx(), filename=chatFile(c.chatId);
    if(!filename || !['jsonl','txt'].includes(format)) return;
    const body={is_group:c.groupId!=null,avatar_url:selected()?.avatar,file:filename+'.jsonl',exportfilename:filename+'.'+format,format};
    await c.saveChat();
    const data=await post('/api/chats/export',body);
    if(typeof data.result!=='string') throw Error('未能导出当前存档');
    downloadData(body.exportfilename,data.result,format==='txt'?'text/plain':'application/x-ndjson');
    portal.querySelector('.lj-modal-backdrop')?.remove();
  }
  async function handleProfileAction(action,el) {
    if(action==='profile-tab') {profileTab=el.dataset.tab;render();$('#lj-root .lj-profile')?.scrollTo(0,0);}
    else if(action==='profile-cover')openCardIntroduction(selected());
    else if(action==='profile-stream'){const field=streamControl();if(field && field.checked!==(el.dataset.mode==='0'))field.click();render();}
    else if(action==='profile-regex')await openExtensionGroup('#regex_presets_block');
    else if(action==='profile-archives')await profileArchives();
    else if(action==='profile-restart'){
      modal('重启对话','<p>选择一个开场白，开始新的存档。当前剧情仍可在「存档」中打开。</p>'+storyCards(),'720px');
    } else if(action==='profile-export'){
      modal('导出当前对话','<div class="lj-archive-tools"><button class="lj-soft" data-action="profile-download" data-format="txt">导出聊天文本（TXT）</button><button class="lj-soft" data-action="profile-download" data-format="jsonl">导出完整存档（JSONL）</button></div>','430px');
    } else if(action==='profile-download')await exportCurrentChat(el.dataset.format);

  }

    // Only a preset name and an opaque connection reference belong in the chat file.
  let pairQueue = Promise.resolve(), pairDialog = null, pairFailure = '';
  function pairScope() {
    const c = ctx();
    return c?.chatId ? JSON.stringify([c.groupId ?? selected()?.avatar, c.chatId]) : '';
  }
  function savedPair() { return ctx()?.chatMetadata?.[KEY]?.pairing; }
  function pairWork(job) {
    const next = pairQueue.then(job);
    pairQueue = next.catch(()=>{});
    return next;
  }
  function pairApi(value) {
    const config = ctx().CONNECT_API_MAP?.[value];
    return config?.source || (config?.type === 'openrouter' ? 'openrouter-text' : config?.type) || value;
  }
  async function pairCommand(name, value = '', args = {}) {
    const command = ctx().SlashCommandParser?.commands?.[name];
    if (!command) throw Error('酒馆缺少连接操作 '+name);
    return String(await command.callback({quiet:'true', ...args}, value) ?? '');
  }
  const pairEndpointApis = ['custom','vertexai','zai','siliconflow','minimax','pollinations','kobold'];
  function pairHasUrl(api) {
    return pairEndpointApis.includes(api) || ctx().CONNECT_API_MAP?.[api]?.selected === 'textgenerationwebui';
  }
  function pairManager(api) {
    const type = ctx().CONNECT_API_MAP?.[api]?.selected || ctx().mainApi;
    return type === 'koboldhorde' ? 'kobold' : type;
  }
  async function activePairConnection() {
    const api = pairApi(await pairCommand('api'));
    const model = await pairCommand('model');
    const url = pairHasUrl(api) ? await pairCommand('api-url','',{connect:'false'}) : '';
    const secret = supportsKeySelection() ? await pairCommand('secret-id') : '';
    const proxy = pairManager(api)==='openai' ? await pairCommand('proxy') : '';
    return {api,model,url,secret,proxy};
  }
  function pairProfileRows() {
    return (ctx().extensionSettings.connectionManager?.profiles || []).map(p=>({
      ref:'profile:'+p.id, label:p.name, api:pairApi(p.api || ''), model:p.model || '',
      url:(!p.api || pairHasUrl(pairApi(p.api))) ? p['api-url'] || '' : '', secret:p['secret-id'] || '', proxy:p.proxy || '',
      mode:p.mode, profile:true,
    }));
  }
  function pairMatches(expected, actual) {
    return ['api','model','url','secret','proxy'].every(key=>!expected[key] || expected[key]===actual[key]);
  }
  function pairSameConnection(a,b) {
    return ['api','model','url','secret','proxy'].every(k=>(a[k]||'')===(b[k]||''));
  }
  function pairSecretKey(api) {
    if (api==='vertexai' && ctx().chatCompletionSettings?.vertexai_auth_mode==='full') return 'vertexai_service_account_json';
    return 'api_key_'+(api==='openrouter-text'?'openrouter':api);
  }
  function pairSecretLabel(label) {
    return !label || /^api_key_|^unlabeled$|^sk-|^AIza|^Bearer\s/i.test(label) || /^[\w-]{32,}$/.test(label) ? '' : label;
  }
  const samplerFields=new Set("add_bos_token ban_eos_token banned_tokens do_sample dry_allowed_length dry_base dry_multiplier dry_penalty_last_n dry_sequence_breakers dynatemp dynatemp_exponent early_stopping encoder_rep_pen epsilon_cutoff eta_cutoff freq_pen frequency_penalty grammar grammar_string guidance_scale ignore_eos_token json_schema json_schema_allow_empty length_penalty logit_bias max_temp min_keep min_length min_p min_temp mirostat mirostat_eta mirostat_mode mirostat_tau negative_prompt no_repeat_ngram_size nsigma num_beams openai_max_context openai_max_tokens penalty_alpha presence_pen presence_penalty rep_pen rep_pen_decay rep_pen_range rep_pen_size rep_pen_slope sampler_order sampler_priority samplers samplers_priorities seed skew skip_special_tokens smoothing_curve smoothing_factor spaces_between_special_tokens speculative_ngram temp temperature temperature_last tfs top_a top_k top_p typical typical_p use_default_badwordsids xtc_probability xtc_threshold".split(' '));
  function parameterOnly(p){
    if(!p||Array.isArray(p)||!Object.keys(p).some(k=>samplerFields.has(k)))return false;
    return Object.entries(p).every(([key,value])=>{
      if(value==null||value===''||Array.isArray(value)&&value.length===0)return true;
      if(key==='name')return true;
      if(!samplerFields.has(key))return false;
      if(typeof value==='number'||typeof value==='boolean')return true;
      return ['sampler_order','sampler_priority','samplers','samplers_priorities','dry_sequence_breakers'].includes(key);
    });
  }
  function pairPresetRows(apis,onlyParameters=false) {
    const rows=[];
    for (const engine of new Set(apis.map(pairManager))) {
      const manager=ctx().getPresetManager?.(engine), list=manager?.getPresetList();
      if (!list) continue;
      const entries=Array.isArray(list.preset_names)?list.preset_names.map((name,i)=>[name,i]):Object.entries(list.preset_names||{});
      for (const [name,i] of entries) {
        const p=list.presets?.[i] || {};
        if(parameterOnly(p)!==onlyParameters || name==='gui')continue;
        rows.push({engine,name,title:bookTitle(p,name),count:Array.isArray(p.prompts)?p.prompts.length:0,description:bookInfo(p).description || p.description || '', key:JSON.stringify([engine,name])});
      }
    }
    return rows;
  }
  function presetSummary(row) {
    return `<small>${row.count} 条提示词</small>${row.description?`<small>${escapeHtml(row.description)}</small>`:''}`;
  }
  async function pairCatalog() {
    const active=await activePairConnection(), rows=pairProfileRows();
    const selectedId=ctx().extensionSettings.connectionManager?.selectedProfile;
    const matches=rows.filter(row=>pairMatches(row,active));
    const current=(matches.find(row=>row.ref==='profile:'+selectedId)||matches[0])?.ref;
    return {active,current,rows,presets:pairPresetRows([active.api,...rows.map(row=>row.api).filter(Boolean)])};
  }
  function pairTarget(choice) {
    const prefs=preferences(), rows=pairProfileRows();
    const ref=prefs.pairAliases?.[choice.connection] || choice.connection;
    const exact=rows.find(r=>r.ref===ref);
    if(exact)return exact;
    const legacy=prefs.pairConnections?.[choice.connection];
    if(legacy){
      const matches=rows.filter(r=>pairSameConnection(r,legacy));
      if(matches.length===1)return matches[0];
    }
    throw Error('这个存档使用的 API 已移除，请重新选择搭配。');
  }
  function pairFamily(r) {
    const name=(r.model+' '+r.label+' '+r.api).toLowerCase();
    if (/gemini|双子|makersuite|vertexai/.test(name)) return 'Gemini';
    if (/claude|anthropic/.test(name)) return 'Claude';
    if (/gpt|openai\b/.test(name)) return 'GPT';
    return '其他';
  }
  async function applyPairConnection(row) {
    const before=await activePairConnection(), api=row.api || before.api;
    const config=ctx().CONNECT_API_MAP?.[api];
    if (!config) throw Error('找不到这个 API 类型。');
    const targetKey=pairSecretKey(api);
    // Stage this provider's address before native /api can start a connection check.
    if (row.url && pairHasUrl(api)) {
      const args={api:config.type || api,connect:'false'};
      if (await pairCommand('api-url','',args)!==row.url && await pairCommand('api-url',row.url,args)!==row.url) throw Error('API 地址未能切换。');
    }
    if (row.secret && await pairCommand('secret-id','',{key:targetKey})!==row.secret) {
      if (await pairCommand('secret-id',row.secret,{key:targetKey})!==row.secret) throw Error('找不到这个 API 的密钥。');
    }
    if(row.proxy && before.proxy!==row.proxy && await pairCommand('proxy',row.proxy)!==row.proxy) throw Error('找不到这个代理配置。');
    if (api!==before.api) await pairCommand('api',api);
    if (row.model && await pairCommand('model')!==row.model && await pairCommand('model',row.model)!==row.model) throw Error('酒馆未能选中模型 '+row.model+'。');
    if (!pairMatches(row,await activePairConnection())) throw Error('酒馆实际启用的连接与所选 API 不一致。');
  }
  async function applyPair(choice,row) {
    const c=ctx(), manager=c.getPresetManager(choice.engine);
    const key=manager?.findPreset(choice.preset);
    if (key===undefined || key===null) throw Error('找不到存档使用的预设「'+choice.preset+'」。');
    if (row.api && pairManager(row.api)!==choice.engine) throw Error('这套预设和 API 使用不同的酒馆接口格式，请选择同一格式。');
    // Skip native connection fields on the temporary copy only, even when ST binds connections to presets.
    const type=c.eventTypes.OAI_PRESET_CHANGED_BEFORE;
    const keepConnection=({preset,presetName,settingsToUpdate})=>{
      if (presetName===choice.preset) for(const [key,spec] of Object.entries(settingsToUpdate)) if(spec[3]) delete preset[key];
    };
    if (choice.engine==='openai' && type) c.eventSource.on(type,keepConnection);
    try {
      await applyPairConnection(row);
      if (manager.getSelectedPresetName()!==choice.preset) await manager.selectPreset(key);
      if (manager.getSelectedPresetName()!==choice.preset || !pairMatches(row,await activePairConnection())) throw Error('酒馆未能应用这套搭配。');
    } finally { if (choice.engine==='openai' && type) c.eventSource.removeListener(type,keepConnection); }
  }
  async function confirmPair(scope,preset,row) {
    return pairWork(async()=>{
      if (!scope || pairScope()!==scope) throw Error('聊天已切换，请在当前存档重新选择。');
      const active=await activePairConnection(), previous={engine:pairManager(active.api),preset:currentPreset()};
      const c=ctx(), meta=c.chatMetadata, prior=meta[KEY]?.pairing;
      if (row.unavailable) throw Error(row.unavailable);
      const target=pairTarget({connection:row.ref});
      if(!pairSameConnection(target,row))throw Error('连接已更改，请重新选择。');
      const choice={engine:preset.engine,preset:preset.name,connection:target.ref};
      let touched=false;
      try {
        await applyPair(choice,target);
        if (pairScope()!==scope) throw Error('聊天已切换。');
        meta[KEY] ||= {}; meta[KEY].pairing=choice; touched=true;
        await c.saveMetadata();
        const stored=c.groupId!=null ? await post('/api/chats/group/get',{id:c.chatId}) :
          await post('/api/chats/get',{avatar_url:c.characters[c.characterId].avatar,file_name:c.chatId});
        const check=stored?.[0]?.chat_metadata?.[KEY]?.pairing;
        if(!check || ['connection','engine','preset'].some(k=>check[k]!==choice[k])) throw Error('没有确认写入当前存档，请重试。');
        pairFailure='';
      } catch(e) {
        if(touched){if(prior) meta[KEY].pairing=prior;else delete meta[KEY].pairing;}
        if(pairScope()===scope) await applyPair(previous,active).catch(()=>{});
        throw e;
      }
    });
  }
  function restorePair() {
    const scope=pairScope();
    if (pairDialog && pairDialog.scope!==scope) pairDialog.close(true);
    return pairWork(async()=>{
      const choice=savedPair();
      if (!scope || pairScope()!==scope || !choice) {pairFailure='';return;}
      try { await applyPair(choice,pairTarget(choice)); pairFailure=''; }
      catch(e){pairFailure=e.message;if(pairScope()===scope) toast(e.message);}
    });
  }
  function mountPairing(context) {
    const handlers={
      CHAT_CHANGED:restorePair,
      GENERATION_STARTED:async(_type,_options,dry)=>{if(!dry){await pairQueue;if(savedPair())await restorePair();}},
      GENERATION_AFTER_COMMANDS:(_type,_options,dry)=>{if(!dry && savedPair() && pairFailure) ctx().stopGeneration();},
    };
    for(const [event,handler] of Object.entries(handlers)) {
      const type=context.eventTypes[event];
      if(type){context.eventSource.on(type,handler);listeners.push(()=>context.eventSource.removeListener(type,handler));}
    }
    restorePair();
  }
  function pairToolbarLabel() {
    const choice=savedPair();
    if(choice) {
      try {const r=pairTarget(choice);return bookTitle(bookSource(choice.preset,choice.engine),choice.preset)+' · '+(r.label||r.model||r.api);}
      catch {return choice.preset+' · 请选择 API';}
    }
    const model=ctx()?.mainApi==='openai'?ctx().getChatCompletionModel?.():'';
    return [currentPreset(),model].filter(Boolean).join(' · ');
  }
  async function openPairPicker() {
    if (pairDialog) return;
    const scope=pairScope();
    if (!scope) {toast('请先打开聊天存档。');return;}
    function pairSearch(kind,title,label,placeholder){
      return `<header><h2>${title}</h2><button type="button" class="lj-iconbutton" data-pair="search" aria-label="${label}" aria-expanded="false" aria-controls="lj-pair-${kind}-search">${icon('search')}</button></header>
        <input type="search" id="lj-pair-${kind}-search" placeholder="${placeholder}" aria-label="${placeholder}" hidden>`;
    }
    const overlay=modal('预设及模型设置',`<div class="lj-pair-grid"><div class="lj-pair-body"><section class="lj-pair-left">${pairSearch('preset','预设选择','搜索预设','搜索预设名称')}<div class="lj-pair-list" data-list="presets" role="group" aria-label="预设"></div><p class="lj-pair-empty" data-preset-empty hidden></p></section>
      <section class="lj-pair-right">${pairSearch('model','<span class="lj-wide-title">模型选择</span><span class="lj-phone-title">模型切换</span>','搜索模型','搜索模型或连接名')}<div class="lj-pair-filters" aria-label="模型系列"></div><div class="lj-pair-list" data-list="models" role="group" aria-label="已接入的 API"></div></section></div>
      <footer><span class="lj-pair-summary" aria-live="polite">正在读取酒馆配置…</span><button type="button" class="lj-soft" data-pair="cancel">取消</button><button type="button" class="lj-primary" data-pair="confirm" disabled>确认</button></footer></div>`,'960px');
    overlay.classList.add('lj-pair-layer');
    const find=s=>overlay.querySelector(s), presetQuery=find('#lj-pair-preset-search'), modelQuery=find('#lj-pair-model-search'), summary=find('.lj-pair-summary');
    const ok=find('[data-pair="confirm"]'), presets=find('[data-list="presets"]'), models=find('[data-list="models"]');
    let data, presetKey='', connectionRef='', family='全部', busy=false, countObserver;
    function close(force=false) {
      if (busy && !force) return;
      countObserver?.disconnect();overlay.remove(); pairDialog=null;syncCardWidgets();
      toolbar?.querySelector('.lj-toolbar-preset')?.focus({preventScroll:true});
    }
    pairDialog={scope,close};syncCardWidgets();
    find('[data-pair="cancel"]').focus({preventScroll:true});
    function update() {
      const p=data.presets.find(p=>p.key===presetKey), r=data.rows.find(r=>r.ref===connectionRef);
      for (const b of overlay.querySelectorAll('[data-choice]')) b.setAttribute('aria-pressed',String(b.dataset.choice==='preset'?b.dataset.id===presetKey:b.dataset.id===connectionRef));
      const incompatible=p && r?.api && pairManager(r.api)!==p.engine;
      summary.textContent=incompatible?'请选择相同酒馆接口格式的预设和模型':(p&&r?'已选择 '+r.label:'请选择预设和模型');
      summary.title=summary.textContent;
      ok.disabled=busy || !p || !r || Boolean(incompatible) || Boolean(r?.unavailable);
    }
    function filterPresets(){
      const text=presetQuery.value.trim().toLowerCase();
      let matches=0;
      for(const card of presets.children){
        card.hidden=!card.dataset.search.includes(text);
        if(!card.hidden)matches++;
      }
      const empty=find('[data-preset-empty]');
      empty.hidden=matches>0;
      empty.textContent=text?'没有找到匹配的预设。':'还没有可用的预设。';
    }
    function modelList() {
      const text=modelQuery.value.trim().toLowerCase();
      const visible=data.rows.filter(r=>(family==='全部'||pairFamily(r)===family)&&[r.label,r.model,r.api].join(' ').toLowerCase().includes(text));
      models.innerHTML=visible.map(r=>{
        const details=[r.model && r.model!==r.label?r.model:'',r.api==='custom'?'兼容 OpenAI':r.api,r.unavailable].filter(Boolean);
        return `<button type="button" class="lj-pair-card" data-choice="model" data-id="${escapeHtml(r.ref)}" ${r.unavailable?'disabled':''}><strong>${escapeHtml(r.label)}</strong><small>${escapeHtml(details.join(' · '))}</small></button>`;
      }).join('') || '<p class="lj-pair-empty">没有找到匹配的连接。</p>';
      update();
    }
    overlay.addEventListener('input',e=>{
      if(!data)return;
      if(e.target===presetQuery)filterPresets();
      if(e.target===modelQuery)modelList();
    });
    overlay.addEventListener('keydown',e=>{
      if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();return;}
      if(e.key!=='Tab')return;
      const items=[...overlay.querySelectorAll('button:not(:disabled),input')].filter(el=>el.getClientRects().length);
      if(!items.length)return;
      if(e.shiftKey && D.activeElement===items[0]){e.preventDefault();items.at(-1).focus();}
      else if(!e.shiftKey && D.activeElement===items.at(-1)){e.preventDefault();items[0].focus();}
    });
    overlay.addEventListener('click',async e=>{
      e.stopPropagation();
      const b=e.target.closest('button');
      if(e.target===overlay || b?.dataset.pair==='cancel' || b?.dataset.action==='close-modal'){close();return;}
      if (!b || busy || !data) return;
      if(b.dataset.pair==='search'){
        const input=D.getElementById(b.getAttribute('aria-controls'));
        input.hidden=!input.hidden;
        b.setAttribute('aria-expanded',String(!input.hidden));
        if(input.hidden){input.value='';if(input===presetQuery)filterPresets();else modelList();}
        else input.focus();
        return;
      }
      if(b.dataset.family){family=b.dataset.family;for(const t of find('.lj-pair-filters').children)t.setAttribute('aria-pressed',String(t===b));modelList();return;}
      if(b.dataset.choice){if(b.dataset.choice==='preset')presetKey=b.dataset.id;else connectionRef=b.dataset.id;update();return;}
      if(b===ok){
        const p=data.presets.find(p=>p.key===presetKey),r=data.rows.find(r=>r.ref===connectionRef);
        busy=true;ok.disabled=true;overlay.setAttribute('aria-busy','true');summary.textContent='正在应用搭配…';
        try {await confirmPair(scope,p,r);if(pairDialog?.scope===scope){ensureToolbar();close(true);toast('搭配已保存到当前聊天');}}
        catch(error){if(overlay.isConnected){busy=false;update();summary.textContent=error.message;}}
        finally {busy=false;overlay.removeAttribute('aria-busy');}
      }
    });
    try {
      await pairQueue;
      data=await pairCatalog();
      if(!overlay.isConnected || scope!==pairScope())return;
      const choice=savedPair(), boundRow=choice?data.rows.find(r=>r.ref===choice.connection):null;
      let restored;
      if(choice){try{restored=pairTarget(choice);}catch{}}
      connectionRef=choice?(boundRow?.ref || restored?.ref || ''):(data.current || '');
      presetKey=JSON.stringify([choice?.engine || pairManager(data.active.api), choice?.preset || currentPreset()]);
      presets.innerHTML=data.presets.map(p=>`<button type="button" class="lj-pair-card" data-choice="preset" data-id="${escapeHtml(p.key)}" data-search="${escapeHtml([p.title,p.name].join(' ').toLowerCase())}"><strong>${escapeHtml(p.title||p.name)}</strong><span class="lj-pair-tokens" hidden></span>${presetSummary(p)}</button>`).join('');
      if(W.IntersectionObserver){
        let counts=Promise.resolve();
        countObserver=new W.IntersectionObserver(entries=>{
          for(const entry of entries){
            if(!entry.isIntersecting)continue;
            const card=entry.target;
            countObserver.unobserve(card);
            counts=counts.then(async()=>{
              if(!overlay.isConnected)return;
              const row=data.presets.find(p=>p.key===card.dataset.id),source=bookSource(row.name,row.engine);
              if(!source?.prompts?.length)return;
              const n=await bookTokenCounts(source);
              const label=card.querySelector('.lj-pair-tokens');
              label.textContent=n.enabled.toLocaleString()+' Token';label.hidden=false;
            }).catch(()=>{});
          }
        },{root:presets});
        for(const card of presets.children)countObserver.observe(card);
      }
      filterPresets();
      const families=['全部',...new Set(data.rows.map(pairFamily))];
      find('.lj-pair-filters').innerHTML=families.map(f=>`<button type="button" data-family="${f}" aria-pressed="${f===family}">${f}</button>`).join('');
      modelList();
      const selectedCard=presets.querySelector('[aria-pressed=true]');
      if(selectedCard){
        if(W.matchMedia('(max-width:767px)').matches)presets.scrollLeft+=selectedCard.getBoundingClientRect().left-presets.getBoundingClientRect().left;
        else presets.scrollTop+=selectedCard.getBoundingClientRect().top-presets.getBoundingClientRect().top;
      }
      if(!data.rows.length || !data.presets.length)summary.textContent='请先在预设库或模型连接中添加可用配置。';
    } catch(error) {if(overlay.isConnected)summary.textContent='无法读取配置。'+error.message;}
  }

    async function removePairConnection(row) {
    const manager=profileManager(), profiles=manager.profiles;
    const profile=profiles.find(p=>'profile:'+p.id===row.ref);
    if(!profile)throw Error('这项连接已更改，请重新打开列表。');
    const prefs=preferences(), oldRoutes=prefs.pairConnections,oldAliases=prefs.pairAliases;
    const oldSelection=manager.selectedProfile,aliases=legacyConnections(prefs,pairProfileRows()).aliases;
    manager.profiles=profiles.filter(p=>p!==profile);
    if(manager.selectedProfile===profile.id)manager.selectedProfile=null;
    prefs.pairConnections=Object.fromEntries(Object.entries(oldRoutes||{}).filter(([id])=>aliases[id]!==row.ref));
    prefs.pairAliases=Object.fromEntries(Object.entries(aliases).filter(([,ref])=>ref!==row.ref));
    try{await persist(true);}catch(error){
      prefs.pairConnections=oldRoutes;prefs.pairAliases=oldAliases;
      manager.profiles=profiles;manager.selectedProfile=oldSelection;ctx().saveSettingsDebounced();throw error;
    }
    const select=D.getElementById('connection_profiles');
    if(select){
      [...select.options].find(option=>option.value===profile.id)?.remove();
      if(oldSelection===profile.id)select.value=manager.selectedProfile||'';
    }
    const type=ctx().eventTypes.CONNECTION_PROFILE_DELETED;
    if(type)await ctx().eventSource.emit(type,profile);
  }
  async function removePairPreset(row) {
    const manager=ctx().getPresetManager(row.engine);
    const key=manager?.findPreset(row.name);
    if(key==null || key==='gui')throw Error('这项预设已更改或由酒馆保留。');
    const select=manager.select[0]||manager.select;
    const wasSelected=manager.getSelectedPresetName()===row.name;
    // The native delete helper edits the visible list before it learns whether the file was deleted.
    const response=await W.fetch('/api/presets/delete',{method:'POST',headers:ctx().getRequestHeaders(),
      body:JSON.stringify({apiId:row.engine,name:row.name})});
    if(!response.ok && response.status!==404)throw Error('预设文件删除失败，请重试。');
    const {preset_names,presets}=manager.getPresetList();
    if(Array.isArray(preset_names)){
      const i=preset_names.indexOf(row.name);if(i>=0){preset_names.splice(i,1);presets.splice(i,1);}
    }else delete preset_names[row.name];
    [...select.options].find(option=>option.text===row.name)?.remove();
    if(wasSelected && select.options.length)await manager.selectPreset(select.options[0].value);
    ctx().saveSettingsDebounced();
  }
  async function openPairManagement(kind) {
    const isApi=kind==='rows', title=isApi?'模型连接':'管理预设';
    const layer=modal(title,`<div class="lj-management">
      <div class="lj-manager-bar"><input type="search" aria-label="搜索名称" placeholder="${isApi?'搜索连接名称或模型':'搜索预设名称'}">
      ${isApi?'<button type="button" class="lj-primary" data-new>新增 API</button>':''}</div>
      <div class="lj-manage-rows" aria-live="polite">正在读取…</div><div class="lj-manage-confirm" hidden></div>
      ${isApi?'<button type="button" class="lj-soft" data-action="original-options" data-panel="api">当前连接的服务商专属选项</button> <button type="button" class="lj-cleanup-link" data-clean>清理旧连接和未使用的密钥</button>':''}</div>`,'650px');
    const area=layer.querySelector('.lj-manage-rows'), confirmation=layer.querySelector('.lj-manage-confirm'), query=layer.querySelector('input');
    let rows=[], busy=false;
    const identity=r=>r.key||r.ref;
    function draw(){
      const term=query.value.trim().toLowerCase();
      area.innerHTML=rows.filter(r=>[r.title,r.name,r.label,r.api,r.model,r.description].filter(Boolean).join(' ').toLowerCase().includes(term)).map(r=>{
        const name=escapeHtml(r.title||r.label||r.name), id=escapeHtml(identity(r));
        const info=`<strong>${name}</strong>${isApi?`<small>${escapeHtml(apiDescription(r))}</small>`:presetSummary(r)}`;
        return isApi?`<button class="lj-api-card" data-edit="${id}"><span>${info}</span>${icon('edit')}</button>`:
          `<div class="lj-manage-row"><div>${info}</div><button type="button" class="lj-soft" aria-label="删除 ${name}" data-remove="${id}">删除</button></div>`;
      }).join('')||'<p class="lj-muted">没有匹配的配置。</p>';
    }
    async function read(){
      rows=isApi?pairProfileRows():pairPresetRows(Object.keys(ctx().CONNECT_API_MAP||{}));
      draw();
    }
    query.addEventListener('input',draw);
    layer.addEventListener('lj-resume',read);
    layer.addEventListener('click',async e=>{
      const b=e.target.closest('button');if(!b || busy)return;
      try{
        if(b.hasAttribute('data-new') || b.hasAttribute('data-edit')){
          await openApiEditor(rows.find(r=>r.ref===b.dataset.edit));return;
        }
        if(b.hasAttribute('data-clean')){await openApiCleanup();return;}
        if(b.dataset.remove){
          const target=rows.find(r=>r.key===b.dataset.remove);if(!target)return;
          confirmation.hidden=false;
          confirmation.innerHTML=`<strong>删除「${escapeHtml(target.title||target.name)}」？</strong><p>使用它的存档需要重新选择预设。</p><button class="lj-soft" data-cancel>取消</button> <button class="lj-primary" data-delete="${escapeHtml(target.key)}">确认删除</button>`;
          confirmation.querySelector('button').focus();return;
        }
        if(b.hasAttribute('data-cancel')){confirmation.hidden=true;return;}
        if(b.dataset.delete){
          busy=true;b.disabled=true;
          const target=rows.find(r=>r.key===b.dataset.delete);
          await pairWork(()=>removePairPreset(target));confirmation.hidden=true;await read();toast('已删除预设');
        }
      }catch(error){toast(error.message);}finally{busy=false;b.disabled=false;}
    });
    await read();
  }

  async function cleanParameterPresets(){
    const apis=Object.keys(ctx().CONNECT_API_MAP||{}),rows=pairPresetRows(apis,true);
    if(!rows.length){toast('没有需要清理的纯参数预设');return;}
    const layer=modal('删除纯参数预设',`<p>以下 ${rows.length} 份文件只保存生成参数。删除后使用它们的存档需要重新选择预设。</p><ul>${rows.map(r=>'<li>'+escapeHtml(r.name)+'</li>').join('')}</ul><button class="lj-primary" data-clean-files>删除列出的 ${rows.length} 份预设</button>`);
    layer.querySelector('[data-clean-files]').addEventListener('click',async event=>{
      const button=event.currentTarget;button.disabled=true;let count=0;
      try{await pairWork(async()=>{for(const row of rows){if(parameterOnly(bookSource(row.name,row.engine))){await removePairPreset(row);count++;}}});closeDialog(layer);render();toast('已删除 '+count+' 份纯参数预设');}
      catch{closeDialog(layer);render();toast('已删除 '+count+' 份，请重新打开列表处理剩余文件。');}
    });
  }

    const providerNames={custom:'自定义（兼容 OpenAI）',makersuite:'Google AI Studio',claude:'Anthropic Claude',openai:'OpenAI',vertexai:'Google Vertex AI',openrouter:'OpenRouter'};
  function apiDescription(r){return [r.model,providerNames[r.api]||r.api].filter(Boolean).join(' · ');}
  function profileManager(){
    const manager=ctx().extensionSettings.connectionManager;
    if(!Array.isArray(manager?.profiles))throw Error('请先启用酒馆的连接配置扩展。');
    return manager;
  }
  function supportsKeySelection() {
    return Boolean(ctx().SlashCommandParser?.commands?.['secret-id']);
  }
  function apiKeyModule(){
    // Load the host's own module instance even when the theme runs inside a Tavern Helper frame.
    return frame===W?import('/scripts/secrets.js'):W.Function('return import("/scripts/secrets.js")')();
  }
  async function editApiProfile(original,values){
    const manager=profileManager(), profiles=manager.profiles;
    const existing=original?profiles.find(p=>p.id===original.id):null;
    if(original && JSON.stringify(original)!==JSON.stringify(existing))throw Error('连接已经更改，请返回列表后重新打开。');
    if(!values.name || !values.model || !ctx().CONNECT_API_MAP?.[values.api])throw Error('请填写连接名称、服务商和模型名称。');
    if(profiles.some(p=>p!==existing && p.name===values.name))throw Error('这个连接名称已经存在。');
    if(values.api==='custom' && !values.url)throw Error('请填写 API 地址。');
    if(values.url && !/^https?:\/\//i.test(values.url))throw Error('API 地址需要以 http 或 https 开头。');
    if(values.url){try{new URL(values.url);}catch{throw Error('请输入完整的 API 地址。');}}
    const prefs=preferences(), oldAliases=prefs.pairAliases;
    const aliases=legacyConnections(prefs,pairProfileRows()).aliases;
    const api=values.api, key=pairSecretKey(api), previousApi=pairApi(existing?.api||'');
    const row={...existing,id:existing?.id||ctx().uuidv4(),name:values.name,api,model:values.model,mode:pairManager(api)==='openai'?'cc':'tc'};
    if(row.mode==='cc' && !existing)row.proxy='None';
    if(existing && api!==previousApi)delete row.proxy;
    if(values.url)row['api-url']=values.url;else delete row['api-url'];
    if(values.secret)row['secret-id']=values.secret;else delete row['secret-id'];
    row.exclude=(row.exclude||[]).filter(k=>!['api','model','api-url','secret-id'].includes(k));
    const sharedKey = !supportsKeySelection();
    if (sharedKey && values.secret) throw Error('此版本的酒馆按服务商共用密钥。请重新打开连接并选择当前密钥。');
    const items=(await post('/api/secrets/read',{}))[key];
    const secrets=Array.isArray(items) ? items : [];
    if(!values.password && values.secret && !secrets.some(s=>s.id===values.secret))throw Error('所选密钥已更改，请重新打开连接。');
    let fresh='',vault;
    try{
      if(values.password && !sharedKey){
        vault=await apiKeyModule();
        const previous=secrets.find(s=>s.active)?.id;
        fresh=await vault.writeSecret(key,values.password,values.name);
        if(!fresh)throw Error('密钥保存失败。');
        if(previous){await vault.rotateSecret(key,previous);}
        row['secret-id']=fresh;
      }
      prefs.pairAliases=aliases;
      manager.profiles=existing?profiles.map(p=>p===existing?row:p):[...profiles,row];
      await persist(true);
      if(values.password && sharedKey){
        // Older hosts keep one credential per provider. Persist the profile before replacing it.
        vault=await apiKeyModule();
        const response=await W.fetch('/api/secrets/write',{method:'POST',headers:ctx().getRequestHeaders(),
          body:JSON.stringify({key,value:values.password})});
        if(!response.ok)throw Error('服务商密钥保存失败，请重试。');
        await vault.readSecretState();
      }
    }catch(error){
      prefs.pairAliases=oldAliases;manager.profiles=profiles;ctx().saveSettingsDebounced();
      if(fresh)await vault.deleteSecret(key,fresh);
      throw error;
    }
    const select=D.getElementById('connection_profiles');
    if(select){
      let option=[...select.options].find(o=>o.value===row.id);
      if(!option){option=D.createElement('option');option.value=row.id;select.append(option);}
      option.textContent=row.name;
    }
    const event=ctx().eventTypes[existing?'CONNECTION_PROFILE_UPDATED':'CONNECTION_PROFILE_CREATED'];
    if(event)await ctx().eventSource.emit(event,...(existing?[existing,row]:[row]));
    return row;
  }
  async function sendConnectionTest(profile,signal){
    const service=ctx().ConnectionManagerRequestService;
    if(!service?.sendRequest)throw Error('酒馆的连接配置扩展未就绪，请检查扩展后重试。');
    if(!service.isProfileSupported(profile))throw Error('酒馆暂未提供此接口的测试消息功能。');
    const current=profileManager().profiles.find(item=>item.id===profile.id);
    if(JSON.stringify(current)!==JSON.stringify(profile))throw Error('这条连接刚刚被修改，请重新打开。');
    let result;
    try{
      result=await service.sendRequest(profile.id,'Hi',128,{
        signal,stream:false,includePreset:false,includeInstruct:false,extractData:true,
      });
    }catch(error){
      if(signal.aborted)throw error;
      const message=String(error.cause?.message||error.message||'');
      if(/401|403|unauthori[sz]ed|invalid.*key/i.test(message))throw Error('服务商拒绝了身份验证，请检查这条连接的密钥和权限。');
      if(/429|quota|rate.?limit/i.test(message))throw Error('服务商报告额度或请求频率受限，请检查余额或稍后重试。');
      throw Error('未收到模型回复，请检查服务商、模型名称、连接地址和密钥。');
    }
    if(!String(result?.content||result?.reasoning||'').trim())throw Error('已收到服务商响应，但回复为空。');
  }
  async function openApiEditor(row){
    const original=row?profileManager().profiles.find(p=>'profile:'+p.id===row.ref):null;
    if(row && !original)throw Error('这条连接已经被删除。');
    let snapshot=original?JSON.parse(JSON.stringify(original)):null;
    const providers=[...new Set(['custom',...Object.keys(ctx().CONNECT_API_MAP||{}).map(pairApi)])].filter(p=>ctx().CONNECT_API_MAP[p]);
    const state=await post('/api/secrets/read',{});
    const layer=modal(row?'编辑 API':'新增 API',`<form class="lj-api-form">
      <label>连接名称<input name="label" required autocomplete="off"></label>
      <label>服务商或接口协议<select name="provider"></select></label>
      <label data-url>API 地址<input name="endpoint" type="url" placeholder="https://…/v1" autocomplete="off"></label>
      <label>模型名称<input name="model" required autocomplete="off"></label>
      <label ${supportsKeySelection()?'':'hidden'}>已保存的密钥<select name="credential"></select></label>
      <label>${supportsKeySelection()?'填写新密钥':'服务商共用密钥'}<input name="password" type="password" autocomplete="new-password" placeholder="留空使用上方选择"></label>
      <div class="lj-connection-test"><button type="button" class="lj-soft" data-test>发送测试消息</button>
      <button type="button" class="lj-soft" data-stop hidden>停止测试</button><p class="lj-muted lj-small" data-test-hint></p></div>
      <p role="status" aria-live="polite" data-status></p>
      <div class="lj-api-footer"><button type="button" class="lj-api-delete" data-delete ${row?'':'hidden'}>删除连接</button><button class="lj-primary" type="submit">保存</button></div>
      <div class="lj-manage-confirm" hidden><strong>删除这条连接？</strong><p>使用它的存档需要重新选择模型。</p><button type="button" class="lj-soft" data-cancel>取消</button> <button type="button" class="lj-primary" data-confirm>确认删除</button></div>
    </form>`,'550px');
    const form=layer.querySelector('form'), fields=form.elements, status=form.querySelector('[data-status]'), confirm=form.querySelector('.lj-manage-confirm');
    fields.label.value=row?.label||'';fields.model.value=row?.model||'';
    for(const p of providers)fields.provider.add(new W.Option(providerNames[p]||p,p));
    fields.provider.value=row?.api||'custom';
    function changeProvider(){
      const p=fields.provider.value;
      form.querySelector('[data-url]').hidden=!pairHasUrl(p);
      fields.endpoint.disabled=!pairHasUrl(p);fields.endpoint.required=p==='custom';
      fields.endpoint.value=p===row?.api?row.url:'';
      fields.password.value='';
      fields.credential.replaceChildren(new W.Option('使用服务商当前密钥（如有）',''));
      const items=state[pairSecretKey(p)];
      const creds=Array.isArray(items) ? items : [];
      if (!supportsKeySelection()) {
        fields.password.placeholder=items?'已保存。留空沿用，填写将替换该服务商的共用密钥':'填写后，该服务商的所有连接共用此密钥';
        return;
      }
      creds.forEach((item,i)=>fields.credential.add(new W.Option(pairSecretLabel(item.label)||('已保存密钥 '+(i+1)),item.id)));
      fields.credential.value=p===row?.api?row.secret:'';
      if(row?.secret && p===row.api && !creds.some(item=>item.id===row.secret)){
        fields.credential.add(new W.Option('原密钥已缺失，请重新选择',row.secret));fields.credential.value=row.secret;
      }
    }
    changeProvider();fields.provider.addEventListener('change',changeProvider);
    const test=form.querySelector('[data-test]'), stop=form.querySelector('[data-stop]'), hint=form.querySelector('[data-test-hint]');
    function values(){
      return {name:fields.label.value.trim(),api:fields.provider.value,model:fields.model.value.trim(),
        url:fields.endpoint.disabled?'':fields.endpoint.value.trim(),secret:fields.credential.value,password:fields.password.value.trim()};
    }
    let baseline=JSON.stringify(values()),busy=false,controller=null;
    function refreshTest(){
      const modified=!snapshot || JSON.stringify(values())!==baseline;
      test.textContent=modified?'保存并发送测试消息':'发送测试消息';
      hint.textContent='向「'+(fields.model.value.trim()||'所填模型')+'」发送一句 Hi，可能消耗少量额度。';
    }
    refreshTest();form.addEventListener('input',refreshTest);form.addEventListener('change',refreshTest);
    async function write(job,closeAfter=true){
      if(busy)return;busy=true;
      const controls=[...layer.querySelectorAll('button,input,select')].filter(el=>el!==stop && !el.disabled);
      controls.forEach(el=>el.disabled=true);
      try{await job();if(closeAfter && layer.isConnected)closeDialog(layer);}
      catch(e){status.textContent=e.message;}
      finally{busy=false;controls.forEach(el=>el.disabled=false);refreshTest();}
    }
    form.addEventListener('submit',e=>{
      e.preventDefault();const draft=values();
      write(()=>pairWork(async()=>{await editApiProfile(snapshot,draft);toast('已保存连接');}));
    });
    stop.onclick=()=>controller?.abort();
    test.onclick=async()=>{
      if(busy || !form.reportValidity())return;
      const draft=values(), modified=!snapshot || JSON.stringify(draft)!==baseline;
      if(!ctx().ConnectionManagerRequestService?.isProfileSupported?.({api:draft.api})){
        status.textContent='酒馆暂未提供此接口的测试消息功能。';return;
      }
      await write(async()=>{
        if(modified){
          const saved=await pairWork(()=>editApiProfile(snapshot,draft));
          snapshot=JSON.parse(JSON.stringify(saved));
          row=pairProfileRows().find(r=>r.ref==='profile:'+saved.id);
          if(draft.password){
            const key=pairSecretKey(draft.api),id=saved['secret-id'];
            if(id){
              (state[key]||=[]).push({id,label:saved.name});
              fields.credential.add(new W.Option(saved.name,id));fields.credential.value=id;
            }else{
              state[key]=true;
              fields.password.placeholder='已保存。留空沿用，填写将替换该服务商的共用密钥';
            }
            fields.password.value='';
          }
          // The lock temporarily disables the endpoint; use its actual draft value for the new baseline.
          baseline=JSON.stringify({...draft,secret:saved['secret-id']||'',password:''});
          form.querySelector('[data-delete]').hidden=false;
          layer.querySelector('[role=dialog]').setAttribute('aria-label','编辑 API');
          layer.querySelector('.lj-modal-header strong').textContent='编辑 API';
        }
        controller=new W.AbortController();
        const signal=controller.signal;
        let expired=false;
        const timer=W.setTimeout(()=>{expired=true;controller.abort();},90000);
        stop.hidden=false;status.textContent='正在测试「'+draft.model+'」…';
        try{await sendConnectionTest(snapshot,signal);status.textContent='连接成功，「'+draft.model+'」已回复测试消息。';}
        catch(error){status.textContent=signal.aborted?(expired?'测试超时，请检查连接后重试。':'已停止测试。'):error.message;}
        finally{W.clearTimeout(timer);stop.hidden=true;controller=null;}
      },false);
    };
    form.addEventListener('click',async e=>{
      const b=e.target.closest('button');if(!b || busy)return;
      if(b.hasAttribute('data-delete'))confirm.hidden=false;
      if(b.hasAttribute('data-cancel'))confirm.hidden=true;
      if(b.hasAttribute('data-confirm'))write(()=>pairWork(async()=>{
        if(JSON.stringify(snapshot)!==JSON.stringify(profileManager().profiles.find(p=>p.id===snapshot.id)))throw Error('连接已更改，请重新打开。');
        await removePairConnection(row,await activePairConnection());toast('已删除连接');
      }));
    });
  }
  function legacyConnections(prefs,profiles){
    const aliases={...prefs.pairAliases}, orphanRefs=[];
    for(const [ref,r] of Object.entries(prefs.pairConnections||{})){
      if(aliases[ref] && profiles.some(p=>p.ref===aliases[ref]))continue;
      const match=profiles.filter(p=>pairSameConnection(p,r));
      if(match.length===1)aliases[ref]=match[0].ref;
      else orphanRefs.push(ref);
    }
    return {aliases,orphanRefs};
  }
  function unusedChatKeys(secrets,profiles,active,account,presetData){
    // Old chooser inferred one row per stored chat-service key. Other secret categories are outside this cleanup.
    const keys=new Set(Object.keys(ctx().CONNECT_API_MAP||{}).map(alias=>pairSecretKey(pairApi(alias))));
    const reserved=new Set(), implicit=new Set();
    for(const row of [...profiles,active]){
      if(row.secret)reserved.add(row.secret);
      else if(row.api)implicit.add(pairSecretKey(row.api));
    }
    const copy={...account,extension_settings:{...account.extension_settings}};
    const theme={...copy.extension_settings[KEY]};
    delete theme.pairConnections;delete theme.removedPairSources;
    copy.extension_settings[KEY]=theme;
    const otherSettings=JSON.stringify([copy,presetData]);
    // Other extensions may rely on their provider's active key without recording its ID.
    const extensions={...copy.extension_settings};
    delete extensions.connectionManager;delete extensions[KEY];
    const externalProviders=new Set();
    function collectProviders(value){
      if(typeof value==='string' && ctx().CONNECT_API_MAP?.[value])externalProviders.add(pairSecretKey(pairApi(value)));
      else if(value && typeof value==='object')Object.values(value).forEach(collectProviders);
    }
    collectProviders(extensions);
    const unused=[];
    for(const [key,items] of Object.entries(secrets)){
      if(!keys.has(key) || !Array.isArray(items))continue;
      for(const item of items){
        if(!item.id || reserved.has(item.id) || otherSettings.includes(item.id))continue;
        if(item.active && (implicit.has(key)||externalProviders.has(key)))continue;
        unused.push({key,id:item.id});
      }
    }
    return unused;
  }
  async function apiCleanupPlan(){
    const settings=await post('/api/settings/get',{});
    if(typeof settings.settings!=='string')throw Error('无法核对已保存的设置。');
    const account=JSON.parse(settings.settings), native=profileManager(), recorded=account.extension_settings?.connectionManager;
    const prefs=preferences(), diskPrefs=account.extension_settings?.[KEY]||{};
    if(JSON.stringify(native.profiles)!==JSON.stringify(recorded?.profiles) ||
       JSON.stringify(prefs.pairConnections||{})!==JSON.stringify(diskPrefs.pairConnections||{}))throw Error('连接配置尚未同步，请刷新页面再试。');
    const profiles=pairProfileRows(), legacy=legacyConnections(prefs,profiles);
    const secrets=await post('/api/secrets/read',{}), active=await activePairConnection();
    const {settings:ignored,...presetData}=settings;
    const unused=unusedChatKeys(secrets,profiles,active,account,presetData);
    return {profiles,legacy,unused,legacyRefs:Object.keys(prefs.pairConnections||{})};
  }
  async function commitApiCleanup(preview){
    const current=await apiCleanupPlan();
    if(JSON.stringify(current)!==JSON.stringify(preview))throw Error('配置已更改，请重新核对清理范围。');
    const prefs=preferences();
    if(current.legacyRefs.length){
      const oldRoutes=prefs.pairConnections,oldAliases=prefs.pairAliases;
      prefs.pairAliases=current.legacy.aliases;prefs.pairConnections={};
      try{await persist(true);}catch(error){prefs.pairConnections=oldRoutes;prefs.pairAliases=oldAliases;ctx().saveSettingsDebounced();throw error;}
    }
    let deleted=0;
    try{
      // Never use /secret-delete here: that command falls back to the active key if the ID is missing.
      for(const {key,id} of current.unused){
        const fresh=await apiCleanupPlan();
        if(!fresh.unused.some(item=>item.key===key && item.id===id))continue;
        const res=await W.fetch('/api/secrets/delete',{method:'POST',headers:ctx().getRequestHeaders(),body:JSON.stringify({key,id})});
        if(!res.ok)throw Error('密钥删除失败。');
        const after=await post('/api/secrets/read',{});
        if((after[key]||[]).some(item=>item.id===id))throw Error('密钥删除未保存。');
        deleted++;
      }
    }finally{
      if(deleted){const vault=await apiKeyModule();await vault.readSecretState();}
    }
    return deleted;
  }
  async function openApiCleanup(){
    const plan=await apiCleanupPlan();
    const layer=modal('清理旧配置',`<div class="lj-api-form"><strong>保留以下 ${plan.profiles.length} 条模型连接</strong>
      <ul>${plan.profiles.map(r=>`<li>${escapeHtml(r.label)}</li>`).join('')}</ul>
      <p>可清理 ${plan.legacy.orphanRefs.length} 条旧连接和 ${plan.unused.length} 个未被引用的聊天 API 密钥。</p>
      <p role="status"></p><div class="lj-api-footer">
      ${plan.unused.length||plan.legacyRefs.length?'<button class="lj-primary" data-clean>确认清理</button>':''}</div></div>`,'510px');
    const status=layer.querySelector('[role=status]');
    const clean=layer.querySelector('[data-clean]');
    if(clean)clean.onclick=async()=>{
      const buttons=[...layer.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
      try{
        const deleted=await pairWork(()=>commitApiCleanup(plan));
        status.textContent='已删除 '+plan.legacy.orphanRefs.length+' 条旧连接和 '+deleted+' 个未使用密钥。';
        clean.remove();
      }catch(e){status.textContent=e.message+' 可返回列表查看剩余项。';clean.remove();}
      finally{buttons.forEach(b=>b.disabled=false);}
    };
  }

    // Card scripts may mount their launcher and screen directly on the host document.
  const widgetFamilies = [
    {ids:['divine8-root','divine8-screen','divine-st-hub']},
    {ids:['gz795-private-device']},
    {ids:['xhs-float-btn','xhs-fab']}, {ids:['zxw-pixel-sphere']}, {ids:['ins-persistent-audio-v2']},
  ];
  const widgetSelector=widgetFamilies.flatMap(f=>f.ids.map(id=>'#'+id)).join(',');
  const widgetOwners=new WeakMap();
  let widgetCard=null, widgetSource='';
  function syncCardWidgets() {
    const card=selected();
    if(card!==widgetCard) {
      widgetCard=card;
      // Read only card-authored renderers. The chat transcript may mention a different character.
      const d=card?.data;
      widgetSource=card?JSON.stringify([d?.extensions,d?.first_mes,d?.alternate_greetings,d?.creator_notes,card.first_mes]):'';
    }
    for(const el of D.querySelectorAll(widgetSelector)) {
      if(el.closest('#chat'))continue;
      const family=widgetFamilies.find(f=>f.ids.includes(el.id));
      const authored=card && family.ids.some(id=>widgetSource.includes(id));
      if(card && (authored || (!widgetOwners.has(el) && route==='chat')))widgetOwners.set(el,card.avatar);
      const visible=route==='chat' && card && widgetOwners.get(el)===card.avatar && !pairDialog;
      el.toggleAttribute('data-lj-widget-away',!visible);
    }
  }
  function mountCardWidgets() {
    const observer=new W.MutationObserver(records=>{
      if(records.some(record=>[...record.addedNodes].some(el=>el.nodeType===1 && (el.matches(widgetSelector)||el.querySelector(widgetSelector)))))syncCardWidgets();
    });
    observer.observe(D.body,{childList:true,subtree:true});observers.push(observer);
    const c=ctx();
    for(const key of ['CHAT_CHANGED','CHARACTER_EDITED','CHARACTER_PAGE_LOADED']) {
      const type=c.eventTypes[key];if(!type)continue;
      const update=()=>{widgetCard=null;syncCardWidgets();};
      c.eventSource.on(type,update);listeners.push(()=>c.eventSource.removeListener(type,update));
    }
    listeners.push(()=>{for(const el of D.querySelectorAll('[data-lj-widget-away]'))el.removeAttribute('data-lj-widget-away');});
  }

    let book=null, bookSort='recent', bookCountsTimer;
  const bookCountCache=new Map();
  const bookCopy=value=>JSON.parse(JSON.stringify(value));
  const bookInfo=p=>p?.lj_preset_info || {};
  const bookTitle=(p,key)=>bookInfo(p).title || key;
  function bookSource(name,engine='openai'){
    const m=ctx().getPresetManager(engine),l=m?.getPresetList();
    const i=Array.isArray(l?.preset_names)?l.preset_names.indexOf(name):l?.preset_names?.[name];
    return l?.presets?.[i];
  }
  function bookBase(p){const result={...p};delete result.lj_preset_history;return result;}
  function bookDiff(previous,next){
    const set={},remove=[];
    for(const k of new Set([...Object.keys(previous),...Object.keys(next)])){
      if(['__proto__','constructor','prototype','lj_preset_history'].includes(k))continue;
      if(!Object.hasOwn(previous,k))remove.push(k);
      else if(JSON.stringify(previous[k])!==JSON.stringify(next[k]))set[k]=previous[k];
    }
    return {set,remove};
  }
  function bookVersion(p,index){
    let v=bookCopy(bookBase(p));
    for(const step of (p.lj_preset_history||[]).slice(0,index)){
      v={...v,...step.set};
      for(const k of step.remove||[])delete v[k];
    }
    return v;
  }
  function bookOrder(p){
    if(!Array.isArray(p.prompt_order))p.prompt_order=[];
    let group=p.prompt_order.find(o=>Number(o.character_id)===100001) || p.prompt_order[0];
    if(!group){group={character_id:100001,order:[]};p.prompt_order.push(group);}
    if(!Array.isArray(group.order))group.order=[];
    return group.order;
  }
  function bookRows(p){
    const prompts=p.prompts||[],byId=new Map(prompts.map(x=>[x.identifier,x])),seen=new Set(),rows=[];
    const group=p.prompt_order?.find(o=>Number(o.character_id)===100001)||p.prompt_order?.[0];
    for(const o of group?.order||[]){const x=byId.get(o.identifier);if(x&&!seen.has(o.identifier)){rows.push({x,on:o.enabled!==false});seen.add(o.identifier);}}
    for(const x of prompts)if(!seen.has(x.identifier))rows.push({x,on:false});
    return rows;
  }
  function bookSwitch(p,id,enabled){const order=bookOrder(p),o=order.find(x=>x.identifier===id);if(o)o.enabled=enabled;else order.push({identifier:id,enabled});}
  function bookTokenCounts(p){
    const model=ctx().getChatCompletionModel?.() || ctx().mainApi;
    const rows=bookRows(p);
    return (async()=>{
      let total=0,enabled=0;
      for(const {x,on} of rows){
        if(!x.content || x.marker)continue;
        const key=JSON.stringify([model,x.content]);
        if(!bookCountCache.has(key)){
          if(bookCountCache.size>=2048)bookCountCache.delete(bookCountCache.keys().next().value);
          bookCountCache.set(key,Promise.resolve(ctx().getTokenCountAsync(x.content)).catch(err=>{bookCountCache.delete(key);throw err;}));
        }
        const n=await bookCountCache.get(key);
        if(!Number.isFinite(n))throw Error('Token 统计暂不可用');
        total+=n;if(on)enabled+=n;
      }
      return {total,enabled};
    })();
  }
  function fillBookCounts(){
    W.clearTimeout(bookCountsTimer);
    bookCountsTimer=W.setTimeout(async()=>{
      for(const el of all('[data-book-count]')){
        if(!el.isConnected)continue;
        const p=el.hasAttribute('data-draft')?book?.draft:bookSource(el.dataset.bookCount);
        if(!p)continue;
        try{const n=await bookTokenCounts(p);if(el.isConnected)el.textContent=bookRows(p).length+' 条提示词 · 已开启 '+n.enabled.toLocaleString()+' Token · 总计 '+n.total.toLocaleString()+' Token';}
        catch{if(el.isConnected)el.textContent=bookRows(p).length+' 条提示词 · Token 统计暂不可用';}
      }
    },80);
  }
  function bookDate(time){return time?new Date(time).toLocaleString('sv-SE').slice(0,16):'首次记录';}
  function bookCover(src){return typeof src==='string' && /^(data:image\/(?:jpeg|png|webp|gif);base64,|\/backgrounds\/)/i.test(src)?src:'';}
  function readPicture(file,maxWidth=1500){
    return new Promise((resolve,reject)=>{
      const img=new W.Image(),url=W.URL.createObjectURL(file);
      img.onload=()=>{try{const scale=Math.min(1,maxWidth/Math.max(img.width,img.height)),canvas=D.createElement('canvas');
        canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/webp',.88));
      }catch(e){reject(e);}finally{W.URL.revokeObjectURL(url);}};
      img.onerror=()=>{W.URL.revokeObjectURL(url);reject(Error('图片无法读取，请选择可打开的图片。'));};img.src=url;
    });
  }
  function chooseLibraryFile(accept,callback){
    const input=D.createElement('input');input.type='file';input.accept=accept;
    input.addEventListener('change',async()=>{if(input.files[0])try{await callback(input.files[0]);}catch(e){toast(e.message);}});input.click();
  }
  function presetsPage(){
    const list=ctx().getPresetManager('openai')?.getPresetList(),keys=Array.isArray(list?.preset_names)?list.preset_names:Object.keys(list?.preset_names||{});
    const items=keys.map(key=>({key,p:bookSource(key)})).filter(x=>x.p && !parameterOnly(x.p) && [bookTitle(x.p,x.key),bookInfo(x.p).description].join(' ').toLowerCase().includes(search.toLowerCase()));
    items.sort((a,b)=>bookSort==='name'?bookTitle(a.p,a.key).localeCompare(bookTitle(b.p,b.key),'zh-CN'):(Number(bookInfo(b.p).updated)||0)-(Number(bookInfo(a.p).updated)||0));
    fillBookCounts();
    return title('预设库','<button class="lj-soft" data-action="native" data-panel="generation">当前接口的高级生成选项</button>')+`<div class="lj-book-line"><h2>我的预设</h2>${searchBox('搜索预设名称、描述')}</div><div class="lj-book-line"><select aria-label="预设排序" id="lj-book-sort"><option value="recent">最近</option><option value="name" ${bookSort==='name'?'selected':''}>名称</option></select><div><button class="lj-soft" data-action="clean-parameter-presets">清理纯参数预设</button> <button class="lj-primary" data-action="book-create">＋ 创建预设</button></div></div><div class="lj-book-grid">${items.map(({key,p})=>{
      const info=bookInfo(p),cover=bookCover(info.cover);
      return `<button type="button" class="lj-book-card" data-action="book-open" data-name="${escapeHtml(key)}"><div class="lj-book-cover">${cover?`<img src="${escapeHtml(cover)}" alt="">`:icon('book')}</div><div class="lj-book-copy"><h3>${escapeHtml(bookTitle(p,key))}</h3>${info.description?`<p>${escapeHtml(info.description)}</p>`:''}<small data-book-count="${escapeHtml(key)}">统计 Token 中…</small></div></button>`;
    }).join('')||'<p>暂无匹配的预设</p>'}</div>`;
  }
  function openBook(key){
    const source=key?bookSource(key):null;
    if(key&&!source)throw Error('找不到这份预设。');
    const fallback=bookSource('Default')||{};
    const blank={prompts:bookCopy((fallback.prompts||[]).filter(x=>x.marker)),prompt_order:[]};
    if(!source)for(const x of blank.prompts)bookSwitch(blank,x.identifier,true);
    const draft=bookCopy(source?bookBase(source):blank);
    draft.lj_preset_info={...bookInfo(draft),title:bookTitle(draft,key||''),description:bookInfo(draft).description||''};
    book={key,source:source&&bookCopy(source),draft,selection:new Set(),expanded:'',history:false,saving:false,version:0};
    navigate('preset-editor');
  }
  const bookParameters={openai_max_context:'上下文长度',openai_max_tokens:'最大回复 Token',temperature:'温度',top_p:'Top P（累计概率范围）',top_k:'Top K（候选词数量）',frequency_penalty:'频率惩罚',presence_penalty:'存在惩罚'};
  function bookEditor(){
    if(!book)return presetsPage();
    const p=book.draft,info=bookInfo(p),ro=book.history,dis=ro?'disabled':'',view=bookRows(p),sel=book.selection,btn=(a,text,extra='')=>`<button type="button" class="lj-soft" data-action="book-${a}" ${extra}>${text}</button>`;
    const header=ro?`<select id="lj-book-version" aria-label="历史版本">${[book.source,...(book.source?.lj_preset_history||[])].map((x,i)=>`<option value="${i}" ${i===book.version?'selected':''}>${escapeHtml(i?bookDate(x.at):'当前版本 · '+bookDate(bookInfo(x).updated))}</option>`).join('')}</select>`: `<h1>${book.key?'编辑预设':'创建预设'}</h1>`;
    fillBookCounts();
    return `<div class="lj-book-editor"><header class="lj-book-top"><button class="lj-iconbutton" data-action="book-back" aria-label="返回">${icon('back')}</button>${header}<div class="lj-book-tools">${!ro&&book.key?btn('history','查看历史版本'):''}${btn('back','取消')}<button class="lj-primary" data-action="book-${ro?'restore':'save'}" ${book.saving || (ro&&!book.version)?'disabled':''}>${ro?'还原此版本':'确认'}</button></div></header>
      <div class="lj-book-form"><h3>预设封面</h3><button class="lj-book-upload" data-action="book-cover" ${dis}>${bookCover(info.cover)?`<img src="${escapeHtml(info.cover)}" alt="预设封面">`:'上传图片'}</button>
      <label>预设名称<input data-book-field="title" value="${escapeHtml(info.title)}" ${dis}></label><label>描述<textarea data-book-field="description" rows="3" ${dis}>${escapeHtml(info.description)}</textarea></label>
      ${ro?'':`<div class="lj-book-actions">${btn('import','导入预设')}${btn('download','下载预设')}${book.key?btn('delete-file','删除这份预设'):''}</div>`}
      <details class="lj-book-params"><summary>生成参数</summary><div>${Object.entries(bookParameters).map(([k,label])=>`<label>${label}<input type="number" step="${['openai_max_context','openai_max_tokens','top_k'].includes(k)?1:'any'}" data-book-param="${k}" value="${escapeHtml(p[k]??'')}" ${dis}></label>`).join('')}</div></details>
      <div class="lj-book-line"><h3>预设条目</h3><small data-book-count="" data-draft>统计 Token 中…</small></div>
      ${ro?'':`<div class="lj-book-actions">${btn('add','＋ 新增条目')}${btn('export-entries','导出条目',sel.size?'':'disabled')}${btn('import-entries','导入条目')}<label><input type="checkbox" data-book-all ${view.length&&sel.size===view.length?'checked':''}>全选</label></div>`}
      <div class="lj-book-entries">${view.map(({x,on},i)=>{const id=escapeHtml(x.identifier);return `<section data-book-id="${id}" ${ro?'':'draggable="true"'}><div class="lj-book-entry">${ro?'':`<span class="lj-book-grip" aria-hidden="true">⠿</span><input type="checkbox" data-book-check ${sel.has(x.identifier)?'checked':''} aria-label="选择 ${escapeHtml(x.name)}">`}<button class="lj-book-name" data-action="book-expand">${escapeHtml(x.name||x.identifier)}</button><label>启用 <input class="lj-book-toggle" type="checkbox" data-book-enabled ${on?'checked':''} ${dis}></label>${ro?'':btn('duplicate',messageIcon('copy'),'aria-label="复制条目"')+btn('remove',messageIcon('trash'),'aria-label="删除条目"')}<button class="lj-iconbutton" data-action="book-expand" aria-label="展开条目">⌄</button></div>
      ${book.expanded===x.identifier?`<div class="lj-book-fields"><label>名称<input data-entry-field="name" value="${escapeHtml(x.name||'')}" ${dis}></label><label>角色<select data-entry-field="role" ${dis}>${Object.entries(promptRoles).map(([k,v])=>`<option value="${k}" ${k===x.role?'selected':''}>${v}</option>`).join('')}</select></label>${x.marker?'<p>酒馆会在发送时填入这项内容。</p>':`<label>内容<textarea rows="7" data-entry-field="content" ${dis}>${escapeHtml(x.content||'')}</textarea></label>`}${ro?'':btn('up','上移',i===0?'disabled':'')+btn('down','下移',i===view.length-1?'disabled':'')}</div>`:''}</section>`;}).join('')}</div></div></div>`;
  }
  function bookRedraw(){
    const main=root.querySelector('.lj-main'),top=main?.scrollTop||0;
    render();const next=root.querySelector('.lj-main');if(next)next.scrollTop=top;
  }
  function bookMove(id,to){
    const p=book.draft,rows=bookRows(p),from=rows.findIndex(v=>v.x.identifier===id);
    if(from<0 || to<0 || to>=rows.length || from===to)return;
    rows.splice(to,0,rows.splice(from,1)[0]);
    const order=bookOrder(p),before=new Map(order.map(o=>[o.identifier,o]));
    const missing=order.filter(o=>!rows.some(r=>r.x.identifier===o.identifier));
    order.splice(0,order.length,...rows.map(r=>before.get(r.x.identifier)||{identifier:r.x.identifier,enabled:r.on}),...missing);
  }
  async function bookSave(){
    const b=book;if(!b || b.saving)return;
    const p=bookCopy(b.draft),info=p.lj_preset_info,title=String(info?.title||'').trim();
    if(!title)throw Error('请填写预设名称。');
    const manager=ctx().getPresetManager('openai'),list=manager.getPresetList();
    const duplicate=Object.keys(list.preset_names).some(key=>key!==b.key && (key===title || bookTitle(bookSource(key),key)===title));
    if(duplicate)throw Error('已有同名预设，请换一个名字。');
    if(b.source && JSON.stringify(bookSource(b.key))!==JSON.stringify(b.source))throw Error('这份预设已更新，请重新打开。');
    const key=b.key||title.replace(/[<>:"/\\|?*\u0000-\u001f]/g,' ').trim();
    if(!key||(!b.key&&(/[. ]$/.test(key)||/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(key)))||key==='.'||key==='..'||['__proto__','constructor','prototype'].includes(key)||(!b.key&&bookSource(key)))throw Error('这个预设名称不可用。');
    b.saving=true;
    try{
      info.title=title;info.updated=Date.now();info.created ||= info.updated;
      const history=b.source?.lj_preset_history || [];
      const previous=b.source && bookBase(b.source);
      if(previous)p.lj_preset_history=[{at:bookInfo(previous).updated || Date.now(),...bookDiff(previous,p)},...history];
      await manager.savePreset(key,p,{skipUpdate:true});
      let i=list.preset_names[key];
      if(i===undefined){i=list.presets.length;list.preset_names[key]=i;const option=D.createElement('option');option.value=String(i);option.textContent=key;D.getElementById('settings_preset_openai')?.append(option);}
      list.presets[i]=p;
      if(manager.getSelectedPresetName()===key){
        const connection=await activePairConnection(),type=ctx().eventTypes.OAI_PRESET_CHANGED_BEFORE,c=ctx();
        const preserve=({preset,presetName,settingsToUpdate})=>{if(presetName===key)for(const [field,spec] of Object.entries(settingsToUpdate))if(spec[3])delete preset[field];};
        c.eventSource.on(type,preserve);try{await manager.selectPreset(String(i));}finally{c.eventSource.removeListener(type,preserve);}
        if(!pairMatches(connection,await activePairConnection()))await applyPairConnection(connection);
      }
      book=null;await backPage();toast('预设已保存');
    }finally{b.saving=false;}
  }
  function bookEntryCopy(p,x,on){p.prompts||=[];const fresh={...bookCopy(x),identifier:W.crypto.randomUUID(),system_prompt:false,marker:false};p.prompts.push(fresh);bookSwitch(p,fresh.identifier,on);return fresh;}
  function bookInput(e){
    if(!book || route!=='preset-editor' || book.history)return;
    const t=e.target, id=t.closest('[data-book-id]')?.dataset.bookId;
    if(t.dataset.bookParam && Object.hasOwn(bookParameters,t.dataset.bookParam)){const key=t.dataset.bookParam;if(t.value==='')delete book.draft[key];else if(Number.isFinite(t.valueAsNumber))book.draft[key]=t.valueAsNumber;return;}
    if(t.dataset.bookField){book.draft.lj_preset_info[t.dataset.bookField]=t.value;return;}
    const x=book.draft.prompts?.find(p=>p.identifier===id);
    if(x && t.dataset.entryField){x[t.dataset.entryField]=t.value;
      if(t.dataset.entryField==='name')t.closest('section').querySelector('.lj-book-name').textContent=t.value;
      if(t.dataset.entryField==='content')fillBookCounts();}
  }
  function bookChange(e){
    const t=e.target;
    if(t.id==='lj-book-sort'){bookSort=t.value;render();return;}
    if(!book || route!=='preset-editor')return;
    if(t.id==='lj-book-version'){book.version=Number(t.value);book.draft=bookVersion(book.source,book.version);book.draft.lj_preset_info||={title:book.key};bookRedraw();return;}
    if(book.history)return;
    const id=t.closest('[data-book-id]')?.dataset.bookId;
    if(t.hasAttribute('data-book-enabled'))bookSwitch(book.draft,id,t.checked);
    else if(t.hasAttribute('data-book-check')){if(t.checked)book.selection.add(id);else book.selection.delete(id);}
    else if(t.hasAttribute('data-book-all'))book.selection=new Set(t.checked?bookRows(book.draft).map(r=>r.x.identifier):[]);
    else return;
    bookRedraw();
  }
  async function bookAction(action,el){
    if(action==='create'||action==='open'){openBook(el.dataset.name||'');return;}
    const b=book;if(!b || b.saving)return;
    if(action==='delete-file'&&!b.history&&b.key){
      if(!W.confirm('删除「'+bookTitle(b.draft,b.key)+'」及其历史版本？使用它的存档需要重新选择预设。'))return;
      b.saving=true;
      try{await pairWork(()=>removePairPreset({name:b.key,engine:'openai'}));await backPage();toast('已删除这份预设');}
      finally{b.saving=false;}
      return;
    }
    if(action==='back'){if(b.history){b.draft=b.beforeHistory;b.history=false;bookRedraw();}else{book=null;await backPage();}return;}
    if(action==='history'){b.beforeHistory=b.draft;b.history=true;b.version=0;b.draft=bookVersion(b.source,0);b.draft.lj_preset_info||={title:b.key};bookRedraw();return;}
    if(action==='restore'){b.draft.lj_preset_info||={title:b.key};b.history=false;await bookSave();return;}
    const id=el.closest('[data-book-id]')?.dataset.bookId,p=b.draft,x=p.prompts?.find(x=>x.identifier===id);
    if(action==='expand'){b.expanded=b.expanded===id?'':id;bookRedraw();return;}
    if(b.history)return;
    if(action==='save'){await bookSave();return;}
    if(action==='cover'){chooseLibraryFile('image/*',async f=>{const pic=await readPicture(f);if(book===b){p.lj_preset_info.cover=pic;bookRedraw();}});return;}
    if(action==='download'){downloadData((bookInfo(p).title||'预设')+'.json',bookBase(p));return;}
    if(action==='export-entries'){downloadData((bookInfo(p).title||'预设')+'-条目.json',{entries:bookRows(p).filter(r=>b.selection.has(r.x.identifier)).map(r=>({prompt:r.x,enabled:r.on}))});return;}
    if(action==='import'||action==='import-entries'){chooseLibraryFile('.json,application/json',async file=>{
      const data=JSON.parse(await file.text());if(book!==b)return;
      if(action==='import'){
        if(!data || !Array.isArray(data.prompts)||data.prompts.some(x=>!x || typeof x.identifier!=='string'))throw Error('请选择酒馆聊天补全预设 JSON。');
        b.draft=bookCopy(bookBase(data));b.draft.lj_preset_info={...bookInfo(data),title:bookInfo(data).title || file.name.replace(/\.json$/i,''),description:bookInfo(data).description||''};b.selection.clear();
      }else{
        const entries=Array.isArray(data)?data:(data.entries || data.prompts);
        if(!Array.isArray(entries)||!entries.length||entries.some(e=>!e || typeof(e.prompt||e).name!=='string'))throw Error('文件中没有可导入的预设条目。');
        for(const e of entries){const raw=e.prompt||e;if(raw.marker){const existing=p.prompts?.find(x=>x.identifier===raw.identifier);if(!existing){p.prompts||=[];p.prompts.push(bookCopy(raw));}bookSwitch(p,raw.identifier,e.enabled!==false);}else bookEntryCopy(p,raw,e.enabled!==false);}
      }bookRedraw();
    });return;}
    if(action==='add'){const v=bookEntryCopy(p,{name:'新条目',role:'system',content:''},true);b.expanded=v.identifier;}
    if(action==='duplicate'&&x){if(x.marker)throw Error('这是酒馆按位置填入的条目。');const v=bookEntryCopy(p,x,bookRows(p).find(r=>r.x===x)?.on);v.name=x.name+' 副本';b.expanded=v.identifier;}
    if(action==='remove'&&x){p.prompts=p.prompts.filter(v=>v.identifier!==id);for(const g of p.prompt_order||[])g.order=g.order?.filter(v=>v.identifier!==id)||[];b.selection.delete(id);}
    if(action==='up'||action==='down'){const n=bookRows(p).findIndex(v=>v.x.identifier===id);bookMove(id,n+(action==='up'?-1:1));}
    bookRedraw();
  }
  function mountBooks(){
    on(root,'input',bookInput);on(root,'change',bookChange);
    let moving='';
    on(root,'dragstart',e=>{moving=e.target.closest('[draggable="true"][data-book-id]')?.dataset.bookId||'';});
    on(root,'dragover',e=>{if(moving&&e.target.closest('[data-book-id]'))e.preventDefault();});
    on(root,'drop',e=>{const id=e.target.closest('[data-book-id]')?.dataset.bookId;if(moving&&id&&book){e.preventDefault();bookMove(moving,bookRows(book.draft).findIndex(r=>r.x.identifier===id));bookRedraw();}moving='';});
    on(root,'dragend',()=>{moving='';});
  }

    const personaSuccess='应用成功！新面具将从您的下一条消息开始生效';
  const personaData=()=>ctx().powerUserSettings;
  function personaCommand(name,args={},value='') {
    const command=ctx().SlashCommandParser?.commands?.['persona-'+name];
    if(!command) throw Error('当前酒馆没有提供所需的面具操作');
    return command.callback(args,value);
  }
  function personaEntries(settings,term='',descending=false) {
    const query=term.trim().toLocaleLowerCase();
    const entries=Object.entries(settings.personas||{}).map(([id,name],order)=>{
      const d=settings.persona_descriptions?.[id]||{}, extra=d[KEY]||{};
      const stamp=Number(String(id).match(/^(\d{13})(?:\D|$)/)?.[1])||0;
      return {id,name,order,note:d.title||'',description:d.description||'',gender:extra.gender||'',pinned:!!extra.pinned,created:extra.created||stamp};
    });
    return entries.filter(p=>[p.name,p.note].some(x=>String(x).toLocaleLowerCase().includes(query)))
      .sort((a,b)=>Number(b.pinned)-Number(a.pinned)||(descending?-1:1)*((a.created-b.created)||(a.order-b.order)));
  }
  function personaConnection(context) {
    if(context.groupId!=null)return {type:'group',id:context.groupId};
    const avatar=context.characters?.[context.characterId]?.avatar;
    return avatar?{type:'character',id:avatar}:null;
  }
  function samePersonaConnection(a,b){return !!a && !!b && a.type===b.type && String(a.id)===String(b.id);}
  function personaLocks(c,id) {
    const p=c.powerUserSettings,conn=personaConnection(c);
    return {default:!!id&&p.default_persona===id,chat:!!id&&c.chatMetadata?.persona===id,
      character:!!id&&!!p.persona_descriptions?.[id]?.connections?.some(x=>samePersonaConnection(x,conn))};
  }
  async function savePersonaLocks(c,id,before,after) {
    const p=c.powerUserSettings,conn=personaConnection(c);
    if(c.chatId&&before.chat!==after.chat){
      const previous=c.chatMetadata.persona;
      if(after.chat)c.chatMetadata.persona=id;
      else if(previous===id)delete c.chatMetadata.persona;
      try{await c.saveMetadata();}catch(e){if(previous===undefined)delete c.chatMetadata.persona;else c.chatMetadata.persona=previous;throw e;}
    }
    if(before.default!==after.default) {
      if(after.default)p.default_persona=id;
      else if(p.default_persona===id)p.default_persona=null;
    }
    if(conn&&before.character!==after.character){
      for(const [other,d] of Object.entries(p.persona_descriptions)){
        if(other===id || (after.character&&!p.persona_allow_multi_connections)){
          d.connections=(d.connections||[]).filter(x=>!samePersonaConnection(x,conn));
          if(other===id&&after.character)d.connections.push(conn);
        }
      }
    }

  }
  async function deleteManagedPersona(id) {
    const c=ctx(), was=await personaCommand('get',{field:'avatar'}), previousLock=c.chatMetadata?.persona;
    if(await personaCommand('delete',{persona:id,silent:'true'})!=='true')throw Error('面具删除失败');
    let now=await personaCommand('get',{field:'avatar'});
    if(was && was!==id && c.chatId===ctx().chatId && c.chatMetadata===ctx().chatMetadata){
      if(now!==was && Object.hasOwn(personaData().personas,was)){
        await personaCommand('set',{mode:'lookup'},was);
        now=await personaCommand('get',{field:'avatar'});
      }
      const lock=previousLock===id?undefined:previousLock;
      if(c.chatMetadata.persona!==lock){
        if(lock===undefined)delete c.chatMetadata.persona;else c.chatMetadata.persona=lock;
        await c.saveMetadata();
      }
    }
    return now;
  }
  function personaNotice(text,success=false) {
    portal.querySelector('.lj-mask-toast')?.remove();
    const el=D.createElement('div');el.className='lj-mask-toast'+(success?' success':'');el.setAttribute('role','status');
    if(success)el.innerHTML='<svg aria-hidden="true" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" fill="#149448"/><path d="m5.5 10 3 3 6-7" stroke="white" stroke-width="1.6" fill="none"/></svg>';
    el.append(D.createTextNode(text));portal.append(el);W.setTimeout(()=>el.remove(),3200);
  }
  async function openPersonaManager() {
    const opener=D.activeElement,overlay=modal('面具管理','','384px');
    overlay.classList.add('lj-mask-layer');
    const panel=overlay.querySelector('.lj-modal'),head=panel.querySelector('header'),body=panel.querySelector('.lj-modal-content');
    let mode='list',current='',editId='',menuId=null,query='',scroll=0,sortOpen=false,busy=false,formContext;
    let descending=preferences().personaSort==='desc';
    const back=()=>{if(busy)return;if(mode!=='list'){mode='list';drawList();}else{closeDialog(overlay);if(opener?.isConnected)opener.focus({preventScroll:true});}};
    function header(title){
      panel.setAttribute('aria-label',title);
      const parent=dialogParents.get(overlay);
      const label=mode==='list'?'返回'+(parent?dialogName(parent.layer):pageName()):'返回面具列表';
      head.innerHTML=`<button type="button" class="lj-mask-back" data-mask="back" aria-label="${escapeHtml(label)}">${icon('back')}</button><strong>${title}</strong>`;
    }
    function listRows(){
      const entries=personaEntries(personaData(),query,descending);
      const faces={女:'♀',男:'♂',其他:'⚥'};
      return entries.map(p=>{
        const id=escapeHtml(p.id), name=escapeHtml(p.name);
        const label=p.note?`<em>备注</em> ${escapeHtml(p.note)}`:escapeHtml(p.description.replace(/\s+/g,' '));
        return `<article class="lj-mask-card" data-id="${id}"><button type="button" data-mask="select" aria-pressed="${p.id===current}"><strong>${name}${faces[p.gender]?` <span class="lj-mask-sex" data-sex="${p.gender}" aria-label="${p.gender}">${faces[p.gender]}</span>`:''}</strong>${label?`<small>${label}</small>`:''}</button>${p.pinned?'<i class="lj-mask-pin" aria-label="已置顶">置顶</i>':''}<button type="button" data-mask="more" aria-haspopup="menu" aria-expanded="${menuId===p.id}" aria-label="${name}更多操作">•••</button></article>`;
      }).join('')||'<p class="lj-mask-empty">没有找到面具</p>';
    }
    function drawList(){
      if(!overlay.isConnected)return;
      mode='list';menuId=null;sortOpen=false;header('面具管理');
      body.innerHTML=`<div class="lj-mask-scroll"><label class="lj-mask-search">${icon('search')}<input aria-label="搜索面具" placeholder="支持称呼或备注搜索面具" type="search" value="${escapeHtml(query)}"></label><div class="lj-mask-label"><span>我的面具</span><button data-mask="sort" aria-haspopup="menu" aria-expanded="false">按创建时间${descending?'倒序':'正序'} ﹀</button></div><div class="lj-mask-rows">${listRows()}</div><button class="lj-mask-new" data-mask="new"><span>＋</span>创建新面具</button></div>`;
      body.firstElementChild.scrollTop=scroll;
    }
    const rowFor=id=>Array.from(body.querySelectorAll('.lj-mask-card')).find(el=>el.dataset.id===id);
    function closeMenu(){
      panel.querySelector('.lj-mask-menu')?.remove();
      panel.querySelector('[aria-expanded=true]')?.setAttribute('aria-expanded','false');menuId=null;sortOpen=false;
    }
    function menu(anchor,items){
      const box=D.createElement('div');box.className='lj-mask-menu';box.setAttribute('role','menu');panel.append(box);
      const icons={edit:icon('edit'),duplicate:messageIcon('copy'),pin:icon('pin'),delete:messageIcon('trash')};
      box.innerHTML=items.map(([action,label])=>`<button role="menuitem" type="button" data-mask="${action}">${icons[action]||''}${label}</button>`).join('');
      anchor.setAttribute('aria-expanded','true');
      const rect=anchor.getBoundingClientRect(),bounds=panel.getBoundingClientRect(),height=box.offsetHeight;
      box.style.right=Math.max(8,bounds.right-rect.right)+'px';
      box.style.top=Math.max(6,Math.min(rect.bottom-bounds.top+4,bounds.height-height-6))+'px';
      box.querySelector('button').focus({preventScroll:true});
    }
    function options(values,chosen){
      return values.map(([v,label])=>`<option value="${escapeHtml(v)}" ${String(chosen)===String(v)?'selected':''}>${escapeHtml(label)}</option>`).join('');
    }
    function editor(id){
      const c=ctx(),p=personaData(),d=p.persona_descriptions?.[id]||{}, locks=personaLocks(c,id);
      editId=id;mode=id?'edit':'new';formContext={chatId:c.chatId,conn:personaConnection(c),locks};header(id?'编辑面具':'创建新面具');
      const fields=[['称呼','name',p.personas[id]||''],['备注','note',d.title||'']];
      const namedFields=fields.map(([label,key,value])=>`<label>${label}<input name="${key}" value="${escapeHtml(value)}" ${key==='name'?'required':''}></label>`).join('');
      const lore=Array.from(new Set(['',...worldBookNames(),...(d.lorebook?[d.lorebook]:[])]));
      body.innerHTML=`<form class="lj-mask-form"><h3>面具设置</h3><label class="lj-mask-avatar">${id?`<img src="/User%20Avatars/${encodeURIComponent(id)}" alt="面具头像">`:''}更改人设图<input type="file" name="avatar" accept="image/*"></label>${namedFields}
      <label>性别<select name="gender">${options([['','未填写'],['女','女'],['男','男'],['其他','其他']],d[KEY]?.gender||'')}</select></label>
      <label>面具设定<textarea name="description" rows="7">${escapeHtml(d.description||'')}</textarea></label>
      <label>人设世界书<select name="lorebook">${options(lore.map(n=>[n,n||'未绑定']),d.lorebook||'')}</select></label>
      <label>设定插入位置<select name="position">${options([[0,'跟随模板或提示词列表'],[2,'作者注释开头'],[3,'作者注释末尾'],[4,'插入聊天记录'],[9,'不发送面具设定']],d.position??0)}</select></label>
      <div class="lj-mask-depth" ${Number(d.position)!==4?'hidden':''}><label>插入深度<input name="depth" type="number" min="0" max="9999" value="${Number(d.depth??4)}"></label><label>消息身份<select name="role">${options([[0,'系统'],[1,'用户'],[2,'助手']],d.role??0)}</select></label></div>
      <fieldset><legend>面具绑定</legend>${[['default','用作新聊天的默认面具',true],['character','绑定当前角色或群聊',!!formContext.conn],['chat','绑定当前存档',!!c.chatId]].map(([key,label,enabled])=>`<label><input type="checkbox" name="${key}" ${locks[key]?'checked':''} ${enabled?'':'disabled'}>${label}</label>`).join('')}</fieldset>
      <details><summary>酒馆其他设置</summary><div class="lj-mask-extra">${[['persona_show_notifications','显示酒馆面具通知'],['persona_auto_lock','自动绑定当前存档'],['persona_allow_multi_connections','允许一个角色绑定多个面具']].map(([key,label])=>`<label><input type="checkbox" data-mask-setting="${key}" ${p[key]?'checked':''}>${label}</label>`).join('')}
      <button type="button" data-mask="backup">备份全部面具</button><button type="button" data-mask="restore">从文件恢复面具</button><button type="button" data-mask="stats">查看使用统计</button>${id&&id===current?'<button type="button" data-mask="sync-names">将当前称呼应用到历史用户消息</button>':''}</div></details>
      <div class="lj-mask-footer"><button type="button" data-mask="back">取消</button><button type="submit">保存</button></div></form>`;
      body.scrollTop=0;
    }
    async function save(form){
      const c=ctx(), conn=personaConnection(c);
      if(c.chatId!==formContext.chatId || (conn||formContext.conn)&&!samePersonaConnection(conn,formContext.conn))throw Error('当前对话已切换，请重新打开面具');
      const data=new W.FormData(form), name=String(data.get('name')||'').trim();
      if(!name){form.elements.name.focus();return;}
      const args={name,title:data.get('note'),description:data.get('description'),lorebook:data.get('lorebook'),
        descriptionPosition:data.get('position'),descriptionDepth:data.get('depth'),descriptionRole:data.get('role')};
      const file=form.elements.avatar.files[0];
      if(file)args.avatar=await new Promise((resolve,reject)=>{const r=new W.FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('无法读取头像'));r.readAsDataURL(file);});
      args.avatarPromptResize='false';
      const id=editId?await personaCommand('update',{...args,persona:editId}):await personaCommand('create',{...args,select:'false'});
      if(!id||editId&&id!==editId)throw Error('酒馆未能保存这张面具');
      editId=id;
      const d=personaData().persona_descriptions[id];d[KEY]||={};d[KEY].gender=data.get('gender');
      if(mode==='new')d[KEY].created||=Date.now();
      await savePersonaLocks(c,id,formContext.locks,Object.fromEntries(['default','character','chat'].map(k=>[k,!!form.elements[k].checked])));
      for(const field of form.querySelectorAll('[data-mask-setting]')){
        const native=D.getElementById(field.dataset.maskSetting);
        if(native&&native.checked!==field.checked)native.click();
      }
      await persist(true);render();drawList();personaNotice('面具已保存');
    }
    async function perform(action,button,id){
      if(action==='back')return back();
      if(action==='sort'){const toggle=!sortOpen;closeMenu();if(toggle){sortOpen=true;menu(button,[['asc','按创建时间正序'],['desc','按创建时间倒序']]);}return;}
      if(action==='more'){const toggle=menuId!==id;closeMenu();if(toggle){menuId=id;const d=personaData().persona_descriptions[id];menu(button,[['edit','编辑'],['duplicate','复制'],['pin',d?.[KEY]?.pinned?'取消置顶':'置顶'],['delete','删除']]);}return;}
      closeMenu();
      if(action==='asc'||action==='desc'){descending=action==='desc';preferences().personaSort=action;await persist();drawList();return;}
      if(action==='new'||action==='edit')return editor(action==='new'?'':id);
      if(action==='cancel-delete'){drawList();return;}
      if(action==='delete'){mode='delete';editId=id;header('删除面具');body.innerHTML=`<div class="lj-mask-form"><p>删除「${escapeHtml(personaData().personas[id])}」及其面具设定？</p><div class="lj-mask-footer"><button data-mask="cancel-delete">取消</button><button data-mask="confirm-delete">确认删除</button></div></div>`;return;}
      const nativeActions={backup:'#personas_backup',restore:'#personas_restore',stats:'#PersonaManagement .user_stats_button','sync-names':'#sync_name_button'};
      if(nativeActions[action]){$(nativeActions[action])?.click();return;}
      busy=true;
      try{
        if(action==='select'){
          if(current===id)return;
          if(!Object.hasOwn(personaData().personas,id))throw Error('这张面具已不存在');
          const oldToasts=new Set(D.querySelectorAll('#toast-container .toast'));
          await personaCommand('set',{mode:'lookup'},id);
          const selectedId=await personaCommand('get',{field:'avatar'});
          if(selectedId!==id)throw Error('面具没有切换成功');
          const titles=['Persona Changed','Persona Selected'].map(s=>ctx().translate?.(s)||s);
          for(const note of D.querySelectorAll('#toast-container .toast-success')){
            if(!oldToasts.has(note) && titles.includes(note.querySelector('.toast-title')?.textContent.trim()))note.style.display='none';
          }
          current=id;render();
          for(const row of body.querySelectorAll('.lj-mask-card'))row.firstElementChild.setAttribute('aria-pressed',String(row.dataset.id===id));
          personaNotice(personaSuccess,true);
        }else if(action==='duplicate'){
          const copy=await personaCommand('duplicate',{persona:id,select:'false'});
          if(!copy)throw Error('面具复制失败');
          const d=personaData().persona_descriptions;
          d[copy][KEY]={gender:d[id]?.[KEY]?.gender||'',created:Date.now()};
          await persist(true);drawList();personaNotice('已复制面具');
        }else if(action==='pin'){
          const d=personaData().persona_descriptions[id]||={};d[KEY]||={};d[KEY].pinned=!d[KEY].pinned;
          await persist(true);drawList();
        }else if(action==='confirm-delete'){
          current=await deleteManagedPersona(editId);render();drawList();personaNotice('面具已删除');
        }
      }finally{busy=false;}
    }
    overlay.addEventListener('click',event=>{
      if(busy)return;
      if(event.target===overlay){back();return;}
      const button=event.target.closest('[data-mask]');
      if(!button){closeMenu();return;}
      if(mode==='list')scroll=body.firstElementChild?.scrollTop||0;
      const id=button.closest('[data-id]')?.dataset.id||menuId;
      perform(button.dataset.mask,button,id).catch(e=>personaNotice(e.message));
    });
    overlay.addEventListener('input',e=>{
      if(e.target.matches('[aria-label="搜索面具"]')){query=e.target.value;closeMenu();body.querySelector('.lj-mask-rows').innerHTML=listRows();}
      if(e.target.name==='position')body.querySelector('.lj-mask-depth').hidden=e.target.value!=='4';
    });
    overlay.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;try{await save(e.target);}catch(err){personaNotice(err.message);}finally{busy=false;}});
    overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();if(menuId||sortOpen){const anchor=panel.querySelector('[aria-expanded=true]');closeMenu();anchor?.focus();}else back();}});
    overlay.addEventListener('scroll',()=>{if(menuId||sortOpen)closeMenu();},true);
    try{current=await personaCommand('get',{field:'avatar'});drawList();head.querySelector('button')?.focus({preventScroll:true});}
    catch(e){overlay.remove();toast(e.message||'无法读取面具');}
  }

    const tokenColors=['#8b7cf6','#45b7d6','#5e8cf5','#68c7a3','#a4a4f5','#6bb9e8','#87a6f7','#c599dc','#b2b6c2'];
  const tokenLabels={preset:'预设及作品设定',memory:'记忆',author:'作者世界书',custom:'用户自定义世界书',persona:'面具人设',input:'本次用户输入',history:'历史对话',world:'其他世界书',other:'其他请求内容',body:'正文',state:'状态栏',reasoning:'思考内容'};
  function promptTexts(raw) {
    if(typeof raw==='string') return [{role:'',text:raw}];
    if(!Array.isArray(raw)) return [];
    return raw.map(m=>({role:m.role,text:typeof m.content==='string'?m.content:
      (Array.isArray(m.content)?m.content.filter(p=>typeof p.text==='string').map(p=>p.text).join('\n'):'')}));
  }
  function inputParts(raw, evidence, userText) {
    const messages=promptTexts(raw), parts={};
    const add=(key,s)=>{if(s.trim()) (parts[key]||=[]).push(s);};
    const last=messages.findLastIndex(m=>m.role==='user' && userText && m.text.includes(userText));
    for(const [i,m] of messages.entries()) {
      let spans=[{text:m.text}];
      const candidates=i===last||!m.role?[['input',userText],...evidence]:evidence;
      for(const [key,needle] of candidates) {
        if(!needle) continue;
        spans=spans.flatMap(span=>{
          if(span.key) return [span];
          const pos=span.text.indexOf(needle);
          if(pos<0) return [span];
          return [{text:span.text.slice(0,pos)},{key,text:needle},{text:span.text.slice(pos+needle.length)}];
        });
      }
      const fallback=['user','assistant'].includes(m.role)?'history':'other';
      for(const s of spans)add(s.key||fallback,s.text);
    }
    return parts;
  }
  function outputParts(message) {
    const parts={body:[],state:[]}, pattern=/<state\b[^>]*>[\s\S]*?(?:<\/state\s*>|$)/gi;
    const text=String(message.mes||'');let start=0;
    for(const match of text.matchAll(pattern)) {
      parts.body.push(text.slice(start,match.index));parts.state.push(match[0]);start=match.index+match[0].length;
    }
    parts.body.push(text.slice(start));
    if(message.extra?.reasoning)parts.reasoning=[message.extra.reasoning];
    return parts;
  }
  async function countParts(parts, counter) {
    const counts={};
    for(const [key,fragments] of Object.entries(parts)){
      const text=fragments.filter(s=>s.trim()).join('\n');
      if(!text) continue;
      const count=await counter(text,0);
      if(!Number.isFinite(count)||count<0) throw Error('分词器未返回有效计数');
      counts[key]=count;
    }
    return counts;
  }
  function promptEvidence(context, entries, record) {
    const card=selected()?.data||{}, e=[], add=(key,v)=>{if(typeof v==='string' && v.trim())e.push([key,v.trim()]);};
    if(record){
      for(const s of ['charDescription','charPersonality','scenarioText','instruction'])add('preset',record[s]);
      add('persona',record.userPersona);add('summary',record.summarizeString);add('world',record.worldInfoString);
      return e;
    }
    for(const [key,title] of [['permanent','永久记忆'],['long','长期记忆'],['short','短期记忆']]){
      const mem=context.chatMetadata?.[KEY]?.memory;
      if(mem?.enabled && mem[key])add(key,title+'\n'+mem[key]);
    }
    add('summary',context.extensionPrompts?.['1_memory']?.value);
    const book=card.character_book;
    for(const entry of entries){
      const native=book && (book.name===entry.world || card.extensions?.world===entry.world) && book.entries?.some(x=>x.content===entry.content);
      const userBook=[context.chatMetadata?.world_info,context.powerUserSettings?.persona_description_lorebook].filter(Boolean).includes(entry.world);
      add(native?'author':userBook?'custom':'world',entry.content);
    }
    add('persona',context.powerUserSettings?.persona_description);
    for(const s of [card.description,card.personality,card.scenario,card.system_prompt,...(context.chatCompletionSettings?.prompts||[]).map(p=>p.content)])add('preset',s);
    return e;
  }
  function promptBudget(context) {
    const o=context.chatCompletionSettings;
    const n=context.mainApi==='openai'?Number(o?.openai_max_context)-Number(o?.openai_max_tokens):Number(context.maxContext)-Number(context.amountGen);
    return Number.isFinite(n)&&n>0?n:null;
  }
  function monitorTokenRequests() {
    const c=ctx();let pending=null;
    function onEvent(name,fn){const type=c.eventTypes[name];if(type){c.eventSource.on(type,fn);listeners.push(()=>c.eventSource.removeListener(type,fn));}}
    onEvent('CHAT_CHANGED',()=>{pending=null;});
    onEvent('GENERATION_STARTED',(type,options,dry)=>{
      if(!dry)pending=['quiet','impersonate'].includes(type)?null:{type,chat:ctx().chatId,entries:[]};
    });
    onEvent('WORLD_INFO_ACTIVATED',entries=>{if(pending)pending.entries=Array.isArray(entries)?entries:[];});
    onEvent('GENERATE_AFTER_DATA',(data,dry)=>{
      if(dry || !pending || pending.chat!==ctx().chatId) return;
      const raw=data.prompt??data.input, c=ctx(), user=c.chat.findLast(m=>m.is_user&&!m.is_system);
      if(!promptTexts(raw).length) return;
      const parts=inputParts(raw,promptEvidence(c,pending.entries),user?.mes);
      pending.budget=promptBudget(c);
      pending.counts=countParts(parts,c.getTokenCountAsync).catch(()=>null);
    });
    onEvent('MESSAGE_RECEIVED',async(index,type)=>{
      if(!pending?.counts || pending.chat!==ctx().chatId || (type && type!==pending.type))return;
      const request=pending,ref=messageRef(index),slot=ref.message?.swipe_id;
      pending=null;
      const counts=await request.counts;
      if(!counts || !stillCurrent(ref)||ref.message.is_user||ref.message.swipe_id!==slot)return;
      const receipt={counts,budget:request.budget};
      ref.message.extra||={};(ref.message.extra[KEY]||={}).tokenRequest=receipt;
      const info=ref.message.swipe_info?.[slot];
      if(info){info.extra||={};(info.extra[KEY]||={}).tokenRequest=receipt;}
    });
    onEvent('GENERATION_STOPPED',()=>{pending=null;});
  }
  async function historicTokenRequest(ref) {
    const c=ctx(), message=ref.message;
    const receipt=message.extra?.[KEY]?.tokenRequest;
    if(receipt) return receipt;
    if(!ref.index || message.is_user || !message.gen_started || c.chatMetadata?.[KEY]?.branches?.parked?.length || c.chat.slice(1,ref.index+1).some(m=>m.swipes?.length>1))return null;
    const store=W.SillyTavern.libs?.localforage||W.localforage;
    if(!store)return null;
    const records=await store.createInstance({name:'SillyTavern_Prompts'}).getItem(ref.chatId);
    const record=records?.find(r=>r.mesId===ref.index),user=c.chat.slice(0,ref.index).findLast(m=>m.is_user&&!m.is_system);
    if(!record?.rawPrompt || !user?.mes || !promptTexts(record.rawPrompt).some(m=>m.text.includes(user.mes)))return null;
    const counts=await countParts(inputParts(record.rawPrompt,promptEvidence(c,[],record),user.mes),c.getTokenCountAsync);
    return {counts,budget:record.this_max_context||null};
  }
  const memoryTokenNames={permanent:'永久记忆',long:'长期记忆',short:'短期记忆',summary:'自动摘要'};
  function tokenRows(counts) {
    if(!counts)return [];
    const memory=Object.keys(memoryTokenNames).filter(k=>counts[k]>0).map(k=>({label:memoryTokenNames[k],value:counts[k]}));
    const values={...counts,memory:memory.reduce((sum,x)=>sum+x.value,0)};
    return Object.keys(tokenLabels).filter(k=>values[k]>0).map(k=>({label:tokenLabels[k],value:values[k],children:k==='memory'?memory:[]}));
  }
  async function showMessageTokens(index) {
    const ref=messageRef(index),overlay=messageModal(index,'Token 统计','<p>正在读取本轮用量…</p>','780px');
    const node=overlay.querySelector('.lj-modal-content'),counter=ctx().getTokenCountAsync;
    const [up,down]=await Promise.allSettled([historicTokenRequest(ref),countParts(outputParts(ref.message),counter)]);
    if(!overlay.isConnected || !stillCurrent(ref))return;
    const request=up.value, output=down.value, recorded=ref.message.extra?.token_count;
    const downCounts=output || (Number.isFinite(recorded)?{body:recorded}:null);
    const format=n=>n.toLocaleString('zh-CN');
    let tab='up',memoryOpen=false;
    function draw(){
      const incoming=tab==='up', counts=incoming?request?.counts:downCounts, rows=tokenRows(counts);
      const total=rows.reduce((s,r)=>s+r.value,0), limit=request?.budget;
      const inputTotal=tokenRows(request?.counts).reduce((s,r)=>s+r.value,0);
      const level=request?.counts&&limit?(inputTotal<limit*.7?'healthy':inputTotal<limit?'warning':'critical'):'unknown';
      const health={healthy:'请求Token长度健康',warning:'请求Token接近输入上限',critical:'请求Token已达到输入上限',unknown:request?'未记录本轮输入上限':'本条回复没有可核对的上行记录'}[level];
      let sum=0;const segments=rows.map((row,i)=>{const start=sum;sum+=100*row.value/total;return tokenColors[i%tokenColors.length]+' '+start+'% '+sum+'%';});
      const label=(incoming?'上行':'下行')+' Token 总数';
      node.innerHTML=`<div class="lj-token-panel"><div class="lj-token-health ${level}">${health}</div><div class="lj-token-columns"><div class="lj-token-overview"><div><strong>${counts?format(total):'—'}</strong> Token</div><span>${label}</span><div class="lj-token-ring" role="img" aria-label="${label} ${counts?format(total):'未记录'}" style="${segments.length?'background:conic-gradient('+segments.join(',')+')':''}"></div></div><div class="lj-token-detail"><div class="lj-token-tabs" role="group" aria-label="统计方向">${['up','down'].map((t,i)=>`<button type="button" data-token-tab="${t}" aria-pressed="${tab===t}">${i?'下行':'上行'} Token</button>`).join('')}</div><div class="lj-token-rows">${rows.map((r,i)=>`<div class="lj-token-line"><i style="background:${tokenColors[i%tokenColors.length]}"></i>${r.children.length?`<button data-token-memory aria-expanded="${memoryOpen}">${r.label} ${memoryOpen?'⌃':'⌄'}</button>`:`<span>${r.label}</span>`}<b>${format(r.value)} Token</b></div>${r.children.length&&memoryOpen?r.children.map(x=>`<div class="lj-token-child">${x.label}<span>${format(x.value)} Token</span></div>`).join(''):''}`).join('')||`<p>${counts?'没有可统计的文本':incoming?'酒馆未保留能对应到这一版回复的请求。可以查看下行 Token。':'这条回复的用量暂时无法读取。'}</p>`}</div><div class="lj-token-footer">${label}<b>${counts?format(total)+' Token':'未记录'}</b></div></div></div><small>按酒馆分词器统计文本用量。</small></div>`;
    }
    node.addEventListener('click',e=>{
      const button=e.target.closest('button');if(!button)return;
      if(button.dataset.tokenTab){tab=button.dataset.tokenTab;draw();node.querySelector('[data-token-tab="'+tab+'"]').focus();}
      else if(button.hasAttribute('data-token-memory')){memoryOpen=!memoryOpen;draw();node.querySelector('[data-token-memory]')?.focus();}
    });
    draw();
  }

  function preferences() {
    const context = ctx();
    if (!context) return {};
    const defaults = {version:VERSION, enabled:false, lastChats:{}, pinned:[], backgrounds:{}, notes:{}, stats:{}, greetingNames:{}, originalThemes:null};
    context.extensionSettings[KEY] ||= defaults;
    const value = context.extensionSettings[KEY];
    for (const [key, initial] of Object.entries(defaults)) if (value[key] === undefined) value[key] = initial;
    return value;
  }
  async function persist(immediate = false) {
    if (immediate) {
      const context = ctx();
      await new Promise((resolve,reject)=>{
        const type=context.eventTypes.SETTINGS_UPDATED;
        const done=()=>{W.clearTimeout(timer);context.eventSource.removeListener(type,done);resolve();};
        const timer=W.setTimeout(()=>{context.eventSource.removeListener(type,done);reject(new Error('设置保存超时，原文件未删除，请稍后重试。'));},10000);
        context.eventSource.on(type,done);
        context.saveSettingsDebounced();
      });
    } else ctx().saveSettingsDebounced();
  }
  function on(target, name, handler, options) { target.addEventListener(name, handler, options); listeners.push(() => target.removeEventListener(name, handler, options)); }
  function toast(message) {
    if (!root) return W.toastr?.info(message);
    (portal || root).querySelector('.lj-toast')?.remove();
    const el = D.createElement('div'); el.className = 'lj-toast'; el.setAttribute('role','status'); el.textContent = message; (portal || root).append(el);
    W.clearTimeout(toastTimer); toastTimer = W.setTimeout(() => el.remove(), 4000);
  }
  async function post(url, data) {
    const response = await W.fetch(url,{method:'POST',headers:ctx().getRequestHeaders(),body:JSON.stringify(data)});
    if (!response.ok) throw new Error(`${url} (${response.status})`);
    return response.json();
  }
  function characterEntries() { return (ctx()?.characters || []).map((c,id) => ({c,id})).filter(({c}) => c && c.avatar); }
  function selected() { return ctx()?.characters?.[ctx()?.characterId]; }
  function avatar(c) { return c?.avatar ? '/characters/' + encodeURIComponent(c.avatar) : '/img/ai4.png'; }
  function thumb(c) { try { return ctx().getThumbnailUrl('avatar', c.avatar); } catch (_) { return avatar(c); } }
  function plain(text) { const e = D.createElement('div'); e.innerHTML = String(text || '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,''); return e.textContent || ''; }
  function description(c) { return plain(c.data?.creator_notes || c.data?.description || c.description || '').replace(/\s+/g,' ').slice(0,180); }
  function tags(c) { return (c.data?.tags || c.tags || []).slice(0,8); }
  function roundLabel(c) { const value = preferences().stats[c.avatar]; return value && Number.isFinite(value.rounds) ? `${value.rounds} 轮` : '统计中'; }
  const archiveFacts = new Map();
  function hasUserMessage(messages) {
    return Array.isArray(messages) && messages.some(m=>m?.is_user && !m.is_system);
  }
  function archiveTime(file) {
    const value=file.last_mes;
    if(typeof value==='number')return value;
    const time=Date.parse(value);
    if(Number.isFinite(time))return time;
    const stamp=String(value||file.file_name).match(/(\d{4})-(\d{2})-(\d{2})@(\d+)h(\d+)m(\d+)s(\d+)?/);
    return stamp?new Date(+stamp[1],+stamp[2]-1,+stamp[3],+stamp[4],+stamp[5],+stamp[6],+(stamp[7]||0)).getTime():0;
  }
  async function sessions(c, includePreviews=false, fresh=false) {
    if(fresh)sessionData.delete(c.avatar);
    if(!sessionData.has(c.avatar)) {
      const job=(async()=>{
        const data=await post('/api/characters/chats',{avatar_url:c.avatar,metadata:true});
        const files=data?.error?[]:Object.values(data||{}).filter(f=>f?.file_name);
        const list=[];
        for(const file of files) {
          const key=JSON.stringify([c.avatar,file.file_name]);
          const fingerprint=JSON.stringify([file.last_mes,file.chat_items,file.file_size]);
          let facts=archiveFacts.get(key);
          if(facts?.fingerprint!==fingerprint) {
            const messages=await post('/api/chats/get',{avatar_url:c.avatar,file_name:chatFile(file.file_name)});
            if(!Array.isArray(messages))throw Error('存档读取失败，请稍后再试。');
            facts={fingerprint,started:hasUserMessage(messages),rounds:countRounds(messages)};
            archiveFacts.set(key,facts);
          }
          list.push({...file,...facts});
        }
        return list.sort((a,b)=>archiveTime(b)-archiveTime(a)||b.file_name.localeCompare(a.file_name));
      })();
      sessionData.set(c.avatar,job);
      job.catch(()=>{if(sessionData.get(c.avatar)===job)sessionData.delete(c.avatar);});
    }
    const list=await sessionData.get(c.avatar);
    return includePreviews?list:list.filter(f=>f.started);
  }
  async function rememberChat() {
    const context=ctx(), c=selected(), file=chatFile(context?.chatId);
    if(context?.groupId!=null || !c || !file || !hasUserMessage(context.chat))return;
    if(preferences().lastChats[c.avatar]===file)return;
    preferences().lastChats[c.avatar]=file;
    context.saveSettingsDebounced();
    // Persist the selected file in the card too, so the original interface resumes it.
    await W.fetch('/api/characters/merge-attributes',{
      method:'POST',headers:context.getRequestHeaders(),body:JSON.stringify({avatar:c.avatar,chat:file})
    }).then(r=>{if(!r.ok)throw Error(r.status);}).catch(error=>console.warn('[建设主题] 保存最近存档',error));
  }
  function mountArchiveResume(context) {
    const changed=async()=>{sessionData.clear();await rememberChat();};
    const renamed=event=>{
      const avatar=event?.avatarId, names=preferences().lastChats;
      if(avatar && names[avatar]===chatFile(event.oldFileName))names[avatar]=chatFile(event.newFileName);
      changed();context.saveSettingsDebounced();
    };
    for(const [name,handler] of Object.entries({CHAT_CHANGED:changed,MESSAGE_SENT:changed,CHAT_RENAMED:renamed,CHAT_DELETED:changed})) {
      const type=context.eventTypes[name];
      if(type){context.eventSource.on(type,handler);listeners.push(()=>context.eventSource.removeListener(type,handler));}
    }
    rememberChat();
  }
  function applyArchiveCount(c,list,force=false) {
    const fingerprint=JSON.stringify(list.map(x=>[x.file_name,x.last_mes,x.chat_items,x.file_size]));
    const cache=preferences().stats[c.avatar];
    if(!force && cache?.fingerprint===fingerprint)return;
    const rounds=list.reduce((sum,file)=>sum+file.rounds,0);
    preferences().stats[c.avatar]={rounds,chats:list.length,fingerprint,updated:new Date().toISOString(),last:list[0]?.last_mes||''};
    ctx().saveSettingsDebounced();
    if(root) {
      for(const el of root.querySelectorAll('[data-round-avatar]'))if(el.dataset.roundAvatar===c.avatar)el.textContent=rounds+' 轮';
      for(const el of root.querySelectorAll('[data-archive-count]'))if(el.dataset.archiveCount===c.avatar)el.textContent=list.length+' 个存档';
    }
  }
  async function updateCount(c, force = false) {
    if(countPromises.has(c.avatar))return countPromises.get(c.avatar);
    const job=(async()=>{
      const request=sessions(c), source=sessionData.get(c.avatar);
      const list=await request;
      // Ignore a scan invalidated by a message or a chat switch while it was loading.
      if(source===sessionData.get(c.avatar))applyArchiveCount(c,list,force);
    })().catch(error=>{console.warn('[建设主题] 轮数统计',error); if(root)for(const el of root.querySelectorAll('[data-round-avatar]'))if(el.dataset.roundAvatar===c.avatar)el.textContent='统计失败';}).finally(()=>countPromises.delete(c.avatar));
    countPromises.set(c.avatar,job);return job;
  }
  function scheduleCounts() {
    for (const {c} of characterEntries()) countQueue = countQueue.then(()=>disposed ? null : updateCount(c));
  }
  const navItems = [['home','home','首页'],['recent','chat','对话'],['creator','user','我的角色'],['worlds','book','世界书'],['presets','preset','预设库'],['usage','chart','使用统计'],['settings','settings','设置']];
  function sideBar() {
    const entries = characterEntries().slice().sort((a,b)=>Number(b.c.date_last_chat||0)-Number(a.c.date_last_chat||0));
    return `<aside class="lj-sidebar"><div class="lj-brand"><div class="lj-brand-mark">${icon('leaf')}</div></div><nav class="lj-navigation" aria-label="主导航">${navItems.map(([page,i,label])=>`<button data-action="primary-route" data-page="${page}" class="${route===page?'active':''}" title="${label}">${icon(i)}<span>${label}</span></button>`).join('')}</nav><div class="lj-side-title">最近对话</div>${entries.slice(0,4).map(({c,id})=>`<button class="lj-side-character" data-action="open-char" data-id="${id}" title="${escapeHtml(c.name)}"><img src="${escapeHtml(thumb(c))}" alt=""><strong>${escapeHtml(c.name)}</strong></button>`).join('')}</aside>`;
  }
  function bottomNav() { return `<nav class="lj-bottom-nav" aria-label="手机导航">${[['home','home','首页'],['recent','chat','对话'],['presets','preset','预设'],['settings','user','我的']].map(([p,i,n])=>`<button data-action="primary-route" data-page="${p}" class="${route===p?'active':''}">${icon(i)}<span>${n}</span></button>`).join('')}</nav>`; }
  function title(name,buttons='') { return `<header class="lj-page-header"><h1>${name}</h1><div class="lj-row lj-wrap">${pageBackButton()}${buttons}</div></header>`; }
  function searchBox(placeholder='搜索角色、设定或标签') { return `<input class="lj-search" id="lj-search" type="search" placeholder="${placeholder}" value="${escapeHtml(search)}" aria-label="${placeholder}">`; }
  function sortedCharacters(pinChats=false) {
    const entries=characterEntries();
    if(!listOrder)listOrder=new Map(entries.slice().sort((a,b)=>String(b.c.date_last_chat||'').localeCompare(String(a.c.date_last_chat||''))).map(({c},i)=>[c.avatar,i]));
    return entries.filter(({c})=>{
      return `${c.name} ${tags(c).join(' ')} ${description(c)}`.toLowerCase().includes(search.toLowerCase());
    }).sort((a,b)=>{
      if(pinChats){
        const pins=preferences().pinned;
        const aPin=pins.indexOf(a.c.avatar), bPin=pins.indexOf(b.c.avatar);
        if(aPin!==bPin)return aPin<0?1:bPin<0?-1:aPin-bPin;
      }
      return (listOrder.get(a.c.avatar)??entries.length)-(listOrder.get(b.c.avatar)??entries.length);
    });
  }
  function cards() {
    const entries=sortedCharacters();
    return `<div class="lj-grid" id="lj-character-grid">${entries.map(({c,id})=>`<article class="lj-character-card" data-action="${route==='creator'?'manage-char':'open-char'}" data-id="${id}" tabindex="0" role="button" aria-label="${route==='creator'?'管理':'进入'} ${escapeHtml(c.name)}"><img src="${escapeHtml(avatar(c))}" alt="${escapeHtml(c.name)}" loading="lazy"><div class="lj-card-gradient"></div><span class="lj-card-creator">${escapeHtml(c.data?.creator || '我的角色')}</span><div class="lj-card-content"><h3>${escapeHtml(c.name)}</h3><div class="lj-card-description">${escapeHtml(tags(c).join(' / ') || description(c) || '开启属于你们的故事')}</div><div class="lj-card-stats"><span data-round-avatar="${escapeHtml(c.avatar)}">${roundLabel(c)}</span></div></div></article>`).join('') || '<div class="lj-empty">没有找到角色</div>'}</div>`;
  }
  function homePage(creator=false) {
    return title(creator?'我的角色':'首页',creator?'<button class="lj-primary" data-action="create-char">新建角色</button><button class="lj-soft" data-action="import-char">导入角色卡</button>':searchBox()) + (creator?'':homeBanner()) + (creator?`<div class="lj-row" style="margin-bottom:20px">${searchBox()}</div>`:'')+cards();
  }
  function recentPage() {
    return title('最近对话',searchBox('搜索角色或故事'))+`<div class="lj-list">${sortedCharacters(true).map(({c,id})=>`<article class="lj-session-card"><div class="lj-session-head" data-action="toggle-sessions" data-id="${id}" role="button" tabindex="0"><img src="${escapeHtml(thumb(c))}" alt=""><div class="lj-session-info"><h3>${escapeHtml(c.name)}</h3><div class="lj-muted lj-small"><span data-round-avatar="${escapeHtml(c.avatar)}">${roundLabel(c)}</span> · <span data-archive-count="${escapeHtml(c.avatar)}">${preferences().stats[c.avatar]?.chats ?? '—'} 个存档</span></div></div><button class="lj-iconbutton ${preferences().pinned.includes(c.avatar)?'lj-badge':''}" data-action="pin" data-id="${id}" aria-pressed="${preferences().pinned.includes(c.avatar)}" aria-label="${preferences().pinned.includes(c.avatar)?'取消置顶':'置顶'} ${escapeHtml(c.name)}">${icon('pin')}</button><span>⌄</span></div><div class="lj-session-content" data-sessions="${id}" hidden></div></article>`).join('') || '<div class="lj-empty">暂无对话</div>'}</div>`;
  }
  function worldsPage() {
    const names=worldBookNames();
    const bound=selected()?.data?.extensions?.world;
    return title('世界书','<button class="lj-primary" data-action="world-new">创建与导入</button>') + `<div class="lj-row lj-wrap" style="margin-bottom:20px">${searchBox('搜索世界书名称')}<button class="lj-soft" data-action="native" data-panel="worlds">全局世界书设置</button></div><div class="lj-resource-grid">${names.filter(n=>n.toLowerCase().includes(search.toLowerCase())).map((name,i)=>`<article class="lj-resource"><div class="lj-resource-cover" style="filter:hue-rotate(${(i%4)*12}deg)">${icon('book')}<span>${escapeHtml(name)}</span></div><div class="lj-resource-body"><div class="lj-row lj-space"><h3>${escapeHtml(name)}</h3>${bound===name?'<span class="lj-badge">角色已绑定</span>':''}</div><p>独立世界书资源，按角色、聊天或全局范围管理。</p><div class="lj-row lj-space"><button class="lj-primary" data-action="edit-world" data-name="${escapeHtml(name)}">编辑条目</button></div></div></article>`).join('') || '<div class="lj-empty">暂无世界书，可以创建或导入自己的世界。</div>'}</div>`;
  }
  function settingsPage() {
    const panels=[['api','link','模型连接','连接配置、模型和服务商'],['personas','user','人设面具','头像、人设和绑定'],['users','sun','界面与阅读','字号、字体、阅读与聊天偏好'],['backgrounds','image','背景库','全局背景与聊天背景'],['extensions','preset','扩展管理','正则、摘要、快捷回复和已安装扩展'],['format','edit','发给模型的消息格式','设置聊天记录和指令的排列方式']];
    return title('个人设置')+`<div class="lj-settings-grid lj-personal-resources">${[['creator','user','我的角色','创建和管理你的全部角色'],['worlds','book','世界书库','按角色绑定的世界设定'],['presets','preset','预设库','编辑提示词、开关和生成参数']].map(([p,i,t,d])=>`<button class="lj-setting-card" data-action="route" data-page="${p}">${icon(i)}<span><strong>${t}</strong><small>${d}</small></span></button>`).join('')}</div><h2 style="margin-top:28px">偏好与工具</h2><div class="lj-settings-grid">${panels.map(([p,i,t,d])=>`<button class="lj-setting-card" data-action="native" data-panel="${p}">${icon(i)}<span><strong>${t}</strong><small>${d}</small></span></button>`).join('')}</div><h2 style="margin-top:32px">数据与主题</h2><div class="lj-settings-grid"><button class="lj-setting-card" data-action="backup">${icon('download')}<span><strong>下载备份</strong><small>下载用户数据或主题源文件</small></span></button><button class="lj-setting-card" data-action="restore-theme">${icon('leaf')}<span><strong>切回原主题</strong><small>恢复改造前主题的启用状态</small></span></button></div><p class="lj-muted lj-small" style="margin-top:24px">建设主题 ${VERSION}。你的私人故事空间。</p>`;
  }
  function usagePage() {
    const stats=Object.values(preferences().stats);
    return title('使用统计','<button class="lj-soft" data-action="refresh-stats">刷新统计</button>')+`<div class="lj-stat-grid"><div class="lj-stat"><strong>${characterEntries().length}</strong>角色</div><div class="lj-stat"><strong>${stats.reduce((n,x)=>n+(x.rounds||0),0)}</strong>已统计聊天轮数</div><div class="lj-stat"><strong>${stats.reduce((n,x)=>n+(x.chats||0),0)}</strong>已统计存档</div></div><p class="lj-muted">一组用户消息和 AI 回复算一轮。开场白和重说版本不额外增加轮数，各存档分别统计后合计。</p><p class="lj-muted">点角色回复下的更多按钮可查看这条消息的用量。实际费用以模型服务商的账单为准。</p><button class="lj-soft" data-action="route" data-page="presets">查看我的预设</button>`;
  }
  function currentPreset() { return ctx().getPresetManager?.()?.getSelectedPresetName?.() || '选择预设'; }
  function bgSettings() { const c=selected(); return c ? (ctx().chatMetadata?.[KEY]?.background || preferences().backgrounds[c.avatar] || {mode:'default',dim:.42,blur:3}) : {dim:.42,blur:3}; }
  function chatPage() {
    const c=selected();if(!c)return '<div class="lj-main"><div class="lj-empty">请先选择一个角色。</div></div>';
    const bg=bgSettings();
    return `<div class="lj-chat-background" style="--lj-dim:${Number(bg.dim)||0};--lj-blur:${Number(bg.blur)||0}px"><img src="${escapeHtml(bg.url || avatar(c))}" alt=""></div><header class="lj-chat-header"><button class="lj-iconbutton" data-action="page-back" aria-label="返回${escapeHtml(pageTrail.at(-1)?.label||'对话列表')}">${icon('back')}</button><img src="${escapeHtml(thumb(c))}" alt=""><strong>${escapeHtml(archiveTitle(ctx().chatId || c.name))}</strong><button type="button" class="lj-iconbutton" data-action="page-sound" aria-label="页面静音"></button><button class="lj-iconbutton" data-action="background" aria-label="聊天背景设置">${icon('sun')}</button><button class="lj-iconbutton" data-action="details" aria-label="角色资料">${icon('panel')}</button></header>${chatProfile(c)}`;
  }
  function ensureToolbar() {
    if(!$('#form_sheld'))return;
    if(!toolbar){toolbar=D.createElement('div');toolbar.className='lj-native-tools';$('#form_sheld').before(toolbar);on(toolbar,'click',handleClick);}
    toolbar.hidden=route!=='chat' && !D.body.classList.contains('lj-reading-tool');
    toolbar.innerHTML=`<button class="lj-toolbar-preset" data-action="pair-picker" aria-label="选择预设和模型" title="选择预设和模型">${icon('preset')}<span>${escapeHtml(pairToolbarLabel())}</span></button><button class="lj-toolbar-box" data-action="toolbox">${icon('panel')}工具箱</button>`;
    const right = $('#rightSendForm');
    if (right && !right.querySelector('.lj-input-more')) {
      const more = D.createElement('button');
      more.type = 'button';
      more.className = 'lj-input-more';
      more.title = '打开聊天操作';
      more.setAttribute('aria-label', '打开聊天操作');
      more.innerHTML = icon('plus');
      right.append(more);
      on(more,'click',composeMenu);
      listeners.push(() => more.remove());
    }
  }
  function render() {
    if(!root||disposed||originalView)return;
    // Keep the transcript laid out behind full-page chat tools. Collapsing it also
    // resizes the card's iframes and lets the browser move its scroll anchor on return.
    const sameView=root.dataset.view===String(navigationRevision);
    const scroll=sameView?scrollState():null;
    root.dataset.view=String(navigationRevision);
    const behindTool=route!=='chat' && Boolean(currentToolOrigin());
    D.body.classList.toggle('lj-reading-tool',behindTool);
    D.body.classList.toggle('lj-chat',route==='chat' || behindTool);
    D.body.classList.toggle('lj-native-open',Boolean(nativeTitle));
    const pages={home:()=>homePage(),creator:()=>homePage(true),recent:recentPage,presets:presetsPage,'preset-editor':bookEditor,worlds:worldsPage,settings:settingsPage,usage:usagePage,workspace:settingsWorkspace,'world-editor':worldEditor};
    const content=route==='chat'?chatPage():`<main class="lj-main">${(pages[route] || pages.home)()}</main>`;
    root.innerHTML=sideBar()+content+bottomNav();
    const soundButton = root.querySelector('[data-action="page-sound"]');
    if (soundButton) updateSoundButton(soundButton);
    dismissArchiveMenu();
    if(scroll)restoreScroll(scroll);
    syncCardWidgets();
    applyStoryStyle();
    ensureToolbar();
    if(route==='chat'&&selected()){refreshShallowProfile(selected()).catch(()=>{});decorateMessages();}
    syncChatReading(route==='chat'?pairScope():'');
  }
  function navigate(page,origin) {
    if(page!==route || origin)enterPage(page,origin);
    if(page==='chat')syncChatReading(pairScope(),true);
    render();
  }
  function closeNative() {
    if(nativePanel){const panel=D.getElementById(nativePanel);if(panel?.classList.contains('openDrawer'))panel.closest('.drawer')?.querySelector('.drawer-toggle')?.click();}
    nativePanel='';nativeTitle='';D.body.classList.remove('lj-native-open');
  }
  async function openNative(key,id) {
    if(key==='api')return openPairManagement('rows');
    if(key==='personas')return openPersonaManager();
    const origin=capturePage(), revision=navigationRevision;
    if(key==='characters'){
      const target=id??ctx().characterId;
      if(target!=null && (id!=null || ctx().menuType!=='create') && !await selectForPage(target,true))return;
    }
    if(revision!==navigationRevision)return;
    enterPage('workspace',origin);
    workspaceKey=screenConfig[key]?key:'extensions';workspaceTab='';workspaceSearch='';render();
  }
  let openingCharacter=false;
  async function openCharacter(id,file){
    if(openingCharacter)return;
    openingCharacter=true;
    const origin=capturePage(), revision=navigationRevision;
    try {
      const context=ctx(), initial=context.characters[id];
      if(!initial)return;
      if(context.streamingProcessor){toast('请先等待当前回复完成。');return;}
      if(initial.shallow)await context.unshallowCharacter(id);
      const c=ctx().characters[id];
      if(!c || c.avatar!==initial.avatar || revision!==navigationRevision)return;
      // Resolve an existing file before selecting the character. Loading a missing
      // card.chat makes the host immediately create and save another greeting.
      const list=await sessions(c,true,true), started=list.filter(f=>f.started);
      const names=[c.chat,preferences().lastChats[c.avatar]].map(chatFile);
      let target=file?list.find(f=>chatFile(f.file_name)===chatFile(file)):
        names.map(name=>started.find(f=>chatFile(f.file_name)===name)).find(Boolean)||started[0]||
        list.find(f=>chatFile(f.file_name)===chatFile(c.chat))||list[0];
      if(file && !target)throw Error('这个存档已被移走，请刷新存档列表。');
      if(revision!==navigationRevision)return;
      if(target && String(ctx().characterId)!==String(id))c.chat=chatFile(target.file_name);
      if(!await selectForPage(id,false) || revision!==navigationRevision)return;
      if(target && chatFile(ctx().chatId)!==chatFile(target.file_name))await ctx().openCharacterChat(chatFile(target.file_name));
      if(revision!==navigationRevision)return;
      await rememberChat();
      toolOrigin=null;
      navigate('chat',origin);
    } finally {openingCharacter=false;}
  }
  async function toggleSessions(id) {
    const el=root.querySelector(`[data-sessions="${id}"]`);if(!el)return;
    el.hidden=!el.hidden;if(el.hidden)return;
    el.innerHTML='<p class="lj-muted lj-small">正在读取存档…</p>';
    const c=ctx().characters[id],list=await sessions(c);
    if(!el.isConnected)return;
    applyArchiveCount(c,list);
    el.innerHTML='<button class="lj-soft" data-action="manage-archives" data-id="'+id+'">管理存档</button>'+(sessionItems(list,id)||'<p class="lj-muted lj-small">暂无存档，点击角色开始聊天。</p>');await labelArchiveOpenings(el,list,id);
  }
  function sessionItems(list,id) {
    const avatar=ctx().characters[id]?.avatar;
    return list.map(file=>{
      const active=selected()?.avatar===avatar && chatFile(ctx().chatId)===chatFile(file.file_name);
      const time=new Date(archiveTime(file)),pad=n=>String(n).padStart(2,'0');
      const date=archiveTime(file)?time.getFullYear()+'-'+pad(time.getMonth()+1)+'-'+pad(time.getDate())+' '+pad(time.getHours())+':'+pad(time.getMinutes()):'';
      const name=archiveTitle(file.file_name);
      return `<article class="lj-save-card ${active?'lj-save-current':''}" data-file="${escapeHtml(file.file_name)}" data-id="${id}"><button type="button" class="lj-save-open" data-action="open-session" data-id="${id}" data-file="${escapeHtml(file.file_name)}"><strong>${icon('archive')}${escapeHtml(name)}</strong><p>${file.started?escapeHtml(plain(file.mes||file.preview||'').slice(0,120)):'尚未发送用户消息'}</p><small><span data-archive-opening></span>${escapeHtml(date)}${active?' · 当前':''}</small></button><button type="button" class="lj-iconbutton lj-save-more" data-action="archive-menu" data-id="${id}" data-file="${escapeHtml(file.file_name)}" aria-label="存档操作 ${escapeHtml(name)}" aria-haspopup="menu" aria-expanded="false">···</button></article>`;
    }).join('');
  }
  function modal(name,html,width='760px') {
    const overlay=D.createElement('div');suspendDialog(overlay,dialogName(visibleDialog())===name);
    const parent=dialogParents.get(overlay), back=parent?`<button class="lj-iconbutton" data-action="close-modal" aria-label="返回${escapeHtml(dialogName(parent.layer))}">${icon('back')}</button>`:route==='chat'?chatReturnButton():'';
    overlay.className='lj-modal-backdrop';overlay.innerHTML=`<section class="lj-modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(name)}" style="max-width:${width}"><header class="lj-modal-header">${back}<strong>${escapeHtml(name)}</strong><button class="lj-iconbutton" data-action="close-modal" aria-label="关闭">${icon('close')}</button></header><div class="lj-modal-content">${html}</div></section>`;portal.append(overlay);overlay.querySelector('button')?.focus();return overlay;
  }
  function backgroundModal() {
    const c=selected();if(!c)return;const b=backgroundScope==='character'?(preferences().backgrounds[c.avatar]||{mode:'default',dim:.42,blur:3}):bgSettings();
    modal('聊天背景',`<p class="lj-muted lj-small">当前角色 ${escapeHtml(c.name)}</p><label>保存范围</label><select id="lj-background-scope" aria-label="背景保存范围"><option value="character" ${backgroundScope==='character'?'selected':''}>角色默认背景</option><option value="chat" ${backgroundScope==='chat'?'selected':''}>仅当前聊天存档</option></select><div class="lj-bg-options"><button class="lj-bg-option ${!b.url?'active':''}" data-action="default-bg" aria-label="使用角色图"><img src="${escapeHtml(avatar(c))}" alt="默认角色图"></button><button class="lj-bg-option ${b.url?'active':''}" data-action="upload-bg">${icon('plus')}<span>自定义换图</span></button></div><div class="lj-filters">${['default','immersive','focus','custom'].map((m,i)=>`<button data-action="bg-mode" data-mode="${m}" class="${(b.mode||'default')===m?'active':''}">${['默认','沉浸','专注','自定义'][i]}</button>`).join('')}</div><label>背景遮罩 <span id="lj-dim-value">${Math.round(b.dim*100)}%</span></label><input type="range" min="0" max="90" value="${Math.round(b.dim*100)}" id="lj-bg-dim" style="width:100%" aria-label="背景遮罩"><label>背景模糊 <span id="lj-blur-value">${b.blur}px</span></label><input type="range" min="0" max="20" value="${b.blur}" id="lj-bg-blur" style="width:100%" aria-label="背景模糊"><p class="lj-muted lj-small">上传的图片保存在酒馆自己的背景库中。原背景管理功能继续保留。</p>`, '420px');
  }
  function setBackground(update) { const c=selected();if(!c)return;if(backgroundScope==='chat'){ctx().chatMetadata[KEY]||={};ctx().chatMetadata[KEY].background={...bgSettings(),...update};ctx().saveChat();}else{preferences().backgrounds[c.avatar]={...(preferences().backgrounds[c.avatar]||{mode:'default',dim:.42,blur:3}),...update};persist();}applyBackground(); }
  function applyBackground(){const b=bgSettings(),el=root.querySelector('.lj-chat-background');if(el){el.style.setProperty('--lj-dim',String(b.dim));el.style.setProperty('--lj-blur',`${b.blur}px`);const img=el.querySelector('img');if(img)img.src=b.url||avatar(selected());}}
  async function uploadBackground() {
    const input=D.createElement('input');input.type='file';input.accept='image/*';
    input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;try{const form=new W.FormData();form.append('avatar',file,`background-${Date.now()}-${file.name}`);const headers={...ctx().getRequestHeaders()};delete headers['Content-Type'];delete headers['content-type'];const res=await W.fetch('/api/backgrounds/upload',{method:'POST',headers,body:form});if(!res.ok)throw Error(res.status);const name=await res.text();setBackground({url:'/backgrounds/'+encodeURIComponent(name.trim()),mode:'custom'});backgroundModal();toast('背景已保存到当前角色');}catch(e){toast('背景上传失败，请在背景图库重试。');}});input.click();
  }
  function toolbox() { beginChatTools();modal('聊天工具箱',`<div class="lj-settings-grid">${[['memory','book','故事记忆','短期、长期与永久记忆'],['tree','chat','消息树','预览不同说法，跳转到想继续的剧情'],['quickreply','edit','角色指令','快捷回复与角色专属指令'],['world-library','book','世界书','角色绑定与条目管理'],['regex','preset','文字替换规则（正则）','编辑角色的文字替换和显示规则']].map(([a,i,n,t])=>`<button class="lj-setting-card" data-action="tool" data-tool="${a}">${icon(i)}<span><strong>${n}</strong><small>${t}</small></span></button>`).join('')}</div>`); }
  function memoryData() { ctx().chatMetadata[KEY] ||= {};ctx().chatMetadata[KEY].memory ||= {short:'',long:'',permanent:'',enabled:false};return ctx().chatMetadata[KEY]; }
    const memoryFields = {short:'短期记忆', long:'长期记忆', permanent:'永久记忆'};
  const memoryGuide = `<section id="lj-memory-guide" class="lj-memory-guide" aria-label="两种记忆怎么用" hidden>
    <h3>两种记忆怎么用？</h3>
    <p><strong>手动记忆是你写的。</strong>适合记下你希望角色一直记得的事。默认只保存在当前存档。勾选下方的发送选项，再点「保存记忆」，写下一条回复的模型就能看到短期、长期和永久三个栏里填过的内容。</p>
    <p><strong>柏宝书帮你记剧情。</strong>启用后，它可以把聊过的内容整理成摘要。你可以给它选一个副模型，专门做摘要和总结；没选副模型的任务会用主模型。写正文时，主模型会收到柏宝书为这一轮挑出的记忆。</p>
    <p><strong>两种可以一起用。</strong>比如你记下「他还不知道钥匙是谁给的」，柏宝书记下「他昨晚捡到了钥匙」。两条都发出时，主模型就能同时参考。两边写了同一件事，可能会发两遍，多占一份输入额度。只打开这个页面看一眼，不会发送记忆。</p>
  </section>`;
  const memoryViews = new WeakMap();
  let baiVisit = null;
  function baiAvailable() {
    return !!(W.STBaiBaiBook || D.getElementById('bbs-menu-item')) &&
      ctx()?.extensionSettings?.baibai_book?.enabled !== false;
  }
  function memoryModal() {
    const scope=pairScope();
    if(!scope){toast('请先进入角色对话');return;}
    const m=memoryData().memory;
    const layer=modal('故事记忆', `${memoryGuide}
      <div class="lj-memory-tabs" data-memory-sources hidden>
        <button type="button" data-memory-source="manual" aria-pressed="true" class="active">手动记忆</button>
        <button type="button" data-memory-source="bai" aria-pressed="false">柏宝书</button>
      </div>
      <div data-manual-panel>
        <div class="lj-memory-tabs">${Object.entries(memoryFields).map(([k,label],i)=>`<button type="button" data-memory-field="${k}" aria-pressed="${!i}" class="${i?'':'active'}">${label}</button>`).join('')}</div>
        ${Object.entries(memoryFields).map(([k,label],i)=>`<textarea data-memory-text="${k}" aria-label="${label}内容" ${i?'hidden':''}>${escapeHtml(m[k])}</textarea>`).join('')}
        <label><input type="checkbox" id="lj-memory-enabled" ${m.enabled?'checked':''}> 把这三栏手动记忆发给写正文的模型</label>
        <div class="lj-row lj-wrap"><button type="button" class="lj-primary" data-memory-save>保存记忆</button>
        <button type="button" class="lj-soft" data-action="native-summary">酒馆自动总结设置</button></div>
        <details data-memory-install><summary>了解柏宝书</summary><p>柏宝书可以自动整理剧情。已经安装的话，请在柏宝书设置里打开「记忆引擎」。首次使用可在酒馆的扩展管理中选择「安装扩展」，粘贴<a href="https://github.com/baibai-git/ST-BaiBai-Book" target="_blank" rel="noopener noreferrer">柏宝书仓库地址</a>。启用扩展后，这里会出现「柏宝书」。</p></details>
      </div>
      <div data-bai-panel hidden><div class="lj-row lj-wrap"><button type="button" class="lj-soft" data-bai-open>打开柏宝书</button></div><div data-bai-list></div></div>`);
    const heading=layer.querySelector('.lj-modal-header strong');
    heading.insertAdjacentHTML('beforeend',' <button type="button" class="lj-memory-help" aria-label="两种记忆怎么用" aria-controls="lj-memory-guide" aria-expanded="false">?</button>');
    const state={scope,source:'manual',rows:[]};
    memoryViews.set(layer,state);
    function setButtons(selector, attr, value) {
      for(const b of layer.querySelectorAll(selector)){
        const active=b.dataset[attr]===value;
        b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
      }
    }
    function refresh() {
      if(!layer.isConnected)return;
      if(scope!==pairScope()){layer.remove();return;}
      const available=baiAvailable();
      if(!available)state.source='manual';
      layer.querySelector('[data-memory-sources]').hidden=!available;
      layer.querySelector('[data-memory-install]').hidden=available;
      layer.querySelector('[data-manual-panel]').hidden=state.source!=='manual';
      layer.querySelector('[data-bai-panel]').hidden=state.source!=='bai';
      setButtons('[data-memory-source]','memorySource',state.source);
      if(state.source==='bai')renderBaiRows(layer,state);
    }
    layer.addEventListener('lj-resume',refresh);
    layer.addEventListener('click',async event=>{
      const b=event.target.closest('button');
      if(!b || b.hasAttribute('data-action'))return;
      if(scope!==pairScope()){layer.remove();return;}
      if(b.matches('.lj-memory-help')){
        const guide=layer.querySelector('#lj-memory-guide');
        guide.hidden=!guide.hidden;b.setAttribute('aria-expanded',String(!guide.hidden));
        if(!guide.hidden)guide.scrollIntoView({block:'nearest'});
      }else if(b.dataset.memorySource){
        state.source=b.dataset.memorySource;refresh();
      }else if(b.dataset.memoryField){
        setButtons('[data-memory-field]','memoryField',b.dataset.memoryField);
        for(const field of layer.querySelectorAll('[data-memory-text]'))field.hidden=field.dataset.memoryText!==b.dataset.memoryField;
      }else if(b.hasAttribute('data-memory-save')){
        b.disabled=true;
        try{
          const data=memoryData().memory, fields=[...layer.querySelectorAll('[data-memory-text]')];
          // A summary written elsewhere while this window was open belongs to the current archive too.
          const changed=fields.filter(input=>input.value!==input.defaultValue);
          const saved=changed.map(input=>input.value);
          changed.forEach((input,i)=>{data[input.dataset.memoryText]=saved[i];});
          const checkbox=layer.querySelector('#lj-memory-enabled'), enabled=checkbox.checked;
          data.enabled=enabled;saveMemorySnapshot();syncMemoryPrompt();await ctx().saveChat();
          changed.forEach((input,i)=>{input.defaultValue=saved[i];});checkbox.defaultChecked=enabled;
          if(scope===pairScope())toast('当前存档记忆已保存');
        }catch(error){toast('保存记忆失败，请重试');}finally{b.disabled=false;}
      }else if(b.hasAttribute('data-bai-open') || b.dataset.baiId){
        const row=state.rows.find(n=>n.id===b.dataset.baiId);
        if(b.dataset.baiId&&!row){refresh();return;}
        try{await openBaiMemory(layer,state,row,b);}
        catch(error){toast(error.message);}
      }
    });
    refresh();
    return layer;
  }
  function baiMemoryRows(api, chatId){
    const history=api.getHistory();
    if(!chatId || history.chat?.id!==chatId)throw Error('存档正在切换，请稍后再查看。');
    const rows=new Map(history.nodes.map(node=>[node.id,node]));
    // getHistory returns the topmost valid summaries. Their underlying floors can be edited as well.
    const covered=new Set();
    for(const parent of history.nodes){
      if(parent.kind!=='comp' || !Number.isInteger(parent.floorStart) || !Number.isInteger(parent.floorEnd))continue;
      for(let floor=Math.max(0,parent.floorStart);floor<=Math.min(history.chat.length-1,parent.floorEnd);floor++){
        if(covered.has(floor))continue;
        covered.add(floor);
        const {memory}=api.getFloor(floor);
        if(memory?.valid && memory.id && !rows.has(memory.id))rows.set(memory.id,{
          id:memory.id,kind:'leaf',level:0,text:memory.summary,floorStart:floor,floorEnd:floor
        });
      }
    }
    return [...rows.values()].sort((a,b)=>(b.floorEnd??-1)-(a.floorEnd??-1)||b.level-a.level);
  }
  function baiFloorLabel(row){
    if(!Number.isInteger(row.floorStart))return '—';
    return row.floorStart===row.floorEnd?'#'+row.floorStart:'#'+row.floorStart+' - #'+row.floorEnd;
  }
  function renderBaiRows(layer,state){
    const api=W.STBaiBaiBook, list=layer.querySelector('[data-bai-list]');
    const focusId=D.activeElement?.dataset?.baiId;
    state.rows=[];
    if(api?.apiVersion!==1 || typeof api.getHistory!=='function' || typeof api.getFloor!=='function'){
      list.textContent='可点「打开柏宝书」查看和编辑当前存档的记忆。';return;
    }
    try{state.rows=baiMemoryRows(api,ctx().getCurrentChatId?.()??ctx().chatId);}
    catch(error){list.textContent='暂时无法读取当前存档。可点「打开柏宝书」查看。';return;}
    const direct=baiDirectEdit(api);
    list.innerHTML=state.rows.map(row=>`<article class="lj-bai-entry"><header><strong>${row.kind==='comp'?'阶段总结':'逐条摘要'} · ${escapeHtml(baiFloorLabel(row))}</strong>
      ${direct?`<button type="button" class="lj-soft" data-bai-id="${escapeHtml(row.id)}">编辑</button>`:''}</header><p>${escapeHtml(row.text)}</p></article>`).join('') ||
      '<p class="lj-muted">这份聊天还没有生成摘要。</p>';
    if(state.rows.length && !direct)list.insertAdjacentHTML('afterbegin','<p>编辑这些记忆请点「打开柏宝书」。</p>');
    if(focusId)[...list.querySelectorAll('[data-bai-id]')].find(b=>b.dataset.baiId===focusId)?.focus({preventScroll:true});
  }
  function baiDirectEdit(api){
    // The data API is read-only. This version's own editor handles indexing and saving.
    return api?.pluginVersion==='1.3.5' && !!D.getElementById('bbs-app-host')?.shadowRoot && !!D.getElementById('bbs-menu-item');
  }
  function nativeBaiEditButton(shadow,row){
    const matches=[...shadow.querySelectorAll('.bbs-summary-card')].filter(card=>{
      const badge=card.querySelector('.bbs-summary-badge')?.textContent.trim();
      return (row.kind==='leaf'?!badge:badge==='总结L'+row.level||badge==='导入历史') &&
        card.querySelector('.bbs-summary-loc')?.textContent.trim()===baiFloorLabel(row) &&
        card.querySelector('.bbs-summary-text')?.textContent.trim()===row.text?.trim();
    });
    if(matches.length===1)return matches[0].querySelector('button[title^="编辑"]');
  }
  async function openBaiMemory(layer,state,row,trigger){
    if(baiVisit)return;
    const entry=D.getElementById('bbs-menu-item'),shadow=D.getElementById('bbs-app-host')?.shadowRoot;
    if(!entry){throw Error('柏宝书入口尚未就绪，请稍后再打开。');}
    if(!shadow){entry.click();return;}
    const visit={scope:state.scope}, win=()=>shadow.querySelector('.bbs-window');
    const stop=(close=false)=>{
      if(baiVisit!==visit)return;
      baiVisit=null;visit.observer?.disconnect();
      if(close)win()?.querySelector('.bbs-head button[title="关闭"]')?.click();
      D.body.classList.remove('lj-reading-bai');
      layer.inert=false;
      if(!disposed && layer.isConnected && state.scope===pairScope()){
        layer.dispatchEvent(new W.Event('lj-resume'));
        const button=row?[...layer.querySelectorAll('[data-bai-id]')].find(el=>el.dataset.baiId===row.id):trigger;
        button?.focus({preventScroll:true});
      }
    };
    visit.stop=stop;baiVisit=visit;
    D.body.classList.add('lj-reading-bai');layer.inert=true;
    const waitFor=async read=>{
      for(let i=0;i<75 && baiVisit===visit && state.scope===pairScope();i++){
        const found=read();if(found)return found;
        await new Promise(r=>W.setTimeout(r,35));
      }
    };
    try{
      if(!win())entry.click();
      if(!await waitFor(win)){stop();return;}
      visit.observer=new W.MutationObserver(()=>{
        if(!win() || state.scope!==pairScope()){stop(state.scope!==pairScope());return;}
        if(visit.editingRow){
          const editor=shadow.querySelector('.bbs-modal[aria-label="编辑摘要"], .bbs-modal[aria-label="编辑总结"]');
          if(editor)visit.editor=editor;
          else if(visit.editor)stop(true);
        }
      });
      visit.observer.observe(shadow,{childList:true,subtree:true});
      const nav=win().querySelector('.bbs-nav-item[title="摘要"]');
      if(!nav)return; // An unfamiliar layout remains usable in its own window.
      if(nav.getAttribute('aria-current')!=='page')nav.click();
      if(row){
        const button=await waitFor(()=>nativeBaiEditButton(shadow,row));
        if(!button){if(baiVisit===visit)toast('请在柏宝书的摘要列表里选择要编辑的那一条。');return;}
        const current=baiMemoryRows(W.STBaiBaiBook,ctx().getCurrentChatId?.()??ctx().chatId).find(n=>n.id===row.id);
        if(!current || nativeBaiEditButton(shadow,current)!==button){stop(true);toast('这条记忆刚有变化，请重新选择。');return;}
        visit.editingRow=true;
        button.click();
      }
    }catch(error){stop(true);throw error;}
  }
  function mountStoryMemory(context){
    const update=()=>{
      const layer=visibleDialog();
      if(baiVisit && baiVisit.scope!==pairScope())baiVisit.stop(true);
      if(layer && memoryViews.has(layer))layer.dispatchEvent(new W.Event('lj-resume'));
    };
    for(const name of ['st-baibai-book:ready','st-baibai-book:changed'])on(W,name,update);
    const type=context.eventTypes.CHAT_CHANGED;
    if(type){context.eventSource.on(type,update);listeners.push(()=>context.eventSource.removeListener(type,update));}
    listeners.push(()=>baiVisit?.stop(true));
  }

  function syncMemoryPrompt() {
    const m=ctx()?.chatMetadata?.[KEY]?.memory;
    const value=m?.enabled?[m.permanent&&'永久记忆\n'+m.permanent,m.long&&'长期记忆\n'+m.long,m.short&&'短期记忆\n'+m.short].filter(Boolean).join('\n\n'):'';
    if(value!==activeMemoryPrompt){ctx().setExtensionPrompt(KEY,value,1,1,false,0);activeMemoryPrompt=value;}
  }
  function notesModal() {const c=selected();if(!c)return;modal('角色私有备注',`<textarea id="lj-notes-content" aria-label="角色备注">${escapeHtml(preferences().notes[c.avatar] || '')}</textarea><p class="lj-muted lj-small">备注只用于你自己查看，不发送给模型。</p><button class="lj-primary" data-action="save-notes">保存备注</button>`);}
  async function applyPreset(name,openSettings=false) {const manager=ctx().getPresetManager?.();const value=manager?.findPreset(name);if(value===undefined||value===null){toast('没有找到此预设');return;}if(manager.getSelectedPresetName()!==name)await manager.selectPreset(value);if(openSettings)openNative('generation');else{render();toast('已应用 '+name);}}
  function installedThemeIds(){return THEME_IDS.filter(id=>extensionNames.includes(id));}
  async function activate() {
    const p=preferences(),disabled=ctx().extensionSettings.disabledExtensions || [];
    const installed=installedThemeIds();
    const previousThemes=p.originalThemes;
    p.originalThemes=Object.fromEntries(installed.map(id=>[id,!disabled.includes(id)]));
    const activeThemes=installed.filter(id=>!disabled.includes(id));
    const previousEnabled=p.enabled;
    p.enabled=true;
    if(activeThemes.length)ctx().extensionSettings.disabledExtensions=[...new Set([...disabled,...activeThemes])];
    try {
      await persist(true);
    } catch (error) {
      p.enabled=previousEnabled;
      p.originalThemes=previousThemes;
      if(activeThemes.length)ctx().extensionSettings.disabledExtensions=ctx().extensionSettings.disabledExtensions.filter(id=>!activeThemes.includes(id));
      throw error;
    }
    if(activeThemes.length)W.location.reload();
    else mount();
  }
  async function restoreTheme() {
    const settings=ctx().extensionSettings, p=preferences();
    const previousThemes=p.originalThemes, previousDisabled=settings.disabledExtensions;
    releaseThemeSettings();
    try{await persist(true);}catch(error){
      p.enabled=true;p.originalThemes=previousThemes;settings.disabledExtensions=previousDisabled;throw error;
    }
    W.location.reload();
  }
  async function handleClick(event) {
    const el=event.target.closest('[data-action]');if(!el)return;
    event.stopPropagation();
    const action=el.dataset.action;
    try {
      if(action==='tool-return')await returnToToolChat();
      else if(action==='clean-parameter-presets')await cleanParameterPresets();
      else if(action==='pair-picker')await openPairPicker();
      else if(action.startsWith('book-'))await bookAction(action.slice(5),el);
      else if(action==='home-cover-upload')chooseLibraryFile('image/*',file=>uploadHomeBanner(file,el.closest('.lj-modal-backdrop')));
      else if(action==='primary-route')openPrimaryPage(el.dataset.page);
      else if(action==='route')navigate(el.dataset.page);
      else if(action==='manage-char')await openNative('characters',el.dataset.id);
      else if(action==='open-char')await openCharacter(el.dataset.id);
      else if(action==='open-session')await openCharacter(el.dataset.id,el.dataset.file);
      else if(action==='pin' && route==='recent'){const c=ctx().characters[el.dataset.id],list=preferences().pinned,index=list.indexOf(c.avatar);if(index<0)list.push(c.avatar);else list.splice(index,1);await persist(true);render();}
      else if(action==='toggle-sessions')await toggleSessions(el.dataset.id);
      else if(action==='native')await openNative(el.dataset.panel);
      else if(action==='close-native'){closeNative();render();}
      else if(action==='create-char'){$('#rm_button_create')?.click();await openNative('characters');}
      else if(action==='import-char')$('#character_import_file')?.click();
      else if(action==='edit-char')await openNative('characters');
      else if(action==='edit-world')await openWorld(el.dataset.name);
      else if(action==='world-binding')await worldBindingModal();
      else if(action==='import-role-world')await importRoleBook(el.dataset.avatar);
      else if(action==='apply-preset')await applyPreset(el.dataset.name);
      else if(action==='preset-settings')await applyPreset(el.dataset.name,true);
      else if(action==='details')D.body.classList.toggle(W.matchMedia('(min-width:1100px)').matches?'lj-profile-collapsed':'lj-details-open');
      else if(action==='close-details')D.body.classList.remove('lj-details-open');
      else if(action==='page-sound'){
        pageSound.setMuted(!pageSound.muted);
        updateSoundButton(el);
        try { W.sessionStorage.setItem('jianshe.pageMuted', String(pageSound.muted)); } catch {}
      }
      else if(action==='background'){backgroundScope=ctx().chatMetadata?.[KEY]?.background?'chat':'character';backgroundModal();}
      else if(action==='close-modal'){if(visibleDialog()&&!dialogParents.get(visibleDialog())&&route==='chat'&&currentToolOrigin())await returnToToolChat();else closeDialog();}
      else if(action==='default-bg'){setBackground({url:null});backgroundModal();}
      else if(action==='upload-bg')await uploadBackground();
      else if(action==='bg-mode'){const modes={default:{dim:.42,blur:3},immersive:{dim:.22,blur:0},focus:{dim:.74,blur:10}};setBackground({mode:el.dataset.mode,...modes[el.dataset.mode]});backgroundModal();}
      else if(action==='toolbox')toolbox();
      else if(action==='tool'){const tool=el.dataset.tool;if(tool.startsWith('native:'))openNative(tool.split(':')[1]);else if(tool==='memory')memoryModal();else if(tool==='tree')await showMessageTree();else if(tool==='message-tools')chooseMessageTools();else if(tool==='world-library')navigate('worlds');else if(tool==='regex'||tool==='quickreply')await openExtensionGroup(tool==='regex'?'#regex_presets_block':'#qr--editor');else if(tool==='greetings')await showStories();}
      else if(action==='native-summary')await openExtensionGroup('#memory_prompt_interval_auto');
      else if(action.startsWith('profile-'))await handleProfileAction(action,el);
      else if(action==='archive-menu')archiveMenu(el.dataset.id,el.dataset.file,el);
      else if(action==='manage-archives')await profileArchives(el.dataset.id);
      else if(action==='archive-pick')chooseMessageTools(el.dataset.key);
      else if(action==='greetings')await showStories();
      else if(action==='new-chat'){portal.querySelector('.lj-modal-backdrop')?.remove();$('#option_start_new_chat')?.click();}
      else if(action==='notes')notesModal();
      else if(action==='save-notes'){preferences().notes[selected().avatar]=$('#lj-notes-content').value;await persist(true);toast('角色备注已保存');}
      else if(action==='locate-message'){portal.querySelector('.lj-modal-backdrop')?.remove();D.querySelector(`#chat .mes[mesid="${Number(el.dataset.index)}"]`)?.scrollIntoView({block:'center',behavior:'smooth'});}
      else if(action==='refresh-stats'){sessionData.clear();preferences().stats={};scheduleCounts();toast('正在从存档重新统计');render();}
      else if(action==='backup')openNative('account');
      else if(action==='restore-theme')await restoreTheme();
      else if(action==='page-back')await backPage();
      else if(action==='workspace-tab'){workspaceTab=el.dataset.tab;workspaceSearch='';render();}
      else if(action==='source-action'){const source=fieldSources.get(el.dataset.source);
        if(!source?.isConnected||source.disabled)throw Error('此项已更改，请重新打开。');
        if(el.closest('[data-chat-commands]')){
          const pane={option_toggle_AN:'floatingPrompt',option_toggle_CFG:'cfgConfig',option_toggle_logprobs:'logprobsViewer'}[source.id];
          const panel=pane && D.getElementById(pane);
          if(panel){
            panel.classList.add('lj-chat-command-panel');
            let back=panel.querySelector('.lj-command-back');
            if(!back){
              back=D.createElement('button');back.type='button';back.className='lj-command-back';
              panel.prepend(back);
            }
            back.textContent='返回'+dialogName(visibleDialog());
            back.onclick=()=>{source.click();panel.classList.remove('lj-chat-command-panel');el.focus({preventScroll:true});};
          }else visibleDialog()?.remove();
        }
        if((event.shiftKey||event.altKey||event.ctrlKey||event.metaKey)&&source.type!=='file'){
          source.dispatchEvent(new W.MouseEvent('click',{bubbles:true,cancelable:true,shiftKey:event.shiftKey,altKey:event.altKey,ctrlKey:event.ctrlKey,metaKey:event.metaKey}));
        }else source.click();
        W.setTimeout(refreshWorkspaceFields,250);}
      else if(action==='save-character'){$('#create_button')?.click();toast('角色资料已提交保存');}
      else if(action==='create-group'){$('#rm_button_group_chats')?.click();workspaceTab='群聊与管理';render();}
      else if(action==='character-actions')await openOriginalView('characters',el);
      else if(action==='extension-install')extensionInstallModal();
      else if(action==='extension-install-submit'){const url=$('#lj-extension-url').value.trim();if(!url)throw Error('请填写仓库地址');await post('/api/extensions/install',{url,global:false});extensionCatalog=null;portal.querySelector('.lj-modal-backdrop')?.remove();toast('扩展已安装，请刷新页面');refreshWorkspaceFields();}
      else if(action==='extension-update')await checkExtensionVersion(el);
      else if(action==='original-options')await openOriginalView(el.dataset.panel,el);
      else if(action==='preset-save-current'){await ctx().getPresetManager().savePreset(currentPreset(),JSON.parse(JSON.stringify(ctx().chatCompletionSettings||ctx().textCompletionSettings)));toast('当前参数与提示词已保存到预设');}
      else if(action==='preset-export'){const manager=ctx().getPresetManager(),list=manager.getPresetList(),names=list.preset_names,index=Array.isArray(names)?names.indexOf(el.dataset.name):names[el.dataset.name];downloadData(el.dataset.name+'.json',list.presets[index]);}
      else if(action==='preset-import'){const input=D.createElement('input');input.type='file';input.accept='.json';input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file)return;try{const preset=JSON.parse(await file.text()),name=file.name.replace(/\.json$/i,'');if(ctx().getPresetManager().findPreset(name)!==undefined)throw Error('已有同名预设，请修改文件名后导入');await ctx().getPresetManager().savePreset(name,preset);render();toast('预设已导入');}catch(error){toast(error.message);}});input.click();}
      else if(action==='prompt-add')editPrompt('');
      else if(action==='story-edit')editStory(Number(el.dataset.index));
      else if(action==='story-add')editStory(storyResources().length);
      else if(action==='story-save')await saveStory();
      else if(action==='story-start')await startStory(Number(el.dataset.index));
      else if(action==='compose-menu')composeMenu();
      else if(action==='current-message-tree')await showMessageTree();
      else if(action==='chat-continue'){portal.querySelector('.lj-modal-backdrop')?.remove();await branchContinue(ctx().chat.length-1);}
      else if(action==='chat-regenerate'){portal.querySelector('.lj-modal-backdrop')?.remove();const i=ctx().chat.length-1;if(i<1||ctx().chat[i]?.is_user||ctx().chat[i]?.is_system)toast('请从要重说的角色回复下方点圆箭头');else await requestReplyBranch(i);}
      else if(action==='chat-native-options')chatOptions();
      else if(action==='chat-files'){portal.querySelector('.lj-modal-backdrop')?.remove();const file=$('#file_form_input');if(file)file.click();else toast('请先开启附件功能');}
      else if(action==='backup-download')await backupDownload();
      else if(action==='theme-source-backup')await backupThemeSources();
      else if(action==='world-new')newWorldModal();
      else if(action==='world-save')await saveWorldDraft();
      else if(action==='world-export')downloadData(worldName+'.json',worldDraft);
      else if(action==='world-entry'){worldUid=el.dataset.id;render();}
      else if(action==='world-tab'){worldTab=el.dataset.tab;render();}
      else if(action==='world-add-entry'){const uid=Math.max(-1,...Object.keys(worldDraft.entries).map(Number))+1;worldDraft.entries[uid]={uid,...JSON.parse(JSON.stringify(worldDefaults))};worldUid=String(uid);worldDirty=true;render();}
      else if(action==='world-copy-entry'){const uid=Math.max(-1,...Object.keys(worldDraft.entries).map(Number))+1;worldDraft.entries[uid]={...JSON.parse(JSON.stringify(worldDraft.entries[worldUid])),uid};worldUid=String(uid);worldDirty=true;render();}
      else if(action==='world-remove-entry'){const entry=worldDraft.entries[worldUid];modal('删除条目',`<p>确认从当前编辑稿删除 ${escapeHtml(entry.comment||'未命名条目')}？保存世界书后生效。</p><button class="lj-primary" data-action="world-remove-confirm">删除当前条目</button>`);}
      else if(action==='world-remove-confirm'){delete worldDraft.entries[worldUid];worldUid=Object.keys(worldDraft.entries)[0]||'';worldDirty=true;portal.querySelector('.lj-modal-backdrop')?.remove();render();}
      else if(action==='world-bind-save')await saveWorldBinding();
      else if(action==='binding-character'){if(await selectForPage(el.dataset.id,false))worldBindingModal();}
      else if(action==='world-create'){const name=$('#lj-world-new-name').value.trim();if(!name)throw Error('请填写世界书名称');if(worldBookNames().includes(name))throw Error('已有同名世界书');await ctx().saveWorldInfo(name,{entries:{}},true);await ctx().updateWorldInfoList();portal.querySelector('.lj-modal-backdrop')?.remove();await openWorld(name);}
      else if(action==='world-import')importWorldFile(el.closest('.lj-modal-backdrop'));
      else if(action==='prompt-edit')editPrompt(el.dataset.id);
      else if(action==='prompt-move')await savePromptChanges(s=>{const order=activePromptOrder(s),i=order.findIndex(p=>p.identifier===el.dataset.id),j=i+Number(el.dataset.direction);if(i>=0&&j>=0&&j<order.length)[order[i],order[j]]=[order[j],order[i]];});
      else if(action==='prompt-save'){const draft={identifier:el.dataset.id,name:$('#lj-prompt-name').value,role:$('#lj-prompt-role').value,content:$('#lj-prompt-content').value,injection_position:Number($('#lj-prompt-position').value),injection_depth:Number($('#lj-prompt-depth').value),injection_order:Number($('#lj-prompt-order').value),system_prompt:$('#lj-prompt-system').checked};await savePromptChanges(s=>{const original=s.prompts.find(p=>p.identifier===draft.identifier);if(original)Object.assign(original,draft);else{s.prompts.push(draft);activePromptOrder(s).push({identifier:draft.identifier,enabled:true});}});portal.querySelector('.lj-modal-backdrop')?.remove();}
    }catch(error){console.error('[建设主题]',error);toast('操作未完成：'+error.message);}
  }
  function updateVh(){D.documentElement.style.setProperty('--lj-height',`${Math.round(W.visualViewport?.height || W.innerHeight)}px`);}
  // The scenic theme owns its dialog inside an open shadow root. Its settings
  // row must also work when the optional trip to the forest is hidden.
  function installThemeSwitch() {
    const button = D.createElement('button');
    const label = '启用建设主题';
    button.type = 'button';
    button.textContent = label;

    let cabin;
    const shadowChanges = new W.MutationObserver(place);
    const hostChanges = new W.MutationObserver(place);
    function place() {
      const shadow = D.getElementById('xingjian-cabin-host')?.shadowRoot;
      if (shadow !== cabin) {
        shadowChanges.disconnect();
        cabin = shadow;
        if (cabin) shadowChanges.observe(cabin, { childList: true, subtree: true });
      }
      const row = cabin?.getElementById('cabin-theme-option');
      if (row) {
        if (row.nextElementSibling === button) return;
        button.className = 'holo-key';
        row.after(button);
      } else {
        const settings = D.getElementById('UI-presets-block');
        if (settings && settings !== button.parentElement) {
          button.className = 'menu_button menu_button_icon';
          settings.append(button);
        }
      }
    }
    on(button, 'click', async () => {
      if (button.disabled) return;
      button.disabled = true;
      button.textContent = '正在切换…';
      try {
        await activate();
      } catch (error) {
        button.disabled = false;
        button.textContent = label;
        W.toastr?.error('切换未完成，请再试一次。');
        console.error('[建设主题] 切换失败', error);
      }
    });
    hostChanges.observe(D.body, { childList: true });
    place();
    return () => {
      hostChanges.disconnect();
      shadowChanges.disconnect();
      button.remove();
    };
  }
  function mount() {
    removeThemeSwitch?.();
    removeThemeSwitch = undefined;
    if(root){root.hidden=false;D.body.classList.add('lj-active');render();return;}
    let muted = false;
    try { muted = W.sessionStorage.getItem('jianshe.pageMuted') === 'true'; } catch {}
    pageSound = installPageSound(W, muted);
    listeners.push(() => pageSound.dispose());
    style=D.createElement('link');style.id='lj-interface-style';style.rel='stylesheet';style.href=new URL('./theme.css?v='+VERSION,import.meta.url).href;D.head.append(style);
    root=D.createElement('div');root.id='lj-root';D.body.append(root);D.body.classList.add('lj-active');
    portal=D.createElement('div');portal.id='lj-portal';D.body.append(portal);
    on(root,'click',handleClick);on(portal,'click',handleClick);
    on(D,'click',event=>{if(archivePopup&&!archivePopup.el.contains(event.target)&&!archivePopup.anchor.contains(event.target))dismissArchiveMenu();},true);
    on(D,'click',e=>{
      if(!originalView && toolOrigin && route==='chat' && !e.target.closest('#lj-portal,dialog,.TH-popup,.lj-chat-command-panel') && !portal.querySelector('.lj-modal-backdrop'))toolOrigin=null;
    },true);
    const handleInput=event=>{
      if(event.target.dataset.source){if(!event.target.matches('select,input[type="checkbox"],input[type="radio"],input[type="file"]'))changeSource(event.target,false);return;}
      if(event.target.dataset.worldProperty){updateWorldProperty(event.target);return;}
      if(event.target.id==='lj-world-search'){worldSearch=event.target.value;const position=event.target.selectionStart;render();$('#lj-world-search')?.focus();return;}
      if(event.target.id==='lj-settings-search'){workspaceSearch=event.target.value;refreshWorkspaceFields();return;}
      if(event.target.id==='lj-search'){search=event.target.value;const position=event.target.selectionStart;const main=root.querySelector('.lj-main');const scroll=main?.scrollTop||0;render();const field=$('#lj-search');field?.focus();if(field?.type!=='search')field?.setSelectionRange(position,position);if(root.querySelector('.lj-main'))root.querySelector('.lj-main').scrollTop=scroll;}
      else if(event.target.id==='lj-bg-dim'){setBackground({dim:Number(event.target.value)/100,mode:'custom'});$('#lj-dim-value').textContent=event.target.value+'%';}
      else if(event.target.id==='lj-bg-blur'){setBackground({blur:Number(event.target.value),mode:'custom'});$('#lj-blur-value').textContent=event.target.value+'px';}
    };
    on(root,'input',handleInput);on(portal,'input',handleInput);
    const handleChange=async event=>{try{if(event.target.hasAttribute('data-global-book'))toggleGlobalBook(event.target);else if(event.target.id==='lj-background-scope'){backgroundScope=event.target.value;backgroundModal();}else if(event.target.dataset.source)changeSource(event.target,true);else if(event.target.dataset.promptToggle)await savePromptChanges(s=>{const p=activePromptOrder(s).find(p=>p.identifier===event.target.dataset.promptToggle);if(p)p.enabled=event.target.checked;});else if(event.target.dataset.extensionToggle){const id=event.target.dataset.extensionToggle;if(id===themeExtensionId && !event.target.checked)releaseThemeSettings();const disabled=new Set(ctx().extensionSettings.disabledExtensions||[]);if(event.target.checked)disabled.delete(id);else disabled.add(id);ctx().extensionSettings.disabledExtensions=[...disabled];await persist(true);toast('启用状态已保存，刷新页面后生效');}}catch(error){toast(error.message);}};
    on(root,'change',handleChange);on(portal,'change',handleChange);
    on(root,'keydown',event=>{if(event.key==='Enter'&&event.target.matches('[role="button"][data-action]'))event.target.click();});
    on(D,'keydown',event=>{
      if(baiVisit || event.composedPath().some(node=>node?.id==='bbs-app-host'))return;
      if(originalView){
        if(event.key==='Escape'&&!event.defaultPrevented&&!D.querySelector('dialog[open], .TH-popup[role="dialog"], .select2-container--open')){
          event.preventDefault();void returnFromOriginalView();
        }
        return;
      }
      if(event.key!=='Escape'||event.defaultPrevented||!D.body.classList.contains('lj-active')||D.querySelector('dialog[open], .TH-popup[role="dialog"]'))return;
      if(archivePopup){dismissArchiveMenu();return;}
      if(pairDialog){pairDialog.close();return;}
      const layer=visibleDialog();
      if(layer){const close=layer.querySelector('[data-action="close-modal"]');if(close)close.click();else closeDialog(layer);return;}
      if(D.body.classList.contains('lj-details-open')){D.body.classList.remove('lj-details-open');return;}
      if(route==='preset-editor' && book?.history){void bookAction('back',null);return;}
      void backPage();
    });
    on(W,'resize',updateVh);if(W.visualViewport)on(W.visualViewport,'resize',updateVh);updateVh();
    const context=ctx();
    const refresh=()=>{W.clearTimeout(refreshTimer);refreshTimer=W.setTimeout(()=>{sessionData.clear();syncMemoryPrompt();if(route==='chat'&&!selected()&&!returningPage)openPrimaryPage('home');else render();scheduleCounts();},350);};
    for(const name of ['APP_READY','CHARACTER_PAGE_LOADED','CHAT_CHANGED','CHARACTER_EDITED','CHARACTER_DELETED','CHARACTER_DUPLICATED','CHARACTER_RENAMED','MESSAGE_SENT','GENERATION_ENDED','MESSAGE_RECEIVED','MESSAGE_DELETED','MESSAGE_SWIPED','PRESET_CHANGED','OAI_PRESET_CHANGED_AFTER']){
      const type=context.eventTypes[name];if(type){context.eventSource.on(type,refresh);listeners.push(()=>context.eventSource.removeListener(type,refresh));}
    }
    for(const name of ['CHAT_CHANGED','MESSAGE_SWIPED','MESSAGE_DELETED']){const type=context.eventTypes[name];if(type){context.eventSource.on(type,restoreMemorySnapshot);listeners.push(()=>context.eventSource.removeListener(type,restoreMemorySnapshot));}}
    const worldSettingsEvent=context.eventTypes.WORLDINFO_SETTINGS_UPDATED;
    if(worldSettingsEvent){
      const syncBooks=()=>{if(route==='workspace' && workspaceKey==='worlds' && workspaceTab==='所有角色共用的书')refreshWorkspaceFields();};
      context.eventSource.on(worldSettingsEvent,syncBooks);
      listeners.push(()=>context.eventSource.removeListener(worldSettingsEvent,syncBooks));
    }
    mountArchiveResume(context);mountChatReading(context);mountPairing(context);mountCardWidgets();mountStoryMemory(context);mountBooks();mountBanner();
    render();scheduleCounts();syncMemoryPrompt();
    observeDialogs();observeMessages();loadControlLabels();loadRoleWorlds();
  }
  function cleanup(){disposed=true;dismissOriginalView();W.clearTimeout(refreshTimer);W.clearTimeout(toastTimer);listeners.splice(0).forEach(f=>{try{f();}catch(_){}});observers.forEach(o=>o.disconnect());all('.lj-message-actions').forEach(e=>e.remove());all('.lj-adapted-popup,.lj-command-back').forEach(e=>e.remove());all('.lj-chat-command-panel').forEach(e=>e.classList.remove('lj-chat-command-panel'));all('.lj-adapted-dialog').forEach(e=>e.classList.remove('lj-adapted-dialog','lj-vue-dialog'));root?.remove();portal?.remove();style?.remove();removeThemeSwitch?.();toolbar?.remove();D.body.classList.remove('lj-active','lj-chat','lj-reading-tool','lj-native-open','lj-details-open','lj-profile-collapsed');D.documentElement.style.removeProperty('--lj-height');D.getElementById('lj-story-style')?.remove();if(activeMemoryPrompt)ctx()?.setExtensionPrompt(KEY,'',1,1,false,0);delete W.__LANJIU_LUMEOW_UI__;}
  async function start() {
    if(!ctx()?.extensionSettings){W.setTimeout(start,600);return;}
    if(W.__LANJIU_LUMEOW_UI__)return;
    W.__LANJIU_LUMEOW_UI__={version:VERSION,cleanup};
    if(preferences().enabled)mount();
    else removeThemeSwitch = installThemeSwitch();
    frame.addEventListener('pagehide',cleanup,{once:true});
  }
  eventSource.once(event_types.APP_READY,()=>start().catch(error=>{
    console.error('[建设主题] 启动失败',error);cleanup();
  }));
})(typeof window === 'undefined' ? null : window);

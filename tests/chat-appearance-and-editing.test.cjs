const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require(process.env.JIAN_SHE_JSDOM || 'jsdom');
const bundle=fs.readFileSync(path.join(__dirname,'..','index.js'),'utf8');
const between=(a,b)=>bundle.slice(bundle.indexOf(a),bundle.indexOf(b,bundle.indexOf(a)));
const parts=[
  between('  function capturePage()', '  async function selectForPage('),
  between('  function modal(', '  function backgroundModal('),
  between('  function bookDiff(', '  function bookVersion('),
  between('  function branchBacklogNotice(', '  function branchHasReply('),
  between('  function chatAppearance()', '  function bgSettings()'),
  between('  async function openPairPicker()', '    async function removePairConnection('),
  between('  async function openApiEditor(', '  function unusedChatKeys('),
  between('  function openBook(', '  function bookRedraw('),
  between('  async function bookSave()', '  function bookEntryCopy('),
  between('  function bookInput(', '  function bookChange('),
  between('  async function bookAction(', '  function mountBooks('),
].join('\n');
// openApiEditor ends before the next helper in this build; avoid taking unrelated UI.
const apiStart=parts.indexOf('  async function openApiEditor(');
const apiEnd=parts.indexOf('  function openBook(',apiStart);
assert.ok(apiStart>=0 && apiEnd>apiStart);

function fixture(skin='lumeow'){
  const dom=new JSDOM('<body class="lj-active lj-chat"><div id="chat"><div class="mes"><div class="mes_text"><style>.card{color:red}</style><details open><summary>状态栏</summary>原内容</details><iframe src="about:blank"></iframe><audio></audio><canvas></canvas></div></div></div><textarea id="send_textarea">未发送的草稿</textarea><div id="lj-root"></div><div id="lj-portal"></div></body>',{url:'http://localhost/'});
  const W=dom.window,D=W.document,root=D.getElementById('lj-root'),portal=D.getElementById('lj-portal');
  const prefs={chatAppearance:skin}, key='["role.png","旧存档"]';
  const profile={id:'one',name:'原连接',api:'custom',model:'gemini-test','api-url':'https://example.test/v1'};
  const list={preset_names:{'原预设':0},presets:[{prompts:[{identifier:'a',name:'规则',content:'原规则'}],prompt_order:[],lj_preset_info:{title:'原预设',description:''}}]};
  const calls={writes:0,modelRequests:0,persist:0,confirm:false};
  let scope=key;
  const c={characterId:0,chatId:'旧存档',characters:[{avatar:'role.png'}],extensionSettings:{connectionManager:{profiles:[profile]}},CONNECT_API_MAP:{custom:{}},getPresetManager:()=>manager};
  const manager={getPresetList:()=>list,getSelectedPresetName:()=>'其他预设',savePreset:async(name,value)=>{calls.writes++;list.presets[list.preset_names[name]]=value;}};
  W.matchMedia=()=>({matches:false});W.requestAnimationFrame=f=>f();W.confirm=()=>calls.confirm;
  const env={W,D,root,portal,ctx:()=>c,preferences:()=>prefs,persist:()=>{calls.persist++;},
    disposed:false,route:'chat',search:'',listOrder:null,profileAvatar:null,workspaceKey:'users',workspaceTab:'阅读显示',workspaceSearch:'',profileTab:'资料',toolOrigin:null,book:null,
    pageTrail:[],navigationRevision:0,dialogParents:new WeakMap(),pairDialog:null,pairQueue:Promise.resolve(),openingStory:false,chatWriteDepth:0,branchBusy:false,archiveBusy:false,returningPage:false,
    toolbar:null,worldDirty:false,worldDraft:null,worldName:'',worldUid:'',worldSearch:'',worldTab:'',
    icon:()=>'<svg></svg>',escapeHtml:v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
    $:s=>D.querySelector(s),visibleDialog:()=>portal.lastElementChild,dialogName:e=>e?.querySelector('[role="dialog"]')?.getAttribute('aria-label')||'',pageName:()=> '角色聊天',
    selected:()=>c.characters[0],pairScope:()=>scope,chatTransitionBusy:()=>false,
    scrollState:()=>({}),restoreScroll(){},readingPlace:e=>({scroll:e.scrollTop}),restoreReadingPlace:(e,p)=>{e.scrollTop=p.scroll;},resumeChatReading(){},bottomGap:()=>10,
    closeNative(){},syncCardWidgets(){},currentToolOrigin:()=>env.toolOrigin,beginChatTools:()=>{env.toolOrigin={chatKey:scope};},chatReturnButton:()=>'',
    on:(target,name,fn)=>target.addEventListener(name,fn),handleClick(){},
    savedPair:()=>({engine:'openai',preset:'原预设',connection:'profile:one'}),pairManager:()=> 'openai',pairFamily:()=> 'Gemini',currentPreset:()=> '原预设',
    presetSummary:()=>'<small>1 条提示词</small>',bookSource:name=>list.presets[list.preset_names[name]],bookCopy:v=>JSON.parse(JSON.stringify(v)),bookBase:p=>({...p}),bookInfo:p=>p?.lj_preset_info||{},bookTitle:(p,key)=>p?.lj_preset_info?.title||key,
    bookRows:p=>(p.prompts||[]).map(x=>({x,on:true})),bookSwitch(){},bookCover:()=>'',fillBookCounts(){},messageIcon:()=>'',
    pairCatalog:async()=>({active:{api:'custom'},current:'profile:one',rows:c.extensionSettings.connectionManager.profiles.map(p=>({ref:'profile:'+p.id,label:p.name,api:p.api,model:p.model,url:p['api-url']})),presets:Object.entries(list.preset_names).map(([name,i])=>({name,engine:'openai',key:JSON.stringify(['openai',name]),title:list.presets[i].lj_preset_info.title}))}),
    pairTarget:()=>({ref:'profile:one'}),confirmPair:async()=>{calls.writes++;},ensureToolbar(){},toast(){},
    pairWork:job=>job(),profileManager:()=>c.extensionSettings.connectionManager,
    post:async()=>({api_key_custom:[]}),providerNames:{custom:'兼容 OpenAI'},pairApi:p=>p,pairSecretKey:()=> 'api_key_custom',pairSecretLabel:x=>x,pairHasUrl:()=>true,supportsKeySelection:()=>true,
    editApiProfile:async(original,v)=>{const p=c.extensionSettings.connectionManager.profiles.find(p=>p.id===original.id);Object.assign(p,{name:v.name,model:v.model,'api-url':v.url});calls.writes++;return p;},
    sendConnectionTest:async()=>{calls.modelRequests++;},
    removePairConnection:async()=>{c.extensionSettings.connectionManager.profiles=[];calls.writes++;},activePairConnection:async()=>({}),
    loadChatFile:async()=>{throw Error('不应切换存档');},returnToToolChat:async()=>{},
  };
  const context=vm.createContext(env);
  vm.runInContext(parts,context);
  context.render=()=>{D.body.classList.toggle('lj-chat',context.route==='chat');context.applyChatAppearance();root.innerHTML=context.route==='preset-editor'?context.bookEditor():'';};
  context.navigate=page=>{context.enterPage(page);context.render();};
  root.addEventListener('input',e=>context.bookInput(e));
  root.addEventListener('click',e=>{const b=e.target.closest('[data-action^="book-"]');if(b)void context.bookAction(b.dataset.action.slice(5),b);});
  portal.addEventListener('click',e=>{const b=e.target.closest('[data-action="close-modal"]');if(b)context.closeDialog(b.closest('.lj-modal-backdrop'));});
  const flush=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setImmediate(resolve));};
  return {dom,W,D,context,prefs,c,calls,list,flush,setScope:v=>{scope=v;},async open(){await context.openPairPicker();await flush();},async click(sel){const b=D.querySelector(sel);assert.ok(b,sel);b.click();await flush();}};
}

test('the prompt tool forwards pointerup to the original message while other tools still click',()=>{
  const f=fixture();
  try {
    vm.runInContext(between('  function runNativeMessageTool(', '  function chooseMessageTools('),f.context);
    const row=f.D.querySelector('#chat .mes');
    row.setAttribute('mesid','2');
    row.insertAdjacentHTML('beforeend','<div class="mes_buttons"><div class="mes_prompt"></div><div class="mes_translate"></div></div>');
    f.context.messageRow=index=>index===2 ? row : null;
    const prompt=row.querySelector('.mes_prompt'), translate=row.querySelector('.mes_translate');
    const events=[];
    f.D.addEventListener('pointerup',event=>{
      if(event.target.matches('.mes_prompt'))events.push(['prompt',event.target.closest('.mes')?.getAttribute('mesid')]);
    });
    prompt.addEventListener('click',()=>events.push(['unexpected prompt click']));
    translate.addEventListener('click',()=>events.push(['translate']));
    f.context.runNativeMessageTool(2,{source:prompt,key:'mes_prompt'});
    f.context.runNativeMessageTool(2,{source:translate,key:'mes_translate'});
    f.context.runNativeMessageTool(3,{source:prompt,key:'mes_prompt'});
    assert.deepEqual(events,[['prompt','2'],['translate']]);
  } finally {
    f.dom.window.close();
  }
});

test('changing appearance preserves all transcript nodes, embedded runtimes, draft and reading position',()=>{
  const f=fixture(),chat=f.D.getElementById('chat');chat.scrollTop=160;
  const nodes=[...chat.querySelectorAll('*')],frame=chat.querySelector('iframe'),audio=chat.querySelector('audio');
  audio.dataset.progress='12';
  for(const skin of ['mufy','lumeow','mufy'])f.context.setChatAppearance(skin);
  assert.deepEqual([...chat.querySelectorAll('*')],nodes);
  assert.equal(chat.querySelector('iframe'),frame);assert.equal(chat.querySelector('audio').dataset.progress,'12');
  assert.equal(chat.scrollTop,160);assert.equal(f.D.getElementById('send_textarea').value,'未发送的草稿');
  assert.equal(f.calls.writes,0);assert.equal(f.calls.modelRequests,0);
  f.context.route='workspace';f.D.body.classList.remove('lj-chat');f.context.applyChatAppearance();
  assert.equal(f.D.body.classList.contains('lj-chat-mufy'),false);
  f.dom.window.close();
});

for(const skin of ['lumeow','mufy']){
  test(skin+': preset X restores the same chooser with searches, selection, scroll and chat draft',async()=>{
    const f=fixture(skin);await f.open();
    const chooser=f.context.pairDialog.layer,query=f.D.getElementById('lj-pair-preset-search');query.hidden=false;query.value='原';
    query.dispatchEvent(new f.W.Event('input',{bubbles:true}));
    const list=chooser.querySelector('[data-list="presets"]');list.scrollLeft=33;list.scrollTop=70;
    await f.click('[data-pair-edit="preset"]');
    assert.equal(f.context.route,'preset-editor');assert.equal(chooser.isConnected,false);
    assert.equal(f.D.querySelectorAll('[data-action="book-picker-close"]').length,1);
    await f.click('[data-action="book-picker-close"]');
    assert.equal(f.context.route,'chat');assert.equal(f.context.pairDialog.layer,chooser);assert.ok(chooser.isConnected);
    assert.equal(query.value,'原');assert.equal(query.hidden,false);assert.equal(list.scrollLeft,33);assert.equal(list.scrollTop,70);
    assert.equal(chooser.querySelector('[data-choice="preset"][aria-pressed="true"]').dataset.id,'["openai","原预设"]');
    assert.equal(f.calls.writes,0);assert.equal(f.c.chatId,'旧存档');
    f.context.pairDialog.close();assert.equal(f.D.getElementById('send_textarea').value,'未发送的草稿');f.dom.window.close();
  });
  test(skin+': preset saves through existing editor and refreshes labels without choosing another pair',async()=>{
    const f=fixture(skin);await f.open();await f.click('[data-pair-edit="preset"]');
    const title=f.D.querySelector('[data-book-field="title"]');title.value='修改后的名称';title.dispatchEvent(new f.W.Event('input',{bubbles:true}));
    await f.click('[data-action="book-save"]');
    assert.equal(f.context.route,'chat');assert.equal(f.list.presets[0].lj_preset_info.title,'修改后的名称');
    assert.match(f.context.pairDialog.layer.querySelector('[data-list="presets"]').textContent,/修改后的名称/);
    assert.ok(f.context.pairDialog.layer.querySelector('[data-choice="preset"][aria-pressed="true"]'));
    assert.equal(f.calls.writes,1);assert.equal(f.calls.modelRequests,0);f.dom.window.close();
  });
  test(skin+': API edit uses existing form; save returns to chooser and refreshes unchanged connection ID',async()=>{
    const f=fixture(skin);await f.open();const chooser=f.context.pairDialog.layer;
    await f.click('[data-pair-edit="model"]');
    const editor=f.D.querySelector('[aria-label="编辑 API"]');assert.ok(editor);assert.equal(chooser.isConnected,false);
    assert.equal(editor.querySelectorAll('.lj-modal-header button').length,1);
    const form=editor.querySelector('form');form.elements.label.value='修改后的连接';form.elements.model.value='new-model';
    form.dispatchEvent(new f.W.Event('submit',{bubbles:true,cancelable:true}));await f.flush();
    assert.ok(chooser.isConnected);assert.match(chooser.textContent,/修改后的连接/);assert.match(chooser.textContent,/new-model/);
    assert.equal(chooser.querySelector('[data-choice="model"][aria-pressed="true"]').dataset.id,'profile:one');
    assert.equal(f.calls.writes,1);assert.equal(f.calls.modelRequests,0);f.dom.window.close();
  });
}

test('closing an edited preset prompts only for actual unsaved edits and can stay in the editor',async()=>{
  const f=fixture();await f.open();await f.click('[data-pair-edit="preset"]');
  const title=f.D.querySelector('[data-book-field="title"]');title.value='未保存';title.dispatchEvent(new f.W.Event('input',{bubbles:true}));
  await f.click('[data-action="book-picker-close"]');assert.equal(f.context.route,'preset-editor');
  f.calls.confirm=true;await f.click('[data-action="book-picker-close"]');
  assert.equal(f.context.route,'chat');assert.equal(f.list.presets[0].lj_preset_info.title,'原预设');f.dom.window.close();
});

test('API deletion invalidates old choice instead of silently selecting another connection',async()=>{
  const f=fixture();await f.open();await f.click('[data-pair-edit="model"]');
  await f.click('[data-delete]');await f.click('[data-confirm]');
  const chooser=f.context.pairDialog.layer;assert.ok(chooser.isConnected);
  assert.equal(chooser.querySelector('[data-pair="confirm"]').disabled,true);
  assert.equal(chooser.querySelector('[data-choice="model"][aria-pressed="true"]'),null);f.dom.window.close();
});

test('changing archive while editor is open closes stale chooser instead of applying to new archive',async()=>{
  const f=fixture();await f.open();await f.click('[data-pair-edit="model"]');f.setScope('different-chat');
  await f.click('[data-action="close-modal"]');assert.equal(f.context.pairDialog,null);assert.equal(f.calls.writes,0);f.dom.window.close();
});

test('a configured role banner appears, closes without changing the transcript, and reappears on next chat visit',()=>{
  const f=fixture('mufy'),chat=f.D.getElementById('chat'),contents=chat.innerHTML,frame=chat.querySelector('iframe');
  f.c.characters[0].data={extensions:{jianshe_theme:{chat_banner:'我的横幅'}}};
  f.context.ensureCharacterBanner();const banner=f.D.getElementById('lj-character-banner-bar');
  assert.equal(banner.hidden,false);assert.equal(banner.shadowRoot.querySelector('.banner-text').textContent,'我的横幅');
  f.context.closeCharacterBanner();assert.equal(banner.hidden,true);
  f.context.setChatAppearance('mufy');f.context.ensureCharacterBanner();assert.equal(banner.hidden,true);
  f.context.route='home';f.context.ensureCharacterBanner();f.context.route='chat';f.context.ensureCharacterBanner();
  assert.equal(banner.hidden,false);assert.equal(chat.innerHTML,contents);assert.equal(chat.querySelector('iframe'),frame);
  assert.equal(f.calls.writes,0);f.dom.window.close();
});

test('role banner is isolated per card and treats HTML as plain display text',()=>{
  const f=fixture('mufy');f.c.characters[0].data={extensions:{jianshe_theme:{chat_banner:'<script>test</script>'}}};
  f.c.characters.push({avatar:'other.png',data:{extensions:{jianshe_theme:{chat_banner:'另一位角色'}}}});
  f.context.selected=()=>f.c.characters[f.c.characterId];
  f.context.ensureCharacterBanner();const banner=f.D.getElementById('lj-character-banner-bar');
  assert.equal(banner.shadowRoot.querySelector('script'),null);assert.match(banner.shadowRoot.querySelector('.banner-text').textContent,/<script>test<\/script>/);
  f.context.closeCharacterBanner();f.c.characterId=1;f.setScope('other-role-chat');f.context.ensureCharacterBanner();
  assert.equal(banner.hidden,false);assert.match(banner.shadowRoot.textContent,/另一位角色/);f.dom.window.close();
});

test('saving banner writes only its extension metadata and verifies persistence without touching role prompts or chats',async()=>{
  const f=fixture(),requests=[];
  f.c.characters[0].data={description:'人设原文',first_mes:'开场原文',extensions:{regex_scripts:[{name:'原正则'}],jianshe_theme:{other:'保留'}}};
  f.context.post=async(url,body,mode)=>{requests.push({url,body,mode});return url.endsWith('/get')?{data:{extensions:{jianshe_theme:{chat_banner:'独立横幅'}}}}:'OK';};
  vm.runInContext("characterBannerDrafts.set('role.png','独立横幅');",f.context);
  await f.context.saveCharacterBanner();
  assert.deepEqual(Object.keys(requests[0].body.data),['extensions']);
  assert.deepEqual(Object.keys(requests[0].body.data.extensions),['jianshe_theme']);
  assert.equal(requests[0].mode,'text');assert.equal(requests[1].url,'/api/characters/get');
  assert.equal(f.c.characters[0].data.description,'人设原文');assert.equal(f.c.characters[0].data.first_mes,'开场原文');
  assert.equal(f.c.characters[0].data.extensions.regex_scripts[0].name,'原正则');
  assert.equal(f.c.characters[0].data.extensions.jianshe_theme.other,'保留');
  assert.equal(f.calls.writes,0);assert.equal(f.calls.modelRequests,0);f.dom.window.close();
});

test('failed banner verification keeps the draft and does not claim a successful save',async()=>{
  const f=fixture();vm.runInContext("characterBannerDrafts.set('role.png','未保存');",f.context);
  f.context.post=async()=>({data:{extensions:{jianshe_theme:{chat_banner:'旧值'}}}});
  await assert.rejects(f.context.saveCharacterBanner(),/没有确认/);
  assert.match(f.context.characterBannerField(f.c.characters[0]),/未保存/);f.dom.window.close();
});

test('card-specific banner CSS lives inside its shadow root and never replaces or styles transcript nodes',()=>{
  const f=fixture('mufy'),chat=f.D.getElementById('chat'),cardStyle=chat.querySelector('style'),frame=chat.querySelector('iframe');
  f.c.characters[0].data={extensions:{jianshe_theme:{chat_banner:'自定义横幅',chat_banner_style:{color:'#112233',background:'#445566',border:'#778899',radius:24,css:'.banner { border-style:dashed; } body { background:red; }'}}}};
  f.context.ensureCharacterBanner();const banner=f.D.getElementById('lj-character-banner-bar');
  assert.match(banner.shadowRoot.querySelector('style').textContent,/border-style:dashed/);
  assert.equal(banner.style.getPropertyValue('--banner-color'),'#112233');assert.equal(banner.style.getPropertyValue('--banner-radius'),'24px');
  assert.deepEqual([...f.D.querySelectorAll('style')],[cardStyle]);assert.equal(chat.querySelector('iframe'),frame);
  f.context.setChatAppearance('mufy');assert.equal(banner.shadowRoot.querySelector('.banner-text').textContent,'自定义横幅');f.dom.window.close();
});

test('banner visual settings save with the card and preserve independent extension fields',async()=>{
  const f=fixture();let written;
  f.context.post=async(url,body)=>{if(url.endsWith('merge-attributes')){written=body;return 'OK';}return {data:{extensions:written.data.extensions}};};
  vm.runInContext("characterBannerStyleDrafts.set('role.png',{color:'#123456',background:'#654321',border:'#abcdef',radius:18,css:'.banner-text { font-weight:bold; }'});",f.context);
  await f.context.saveCharacterBanner();
  assert.equal(written.data.extensions.jianshe_theme.chat_banner_style.radius,18);
  assert.match(written.data.extensions.jianshe_theme.chat_banner_style.css,/font-weight/);
  assert.equal(f.c.characters[0].data.extensions.jianshe_theme.chat_banner_style.color,'#123456');f.dom.window.close();
});

test('opening banner overrides follow native greeting selection without changing the role-wide banner',()=>{
 const f=fixture();f.context.KEY='lanjiu_lumeow_ui';const role=f.c.characters[0];role.data={extensions:{jianshe_theme:{chat_banner:'默认横幅',chat_banner_openings:{0:{text:'We are S! 안녕하세요, VRS입니다!',style:{radius:8}},1:{text:'We are S! 안녕하세요, VRS입니다!',style:{radius:8}}}}}};
 f.c.chatMetadata={lanjiu_lumeow_ui:{storyIndex:0}};
 for(const i of [0,1,3]){f.c.chat=[{is_user:false,swipe_id:i}];assert.equal(f.context.activeCharacterBanner(role).text,i<2?'We are S! 안녕하세요, VRS입니다!':'默认横幅');}
 assert.equal(f.context.characterBannerText(role),'默认横幅');f.c.chat=[{is_user:false}];f.c.chatMetadata.lanjiu_lumeow_ui.storyIndex=1;assert.equal(f.context.activeCharacterBanner(role).style.radius,8);
 f.c.characterId=1;f.c.characters.push({avatar:'other.png'});assert.equal(f.context.activeCharacterBanner(role).text,'默认横幅');f.dom.window.close();
});


test('Lumeow has no banner and switching skins preserves a closed Mufy banner',()=>{
 const f=fixture('lumeow');f.context.ensureCharacterBanner();assert.equal(f.D.getElementById('lj-character-banner-bar'),null);
 f.c.characters[0].data={extensions:{jianshe_theme:{chat_banner:'我的横幅'}}};
 f.context.setChatAppearance('mufy');const banner=f.D.getElementById('lj-character-banner-bar');assert.equal(banner.hidden,false);
 f.context.closeCharacterBanner();f.context.setChatAppearance('lumeow');assert.equal(banner.hidden,true);f.context.setChatAppearance('mufy');assert.equal(banner.hidden,true);f.dom.window.close();
});

test('unconfigured cards use the Mufy book title and display a banner only after text is set', () => {
  const f = fixture('mufy');
  const role = f.c.characters[0];
  f.c.chat = [{mes: '开场'}, {mes: '问题', is_user: true}, {mes: '回复'}];
  const row = f.D.querySelector('#chat>.mes');
  row.setAttribute('mesid', '2');
  const block = f.D.createElement('div');
  block.className = 'mes_block';
  row.append(block);
  f.context.applyChatAppearance();
  const title = block.querySelector('.lj-script-peek');
  assert.equal(title.textContent, '偷看剧本中');
  assert.equal(title.querySelector('.lj-wait-book').hidden, false);
  assert.equal(f.D.getElementById('lj-character-banner-bar'), null);
  role.data = {extensions: {jianshe_theme: {chat_banner: '我的横幅'}}};
  f.context.applyChatAppearance();
  const banner = f.D.getElementById('lj-character-banner-bar');
  assert.equal(banner.hidden, false);
  role.data.extensions.jianshe_theme.chat_banner = '   ';
  f.context.applyChatAppearance();
  assert.equal(banner.hidden, true);
  assert.equal(block.querySelector('.lj-script-peek'), title);
  f.dom.window.close();
});


test('VRS Mufy decoration variables and wait chrome are removed on returning to Lumeow',()=>{
 const f=fixture('mufy');f.context.KEY='lanjiu_lumeow_ui';const r=f.c.characters[0];r.data={extensions:{jianshe_theme:{chat_banner_openings:{0:{text:'Mufy横幅',reply_heading:'Versatile'}}}}};f.c.chat=[{is_user:false,swipe_id:0}];const chat=f.D.getElementById('chat'),frame=chat.querySelector('iframe');f.context.ensureCharacterBanner();assert.equal(chat.dataset.ljOpeningDecor,'versatile');const n=f.D.createElement('div');n.className='lj-generation-wait';chat.append(n);f.context.setChatAppearance('lumeow');assert.equal(chat.dataset.ljOpeningDecor,undefined);assert.equal(chat.style.getPropertyValue('--lj-reply-heading'),'');assert.equal(chat.querySelector('.lj-generation-wait'),null);assert.equal(chat.querySelector('iframe'),frame);assert.equal(f.D.getElementById('lj-character-banner-bar').hidden,true);f.dom.window.close();
});

test('Kwon opening 3 and 4 keep their own banner and waiting palette separate from group openings',()=>{
 const f=fixture('mufy');f.context.KEY='lanjiu_lumeow_ui';const role=f.c.characters[0],group={text:'We are S!',reply_heading:'Versatile'},solo={text:'你的讨厌对我毫无影响 但你的嫉妒让我好爽',reply_heading:'别说把命都给我了 你命又不好',reply_heading_style:{color:'#CBCDD1',shadow:'#DED8D3',hover:'#B3A598'}};role.data={extensions:{jianshe_theme:{chat_banner_openings:{0:group,1:group,2:solo,3:solo}}}};
 for(const i of [0,1,2,3,4]){f.c.chat=[{is_user:false,swipe_id:i}];const a=f.context.activeCharacterBanner(role);assert.equal(a.replyHeading,i<2?'Versatile':i<4?solo.reply_heading:'');if(i===2||i===3){assert.equal(a.text,solo.text);assert.equal(a.replyStyle.color,'#CBCDD1');assert.equal(a.replyStyle.shadow,'#DED8D3');}}
 assert.equal(f.context.generationWaitColors({color:'red;display:none'}).color,'#F5F5F5');f.context.setChatAppearance('lumeow');assert.equal(f.D.getElementById('lj-character-banner-bar')?.hidden??true,true);f.dom.window.close();
});


test('historical Mufy thinking entry stays above the reply and opens only existing native reasoning',()=>{
 const f=fixture('mufy');f.context.KEY='lanjiu_lumeow_ui';const role=f.c.characters[0];role.data={extensions:{jianshe_theme:{chat_banner_openings:{3:{reply_heading:'别说把命都给我了 你命又不好'}}}}};
 f.c.chat=[{is_user:false,swipe_id:3,mes:'开场'},{is_user:true,mes:'问题'},{is_user:false,mes:'旧回复',extra:{reasoning:'保存过的思考'}}];const before=JSON.stringify(f.c.chat),row=f.D.querySelector('#chat>.mes');row.setAttribute('mesid','2');const block=f.D.createElement('div');block.className='mes_block';while(row.firstChild)block.append(row.firstChild);row.append(block);const frame=block.querySelector('iframe'),body=block.querySelector('.mes_text');const native=f.D.createElement('details');native.className='mes_reasoning_details';native.innerHTML='<summary>原生思考</summary><div class="mes_reasoning">保存过的思考</div>';block.prepend(native);
 f.context.syncThinkingLabels();const entry=block.querySelector('.lj-script-peek');assert.equal(block.firstElementChild,entry);assert.equal(entry.textContent,'别说把命都给我了 你命又不好');assert.equal(entry.disabled,false);entry.click();assert.equal(native.open,true);f.context.syncThinkingLabels();assert.equal(block.querySelector('.lj-script-peek'),entry);assert.equal(JSON.stringify(f.c.chat),before);assert.equal(block.querySelector('iframe'),frame);assert.equal(block.querySelector('.mes_text'),body);
 f.context.setChatAppearance('lumeow');assert.equal(block.querySelector('.lj-script-peek'),null);assert.equal(native.open,true);f.context.setChatAppearance('mufy');assert(block.querySelector('.lj-script-peek'));delete f.c.chat[2].extra.reasoning;native.querySelector('.mes_reasoning').textContent='';f.context.syncThinkingLabels();assert.equal(block.querySelector('.lj-script-peek').disabled,true);assert.match(block.querySelector('.lj-script-peek').title,/没有保存/);f.dom.window.close();
});

test('a card title covers chats without greeting swipes and opening overrides remove its frame', () => {
  const f = fixture('mufy');
  f.context.KEY = 'lanjiu_lumeow_ui';
  const role = f.c.characters[0];
  role.data = {extensions: {jianshe_theme: {
    chat_banner: '原来横幅',
    reply_heading: '神在注视你',
    reply_heading_style: {color: '#FFFFFF', background: '#000000', border: '#8B0000'},
    chat_banner_openings: {1: {reply_heading: '另一个开场标题', reply_heading_style: {color: '#F0ECDD'}}},
  }}};
  f.c.chat = [{mes: '开场'}, {is_user: true, mes: '提问'}, {mes: '旧回复'}];
  const reply = f.D.querySelector('#chat > .mes');
  reply.setAttribute('mesid', '2');
  const body = reply.querySelector('.mes_text');
  const block = f.D.createElement('div');
  block.className = 'mes_block';
  block.append(body);
  reply.append(block);

  f.context.applyChatAppearance();
  const title = block.querySelector('.lj-script-peek');
  assert.equal(title.textContent, '神在注视你');
  assert.equal(title.nextElementSibling, body);
  assert.equal(title.classList.contains('lj-wait-framed'), true);
  assert.equal(title.style.getPropertyValue('--lj-wait-border'), '#8B0000');
  assert.equal(f.D.querySelector('#lj-character-banner-bar').shadowRoot.querySelector('.banner-text').textContent, '原来横幅');

  f.c.chat[0].swipe_id = 1;
  f.context.applyChatAppearance();
  assert.equal(block.querySelector('.lj-script-peek'), title);
  assert.equal(title.textContent, '另一个开场标题');
  assert.equal(title.classList.contains('lj-wait-framed'), false);
  assert.equal(title.style.getPropertyValue('--lj-wait-border'), '');
  f.context.setChatAppearance('lumeow');
  assert.equal(block.querySelector('.lj-script-peek'), null);
  assert.equal(block.querySelector('.mes_text'), body);
  f.dom.window.close();
});

test('BBS summarized dialogue keeps its opening banner and historical titles without decorating system notices', () => {
  const f = fixture('mufy');
  f.context.KEY = 'lanjiu_lumeow_ui';
  f.c.characters[0].data = {extensions: {jianshe_theme: {chat_banner_openings: {
    0: {text: '错误的旧索引', reply_heading: '错误的旧标题'},
    1: {text: '正确的开场横幅', reply_heading: '正确的题签'},
  }}}};
  f.c.chatMetadata = {lanjiu_lumeow_ui: {storyIndex: 0}};
  f.c.chat = [
    {mes: '开场', swipe_id: 1, is_system: true, extra: {bbs_hidden: true}},
    {mes: '旧用户消息', is_user: true, is_system: true, extra: {bbs_hidden: true}},
    {mes: '旧角色回复', is_system: true, extra: {bbs_hidden: true}},
    {mes: '原生系统消息', is_system: true},
    {mes: '阻止生成通知', extra: {bbs_internal_notice: true}},
    {mes: '【柏宝书】本次生成已拦截', name: '柏宝书'},
    {mes: '新的角色回复'},
  ];
  const before = JSON.stringify(f.c.chat);
  const chat = f.D.getElementById('chat');
  chat.replaceChildren(...f.c.chat.map((message, index) => {
    const row = f.D.createElement('div');
    row.className = 'mes';
    row.setAttribute('mesid', String(index));
    const block = f.D.createElement('div');
    block.className = 'mes_block';
    block.textContent = message.mes;
    row.append(block);
    return row;
  }));
  f.context.applyChatAppearance();
  const banner = f.D.getElementById('lj-character-banner-bar').shadowRoot;
  assert.equal(banner.querySelector('.banner-text').textContent, '正确的开场横幅');
  const titles = [...chat.querySelectorAll('.lj-script-peek')];
  assert.deepEqual(titles.map(title => title.closest('.mes').getAttribute('mesid')), ['2', '6']);
  assert.ok(titles.every(title => title.textContent === '正确的题签'));
  assert.equal(JSON.stringify(f.c.chat), before);
  f.dom.window.close();
});

test('local opening appearances render and are merged into stale card saves and editor forms', () => {
  const f = fixture('mufy');
  const role = f.c.characters[0];
  role.data = {description: '角色设定', extensions: {regex_scripts: [{name: '原正则'}], jianshe_theme: {
    chat_banner: '角色默认横幅', chat_banner_openings: {0: {text: '未托管开场'}},
  }}};
  role.json_data = JSON.stringify({data: role.data});
  const form = f.D.createElement('div');
  form.innerHTML = '<input id="avatar_url_pole" value="role.png"><input id="character_json_data">';
  f.D.body.append(form);
  const field = f.D.getElementById('character_json_data');
  const formCard = JSON.parse(role.json_data);
  formCard.data.description = '未提交的角色设定';
  field.value = JSON.stringify(formCard);
  const entry = {text: '原卡横幅', reply_heading: '原卡标题'};
  f.context.localAppearanceFixture = {'role.png': {chat_banner_openings: {6: entry}}};
  vm.runInContext('localCharacterAppearances = new Map(Object.entries(localAppearanceFixture))', f.context);
  f.c.chat = [{mes: '开场', swipe_id: 6}];
  const paint = f.context.activeCharacterBanner(role);
  assert.equal(paint.text, entry.text);
  assert.equal(paint.replyHeading, entry.reply_heading);
  f.context.preserveLocalCharacterAppearance(role);
  for (const saved of [role, JSON.parse(role.json_data), JSON.parse(field.value)]) {
    assert.deepEqual(saved.data.extensions.jianshe_theme.chat_banner_openings[6], entry);
    assert.equal(saved.data.extensions.jianshe_theme.chat_banner_openings[0].text, '未托管开场');
    assert.equal(saved.data.extensions.regex_scripts[0].name, '原正则');
  }
  assert.equal(JSON.parse(field.value).data.description, '未提交的角色设定');
  f.dom.window.close();
});

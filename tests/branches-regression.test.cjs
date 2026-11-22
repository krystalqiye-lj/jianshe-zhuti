const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto').webcrypto;

const key = 'lanjiu_lumeow_ui';
const user = mes => ({name:'玩家',is_user:true,mes});
const bot = mes => ({name:'角色',is_user:false,mes});
const copy = value => JSON.parse(JSON.stringify(value));
const bundle = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
const between=(a,b)=>bundle.slice(bundle.indexOf(a),bundle.indexOf(b,bundle.indexOf(a)));
const source = between('  function chatTransitionBusy()', '  const listeners =') + between('  function hasUserMessage(', '  function archiveTime(') + between("  const branchTag =", '  function layoutMessageTree(');

function fixture(messages, {group = false} = {}) {
  let state = {chat:copy(messages), chatMetadata:{[key]:{}}};
  let disk = copy(state);
  let generation = 0;
  let failGenerate = false;
  let failSave = false;
  let interceptedNotice;
  let rows = messages.map(m => ({text:m.mes}));
  let runtimes = rows.slice();
  const events = [];
  const requests = [];
  const draft = {value:'/draft-only', dispatchEvent() {}};
  const env = {
    W:{crypto, navigator:{}, Event, setTimeout}, KEY:key, activeMemoryPrompt:'',
    chatLoadDepth:0,chatWriteDepth:0,chatSaveQueue:Promise.resolve(),openingCharacter:false,returningPage:false,openingStory:false,archiveBusy:false,chatHost:async()=>({isChatSaving:false}),
    ctx:() => ({
      ...state, name1:'测试玩家', name2:'角色', characterId:group ? undefined : '0', groupId:group ? 'g' : undefined, groups:group ? [{id:'g', members:['a.png','b.png']}] : [],
      chatId:'同名存档', characters:[{avatar:'a.png',name:'甲'},{avatar:'b.png',name:'乙'}], onlineStatus:'online',
      saveChat:async () => { if (!failSave) disk = copy(state); },
      reloadCurrentChat:async () => { state = copy(disk); },
      clearChat:async () => { rows = []; },
      printMessages:async () => { rows = state.chat.map(m => ({text:m.mes})); },
      eventTypes:{CHAT_CHANGED:'chat_id_changed',CHAT_LOADED:'chatLoaded'},
      eventSource:{emit:async (event, payload) => {
        events.push({event,payload});
        if (event === 'chatLoaded') runtimes = rows.slice();
      }},
      generate:async (type, options) => {
        requests.push({type,options});
        if (failGenerate) throw new Error('模拟模型中断');
        if (interceptedNotice) { state.chat.push(copy(interceptedNotice)); return; }
        if (type !== 'regenerate') assert.equal(draft.value, '');
        if (type === 'continue') state.chat.at(-1).mes += '……续写';
        else {
          if (type === 'regenerate') assert.ok(state.chat.at(-1).is_user);
          state.chat.push(bot('新回答' + (++generation)));
        }
      },
    }),
    $:s => s === '#send_textarea' ? draft : null, syncMemoryPrompt() {},
    post:async () => [{chat_metadata:copy(disk.chatMetadata)}, ...copy(disk.chat)],
  };
  const api = vm.runInNewContext(source + '\n;({branchUser,branchGraph,branchVariants,branchSwitch,branchRetry,branchEdit,branchContinue,branchDelete,branchDeleteTargets})',env);
  return {
    ...api, draft, requests, get state(){return state;}, get disk(){return disk;},
    reload(){state = copy(disk);}, failGeneration(value){failGenerate=value;}, failSaving(value){failSave=value;},
    interceptGeneration(notice){interceptedNotice=notice;},
    get rows(){return rows;}, get runtimes(){return runtimes;}, events,
    names(){return state.chat.map(m => m.mes);},
  };
}

test('full branch redraw follows native loaded lifecycle so HTML runtimes do not point at removed rows', async () => {
  const a = fixture([bot('```html\n<!DOCTYPE html><body>美化</body>\n```'),user('问'),bot('答')]);
  const originalRuntime = a.runtimes[0];
  const old = a.branchGraph().activeAt.get(2).id;
  await a.branchRetry(2);
  assert.notEqual(a.runtimes[0],originalRuntime);
  assert.deepEqual(a.runtimes,a.rows);
  assert.deepEqual(a.events.map(e=>e.event),['chat_id_changed','chatLoaded']);
  assert.equal(a.events[1].payload.detail.character.avatar,'a.png');
  await a.branchSwitch(old);
  await a.branchEdit(2,'编辑后的回答');
  await a.branchDelete(2);
  assert.deepEqual(a.runtimes,a.rows);
  assert.equal(a.events.filter(e=>e.event==='chatLoaded').length,4);
});

for (const notice of [
  {...bot('摘要尚未完成'),extra:{bbs_internal_notice:'backlog',bbs_omit:true}},
  {name:'柏宝书',is_user:false,mes:'【柏宝书】本次生成已拦截\n请先补齐摘要'},
]) test('blocked retry restores the entire original path and keeps the extension notice without counting it as a reply: '+notice.mes, async () => {
  const a=fixture([bot('开场'),user('问'),bot('旧回复'),user('后续'),bot('旧结尾')]);
  a.state.chatMetadata[key].memory={short:'原记忆'};
  a.state.chatMetadata.variables={scene:'原场景'};
  a.interceptGeneration(notice);
  await assert.rejects(a.branchRetry(2),/柏宝书拦截/);
  assert.deepEqual(a.names(),['开场','问','旧回复','后续','旧结尾']);
  assert.equal(a.state.chatMetadata[key].memory.short,'原记忆');
  assert.equal(a.state.chatMetadata.variables.scene,'原场景');
  assert.ok(a.state.chatMetadata[key].branches.parked.some(n=>n.message.mes===notice.mes));
  assert.deepEqual(a.disk.chat,copy(a.state.chat));
  assert.deepEqual(a.runtimes,a.rows);
});

test('blocked edited-user branch keeps its input and original branch available after reload', async () => {
  const a=fixture([bot('开场'),user('原问'),bot('原答')]);
  const original=a.branchGraph().activeAt.get(1).id;
  a.interceptGeneration({...bot('提示'),extra:{bbs_internal_notice:'backlog'}});
  await assert.rejects(a.branchUser(1,'新问'),/柏宝书拦截/);
  a.reload();
  assert.equal(a.names()[1],'新问');
  await a.branchSwitch(original);
  assert.deepEqual(a.names(),['开场','原问','原答']);
});

test('user branch preserves original descendants, memory, current leaf and edited text after reload', async () => {
  const a = fixture([bot('开场'),user('原句'),bot('原结果'),user('后续'),bot('原结尾')]);
  a.state.chatMetadata[key].memory = {short:'原分支的未来'};
  const original = a.branchGraph().activeAt.get(1).id;
  await a.branchUser(1,'另一个决定');
  assert.deepEqual(a.names(),['开场','另一个决定','新回答1']);
  assert.equal(a.state.chatMetadata[key].memory, undefined);
  const alternate = a.branchGraph().activeAt.get(1).id;
  a.state.chatMetadata[key].memory = {short:'新分支的记忆'};
  await a.branchSwitch(original);
  assert.deepEqual(a.names(),['开场','原句','原结果','后续','原结尾']);
  assert.equal(a.state.chatMetadata[key].memory.short,'原分支的未来');
  a.reload();
  await a.branchSwitch(alternate);
  assert.deepEqual(a.names(),['开场','另一个决定','新回答1']);
  assert.equal(a.state.chatMetadata[key].memory.short,'新分支的记忆');
  assert.equal(a.draft.value, '/draft-only');
});

test('historical AI retry preserves nested paths and native alternate greetings, supports in-place edit and scoped deletion',async () => {
  const a = fixture([{...bot('开场甲'),swipes:['开场甲','开场乙'],swipe_id:0},user('问'),bot('答'),user('之后'),bot('结局')]);
  const old = a.branchGraph().activeAt.get(2).id;
  await a.branchRetry(2);
  const alternate = a.branchGraph().activeAt.get(2).id;
  assert.equal(a.branchVariants(2).ids.length,2);
  await a.branchSwitch(old);
  await a.branchEdit(2, '修改后的答');
  assert.deepEqual(a.names(),['开场甲','问','修改后的答','之后','结局']);
  assert.equal(a.branchDeleteTargets(2).length,3);
  await a.branchDelete(2);
  assert.deepEqual(a.names(),['开场甲','问','新回答1']);
  assert.equal(a.branchGraph().activeLeafId,alternate);
  await a.branchContinue(2);
  assert.equal(a.names().at(-1),'新回答1……续写');
  assert.equal(a.draft.value, '/draft-only');
  const [aId,bId] = a.branchVariants(0).ids;
  await a.branchSwitch(bId);
  assert.deepEqual(a.names(),['开场乙']);
  await a.branchSwitch(aId);
  assert.deepEqual(a.names(),['开场甲','问','新回答1……续写']);
  assert.deepEqual(copy(a.state.chat[0].swipes),['开场甲','开场乙']);
});

test('legacy swipes open as siblings, preserve their media and retain descendants of active version alone',async () => {
  const a = fixture([bot('开场'),user('问'),{...bot('B'),extra:{media:['B']},swipes:['A','B'],swipe_id:1,swipe_info:[{extra:{media:['A']}},{extra:{media:['B']}}]},user('B 后续')]);
  const [idA,idB] = a.branchVariants(2).ids;
  await a.branchSwitch(idA);
  assert.deepEqual(a.names(),['开场','问','A']);
  assert.equal(a.state.chat[2].extra.media[0],'A');
  a.reload();
  await a.branchSwitch(idB);
  assert.deepEqual(a.names(),['开场','问','B','B 后续']);
  assert.equal(a.state.chat[2].extra.media[0],'B');
  await a.branchSwitch(idA);
  await a.branchDelete(2);
  assert.deepEqual(a.names(),['开场','问','B','B 后续']);
  assert.equal(a.branchVariants(2).ids.length,1);
});

test('failed AI retry restores original path; failed user send retains user input + older branches',async () => {
  const a = fixture([bot('开场'),user('问'),bot('旧回复')]);
  a.failGeneration(true);
  await assert.rejects(a.branchRetry(2),/模拟模型中断/);
  assert.deepEqual(a.names(),['开场','问','旧回复']);
  const original = a.branchGraph().activeAt.get(1).id;
  await assert.rejects(a.branchUser(1,'换一种问法'),/模拟模型中断/);
  a.reload();
  assert.deepEqual(a.names(),['开场','换一种问法']);
  await a.branchSwitch(original);
  assert.deepEqual(a.names(),['开场','问','旧回复']);
});

test('swallowed Tavern save errors leave chat intact and prevent generation',async () => {
  const a = fixture([bot('开场'),user('问'),bot('答')]);
  a.failSaving(true);
  await assert.rejects(a.branchRetry(2),/保存未确认|未能确认存档保存/);
  assert.deepEqual(a.names(),['开场','问','答']);
  assert.deepEqual(a.disk.chat.map(m=>m.mes),['开场','问','答']);
});

test('parallel clicks do not double-generate and stale tabs cannot overwrite a newer revision', async () => {
  const a = fixture([bot('开场'),user('问'),bot('答')]);
  const actions = await Promise.allSettled([a.branchRetry(2),a.branchRetry(2)]);
  assert.deepEqual(actions.map(x=>x.status),['fulfilled','rejected']);
  a.disk.chatMetadata[key].branches.revision='newer';
  await assert.rejects(a.branchUser(1,'有更新吗'),/另一页/);
  assert.deepEqual(a.names(),['开场','问','新回答1']);
});

test('an ordinary save in another tab without a branch revision is still detected', async () => {
  const a = fixture([bot('开场'),user('问'),bot('答')]);
  a.disk.chat[2].mes='另一个标签页编辑的答复';
  await assert.rejects(a.branchRetry(2),/另一页/);
  assert.equal(a.disk.chat[2].mes,'另一个标签页编辑的答复');
  assert.equal(a.requests.length,0);
});

test('Tavern render-time swipe defaults do not block edits of old chats',async () => {
  const a = fixture([bot('开场'),user('问'),{...bot('答'),extra:{display_text:'旧译文',token_count:8}}]);
  a.state.chat[2].swipes=['答'];
  a.state.chat[2].swipe_id=0;
  a.state.chat[2].swipe_info=[{extra:{display_text:'旧译文',token_count:8}}];
  await a.branchEdit(2,'重新写的答');
  assert.equal(a.state.chat[2].mes,'重新写的答');
  assert.equal(a.state.chat[2].extra.display_text,undefined);
  assert.equal(a.state.chat[2].swipe_info[0].extra.token_count,undefined);
});

test('group reply branches use the clicked speaker, keep the draft and store one active route', async () => {
  const a = fixture([bot('开场'),user('问'),{...bot('乙先说'),original_avatar:'b.png'},bot('甲再说')], {group:true});
  const old = a.branchGraph().activeAt.get(2).id;
  await a.branchRetry(2);
  assert.equal(a.requests[0].options.force_chid,1);
  assert.equal(a.requests[0].type,'normal');
  assert.equal(a.draft.value,'/draft-only');
  await a.branchSwitch(old);
  assert.deepEqual(a.names(),['开场','问','乙先说','甲再说']);
});

test('opening swipes preserve the raw persona substitution template after switching',async () => {
  const a = fixture([{...bot('你好测试玩家'),swipe_id:0,swipes:['你好{{user}}','第二个开场']},user('嗨')]);
  const [first,second] = a.branchVariants(0).ids;
  await a.branchSwitch(second);
  await a.branchSwitch(first);
  assert.deepEqual(copy(a.state.chat[0].swipes),['你好{{user}}','第二个开场']);
});

test('a user-authored first message can branch or be deleted without removing its sister route',async () => {
  const a = fixture([user('用户直接开始'),bot('答')]);
  const original = a.branchGraph().activeAt.get(0).id;
  await a.branchUser(0,'另起一句');
  await a.branchDelete(0);
  assert.equal(a.branchGraph().activeAt.get(0).id,original);
  assert.deepEqual(a.names(),['用户直接开始','答']);
});

test('legacy opener with rendered names is accepted on its first branch operation',async () => {
  const a = fixture([bot('你好{{user}}'),user('问'),bot('答')]);
  a.state.chat[0].mes='你好测试玩家';
  a.state.chat[0].swipes=['你好测试玩家'];
  await a.branchRetry(2);
  assert.deepEqual(a.names(),['你好测试玩家','问','新回答1']);
});

test('local script variables follow their branch without leaking a future state',async () => {
  const a = fixture([bot('开场'),user('问'),bot('答')]);
  a.state.chatMetadata.variables={secret:'旧结局'};
  const old = a.branchGraph().activeLeafId;
  await a.branchUser(1,'改口');
  assert.equal(a.state.chatMetadata.variables,undefined);
  a.state.chatMetadata.variables={secret:'新结局'};
  const other = a.branchGraph().activeLeafId;
  await a.branchSwitch(old);
  assert.equal(a.state.chatMetadata.variables.secret,'旧结局');
  await a.branchSwitch(other);
  assert.equal(a.state.chatMetadata.variables.secret,'新结局');
});

test('deleting a user turn removes both reply subtrees but keeps an alternate user turn after reloading',async()=>{
  const f=fixture([bot('开场'),user('原问题'),bot('原回复'),user('追问'),bot('结局')]);
  const root=f.branchGraph().activeAt.get(1).id;
  await f.branchRetry(2);
  await f.branchUser(1,'另一个问题');
  await f.branchSwitch(root);
  assert.equal(f.branchDeleteTargets(1).length,5);
  await f.branchDelete(1);
  f.reload();
  assert.deepEqual(f.names(),['开场','另一个问题','新回答2']);
  assert.equal(f.branchGraph().nodes.length,3);
});


test('opening arrows exclude archived greeting revisions while retaining the full history tree', async () => {
  const first={...bot('开场A新版'),swipes:['开场A新版','开场B','开场C'],swipe_id:0};
  const a=fixture([first]);
  const original=a.branchGraph(), formal=[...a.branchVariants(0,original).ids];
  const store=a.state.chatMetadata[key].branches;
  store.parked.push(
    {id:'old-opening-a',serial:-2,parentId:null,index:0,message:bot('开场A旧版')},
    {id:'old-opening-c',serial:-1,parentId:null,index:0,message:bot('开场C旧版')},
    {id:'old-history-user',serial:100,parentId:'old-opening-a',index:1,message:user('保留旧剧情')}
  );
  let graph=a.branchGraph();
  assert.equal(graph.nodes.filter(n=>n.parentId===null).length,5);
  assert.deepEqual([...a.branchVariants(0,graph).ids],formal);
  assert.equal(graph.children.get('old-opening-a')[0].message.mes,'保留旧剧情');
  await a.branchSwitch(formal[1]);
  assert.equal(a.state.chat[0].mes,'开场B');
  assert.equal(a.branchVariants(0).ids.length,3);
  assert(a.branchGraph().byId.has('old-opening-a'));
  assert(a.branchGraph().byId.has('old-history-user'));
  a.reload();assert.equal(a.branchVariants(0).ids.length,3);
  await a.branchSwitch(formal[2]);assert.equal(a.state.chat[0].mes,'开场C');
  await a.branchSwitch(formal[0]);assert.equal(a.state.chat[0].mes,'开场A新版');
  assert.equal(a.branchVariants(0).ids.length,3);
});

test('opening family keeps intentionally identical greeting slots and excludes system/user first rows', () => {
  const a=fixture([{...bot('同文'),swipes:['同文','同文','开场C'],swipe_id:1}]);
  assert.equal(a.branchVariants(0).ids.length,3);
  assert.equal(a.branchVariants(0).current,a.branchVariants(0).ids[1]);
  for(const first of [user('第一条玩家消息'),{...bot('系统消息'),is_system:true}]){
    const b=fixture([first]);b.branchGraph();b.state.chatMetadata[key].branches.parked.push({id:'extra',serial:30,parentId:null,index:0,message:{...first,mes:'另一个分支'}});
    assert.equal(b.branchVariants(0).ids.length,2);
  }
});

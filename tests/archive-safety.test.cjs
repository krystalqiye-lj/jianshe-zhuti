const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../index.js'), 'utf8');
const section = (from,to) => source.slice(source.indexOf(from), source.indexOf(to,source.indexOf(from)));
const runtime = [
  section('  function chatTransitionBusy()', '  const listeners ='),
  section('  function branchSession(', '  function branchAssertSession('),
  section('  async function branchRemote(', '  async function branchSave('),
  section('  function hasUserMessage(', '  function archiveTime('),
  section('  async function startStory(', '  function applyStoryStyle('),
].join('\n');
const key = 'lanjiu_lumeow_ui';
const clone = x => JSON.parse(JSON.stringify(x));
const greeting = () => ({name:'角色',is_user:false,is_system:false,mes:'开场一',swipes:['开场一','开场二'],swipe_id:0});
const conversation = () => [greeting(),{name:'用户',is_user:true,is_system:false,mes:'原问题'},{name:'角色',is_user:false,mes:'原回复'}];
function fixture({messages=conversation(),metadata={},diskMessages=messages,diskMetadata=metadata,newChat=true}={}) {
  const state = {file:'old',avatar:'a.png',messages:clone(messages),metadata:clone(metadata)};
  const files = new Map([['a.png/old',{messages:clone(diskMessages),metadata:clone(diskMetadata)}]]);
  const writes=[],toasts=[];let swipeCount=0,readHook=null,saveHook=null;
  const context = () => ({chatId:state.file,characterId:0,groupId:null,characters:[{name:'角色',avatar:state.avatar}],name1:'用户',name2:'角色',chat:state.messages,chatMetadata:state.metadata,
    saveChat:async()=>{
      if(saveHook)await saveHook();
      const target=state.avatar+'/'+state.file;
      files.set(target,{messages:clone(state.messages),metadata:clone(state.metadata)});writes.push(target);
    },
    saveMetadata:async()=>context().saveChat(),
    executeSlashCommandsWithOptions:async()=>{
      if(newChat){state.file='preview';state.messages=[greeting()];state.metadata={};files.set(state.avatar+'/'+state.file,{messages:clone(state.messages),metadata:{}});}
    },
    swipe:{to:async(_a,_b,{forceSwipeId})=>{swipeCount++;const m=state.messages[0];m.swipe_id=forceSwipeId;m.mes=m.swipes[forceSwipeId];}},
  });
  const env = {
    Promise,Error,JSON,Object,Array,Number,String,Boolean,Set,Map,
    W:{setTimeout},KEY:key,ctx:context,chatLoadDepth:0,chatWriteDepth:0,chatSaveQueue:Promise.resolve(),openingCharacter:false,returningPage:false,openingStory:false,branchBusy:false,archiveBusy:false,
    chatHost:async()=>({isChatSaving:false,is_send_press:false}),
    selected:()=>({name:'角色',avatar:state.avatar}),
    storyResources:()=>['开场一','开场二'],storyMeta:()=>({}),openingLabel:i=>'开场白'+(i+1),
    portal:{querySelector:()=>({remove(){}})},toast:t=>toasts.push(t),navigate(){},applyStoryStyle(){},bgSettings:()=>({}),chatFile:s=>String(s).replace(/\.jsonl$/,''),
    post:async(_url,body)=>{
      if(readHook)await readHook();
      const f=files.get((body.avatar_url||state.avatar)+'/'+body.file_name);
      if(!f)return [];
      return [{chat_metadata:clone(f.metadata)},...clone(f.messages)];
    },
  };
  const api=vm.runInNewContext(runtime+'\n;({startStory,saveChatSafely,hasArchiveConversation,chatBodiesMatch})',env);
  return {api,state,files,writes,toasts,env,get swipes(){return swipeCount;},onRead(fn){readHook=fn;},onSave(fn){saveHook=fn;}};
}

test('opening clicks while a character or archive is loading never write a chat',async()=>{
  for(const flag of ['openingCharacter','chatLoadDepth','returningPage']){
    const f=fixture({messages:[],diskMessages:conversation()});f.env[flag]=true;
    await f.api.startStory(1);assert.equal(f.writes.length,0);assert.equal(f.swipes,0);
    assert.deepEqual(f.files.get('a.png/old').messages,conversation());
  }
});

test('an empty in-memory chat cannot overwrite a saved conversation, including metadata saves',async()=>{
  const f=fixture({messages:[],diskMessages:conversation()});
  await assert.rejects(f.api.startStory(1),/未加载完成/);
  assert.throws(()=>f.api.saveChatSafely(),/未加载完成/);
  assert.equal(f.writes.length,0);
});

test('a stale greeting page does not replace a remote conversation',async()=>{
  const f=fixture({messages:[greeting()],diskMessages:conversation()});
  await assert.rejects(f.api.startStory(1),/服务器里的聊天/);
  await assert.rejects(f.api.saveChatSafely({preview:true}),/服务器里的聊天/);
  assert.equal(f.swipes,0);assert.equal(f.writes.length,0);
});

test('failed new-chat creation preserves old messages, memory and opening',async()=>{
  const metadata={[key]:{memory:{short:'旧档记忆'},pairing:{preset:'原预设'}}};
  const f=fixture({metadata,newChat:false});
  await assert.rejects(f.api.startStory(1),/未能建立新的预览/);
  assert.deepEqual(f.files.get('a.png/old'),{messages:conversation(),metadata});
  assert.equal(f.swipes,0);assert.equal(f.state.metadata[key].storyIndex,undefined);
});

test('a successful new story saves the old conversation and modifies only the new preview',async()=>{
  const metadata={[key]:{memory:{short:'旧档记忆'}}};const f=fixture({metadata});
  await f.api.startStory(1);
  assert.deepEqual(f.files.get('a.png/old'),{messages:conversation(),metadata});
  assert.equal(f.state.file,'preview');assert.equal(f.state.messages[0].mes,'开场二');assert.equal(f.files.get('a.png/preview').metadata[key].storyIndex,1);
});

test('unstarted opening choices reuse one file and retain no old story binding',async()=>{
  const f=fixture({messages:[greeting()],metadata:{world_info:'旧世界书',[key]:{background:{url:'旧背景'}}}});
  await f.api.startStory(1);await f.api.startStory(0);await f.api.startStory(1);
  assert.equal(f.files.size,1);assert.equal(f.state.file,'old');assert.equal(f.state.messages[0].mes,'开场二');
  assert.equal(f.state.metadata.world_info,undefined);assert.equal(f.state.metadata[key].background,undefined);
});

test('archives with user messages in parked branches or a started marker stay formal',async()=>{
  const metadata={[key]:{branches:{parked:[{message:{is_user:true,mes:'另一条故事线'}}]}}};
  const f=fixture({messages:[greeting()],metadata});assert.equal(f.api.hasArchiveConversation(f.state.messages,f.state.metadata),true);
  await f.api.startStory(1);assert.equal(f.state.file,'preview');assert.deepEqual(f.files.get('a.png/old').metadata,metadata);
  assert.equal(f.api.hasArchiveConversation([greeting()],{[key]:{started:true}}),true);
  assert.equal(f.api.hasArchiveConversation([greeting()],{}),false);
});

test('changing role or reloading the same archive during preflight cancels saving',async()=>{
  for(const change of [f=>{f.state.avatar='b.png';},f=>{f.state.file='other';},f=>{f.state.metadata=clone(f.state.metadata);}]){
    const f=fixture();let once=false;f.onRead(()=>{if(!once){once=true;change(f);}});
    await assert.rejects(f.api.saveChatSafely(),/存档还在加载或已经切换/);assert.equal(f.writes.length,0);
  }
});

test('failed remote reads stop theme metadata and opening saves',async()=>{
  const f=fixture();f.onRead(()=>{throw Error('模拟读取失败');});
  await assert.rejects(f.api.saveChatSafely(),/模拟读取失败/);
  await assert.rejects(f.api.startStory(1),/模拟读取失败/);assert.equal(f.writes.length,0);
});

test('intentional branch deletion remains supported while background metadata cannot truncate chat',async()=>{
  const f=fixture();f.state.messages=[greeting()];
  await assert.rejects(f.api.saveChatSafely(),/服务器里的聊天/);
  await f.api.saveChatSafely({bodyChanges:true});assert.equal(f.files.get('a.png/old').messages.length,1);
});

test('queued metadata saves are serialized and finish with the current memory',async()=>{
  const f=fixture();let running=0,max=0;f.onSave(async()=>{running++;max=Math.max(max,running);await new Promise(r=>setTimeout(r,5));running--;});
  f.state.metadata[key]={memory:{short:'新记忆'}};
  await Promise.all([f.api.saveChatSafely(),f.api.saveChatSafely({metadata:true})]);
  assert.equal(max,1);assert.equal(f.files.get('a.png/old').metadata[key].memory.short,'新记忆');assert.equal(f.env.chatWriteDepth,0);
});

test('role placeholders in legacy openings remain compatible',()=>{
  const f=fixture();const stored=[{name:'角色',is_user:false,mes:'你好{{user}}'}],shown=[{name:'角色',is_user:false,mes:'你好用户'}];
  assert.equal(f.api.chatBodiesMatch(stored,shown),true);
});

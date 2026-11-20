const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
const section = (a,b) => source.slice(source.indexOf(a), source.indexOf(b,source.indexOf(a)));
const runtime = section('  async function post(', '  function characterEntries(') +
  section('  async function saveStory(', '  async function startStory(');

function fixture({index=0,text='第一段',ok=true}={}) {
  const requests=[],prefs={},toasts=[];
  let persisted=0,refreshed=0,closed=0;
  const fields = {'#lj-story-text':text,'#lj-story-name':'故事名称','#lj-story-world':'角色世界书',
    '#lj-story-background':'https://example.test/background.png','#lj-story-css':'.story {color:inherit}'};
  const env = {Date,JSON,Error,editingStoryIndex:index,chatWriteDepth:0,chatTransitionBusy:()=>false,
    selected:()=>({avatar:'test.png'}),storyResources:()=>['第一段','第二段','第三段'],storyMeta:()=>({original:true}),
    $:id=>({value:fields[id]}),preferences:()=>prefs,persist:async()=>{persisted++;},
    getOneCharacter:async avatar=>{assert.equal(avatar,'test.png');refreshed++;},closeDialog:()=>closed++,render(){},
    visibleDialog:()=>null,toast:s=>toasts.push(s),ctx:()=>({getRequestHeaders:()=>({'Content-Type':'application/json'})}),
    W:{fetch:async(url,options)=>{
      requests.push({url,body:JSON.parse(options.body)});
      return new Response(ok?'OK':'rejected',{status:ok?200:400,headers:{'Content-Type':'text/plain'}});
    }}
  };
  const api=vm.runInNewContext(runtime+'\n;({post,saveStory})',env);
  return {api,env,requests,prefs,toasts,get counts(){return {persisted,refreshed,closed};}};
}

test('saving an unchanged opening accepts the native plain-text OK response',async()=>{
  const f=fixture();await f.api.saveStory();
  assert.deepEqual(f.requests[0],{url:'/api/characters/merge-attributes',body:{avatar:'test.png',data:{first_mes:'第一段',alternate_greetings:['第二段','第三段']}}});
  assert.deepEqual(f.counts,{persisted:1,refreshed:1,closed:1});
  assert.equal(f.prefs.stories['test.png'][0].world,'角色世界书');
  assert.deepEqual(f.toasts,['故事与全部开场白已保存']);
});

test('editing any opening preserves every other opening and saves its own metadata',async()=>{
  for(const index of [0,1,2]){
    const f=fixture({index,text:'修改后的正文'});await f.api.saveStory();
    const expected=['第一段','第二段','第三段'];expected[index]='修改后的正文';
    const saved=f.requests[0].body.data;assert.deepEqual([saved.first_mes,...saved.alternate_greetings],expected);
    assert.equal(f.prefs.stories['test.png'][index].name,'故事名称');
  }
});

test('a failed opening request does not persist theme settings or report success',async()=>{
  const f=fixture({ok:false});await assert.rejects(f.api.saveStory(),/400/);
  assert.deepEqual(f.counts,{persisted:0,refreshed:0,closed:0});assert.equal(f.toasts.length,0);
});

test('JSON data requests still reject malformed JSON instead of treating it as saved data',async()=>{
  const f=fixture();await assert.rejects(f.api.post('/api/chats/get',{}),/JSON/);
  f.env.W.fetch=async()=>Response.json({messages:3});
  assert.deepEqual(await f.api.post('/api/chats/get',{}),{messages:3});
});

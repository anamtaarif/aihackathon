const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const storeKey = 'medicareAI_demo_v1';
let data = JSON.parse(localStorage.getItem(storeKey) || '{"profile":{},"notes":[]}');
function save(){localStorage.setItem(storeKey,JSON.stringify(data));renderRecords()}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
function go(view){$$('.view').forEach(v=>v.classList.toggle('active',v.id===view));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#crumbName').textContent=({home:'Overview',assistant:'AI Assistant',records:'Health Records',assessment:'Health Assessment',about:'About MediCare'})[view]||'Overview';$('#sidebar').classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});if(view==='records')renderRecords()}
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
$('#menuBtn').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
function renderRecords(){
 const p=data.profile||{}, has=Object.values(p).some(v=>String(v||'').trim());
 $('#profileStatus').textContent=has?(p.name||'Added'):'Not added';
 $('#vitalsStatus').textContent=(p.bp||p.sugar)?'Added':'Not added';
 $('#notesStatus').textContent=`${(data.notes||[]).length} notes`;
 const personal=$('#personalRecord');
 if(has){personal.className='record-content';personal.innerHTML=`<div class="record-lines">${[['Name',p.name],['Age',p.age],['Main concern',p.concern],['Existing conditions',p.conditions],['Allergies',p.allergies],['Current medicines',p.medicines]].filter(x=>x[1]).map(x=>`<div style="padding:10px 0;border-bottom:1px solid #edf1f2"><small style="color:#98a5aa;font-size:9px">${esc(x[0])}</small><div style="font-size:11px;margin-top:4px">${esc(x[1])}</div></div>`).join('')}</div>`}else{personal.className='empty-state';personal.innerHTML='<span>♙</span><b>No personal information yet</b><small>Start a health assessment to add your details.</small><button class="text-btn" data-go="assessment">Add information →</button>';personal.querySelector('button').onclick=()=>go('assessment')}
 const vit=$('#vitalsRecord');const v=[['Blood pressure',p.bp],['Blood sugar',p.sugar]].filter(x=>x[1]);
 vit.className=v.length?'record-content':'empty-state compact';vit.innerHTML=v.length?v.map(x=>`<div style="padding:12px 0;border-bottom:1px solid #edf1f2"><small style="color:#98a5aa;font-size:9px">${esc(x[0])}</small><div style="font-size:13px;font-weight:700;margin-top:4px">${esc(x[1])}</div></div>`).join(''):'<span>⌁</span><b>No readings saved</b><small>Blood pressure and glucose readings will appear here.</small>';
 const notes=$('#notesRecord');notes.className=data.notes.length?'record-content':'empty-state compact';notes.innerHTML=data.notes.length?[...data.notes].reverse().map(n=>`<div style="padding:11px 0;border-bottom:1px solid #edf1f2"><small style="color:#98a5aa;font-size:9px">${esc(n.date)}</small><div style="font-size:11px;margin-top:4px">${esc(n.text)}</div></div>`).join(''):'<span>▤</span><b>No notes yet</b><small>Your conversation summary will appear here.</small>';
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
$('#assessmentForm').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target);data.profile=Object.fromEntries(fd.entries());save();toast('Your health information has been saved.');go('records')});

// Guided chat: collects information, never diagnoses or recommends medication.
const messages=$('#messages'), input=$('#chatInput'), quick=$('#quickOptions');
let chatStep=0, answers={};
const flow=[
 {key:'concern',q:'Please describe what you are experiencing in your own words. When did it begin?',hint:'You can mention the main symptom and when it started.'},
 {key:'duration',q:'Has it been getting better, getting worse, or staying about the same?',hint:'Share any changes you have noticed.'},
 {key:'conditions',q:'Do you have any existing medical conditions that may be relevant?',hint:'For example, asthma, diabetes, or high blood pressure. You can say none or unsure.'},
 {key:'allergies',q:'Do you have any known allergies, especially to medicines?',hint:'List them if known, or say none/unsure.'},
 {key:'medicines',q:'Are you currently taking any medicines or supplements?',hint:'Share names only if you know them. Do not change any medication based on this chat.'},
 {key:'bp',q:'Do you have a recent blood pressure reading? You can skip this.',hint:'Optional. Enter a reading only if you already have one.'},
 {key:'sugar',q:'Do you have a recent blood sugar reading? You can skip this.',hint:'Optional. Include units if known, or type skip.'}
];
function addMessage(text,who='bot'){const row=document.createElement('div');row.className='message '+(who==='user'?'user':'bot');const av=document.createElement('div');av.className='message-avatar';av.textContent=who==='user'?'G':'✚';const bubble=document.createElement('div');bubble.className='bubble';bubble.textContent=text;row.append(av,bubble);messages.append(row);messages.scrollTop=messages.scrollHeight}
function askNext(){if(chatStep<flow.length){addMessage(flow[chatStep].q);quick.innerHTML='<button data-answer="Skip">Skip this question</button>';quick.querySelector('button').onclick=()=>handleAnswer('Skip')}else{finishChat()}}
function handleAnswer(value){if(!value.trim())return;addMessage(value,'user');if(chatStep<flow.length){answers[flow[chatStep].key]=value;chatStep++;setTimeout(askNext,350)}}
quick.addEventListener('click',e=>{const b=e.target.closest('button[data-answer]');if(!b)return;const val=b.dataset.answer;if(chatStep===0&&val.includes('symptom')){addMessage(val,'user');quick.innerHTML='';setTimeout(askNext,300)}else if(val.includes('history')){addMessage(val,'user');quick.innerHTML='';setTimeout(()=>{addMessage('You can add your health history in the Health Assessment section. I will keep this chat available if you want to describe a current concern.');},300)}else if(val.includes('vitals')){addMessage(val,'user');quick.innerHTML='';setTimeout(()=>{addMessage('You can record blood pressure and blood sugar in the Health Assessment section. Only enter readings you already have.');},300)}else handleAnswer(val)});
$('#chatForm').addEventListener('submit',e=>{e.preventDefault();const v=input.value.trim();if(!v)return;input.value='';handleAnswer(v)});
function finishChat(){const summary=flow.map(f=>`${f.key}: ${answers[f.key]||'Not provided'}`).join('\n');data.notes.push({date:new Date().toLocaleString(),text:'Guided health intake summary\n'+summary});save();addMessage('Thank you. Your answers have been saved as a health note. I cannot determine a diagnosis or choose medicines. Please review this summary with a qualified healthcare professional. If you have severe, sudden, or rapidly worsening symptoms, seek urgent medical care now.');quick.innerHTML='<button data-answer="Restart">Start another intake</button><button data-answer="Records">View my summary</button>';quick.querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.answer==='Restart')resetChat();else go('records')})}
function resetChat(){chatStep=0;answers={};messages.innerHTML='';addMessage('Hi there! Welcome to MediCare AI. I can help collect information about how you are feeling and prepare a summary to share with a healthcare professional. What would you like help with today?');quick.innerHTML='<button data-answer="I have a symptom I want to discuss">I have a symptom</button><button data-answer="I want to add my health history">Add health history</button><button data-answer="I want to record my blood pressure or sugar">Record my vitals</button>'}
$('#resetChat').addEventListener('click',resetChat);
renderRecords();

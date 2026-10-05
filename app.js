'use strict';
const $=s=>document.querySelector(s);
const names={calculo:'Cálculo',innovacion:'Innovación',proyecto:'Proyecto PMI'};
const simulation=true;
const storageKey='nexo-student-notebooks-v1';
let activeStudent='jean',notebooks={},previous=null,timer;
try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved&&saved.notebooks){notebooks=saved.notebooks;if(studentProfiles[saved.activeStudent])activeStudent=saved.activeStudent;}}catch{}
function fresh(){return makeStudent(activeStudent);}
let state=notebooks[activeStudent]||fresh();
function save(){notebooks[activeStudent]=state;try{localStorage.setItem(storageKey,JSON.stringify({activeStudent,notebooks}));}catch{notify('No se pudo guardar. Los cambios se mantienen durante esta sesión.');}}
function switchStudent(id){if(!studentProfiles[id])return;save();activeStudent=id;state=notebooks[id]||fresh();previous=null;save();render();$('#task-form').reset();notify('Abriste el cuaderno de '+studentProfiles[id].name+'.');}
$('#student-cards').onclick=e=>{const b=e.target.closest('[data-student]');if(b)switchStudent(b.dataset.student);};
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('show'),5500);}
function escapeText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function time(m){return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`;}
function view(id){if(!['hoy','tareas','notas','prueba'].includes(id))id='hoy';document.querySelectorAll('.view').forEach(v=>v.hidden=v.id!==id);document.querySelectorAll('nav button').forEach(b=>{b.classList.toggle('active',b.dataset.view===id);if(b.dataset.view===id)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});$('#section-label').textContent={hoy:'MI DÍA',tareas:'MIS TAREAS',notas:'MIS NOTAS',prueba:'PROBAR LA IDEA'}[id];}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{location.hash=b.dataset.view;view(b.dataset.view);});window.addEventListener('hashchange',()=>view(location.hash.slice(1)));
function renderProfile(){
 const profile=studentProfiles[activeStudent],empty=!state.tasks.length;
 $('#student-cards').innerHTML=Object.entries(studentProfiles).map(([id,p])=>`<button class="student-card ${id===activeStudent?'selected':''}" data-student="${id}" aria-pressed="${id===activeStudent}" style="--student-color:${p.color}"><span class="student-avatar">${p.initial}</span><strong>${p.name}</strong><small>${p.subtitle}</small><span class="student-selected">${id===activeStudent?'● Cuaderno abierto':id==='nuevo'?'+ Empezar de cero':'Abrir cuaderno →'}</span></button>`).join('');
 $('#greeting').textContent=activeStudent==='nuevo'?'Tu primera página.':`Hola, ${profile.name}`;
 $('#profile-name').textContent=profile.name;$('#profile-context').textContent=activeStudent==='nuevo'?'Tu cuaderno personal':'Perfil ficticio · demo';$('.avatar').textContent=profile.initial;
 $('#hoy .intro p').textContent=empty?'Una página en blanco para organizarte a tu manera.':'Tu cuaderno, tus pendientes y un plan a tu ritmo.';
 $('#scenario-title').textContent=profile.context;
 $('#scenario-description').textContent=empty?'Ve a Mis tareas para registrar tu primer pendiente. En Mis notas puedes ingresar tus promedios. Al crear tareas se aplicará el horario de ejemplo con almuerzo y tiempo personal protegido.':`${profile.name}: ${state.tasks.length} tareas registradas, ${state.tasks.filter(t=>t.done).length} completadas y ${state.tasks.filter(t=>!t.done).reduce((sum,t)=>sum+t.minutes,0)/60} horas pendientes. Prueba los cambios o edita tus datos en Mis tareas y Mis notas.`;
 $('#sim-complete').disabled=!state.tasks.some(t=>!t.done);$('#sim-urgent').disabled=state.tasks.some(t=>t.id===999)||empty;$('#sim-surprise').disabled=state.interruption||empty;
 $('#sim-status').textContent=empty?'Un cuaderno vacío, muchas posibilidades.':`${state.tasks.filter(t=>t.done).length} tareas completadas · Entrega urgente ${state.tasks.some(t=>t.id===999)?'recibida':'sin recibir'} · Imprevisto ${state.interruption?'activo':'sin activar'}.`;
 $('#protected-count').textContent=empty?'Sin agenda todavía':'2 h protegidas';$('#protected-card').hidden=empty;
 $('#protected-count').nextElementSibling.textContent=empty?'Agrega tu primer pendiente':'almuerzo + tiempo personal';
}
function render(){
 renderProfile();
 const empty=state.tasks.length===0;
 const result=NexoEngine.schedule(state.tasks,state.grades,state.interruption);const remaining=state.tasks.filter(t=>!t.done).reduce((s,t)=>s+t.minutes,0);
 $('#done-count').textContent=`${state.tasks.filter(t=>t.done).length} / ${state.tasks.length}`;
 $('#load-count').textContent=`${remaining/60} h ${state.planned?'de tareas':'por organizar'}`;
 $('#load-caption').textContent=state.planned&&result.pending.length?`${result.pending.reduce((s,t)=>s+t.minutes,0)} min sin espacio hoy`:'en sesiones de 30 minutos';
 const first=result.ordered[0];$('#next-title').textContent=first?`Primero, ${names[first.course]}.`:(empty?'Tu cuaderno empieza aquí.':'¡Pendientes completados!');
 $('#next-reason').textContent=first?`${first.days} días para la entrega · peso ${first.weight}% · promedio ${(state.grades[first.course]??'sin registrar')}/20. Una sesión de 30 minutos es un buen comienzo.`:(empty?'Agrega tu primer pendiente en Mis tareas. Tú decides por dónde empezar.':'Tu lista está al día. Disfruta tu tiempo personal o agrega una nueva tarea.');
 $('#plan').textContent=state.planned?'✦ Volver a organizar':'✦ Organizar mi día';
 const entries=empty?[]:[{minute:9*60,title:'Clase de Cálculo',meta:'09:00–11:00 · Fijo',kind:''},{minute:13*60,title:'Almorzar sin apuro',meta:'13:00–14:00 · Protegido',kind:'protect'},{minute:18*60,title:'Tiempo para ti',meta:'18:00–19:00 · Protegido',kind:'protect'}];
 if(state.interruption)entries.push({minute:15*60,title:'Imprevisto personal',meta:'15:00–16:00 · Ocupado en esta simulación',kind:'busy'});
 if(state.planned)result.blocks.forEach(b=>entries.push({minute:b.minute,title:b.title,meta:`${time(b.minute)}–${time(b.minute+30)} · ${names[b.course]} · Sesión ${b.part}/${b.total}`,kind:'flex'}));else entries.push({minute:14*60,title:'Aquí empieza tu plan',meta:'Pulsa «Organizar mi día» para distribuir las tareas.',kind:'empty'});
 entries.sort((a,b)=>a.minute-b.minute);$('#timeline').innerHTML=entries.map(e=>`<div class="slot"><span class="time">${time(e.minute)}</span><div class="block ${e.kind}"><strong>${escapeText(e.title)}</strong><small>${escapeText(e.meta)}</small></div></div>`).join('');
 if(empty)$('#timeline').innerHTML='<div class="block empty"><strong>Tu primera tarea va aquí.</strong><small>Abre Mis tareas para empezar. Aún no hay actividades registradas.</small></div>';
 if(state.planned&&result.pending.length)$('#timeline').innerHTML+=`<div class="block busy"><strong>No todo cabe hoy.</strong><small>${result.pending.map(t=>`${escapeText(t.title)}: ${t.minutes} min pendientes`).join('<br>')}<br>Reduce la carga o acuerda otra fecha. Tu descanso se mantiene.</small></div>`;
 $('#explanation').textContent=state.planned?(first?`${names[first.course]} va primero: ${first.days} días de plazo, ${first.weight}% de peso y ${(state.grades[first.course]??'sin registrar')}/20 de promedio. ${state.interruption?'Las sesiones evitan el imprevisto de 15:00 a 16:00. ':''}El almuerzo y el tiempo personal siguen intactos.`:'Completaste todas las tareas. No agregamos estudio innecesario a tus horas libres.'):'Combinamos cercanía de entrega, peso de la evaluación y promedio del curso. Pulsa «Organizar mi día» para verlo.';
 $('#surprise').disabled=state.interruption||empty;$('#undo').disabled=!previous;
 $('#task-list').innerHTML=state.tasks.map(t=>`<article class="task-card ${t.done?'completed':''}"><h3>${escapeText(t.title)}</h3><p>${names[t.course]} · ${t.minutes} min · entrega en ${t.days} días · peso ${t.weight}%</p><button data-complete="${t.id}">${t.done?'↶ Marcar pendiente':'✓ Completar tarea'}</button> <button data-remove="${t.id}" aria-label="Eliminar ${escapeText(t.title)}">Eliminar</button></article>`).join('')||'<p>Tu lista está vacía. Agrega tu primera tarea.</p>';
 $('#courses').innerHTML=Object.entries(names).map(([key,name])=>`<article class="card"><span class="eyebrow">PROMEDIO ACTUAL</span><h2>${name}</h2><label>Nota sobre 20<input aria-label="Promedio de ${name}" data-grade="${key}" type="number" min="0" max="20" step="0.1" value="${state.grades[key]??''}" placeholder="Sin nota"></label><p class="small">${state.grades[key]===null?'Sin promedio. Regístralo cuando lo tengas.':state.grades[key]<13?'Necesita más atención en la planificación.':'Mantén el avance sin sacrificar el descanso.'}</p></article>`).join('');
 $('#feedback').value=state.feedback||'';
}
function checkpoint(){previous=JSON.stringify(state);}
$('#plan').onclick=()=>{if(!state.tasks.length){location.hash='tareas';view('tareas');notify('Registra tu primera tarea para organizar el día.');return;}checkpoint();state.planned=true;save();render();notify('Plan actualizado. Las tareas se dividieron en sesiones de 30 minutos.');};
$('#surprise').onclick=()=>{checkpoint();state.interruption=true;state.planned=true;save();render();notify('Reorganizamos el estudio alrededor del imprevisto. Tu tiempo protegido se mantiene.');};
$('#undo').onclick=()=>{if(previous){state=JSON.parse(previous);previous=null;save();render();notify('Volviste al estado anterior.');}};
$('#task-form').onsubmit=e=>{e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const data=new FormData(form),title=data.get('title').trim();if(!title){notify('Escribe un nombre para la tarea.');return;}checkpoint();state.tasks.push({id:Date.now(),title,course:data.get('course'),minutes:Number(data.get('minutes')),days:Number(data.get('days')),weight:Number(data.get('weight')),done:false});state.planned=true;save();render();form.reset();notify('Tarea agregada. Ya puedes ver el plan actualizado en Mi día.');};
$('#task-list').onclick=e=>{const b=e.target.closest('button');if(!b)return;checkpoint();if(b.dataset.complete){const task=state.tasks.find(t=>t.id===Number(b.dataset.complete));task.done=!task.done;}else if(b.dataset.remove)state.tasks=state.tasks.filter(t=>t.id!==Number(b.dataset.remove));save();render();};
$('#courses').addEventListener('change',e=>{if(!e.target.dataset.grade)return;if(!e.target.reportValidity())return;checkpoint();state.grades[e.target.dataset.grade]=(e.target.value===''?null:Number(e.target.value));save();render();notify('Promedio actualizado. La prioridad y el plan reflejan el cambio.');});
$('#feedback').oninput=e=>{state.feedback=e.target.value;save();};
$('#download-notes').onclick=()=>{const text=`NEXO · Bitácora de prueba\nFecha de registro: ${new Date().toLocaleDateString('es-PE')}\n\n${state.feedback||'Sin observaciones registradas.'}\n\nAdjuntar por separado las fotografías reales de la prueba, tomadas con permiso.`;const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='NEXO-observaciones.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#reset').onclick=()=>{if(confirm('¿Reiniciar solo el cuaderno actual? Los otros alumnos conservarán sus datos.')){state=fresh();previous=null;save();render();notify('Demo lista para una nueva prueba.');}};
$('#print').onclick=()=>{if(!state.tasks.length){notify('Agrega una tarea antes de imprimir tu plan.');return;}const r=NexoEngine.schedule(state.tasks,state.grades,state.interruption);$('#print-kit').innerHTML=`<h1>NEXO · Mi plan en papel</h1><p>Prototipo individual de planificación adaptativa. Recorta las tarjetas y muévelas sobre una base de cartón.</p><div class="paper-board"><h2>Lunes de prueba · espacios para ubicar tarjetas</h2><p>09:00–11:00 CLASE FIJA · 13:00–14:00 ALMUERZO PROTEGIDO</p><p>14:00 □ 14:30 □ 15:00 □ 15:30 □ 16:00 □ 16:30 □ 17:00 □ 17:30 □</p><p>18:00–19:00 TIEMPO PERSONAL PROTEGIDO · 19:00 □ 19:30 □</p></div><div class="print-cards">${r.blocks.map(b=>`<article><h3>${escapeText(b.title)}</h3><p>${names[b.course]} · sesión ${b.part}/${b.total} · 30 min</p><p>Propuesta: ${time(b.minute)} · Adaptable</p></article>`).join('')}<article><h3>♡ Tiempo para mí</h3><p>18:00–19:00 · Este bloque no se mueve.</p></article><article><h3>↝ ¡Surgió un imprevisto!</h3><p>15:00–16:00 · Reubica las sesiones afectadas.</p></article></div><p>${r.pending.length?'Carga pendiente: '+r.pending.map(t=>escapeText(t.title)+' ('+t.minutes+' min)').join(', '):'Las tareas pendientes caben en los espacios de esta simulación.'}</p><h2>Observa y fotografía</h2><p>1. Elegir una tarea. 2. Mover las sesiones ante el imprevisto. 3. Revisar que el descanso se mantiene.</p><p>Fotografía el uso con una persona real y su permiso. Anota qué entendió y qué cambiaría.</p>`;window.print();};
if(simulation){
 $('#sim-complete').onclick=()=>{const task=NexoEngine.schedule(state.tasks,state.grades,state.interruption).ordered[0];if(!task||task.done)return;checkpoint();task.done=true;save();render();notify('Tarea completada. Se liberó el tiempo asignado y el plan se actualizó.');};
 $('#sim-urgent').onclick=()=>{if(state.tasks.some(t=>t.id===999))return;checkpoint();state.tasks.push({id:999,title:'Entrega urgente: ficha de validación NEXO',course:'innovacion',minutes:120,days:1,weight:40,done:false});state.planned=true;save();render();notify('Llegó una entrega para mañana. Recalculamos las prioridades y la carga pendiente.');};
 $('#sim-surprise').onclick=()=>$('#surprise').click();
}
render();view(location.hash.slice(1));



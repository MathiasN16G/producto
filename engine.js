(function(root){
  'use strict';
  function score(task,grades){return 60/task.days+task.weight/10+(grades[task.course]==null?0:20-grades[task.course]);}
  function schedule(tasks,grades,interruption){
    const available=[];
    for(let minute=14*60;minute<20*60;minute+=30){if(minute>=18*60&&minute<19*60)continue;if(interruption&&minute>=15*60&&minute<16*60)continue;available.push(minute);}
    const ordered=tasks.filter(t=>!t.done).slice().sort((a,b)=>score(b,grades)-score(a,grades));
    const blocks=[],pending=[];
    for(const task of ordered){let left=task.minutes;let part=1;while(left>0&&available.length){blocks.push({minute:available.shift(),taskId:task.id,title:task.title,course:task.course,part:part++,total:Math.ceil(task.minutes/30)});left-=30;}if(left>0)pending.push({title:task.title,minutes:left});}
    return {blocks,pending,ordered};
  }
  const api={score,schedule};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.NexoEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this);

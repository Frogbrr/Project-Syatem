(() => {
  "use strict";
  const STORE = "project-system-v1";
  const defaultMissions = [
    {id:"sun",title:"Sair um pouco e pegar luz natural",detail:"No seu ritmo, sem exageros.",xp:15,stat:"vitalidade"},
    {id:"mind",title:"Meditar por 5 minutos",detail:"Respire e volte ao presente.",xp:15,stat:"disciplina"},
    {id:"water",title:"Fazer uma pausa para beber água",detail:"Cuide de você ao longo do dia.",xp:10,stat:"vitalidade"},
    {id:"learn",title:"Estudar um idioma por 10 minutos",detail:"Uma sessão curta já conta.",xp:20,stat:"inteligencia"},
    {id:"focus",title:"Dedicar 10 minutos a uma tarefa importante",detail:"Escolha uma coisa possível hoje.",xp:20,stat:"foco"}
  ];
  const statNames = {forca:"Força",inteligencia:"Inteligência",disciplina:"Disciplina",vitalidade:"Vitalidade",foco:"Foco"};
  const today = () => new Date().toLocaleDateString("en-CA");
  const dateLabel = (s) => { try{return new Date(s+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"short",year:"numeric"});}catch{return s;} };
  const fresh = () => ({xp:0,level:1,missions:defaultMissions.map(m=>({...m,doneOn:null,custom:false})),completed:[],stats:{forca:1,inteligencia:1,disciplina:1,vitalidade:1,foco:1},languages:[],journal:[],activeDays:[],lastReminder:null});
  let data;
  try { data = JSON.parse(localStorage.getItem(STORE)) || fresh(); } catch { data=fresh(); }
  let timerSeconds=25*60, timerRunning=false, timerInterval=null;
  const $ = id => document.getElementById(id);
  const save = () => { try {localStorage.setItem(STORE,JSON.stringify(data));} catch(e){toast("Não foi possível salvar. Exporte um backup.");} };
  function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove("show"),2300);}
  function levelFor(xp){return Math.floor(xp/100)+1;}
  function rankFor(level){if(level>=30)return "CAÇADOR S";if(level>=20)return "CAÇADOR A";if(level>=12)return "CAÇADOR B";if(level>=7)return "CAÇADOR C";if(level>=4)return "CAÇADOR D";return "CAÇADOR E";}
  function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function render(){
    data.level=levelFor(data.xp);
    $("rankName").textContent=rankFor(data.level);
    $("levelLine").textContent=`Nível ${data.level} · ${data.level===1?"Iniciante":"Evoluindo"}`;
    $("levelNum").textContent=data.level;
    $("xpText").textContent=`${data.xp%100} / 100 XP`;
    $("xpBar").style.width=(data.xp%100)+"%";
    $("todayDate").textContent=new Date().toLocaleDateString("pt-BR",{weekday:"short",day:"2-digit",month:"short"});
    const todays=data.missions.filter(m=>!m.custom||m.createdOn===today());
    const done=todays.filter(m=>m.doneOn===today()).length;
    $("missionCount").textContent=`${done}/${todays.length} concluídas`;
    $("missionHint").textContent=done===todays.length?"Protocolo diário concluído.":done===0?"Comece com uma missão simples.":"Continue no seu ritmo.";
    $("dailyTitle").textContent=done===todays.length?"Protocolo concluído!":"Desafio de consistência";
    $("dailyDesc").textContent=done===todays.length?"Você apareceu por si mesmo hoje. Isso conta.":"Pequenas ações. Progresso real.";
    $("missionList").innerHTML=todays.map(m=>`<article class="mission ${m.doneOn===today()?"done":""}"><button class="mission-check" data-complete="${esc(m.id)}" aria-label="Concluir ${esc(m.title)}">${m.doneOn===today()?"✓":""}</button><div class="mission-body"><strong>${esc(m.title)}</strong><p>${esc(m.detail||"Missão pessoal")}</p></div><span class="mission-xp">+${m.xp} XP</span>${m.custom?`<button class="delete-mission" data-delete="${esc(m.id)}" aria-label="Excluir missão">×</button>`:""}</article>`).join("")||'<div class="empty-state">Nenhuma missão por aqui. Adicione a primeira.</div>';
    $("statsGrid").innerHTML=Object.entries(statNames).map(([key,name])=>`<div class="stat-card"><div class="stat-top"><span>◇ ${name.toUpperCase()}</span><span>LV</span></div><strong>${data.stats[key]||1}</strong><small>${statDescription(key)}</small></div>`).join("");
    $("totalDone").textContent=data.completed.length;
    $("activeDays").textContent=new Set(data.activeDays).size;
    $("streak").textContent=streakCount()+" dias";
    renderLanguages();renderJournal();save();
  }
  function statDescription(k){return ({forca:"Ação e movimento",inteligencia:"Aprendizado",disciplina:"Consistência",vitalidade:"Cuidado pessoal",foco:"Atenção e presença"})[k];}
  function streakCount(){let n=0,d=new Date();const set=new Set(data.activeDays);while(set.has(d.toLocaleDateString("en-CA"))){n++;d.setDate(d.getDate()-1);}return n;}
  function award(m){data.xp+=m.xp;data.completed.push({id:m.id,title:m.title,date:today(),xp:m.xp});data.activeDays.push(today());if(m.stat&&data.stats[m.stat]!==undefined)data.stats[m.stat]++;const oldLevel=data.level;data.level=levelFor(data.xp);toast(data.level>oldLevel?`NÍVEL ${data.level} ALCANÇADO! +${m.xp} XP`:`Missão concluída · +${m.xp} XP`);}
  $("missionList").addEventListener("click",e=>{
    const c=e.target.closest("[data-complete]");const d=e.target.closest("[data-delete]");
    if(c){const m=data.missions.find(x=>x.id===c.dataset.complete);if(!m)return;if(m.doneOn===today()){toast("Essa missão já foi concluída hoje.");return;}m.doneOn=today();award(m);render();}
    if(d){data.missions=data.missions.filter(x=>x.id!==d.dataset.delete);save();render();toast("Missão removida.");}
  });
  $("addMissionForm").addEventListener("submit",e=>{e.preventDefault();const title=$("missionInput").value.trim();if(!title)return;data.missions.push({id:"custom-"+Date.now(),title,detail:"Missão personalizada",xp:15,stat:"disciplina",custom:true,createdOn:today(),doneOn:null});$("missionInput").value="";render();toast("Missão adicionada.");});
  document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>switchTab(b.dataset.tab)));
  function switchTab(tab){document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+tab));document.querySelectorAll(".tab,.bottom-item").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));window.scrollTo({top:0,behavior:"smooth"});}
  $("languageForm").addEventListener("submit",e=>{e.preventDefault();const minutes=Math.min(300,Math.max(1,Number($("languageMinutes").value)||1));const language=$("languageSelect").value;const note=$("languageNote").value.trim();const xp=Math.max(5,Math.round(minutes/5)*5);data.languages.unshift({language,minutes,note,date:today(),xp});data.xp+=xp;data.stats.inteligencia+=1;data.activeDays.push(today());$("languageNote").value="";render();toast(`Sessão registrada · +${xp} XP`);});
  function renderLanguages(){const el=$("languageHistory");el.innerHTML=data.languages.slice(0,12).map(x=>`<article class="history-item"><div class="history-top"><span>${esc(x.language)} · ${x.minutes} min</span><span>+${x.xp} XP</span></div><div class="history-meta">${dateLabel(x.date)}</div>${x.note?`<p>${esc(x.note)}</p>`:""}</article>`).join("")||'<div class="empty-state">Suas sessões aparecerão aqui.</div>';}
  $("journalForm").addEventListener("submit",e=>{e.preventDefault();const text=$("journalText").value.trim();if(!text){toast("Escreva pelo menos uma linha.");return;}data.journal.unshift({mood:$("moodSelect").value,text,date:today(),id:Date.now()});data.activeDays.push(today());save();$("journalText").value="";renderJournal();toast("Registro salvo neste dispositivo.");});
  function renderJournal(){const el=$("journalHistory");el.innerHTML=data.journal.slice(0,20).map(x=>`<article class="history-item"><div class="history-top"><span>${esc(x.mood)} · ${dateLabel(x.date)}</span><button class="delete-mission" data-jdelete="${x.id}" aria-label="Excluir registro">×</button></div><p>${esc(x.text)}</p></article>`).join("")||'<div class="empty-state">Seu diário está vazio. Registre como foi o dia.</div>';}
  $("journalHistory").addEventListener("click",e=>{const b=e.target.closest("[data-jdelete]");if(b){data.journal=data.journal.filter(x=>String(x.id)!==b.dataset.jdelete);save();renderJournal();toast("Registro removido.");}});
  function updateTimer(){const m=Math.floor(timerSeconds/60),s=timerSeconds%60;$("timerDisplay").textContent=`${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}
  $("timerStart").addEventListener("click",()=>{if(timerRunning){clearInterval(timerInterval);timerRunning=false;$("timerStart").textContent="Continuar";$("timerStatus").textContent="Pausa feita. Retome quando quiser.";return;}timerRunning=true;$("timerStart").textContent="Pausar";$("timerStatus").textContent="Foco ativado. Uma coisa de cada vez.";timerInterval=setInterval(()=>{timerSeconds--;updateTimer();if(timerSeconds<=0){clearInterval(timerInterval);timerRunning=false;timerSeconds=0;$("timerStart").textContent="Concluído";$("timerStatus").textContent="Sessão concluída. Bom trabalho!";data.xp+=10;data.stats.foco++;data.activeDays.push(today());save();toast("Foco concluído · +10 XP");}},1000);});
  $("timerReset").addEventListener("click",()=>{clearInterval(timerInterval);timerRunning=false;timerSeconds=25*60;updateTimer();$("timerStart").textContent="Iniciar";$("timerStatus").textContent="Um passo de cada vez.";});
  document.querySelectorAll("[data-minutes]").forEach(b=>b.addEventListener("click",()=>{clearInterval(timerInterval);timerRunning=false;timerSeconds=Number(b.dataset.minutes)*60;updateTimer();$("timerStart").textContent="Iniciar";$("timerStatus").textContent=`Sessão de ${b.dataset.minutes} minutos pronta.`;document.querySelectorAll("[data-minutes]").forEach(x=>x.classList.toggle("selected",x===b));}));
  $("settingsBtn").addEventListener("click",()=>$("settingsDialog").showModal());
  $("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="project-system-backup.json";a.click();URL.revokeObjectURL(a.href);toast("Backup exportado.");});
  $("importInput").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const parsed=JSON.parse(await f.text());if(!parsed||!Array.isArray(parsed.missions)||typeof parsed.xp!=="number")throw Error();data={...fresh(),...parsed};save();render();toast("Backup importado.");$("settingsDialog").close();}catch{toast("Arquivo de backup inválido.");}e.target.value="";});
  $("resetBtn").addEventListener("click",()=>{if(confirm("Apagar todo o progresso deste dispositivo? Esta ação não pode ser desfeita.")){data=fresh();save();render();$("settingsDialog").close();toast("Progresso reiniciado.");}});
  $("reminderBtn").addEventListener("click",async()=>{if(!("Notification" in window)){toast("Notificações não são compatíveis neste navegador.");return;}try{const p=await Notification.requestPermission();if(p==="granted"){new Notification("PROJECT SYSTEM",{body:"Hora de conferir suas missões de hoje."});toast("Permissão concedida. Lembretes automáticos exigem o app aberto ou recursos extras.");}else toast("Permissão de notificação não concedida.");}catch{toast("Não foi possível ativar notificações neste navegador.");}});
  if("serviceWorker" in navigator && /^https?:$/.test(location.protocol)){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
  render();updateTimer();
})();
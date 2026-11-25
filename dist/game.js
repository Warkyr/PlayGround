const countries={
 US:{name:'Estados Unidos',flag:'🇺🇸',gdp:29.2,pop:341,treasury:3800,mil:96,approval:52,inflation:2.8,unemployment:4.1,debt:121,growth:2.7},
 CA:{name:'Canadá',flag:'🇨🇦',gdp:2.24,pop:41,treasury:180,mil:61,approval:54,inflation:2.5,unemployment:6.5,debt:107,growth:1.8},
 MX:{name:'México',flag:'🇲🇽',gdp:1.85,pop:129,treasury:95,mil:58,approval:48,inflation:4.2,unemployment:3.1,debt:56,growth:1.5},
 BR:{name:'Brasil',flag:'🇧🇷',gdp:2.31,pop:216,treasury:220,mil:73,approval:55,inflation:4.6,unemployment:7.2,debt:78,growth:2.2},
 AR:{name:'Argentina',flag:'🇦🇷',gdp:.66,pop:46,treasury:-18,mil:42,approval:38,inflation:94,unemployment:7.9,debt:85,growth:-1.8},
 CL:{name:'Chile',flag:'🇨🇱',gdp:.34,pop:20,treasury:28,mil:49,approval:47,inflation:4.2,unemployment:8.4,debt:42,growth:2.4},
 CO:{name:'Colômbia',flag:'🇨🇴',gdp:.42,pop:52,treasury:22,mil:64,approval:43,inflation:5.2,unemployment:9.1,debt:56,growth:2.6},
 PE:{name:'Peru',flag:'🇵🇪',gdp:.29,pop:34,treasury:16,mil:48,approval:41,inflation:3.1,unemployment:6.8,debt:33,growth:3.1},
 VE:{name:'Venezuela',flag:'🇻🇪',gdp:.12,pop:28,treasury:-8,mil:51,approval:32,inflation:85,unemployment:8.2,debt:175,growth:-3.2},
 EC:{name:'Equador',flag:'🇪🇨',gdp:.12,pop:18,treasury:5,mil:38,approval:40,inflation:3.0,unemployment:4.7,debt:58,growth:1.8},
 BO:{name:'Bolívia',flag:'🇧🇴',gdp:.047,pop:12,treasury:2,mil:34,approval:43,inflation:5.1,unemployment:4.1,debt:78,growth:2.0},
 PY:{name:'Paraguai',flag:'🇵🇾',gdp:.045,pop:7,treasury:4,mil:29,approval:49,inflation:4.2,unemployment:5.7,debt:40,growth:3.8},
 UY:{name:'Uruguai',flag:'🇺🇾',gdp:.077,pop:3.4,treasury:8,mil:31,approval:57,inflation:5.1,unemployment:8.3,debt:67,growth:3.1},
 GT:{name:'Guatemala',flag:'🇬🇹',gdp:.111,pop:18,treasury:-3,mil:27,approval:39,inflation:4.1,unemployment:2.9,debt:28,growth:3.5},
 SV:{name:'El Salvador',flag:'🇸🇻',gdp:.034,pop:6.3,treasury:-2,mil:25,approval:46,inflation:2.2,unemployment:6.0,debt:84,growth:2.8},
 HN:{name:'Honduras',flag:'🇭🇳',gdp:.036,pop:10.8,treasury:-1,mil:24,approval:36,inflation:5.1,unemployment:6.1,debt:48,growth:3.5},
 NI:{name:'Nicarágua',flag:'🇳🇮',gdp:.018,pop:7,treasury:-2,mil:23,approval:35,inflation:4.8,unemployment:4.7,debt:56,growth:3.0},
 CR:{name:'Costa Rica',flag:'🇨🇷',gdp:.096,pop:5.1,treasury:6,mil:12,approval:52,inflation:2.4,unemployment:7.6,debt:62,growth:4.1},
 PA:{name:'Panamá',flag:'🇵🇦',gdp:.087,pop:4.5,treasury:5,mil:18,approval:50,inflation:1.5,unemployment:8.6,debt:52,growth:4.5},
 GY:{name:'Guiana',flag:'🇬🇾',gdp:.018,pop:.8,treasury:3,mil:20,approval:51,inflation:3.4,unemployment:12.4,debt:26,growth:43},
 SR:{name:'Suriname',flag:'🇸🇷',gdp:.004,pop:.6,treasury:-1,mil:17,approval:42,inflation:22,unemployment:7.5,debt:88,growth:-2.1},
 GF:{name:'Guiana Francesa',flag:'🇫🇷',gdp:.006,pop:.3,treasury:1,mil:15,approval:55,inflation:2.1,unemployment:10.0,debt:30,growth:2.2}
};
let state={player:null,month:0,paused:false,speed:1,relations:{},wars:new Set(),zoom:1};
for(const code of Object.keys(countries)) state.relations[code]=code==='US'?45:38+Math.floor(Math.random()*25);

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function money(n){if(Math.abs(n)>=1000)return '$'+(n/1000).toFixed(n>=10000?1:2)+' tri';if(Math.abs(n)>=1)return '$'+n.toFixed(n<10?2:0)+' bi';return '$'+(n*1000).toFixed(0)+' mi'}
function fmtGDP(n){return n>=1?'$'+n.toFixed(n<10?2:1)+' tri':'$'+Math.round(n*1000)+' bi'}

function buildCards(){const priority=['BR','US','MX','AR','CL','CO','PE','VE','CA','UY'];$('#countryCards').innerHTML=priority.map(c=>`<button class="country-card" data-code="${c}"><div class="emoji">${countries[c].flag}</div><b>${countries[c].name}</b><small>PIB ${fmtGDP(countries[c].gdp)}</small></button>`).join('');$$('.country-card').forEach(b=>b.onclick=()=>start(b.dataset.code));}
function start(code){state.player=JSON.parse(JSON.stringify(countries[code]));state.player.code=code;$('#countrySelect').classList.add('hidden');$('#playArea').classList.remove('hidden');$('.country').forEach(p=>p.classList.toggle('selected',p.dataset.code===code));updateUI();addEvent(`Mandato iniciado em ${state.player.name}`);buildRelations();}

function updateUI(){const p=state.player;if(!p)return;$('#nationName').textContent=p.name;$('#flag').textContent=p.flag;$('#gdp').textContent=fmtGDP(p.gdp);$('#gdpGrowth').textContent=(p.growth>=0?'▲ +':'▼ ') + p.growth.toFixed(1)+'%';$('#gdpGrowth').style.color=p.growth>=0?'#67c69c':'#d77a70';$('#gdpCapita').textContent='$'+Math.round(p.gdp*1e12/p.pop/1e6).toLocaleString('pt-BR');$('#inflation').textContent=p.inflation.toFixed(1)+'%';$('#unemployment').textContent=p.unemployment.toFixed(1)+'%';$('#debt').textContent=p.debt.toFixed(0)+'% do PIB';$('#topGDP').textContent=fmtGDP(p.gdp);$('#topPop').textContent=(p.pop>=1?p.pop.toFixed(p.pop<10?1:0)+' mi':p.pop.toFixed(1)+' mi');$('#topTreasury').textContent=money(p.treasury);$('#treasury').textContent=money(p.treasury);$('#approval').textContent=p.approval.toFixed(0)+'%';$('#military').textContent=p.mil+'/100';const stability=Math.max(0,Math.min(100,100-p.inflation*.28-p.unemployment*.9-p.debt*.08+(p.approval*.15)));p.stability=Math.round(stability);$('#stability').textContent=p.stability;$('#stabilityRing').style.background=`conic-gradient(${p.stability>65?'#d9ad52':p.stability>40?'#d78952':'#bd6256'} ${p.stability}%,#1a3448 0)`;$('#statusLabel').textContent=p.stability>70?'Estável':p.stability>45?'Tenso':'Crise';}

function addEvent(text){const el=document.createElement('div');el.className='event';el.textContent=text;$('#events').prepend(el);while($('#events').children.length>8)$('#events').lastChild.remove();}
function showToast(text){const t=$('#toast');t.textContent=text;t.classList.remove('hidden');clearTimeout(t.timer);t.timer=setTimeout(()=>t.classList.add('hidden'),2200)}

function spend(cost){if(state.player.treasury<cost){showToast('Tesouro insuficiente');return false}state.player.treasury-=cost;return true}
$('#stimulus').onclick=()=>{if(spend(20)){state.player.growth+=.8;state.player.debt+=4;state.player.approval+=2;state.player.unemployment-=.4;addEvent('Pacote de estímulo aprovado');updateUI()}};
$('#austerity').onclick=()=>{if(spend(10)){state.player.debt-=3;state.player.inflation-=.5;state.player.growth-=.3;state.player.approval-=4;addEvent('Ajuste fiscal implementado');updateUI()}};
$('#industry').onclick=()=>{if(spend(35)){state.player.gdp*=1.015;state.player.unemployment-=1.2;state.player.growth+=.5;state.player.debt+=3;addEvent('Nova política industrial lançada');updateUI()}};

$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.panel').forEach(p=>p.classList.add('hidden'));$('#'+b.dataset.panel+'Panel').classList.remove('hidden')});
function buildRelations(){const other=Object.keys(countries).filter(c=>c!==state.player.code).slice(0,12);$('#relationsList').innerHTML=other.map(c=>`<div class="relation"><div class="relation-head"><span>${countries[c].flag} ${countries[c].name}</span><b>${state.relations[c]}</b></div><div class="relation-actions"><button data-diplomacy="trade" data-code="${c}">Acordo comercial</button><button data-diplomacy="aid" data-code="${c}">Oferta de cooperação</button><button data-diplomacy="war" data-code="${c}" class="war">Declarar guerra</button><button data-diplomacy="annex" data-code="${c}">Anexar país</button></div></div>`).join('');$$('[data-diplomacy]').forEach(b=>b.onclick=()=>diplomacy(b.dataset.diplomacy,b.dataset.code));}
function diplomacy(type,code){const c=countries[code];if(type==='trade'){if(spend(5)){state.relations[code]+=8;state.player.gdp*=1.002;state.player.approval+=1;addEvent(`Acordo comercial com ${c.name}`)}}if(type==='aid'){if(spend(8)){state.relations[code]+=12;state.player.approval+=1;addEvent(`Pacote de cooperação enviado a ${c.name}`)}}if(type==='war'){if(state.wars.has(code)){showToast('O país já está em guerra');return}state.wars.add(code);state.relations[code]-=60;$('.country[data-code="'+code+'"]').classList.add('at-war');addEvent(`Guerra declarada contra ${c.name}`);showToast('Estado de guerra iniciado')}if(type==='annex'){if(!state.wars.has(code)){showToast('É necessário declarar guerra primeiro');return}if(state.player.mil<c.mil*.75||state.player.treasury<30){showToast('Poder militar ou tesouro insuficiente');return}state.player.treasury-=30;state.player.gdp+=c.gdp*.8;state.player.pop+=c.pop;state.player.approval-=8;state.wars.delete(code);$('.country[data-code="'+code+'"]').className='country selected';$('.country[data-code="'+code+'"]').dataset.owned='true';addEvent(`${c.name} foi anexada ao território`);showToast(`${c.name} anexada`)}buildRelations();updateUI();}

$$('.country').forEach(p=>p.onclick=()=>{const code=p.dataset.code;if(countries[code]){$('#nationName').dataset.hover=countries[code].name;showToast(countries[code].name+' • PIB '+fmtGDP(countries[code].gdp));}});
let zoom=1;$('#zoomIn').onclick=()=>{zoom=Math.min(2,zoom+.2);$('#mapZoom').style.transform=`scale(${zoom})`;$('#mapZoom').style.transformOrigin='center'};$('#zoomOut').onclick=()=>{zoom=Math.max(.8,zoom-.2);$('#mapZoom').style.transform=`scale(${zoom})`;$('#mapZoom').style.transformOrigin='center'};
$('#pauseBtn').onclick=()=>{state.paused=!state.paused;$('#pauseBtn').textContent=state.paused?'▶':'Ⅱ'};$('#speedBtn').onclick=()=>{state.speed=state.speed===1?2:state.speed===2?4:1;$('#speedBtn').textContent=state.speed+'×'};
setInterval(()=>{if(!state.player||state.paused)return;state.month+=state.speed;if(state.month%1===0){const p=state.player;p.gdp*=1+p.growth/100/12;p.treasury+=p.gdp*p.growth/100/12*100-p.gdp*.0008;p.inflation+= (Math.random()-.52)*.04;p.unemployment+=(Math.random()-.5)*.04;p.approval+=(Math.random()-.5)*.08;const month=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][state.month%12];$('#dateLabel').textContent=month+' '+(2026+Math.floor(state.month/12));if(state.month%12===0)addEvent('Relatório anual publicado');updateUI()}},1200);
buildCards();
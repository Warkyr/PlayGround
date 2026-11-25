/* =========================================================================
   AURORA PARTIDA — story, acts, quests, set pieces
   ========================================================================= */
'use strict';

/* --------------------------------------------------------------- helpers */
function storyRefresh() {
  if (typeof refreshWorldEntities === 'function') refreshWorldEntities();
}
function storySave() { saveGame(true); }

function storyEnsureLevel(id, level) {
  const h = heroById(id);
  if (!h) return;
  levelUpTo(h, level);
}

function storyHealAll(ratio) {
  const r = ratio == null ? 1 : ratio;
  for (const h of G.state.party) {
    h.hp = Math.max(1, Math.min(h.maxHp, Math.round(h.hp + h.maxHp * r)));
    h.mp = Math.max(0, Math.min(h.maxMp, Math.round(h.mp + h.maxMp * r)));
  }
}

function storyHasBrann() { return !!heroById('brann'); }

function storyJoinBrann() {
  if (storyHasBrann()) return;
  const rowan = heroById('rowan');
  const lvl = Math.max(4, rowan ? rowan.level : 4);
  const brann = makeHero('brann', lvl);
  brann.hp = brann.maxHp;
  brann.mp = brann.maxMp;
  G.state.party.push(brann);
}

/* --------------------------------------------------------------- intro */
async function storyIntro() {
  const s = G.state;
  if (!s || s.flags.introDone) return;
  s.flags.introDone = true;
  G.cutscene = true;
  showBanner('ATO I — A PROMESSA', 'Onde o trigo aprende o nome do vento');
  await wait(700);
  await say('Narrador', 'Há um reino chamado Valdoria, onde o sol nasce atrás de montanhas que ninguém sabe nomear.');
  await say('Narrador', 'Na Aldeia de Aurora, um jovem chamado Rowan aprendeu duas verdades: que a terra responde a mãos honestas, e que o amor pode ser a mais bela das armadilhas.');
  await say('Narrador', 'Hoje é o Festival da Colheita. Hoje, ele pretende pedir Líria em casamento.');
  await say('Narrador', 'Ele ainda não sabe que, antes da próxima lua, terá perdido tudo — e que a aurora só nasce depois da noite mais escura.');
  setObjective('Fale com Líria na praça da aldeia.', true);
  toast('Explore a aldeia. Fale com todos.', { icon: '✦', dur: 3.4 });
  G.cutscene = false;
  storySave();
}

/* ------------------------------------------------------------ map entries */
async function storyOnEnterMap(mapId) {
  const s = G.state;
  if (!s) return;
  storyRefresh();

  if (mapId === 'capital') {
    if (s.flags.darkCapital) {
      if (!s.flags.darkCapitalSeen) await darkCapitalArrival();
    } else if (s.flags.gaveFlower && !s.flags.arrivedCapital) {
      await capitalArrival();
    }
  }

  if (mapId === 'castelo') {
    if (s.flags.darkCapital && !s.flags.castleDarkSeen) await castleDarkArrival();
    else if (s.flags.arrivedCapital && !s.flags.betrayed && !s.flags.ceremonyStarted) await ceremony();
  }

  if (mapId === 'calabouco' && s.flags.act2Started && !s.flags.prisonWake) await prisonWake();
  if (mapId === 'templo' && !s.flags.templeArrived) await templeArrival();

  storyRefresh();
}

/* ------------------------------------------------------------ act I -> II */
async function capitalArrival() {
  const s = G.state;
  if (s.flags.arrivedCapital) return;
  G.cutscene = true;
  s.flags.arrivedCapital = true;
  showBanner('CAPITAL DE VALDORIA', 'Onde todas as coroas pesam');
  await wait(600);

  await say('Narrador', 'A Capital de Valdoria ergue-se como uma promessa de pedra: torres, bandeiras e gente demais olhando para o alto.');
  await say('Líria', 'Nunca vi tantas bandeiras juntas. É como se o reino inteiro estivesse acordado ao mesmo tempo.');
  await say('Kael', 'E todas parecem apontar para você, Rowan. O herói de Aurora. Quem diria?');
  await say('Rowan', 'Ainda somos os mesmos. Só viemos entregar a colheita e ouvir o rei.');
  await say('Kael', 'Claro. Os mesmos. Sempre os mesmos.');
  await say('Guarda', 'Rowan de Aurora? O Rei Alaric o aguarda no Salão do Trono. Ele não gosta de esperar.');
  await say('Líria', 'Vá. Nós estaremos aqui quando você descer.');
  await say('Narrador', 'Kael não diz nada. Apenas sorri para a multidão, como se já conhecesse o caminho até o trono.');
  setObjective('Apresente-se ao Rei Alaric no castelo ao norte.', true);
  journal('Chegamos à Capital. O Rei Alaric quer receber Rowan no Salão do Trono.');
  toast('O castelo fica ao norte da praça.', { icon: '✦', dur: 3.4 });
  storySave();
  G.cutscene = false;
}

async function ceremony() {
  const s = G.state;
  if (s.flags.ceremonyStarted) return;
  s.flags.ceremonyStarted = true;
  s.flags.betrayed = true;
  G.cutscene = true;
  storyEnsureLevel('rowan', 4);
  storyHealAll(1);

  await say('Narrador', 'O Salão do Trono cheira a cera, veludo e segredos antigos. O Rei Alaric observa Rowan como quem mede uma lâmina.');
  await say('Rei Alaric', 'Rowan de Aurora. A Lâmina da Aurora escolheu um camponês para carregar sua luz. Isso não acontecia desde os tempos do primeiro guardião.');
  await say('Rowan', 'Majestade, eu só vim trazer a colheita. Não sei nada sobre lâminas.');
  await say('Rei Alaric', 'Ninguém sabe, no começo. Você será o novo Guardião da Aurora. E, com a bênção do reino, desposará Líria de Aurora.');
  await say('Líria', 'Majestade... que honra.');
  await say('Kael', 'Majestade, antes que o juramento seja feito, há algo que o senhor precisa ver.');
  await say('Narrador', 'Kael avança. Na mão, um selo real partido. Atrás dele, dois guardas carregam uma carta com o sinete do norte.');
  await say('Kael', 'Foi encontrado na bolsa do “herói”. Ele planejava entregar a relíquia ao inimigo. A guerra seria a porta dele para o trono.');
  await say('Rowan', 'Isso é mentira. Kael, eu nunca...');
  await say('Líria', 'Eu vi, Rowan. Eu vi você esconder o selo.');
  await say('Rowan', 'Líria... olhe para mim. Diga isso olhando nos meus olhos.');
  await say('Narrador', 'Ela olha. Por um instante, os olhos dela são os mesmos do festival — molhados, assustados. Depois, viram pedra.');
  await say('Líria', 'Eu vi.');
  await say('Rei Alaric', 'Guardas. Levem-no ao Abismo. Que a escuridão o ensine a mentir melhor.');
  await say('Kael', 'Deveria ter ficado na aldeia, Rowan. Heróis morrem cedo demais.');
  await say('Narrador', 'A última coisa que Rowan vê antes da escuridão é o sorriso de Kael — e o rosto de Líria, molhado de lágrimas que não conseguem mentir.');

  s.act = 2;
  s.flags.act2Started = true;
  setObjective('Sobreviva ao Abismo e encontre uma saída.', true);
  journal('Kael e Líria armaram uma traição. Rowan foi lançado ao Abismo sob a acusação de traição.');
  showBanner('ATO II — O ABISMO', 'Onde o reino guarda o que prefere esquecer');
  await wait(900);
  storySave();
  await travelTo('calabouco', 4, 2, 'down', { silent: true, music: 'prison' });
}

async function prisonWake() {
  const s = G.state;
  if (s.flags.prisonWake) return;
  s.flags.prisonWake = true;
  G.cutscene = true;
  storyEnsureLevel('rowan', 4);
  storyHealAll(1);

  await say('Narrador', 'Você acorda com gosto de ferro na boca. O chão é frio. A escuridão tem cheiro de mofo e sal.');
  await say('Brann', 'Respire, garoto. O Abismo não gosta de gente que acorda depressa.');
  await say('Rowan', 'Onde... onde estou?');
  await say('Brann', 'Onde os reis guardam os inocentes. Eu sou Brann. Já fui capitão da Guarda Real. Agora sou vizinho de cela.');
  await say('Brann', 'Seu amigo Kael pagou bem para você apodrecer aqui. A moça também. A cara dela tremia, mas a voz não.');
  await say('Rowan', 'Líria não faria isso.');
  await say('Brann', 'Todo homem diz isso no primeiro dia. No segundo, começa a lembrar das coisas que não quis ver.');
  await say('Brann', 'Há uma espada velha na sala dos guardas, a leste. Era do seu pai, não era? Pegue-a. E depois venha arrancar estas grades comigo.');
  setObjective('Encontre a espada do seu pai na sala dos guardas, a leste.', true);
  journal('Brann, o velho capitão, está na cela ao lado. A espada do pai de Rowan está a leste.');
  toast('Brann está na cela ao leste. A espada, além.', { icon: '✦', dur: 3.6 });
  storySave();
  G.cutscene = false;
}

async function templeArrival() {
  const s = G.state;
  if (s.flags.templeArrived) return;
  s.flags.templeArrived = true;
  s.flags.act3Started = true;
  s.act = 3;
  G.cutscene = true;
  storyEnsureLevel('rowan', 7);
  if (storyHasBrann()) storyEnsureLevel('brann', 6);
  storyHealAll(1);

  showBanner('ATO III — A PROVAÇÃO', 'O que o tempo não conseguiu esquecer');
  await wait(800);
  await say('Narrador', 'O Templo da Aurora não tem teto. A luz entra por frestas que parecem costelas de pedra, e o silêncio tem peso.');
  await say('Brann', 'Este lugar foi construído antes dos reis. A Lâmina da Aurora dorme aqui. Ou dormia, até o reino começar a apodrecer.');
  await say('Rowan', 'Como eu encontro uma lâmina que não quer ser encontrada?');
  await say('Brann', 'Você não encontra. Você prova. Acenda as duas runas. O guardião decide o resto.');
  await say('Voz', 'DUAS LUZES. UMA ESCOLHA. A CHAMA QUE NÃO É SÓ RAIVA.');
  setObjective('Acenda as duas runas do templo.', true);
  journal('No Templo da Aurora, Brann disse que a lâmina só responde a quem prova seu valor.');
  toast('As runas brilham nos cantos do templo.', { icon: '✦', dur: 3.6 });
  storySave();
  G.cutscene = false;
}

/* -------------------------------------------------------------- act IV */
async function darkCapitalArrival() {
  const s = G.state;
  if (s.flags.darkCapitalSeen) return;
  s.flags.darkCapitalSeen = true;
  s.act = 4;
  G.cutscene = true;
  storyEnsureLevel('rowan', 10);
  if (storyHasBrann()) storyEnsureLevel('brann', 9);
  storyHealAll(1);

  showBanner('ATO IV — A AURORA', 'Toda aurora começa no escuro');
  await wait(800);
  await say('Narrador', 'Valdoria ainda está de pé. Mas as janelas estão vazias, as bandeiras queimadas e o céu tem a cor de uma ferida antiga.');
  await say('Brann', 'Kael tomou a relíquia. Sem ela, o Vazio entrou pela porta que ele abriu.');
  await say('Rowan', 'E Líria?');
  await say('Brann', 'Ela está perto da praça. Não sei se é uma alma penada ou uma mulher tentando lembrar como se pede perdão.');
  setObjective('Encontre Líria perto da praça e siga até o castelo.', true);
  journal('A Capital caiu. Kael tomou a relíquia. Líria espera perto da praça.');
  toast('Líria está perto da fonte.', { icon: '✦', dur: 3.6 });
  storySave();
  G.cutscene = false;
}

async function castleDarkArrival() {
  const s = G.state;
  if (s.flags.castleDarkSeen) return;
  s.flags.castleDarkSeen = true;
  G.cutscene = true;
  await say('Narrador', 'O Salão do Trono está partido. O teto deixou entrar a noite, e o trono flutua sobre rachaduras que respiram.');
  await say('Brann', 'Kael está no alto. E aquilo atrás dele... não é mais só um homem.');
  await say('Rowan', 'Então eu subo.');
  setObjective('Enfrente Kael no trono.', true);
  storySave();
  G.cutscene = false;
}

async function liriaRuinsDialogue() {
  const s = G.state;
  if (s.flags.metLiriaRuins) {
    if (s.flags.mercy === 1) await say('Líria (ruínas)', 'Eu não mereço isso. Mas vou carregar sua escolha comigo, todos os dias.');
    else await say('Líria (ruínas)', 'Eu sei. Não precisa dizer de novo. Vá. Kael está no trono.');
    return;
  }
  G.cutscene = true;
  await say('Narrador', 'Líria está sentada na borda da fonte seca. O vestido do festival virou trapo. A flor no cabelo, seca, ainda está lá.');
  await say('Líria (ruínas)', 'Rowan. Você está vivo.');
  await say('Rowan', 'Você sabia que eu estava vivo quando me vendeu?');
  await say('Líria (ruínas)', 'Eu sabia que Kael não teria coragem de matar você. Ele precisava que você vivesse derrotado. Era a parte mais importante do plano dela.');
  await say('Rowan', 'Dele.');
  await say('Líria (ruínas)', 'Meu também. Eu disse que vi o selo. Eu disse olhando nos seus olhos.');
  await say('Narrador', 'Ela ergue o rosto. Não há desculpa ali. Só cansaço, e a ruína de alguém que aprendeu tarde demais o preço do próprio desejo.');
  await say('Líria (ruínas)', 'Ele prometeu que o reino seria nosso. Que eu não precisaria esperar por um herói que morre jovem. Eu quis acreditar. Eu quis tanto...');
  await say('Rowan', 'E agora?');
  await say('Líria (ruínas)', 'Agora ele tem a relíquia e o Vazio tem ele. Não há mais reino para dividir.');
  const choice = await ask('Líria (ruínas)', 'Rowan... você consegue me perdoar?', [
    'Não. Mas vou impedir que isso defina o resto da minha vida.',
    'Sim. Não hoje, talvez. Mas sim.'
  ]);
  s.flags.mercy = choice;
  s.flags.metLiriaRuins = true;
  if (choice === 1) {
    if (!s.items.elixir) s.items.elixir = 0;
    s.items.elixir++;
    toast('Líria lhe entregou um Elixir.', { icon: '✚' });
  }
  await say('Líria (ruínas)', choice === 1 ? 'Eu vou lembrar disso. Mesmo que você mude de ideia amanhã.' : 'Eu entendo. Só... termine o que ele começou. E não morra.');
  setObjective('Entre no Salão do Trono. Kael espera no alto.', true);
  journal(choice === 1 ? 'Líria pediu perdão. Rowan escolheu perdoar — por ele, não por ela.' : 'Líria pediu perdão. Rowan escolheu não perdoar, mas seguir em frente.');
  storySave();
  G.cutscene = false;
}

async function kaelConfrontation() {
  const s = G.state;
  if (s.flags.kaelFightStarted || s.flags.kaelDefeated) return;
  s.flags.kaelFightStarted = true;
  G.cutscene = true;
  await say('Kael', 'Deveria ter ficado no buraco, Rowan. Lá pelo menos você era útil: uma história triste para as pessoas terem medo.');
  await say('Rowan', 'Você tinha tudo, Kael. Meu nome, minha confiança, o reino. Por que?');
  await say('Kael', 'Porque tudo o que eu tinha era emprestado de você! A espada, a glória, até o jeito como Líria olhava para o horizonte. Eu era o amigo. O segundo. Sempre o segundo.');
  await say('Líria (ruínas)', 'Kael, chega. Você prometeu que ele ficaria vivo.');
  await say('Kael', 'Eu menti. Como você mentiu para ele. Como o reino mente para si mesmo todos os dias.');
  await say('Narrador', 'Kael ergue a espada do reino. A relíquia pulsa no peito dele como um segundo coração — e o ar começa a rasgar.');
  await say('Rowan', 'Então eu vou tirar o reino das suas costas.');
  const result = await startBattle({
    enemies: ['kael'],
    bg: 'throne',
    canFlee: false,
    title: 'KAEL, O USURPADOR',
    quote: '“Deveria ter ficado no buraco, Rowan.”',
    restoreMusic: 'castle',
    phase2: {
      enemies: ['arauto'],
      bonusXp: 220,
      heal: .45,
      banner: 'O VAZIO RESPONDE',
      quote: 'A coroa se parte. Algo antigo desperta.',
      dialogue: [
        { speaker: 'Kael', text: 'Não... a relíquia é minha! O pacto era meu!', mood: 'angry' },
        { speaker: 'Voz', text: 'O pacto não pertence a homens famintos. Ele pertence ao vazio.' },
        { speaker: 'Kael', text: 'Se eu não posso ter o reino... ninguém terá!' }
      ]
    }
  });
  if (result !== 'win') return;
  s.flags.kaelDefeated = true;
  s.flags.kaelDefeatedAt = true;
  storyRefresh();
  storySave();
  await finalScene();
}

async function finalScene() {
  const s = G.state;
  G.cutscene = true;
  storyHealAll(1);
  await say('Narrador', 'Kael cai de joelhos. A relíquia se desfaz em cinza dourada. O Vazio recua, como uma maré que se envergonha.');
  await say('Kael', 'Eu só queria... o que você tinha.');
  await say('Rowan', 'Você tinha tudo, Kael. Só não sabia.');
  await say('Narrador', 'Ele tenta rir. O som sai quebrado. Líria se ajoelha ao lado dele, mas Kael já não olha para ninguém.');
  await say('Líria (ruínas)', 'Rowan... o que acontece agora?');
  let choice = s.flags.mercy;
  if (choice !== 0 && choice !== 1) {
    choice = await ask('Líria (ruínas)', 'Rowan... você consegue me perdoar?', [
      'Não. Mas vou impedir que isso defina o resto da minha vida.',
      'Sim. Não hoje, talvez. Mas sim.'
    ]);
    s.flags.mercy = choice;
  }
  await say('Narrador', 'O sol começa a subir atrás das torres partidas. Pela primeira vez em muito tempo, Valdoria não parece um túmulo.');
  journal(choice === 1 ? 'O Vazio foi selado. Rowan escolheu perdoar Líria.' : 'O Vazio foi selado. Rowan escolheu seguir em frente sem perdoar Líria.');
  storySave();
  startEnding(choice);
}

/* ---------------------------------------------------------- interactions */
async function storyInteractNPC(npc) {
  const s = G.state;
  if (!s || G.cutscene) return;
  const id = npc.id;

  switch (id) {
    case 'liria':
      if (s.flags.gaveFlower) {
        if (!s.flags.afterFestival) {
          s.flags.afterFestival = true;
          await say('Líria', 'Amanhã você parte para a capital. Prometa que volta.');
          await say('Rowan', 'Volto antes da próxima colheita. Com uma história que você vai odiar.');
          await say('Líria', 'Então eu vou fingir que odeio. Mas vou guardar cada palavra.');
          setObjective('Viaje ao norte, até a Capital de Valdoria.', true);
          storySave();
        } else {
          await say('Líria', 'Vá. Eu estarei aqui quando você voltar.');
        }
      } else if (s.flags.hasFlower) {
        s.flags.gaveFlower = true;
        G.cutscene = true;
        await say('Líria', 'Você conseguiu. A Flor da Aurora... ela é ainda mais bonita do que eu lembrava.');
        await say('Narrador', 'Líria prende a flor no cabelo. A luz da tarde faz o ouro parecer vivo.');
        await say('Rowan', 'Líria, eu... quero passar todos os amanheceres com você.');
        await say('Líria', 'E eu quero que você volte de todos eles.');
        await say('Narrador', 'Ao longe, Kael observa. Não aplaude.');
        await say('Kael', 'Que bonito. Espero que dure.');
        s.flags.afterFestival = true;
        if (!s.items.elixir) s.items.elixir = 0;
        s.items.elixir++;
        setObjective('Viaje ao norte, até a Capital de Valdoria.', true);
        toast('Líria lhe entregou um Elixir.', { icon: '✚' });
        journal('No Festival da Colheita, Rowan pediu Líria em casamento. Kael observou de longe.');
        showBanner('A PROMESSA', 'Antes da aurora, sempre há uma noite');
        await wait(700);
        storySave();
        G.cutscene = false;
      } else if (s.flags.metLiria) {
        await say('Líria', 'A Flor da Aurora cresce perto do velho carvalho, do outro lado da ponte. Não vá pela estrada dos lobos.');
        await say('Rowan', 'Eu já enfrentei pior. Já cai de um telhado.');
        await say('Líria', 'Foi por minha causa. E eu ainda não pedi desculpas.');
      } else {
        s.flags.metLiria = true;
        s.flags.questFlower = true;
        G.cutscene = true;
        await say('Líria', 'Rowan! Você veio. Pensei que as ovelhas tivessem decidido ficar com você.');
        await say('Rowan', 'Elas tentaram. Mas eu prometi dançar com você no festival.');
        await say('Líria', 'Então me traga a Flor da Aurora. Ela só floresce nos Campos, do outro lado do rio.');
        await say('Líria', 'Dizem que quem a colhe ao amanhecer tem um pedido atendido.');
        await say('Rowan', 'E qual pedido você faria?');
        await say('Líria', 'Um que envolve você. Vá.');
        setObjective('Colha a Flor da Aurora nos Campos de Solmar.', true);
        journal('Líria pediu a Flor da Aurora. Ela cresce nos Campos de Solmar, a oeste da ponte.');
        toast('Saia da aldeia pelo norte e atravesse a ponte.', { icon: '✦', dur: 3.6 });
        storySave();
        G.cutscene = false;
      }
      break;

    case 'kael':
      if (!s.flags.metKael) {
        s.flags.metKael = true;
        await say('Kael', 'Rowan, meu irmão de armas. Vai mesmo se casar? A vida de um herói termina ali, sabia?');
        await say('Rowan', 'Ou começa. Depende de quem fica esperando.');
        await say('Kael', 'Ouvi dizer que o Rei procura um campeão. Talvez eu vá. Talvez nós dois.');
        if (!s.flags.kaelGift) {
          s.flags.kaelGift = true;
          s.items.pocao = (s.items.pocao || 0) + 1;
          toast('Kael lhe deu uma Poção.', { icon: '✚' });
        }
      } else if (s.flags.gaveFlower) {
        await say('Kael', 'A flor, a moça, a glória... Você sempre foi o sortudo. Deixe alguma coisa para mim.');
        await say('Rowan', 'O que você quer, Kael?');
        await say('Kael', 'Nada. Ainda.');
      } else {
        await say('Kael', 'A ponte ao norte leva aos Campos. Se ouvir uivos, não corra na direção deles.');
        await say('Rowan', 'Conselho de amigo?');
        await say('Kael', 'Conselho de alguém que já correu.');
      }
      break;

    case 'elder':
      if (!s.flags.metElder) {
        s.flags.metElder = true;
        await say('Ancião', 'Rowan. O festival é sobre gratidão, não sobre pressa.');
        await say('Ancião', 'A aurora não escolhe os fortes. Escolhe os que voltam.');
        await say('Ancião', 'Leve estas poções. E leve também os olhos abertos. Às vezes, o perigo dorme à nossa mesa.');
        s.items.pocao = (s.items.pocao || 0) + 2;
        toast('Você recebeu 2 Poções.', { icon: '✚' });
        journal('O Ancião avisou: a aurora escolhe os que voltam.');
      } else if (s.flags.gaveFlower) {
        await say('Ancião', 'Vá com cuidado, menino. O ouro da capital brilha, mas não aquece.');
      } else {
        await say('Ancião', 'A Flor da Aurora não gosta de mãos apressadas. Vá devagar, e ela virá.');
      }
      break;

    case 'child':
      if (s.flags.gaveFlower) await say('Criança', 'Você vai casar com a Líria? Ela é a pessoa mais bonita da aldeia. Depois de mim.');
      else if (s.flags.metKael) await say('Criança', 'O Kael treina com a espada todas as noites. Ele diz que um dia vai ser mais famoso que você.');
      else await say('Criança', 'Quando eu crescer, quero ser herói. Ou padeiro. Herói dá menos sono.');
      break;

    case 'merchant':
    case 'merchant_cap':
      await openShop();
      break;

    case 'brann_cell':
      await brannCellDialogue();
      break;

    case 'brann_free':
      await say('Brann', 'Estou com você. Vamos sair deste buraco antes que ele decida ficar.');
      break;

    case 'guard_a':
    case 'guard_b':
      if (!s.flags.guardsDefeated) await guardBattle();
      else await say('Guarda', 'O corredor está limpo. O carcereiro, não.');
      break;

    case 'warden':
      if (!s.flags.brannJoined) await say('Gorran', 'Volte quando tiver alguém para morrer por você.');
      else if (!s.flags.guardsDefeated) await say('Gorran', 'Meus guardas ainda respiram. Volte quando não respirarem.');
      else if (!s.flags.wardenDefeated) await wardenBattle();
      break;

    case 'brann_temple':
      if (!s.flags.guardianDefeated) await say('Brann', 'As runas estão esperando. Não faça o guardião esperar mais do que o necessário.');
      else if (!s.flags.hasBlade) await say('Brann', 'O altar está aberto. Vá. Eu seguro a porta.');
      else await say('Brann', 'A lâmina é sua. O que você faz com ela, não.');
      break;

    case 'liria_ruins':
      await liriaRuinsDialogue();
      break;

    case 'liria_final':
      if (!s.flags.kaelDefeated) {
        await say('Líria (ruínas)', 'Kael está no trono. Ele já não é o homem que eu conheci. Se ainda existe alguma parte dele lá dentro, não vai pedir licença para sair.');
        await say('Rowan', 'E você?');
        await say('Líria (ruínas)', 'Eu fico. Alguém precisa lembrar o nome das pessoas que este reino esqueceu.');
      }
      break;

    case 'kael_final':
      if (!s.flags.kaelDefeated) await kaelConfrontation();
      break;

    case 'liria_cap':
      await say('Líria', 'A capital é barulhenta. Sinto falta do vento da aldeia.');
      await say('Rowan', 'Depois do juramento, voltamos.');
      await say('Líria', 'Depois do juramento.');
      break;

    case 'kael_cap':
      await say('Kael', 'Olhe para isso, Rowan. Toda essa gente veio ver você. Amanhã, vão ver outro.');
      await say('Rowan', 'Talvez. Mas hoje eu ainda estou aqui.');
      break;

    case 'noble':
      await say('Nobre', 'Dizem que Kael foi visto com o guardião do selo real. Três vezes esta semana. Estranho, não?');
      break;

    case 'noble_a':
      await say('Nobre', 'O Rei envelheceu. O reino também.');
      break;

    case 'noble_b':
      await say('Nobre', 'A Lâmina da Aurora... minha avó dizia que ela canta quando o portador está prestes a falhar.');
      break;

    case 'king':
      await say('Rei Alaric', 'Aproxime-se, Rowan de Aurora. O reino precisa de nomes novos.');
      break;

    case 'guard_hall':
      await say('Guarda', 'O Salão está fechado para julgamentos. Ninguém entra sem ordem do Rei.');
      break;

    default:
      await say('Narrador', 'Ele não parece querer conversar.');
      break;
  }

  storyRefresh();
}

async function brannCellDialogue() {
  const s = G.state;
  if (!s.flags.hasSwordParsed) {
    await say('Brann', 'A espada do seu pai está na sala dos guardas, a leste. Passe pelas grades e siga o corredor.');
    await say('Brann', 'Não é uma relíquia. É uma ferramenta. Ferramentas servem para sair de buracos.');
    if (!s.flags.toldSword) {
      s.flags.toldSword = true;
      setObjective('Pegue a espada do seu pai, a leste.', true);
      storySave();
    }
    return;
  }
  if (!s.flags.escapedCell) {
    const choice = await ask('Brann', 'Agora arranque estas grades. Eu ainda tenho força para uma última porta. Você vem comigo?', [
      'Vamos sair juntos.',
      'Ainda não.'
    ]);
    if (choice !== 0) { await say('Brann', 'O Abismo espera. Ele é bom nisso.'); return; }
    G.cutscene = true;
    s.flags.escapedCell = true;
    s.flags.brannJoined = true;
    storyJoinBrann();
    await say('Narrador', 'Brann agarra as barras com as duas mãos. Os ferros gemem — e cedem com um estalo que ecoa pelo corredor.');
    await say('Brann', 'Pronto. Agora somos dois velhos problemas para o carcereiro.');
    await say('Rowan', 'Eu tenho vinte anos.');
    await say('Brann', 'Eu tenho histórias. É quase a mesma coisa.');
    setObjective('Derrote os guardas do corredor e alcance o portão leste.', true);
    journal('Brann se juntou a Rowan. O carcereiro Gorran guarda a saída leste.');
    toast('Brann se juntou ao grupo!', { icon: '✦', dur: 3.4 });
    showBanner('O VELHO CAPITÃO', 'Uma última porta, uma última lâmina');
    await wait(600);
    storySave();
    storyRefresh();
    G.cutscene = false;
    return;
  }
  await say('Brann', 'O portão leste. O carcereiro tem a chave. Ou a marreta. Depende do humor dele.');
}

async function guardBattle() {
  const s = G.state;
  if (s.flags.guardsDefeated || G.cutscene) return;
  G.cutscene = true;
  await say('Guarda', 'Pare aí, prisioneiro!');
  await say('Brann', 'Eles treinam a vida toda para dizer isso. Não decepcione.');
  const result = await startBattle({
    enemies: ['guarda', 'guarda'],
    bg: 'dungeon',
    canFlee: false,
    title: 'OS GUARDAS DO ABISMO',
    quote: '“Voltem para as celas. Ou não voltem.”',
    restoreMusic: 'prison',
    loot: [{ item: 'pocao', n: 1 }]
  });
  if (result !== 'win') return;
  s.flags.guardsDefeated = true;
  setObjective('Encontre Gorran, o carcereiro, a leste.', true);
  storyHealAll(.25);
  journal('Os guardas do corredor foram derrotados.');
  storySave();
  storyRefresh();
  G.cutscene = false;
}

async function wardenBattle() {
  const s = G.state;
  if (s.flags.wardenDefeated || G.cutscene) return;
  G.cutscene = true;
  await say('Gorran', 'Kael pagou bem para você apodrecer aqui, sabia? Até mandou um recado: “que ele veja o sol nascer uma última vez, e entenda que não é para ele.”');
  await say('Brann', 'Gorran. Ainda batendo em gente menor que você?');
  await say('Gorran', 'Brann. Ainda vivo? Vou corrigir isso.');
  const result = await startBattle({
    enemies: ['capataz'],
    bg: 'dungeon',
    canFlee: false,
    title: 'GORRAN, O CARCEREIRO',
    quote: '“O Abismo não devolve ninguém.”',
    restoreMusic: 'prison',
    loot: [{ item: 'pocaoMaior', n: 2 }, { item: 'eter', n: 1 }]
  });
  if (result !== 'win') return;
  s.flags.wardenDefeated = true;
  s.flags.escapedCell = true;
  storyEnsureLevel('rowan', 7);
  if (storyHasBrann()) storyEnsureLevel('brann', 6);
  storyHealAll(.4);
  setObjective('Alcance o portão a leste e deixe o Abismo.', true);
  journal('Gorran caiu. O portão leste do Abismo está livre.');
  showBanner('O ABISMO SE ABRE', 'Toda porta tem um lado de fora');
  toast('O portão leste está livre.', { icon: '✦', dur: 3.6 });
  storySave();
  storyRefresh();
  G.cutscene = false;
}

/* ---------------------------------------------------------------- temple */
function lightRune(x, y) {
  const s = G.state;
  if (!s || !s.flags.templeArrived || s.flags.hasBlade) return;
  const isA = x === 7;
  if (isA && s.flags.runeA) return;
  if (!isA && s.flags.runeB) return;
  if (isA) s.flags.runeA = true; else s.flags.runeB = true;
  AUDIO.sfx('magic');
  toast(isA ? 'A runa oeste acendeu.' : 'A runa leste acendeu.', { icon: '✦' });
  if (s.flags.runeA && s.flags.runeB) {
    guardianTrial();
  } else {
    setObjective('Acenda a outra runa do templo.', true);
    storySave();
  }
}

async function guardianTrial() {
  const s = G.state;
  if (s.flags.trialStarted || s.flags.guardianDefeated) return;
  s.flags.trialStarted = true;
  G.cutscene = true;
  await wait(500);
  await say('Voz', 'DUAS LUZES. UMA ESCOLHA.');
  await say('Narrador', 'O chão treme. Uma figura de pedra se ergue do altar, com veios de luz correndo pelas rachaduras como sangue antigo.');
  await say('Guardião de Pedra', 'PROVE QUE SUA CHAMA NÃO É SÓ RAIVA.');
  const result = await startBattle({
    enemies: ['guardiao'],
    bg: 'temple',
    canFlee: false,
    title: 'GUARDIÃO DE PEDRA',
    quote: '“PROVE QUE SUA CHAMA NÃO É SÓ RAIVA.”',
    restoreMusic: 'temple'
  });
  if (result !== 'win') return;
  s.flags.guardianDefeated = true;
  storyEnsureLevel('rowan', 8);
  if (storyHasBrann()) storyEnsureLevel('brann', 7);
  storyHealAll(1);
  setObjective('Aproxime-se do altar no norte do templo.', true);
  journal('O Guardião de Pedra foi derrotado. O altar da Aurora está aberto.');
  toast('O altar da Aurora está aberto.', { icon: '✦', dur: 3.6 });
  storySave();
  storyRefresh();
  G.cutscene = false;
}

async function bladeScene() {
  const s = G.state;
  if (s.flags.hasBlade || s.flags.bladeSceneStarted) return;
  s.flags.bladeSceneStarted = true;
  G.cutscene = true;
  await say('Narrador', 'O altar se abre como uma flor de pedra. Dentro, a Lâmina da Aurora dorme — ou finge dormir.');
  await say('Voz', 'A LÂMINA NÃO PERTENCE A QUEM VENCE. PERTENCE A QUEM VOLTA.');
  await say('Rowan', 'Eu voltei. Não pelo reino. Por mim.');
  await say('Narrador', 'A espada se ergue sozinha. A luz atravessa as mãos de Rowan e queima as sombras que ele carregou até ali.');
  s.flags.hasBlade = true;
  const rowan = heroById('rowan');
  if (rowan) {
    rowan.atk += 6;
    rowan.def += 3;
    rowan.mag += 4;
    if (!rowan.skills.includes('julgamento')) rowan.skills.push('julgamento');
    rowan.hp = rowan.maxHp;
    rowan.mp = rowan.maxMp;
  }
  AUDIO.sfx('levelup');
  showBanner('A LÂMINA DA AURORA', 'A luz não apaga a dor. Ensina a carregá-la.');
  await wait(800);

  await say('Eco', 'Você me amou, Rowan. E eu te vendi.');
  await say('Rowan', 'Você não é ela.');
  await say('Eco', 'Sou a parte dela que você ainda carrega. A parte que ainda pergunta: e se tivesse sido diferente?');
  await say('Eco', 'Se você não pode me derrotar, não pode salvar ninguém.');
  const result = await startBattle({
    enemies: ['eco'],
    bg: 'temple',
    canFlee: false,
    title: 'ECO DA TRAIÇÃO',
    quote: '“Você me amou, Rowan. E eu te vendi.”',
    restoreMusic: 'temple',
    phase2: null
  });
  if (result !== 'win') return;
  s.flags.ecoDefeated = true;
  s.flags.darkCapital = true;
  s.act = 4;
  storyEnsureLevel('rowan', 10);
  if (storyHasBrann()) storyEnsureLevel('brann', 9);
  storyHealAll(1);
  await say('Narrador', 'O eco se desfaz em faíscas azuis. Quando a última desaparece, a lâmina canta uma nota que Rowan reconhece: é a canção que Líria cantava no festival.');
  await say('Brann', 'A capital está ardendo. Kael tomou a relíquia, e o Vazio entrou atrás dela.');
  await say('Rowan', 'Então vamos apagar o incêndio.');
  setObjective('Volte à Capital de Valdoria.', true);
  journal('A Lâmina da Aurora foi despertada. A Capital caiu sob o poder de Kael.');
  showBanner('ATO IV — A AURORA', 'Toda aurora começa no escuro');
  storySave();
  await travelTo('capital', 11, 13, 'up', { silent: true, music: 'castle' });
}

/* ---------------------------------------------------------------- random */
async function runRandomEncounter(group, bg) {
  if (!G.state || G.cutscene || G.scene !== 'world') return;
  G.cutscene = true;
  await say('Narrador', 'O mato se move. Algo estava esperando.');
  const result = await startBattle({
    enemies: group,
    bg: bg || 'forest',
    canFlee: true,
    title: 'EMBOSCADA',
    quote: '“O caminho não é de graça.”'
  });
  G.cutscene = false;
  if (G.scene === 'world') {
    storyRefresh();
    storySave();
  }
  return result;
}

/* ------------------------------------------------------------ tile checks */
function storyCheckTile(x, y) {
  const s = G.state;
  if (!s) return false;
  const ch = tileAt(x, y);
  if (G.map === 'campos' && (x === 6 || x === 7) && y === 10 && !s.flags.bridgeAmbush) {
    s.flags.bridgeAmbush = true;
    bridgeAmbush();
    return true;
  }
  if (G.map === 'templo' && ch === '*' && s.flags.templeArrived && !s.flags.hasBlade) {
    lightRune(x, y);
    return true;
  }
  if (G.map === 'calabouco' && ch === 'G' && s.flags.wardenDefeated) {
    leavePrison();
    return true;
  }
  return false;
}

async function bridgeAmbush() {
  if (G.cutscene || G.dialog) return;
  G.cutscene = true;
  await say('Narrador', 'Um uivo rasga o silêncio. Dois pares de olhos acendem entre as árvores.');
  await say('Rowan', 'A ponte é o único caminho. Claro que é.');
  const result = await startBattle({
    enemies: ['lobo', 'lobo'],
    bg: 'forest',
    canFlee: true,
    title: 'A PONTE DO SOLMAR',
    quote: '“A matilha não negocia.”'
  });
  G.cutscene = false;
  if (G.scene === 'world') {
    if (result === 'win') {
      toast('A ponte está livre.', { icon: '✦' });
      setObjective(G.state.flags.hasFlower ? 'Volte a Líria na aldeia.' : 'Colha a Flor da Aurora, a oeste da ponte.', true);
    }
    storyRefresh();
    storySave();
  }
}

async function leavePrison() {
  if (G.cutscene) return;
  G.cutscene = true;
  await say('Narrador', 'O portão cede. O ar lá fora não é mais doce — mas é livre.');
  await say('Brann', 'Não olhe para trás, garoto. O Abismo tem o hábito de chamar pelo nome.');
  await travelTo('templo', 11, 13, 'up', { silent: true, music: 'temple' });
}

/* ---------------------------------------------------------- proximity */
function storyCheckProximity() {
  const s = G.state;
  if (!s || G.map !== 'calabouco' || G.cutscene) return false;
  const p = G.player;
  const px = Math.round(p.x), py = Math.round(p.y);
  const near = (ax, ay, d) => Math.abs(px - ax) <= d && Math.abs(py - ay) <= d;

  if (s.flags.brannJoined && !s.flags.guardsDefeated) {
    if ((s.flags.guardsDefeated !== true) && (near(8, 7, 1) || near(15, 11, 1))) {
      guardBattle();
      return true;
    }
  }
  if (s.flags.brannJoined && s.flags.guardsDefeated && !s.flags.wardenDefeated) {
    if (near(19, 10, 2)) {
      wardenBattle();
      return true;
    }
  }
  return false;
}

/* --------------------------------------------------------------- tiles UI */
function storyTilePrompt(x, y) {
  const s = G.state;
  if (!s) return false;
  const ch = tileAt(x, y);
  if (G.map === 'templo') {
    if (ch === '*' && s.flags.templeArrived && !s.flags.hasBlade) return true;
    if (ch === 'A' && s.flags.guardianDefeated && !s.flags.hasBlade) return true;
  }
  if (G.map === 'calabouco' && ch === 'G') return true;
  return false;
}

async function storyInteractTile(x, y) {
  const s = G.state;
  if (!s || G.cutscene) return false;
  const ch = tileAt(x, y);

  if (G.map === 'templo' && ch === '*') {
    if (!s.flags.templeArrived) return false;
    if (s.flags.hasBlade) { await say('Narrador', 'A runa já cumpriu seu papel.'); return true; }
    lightRune(x, y);
    return true;
  }
  if (G.map === 'templo' && ch === 'A') {
    if (s.flags.hasBlade) { await say('Narrador', 'O altar está vazio. A luz já encontrou um dono.'); return true; }
    if (!s.flags.guardianDefeated) { await say('Voz', 'O ALTAR ESTÁ SELADO. A PEDRA AINDA RESPIRA.'); return true; }
    bladeScene();
    return true;
  }
  if (G.map === 'calabouco' && ch === 'G') {
    if (!s.flags.wardenDefeated) { await say('Narrador', 'O portão está trancado. A chave está com Gorran.'); return true; }
    leavePrison();
    return true;
  }
  return false;
}

/* --------------------------------------------------------------- objects */
async function storyInteractObject(obj) {
  const s = G.state;
  if (!s || G.cutscene) return;

  if (obj.type === 'chest') {
    if (obj.opened) { await say('Narrador', 'O baú está vazio.'); return; }
    const key = G.map + ':' + obj.id;
    s.opened[key] = true;
    obj.opened = true;
    const loot = obj.loot || {};
    const n = loot.n || 1;
    if (loot.item) s.items[loot.item] = (s.items[loot.item] || 0) + n;
    AUDIO.sfx('chest');
    toast(`Encontrado: ${ITEMS[loot.item] ? ITEMS[loot.item].name : 'Tesouro'} x${n}.`, { icon: '✦', color: '#f0d890' });
    journal(`Rowan encontrou ${ITEMS[loot.item] ? ITEMS[loot.item].name : 'um tesouro'} em ${MAPS[G.map].name}.`);
    storySave();
    storyRefresh();
    return;
  }

  if (obj.type === 'flower') {
    if (s.flags.hasFlower || s.flags.gaveFlower) { await say('Narrador', 'A flor já foi colhida.'); return; }
    G.cutscene = true;
    await say('Narrador', 'A Flor da Aurora cresce sozinha num círculo de pedras. As pétalas parecem guardar uma luz que não vem do sol.');
    await say('Rowan', 'Líria disse que ela atende um pedido. Espero que ainda esteja aceitando.');
    s.flags.hasFlower = true;
    setObjective('Volte a Líria na aldeia.', true);
    journal('Rowan colheu a Flor da Aurora.');
    toast('Flor da Aurora colhida.', { icon: '✦', color: '#f0d890', dur: 3.4 });
    AUDIO.sfx('heal');
    storySave();
    storyRefresh();
    G.cutscene = false;
    return;
  }

  if (obj.type === 'story' && obj.id === 'chest_sword') {
    if (s.flags.hasSwordParsed) return;
    G.cutscene = true;
    await say('Narrador', 'A espada está apoiada na parede, coberta de poeira. O punho ainda tem as marcas dos dedos do seu pai.');
    await say('Rowan', 'Você sempre dizia que uma espada não faz um homem. Mas ajuda a sair do buraco.');
    s.flags.hasSwordParsed = true;
    const rowan = heroById('rowan');
    if (rowan) { rowan.atk += 4; rowan.hp = Math.min(rowan.maxHp, rowan.hp + 15); }
    setObjective('Volte a Brann na cela ao oeste.', true);
    journal('Rowan recuperou a espada do pai no Abismo.');
    toast('Espada do seu pai equipada. ATQ +4.', { icon: '⚔', color: '#d8e8ff', dur: 3.4 });
    AUDIO.sfx('levelup');
    storySave();
    storyRefresh();
    G.cutscene = false;
    return;
  }

  if (obj.type === 'sign') {
    await say('Narrador', obj.line || 'As letras foram apagadas pelo tempo.');
    return;
  }

  await say('Narrador', 'Não há nada que valha a pena levar.');
}

/* ---------------------------------------------------------------- shop */
async function openShop() {
  const s = G.state;
  const stock = [
    { key: 'pocao', price: ITEMS.pocao.price },
    { key: 'pocaoMaior', price: ITEMS.pocaoMaior.price },
    { key: 'eter', price: ITEMS.eter.price },
    { key: 'elixir', price: ITEMS.elixir.price }
  ];
  let open = true;
  await say('Mercador', 'Poções, éteres, elixires... tudo o que um herói precisa para não morrer no caminho. Ouro primeiro, história depois.');
  while (open) {
    const opts = stock.map(it => `${ITEMS[it.key].name} — ${it.price} ◈`);
    opts.push('Sair');
    const pick = await ask('Mercador', `O que você quer? Ouro: ${s.gold} ◈`, opts);
    if (pick === stock.length) { open = false; break; }
    const it = stock[pick];
    if (!it) continue;
    if (s.gold < it.price) {
      AUDIO.sfx('error');
      toast('Ouro insuficiente.', { icon: '!', color: '#ffb0a0' });
      continue;
    }
    s.gold -= it.price;
    s.items[it.key] = (s.items[it.key] || 0) + 1;
    AUDIO.sfx('chest');
    toast(`Comprado: ${ITEMS[it.key].name}.`, { icon: '✦', color: '#f0d890' });
    storySave();
  }
  await say('Mercador', 'Volte sempre. Preferencialmente vivo.');
}

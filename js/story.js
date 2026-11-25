// story.js — all narrative scenes, chapter flow and story triggers
import { ui } from './ui.js';
import { audio } from './audio.js';
import { CHAPTERS } from './data.js';

export const TITLE_EXIT = { titleExit: true };

const set = (g, flag, value = true) => { g.flags[flag] = value; };

async function lines(list) {
  for (const l of list) {
    if (Array.isArray(l)) await ui.say(l[0], l[1], l[2]);
    else await ui.say('Narrador', l);
  }
}

async function fight(g, ctx, ids, opts = {}) {
  const res = await ctx.battle(ids, opts);
  if (res === 'title') throw TITLE_EXIT;
  return res;
}

async function finalBattle(g, ctx) {
  if (g.flags.finalStarted) return;
  set(g, 'finalStarted');
  await lines([
    ['Dorian', 'Aí está. O lenhador que virou lenda. A lenda que virou praga.'],
    ['Kael', 'Acabou, Dorian.'],
    ['Dorian', 'Acabou? Eu peguei um reino faminto e dei a ele um inimigo. Peguei uma garota assustada e dei a ela um propósito. Você só sabe destruir.'],
    ['Lyra', 'Você me deu uma corrente e chamou de propósito.'],
    ['Dorian', 'Lyra. Ainda defendendo o homem que te esqueceu?'],
    ['Kael', 'Eu nunca esqueci. Só parei de correr atrás do passado.'],
    ['Dorian', 'Então me mostre o futuro.'],
  ]);
  await fight(g, ctx, ['dorian', 'wraith'], {
    boss: true, bg: 'castle', canFlee: false,
    intro: 'Dorian ergue a Brasa Eterna. O trono se incendeia.',
  });
  set(g, 'dorianDown');
  await lines([
    ['Dorian', 'Você... ainda não entende. A Brasa não pode ser apagada. Ela só troca de dono.'],
    ['Lyra', 'Então eu serei a última.'],
    ['Narrador', 'Lyra segura a Lâmina Aurora. A Brasa Eterna grita — um som que atravessa pedra, carne e memória. E então... silêncio.'],
    ['Dorian', 'Eu só queria... que alguém lembrasse de mim.'],
    ['Kael', 'Eu lembro. É por isso que não vou te perdoar.'],
  ]);
  const choice = await ui.choice('O que Kael leva consigo?', [
    { label: 'Perdoar Lyra. Recomeçar.', value: 'forgive' },
    { label: 'Seguir em frente. Sozinho.', value: 'leave' },
  ]);
  set(g, 'forgaveLyra', choice === 'forgive');
  set(g, 'completed');
  g.completed = true;
  await ui.ending(g);
  return 'title';
}

const SCRIPTS = {
  // ------------------------------------------------------------ CHAPTER I
  async village_intro(g, ctx) {
    if (g.flags.introDone) return;
    set(g, 'introDone');
    ctx.chapter(0);
    await ui.chapterCard(CHAPTERS[0]);
    await lines([
      ['Narrador', 'Brumalva cheira a trigo e fumaça doce. É o Festival da Colheita, e pela primeira vez em três anos Kael tem motivos para sorrir.'],
      ['Kael', 'Se eu demorar mais, Lyra vai jogar minha torta no rio.'],
      ['Narrador', 'Ele não sabe que esta será a última noite em que chamará este lugar de lar.'],
    ]);
    ctx.quest('Encontre Lyra no centro da vila.');
  },

  async lyra_festival(g, ctx) {
    if (g.flags.talkedLyra) {
      await lines([
        ['Lyra', 'Dorian está no norte da praça. E Kael... não demore. Quero conversar depois do festival.'],
      ]);
      return;
    }
    set(g, 'talkedLyra');
    await lines([
      ['Lyra', 'Você veio! Achei que ia passar o festival consertando cercas.'],
      ['Kael', 'Consertei a cerca. Depois a ponte. Depois o telhado do Tolan — e ele ainda me deve três moedas.'],
      ['Lyra', 'Você é impossível.'],
      ['Kael', 'E ainda assim você está aqui.'],
      ['Lyra', 'Ainda estou com o medalhão. Não tiro nem para dormir.'],
      ['Narrador', 'Ela toca o pingente de prata no peito. O metal brilha como se guardasse o calor dela.'],
      ['Lyra', 'Dorian estava procurando você. Disse que tem algo para mostrar no Santuário da Brasa, ao norte.'],
      ['Kael', 'Dorian sempre tem algo para mostrar.'],
      ['Lyra', 'Kael... depois do festival, quero conversar. Sobre nós.'],
    ]);
    ctx.quest('Fale com Dorian, no norte da vila.');
  },

  async dorian_village(g, ctx) {
    if (g.flags.festivalDone) {
      await lines([
        ['Dorian', 'Ao anoitecer, no Santuário. Não conte a ninguém. Nem a Lyra.'],
      ]);
      return;
    }
    set(g, 'festivalDone');
    await lines([
      ['Dorian', 'Kael! O herói do festival. Ainda tem farinha no cabelo.'],
      ['Kael', 'É o preço da glória.'],
      ['Dorian', 'Preciso te mostrar uma coisa no Santuário da Brasa. Algo que muda tudo. Ao anoitecer.'],
      ['Kael', 'Você está estranho.'],
      ['Dorian', 'Estou apenas... ansioso.'],
      ['Narrador', 'Dorian sorri. É o mesmo sorriso de quando eram crianças. Por isso Kael não percebe o que há por trás dele.'],
    ]);
    ctx.quest('Investigue os uivos ao norte da vila.');
  },

  async elder_village(g, ctx) {
    if (g.flags.festivalDone) {
      await lines([
        ['Anciã Maeve', 'Ouvi uivos. A Brasa está inquieta. E Dorian anda perto do santuário demais para o meu gosto.'],
        ['Kael', 'Dorian é meu amigo, Maeve.'],
        ['Anciã Maeve', 'Amizade não é escudo, menino. É uma porta que a gente escolhe deixar aberta.'],
      ]);
      return;
    }
    await lines([
      ['Anciã Maeve', 'Kael. Ainda carregando lenha para todo mundo?'],
      ['Kael', 'Alguém precisa.'],
      ['Anciã Maeve', 'A Brasa Eterna já ardeu por duzentos anos. Enquanto ela queimar, Brumalva não conhece inverno.'],
      ['Kael', 'E se apagar?'],
      ['Anciã Maeve', 'Aí o reino aprende o que é frio de verdade.'],
    ]);
  },

  async merchant_village(g, ctx) {
    await lines([
      ['Tolan', 'Kael! Meu cliente favorito. E o único que me deve três moedas.'],
      ['Kael', 'Considere um investimento no seu futuro.'],
      ['Tolan', 'O futuro paga juros. Veja o que tenho.'],
    ]);
    await ctx.shop(['potion', 'potion2', 'ether', 'antidote', 'bomb', 'smoke'], 'Tolan · Mercador');
  },

  async child_village(g, ctx) {
    await lines([
      ['Pip', 'Kael! Kael! Você vai casar com a Lyra?'],
      ['Kael', 'Quem foi que disse isso?'],
      ['Pip', 'Todo mundo. Menos o Dorian. Ele fica com uma cara estranha quando falam dela.'],
      ['Kael', 'Dorian é só... sério.'],
      ['Pip', 'Sério é quem não sabe rir. Eu não confio em gente que não sabe rir.'],
    ]);
  },

  async garrick_village(g, ctx) {
    await lines([
      ['Garrick', 'Então você é o lenhador que todos chamam de herói.'],
      ['Kael', 'Eu só ajudo as pessoas.'],
      ['Garrick', 'É o que todo herói diz antes de descobrir o preço.'],
      ['Kael', 'Quem é você?'],
      ['Garrick', 'Alguém que já escolheu errado. A espada não faz o homem, garoto. A escolha faz. Lembre disso quando o mundo pedir que você escolha.'],
    ]);
  },

  async villager_village(g, ctx) {
    const who = g.flags.festivalDone
      ? 'Depois do festival, a vila fica quieta demais. Não gosto disso.'
      : 'O festival deste ano está maior! A Brasa deve estar contente.';
    await lines([['Narrador', who]]);
  },

  async guard_gate(g, ctx) {
    if (g.flags.festivalDone) {
      await lines([
        ['Guarda', 'Se for ao norte, leve aço. E não confie em sorrisos bonitos.'],
      ]);
    } else {
      await lines([
        ['Guarda', 'O portão norte fica fechado até o festival acabar. E ultimamente... há uivos no bosque.'],
      ]);
    }
  },

  async wolves_attack(g, ctx) {
    if (g.flags.wolvesDone) return;
    await lines([
      ['Narrador', 'Um grito corta o festival. Duas crianças correm do bosque, perseguidas por lobos cinzentos.'],
      ['Pip', 'Kael! Socorro!'],
      ['Kael', 'Pip! Atrás de mim!'],
    ]);
    await fight(g, ctx, ['wolf', 'wolf'], {
      bg: 'village', canFlee: false,
      intro: 'Os lobos cercam as crianças. Kael ergue o que tem: coragem e um machado.',
    });
    set(g, 'wolvesDone');
    set(g, 'northOpen');
    ctx.give('potion', 2);
    await lines([
      ['Narrador', 'Os lobos recuam para a escuridão. As crianças choram, mas estão inteiras.'],
      ['Pip', 'Você é o maior herói de Brumalva!'],
      ['Kael', 'Hoje eu só quero que todo mundo volte para casa.'],
    ]);
    ctx.quest('Vá ao Santuário da Brasa, ao norte do bosque.');
  },

  async forest_night(g, ctx) {
    if (g.flags.forestSeen) return;
    set(g, 'forestSeen');
    await lines([
      ['Narrador', 'O bosque engole o som do festival. Entre as árvores, uma luz azul pulsa: o Santuário da Brasa.'],
      ['Kael', 'Dorian disse ao anoitecer. Estranho... não há guardas.'],
      ['Narrador', 'No silêncio, o medalhão de prata no bolso de Kael parece pesar mais.'],
    ]);
    ctx.quest('Entre no Santuário da Brasa.');
  },

  // ------------------------------------------------------------ CHAPTER II
  async shrine_traitor(g, ctx) {
    if (g.flags.traitorSeen) return;
    set(g, 'traitorSeen');
    ctx.chapter(1);
    await ui.chapterCard(CHAPTERS[1]);
    await lines([
      ['Narrador', 'O Santuário está em silêncio. Sobre o altar, o pedestal da Brasa Eterna — vazio.'],
      ['Dorian', 'Você demorou.'],
      ['Kael', 'Dorian? O que aconteceu? Onde está a Brasa?'],
      ['Dorian', 'Onde sempre esteve. Comigo.'],
      ['Narrador', 'Dorian ergue a mão. Entre os dedos, uma chama dourada pulsa como um coração doente.'],
      ['Kael', 'Você... roubou a Brasa?'],
      ['Dorian', 'Roubei? Eu a salvei. Este reino apodrece sob um fogo que só aquece os ricos. Vou acender uma aurora nova.'],
      ['Lyra', 'Kael, eu... eu sinto muito.'],
      ['Kael', 'Lyra? Você sabia?'],
      ['Lyra', 'Dorian disse que se eu não ajudasse, ele—'],
      ['Dorian', 'Lyra fez o que precisava. Assim como você fará.'],
      ['Narrador', 'Guardas saem das sombras. A lâmina de uma lança encosta nas costas de Kael.'],
      ['Dorian', 'O lenhador que roubou a Brasa. A história se escreve sozinha.'],
      ['Kael', 'Eu confiei em você. Nos dois.'],
      ['Lyra', 'Não olhe para mim assim. Por favor.'],
      ['Dorian', 'Três anos no Forte Abissal. Tempo suficiente para o mundo esquecer seu nome.'],
      ['Narrador', 'O último som que Kael ouve antes da escuridão é o medalhão de prata caindo no chão.'],
    ]);
    set(g, 'betrayed');
    set(g, 'brasaStolen');
    if (g.inventory.locket) delete g.inventory.locket;
    ctx.quest('Sobreviva ao Forte Abissal.');
    await ctx.goto('prison', 7, 4, 'down', { fade: 700 });
  },

  // ------------------------------------------------------------ CHAPTER III
  async prison_wake(g, ctx) {
    if (g.flags.wokePrison) return;
    set(g, 'wokePrison');
    ctx.chapter(2);
    await ui.chapterCard(CHAPTERS[2]);
    await lines([
      ['Narrador', 'Três anos. O abismo não tem dias, só o eco de uma gota caindo.'],
      ['Kael', '...'],
      ['Garrick', 'Ainda vivo, garoto?'],
      ['Kael', 'Quem...?'],
      ['Garrick', 'Garrick. Último cavaleiro da Velha Guarda. Pelo menos era, antes de Dorian me jogar aqui por fazer perguntas demais.'],
      ['Kael', 'Dorian é o regente agora.'],
      ['Garrick', 'E você é o ladrão que roubou a Brasa. Ouvi os guardas. A história é boa. Mentira bem contada.'],
      ['Kael', 'Lyra... ela estava lá.'],
      ['Garrick', 'A garota que você amava? Dorian a usa como usa todos. Mas não é isso que te mantém acordado, é?'],
      ['Kael', 'Não.'],
      ['Garrick', 'Bom. Ódio é combustível. Mas não é destino. Fale comigo. Temos tempo.'],
    ]);
    ctx.quest('Fale com Garrick.');
  },

  async garrick_cell(g, ctx) {
    if (g.flags.garrickFree) {
      await lines([['Garrick', 'A saída é para baixo, garoto. E cuidado com o que encontra pelo caminho.']]);
      return;
    }
    set(g, 'garrickFree');
    await lines([
      ['Garrick', 'Quer sair daqui? Então me ouça. O carcereiro Groth tem a chave. E eu tenho um plano que exige duas pessoas e nenhuma dignidade.'],
      ['Kael', 'Estou ouvindo.'],
      ['Garrick', 'Dorian coroou-se regente. A Brasa Eterna está no castelo, e o povo de Brumalva passa fome enquanto ele vende milagres.'],
      ['Kael', 'E Lyra?'],
      ['Garrick', 'Viva. Perto dele. Não sei se por escolha ou por corrente. Se quiser respostas, precisamos sair.'],
      ['Narrador', 'Garrick chuta a fechadura enferrujada. O metal range, cede, e a cela se abre.'],
      ['Garrick', 'Ainda tenho um pouco de aço nos ossos. E você tem um nome para limpar.'],
    ]);
    ctx.join('garrick', 5);
    ctx.give('potion2', 2);
    set(g, 'cellOpen');
    ctx.quest('Saia da cela e atravesse o Forte Abissal.');
    await lines([
      ['Kael', 'Por que me ajudar?'],
      ['Garrick', 'Porque alguém precisa me lembrar que ainda sou um cavaleiro. E você precisa de alguém que saiba onde enfiar uma espada.'],
    ]);
  },

  async prison_guards(g, ctx) {
    if (g.flags.prisonGuardsDown) return;
    await lines([
      ['Guarda', 'Os ratos saíram da toca!'],
      ['Garrick', 'Fica atrás de mim, garoto. Ou melhor... fica ao meu lado.'],
    ]);
    await fight(g, ctx, ['guard', 'guard'], {
      bg: 'prison', canFlee: false,
      intro: 'Guardas reais bloqueiam o corredor.',
    });
    set(g, 'prisonGuardsDown');
    ctx.levelTo('kael', 4);
    ctx.levelTo('garrick', 5);
    await lines([
      ['Kael', 'Você luta como se não sentisse dor.'],
      ['Garrick', 'Sinto. Só não deixo ela decidir por mim.'],
      ['Narrador', 'No fundo do corredor, uma porta de ferro se abre. O cheiro de carvão e suor anuncia o carcereiro.'],
    ]);
    ctx.quest('Encontre o Carcereiro Groth no salão leste.');
  },

  async prison_jailer(g, ctx) {
    if (g.flags.jailerDown) return;
    await lines([
      ['Carcereiro Groth', 'O velho cavaleiro e o ladrão. Dorian pagou bem pela sua cabeça, Kael.'],
      ['Kael', 'Então venha receber.'],
      ['Carcereiro Groth', 'Eu quebrei homens maiores que você com uma mão.'],
      ['Garrick', 'E eu ensinei esse garoto a não quebrar.'],
    ]);
    await fight(g, ctx, ['jailer', 'guard'], {
      boss: true, bg: 'prison', canFlee: false,
      intro: 'Groth ergue o clavão. O chão treme.',
    });
    set(g, 'jailerDown');
    set(g, 'prisonEscape');
    ctx.levelTo('kael', 5);
    ctx.levelTo('garrick', 6);
    await lines([
      ['Narrador', 'Groth cai de joelhos. A chave do portão rola pelo chão.'],
      ['Garrick', 'A saída leste. O portão dos fundos. Vamos.'],
      ['Kael', 'E depois?'],
      ['Garrick', 'Depois a gente decide o que fazer com a raiva.'],
    ]);
    ctx.quest('Fuja pelo portão leste do forte.');
  },

  async prison_escape(g, ctx) {
    if (g.flags.escapedPrison) return;
    set(g, 'escapedPrison');
    await lines([
      ['Narrador', 'O portão se abre para um vento que Kael não sentia há três anos. A neve do Pico do Amanhecer brilha como vidro.'],
      ['Kael', 'Lá em cima... o Santuário da Aurora.'],
      ['Garrick', 'A lenda diz que a primeira luz do amanhecer escolhe um portador. Se Dorian teme alguma coisa, é isso.'],
    ]);
    ctx.chapter(3);
    await ui.chapterCard(CHAPTERS[3]);
    ctx.quest('Atravesse o Pico do Amanhecer.');
    await ctx.goto('mountain', 13, 18, 'up', { fade: 650 });
  },

  // ------------------------------------------------------------ CHAPTER IV
  async mountain_mira(g, ctx) {
    if (g.flags.metMira) return;
    await lines([
      ['Narrador', 'Um grito corta o vento. Uma maga de cabelo violeta recua diante de dois lobos glaciais.'],
      ['Mira', 'Se vocês vão me comer, pelo menos esperem eu terminar o feitiço!'],
      ['Kael', 'Garrick!'],
      ['Garrick', 'Eu vejo. Vai!'],
    ]);
    await fight(g, ctx, ['icewolf', 'icewolf'], {
      bg: 'snow',
      intro: 'Lobos glaciais atacam a maga encurralada.',
    });
    set(g, 'metMira');
    await lines([
      ['Mira', 'Você... não é um soldado de Dorian, é?'],
      ['Kael', 'Não.'],
      ['Mira', 'Ótimo. Porque eu estava prestes a morrer feio. Sou Mira. Maga errante, sobrevivente da purga, especialista em piadas ruins.'],
      ['Garrick', 'Nós vamos ao Santuário da Aurora.'],
      ['Mira', 'Que coincidência. Eu também. Ouço vozes no gelo. E uma delas conhece seu nome, Kael.'],
      ['Kael', 'Isso deveria me assustar?'],
      ['Mira', 'Provavelmente. Mas assustar é o que o gelo faz melhor.'],
    ]);
    ctx.join('mira', 6);
    ctx.levelTo('kael', 6);
    ctx.levelTo('garrick', 6);
    ctx.healAll(1);
    ctx.quest('Chegue ao topo do Pico do Amanhecer.');
  },

  async mountain_sentinel(g, ctx) {
    if (g.flags.sentinelDown) return;
    await lines([
      ['Narrador', 'Diante do portal de gelo, uma sentinela de pedra desperta. Runas azuis acendem em seu peito.'],
      ['Sentinela de Pedra', 'AQUELE QUE CARREGA A AURORA NÃO PASSA.'],
      ['Kael', 'Eu nem sei o que isso significa.'],
      ['Mira', 'Significa que ela vai tentar nos matar. Levante a espada!'],
    ]);
    await fight(g, ctx, ['sentinel'], {
      boss: true, bg: 'snow', canFlee: false,
      intro: 'A Sentinela de Pedra desperta. O gelo racha sob seus pés.',
    });
    set(g, 'sentinelDown');
    ctx.levelTo('kael', 7);
    ctx.levelTo('garrick', 7);
    ctx.levelTo('mira', 7);
    await lines([
      ['Narrador', 'A sentinela se desfaz em poeira de cristal. O portal permanece aberto, pulsando como uma ferida de luz.'],
      ['Garrick', 'O portal... reconheceu você.'],
      ['Mira', 'Ou reconheceu o que você carrega. Vamos logo, antes que eu comece a acreditar em destino.'],
    ]);
    ctx.quest('Entre no Santuário da Aurora.');
  },

  async temple_blessing(g, ctx) {
    if (g.flags.blessed) return;
    await lines([
      ['Narrador', 'O Santuário da Aurora é feito de luz sólida. No centro, uma espada atravessada em pedra.'],
      ['Mira', 'A Lâmina Aurora. Dizem que ela queima quem carrega mentiras.'],
      ['Garrick', 'Então é uma boa hora para você admitir que roubou minha ração ontem.'],
      ['Mira', 'Isso foi um empréstimo tático.'],
      ['Narrador', 'Kael toca o punho. A luz não o queima. Ela o reconhece.'],
      ['Kael', 'Eu não vim me tornar um herói. Vim impedir que Dorian transforme o reino em cinzas.'],
      ['Voz da Aurora', 'Então seja a lâmina que não pede permissão ao fogo.'],
      ['Narrador', 'A espada desliza da pedra. O santuário inteiro respira.'],
    ]);
    set(g, 'blessed');
    ctx.give('aurora', 1);
    ctx.levelTo('kael', 8);
    ctx.levelTo('garrick', 8);
    ctx.levelTo('mira', 8);
    ctx.healAll(1);
    ctx.chapter(4);
    await ui.chapterCard(CHAPTERS[4]);
    ctx.quest('Desça até Brumalva. A cidade está sob o jugo de Dorian.');
    await lines([
      ['Mira', 'Então é isso. O lenhador virou a lâmina.'],
      ['Kael', 'Ainda sou o mesmo.'],
      ['Garrick', 'Não. E é bom que não seja.'],
    ]);
  },

  // ------------------------------------------------------------ CHAPTER V
  async night_arrival(g, ctx) {
    if (g.flags.nightArrived) return;
    set(g, 'nightArrived');
    await lines([
      ['Narrador', 'Brumalva não tem mais festivais. As casas estão apagadas, e soldados de Dorian marcham sob bandeiras vermelhas.'],
      ['Kael', 'O lugar onde eu cresci...'],
      ['Mira', 'Olhe para eles. Não estão protegendo. Estão ocupando.'],
      ['Garrick', 'A resistência deve estar nas ruínas ao sul. Maeve ainda vive?'],
      ['Kael', 'Se alguém sobreviveu, é ela.'],
    ]);
    ctx.quest('Encontre a resistência de Brumalva.');
  },

  async night_elder(g, ctx) {
    await lines([
      ['Anciã Maeve', 'Kael? Pelos deuses... você está vivo.'],
      ['Kael', 'Maeve. O que aconteceu?'],
      ['Anciã Maeve', 'Dorian tomou o trono. A Brasa Eterna queima no castelo, mas não aquece mais as casas. Ele chama de ordem. Nós chamamos de fome.'],
      ['Kael', 'E Lyra?'],
      ['Anciã Maeve', 'Ela está no castelo. Dizem que é a voz dele. Dizem também que chora à noite. Não sei o que acreditar.'],
      ['Anciã Maeve', 'Fale com Brann, nas ruínas. Ele tem um plano — e uma teimosia que vai te matar.'],
    ]);
    ctx.quest('Fale com Brann, o líder da resistência.');
  },

  async night_resistance(g, ctx) {
    if (g.flags.talkedResistance) {
      await lines([['Brann', 'Varek está no centro da vila. Quanto antes ele cair, antes a cidade respira.']]);
      return;
    }
    set(g, 'talkedResistance');
    await lines([
      ['Brann', 'Então o fantasma do Forte Abissal voltou. Ouvi dizer que você matou o carcereiro com uma colher.'],
      ['Kael', 'Foi uma colher grande.'],
      ['Brann', 'Gosto de você. Precisamos de alguém para abrir o caminho até o castelo. Sir Varek comanda a ocupação. Se ele cair, a cidade respira.'],
      ['Mira', 'E Dorian?'],
      ['Brann', 'Dorian não sai do castelo. Ele tem medo do povo. E medo é uma porta.'],
      ['Brann', 'Leve isto. A resistência economizou durante meses.'],
    ]);
    ctx.give('potion2', 2);
    ctx.give('elixir', 1);
    ctx.quest('Derrote Sir Varek no centro de Brumalva.');
  },

  async night_guard(g, ctx) {
    if (g.flags.nightGuardDown) {
      await lines([['Narrador', 'Os guardas que sobraram evitam seu olhar.']]);
      return;
    }
    await lines([
      ['Guarda', 'Toque o sino, e a cidade queima. Volte para a sua casa, lenhador.'],
      ['Kael', 'Minha casa está aqui. E você está nela.'],
    ]);
    await fight(g, ctx, ['guard', 'hound'], {
      bg: 'night', canFlee: false,
      intro: 'A patrulha de Dorian avança.',
    });
    set(g, 'nightGuardDown');
    await lines([
      ['Narrador', 'A última patrulha cai. Uma janela se acende ao longe — alguém viu.'],
    ]);
    ctx.quest('Derrote Sir Varek no centro de Brumalva.');
  },

  async night_varek(g, ctx) {
    if (g.flags.varekDown) return;
    await lines([
      ['Sir Varek', 'O lenhador traidor. Dorian falou de você. Disse que era teimoso.'],
      ['Kael', 'Dorian fala demais.'],
      ['Sir Varek', 'Ele também disse que você ainda ama a garota. Isso te torna previsível.'],
      ['Kael', 'E você é previsível por obedecer.'],
      ['Sir Varek', 'Eu obedeço porque alguém precisa manter este reino de pé.'],
    ]);
    await fight(g, ctx, ['champion', 'guard'], {
      boss: true, bg: 'night', canFlee: false,
      intro: 'Sir Varek ergue a espada carmesim.',
    });
    set(g, 'varekDown');
    set(g, 'manorOpen');
    ctx.levelTo('kael', 9);
    ctx.levelTo('garrick', 9);
    ctx.levelTo('mira', 9);
    await lines([
      ['Narrador', 'Varek cai. Do bolso de seu manto, um decreto selado com a marca de Dorian.'],
      ['Mira', '“A portadora da Brasa não deve ser ferida. Dorian.”'],
      ['Kael', 'Portadora?'],
      ['Garrick', 'A Brasa não escolhe o rei. Ela escolhe um recipiente. Lyra não é cúmplice. Ela é a prisão.'],
      ['Kael', 'Onde ela está?'],
      ['Garrick', 'Ainda nesta vila. Eu a vi no terraço da casa grande.'],
    ]);
    ctx.quest('Procure Lyra no centro da vila.');
  },

  async night_lyra(g, ctx) {
    if (g.flags.lyraJoined) {
      await lines([['Lyra', 'O castelo espera. Eu sinto a Brasa puxando. Vamos.']]);
      return;
    }
    await lines([
      ['Lyra', 'Kael.'],
      ['Kael', 'Três anos.'],
      ['Lyra', 'Eu sei.'],
      ['Kael', 'Você estava lá. Você me viu ser levado.'],
      ['Lyra', 'Dorian segurou a Brasa contra o peito do meu pai. Ele disse que, se eu abrisse a boca, o fogo consumiria ele primeiro. Eu escolhi. Todos os dias, eu escolhi.'],
      ['Kael', 'Você poderia ter me contado.'],
      ['Lyra', 'Como? Eu era a voz dele. O que eu dissesse, ele transformava em lei. A única coisa que eu podia proteger era a vida de vocês. A sua... e a do meu pai.'],
      ['Kael', 'E agora?'],
      ['Lyra', 'Agora ele quer que eu acenda a Brasa no castelo. Se eu fizer, o reino inteiro vira combustível. Se eu não fizer, ele mata todo mundo que amo. De novo.'],
      ['Mira', 'Então não deixamos ele escolher.'],
      ['Garrick', 'A Lâmina Aurora foi feita para apagar a Brasa. Se alguém pode chegar perto dela, é você, Lyra.'],
      ['Lyra', 'Você confiaria em mim?'],
    ]);
    const choice = await ui.choice('O que Kael responde?', [
      { label: 'Eu confio em você.', value: 'trust' },
      { label: 'Prove que mudou.', value: 'prove' },
    ]);
    set(g, 'trustedLyra', choice === 'trust');
    if (choice === 'trust') {
      await lines([
        ['Kael', 'Eu não confio no que aconteceu. Mas confio em quem você escolhe ser agora.'],
        ['Lyra', 'Então eu vou escolher certo.'],
      ]);
    } else {
      await lines([
        ['Kael', 'Você tem uma chance. Uma. Não desperdice.'],
        ['Lyra', 'Uma é mais do que eu mereço.'],
      ]);
    }
    set(g, 'lyraJoined');
    ctx.join('lyra', 9);
    ctx.levelTo('kael', 9);
    ctx.levelTo('garrick', 9);
    ctx.levelTo('mira', 9);
    ctx.healAll(1);
    ctx.give('locket', 1);
    await lines([
      ['Narrador', 'Lyra tira o medalhão de prata do bolso e o coloca na mão de Kael.'],
      ['Lyra', 'Eu guardei. Todos esses anos.'],
      ['Kael', 'Então vamos terminar isso. Juntos.'],
    ]);
    ctx.quest('Vá ao Castelo de Valdoria. Enfrente Dorian.');
  },

  // ------------------------------------------------------------ CHAPTER VI
  async castle_arrival(g, ctx) {
    if (g.flags.castleArrived) return;
    set(g, 'castleArrived');
    ctx.chapter(5);
    await ui.chapterCard(CHAPTERS[5]);
    await lines([
      ['Narrador', 'O Castelo de Valdoria arde sem fumaça. As tochas queimam verde, e o ar cheira a ferro e mel.'],
      ['Lyra', 'Ele está no trono. Eu sinto a Brasa puxando.'],
      ['Garrick', 'Então vamos dar a ela um motivo para soltar.'],
      ['Mira', 'Pela primeira vez, eu gostaria de estar em uma taverna.'],
    ]);
    ctx.quest('Abra caminho até o trono.');
  },

  async castle_knights(g, ctx) {
    if (g.flags.castleKnightsDown) return;
    await lines([
      ['Dorian', 'Você demorou, Kael. Até a morte tem paciência.'],
      ['Narrador', 'Cavaleiros sombrios descem das galerias. Espectros sussurram entre as colunas.'],
      ['Garrick', 'Eu seguro a esquerda.'],
      ['Mira', 'Eu seguro a direita.'],
      ['Lyra', 'E eu seguro a Brasa.'],
    ]);
    await fight(g, ctx, ['darkknight', 'darkknight', 'wraith'], {
      bg: 'castle', canFlee: false,
      intro: 'A guarda sombria de Dorian bloqueia o salão.',
    });
    set(g, 'castleKnightsDown');
    ctx.levelTo('kael', 10);
    ctx.levelTo('garrick', 10);
    ctx.levelTo('mira', 10);
    ctx.levelTo('lyra', 10);
    ctx.healAll(1);
    await lines([
      ['Narrador', 'O último cavaleiro sombrio se desfaz. A porta do trono se abre sozinha.'],
      ['Kael', 'Dorian.'],
    ]);
    ctx.quest('Enfrente Dorian no trono.');
  },

  async final_dorian(g, ctx) {
    return finalBattle(g, ctx);
  },

  async final_battle(g, ctx) {
    return finalBattle(g, ctx);
  },
};

export async function runScript(name, game, ctx) {
  const fn = SCRIPTS[name];
  if (!fn) return false;
  const result = await fn(game, ctx);
  return result === 'title' ? 'title' : true;
}

export function hasScript(name) {
  return !!SCRIPTS[name];
}

import { ENCOUNTERS, ITEMS, CHAPTERS, LORE } from './data.js';

const wait = (ms) => new Promise(res => setTimeout(res, ms));

export const storyMethods = {
  async talkTo(npc) {
    if (this.storyBusy || this.dialogueActive) return;
    this.storyBusy = true;
    try {
      switch (npc.id) {
        case 'lyra':
          await this.storyBetrayal();
          break;
        case 'darian':
          await this.showDialogue([
            { speaker: 'Darian', portrait: 'darian', mood: 'smile', text: 'Kael! Ainda vivo? Achei que a forja tivesse te engolido.' },
            { speaker: 'Kael', portrait: 'kael', text: 'Quase. A forja tem mais compaixão que você.' },
            { speaker: 'Darian', portrait: 'darian', mood: 'smile', text: 'Hoje tudo muda. Sinto isso no ar.' },
            { narration: true, text: 'Ele sorri como quem já conhece o final da história.' }
          ]);
          break;
        case 'maren':
          this.unlockLore('heart');
          await this.showDialogue([
            { speaker: 'Dona Maren', portrait: 'elder', text: 'Kael, querido. Cuidado com o que brilha nesta noite.' },
            { speaker: 'Kael', portrait: 'kael', text: 'É só uma festa, Dona Maren.' },
            { speaker: 'Dona Maren', portrait: 'elder', mood: 'sad', text: 'Foi numa festa que a Coroa encontrou o Coração de Valdoria. Desde então, toda luz tem uma sombra com fome.' }
          ]);
          break;
        case 'tio':
          await this.showDialogue([
            { speaker: 'Tio', portrait: 'child', mood: 'smile', text: 'Kael! Quando eu crescer, vou ser ferreiro igual você!' },
            { speaker: 'Kael', portrait: 'kael', mood: 'smile', text: 'É um bom ofício. Dá calo, mas não dá ordens.' },
            { speaker: 'Tio', portrait: 'child', mood: 'smile', text: 'Ou herói. Herói dá menos bolhas.' }
          ]);
          break;
        case 'nessa':
          this.openShop('merchant');
          break;
        case 'guard':
          await this.showDialogue([
            { speaker: 'Guarda da Vila', portrait: 'guard', text: 'Circulando, ferreiro. A festa está bonita, mas amanhã alguém sempre paga a conta.' },
            { speaker: 'Kael', portrait: 'kael', text: 'Filosófico. A Coroa paga o seu salário ou o seu silêncio?' }
          ]);
          break;
        case 'mira_prison':
          await this.showDialogue([
            { speaker: 'Mira', portrait: 'mira', text: 'Fique perto de mim. Os corredores mudam quando os guardas ficam desesperados.' }
          ]);
          break;
        case 'prisoner':
          await this.showDialogue([
            { speaker: 'Prisioneiro', portrait: 'prisoner', text: 'Você é o ferreiro, não é? Dizem que o Campeão te enterrou aqui por ciúme.' },
            { speaker: 'Kael', portrait: 'kael', text: 'Dizem muita coisa.' },
            { speaker: 'Prisioneiro', portrait: 'prisoner', text: 'Homens pequenos fazem coisas grandes quando têm medo. Lembre disso quando encontrar a coroa.' }
          ]);
          break;
        case 'warden':
          if (!this.flags.wardenDefeated) await this.storyWarden();
          break;
        case 'brann_forest':
          if (!this.flags.wolvesDefeated) {
            await this.showDialogue([
              { speaker: 'Brann', portrait: 'brann', text: 'Não se aproxime, garoto. A matilha está com fome e eu não estou com paciência.' }
            ]);
          } else if (!this.flags.brannJoined) {
            await this.storyBrannJoin();
          }
          break;
        case 'wanderer':
          await this.showDialogue([
            { speaker: 'Viajante', portrait: 'wanderer', text: 'A Estrada das Cinzas não perdoa quem olha para trás. Siga em frente, ou fique e vire árvore.' },
            { speaker: 'Kael', portrait: 'kael', text: 'Já fui árvore por três anos. Não recomendo.' }
          ]);
          break;
        case 'mira_camp':
          await this.showDialogue([
            { speaker: 'Mira', portrait: 'mira', mood: 'sad', text: 'Eu tinha um irmão. Darian o chamou de traidor e o pendurou na ponte de Valdoria.' },
            { speaker: 'Mira', portrait: 'mira', text: 'Não luto por vingança. Luto para que ninguém mais precise aprender a odiar para sobreviver.' },
            { speaker: 'Kael', portrait: 'kael', text: 'Então vamos garantir que essa lição chegue ao trono.' }
          ]);
          break;
        case 'brann_camp':
          await this.storyDeparture();
          break;
        case 'orin':
          this.unlockLore('heart');
          this.unlockLore('lyra');
          await this.showDialogue([
            { speaker: 'Velho Orin', portrait: 'elder', text: 'A Coroa de Cinzas não foi feita para governar. Foi feita para conter o Coração.' },
            { speaker: 'Velho Orin', portrait: 'elder', mood: 'sad', text: 'Quando uma pessoa coloca aquilo na cabeça, o Coração começa a responder ao que ela mais deseja. E desejo, meu jovem, é uma fome que nunca aprende a parar.' },
            { speaker: 'Kael', portrait: 'kael', text: 'Lyra sempre quis mais. Eu só não sabia que "mais" custava um reino.' }
          ]);
          break;
        case 'smith':
          this.openForge();
          break;
        case 'merchant_camp':
          this.openShop('merchant');
          break;
        case 'voss':
          if (!this.flags.vossDefeated) await this.storyVoss();
          break;
        case 'darian_castle':
          if (!this.flags.darianDefeated && this.flags.vossDefeated) await this.storyDarian();
          break;
        case 'lyra_castle':
          if (!this.flags.lyraDefeated && this.flags.darianDefeated) await this.storyLyra();
          break;
        default:
          await this.showDialogue([{ speaker: npc.name, portrait: npc.char, text: '...' }]);
      }
    } finally {
      this.storyBusy = false;
      this.updateControls();
      this.updateInteractHint();
    }
  },

  async propAction(prop) {
    if (this.storyBusy || this.dialogueActive) return;
    if (prop.type === 'chest') {
      if (this.openedChests.has(prop.id)) {
        await this.showDialogue([{ narration: true, text: 'O baú está vazio. Só resta poeira e o cheiro de ferro velho.' }]);
        return;
      }
      this.openedChests.add(prop.id);
      const loot = prop.loot || {};
      const parts = [];
      if (loot.gold) { this.gold += loot.gold; parts.push(`${loot.gold} de ouro`); }
      for (const [id, count] of Object.entries(loot)) {
        if (id === 'gold') continue;
        this.addItem(id, count);
        parts.push(`${count}× ${ITEMS[id]?.name || id}`);
      }
      this.audio.sfx('chest');
      this.updateHUD();
      await this.showDialogue([{ narration: true, text: `O baú se abre com um estalo. Você encontra ${parts.join(' e ')}.` }]);
      return;
    }
    if (prop.type === 'forge') { this.openForge(); return; }
    if (prop.type === 'stall') { this.openShop('merchant'); return; }
    if (prop.type === 'campfire') {
      this.storyBusy = true;
      this.healParty();
      this.audio.sfx('heal');
      await this.showDialogue([{ narration: true, text: 'O fogo estala. Por um instante, o grupo esquece o ferro, a coroa e o medo. PV e PM restaurados.' }]);
      this.storyBusy = false;
      return;
    }
    if (prop.type === 'bedroll') {
      this.storyBusy = true;
      this.healParty();
      this.saveGame(true);
      await this.showDialogue([{ narration: true, text: 'Kael dorme por algumas horas. O sonho é curto, mas o suficiente. PV e PM restaurados. Progresso salvo.' }]);
      this.storyBusy = false;
      return;
    }
    if (prop.type === 'shrine') {
      this.storyBusy = true;
      this.unlockLore('heart');
      this.healParty();
      this.audio.sfx('heal');
      await this.showDialogue([
        { narration: true, text: 'A pedra antiga pulsa sob suas mãos. Runas esquecidas sussurram um nome: Valdoria.' },
        { narration: true, text: 'Uma luz morna percorre o grupo. PV e PM restaurados.' }
      ]);
      this.storyBusy = false;
      return;
    }
    if (prop.type === 'stairs') {
      if (!this.flags.wardenDefeated) {
        await this.showDialogue([{ narration: true, text: 'A porta de ferro está selada. Só o Carcereiro Gorr carrega a chave.' }]);
      } else {
        await this.storyPrisonEscape();
      }
      return;
    }
    await this.showDialogue([{ narration: true, text: 'Não há nada de útil aqui.' }]);
  },

  unlockLore(id) {
    if (!id || this.loreUnlocked.has(id)) return;
    this.loreUnlocked.add(id);
    this.showToast(`Diário atualizado: ${LORE[id]?.title || 'Nova entrada'}`);
  },

  async storyBetrayal() {
    this.flags.betrayal = true;
    this.audio.playMusic('prison');
    await this.showDialogue([
      { narration: true, text: 'A fonte canta baixinho. Lyra está de costas, o vestido escuro recortado pela luz das lanternas.' },
      { speaker: 'Lyra', portrait: 'lyra', mood: 'smile', text: 'Kael. Você veio.' },
      { speaker: 'Kael', portrait: 'kael', mood: 'smile', text: 'Eu prometi. Três anos na forja para pagar este anel.' },
      { narration: true, text: 'Ele abre a caixa. O ouro ainda está quente do bolso.' },
      { speaker: 'Lyra', portrait: 'lyra', mood: 'sad', text: 'Eu... não posso.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Não pode o quê?' },
      { narration: true, text: 'Passos. Botas. Aço. Darian surge com quatro guardas da Coroa.' },
      { speaker: 'Darian', portrait: 'darian', text: 'Kael Varyn, você está preso pelo roubo do Coração de Valdoria e pelo assassinato do capitão Soren.' },
      { speaker: 'Kael', portrait: 'kael', mood: 'angry', text: 'O quê? Darian, isso é loucura. Eu estava na forja a noite inteira!' },
      { speaker: 'Lyra', portrait: 'lyra', mood: 'sad', text: 'Eu vi você saindo da cripta. Sinto muito.' },
      { speaker: 'Kael', portrait: 'kael', mood: 'sad', text: 'Lyra... por quê?' },
      { speaker: 'Lyra', portrait: 'lyra', text: 'Porque você nunca entenderia. Você prefere uma vida pequena. Eu não.' },
      { speaker: 'Darian', portrait: 'darian', mood: 'smile', text: 'Sempre o herói da história, não é? Hoje eu escrevo o final.' },
      { narration: true, text: 'O punho de um guarda encontra a têmpora de Kael. O mundo vira ferro e escuridão.' }
    ]);
    this.audio.sfx('boss');
    this.shake(24);
    await this.flashWhite(260);
    await wait(300);
    this.showFade(true);
    await wait(720);
    this.chapter = 'prison';
    this.setObjective('Sobreviva ao Abismo.');
    this.startMap('prison', { x: 4, y: 8, dir: 'right' });
    this.showFade(false);
    await wait(350);
    await this.chapterCard('prison');
    await this.storyPrisonIntro();
    this.saveGame(true);
  },

  async storyPrisonIntro() {
    this.audio.playMusic('prison');
    await this.showDialogue([
      { narration: true, text: 'Três anos depois.' },
      { narration: true, text: 'O Abismo não tem dias. Só turnos de dor, o gosto de ferro e o som de correntes que nunca param.' },
      { speaker: 'Kael', portrait: 'kael', mood: 'sad', text: 'Ainda estou vivo. Isso já é uma forma de vingança.' },
      { narration: true, text: 'Uma chave gira. A porta da cela se abre. Uma mulher de capuz escuro observa o corredor.' },
      { speaker: 'Mira', portrait: 'mira', text: 'Kael Varyn. O ferreiro que se recusou a morrer.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Quem é você?' },
      { speaker: 'Mira', portrait: 'mira', text: 'Mira. A pessoa que vai te tirar daqui antes que Gorr lembre de te matar.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Por que eu?' },
      { speaker: 'Mira', portrait: 'mira', text: 'Porque Darian tem medo de você. E eu tenho interesse em tudo que assusta a Coroa.' }
    ]);
    this.addPartyMember('mira', this.party[0].level);
    this.hiddenNpcs.add('mira_prison');
    this.buildFollowers();
    this.unlockLore('prison');
    this.setObjective('Siga Mira e escape do Abismo.');
    this.audio.sfx('levelup');
    this.showToast('Mira entrou no grupo.');
    this.updateHUD();
    this.saveGame(true);
  },

  async storyPrisonGuard1() {
    const result = await this.battleSequence(ENCOUNTERS.prison_guards_1, async () => {
      this.flags.guard1Defeated = true;
      await this.showDialogue([
        { speaker: 'Kael', portrait: 'kael', text: 'Ainda sei segurar uma espada.' },
        { speaker: 'Mira', portrait: 'mira', text: 'Bom. Vamos precisar de mais que isso.' },
        { narration: true, text: 'Mira arranca um molho de chaves do cinto do guarda. O caminho para o portão se abre.' }
      ]);
      this.setObjective('Atravesse o corredor e alcance o portão de ferro.');
      this.saveGame(true);
    });
    return result;
  },

  async storyPrisonGuard2() {
    const result = await this.battleSequence(ENCOUNTERS.prison_guards_2, async () => {
      this.flags.guard2Defeated = true;
      await this.showDialogue([
        { speaker: 'Mira', portrait: 'mira', text: 'Gorr está no portão. Ele não vai abrir.' },
        { speaker: 'Kael', portrait: 'kael', text: 'Então eu abro.' }
      ]);
      this.setObjective('Derrote o Carcereiro Gorr no portão leste.');
      this.saveGame(true);
    });
    return result;
  },

  async storyWarden() {
    await this.showDialogue([
      { speaker: 'Carcereiro Gorr', portrait: 'guard', text: 'Três anos, rato. E ainda não aprendeu a ficar quieto.' },
      { speaker: 'Kael', portrait: 'kael', mood: 'angry', text: 'Três anos, Gorr. E você ainda não aprendeu a trancar a porta direito.' },
      { speaker: 'Mira', portrait: 'mira', text: 'Kael. A chave está no cinto dele.' }
    ]);
    const result = await this.battleSequence(ENCOUNTERS.warden, async () => {
      this.flags.wardenDefeated = true;
      this.hiddenNpcs.add('warden');
      await this.showDialogue([
        { speaker: 'Carcereiro Gorr', portrait: 'guard', mood: 'sad', text: 'Você... não é mais o mesmo.' },
        { speaker: 'Kael', portrait: 'kael', text: 'Não. E você vai lembrar disso.' },
        { speaker: 'Mira', portrait: 'mira', text: 'A saída fica nas escadas do sudeste. Vamos.' }
      ]);
      this.setObjective('Alcance as escadas no sudeste do Abismo.');
      this.saveGame(true);
    });
    return result;
  },

  async storyPrisonEscape() {
    if (!this.flags.wardenDefeated) {
      await this.showDialogue([{ narration: true, text: 'A porta de ferro está selada. Só o Carcereiro Gorr carrega a chave.' }]);
      return;
    }
    await this.showDialogue([
      { speaker: 'Mira', portrait: 'mira', text: 'Lá fora é pior, sabe? A Coroa transformou o reino num cemitério.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Melhor um cemitério a céu aberto do que uma cela sem céu.' },
      { narration: true, text: 'A porta range. O ar frio da noite entra pelos pulmões de Kael como uma lâmina.' }
    ]);
    this.flags.prisonEscaped = true;
    this.showFade(true);
    await wait(700);
    this.chapter = 'forest';
    this.startMap('forest', { x: 2, y: 9, dir: 'right' });
    this.showFade(false);
    await wait(350);
    await this.chapterCard('forest');
    await this.storyForestIntro();
    this.saveGame(true);
  },

  async storyForestIntro() {
    this.audio.playMusic('forest');
    await this.showDialogue([
      { narration: true, text: 'A Estrada das Cinzas. O reino que Kael conhecia virou um cemitério a céu aberto.' },
      { narration: true, text: 'Árvores retorcidas, aldeias vazias, cinza onde antes havia trigo.' },
      { speaker: 'Kael', portrait: 'kael', mood: 'sad', text: 'Lyra... Darian... o que vocês fizeram com Valdoria?' },
      { speaker: 'Mira', portrait: 'mira', text: 'O que a Coroa sempre faz. Promete. Depois cobra.' }
    ]);
    this.setObjective('Siga pela Estrada das Cinzas até o acampamento da resistência.');
  },

  async storyWolves() {
    const result = await this.battleSequence(ENCOUNTERS.wolves, async () => {
      this.flags.wolvesDefeated = true;
      await this.showDialogue([
        { narration: true, text: 'Um assobio corta a noite. Um homem grande, de barba grisalha e martelo nas costas, emerge das árvores.' },
        { speaker: 'Brann', portrait: 'brann', text: 'Boa luta, garoto. Mas barulho atrai coisa pior.' },
        { speaker: 'Kael', portrait: 'kael', text: 'Quem é você?' },
        { speaker: 'Brann', portrait: 'brann', text: 'Brann Kade. Resistência. E você é o fantasma que a Coroa mandou enterrar.' },
        { speaker: 'Mira', portrait: 'mira', text: 'Ele é o ferreiro. O que Darian traiu.' },
        { speaker: 'Brann', portrait: 'brann', text: 'Então a Coroa tem medo de ferreiros. Interessante.' }
      ]);
      this.setObjective('Fale com Brann, o veterano na estrada.');
      this.saveGame(true);
    });
    return result;
  },

  async storyBrannJoin() {
    await this.showDialogue([
      { speaker: 'Brann', portrait: 'brann', text: 'Darian virou Campeão da Coroa. Lyra é a Dama das Cinzas. E o Coração de Valdoria está drenando a vida do reino.' },
      { speaker: 'Kael', portrait: 'kael', mood: 'angry', text: 'Eles vão pagar.' },
      { speaker: 'Brann', portrait: 'brann', text: 'Cuidado com essa palavra, garoto. Vingança é uma chama que consome a mão. Justiça é a forja que molda o aço.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Então me ensine a forjar.' },
      { speaker: 'Brann', portrait: 'brann', mood: 'smile', text: 'Ha! Gostei. Vamos. O acampamento fica a leste.' }
    ]);
    this.addPartyMember('brann');
    this.hiddenNpcs.add('brann_forest');
    this.buildFollowers();
    this.flags.brannJoined = true;
    this.unlockLore('resistance');
    this.unlockLore('darian');
    this.setObjective('Siga para leste até o acampamento da resistência.');
    this.audio.sfx('levelup');
    this.showToast('Brann entrou no grupo.');
    this.updateHUD();
    this.saveGame(true);
  },

  async storyEnterCamp() {
    this.flags.campReached = true;
    this.showFade(true);
    await wait(700);
    this.chapter = 'camp';
    this.startMap('camp', { x: 4, y: 11, dir: 'right' });
    this.showFade(false);
    await wait(350);
    await this.chapterCard('camp');
    await this.storyCampIntro();
    this.saveGame(true);
  },

  async storyCampIntro() {
    this.audio.playMusic('camp');
    await this.showDialogue([
      { narration: true, text: 'Acampamento da Brasa. O último fogo livre de Valdoria.' },
      { speaker: 'Brann', portrait: 'brann', text: 'Aqui ninguém é nobre. Só gente que decidiu não ajoelhar.' },
      { speaker: 'Mira', portrait: 'mira', mood: 'smile', text: 'A forja está de pé. Nessa e Nessa.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Darian e Lyra estão no palácio. Eu vou até lá.' },
      { speaker: 'Brann', portrait: 'brann', text: 'Não. Nós vamos. Descanse, compre, melhore sua lâmina. O palácio não vai fugir.' },
      { narration: true, text: 'Use a forja, negocie com Nessa, descanse na fogueira e salve no saco de dormir. Quando estiver pronto, fale com Brann.' }
    ]);
    this.unlockLore('resistance');
    this.setObjective('Prepare-se e fale com Brann para partir ao palácio.');
  },

  async storyDeparture() {
    const choice = await this.showDialogue([
      { speaker: 'Brann', portrait: 'brann', text: 'A Coroa está comemorando a Colheita de Cinzas. Todos os nobres estarão no salão. É agora ou nunca.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Então é agora.' },
      { speaker: 'Brann', portrait: 'brann', text: 'Antes de marcharmos: o grupo está pronto?' },
      { speaker: 'Brann', portrait: 'brann', choices: [
        { text: 'Partir para o palácio', value: 'go' },
        { text: 'Ainda preciso me preparar', value: 'stay' }
      ], text: 'Diga a palavra, ferreiro.' }
    ]);
    if (choice !== 'go') {
      this.showToast('A resistência espera. Fale com Brann quando estiver pronto.');
      return;
    }
    this.flags.departed = true;
    this.saveGame(true);
    this.showFade(true);
    await wait(700);
    this.chapter = 'castle';
    this.startMap('castle', { x: 16, y: 16, dir: 'up' });
    this.showFade(false);
    await wait(350);
    await this.chapterCard('castle');
    await this.storyCastleIntro();
    this.saveGame(true);
  },

  async storyCastleIntro() {
    this.audio.playMusic('castle');
    await this.showDialogue([
      { narration: true, text: 'Palácio da Coroa. O coração de Valdoria pulsa sob o trono como uma ferida aberta.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Três anos. Uma vida inteira.' },
      { speaker: 'Mira', portrait: 'mira', text: 'Não olhe para o trono. Olhe para a saída.' },
      { speaker: 'Brann', portrait: 'brann', text: 'Se morrermos, morremos de pé.' },
      { speaker: 'Kael', portrait: 'kael', mood: 'smile', text: 'Prefiro não morrer. Mas obrigado pelo apoio.' }
    ]);
    this.setObjective('Avance pelo salão e derrote o Inquisidor Voss.');
  },

  async storyVoss() {
    await this.showDialogue([
      { speaker: 'Inquisidor Voss', portrait: 'voss', text: 'Kael Varyn. O morto que esqueceu de morrer.' },
      { speaker: 'Kael', portrait: 'kael', text: 'A Coroa não tolera milagres, é?' },
      { speaker: 'Inquisidor Voss', portrait: 'voss', text: 'A Coroa não tolera nada. Ela apenas permite, por enquanto.' }
    ]);
    const result = await this.battleSequence(ENCOUNTERS.voss, async () => {
      this.flags.vossDefeated = true;
      this.hiddenNpcs.add('voss');
      await this.showDialogue([
        { speaker: 'Inquisidor Voss', portrait: 'voss', mood: 'sad', text: 'Você... não passa de cinza...' },
        { speaker: 'Kael', portrait: 'kael', text: 'Cinza fertiliza o chão.' },
        { speaker: 'Mira', portrait: 'mira', text: 'Deixe-me cuidar dos ferimentos. Ainda falta o Campeão.' }
      ]);
      this.healParty();
      this.audio.sfx('heal');
      this.setObjective('Suba até o trono e enfrente Darian.');
      this.saveGame(true);
    });
    return result;
  },

  async storyDarian() {
    if (this.flags.darianDefeated) return;
    await this.showDialogue([
      { narration: true, text: 'Darian desce do trono sem pressa. A armadura brilha como se tivesse sido feita para refletir apenas a luz dele.' },
      { speaker: 'Darian', portrait: 'darian', mood: 'smile', text: 'Eu sabia que você voltaria. Você sempre foi previsível, Kael.' },
      { speaker: 'Kael', portrait: 'kael', text: 'E você sempre foi covarde com uma espada.' },
      { speaker: 'Darian', portrait: 'darian', text: 'Eu construí um reino. Você construiu uma rebelião de mendigos.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Eu construí algo que você nunca teve: gente que ficaria.' }
    ]);
    const result = await this.battleSequence(ENCOUNTERS.darian, async () => {
      this.flags.darianDefeated = true;
      this.hiddenNpcs.add('darian_castle');
      await this.showDialogue([
        { speaker: 'Darian', portrait: 'darian', mood: 'sad', text: 'Você... ainda acha que pode salvá-la?' },
        { speaker: 'Kael', portrait: 'kael', text: 'Não. Mas posso impedir que ela destrua mais gente.' },
        { speaker: 'Darian', portrait: 'darian', text: 'Ela nunca te amou, sabia? Ela amava o que você representava.' },
        { speaker: 'Kael', portrait: 'kael', text: 'Talvez. Mas eu amava quem eu era perto dela. E esse homem ainda está aqui.' },
        { narration: true, text: 'A espada de Darian se parte. O Campeão cai. Acima do trono, a Coroa começa a pulsar.' }
      ]);
      this.healParty();
      this.audio.sfx('heal');
      this.setObjective('Enfrente Lyra no trono.');
      this.saveGame(true);
    });
    return result;
  },

  async storyLyra() {
    if (this.flags.lyraDefeated) return;
    await this.showDialogue([
      { narration: true, text: 'Lyra flutua acima do trono. O Coração de Valdoria brilha em seu peito como uma segunda lua.' },
      { speaker: 'Lyra', portrait: 'lyra', text: 'Você veio pelo seu final de conto de fadas, Kael?' },
      { speaker: 'Kael', portrait: 'kael', text: 'Vim pelo fim dos seus.' },
      { speaker: 'Lyra', portrait: 'lyra', text: 'Eu te amei. De verdade. Mas amar você era aceitar uma vida pequena.' },
      { speaker: 'Kael', portrait: 'kael', text: 'Não. Era aceitar que eu não era seu degrau.' },
      { speaker: 'Lyra', portrait: 'lyra', mood: 'sad', text: 'A Coroa me mostrou o que eu poderia ser.' },
      { speaker: 'Kael', portrait: 'kael', text: 'E olha no que você se tornou.' },
      { narration: true, text: 'A Coroa se abre. As asas de cinza cobrem o salão. O ar vira brasa.' }
    ]);
    const result = await this.battleSequence(ENCOUNTERS.lyra, async () => {
      this.flags.lyraDefeated = true;
      this.hiddenNpcs.add('lyra_castle');
      await this.showDialogue([
        { narration: true, text: 'O Coração racha. Lyra cai de joelhos, o vestido apagado, a coroa partida ao meio.' },
        { speaker: 'Lyra', portrait: 'lyra', mood: 'sad', text: 'Kael... eu... não consigo sentir mais nada.' },
        { speaker: 'Kael', portrait: 'kael', mood: 'sad', text: 'Eu sei. Eu também passei três anos assim.' },
        { speaker: 'Kael', portrait: 'kael', text: 'A diferença é que eu escolhi sentir de novo.' }
      ]);
      const choice = await this.showDialogue([
        { speaker: 'Lyra', portrait: 'lyra', mood: 'sad', text: 'O que você vai fazer comigo?' },
        { speaker: 'Kael', portrait: 'kael', choices: [
          { text: 'Poupar Lyra', value: 'spare' },
          { text: 'Entregá-la à justiça', value: 'justice' }
        ], text: 'A Coroa ainda sussurra. Kael sente o peso do trono em seus ombros.' }
      ]);
      this.endingChoice = choice || 'spare';
      await this.showDialogue([
        { narration: true, text: 'O Coração tenta falar. Promete poder. Promete um reino. Promete apagar toda a dor.' },
        { speaker: 'Kael', portrait: 'kael', text: 'Não. Eu já tenho o que importa.' },
        { narration: true, text: 'Ele ergue a espada e parte a Coroa de Cinzas. O som é de vidro e de corrente quebrando.' }
      ]);
      await this.showEnding();
    });
    return result;
  },

  async showEnding() {
    this.flags.completed = true;
    this.scene = 'ending';
    this.storyBusy = true;
    this.el.hud.classList.add('hidden');
    this.el.touch.classList.add('hidden');
    this.el.interactHint.classList.remove('visible');
    this.deleteSave();
    const spared = this.endingChoice === 'spare';
    const epilogue = spared
      ? 'Lyra viveu. Não como rainha, não como lenda — como uma mulher que precisou aprender a olhar para o próprio reflexo. Darian respondeu por cada crime diante do povo de Valdoria.\n\nKael recusou o trono. Disse que coroas são forjadas para pesar, e ele já carregava o suficiente.\n\nBruma foi reconstruída. Na praça, ergueram uma estátua de um ferreiro sem coroa, a espada voltada para o amanhecer.\n\nDizem que, nas noites de inverno, uma luz ainda arde na velha forja. E que o Cavaleiro das Cinzas nunca deixou de responder quando o povo chamou.'
      : 'Lyra foi julgada diante do povo de Valdoria. Não houve perdão fácil, nem esquecimento. Houve testemunhas, nomes e a verdade dita em voz alta.\n\nDarian respondeu por cada crime. A Coroa foi partida e o Coração, enterrado onde nenhuma mão gananciosa pudesse alcançar.\n\nKael recusou o trono. Disse que coroas são forjadas para pesar, e ele já carregava o suficiente.\n\nBruma foi reconstruída. Na praça, ergueram uma estátua de um ferreiro sem coroa, a espada voltada para o amanhecer.\n\nDizem que, nas noites de inverno, uma luz ainda arde na velha forja. E que o Cavaleiro das Cinzas nunca deixou de responder quando o povo chamou.';
    this.el.endingText.textContent = epilogue;
    const minutes = Math.max(1, Math.round(this.playTime / 60));
    const maxLevel = Math.max(...this.party.map(m => m.level));
    this.el.endingStats.innerHTML = `
      <span><b>${maxLevel}</b>Nível máximo</span>
      <span><b>${this.battlesWon}</b>Batalhas</span>
      <span><b>${minutes} min</b>Jornada</span>
      <span><b>${spared ? 'Poupar' : 'Justiça'}</b>Escolha final</span>
    `;
    this.el.ending.classList.remove('hidden');
    this.audio.playMusic('title');
    this.updateControls();
    this.updateTitleScreen();
  }
};

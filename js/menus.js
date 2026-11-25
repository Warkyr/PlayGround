import { ITEMS, SKILLS, UPGRADES, LORE, CHAPTERS, HEROES, xpForLevel } from './data.js';
import { drawPortrait } from './art.js';

const pct = (value, max) => Math.max(0, Math.min(100, Math.round((value / Math.max(1, max)) * 100)));

const esc = (value) => String(value ?? '').replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

function formatTime(seconds = 0) {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  return `${m}min ${String(s).padStart(2, '0')}s`;
}

const USABLE_OUTSIDE = new Set(['heal', 'mp', 'full', 'cure']);

export const menuMethods = {
  /* ---------------------------------------------------------------- */
  /* Menu                                                              */
  /* ---------------------------------------------------------------- */

  openMenu() {
    if (this.scene !== 'world' || this.storyBusy || this.dialogueActive ||
        this.chapterOpen || this.defeatVisible || this.shopOpen) return;
    this.audio.unlock();
    this.audio.sfx('click');
    this.menuOpen = true;
    this.menuTab = this.menuTab || 'party';
    this.menuItemTarget = null;
    this.el.menu.classList.remove('hidden');
    this.el.menuContent.onclick = (event) => this.handleMenuClick(event);
    this.syncMenuTabs();
    this.renderMenu();
    this.updateControls();
  },

  switchMenuTab(tab) {
    if (!['party', 'items', 'journal', 'save'].includes(tab)) return;
    this.menuTab = tab;
    this.menuItemTarget = null;
    this.audio.sfx('click');
    this.syncMenuTabs();
    this.renderMenu();
  },

  syncMenuTabs() {
    document.querySelectorAll('#menu-overlay .tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === this.menuTab);
    });
  },

  renderMenu() {
    if (!this.menuOpen || !this.el.menuContent) return;
    const renderers = {
      party: this.renderMenuParty,
      items: this.renderMenuItems,
      journal: this.renderMenuJournal,
      save: this.renderMenuSave
    };
    const render = renderers[this.menuTab] || renderers.party;
    this.el.menuContent.innerHTML = render.call(this);
    if (this.menuTab === 'party') {
      for (const canvas of this.el.menuContent.querySelectorAll('canvas[data-menu-portrait]')) {
        drawPortrait(canvas, canvas.dataset.menuPortrait);
      }
    }
  },

  renderMenuParty() {
    const cards = this.party.map(member => {
      const hero = HEROES[member.id] || {};
      const nextXp = xpForLevel(Math.min(12, member.level + 1));
      const currentXp = xpForLevel(member.level);
      const xpText = member.level >= 12
        ? 'Nível máximo'
        : `${Math.max(0, member.xp - currentXp)} / ${Math.max(1, nextXp - currentXp)} XP`;
      const skills = member.skills.map(id => {
        const skill = SKILLS[id];
        return skill ? `<span class="skill-tag" title="${esc(skill.desc)}">${esc(skill.name)}</span>` : '';
      }).join('');
      return `<article class="hero-card">
        <canvas width="60" height="60" data-menu-portrait="${esc(member.id)}" aria-label="Retrato de ${esc(member.name)}"></canvas>
        <div>
          <h3>${esc(member.name)} <span class="hero-level">Nv. ${member.level}</span></h3>
          <span class="role">${esc(member.role)}</span>
          <p class="hero-intro">${esc(hero.intro || '')}</p>
          <div class="stat-row"><span>PV</span><b>${member.hp} / ${member.maxHp}</b></div>
          <div class="stat-row"><span>PM</span><b>${member.mp} / ${member.maxMp}</b></div>
          <div class="stat-row"><span>ATQ · DEF</span><b>${member.stats.atk} · ${member.stats.def}</b></div>
          <div class="stat-row"><span>MAG · VEL</span><b>${member.stats.mag} · ${member.stats.spd}</b></div>
          <div class="stat-row"><span>Arma</span><b>${esc(member.weapon)}</b></div>
          <div class="stat-row"><span>Experiência</span><b>${xpText}</b></div>
        </div>
        <div class="hero-skills">${skills}</div>
      </article>`;
    }).join('');
    return `<div class="hero-grid">${cards}</div>`;
  },

  renderMenuItems() {
    const entries = Object.entries(this.inventory)
      .filter(([id, count]) => count > 0 && ITEMS[id]);

    if (!entries.length) {
      return '<p class="save-meta">A mochila está vazia. Baús, mercadores e vitórias podem mudar isso.</p>';
    }

    const rows = entries.map(([id, count]) => {
      const item = ITEMS[id];
      const usable = USABLE_OUTSIDE.has(item.kind);
      const label = item.kind === 'material' ? 'Material' : usable ? 'Usar' : 'Batalha';
      const targetOpen = this.menuItemTarget === id;
      return `<div class="item-row">
        <div>
          <span class="item-name">${esc(item.icon || '')} ${esc(item.name)}</span>
          <span class="item-desc">${esc(item.desc)}</span>
        </div>
        <span class="item-count">×${count}</span>
        <button class="item-use" data-menu-action="use" data-item="${esc(id)}" ${usable ? '' : 'disabled'}>${label}</button>
      </div>${targetOpen ? this.renderItemTargets(id) : ''}`;
    }).join('');

    return `<div class="item-list">${rows}</div>`;
  },

  renderItemTargets(itemId) {
    const item = ITEMS[itemId];
    if (!item) return '';
    const targets = this.party.map(member => {
      const detail = item.kind === 'mp'
        ? `${member.mp}/${member.maxMp} PM`
        : `${member.hp}/${member.maxHp} PV`;
      return `<button class="target-btn" data-menu-action="apply-item" data-item="${esc(itemId)}" data-member="${esc(member.id)}">
        ${esc(member.name)} <small>${detail}</small>
      </button>`;
    }).join('');
    return `<div class="item-targets">
      <span class="target-label">Usar ${esc(item.name)} em:</span>
      ${targets}
      <button class="target-btn cancel" data-menu-action="cancel-item">Cancelar</button>
    </div>`;
  },

  handleMenuClick(event) {
    const button = event.target.closest('[data-menu-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.menuAction;
    if (action === 'use') {
      this.menuItemTarget = button.dataset.item;
      this.audio.sfx('click');
      this.renderMenu();
    } else if (action === 'cancel-item') {
      this.menuItemTarget = null;
      this.audio.sfx('cancel');
      this.renderMenu();
    } else if (action === 'apply-item') {
      this.applyMenuItem(button.dataset.item, button.dataset.member);
    } else if (action === 'save') {
      this.saveGame(false);
      this.renderMenu();
    } else if (action === 'delete-save') {
      if (window.confirm('Apagar o progresso salvo? Esta ação não pode ser desfeita.')) {
        this.deleteSave();
        this.showToast('Progresso apagado.');
        this.renderMenu();
      }
    } else if (action === 'title') {
      this.closeOverlay('menu-overlay');
      this.returnToTitle();
    }
  },

  applyMenuItem(itemId, memberId) {
    const item = ITEMS[itemId];
    const member = this.party.find(entry => entry.id === memberId);
    if (!item || !member || !this.inventory[itemId]) return;

    if (item.kind === 'heal') {
      if (member.hp >= member.maxHp) {
        this.showToast(`${member.name} já está com os PV cheios.`);
        return;
      }
      member.hp = Math.min(member.maxHp, member.hp + item.amount);
    } else if (item.kind === 'mp') {
      if (member.mp >= member.maxMp) {
        this.showToast(`${member.name} já está com os PM cheios.`);
        return;
      }
      member.mp = Math.min(member.maxMp, member.mp + item.amount);
    } else if (item.kind === 'full') {
      if (member.hp >= member.maxHp && member.mp >= member.maxMp) {
        this.showToast(`${member.name} já está completamente restaurado.`);
        return;
      }
      member.hp = member.maxHp;
      member.mp = member.maxMp;
    } else if (item.kind === 'cure') {
      this.showToast('Antídotos só têm efeito durante uma batalha.');
      return;
    } else {
      this.showToast('Este item só pode ser usado em batalha.');
      return;
    }

    this.inventory[itemId]--;
    if (this.inventory[itemId] <= 0) delete this.inventory[itemId];
    this.menuItemTarget = null;
    this.audio.sfx('heal');
    this.updateHUD();
    this.renderMenu();
    this.showToast(`${member.name} usou ${item.name}.`);
  },

  renderMenuJournal() {
    const chapter = CHAPTERS[this.chapter] || CHAPTERS.prologue;
    const lore = [...this.loreUnlocked]
      .map(id => LORE[id])
      .filter(Boolean);

    let html = `<div class="journal-entry">
      <h3>Objetivo atual</h3>
      <p>${esc(this.objective || 'Explore Valdoria e descubra o que restou.')}</p>
    </div>
    <div class="journal-entry">
      <h3>${esc(chapter.kicker)} — ${esc(chapter.title)}</h3>
      <p>${esc(chapter.quote)}</p>
    </div>
    <div class="journal-entry">
      <h3>Jornada</h3>
      <p>${esc(formatTime(this.playTime))} de jornada · ${this.steps} passos · ${this.battlesWon} batalhas vencidas · ${this.gold} de ouro.</p>
    </div>`;

    if (lore.length) {
      html += lore.map(entry => `<div class="journal-entry">
        <h3>${esc(entry.title)}</h3>
        <p>${esc(entry.text)}</p>
      </div>`).join('');
    } else {
      html += `<div class="journal-entry">
        <h3>Diário vazio</h3>
        <p>Converse com os moradores e examine lugares antigos para registrar novas descobertas.</p>
      </div>`;
    }

    return html;
  },

  renderMenuSave() {
    const meta = this.readSaveMeta();
    const lastSave = meta
      ? `${esc(meta.chapterLabel)} · ${esc(formatTime(meta.playTime || 0))} · ${new Date(meta.timestamp).toLocaleString('pt-BR')}`
      : 'Nenhum progresso salvo neste navegador.';

    return `<div class="save-block">
      <p class="save-warning">Salvar registra o mapa atual, o grupo, os itens e as decisões da história. Você também pode salvar no saco de dormir do acampamento.</p>
      <div class="save-meta">${lastSave}</div>
      <div class="save-actions">
        <button class="primary-btn" data-menu-action="save">Salvar progresso</button>
        <button class="ghost-btn" data-menu-action="delete-save" ${meta ? '' : 'disabled'}>Apagar save</button>
        <button class="ghost-btn" data-menu-action="title">Voltar ao título</button>
      </div>
    </div>`;
  },

  /* ---------------------------------------------------------------- */
  /* Shop / forge                                                      */
  /* ---------------------------------------------------------------- */

  openShop(mode = 'merchant') {
    this.audio.unlock();
    this.shopMode = mode;
    this.shopOpen = true;
    this.el.shop.classList.remove('hidden');
    this.el.shopEyebrow.textContent = mode === 'forge' ? 'FORJA DA BRASA' : 'MERCADOR';
    this.el.shopTitle.textContent = mode === 'forge' ? 'Forja de Tull' : 'Nessa, a Mercadora';
    this.el.shopFootnote.textContent = mode === 'forge'
      ? 'Aço bom não mente. Ele só pesa o que você é capaz de carregar.'
      : 'O que a estrada não leva, o ouro compra.';
    this.el.shopContent.onclick = (event) => this.handleShopClick(event);
    this.renderShop();
    this.updateControls();
    this.audio.sfx('click');
  },

  openForge() {
    this.openShop('forge');
  },

  renderShop() {
    if (!this.el.shopContent) return;
    this.el.shopGold.textContent = this.gold;
    if (this.shopMode === 'forge') {
      this.el.shopContent.innerHTML = this.renderForgeShop();
    } else {
      this.el.shopContent.innerHTML = this.renderMerchantShop();
    }
  },

  renderMerchantShop() {
    const goods = Object.entries(ITEMS)
      .filter(([, item]) => item.price > 0 && item.kind !== 'material');

    const cards = goods.map(([id, item]) => {
      const owned = this.inventory[id] || 0;
      const affordable = this.gold >= item.price;
      return `<div class="shop-item">
        <div>
          <h3>${esc(item.icon || '')} ${esc(item.name)} <span class="shop-owned">×${owned}</span></h3>
          <p>${esc(item.desc)}</p>
        </div>
        <button class="shop-buy" data-shop-action="buy" data-id="${esc(id)}" ${affordable ? '' : 'disabled'}>
          ${item.price} ouro
        </button>
      </div>`;
    }).join('');

    return `<div class="shop-grid">
      <p class="shop-section-title">SUPRIMENTOS DE VIAGEM</p>
      ${cards}
    </div>`;
  },

  renderForgeShop() {
    const shards = this.inventory.shard || 0;
    const cards = this.party.map(member => {
      const upgrade = UPGRADES[member.id];
      if (!upgrade) return '';
      const owned = !!member.upgraded;
      const affordable = this.gold >= upgrade.cost && shards >= upgrade.shards;
      const stats = Object.entries(upgrade.stats)
        .map(([stat, value]) => `+${value} ${stat.toUpperCase()}`)
        .join(' · ');
      return `<div class="shop-item">
        <div>
          <h3>${esc(upgrade.name)}</h3>
          <p>${esc(upgrade.desc)}</p>
          <p class="forge-stats">${stats}</p>
          <p class="forge-req">${owned ? `${esc(member.name)} já empunha esta arma.` : `Requer ${upgrade.cost} ouro e ${upgrade.shards} fragmento(s).`}</p>
        </div>
        <button class="shop-buy" data-shop-action="upgrade" data-id="${esc(member.id)}" ${owned || !affordable ? 'disabled' : ''}>
          ${owned ? 'Forjado' : `${upgrade.cost} ouro + ${upgrade.shards} ✦`}
        </button>
      </div>`;
    }).join('');

    return `<div class="shop-grid">
      <p class="shop-section-title">MELHORIAS DE ARMA · ${shards} FRAGMENTO(S) DE CINZA</p>
      ${cards}
    </div>`;
  },

  handleShopClick(event) {
    const button = event.target.closest('[data-shop-action]');
    if (!button || button.disabled) return;
    if (button.dataset.shopAction === 'buy') {
      this.buyShopItem(button.dataset.id);
    } else if (button.dataset.shopAction === 'upgrade') {
      this.buyUpgrade(button.dataset.id);
    }
  },

  buyShopItem(id) {
    const item = ITEMS[id];
    if (!item || item.price <= 0) return;
    if (this.gold < item.price) {
      this.audio.sfx('cancel');
      this.showToast('Ouro insuficiente.');
      return;
    }
    this.gold -= item.price;
    this.addItem(id, 1);
    this.audio.sfx('confirm');
    this.updateHUD();
    this.renderShop();
    this.showToast(`${item.name} comprado.`);
  },

  buyUpgrade(id) {
    const member = this.party.find(entry => entry.id === id);
    const upgrade = UPGRADES[id];
    if (!member || !upgrade || member.upgraded) return;
    const shards = this.inventory.shard || 0;
    if (this.gold < upgrade.cost) {
      this.audio.sfx('cancel');
      this.showToast('Ouro insuficiente para esta forja.');
      return;
    }
    if (shards < upgrade.shards) {
      this.audio.sfx('cancel');
      this.showToast(`Faltam fragmentos de cinza. Necessário: ${upgrade.shards}.`);
      return;
    }

    this.gold -= upgrade.cost;
    this.inventory.shard = shards - upgrade.shards;
    if (this.inventory.shard <= 0) delete this.inventory.shard;

    member.upgraded = true;
    member.weapon = upgrade.name;
    for (const [stat, value] of Object.entries(upgrade.stats)) {
      if (stat === 'hp') {
        member.maxHp += value;
        member.hp = Math.min(member.maxHp, member.hp + value);
      } else if (stat === 'mp') {
        member.maxMp += value;
        member.mp = Math.min(member.maxMp, member.mp + value);
      } else {
        member.stats[stat] = (member.stats[stat] || 0) + value;
      }
    }

    this.audio.sfx('levelup');
    this.updateHUD();
    this.renderShop();
    this.showToast(`${member.name} recebeu ${upgrade.name}.`);
  }
};

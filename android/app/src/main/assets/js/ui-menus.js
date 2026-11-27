// ui-menus.js — pause menu, inventory, shop
import { Input, clamp } from './util.js';
import { audio } from './audio.js';
import { ui } from './ui.js';
import {
  ITEMS, SKILLS, STATUS_INFO, WEAPONS, weaponBonusText, equipWeapon,
} from './data.js';

const bar = (cls, pct) => `<div class="bar ${cls}"><i style="width:${clamp(pct, 0, 1) * 100}%"></i></div>`;

function statusHTML(game) {
  return `<div class="stat-grid">${game.party.map((m) => {
    const wpn = WEAPONS[m.weapon];
    return `<div class="stat-card">
      <div class="sc-head">
        <div><div class="sc-name">${m.name}</div><div class="sc-role">${m.role}</div></div>
        <div class="sc-lvl">Nv ${m.level}</div>
      </div>
      <div class="stat-bars">
        <div class="stat-line"><span>HP</span>${bar('hp', m.hp / m.maxHp)}<b>${m.hp}/${m.maxHp}</b></div>
        <div class="stat-line"><span>MP</span>${bar('mp', m.mp / m.maxMp)}<b>${m.mp}/${m.maxMp}</b></div>
      </div>
      <div class="stat-attrs">
        <div class="stat-attr">ATQ<b>${m.atk}</b></div>
        <div class="stat-attr">DEF<b>${m.def}</b></div>
        <div class="stat-attr">MAG<b>${m.mag}</b></div>
        <div class="stat-attr">RES<b>${m.res}</b></div>
        <div class="stat-attr">VEL<b>${m.spd}</b></div>
        <div class="stat-attr">SOR<b>${m.lck}</b></div>
      </div>
      <div class="sc-weapon">
        <span>${wpn ? `${wpn.icon} ${wpn.name}` : 'Sem arma'}</span>
        <b>${weaponBonusText(wpn)}</b>
      </div>
      <div class="sc-skills">${m.skills.map((sid) => `<span class="skill-tag">${SKILLS[sid]?.name || sid}</span>`).join('')}</div>
    </div>`;
  }).join('')}</div>`;
}

function itemsHTML(game) {
  const consumables = Object.keys(game.inventory).filter((id) => ITEMS[id] && !ITEMS[id].key && game.inventory[id] > 0);
  const keys = Object.keys(game.inventory).filter((id) => ITEMS[id]?.key && game.inventory[id] > 0);
  if (!consumables.length && !keys.length) return '<div class="key-note">A mochila está vazia. O vento também estava.</div>';
  let html = '<div class="item-list">';
  for (const id of consumables) {
    const it = ITEMS[id];
    html += `<div class="item-row clickable" data-item="${id}">
      <div class="item-ico">${it.icon || '◈'}</div>
      <div class="item-name">${it.name}<small>${it.desc}</small></div>
      <div class="item-qty">x${game.inventory[id]}</div>
      <div class="item-use">Usar</div>
    </div>`;
  }
  if (keys.length) {
    html += `<div style="margin:14px 0 6px;font-family:var(--pixel);font-size:7px;color:var(--gold);letter-spacing:1px">ITENS DE HISTÓRIA</div>`;
    for (const id of keys) {
      const it = ITEMS[id];
      html += `<div class="item-row">
        <div class="item-ico">${it.icon || '✦'}</div>
        <div class="item-name">${it.name}<small>${it.desc}</small></div>
        <div class="item-qty">—</div>
      </div>`;
    }
  }
  html += '</div>';
  return html;
}

function journalHTML(game) {
  const list = game.journal || [];
  if (!list.length) return '<div class="key-note">Nenhum objetivo registrado ainda.</div>';
  return `<div class="journal-list">${list.map((j) => `
    <div class="journal-item ${j.active ? 'active' : ''}">
      <span class="j-ch">${j.chapter || ''}${j.active ? ' · EM ANDAMENTO' : ' · CONCLUÍDO'}</span>
      ${j.text}
    </div>`).join('')}</div>`;
}

export async function pauseMenu(game, actions = {}) {
  const content = document.createElement('div');
  content.className = 'screen pause-screen';
  content.innerHTML = `
    <div class="screen-head">
      <div class="screen-title">Diário de Jornada</div>
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:16px;color:var(--muted)">${game.playTimeLabel || ''}</span>
        <button class="screen-close">Fechar</button>
      </div>
    </div>
    <div class="pause-layout">
      <nav class="pause-nav">
        <button class="pnav-btn" data-tab="status"><span class="ico">◈</span>Status</button>
        <button class="pnav-btn" data-tab="items"><span class="ico">✦</span>Itens</button>
        <button class="pnav-btn" data-tab="journal"><span class="ico">✧</span>Diário</button>
        <button class="pnav-btn" data-tab="save"><span class="ico">⚿</span>Salvar</button>
        <button class="pnav-btn" data-tab="system"><span class="ico">⚙</span>Sistema</button>
      </nav>
      <div class="pause-content" id="pause-content"></div>
    </div>
    <div style="padding:8px 16px 12px;font-size:14px;color:var(--muted);border-top:1px solid rgba(231,199,123,.12)">
      ↑↓ navegar · ←→ trocar aba · Enter selecionar · Esc voltar
    </div>`;
  ui.openScreen(content, { dim: true });
  audio.sfx('confirm');

  const tabs = ['status', 'items', 'journal', 'save', 'system'];
  let tabIndex = 0;
  let navIndex = 0;
  let contentIndex = 0;
  let focus = 'nav';
  const navBtns = [...content.querySelectorAll('.pnav-btn')];
  const contentEl = content.querySelector('#pause-content');
  let contentActions = [];

  const renderNav = () => {
    navBtns.forEach((b, i) => {
      b.classList.toggle('sel', i === navIndex && focus === 'nav');
      b.style.outline = (i === navIndex && focus === 'content') ? '1px solid rgba(231,199,123,.28)' : '';
    });
  };

  // Repaint selection in place. Rebuilding the list on mouseenter detached the
  // row under the pointer and could swallow the click that followed.
  const paintContentSelection = () => {
    const rows = [...contentEl.querySelectorAll('.item-row.clickable')];
    rows.forEach((row, i) => row.classList.toggle('sel', focus === 'content' && i === contentIndex));
    renderNav();
  };

  // Keep the keyboard selection on screen when the panel is scrollable (short
  // landscape phones, small windows).
  const scrollContentSelection = () => {
    const rows = [...contentEl.querySelectorAll('.item-row.clickable')];
    rows[contentIndex]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  const useItem = async (id) => {
    const it = ITEMS[id];
    if (!it || it.key) { ui.toast('Um item de história. Não pode ser usado aqui.', '', '✦'); return; }
    if (!game.inventory[id]) return;
    // Bombs and smoke bombs only have a battle effect. Consuming them from the
    // pause menu used to silently waste the item, so explain and keep it.
    if (!it.heal && !it.mp && !it.cure && !it.full) {
      ui.toast('Este item só pode ser usado em batalha.', '', it.icon || '◈');
      return;
    }
    let target = null;
    if (it.target === 'ally') {
      const options = game.party.map((m) => ({ label: `${m.name}  (${m.hp}/${m.maxHp} HP)`, value: m.id }));
      const pick = await ui.choice('Usar em quem?', options);
      if (pick == null) return;
      target = game.party.find((m) => m.id === pick);
    }
    if (!target) return;
    if (it.heal) {
      if (target.hp >= target.maxHp) { ui.toast(`${target.name} já está com HP cheio.`, '', '♥'); return; }
      target.hp = Math.min(target.maxHp, target.hp + it.heal);
      ui.toast(`${target.name} recuperou ${it.heal} de HP.`, 'gold', '♥');
    }
    if (it.mp) {
      if (target.mp >= target.maxMp) { ui.toast(`${target.name} já está com MP cheio.`, '', '✦'); return; }
      target.mp = Math.min(target.maxMp, target.mp + it.mp);
      ui.toast(`${target.name} recuperou ${it.mp} de MP.`, 'gold', '✦');
    }
    if (it.cure) {
      if (!Object.keys(target.status || {}).length) { ui.toast(`${target.name} não precisa de antídoto.`, '', '✚'); return; }
      target.status = {};
      ui.toast(`${target.name} foi curado.`, 'gold', '✚');
    }
    if (it.full) {
      target.hp = target.maxHp; target.mp = target.maxMp; target.status = {};
      ui.toast(`${target.name} foi completamente restaurado.`, 'gold', '◈');
    }
    game.inventory[id]--;
    if (game.inventory[id] <= 0) delete game.inventory[id];
    audio.sfx('heal');
    ui.updateHUD(game);
    contentIndex = 0;
    renderContent();
  };

  const renderContent = () => {
    contentActions = [];
    const tab = tabs[tabIndex];
    navBtns.forEach((b, i) => b.classList.toggle('sel', i === tabIndex && focus === 'nav'));
    if (tab === 'status') {
      contentEl.innerHTML = statusHTML(game);
    } else if (tab === 'items') {
      contentEl.innerHTML = itemsHTML(game);
      const rows = [...contentEl.querySelectorAll('.item-row.clickable')];
      rows.forEach((row, i) => {
        row.classList.toggle('sel', focus === 'content' && i === contentIndex);
        row.addEventListener('mousemove', () => {
          if (focus === 'content' && contentIndex === i) return;
          contentIndex = i; focus = 'content'; paintContentSelection();
        });
        row.addEventListener('click', () => { contentIndex = i; focus = 'content'; useItem(row.dataset.item); });
        contentActions.push({ type: 'item', id: row.dataset.item });
      });
      if (focus === 'content' && !rows.length) focus = 'nav';
    } else if (tab === 'journal') {
      contentEl.innerHTML = `<h3>Diário</h3>${journalHTML(game)}`;
    } else if (tab === 'save') {
      contentEl.innerHTML = `<h3>Salvar progresso</h3>
        <p style="font-size:18px;color:var(--muted);line-height:1.2">Grave sua jornada no capítulo atual. O progresso fica guardado neste navegador.</p>
        <div class="item-row clickable" id="save-row" style="margin-top:14px">
          <div class="item-ico">⚿</div>
          <div class="item-name">Salvar agora<small>${game.mapName || ''} · ${game.playTimeLabel || ''}</small></div>
          <div class="item-qty">${game.gold} ◈</div>
          <div class="item-use">Gravar</div>
        </div>`;
      const row = contentEl.querySelector('#save-row');
      row.classList.toggle('sel', focus === 'content');
      row.addEventListener('mousemove', () => {
        if (focus === 'content') return;
        focus = 'content'; contentIndex = 0; paintContentSelection();
      });
      row.addEventListener('click', doSave);
      contentActions.push({ type: 'save' });
    } else if (tab === 'system') {
      contentEl.innerHTML = `<h3>Sistema</h3>
        <div class="item-list">
          <div class="item-row clickable" data-sys="mute"><div class="item-ico">♪</div><div class="item-name">Som<small>${audio.muted ? 'Desligado' : 'Ligado'}</small></div><div class="item-use">Alternar</div></div>
          <div class="item-row clickable" data-sys="controls"><div class="item-ico">⌨</div><div class="item-name">Controles<small>WASD/setas mover · Espaço interagir · Esc menu</small></div><div class="item-use">Ver</div></div>
          <div class="item-row clickable" data-sys="title"><div class="item-ico">✕</div><div class="item-name">Voltar ao título<small>O progresso não salvo será perdido.</small></div><div class="item-use">Sair</div></div>
        </div>`;
      const rows = [...contentEl.querySelectorAll('[data-sys]')];
      rows.forEach((row, i) => {
        row.classList.toggle('sel', focus === 'content' && i === contentIndex);
        row.addEventListener('mousemove', () => {
          if (focus === 'content' && contentIndex === i) return;
          contentIndex = i; focus = 'content'; paintContentSelection();
        });
        row.addEventListener('click', () => sysAction(row.dataset.sys));
        contentActions.push({ type: 'sys', id: row.dataset.sys });
      });
      if (focus === 'content' && !rows.length) focus = 'nav';
    }
    renderNav();
  };

  const doSave = async () => {
    const ok = actions.save ? actions.save() : false;
    if (ok) { ui.toast('Progresso salvo.', 'gold', '⚿'); audio.sfx('save'); }
    else ui.toast('Não foi possível salvar agora.', 'red', '✕');
  };

  const sysAction = async (id) => {
    if (id === 'mute') { const m = audio.toggleMuted(); ui.updateMuteIcon(m); renderContent(); }
    if (id === 'controls') {
      await ui.modal({
        kicker: 'Controles', title: 'Como jogar',
        body: `<p style="font-size:19px;line-height:1.3">Mova com <b>WASD</b> ou setas. Interaja com <b>Espaço</b>, <b>Enter</b> ou <b>Z</b>. Abra o menu com <b>Esc</b> ou <b>X</b>.<br><br>Em batalhas, escolha ações com as setas e confirme com Enter. No celular, use o direcional e os botões A/B.</p>`,
        actions: [{ label: 'Entendi', value: 'ok', primary: true }],
      });
      renderContent();
    }
    if (id === 'title') {
      const v = await ui.modal({
        kicker: 'Sair', title: 'Voltar ao título?', sub: 'O progresso não salvo será perdido.',
        actions: [{ label: 'Cancelar', value: 'cancel', cancel: true }, { label: 'Voltar ao título', value: 'title', primary: true }],
      });
      if (v === 'title') finish('title');
    }
  };

  const finish = (result) => {
    Input.pop(handler);
    ui.closeScreen();
    audio.sfx('cancel');
    resolve(result);
  };

  let resolve;
  const done = new Promise((r) => { resolve = r; });

  const switchTab = (i) => {
    tabIndex = (i + tabs.length) % tabs.length;
    navIndex = tabIndex;
    contentIndex = 0;
    focus = 'nav';
    audio.sfx('cursor');
    renderContent();
  };

  const handler = (a) => {
    if (focus === 'nav') {
      if (a === 'up') { navIndex = (navIndex - 1 + tabs.length) % tabs.length; switchTab(navIndex); return true; }
      if (a === 'down') { navIndex = (navIndex + 1) % tabs.length; switchTab(navIndex); return true; }
      if (a === 'right' || a === 'confirm') {
        const tab = tabs[tabIndex];
        if (tab === 'save') { focus = 'content'; contentIndex = 0; renderContent(); return true; }
        if (tab === 'items' || tab === 'system') { focus = 'content'; contentIndex = 0; renderContent(); return true; }
        if (tab === 'status' || tab === 'journal') return true;
      }
      if (a === 'cancel') { finish('close'); return true; }
      return true;
    }
    // content focus
    if (a === 'up' || a === 'down') {
      if (!contentActions.length) return true;
      contentIndex = a === 'up'
        ? Math.max(0, contentIndex - 1)
        : Math.min(contentActions.length - 1, contentIndex + 1);
      // Only repaint: rebuilding would let a stationary pointer's mouseenter
      // snap the selection back to the row under the cursor.
      paintContentSelection();
      scrollContentSelection();
      return true;
    }
    if (a === 'cancel' || a === 'left') { focus = 'nav'; renderContent(); return true; }
    if (a === 'confirm') {
      const act = contentActions[contentIndex];
      if (!act) return true;
      if (act.type === 'item') useItem(act.id);
      if (act.type === 'save') doSave();
      if (act.type === 'sys') sysAction(act.id);
      return true;
    }
    return true;
  };

  navBtns.forEach((b, i) => {
    b.addEventListener('mouseenter', () => { navIndex = i; if (focus === 'nav') renderContent(); });
    b.addEventListener('click', () => { navIndex = i; switchTab(i); });
  });
  content.querySelector('.screen-close').addEventListener('click', () => finish('close'));
  Input.push(handler);
  renderContent();
  return done;
}

export async function shopMenu(game, stock, title = 'Mercador') {
  const content = document.createElement('div');
  content.className = 'screen';
  const render = () => {
    content.innerHTML = `
      <div class="screen-head">
        <div class="screen-title">${title}</div>
        <div style="display:flex;gap:14px;align-items:center">
          <span style="font-size:19px;color:var(--gold)">◈ ${game.gold}</span>
          <button class="screen-close">Sair</button>
        </div>
      </div>
      <div class="screen-body">
        <p style="font-size:17px;color:var(--muted);margin:0 0 12px">"Leve o que precisar. O amanhecer não espera ninguém."</p>
        <div class="item-list" id="shop-list">
          ${stock.map((id, i) => {
            const it = ITEMS[id];
            const own = game.inventory[id] || 0;
            const can = game.gold >= it.price;
            return `<div class="item-row clickable ${can ? '' : 'disabled'}" data-shop="${id}" data-i="${i}" style="${can ? '' : 'opacity:.42'}">
              <div class="item-ico">${it.icon || '◈'}</div>
              <div class="item-name">${it.name}<small>${it.desc}</small></div>
              <div class="item-qty">x${own}</div>
              <div class="item-use">◈ ${it.price}</div>
            </div>`;
          }).join('')}
        </div>
        <div style="margin-top:14px;font-size:15px;color:var(--muted)">↑↓ escolher · Enter comprar · Esc sair</div>
      </div>`;
    content.querySelector('.screen-close').addEventListener('click', () => finish());
    const rows = [...content.querySelectorAll('[data-shop]')];
    rows.forEach((row, i) => {
      row.classList.toggle('sel', i === sel);
      row.addEventListener('mousemove', () => {
        if (sel === i) return;
        sel = i;
        paint();
        audio.sfx('cursor');
      });
      row.addEventListener('click', () => buy(row.dataset.shop));
    });
  };
  const paint = () => {
    content.querySelectorAll('[data-shop]').forEach((row, i) => row.classList.toggle('sel', i === sel));
  };
  const scrollSelected = () => {
    content.querySelectorAll('[data-shop]')[sel]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  let sel = 0;
  let resolve;
  const done = new Promise((r) => { resolve = r; });
  const finish = () => { Input.pop(handler); ui.closeScreen(); audio.sfx('cancel'); resolve(); };
  const buy = (id) => {
    const it = ITEMS[id];
    if (game.gold < it.price) { ui.toast('Ouro insuficiente.', 'red', '◈'); audio.sfx('cancel'); return; }
    game.gold -= it.price;
    game.inventory[id] = (game.inventory[id] || 0) + 1;
    audio.sfx('chest');
    ui.toast(`Comprou ${it.name}.`, 'gold', it.icon || '◈');
    ui.updateHUD(game);
    render();
    scrollSelected();
  };
  const handler = (a) => {
    if (a === 'up') { sel = Math.max(0, sel - 1); paint(); scrollSelected(); audio.sfx('cursor'); return true; }
    if (a === 'down') { sel = Math.min(stock.length - 1, sel + 1); paint(); scrollSelected(); audio.sfx('cursor'); return true; }
    if (a === 'confirm') { buy(stock[sel]); return true; }
    if (a === 'cancel') { finish(); return true; }
    return true;
  };
  ui.openScreen(content, { dim: true });
  Input.push(handler);
  render();
  return done;
}

// Dedicated smith screen. Buying a weapon equips it immediately, so the
// player always sees the new ATQ/MAG on the status tab without a second
// equipment menu. Hover only repaints selection (never rebuilds the list),
// avoiding the mouseenter loop that a full render-on-hover can cause.
export async function weaponShopMenu(game, stock, title = 'Ferreiro') {
  const content = document.createElement('div');
  content.className = 'screen weapon-shop';
  const ids = stock.filter((id) => {
    const w = WEAPONS[id];
    return w && game.party.some((m) => m.id === w.user);
  });
  let sel = 0;
  let resolve;
  const done = new Promise((r) => { resolve = r; });
  const finish = () => {
    Input.pop(handler);
    ui.closeScreen();
    audio.sfx('cancel');
    resolve();
  };
  const ownerOf = (w) => game.party.find((m) => m.id === w.user);
  const isOwned = (id) => !!game.weapons?.[id];
  const isEquipped = (id) => ownerOf(WEAPONS[id])?.weapon === id;

  const render = () => {
    content.innerHTML = `
      <div class="screen-head">
        <div class="screen-title">${title}</div>
        <div style="display:flex;gap:14px;align-items:center">
          <span style="font-size:19px;color:var(--gold)">◈ ${game.gold}</span>
          <button class="screen-close">Sair</button>
        </div>
      </div>
      <div class="screen-body">
        <p style="font-size:17px;color:var(--muted);margin:0 0 12px">"Aço bom não faz o herói. Mas evita que ele morra antes de virar um."</p>
        <div class="item-list" id="weapon-list">
          ${ids.length ? ids.map((id, i) => {
            const w = WEAPONS[id];
            const owner = ownerOf(w);
            const owned = isOwned(id);
            const equipped = isEquipped(id);
            const affordable = game.gold >= w.price;
            const status = equipped ? 'Equipado' : owned ? 'Equipar' : affordable ? 'Comprar' : 'Sem ouro';
            const price = equipped ? 'EM USO' : owned ? 'NA MOCHILA' : `◈ ${w.price}`;
            return `<div class="item-row clickable weapon-row ${i === sel ? 'sel' : ''} ${!owned && !affordable ? 'locked' : ''}" data-shop="${id}" data-i="${i}">
              <div class="item-ico">${w.icon}</div>
              <div class="item-name">${w.name}<small>${w.desc}</small><span class="weapon-stat">${owner?.name || w.user} · ${weaponBonusText(w)}</span></div>
              <div class="item-qty">${price}</div>
              <div class="item-use">${status}</div>
            </div>`;
          }).join('') : '<div class="key-note">Nenhuma arma disponível para o seu grupo.</div>'}
        </div>
        <div style="margin-top:14px;font-size:15px;color:var(--muted)">↑↓ escolher · Enter comprar/equipar · Esc sair</div>
      </div>`;
    content.querySelector('.screen-close').addEventListener('click', finish);
    content.querySelectorAll('[data-shop]').forEach((row, i) => {
      row.addEventListener('mousemove', () => {
        if (sel === i) return;
        sel = i;
        paint();
        audio.sfx('cursor');
      });
      row.addEventListener('click', () => choose(row.dataset.shop));
    });
  };

  const paint = () => {
    content.querySelectorAll('[data-shop]').forEach((row, i) => row.classList.toggle('sel', i === sel));
  };

  const scrollSelected = () => {
    content.querySelectorAll('[data-shop]')[sel]?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  const choose = (id) => {
    const w = WEAPONS[id];
    if (!w) return;
    const owner = ownerOf(w);
    if (!owner) { ui.toast('Esse aliado ainda não está no grupo.', 'red', '✦'); return; }
    if (isOwned(id)) {
      if (isEquipped(id)) { audio.sfx('cancel'); return; }
      equipWeapon(owner, id);
      audio.sfx('confirm');
      ui.toast(`${owner.name} equipou ${w.name}.`, 'gold', w.icon);
      ui.updateHUD(game);
      render();
      scrollSelected();
      return;
    }
    if (game.gold < w.price) {
      audio.sfx('cancel');
      ui.toast('Ouro insuficiente.', 'red', '◈');
      return;
    }
    game.gold -= w.price;
    if (!game.weapons) game.weapons = {};
    game.weapons[id] = true;
    equipWeapon(owner, id);
    audio.sfx('chest');
    ui.toast(`${owner.name} equipou ${w.name}.`, 'gold', w.icon);
    ui.updateHUD(game);
    render();
    scrollSelected();
  };

  const handler = (a) => {
    if (a === 'up') { sel = (sel - 1 + Math.max(1, ids.length)) % Math.max(1, ids.length); paint(); scrollSelected(); audio.sfx('cursor'); return true; }
    if (a === 'down') { sel = (sel + 1) % Math.max(1, ids.length); paint(); scrollSelected(); audio.sfx('cursor'); return true; }
    if (a === 'confirm') { if (ids[sel]) choose(ids[sel]); return true; }
    if (a === 'cancel') { finish(); return true; }
    return true;
  };

  ui.openScreen(content, { dim: true });
  Input.push(handler);
  render();
  return done;
}

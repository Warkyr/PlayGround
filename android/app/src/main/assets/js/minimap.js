// minimap.js — clean, readable map rendering for the pause menu.
//
// The exploration camera shows only a few tiles at once, so the pause menu map
// is intentionally schematic: flat terrain bands, simple prop blocks and a
// small set of high-contrast markers. It is a navigation aid, not a second
// game renderer.
import { THEMES } from './art/tiles.js';
import { propSize } from './art/props.js';

const TS = 8; // logical pixels per tile

const tileColor = (ch, th) => {
  switch (ch) {
    case '.': return th.grass;
    case ',': return th.grass2;
    case '"': return th.grassDark;
    case 'f': return th.grassDark;
    case 'p': return th.path;
    case 'd': return th.path2;
    case '~': return th.water;
    case 'b': return th.wood;
    case 'S': return th.grass;
    case 'i': return th.waterLight;
    case '#': return th.wall2;
    case 'W': return th.wood;
    case 'c': return th.accent;
    case '=': return th.stone;
    case 'u': return '#3c3c44';
    default: return th.grass;
  }
};

const propTint = (p, th) => {
  if (p.t === 'house') return p.v === 'blue' ? '#3e5678' : p.v === 'thatch' ? '#8a7038' : th.roof;
  if (p.t === 'tree' || p.t === 'pine') return th.grassDark;
  if (p.t === 'treeSnow' || p.t === 'pineSnow') return '#dce8f2';
  if (p.t === 'fountain' || p.t === 'well') return th.water;
  if (p.t === 'stall' || p.t === 'campfire') return '#c9a44c';
  if (p.t === 'gate') return th.roof2;
  if (p.t === 'fence') return th.wood2;
  if (p.t === 'crystal' || p.t === 'portal') return th.accent;
  if (p.t === 'torch' || p.t === 'lamp' || p.t === 'forge') return '#ffcf7a';
  if (p.t === 'plant' || p.t === 'bush') return th.grass2;
  return th.stone2;
};

export function drawMinimap(canvas, map, opts = {}) {
  if (!canvas || !map) return;
  const { game, player, target } = opts;
  const th = THEMES[map.theme] || THEMES.village;
  canvas.width = map.w * TS;
  canvas.height = map.h * TS;
  canvas.style.aspectRatio = `${map.w} / ${map.h}`;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.clearRect(0, 0, canvas.width, canvas.height);

  // Terrain.
  for (let y = 0; y < map.h; y++) {
    const row = map.ground[y] || '';
    for (let x = 0; x < map.w; x++) {
      g.fillStyle = tileColor(row[x] || '.', th);
      g.fillRect(x * TS, y * TS, TS, TS);
    }
  }

  // A soft outline keeps the playable area distinct from the panel.
  g.strokeStyle = 'rgba(231,199,123,.28)';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);

  // Props: footprints only, with a darker edge on buildings.
  for (const p of map.props) {
    if (p.hidden) continue;
    const size = propSize(p);
    const x = p.x * TS, y = p.y * TS, w = size.w * TS, h = size.h * TS;
    g.fillStyle = propTint(p, th);
    if (p.t === 'house') {
      g.fillRect(x + 1, y + 1, w - 2, h - 2);
      g.strokeStyle = 'rgba(0,0,0,.35)';
      g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
    } else if (p.t === 'tree' || p.t === 'pine' || p.t === 'treeSnow' || p.t === 'pineSnow') {
      g.beginPath();
      g.arc(x + w / 2, y + h / 2, Math.max(2, TS * 0.42), 0, Math.PI * 2);
      g.fill();
    } else if (p.t === 'fountain' || p.t === 'well') {
      g.beginPath();
      g.arc(x + w / 2, y + h / 2, Math.max(2, TS * 0.55), 0, Math.PI * 2);
      g.fill();
    } else if (p.t === 'fence') {
      g.fillRect(x, y + TS - 2, TS, 1);
    } else {
      g.fillRect(x, y, Math.max(2, w), Math.max(2, h));
    }
  }

  // Exits / portals.
  for (const p of map.portals) {
    const locked = p.when && game && !p.when(game);
    g.fillStyle = locked ? 'rgba(160,170,190,.35)' : '#7fe0d0';
    const pw = (p.w || 1) * TS, ph = (p.h || 1) * TS;
    g.fillRect(p.x * TS + 1, p.y * TS + 1, Math.max(2, pw - 2), Math.max(2, ph - 2));
  }

  // Chests still waiting to be opened.
  for (const c of map.chests || []) {
    if (game?.chests?.[c.id]) continue;
    if (c.when && game && !c.when(game)) continue;
    g.fillStyle = '#e7c77b';
    g.fillRect(c.x * TS + 2, c.y * TS + 2, TS - 4, TS - 4);
  }

  // NPCs that are present.
  for (const n of map.npcs || []) {
    if (n.when && game && !n.when(game)) continue;
    g.fillStyle = '#a8c8e8';
    g.beginPath();
    g.arc(n.x * TS + TS / 2, n.y * TS + TS / 2, 2.2, 0, Math.PI * 2);
    g.fill();
  }

  // Main objective, when it belongs to this map.
  if (target && target.map === map.id) {
    const cx = target.x * TS + TS / 2;
    const cy = target.y * TS + TS / 2;
    g.strokeStyle = 'rgba(255,210,122,.55)';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, TS * 1.35, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#ffd27a';
    g.beginPath();
    g.moveTo(cx, cy - TS * 0.9);
    g.lineTo(cx + TS * 0.8, cy);
    g.lineTo(cx, cy + TS * 0.9);
    g.lineTo(cx - TS * 0.8, cy);
    g.closePath();
    g.fill();
    g.strokeStyle = 'rgba(20,14,8,.85)';
    g.lineWidth = 1;
    g.stroke();
  }

  // Player marker: a small gold arrow showing facing.
  if (player) {
    const cx = player.x * TS + TS / 2;
    const cy = player.y * TS + TS / 2;
    const dir = player.dir || 'down';
    const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
    const r = 4.2;
    g.fillStyle = '#fff2c8';
    g.strokeStyle = '#1a1208';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(cx + dx * r, cy + dy * r);
    g.lineTo(cx - dx * r + dy * r * 0.7, cy - dy * r + dx * r * 0.7);
    g.lineTo(cx - dx * r - dy * r * 0.7, cy - dy * r - dx * r * 0.7);
    g.closePath();
    g.fill();
    g.stroke();
  }
}

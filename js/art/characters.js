// art/characters.js — procedural pixel characters & portraits
import { makeCanvas, hash2 } from '../util.js';

export const HUMANS = {
  kael: { name:'Kael', skin:'#f0c090', skin2:'#d19a6a', hair:'#5a3520', hair2:'#3d2415', hairStyle:'short',
    top:'#3d5f8a', top2:'#2a4568', trim:'#e0b45e', pants:'#33313d', boots:'#1c1b24',
    cape:'#7e2f3e', cape2:'#5a2130', weapon:'sword', accent:'#e7c77b', eye:'#241610' },
  lyra: { name:'Lyra', skin:'#f4cba4', skin2:'#d6a377', hair:'#e2c07a', hair2:'#b8954f', hairStyle:'long',
    top:'#e8e1c8', top2:'#c9c0a2', trim:'#7ba36a', pants:'#6c7f5a', boots:'#4a3a2a',
    skirt:'#8aa06e', weapon:'none', accent:'#bfe3a8', eye:'#4a6b3a' },
  dorian: { name:'Dorian', skin:'#e8b98f', skin2:'#c49268', hair:'#2a2028', hair2:'#181018', hairStyle:'short',
    top:'#7a2638', top2:'#571a28', trim:'#c9a44c', pants:'#241c26', boots:'#151018',
    cape:'#3a1420', cape2:'#260b13', weapon:'sword', accent:'#e35f72', eye:'#2a1a14' },
  garrick: { name:'Garrick', skin:'#d8a87e', skin2:'#b5865c', hair:'#c9c9c9', hair2:'#9a9a9a', hairStyle:'bald',
    beard:'#c9c9c9', top:'#5c6577', top2:'#444c5c', trim:'#9aa3b5', pants:'#3a3d48', boots:'#22242c',
    cape:'#2f4a6e', cape2:'#1e3350', weapon:'sword', accent:'#a8c4e0', eye:'#3a2a1a' },
  mira: { name:'Mira', skin:'#f2c8a8', skin2:'#d3a07c', hair:'#8b6fd8', hair2:'#674dab', hairStyle:'hood',
    top:'#5a4a8e', top2:'#41336a', trim:'#c9a4e8', pants:'#3a2f52', boots:'#241c34',
    cape:'#3d2f66', cape2:'#2a1f4a', weapon:'staff', accent:'#b795e8', eye:'#5a3a7a', orb:'#b795e8' },
  villager1: { skin:'#e8b990', skin2:'#c69268', hair:'#6b4a2a', hairStyle:'short', top:'#7a6a4a', top2:'#5c4f36', trim:'#b39a6a', pants:'#4a4438', boots:'#2e2a22', weapon:'none', accent:'#c9b98a' },
  villager2: { skin:'#c68a62', skin2:'#a06a48', hair:'#2a1a12', hairStyle:'long', top:'#8a5a4a', top2:'#6a4236', trim:'#c9a07a', pants:'#3f3a44', boots:'#26222c', skirt:'#6a4a5a', weapon:'none', accent:'#d8a08a' },
  villager3: { skin:'#f2c8a8', skin2:'#d3a07c', hair:'#c9a04a', hairStyle:'ponytail', top:'#5a7a8a', top2:'#41606e', trim:'#a8c4c9', pants:'#3f4a52', boots:'#282e34', weapon:'none', accent:'#a8d8e0' },
  elder: { skin:'#d8b090', skin2:'#b58a6a', hair:'#e0e0e0', hair2:'#bdbdbd', hairStyle:'long', beard:'#e0e0e0', top:'#6a5a7a', top2:'#4e4260', trim:'#c9b98a', pants:'#3a3444', boots:'#24202c', weapon:'staff', accent:'#d8c9a0', eye:'#3a2a20' },
  merchant: { skin:'#e0a878', skin2:'#bd8252', hair:'#4a3020', hairStyle:'short', top:'#8a6a3a', top2:'#6a4e28', trim:'#e0c070', pants:'#4a3f34', boots:'#2e261e', weapon:'none', accent:'#e0c070' },
  child: { skin:'#f2c8a8', skin2:'#d3a07c', hair:'#8a5a2a', hairStyle:'spiky', top:'#6a8a5a', top2:'#4e6a42', trim:'#b8d090', pants:'#4a4438', boots:'#2e2a22', weapon:'none', accent:'#b8d090' },
  guard: { skin:'#d8a87e', skin2:'#b5865c', hair:'#3a3a44', hairStyle:'helmet', top:'#5c6470', top2:'#444c58', trim:'#a8b0bc', pants:'#3a3f48', boots:'#242830', cape:'#6a2a30', weapon:'spear', accent:'#a8b0bc', eye:'#2a2018' },
  bandit: { skin:'#c68a62', skin2:'#a06a48', hair:'#3a2418', hairStyle:'bandana', top:'#5a4030', top2:'#42301f', trim:'#8a2a2a', pants:'#3a3228', boots:'#241e18', weapon:'axe', accent:'#c05a4a', eye:'#2a1a10' },
  jailer: { skin:'#c08a62', skin2:'#9a6a48', hair:'#2a1a12', hairStyle:'bald', top:'#4a3a34', top2:'#342824', trim:'#6a5a4a', pants:'#332c28', boots:'#201a16', weapon:'club', accent:'#a06040', eye:'#2a1a10', fat:true },
  champion: { skin:'#d8a87e', skin2:'#b5865c', hair:'#2a2028', hairStyle:'helmet', top:'#5a1f2e', top2:'#3d1220', trim:'#c9a44c', pants:'#2a1e28', boots:'#181018', cape:'#7e2638', weapon:'sword', accent:'#e35f72', eye:'#2a1a14', plume:'#c92f3f' },
  darkknight: { skin:'#b08a6a', skin2:'#8a6848', hair:'#1a1420', hairStyle:'helmet', top:'#2e2a3a', top2:'#1e1a28', trim:'#7a6a8a', pants:'#242030', boots:'#16121e', cape:'#2a1e3a', weapon:'sword', accent:'#b795e8', eye:'#b795e8', plume:'#3a2a5a' },
  resistance: { skin:'#c68a62', skin2:'#a06a48', hair:'#4a3020', hairStyle:'short', top:'#4a5a3a', top2:'#36442a', trim:'#8a7a4a', pants:'#3a3a30', boots:'#24241c', cape:'#2a3324', weapon:'sword', accent:'#a8c47a' },
};

const SPRITE_W = 20, SPRITE_H = 28;
const cache = new Map();
const silhouetteCache = new Map();

function px(g, c, x, y, w, h) { g.fillStyle = c; g.fillRect(x, y, w, h); }

function mixHex(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1)}`;
}
const lighten = (c, t = 0.16) => mixHex(c, '#ffffff', t);
const darken = (c, t = 0.2) => mixHex(c, '#000000', t);

// The hairline must stop above the eyes. The old renderer drew a hair block
// (plus its outline) over y=6, which is exactly where the eyes live, so every
// non-bald character showed only a chin strip. Each facing now has its own
// hair shape that leaves the face readable.
function drawHair(g, d, facing, topY = 3) {
  const h = d.hair || '#4a3020';
  const h2 = d.hair2 || h;
  const hi = lighten(h, 0.22);
  const sh = darken(h2, 0.24);
  const o = '#1a1218';
  const style = d.hairStyle || 'short';
  const y = topY;

  // ---------------------------------------------------------------- back view
  if (facing === 'up') {
    if (style === 'bald') {
      px(g, d.skin2, 6, y + 1, 8, 2);
      px(g, lighten(d.skin, 0.16), 7, y + 1, 4, 1);
      px(g, '#e8e8e8', 6, y + 5, 2, 2);
      px(g, '#e8e8e8', 12, y + 5, 2, 2);
      return;
    }
    if (style === 'helmet') {
      px(g, o, 5, y - 1, 10, 8);
      px(g, d.trim, 6, y, 8, 6);
      px(g, lighten(d.trim, 0.25), 7, y + 1, 5, 2);
      px(g, '#dfe6ee', 7, y + 1, 5, 1);
      px(g, '#8a94a2', 6, y + 5, 8, 1);
      if (d.plume) {
        px(g, darken(d.plume, 0.2), 9, y - 6, 2, 6);
        px(g, d.plume, 9, y - 5, 2, 5);
        px(g, lighten(d.plume, 0.22), 9, y - 5, 1, 3);
        px(g, d.plume, 8, y - 8, 3, 3);
      }
      return;
    }
    if (style === 'hood') {
      px(g, o, 4, y - 2, 12, 12);
      px(g, d.cape || d.top2, 5, y - 1, 10, 9);
      px(g, lighten(d.cape || d.top2, 0.14), 5, y - 1, 2, 7);
      px(g, darken(d.cape || d.top2, 0.25), 12, y, 2, 7);
      px(g, h2, 6, y + 1, 8, 6);
      px(g, hi, 7, y + 1, 3, 1);
      return;
    }
    if (style === 'bandana') {
      px(g, o, 5, y - 1, 10, 7);
      px(g, h, 6, y - 1, 8, 3);
      px(g, d.trim, 5, y + 2, 10, 2);
      px(g, lighten(d.trim, 0.2), 6, y + 2, 5, 1);
      px(g, darken(d.trim, 0.28), 5, y + 3, 10, 1);
      px(g, d.trim, 14, y + 2, 3, 2);
      px(g, darken(d.trim, 0.25), 15, y + 3, 2, 1);
      return;
    }
    if (style === 'long') {
      px(g, o, 4, y - 1, 12, 12);
      px(g, h, 5, y, 10, 8);
      px(g, hi, 6, y, 4, 1);
      px(g, h, 5, y + 8, 3, 5);
      px(g, h, 12, y + 8, 3, 5);
      px(g, hi, 5, y + 8, 1, 4);
      px(g, h2, 13, y + 5, 2, 6);
      px(g, sh, 13, y + 8, 2, 3);
      px(g, h, 6, y - 1, 7, 2);
      px(g, hi, 6, y - 1, 2, 1);
      return;
    }
    if (style === 'ponytail') {
      px(g, o, 5, y - 1, 10, 7);
      px(g, h, 6, y, 9, 6);
      px(g, hi, 7, y, 3, 1);
      px(g, h, 5, y + 2, 2, 5);
      px(g, h2, 15, y + 1, 2, 6);
      px(g, hi, 15, y + 1, 1, 3);
      px(g, h2, 16, y + 5, 2, 4);
      px(g, sh, 16, y + 7, 2, 2);
      px(g, d.trim, 14, y + 2, 2, 1);
      return;
    }
    if (style === 'spiky') {
      px(g, o, 5, y - 2, 10, 8);
      px(g, h, 5, y - 1, 10, 6);
      px(g, h, 5, y - 3, 2, 3);
      px(g, h, 9, y - 4, 2, 4);
      px(g, h, 13, y - 3, 2, 3);
      px(g, hi, 6, y - 1, 2, 1);
      px(g, hi, 9, y - 3, 1, 2);
      px(g, h2, 5, y + 5, 10, 1);
      return;
    }
    // short
    px(g, o, 5, y - 1, 10, 8);
    px(g, h, 6, y, 9, 6);
    px(g, hi, 7, y, 3, 1);
    px(g, h2, 6, y + 5, 9, 1);
    px(g, h, 5, y + 2, 2, 5);
    px(g, h, 13, y + 2, 2, 5);
    px(g, h2, 13, y + 4, 2, 3);
    return;
  }

  // ---------------------------------------------------------------- profile
  if (facing === 'right') {
    if (style === 'bald') {
      px(g, d.skin2, 6, y + 1, 8, 2);
      px(g, lighten(d.skin, 0.16), 7, y + 1, 4, 1);
      px(g, '#e8e8e8', 6, y + 5, 2, 2);
      return;
    }
    if (style === 'helmet') {
      px(g, o, 5, y - 1, 10, 4);
      px(g, d.trim, 6, y, 8, 2);
      px(g, lighten(d.trim, 0.25), 7, y + 1, 5, 1);
      px(g, '#8a94a2', 6, y + 2, 8, 1);
      px(g, d.trim, 13, y + 1, 1, 4);
      px(g, d.trim, 5, y + 2, 2, 4);
      px(g, darken(d.trim, 0.3), 5, y + 5, 2, 1);
      if (d.plume) {
        px(g, darken(d.plume, 0.2), 8, y - 5, 2, 5);
        px(g, d.plume, 8, y - 4, 2, 4);
        px(g, lighten(d.plume, 0.22), 8, y - 4, 1, 2);
      }
      return;
    }
    if (style === 'hood') {
      const hood = d.cape || d.top2;
      // Frame, not a filled block: a full-rect outline would paint over the face.
      px(g, o, 4, y - 2, 11, 4);
      px(g, hood, 5, y - 1, 9, 3);
      px(g, lighten(hood, 0.14), 5, y - 1, 2, 3);
      px(g, darken(hood, 0.25), 12, y - 1, 2, 3);
      px(g, o, 4, y + 2, 4, 10);
      px(g, hood, 5, y + 2, 2, 9);
      px(g, lighten(hood, 0.14), 5, y + 2, 1, 7);
      px(g, o, 13, y - 1, 2, 7);
      px(g, hood, 13, y - 1, 1, 6);
      px(g, h2, 7, y + 1, 5, 1);
      px(g, hi, 8, y + 1, 2, 1);
      return;
    }
    if (style === 'bandana') {
      px(g, o, 5, y - 1, 10, 4);
      px(g, h, 6, y - 1, 8, 2);
      px(g, d.trim, 5, y + 1, 10, 2);
      px(g, lighten(d.trim, 0.2), 6, y + 1, 4, 1);
      px(g, darken(d.trim, 0.28), 5, y + 2, 10, 1);
      px(g, d.trim, 4, y + 2, 3, 2);
      px(g, darken(d.trim, 0.25), 3, y + 3, 2, 1);
      return;
    }
    if (style === 'long') {
      px(g, o, 4, y - 1, 11, 4);
      px(g, h, 5, y, 9, 2);
      px(g, hi, 6, y, 3, 1);
      px(g, h, 6, y + 2, 6, 1);
      px(g, o, 3, y + 1, 3, 11);
      px(g, h, 4, y + 2, 2, 9);
      px(g, hi, 4, y + 2, 1, 6);
      px(g, h2, 13, y + 1, 2, 5);
      px(g, sh, 13, y + 5, 2, 3);
      return;
    }
    if (style === 'ponytail') {
      px(g, o, 5, y - 1, 10, 4);
      px(g, h, 6, y, 8, 2);
      px(g, hi, 7, y, 3, 1);
      px(g, h, 6, y + 2, 6, 1);
      px(g, o, 3, y + 1, 3, 9);
      px(g, h2, 4, y + 2, 2, 6);
      px(g, sh, 4, y + 6, 2, 3);
      px(g, d.trim, 5, y + 1, 2, 1);
      return;
    }
    if (style === 'spiky') {
      px(g, o, 5, y - 2, 10, 5);
      px(g, h, 5, y - 1, 9, 3);
      px(g, h, 5, y - 3, 2, 3);
      px(g, h, 9, y - 4, 2, 4);
      px(g, h, 12, y - 3, 2, 3);
      px(g, hi, 6, y - 1, 2, 1);
      px(g, hi, 9, y - 3, 1, 2);
      px(g, h2, 5, y + 2, 9, 1);
      return;
    }
    // short
    px(g, o, 5, y - 1, 10, 4);
    px(g, h, 6, y, 8, 2);
    px(g, hi, 7, y, 3, 1);
    px(g, h, 6, y + 2, 6, 1);
    px(g, h, 5, y + 2, 2, 3);
    px(g, h2, 13, y + 1, 2, 2);
    return;
  }

  // ---------------------------------------------------------------- front view
  if (style === 'bald') {
    px(g, d.skin2, 6, y + 1, 8, 2);
    px(g, lighten(d.skin, 0.16), 7, y + 1, 4, 1);
    px(g, '#e8e8e8', 6, y + 4, 2, 2);
    px(g, '#e8e8e8', 12, y + 4, 2, 2);
    return;
  }
  if (style === 'helmet') {
    px(g, o, 5, y - 1, 10, 4);
    px(g, d.trim, 6, y, 8, 2);
    px(g, lighten(d.trim, 0.25), 7, y + 1, 5, 1);
    px(g, '#dfe6ee', 7, y + 1, 5, 1);
    px(g, '#8a94a2', 6, y + 2, 8, 1);
    px(g, darken(d.trim, 0.35), 6, y + 2, 8, 1);
    px(g, d.trim, 5, y + 2, 1, 4);
    px(g, d.trim, 14, y + 2, 1, 4);
    px(g, '#8a94a2', 9, y + 2, 2, 3);
    px(g, '#c9d0d8', 7, y + 2, 1, 1);
    px(g, '#c9d0d8', 12, y + 2, 1, 1);
    if (d.plume) {
      px(g, darken(d.plume, 0.2), 9, y - 6, 2, 6);
      px(g, d.plume, 9, y - 5, 2, 5);
      px(g, lighten(d.plume, 0.22), 9, y - 5, 1, 3);
      px(g, d.plume, 8, y - 8, 3, 3);
    }
    return;
  }
  if (style === 'hood') {
    const hood = d.cape || d.top2;
    px(g, o, 4, y - 2, 12, 4);
    px(g, hood, 5, y - 1, 10, 3);
    px(g, lighten(hood, 0.14), 5, y - 1, 2, 3);
    px(g, darken(hood, 0.25), 13, y - 1, 2, 3);
    px(g, o, 4, y + 2, 4, 10);
    px(g, hood, 5, y + 2, 2, 9);
    px(g, lighten(hood, 0.14), 5, y + 2, 1, 7);
    px(g, o, 13, y + 2, 3, 10);
    px(g, hood, 13, y + 2, 2, 9);
    px(g, darken(hood, 0.25), 14, y + 2, 1, 7);
    px(g, h2, 7, y + 1, 6, 1);
    px(g, hi, 8, y + 1, 2, 1);
    return;
  }
  if (style === 'bandana') {
    px(g, o, 5, y - 1, 10, 4);
    px(g, h, 6, y - 1, 8, 2);
    px(g, d.trim, 5, y + 1, 10, 2);
    px(g, lighten(d.trim, 0.2), 6, y + 1, 4, 1);
    px(g, darken(d.trim, 0.28), 5, y + 2, 10, 1);
    px(g, d.trim, 14, y + 2, 3, 2);
    px(g, darken(d.trim, 0.25), 15, y + 3, 2, 1);
    return;
  }
  if (style === 'long') {
    px(g, o, 4, y - 1, 12, 4);
    px(g, h, 5, y, 10, 2);
    px(g, hi, 6, y, 4, 1);
    px(g, h, 5, y + 2, 9, 1);
    px(g, o, 4, y + 2, 3, 11);
    px(g, h, 5, y + 3, 2, 9);
    px(g, hi, 5, y + 3, 1, 6);
    px(g, o, 13, y + 2, 3, 11);
    px(g, h2, 13, y + 3, 2, 9);
    px(g, sh, 13, y + 9, 2, 3);
    px(g, h, 6, y - 1, 7, 2);
    px(g, hi, 6, y - 1, 2, 1);
    return;
  }
  if (style === 'ponytail') {
    px(g, o, 5, y - 1, 10, 4);
    px(g, h, 6, y, 8, 2);
    px(g, hi, 7, y, 3, 1);
    px(g, h, 6, y + 2, 8, 1);
    px(g, h, 5, y + 2, 2, 4);
    px(g, o, 14, y + 1, 4, 8);
    px(g, h2, 15, y + 2, 2, 6);
    px(g, sh, 15, y + 6, 2, 3);
    px(g, d.trim, 14, y + 2, 2, 1);
    return;
  }
  if (style === 'spiky') {
    px(g, o, 5, y - 2, 10, 5);
    px(g, h, 5, y - 1, 10, 3);
    px(g, h, 5, y - 3, 2, 3);
    px(g, h, 9, y - 4, 2, 4);
    px(g, h, 13, y - 3, 2, 3);
    px(g, hi, 6, y - 1, 2, 1);
    px(g, hi, 9, y - 3, 1, 2);
    px(g, h2, 5, y + 2, 10, 1);
    return;
  }
  // short
  px(g, o, 5, y - 1, 10, 4);
  px(g, h, 6, y, 8, 2);
  px(g, hi, 7, y, 3, 1);
  px(g, h, 6, y + 2, 8, 1);
  px(g, h, 5, y + 2, 1, 3);
  px(g, h, 14, y + 2, 1, 3);
  px(g, h, 9, y + 3, 2, 1);
}

function drawWeapon(g, d, facing) {
  const w = d.weapon;
  if (!w || w === 'none') return;
  const orb = d.orb || d.accent || '#e7c77b';
  if (w === 'staff') {
    g.fillStyle = hexA(orb, 0.16);
    g.fillRect(12, -2, 9, 9);
    px(g, '#2a1c12', 16, 3, 2, 20);
    px(g, '#6a4a2a', 15, 4, 1, 18);
    px(g, '#8a6a3a', 17, 5, 1, 16);
    px(g, '#c9a44c', 15, 5, 3, 1);
    px(g, '#c9a44c', 15, 19, 3, 1);
    px(g, orb, 14, 0, 5, 5);
    px(g, lighten(orb, 0.4), 15, 1, 2, 2);
    px(g, '#ffffff', 15, 1, 1, 1);
    px(g, '#8a6a3a', 14, 5, 5, 1);
    return;
  }
  if (w === 'spear') {
    px(g, '#5a3a22', 16, 1, 2, 24);
    px(g, '#8a6a3a', 17, 2, 1, 22);
    px(g, '#c8d0d8', 15, -1, 4, 4);
    px(g, '#f0f4f8', 16, -2, 2, 3);
    px(g, '#c9a44c', 15, 3, 4, 1);
    px(g, '#c05a4a', 17, 4, 2, 4);
    return;
  }
  if (w === 'axe') {
    px(g, '#5a3a22', 15, 5, 2, 18);
    px(g, '#8a6a3a', 15, 5, 1, 16);
    px(g, '#9aa2ac', 12, 3, 7, 5);
    px(g, '#c8d0d8', 12, 3, 6, 2);
    px(g, '#6a727c', 12, 7, 7, 1);
    px(g, '#c9a44c', 15, 8, 2, 1);
    return;
  }
  if (w === 'club') {
    px(g, '#5a3a22', 16, 8, 3, 15);
    px(g, '#7a5a3a', 14, 4, 5, 6);
    px(g, '#9a7a5a', 15, 5, 2, 3);
    px(g, '#c9a44c', 15, 8, 4, 1);
    px(g, '#3a2416', 16, 15, 3, 1);
    return;
  }
  // Sword sheathed on the back, with a worn leather scabbard and gold chape.
  px(g, '#2a1a12', 4, 18, 12, 4);
  px(g, '#4a2e1c', 5, 17, 10, 2);
  px(g, '#6a4a2a', 5, 17, 10, 1);
  px(g, '#c9a44c', 3, 18, 3, 4);
  px(g, '#e7c77b', 2, 20, 2, 2);
  px(g, '#c8d0d8', 13, 15, 2, 4);
  px(g, '#f0f4f8', 13, 15, 1, 2);
  px(g, '#8a6a3a', 15, 18, 2, 2);
}

// 4-frame walk cycle: 0 idle, 1 left contact, 2 passing, 3 right contact.
// The passing frame raises the body 1px and brings the legs together, which
// reads much better than the old 2-frame flicker at 36ms per frame.
function drawHuman(g, d, facing, frame) {
  const o = '#17121a';
  const f = ((frame | 0) % 4 + 4) % 4;
  const contact = f === 1 || f === 3;
  const pass = f === 2;
  const bob = pass ? 1 : 0;
  const top = 10 - bob;
  const armSwing = f === 1 ? -1 : f === 3 ? 1 : 0;
  const leftLift = f === 3 ? 1 : 0;
  const rightLift = f === 1 ? 1 : 0;

  const topHi = lighten(d.top, 0.18);
  const topSh = darken(d.top, 0.24);
  const topDeep = darken(d.top, 0.4);
  const pantsHi = lighten(d.pants, 0.16);
  const pantsSh = darken(d.pants, 0.3);
  const bootHi = lighten(d.boots, 0.24);
  const bootSh = darken(d.boots, 0.42);
  const skinHi = lighten(d.skin, 0.12);
  const trimHi = lighten(d.trim, 0.22);
  const hairSh = darken(d.hair || '#3a2418', 0.28);
  const belt = darken(d.pants, 0.45);
  const cape = d.cape;
  const cape2 = d.cape2 || d.cape;
  const capeHi = cape ? lighten(cape, 0.16) : null;
  const capeSh = cape ? darken(cape2, 0.22) : null;

  const leg = (x, y, lift) => {
    px(g, o, x, y + lift, 4, 8);
    px(g, d.pants, x + 1, y + 1 + lift, 2, 5);
    px(g, pantsHi, x + 1, y + 1 + lift, 1, 3);
    px(g, pantsSh, x + 2, y + 1 + lift, 1, 5);
    px(g, d.boots, x + 1, y + 6 + lift, 3, 2);
    px(g, bootHi, x + 1, y + 6 + lift, 3, 1);
    px(g, bootSh, x + 1, y + 7 + lift, 3, 1);
  };

  const arm = (x, y, swing, sleeve) => {
    px(g, o, x, y + swing, 3, 8);
    px(g, sleeve, x + 1, y + 1 + swing, 2, 5);
    px(g, lighten(sleeve, 0.14), x + 1, y + 1 + swing, 1, 3);
    px(g, d.trim, x + 1, y + 5 + swing, 2, 1);
    px(g, d.skin, x + 1, y + 6 + swing, 2, 2);
  };

  const bodyBase = (x, y, w, h) => {
    px(g, o, x - 1, y - 1, w + 2, h + 2);
    px(g, d.top, x, y, w, h);
    px(g, topHi, x, y, Math.max(1, Math.floor(w * 0.2)), h - 1);
    px(g, topSh, x + w - Math.max(2, Math.floor(w * 0.25)), y, Math.max(2, Math.floor(w * 0.25)), h);
    px(g, topDeep, x + w - 1, y, 1, h - 1);
    px(g, d.top2, x, y + h - 3, w, 2);
    px(g, d.trim, x, y + h - 3, w, 1);
    px(g, trimHi, x, y + h - 3, Math.min(4, w), 1);
    px(g, belt, x, y + h - 2, w, 1);
  };

  // ground shadow (slightly tighter while passing)
  g.fillStyle = 'rgba(0,0,0,.3)';
  g.beginPath(); g.ellipse(10, 26, pass ? 5 : 5.8, 1.8, 0, 0, Math.PI * 2); g.fill();

  if (facing === 'up') {
    const capeX = f === 1 ? -1 : f === 3 ? 1 : 0;
    if (cape) {
      px(g, o, 4 + capeX, top - 1, 12, 12);
      px(g, cape2, 5 + capeX, top, 10, 11);
      px(g, cape, 5 + capeX, top, 10, 2);
      px(g, capeHi, 5 + capeX, top + 1, 2, 8);
      px(g, capeSh, 12 + capeX, top + 2, 2, 8);
      px(g, d.trim, 5 + capeX, top + 9, 10, 1);
      px(g, capeSh, 6 + capeX, top + 10, 8, 1);
    }
    const spread = contact ? 1 : 0;
    leg(5 - spread, 19 - bob, leftLift);
    leg(11 + spread, 19 - bob, rightLift);
    arm(2, top + 1 - armSwing, 0, d.top2);
    arm(15, top + 1 + armSwing, 0, d.top2);
    bodyBase(5, top, 10, 10);
    px(g, d.trim, 5, top, 2, 2);
    px(g, d.trim, 13, top, 2, 2);
    px(g, d.trim, 9, top + 5, 2, 1);
    // head
    px(g, o, 5, 2 - bob, 10, 10);
    px(g, d.skin, 6, 3 - bob, 8, 8);
    px(g, skinHi, 6, 3 - bob, 2, 6);
    px(g, d.skin2, 12, 4 - bob, 2, 6);
    px(g, d.skin, 7, 11 - bob, 6, 1);
    drawHair(g, d, 'up', 3 - bob);
    drawWeapon(g, d, 'up');
    return;
  }

  if (facing === 'right') {
    const capeX = f === 1 ? -1 : f === 3 ? 1 : 0;
    if (cape) {
      px(g, o, 3 + capeX, top - 1, 9, 13);
      px(g, cape2, 4 + capeX, top, 7, 12);
      px(g, cape, 4 + capeX, top, 5, 2);
      px(g, capeHi, 4 + capeX, top + 1, 1, 9);
      px(g, capeSh, 10 + capeX, top + 2, 1, 9);
      px(g, d.trim, 4 + capeX, top + 10, 7, 1);
    }
    const backX = f === 1 ? 6 : f === 3 ? 12 : 8;
    const frontX = f === 1 ? 12 : f === 3 ? 6 : 9;
    const backLift = f === 1 ? 0 : f === 3 ? 1 : 0;
    const frontLift = f === 1 ? 1 : f === 3 ? 0 : 0;
    leg(backX, 19 - bob, backLift);
    leg(frontX, 19 - bob, frontLift);
    arm(5, top + 2 - armSwing, 0, d.top2);
    bodyBase(6, top, 8, 10);
    px(g, d.trim, 6, top, 2, 2);
    px(g, d.trim, 12, top, 2, 2);
    px(g, '#2a2430', 9, top + 2, 2, 2);
    px(g, d.trim, 9, top + 2, 1, 2);
    if (d.skirt) {
      px(g, o, 4, top + 8, 12, 6);
      px(g, d.skirt, 5, top + 8, 10, 5);
      px(g, lighten(d.skirt, 0.12), 5, top + 8, 2, 4);
      px(g, darken(d.skirt, 0.2), 12, top + 9, 2, 4);
    }
    arm(12, top + 2 + armSwing, 0, d.top);
    // head
    px(g, o, 6, 2 - bob, 9, 10);
    px(g, d.skin, 7, 3 - bob, 7, 8);
    px(g, skinHi, 7, 3 - bob, 2, 2);
    px(g, d.skin2, 12, 4 - bob, 2, 6);
    px(g, d.skin, 15, 7 - bob, 1, 2);
    px(g, o, 15, 7 - bob, 1, 1);
    px(g, d.skin2, 6, 6 - bob, 1, 2);
    px(g, d.eye || '#241610', 12, 6 - bob, 1, 2);
    px(g, '#fff', 12, 6 - bob, 1, 1);
    px(g, hairSh, 12, 5 - bob, 2, 1);
    px(g, darken(d.skin2, 0.22), 13, 9 - bob, 2, 1);
    drawHair(g, d, 'right', 3 - bob);
    if (d.beard) {
      px(g, d.beard, 10, 10 - bob, 4, 2);
      px(g, d.beard, 12, 9 - bob, 2, 1);
    }
    drawWeapon(g, d, 'right');
    return;
  }

  // facing down
  const capeX = f === 1 ? -1 : f === 3 ? 1 : 0;
  if (cape) {
    px(g, o, 3 + capeX, top - 1, 14, 14);
    px(g, cape2, 4 + capeX, top, 12, 13);
    px(g, cape, 4 + capeX, top, 12, 2);
    px(g, capeHi, 4 + capeX, top + 1, 2, 10);
    px(g, capeSh, 14 + capeX, top + 2, 2, 10);
    px(g, d.trim, 4 + capeX, top + 10, 12, 1);
    px(g, capeSh, 4 + capeX, top + 11, 12, 1);
  }
  const spread = contact ? 1 : 0;
  leg(5 - spread, 19 - bob, leftLift);
  leg(11 + spread, 19 - bob, rightLift);
  arm(2, top + 1 - armSwing, 0, d.top2);
  arm(15, top + 1 + armSwing, 0, d.top2);
  bodyBase(5, top, 10, 10);
  px(g, d.trim, 5, top, 2, 2);
  px(g, d.trim, 13, top, 2, 2);
  px(g, '#2a2430', 8, top + 2, 4, 2);
  px(g, d.trim, 9, top + 2, 2, 2);
  if (d.skirt) {
    px(g, o, 4, top + 8, 12, 7);
    px(g, d.skirt, 5, top + 8, 10, 6);
    px(g, lighten(d.skirt, 0.12), 5, top + 8, 2, 5);
    px(g, darken(d.skirt, 0.2), 12, top + 9, 2, 5);
    px(g, d.top2, 5, top + 12, 10, 2);
  }
  // head
  px(g, o, 5, 2 - bob, 10, 10);
  px(g, d.skin, 6, 3 - bob, 8, 8);
  px(g, skinHi, 6, 3 - bob, 3, 2);
  px(g, d.skin2, 12, 4 - bob, 2, 7);
  px(g, d.skin2, 6, 9 - bob, 8, 2);
  px(g, d.skin, 4, 6 - bob, 1, 2);
  px(g, d.skin, 15, 6 - bob, 1, 2);
  // eyes, brows and mouth
  px(g, d.eye || '#241610', 8, 6 - bob, 1, 2);
  px(g, d.eye || '#241610', 12, 6 - bob, 1, 2);
  px(g, '#fff', 8, 6 - bob, 1, 1);
  px(g, '#fff', 12, 6 - bob, 1, 1);
  px(g, hairSh, 8, 5 - bob, 1, 1);
  px(g, hairSh, 12, 5 - bob, 1, 1);
  px(g, d.skin2, 10, 7 - bob, 1, 2);
  px(g, darken(d.skin2, 0.22), 10, 9 - bob, 2, 1);
  drawHair(g, d, 'down', 3 - bob);
  if (d.beard) {
    px(g, d.beard, 7, 9 - bob, 7, 3);
    px(g, d.beard, 9, 11 - bob, 3, 1);
    px(g, darken(d.skin2, 0.22), 10, 9 - bob, 2, 1);
  }
  drawWeapon(g, d, 'down');
}

function flipCanvas(src) {
  const { c, g } = makeCanvas(src.width, src.height);
  g.translate(src.width, 0); g.scale(-1, 1);
  g.drawImage(src, 0, 0);
  return c;
}

export function getCharSprite(id, facing = 'down', frame = 0) {
  const def = HUMANS[id];
  if (!def) return getCharSprite('villager1', facing, frame);
  const key = `${id}|${facing}|${frame}`;
  if (cache.has(key)) return cache.get(key);
  const { c, g } = makeCanvas(SPRITE_W, SPRITE_H);
  g.imageSmoothingEnabled = false;
  if (facing === 'left') {
    const { c: rc, g: rg } = makeCanvas(SPRITE_W, SPRITE_H);
    drawHuman(rg, def, 'right', frame);
    const flipped = flipCanvas(rc);
    g.drawImage(flipped, 0, 0);
  } else {
    drawHuman(g, def, facing, frame);
  }
  cache.set(key, c);
  return c;
}

function getSilhouette(id, facing, frame) {
  const key = `${id}|${facing}|${frame}`;
  if (silhouetteCache.has(key)) return silhouetteCache.get(key);
  const src = getCharSprite(id, facing, frame);
  const { c, g } = makeCanvas(SPRITE_W, SPRITE_H);
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = '#fff';
  g.fillRect(0, 0, SPRITE_W, SPRITE_H);
  silhouetteCache.set(key, c);
  return c;
}

// Draw character with feet anchored at (x,y)
export function drawCharacter(g, id, x, y, facing = 'down', frame = 0, scale = 3, opts = {}) {
  const spr = opts.flash ? getSilhouette(id, facing, frame) : getCharSprite(id, facing, frame);
  const w = SPRITE_W * scale, h = SPRITE_H * scale;
  const dx = Math.round(x - w / 2), dy = Math.round(y - h);
  if (opts.alpha != null) g.globalAlpha = opts.alpha;
  g.drawImage(spr, dx, dy, w, h);
  if (opts.flash) {
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = (opts.alpha ?? 1) * 0.6;
    g.drawImage(spr, dx, dy, w, h);
    g.globalCompositeOperation = 'source-over';
  }
  g.globalAlpha = 1;
}

// ---------------- Portraits ----------------
const portraitCache = new Map();

export function getPortrait(id, size = 72) {
  const key = `${id}|${size}`;
  if (portraitCache.has(key)) return portraitCache.get(key);
  const { c, g } = makeCanvas(size, size);
  g.imageSmoothingEnabled = false;
  const def = HUMANS[id];
  const accent = def?.accent || '#e7c77b';
  const grd = g.createRadialGradient(size * 0.5, size * 0.38, 2, size * 0.5, size * 0.5, size * 0.72);
  grd.addColorStop(0, hexA(accent, 0.24));
  grd.addColorStop(0.55, '#141d31');
  grd.addColorStop(1, '#070b14');
  g.fillStyle = grd; g.fillRect(0, 0, size, size);

  // faint rune ring
  g.strokeStyle = hexA(accent, 0.22);
  g.lineWidth = 1;
  g.beginPath(); g.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(size / 2, size / 2, size * 0.47, 0.3, 1.4); g.stroke();

  if (def) {
    const spr = getCharSprite(id, 'down', 0);
    // Frame the head and shoulders instead of the whole body. The old crop
    // pushed the face against the top edge and left the portrait mostly torso.
    const scale = size / 17.5;
    const w = SPRITE_W * scale, h = SPRITE_H * scale;
    g.save();
    g.beginPath(); g.rect(0, 0, size, size); g.clip();
    g.drawImage(spr, (size - w) / 2, size * 0.015, w, h);
    // soft key light from the upper left
    const light = g.createLinearGradient(0, 0, size * 0.8, size);
    light.addColorStop(0, hexA(accent, 0.12));
    light.addColorStop(0.55, 'rgba(255,255,255,0)');
    g.fillStyle = light;
    g.fillRect(0, 0, size, size);
    g.restore();
    // vignette
    const vg = g.createRadialGradient(size / 2, size * 0.45, size * 0.15, size / 2, size * 0.5, size * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = vg; g.fillRect(0, 0, size, size);
  } else {
    // narrator / narrator rune
    g.save();
    g.translate(size / 2, size / 2);
    g.rotate(Math.PI / 4);
    g.fillStyle = hexA(accent, 0.85);
    g.fillRect(-size * 0.09, -size * 0.09, size * 0.18, size * 0.18);
    g.strokeStyle = hexA(accent, 0.5);
    g.lineWidth = 1;
    g.strokeRect(-size * 0.18, -size * 0.18, size * 0.36, size * 0.36);
    g.restore();
  }
  portraitCache.set(key, c);
  return c;
}

export function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

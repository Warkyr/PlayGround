import { Game } from './game.js'
import { Renderer } from './render.js'
import { UI } from './ui.js'
import { Audio } from './audio.js'

const canvas = document.getElementById('game')
const game = new Game()
const renderer = new Renderer(canvas, game)
const audio = new Audio()
audio.setEnabled(game.state.sound !== false)
const ui = new UI(game, renderer, audio)

window.__game = game
window.__ui = ui

let last = performance.now()
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000)
  last = now
  game.update(dt)
  renderer.draw(now, dt)
  ui.tick(dt)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)

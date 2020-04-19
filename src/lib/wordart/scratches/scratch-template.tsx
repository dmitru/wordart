import 'lib/wordart/console-extensions'
import { Rect } from 'lib/wordart/geometry'
import { loadImageUrlToCanvasCtx } from 'lib/wordart/canvas-utils'

// const BG_SHAPE = '/images/cat.png'
// const BG_SHAPE = '/images/number_six.png'
// const BG_SHAPE = '/images/darth_vader.jpg'
const BG_SHAPE = '/images/beatles.jpg'

export const scratchTemplate = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d')!

  const onKeyDown = async (e: KeyboardEvent) => {
    const key = e.key

    const bgImageCtx = await loadImageUrlToCanvasCtx(BG_SHAPE, 400, 400)
    console.screenshot(bgImageCtx.canvas)

    if (key === 'g') {
      const viewBox: Rect = { x: 0, y: 0, w: 400, h: 400 }
    }
  }
  document.addEventListener('keydown', onKeyDown)

  return () => {
    document.removeEventListener('keydown', onKeyDown)
  }
}

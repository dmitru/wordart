import { createCanvas } from './canvas-utils'

/**
 * An actual useful fork of dunxrion/console.image
 * Created by Adrian Cooney
 * http://dunxrion.github.io
 */
;(function (console) {
  /**
   * Since the console.log doesn't respond to the `display` style,
   * setting a width and height has no effect. In fact, the only styles
   * I've found it responds to is font-size, background-image and color.
   * To combat the image repeating, we have to get a create a font bounding
   * box so to speak with the unicode box characters. EDIT: See Readme.md
   
   */
  function getBox(
    width: number,
    height: number
  ): { string: string; style: string } {
    return {
      string: '+',
      style:
        'font-size: 1px; padding: ' +
        Math.floor(height / 2) +
        'px ' +
        Math.floor(width / 2) +
        'px; line-height: ' +
        height +
        'px;',
    }
  }

  /**
   * Display an image in the console.
   * @param  {string} url The url of the image.
   * @param  {int} scale Scale factor on the image
   * @return {null}
   */
  console.image = (url: string, scale = 1) => {
    let img = new Image()

    img.onload = () => {
      let dim = getBox(img.width * scale, img.height * scale)
      console.log(
        '%c' + dim.string,
        dim.style +
          'background-image: url(' +
          url +
          '); background-size: ' +
          img.width * scale +
          'px ' +
          img.height * scale +
          'px; background-size: 100% 100%; background-repeat: norepeat; color: transparent;'
      )
    }

    img.src = url
    img.style.background = 'url(' + url + ')' //Preload it again..
  }

  /**
   * Snapshot a canvas context and output it to the console.
   */
  console.screenshot = (
    canvas: OffscreenCanvas | HTMLCanvasElement,
    scale = 1
  ) => {
    // @ts-ignore
    if (!canvas.toDataURL) {
      console.warn('canvas.toDataURL is undefined')
      return
    }
    const imageUrl = (canvas as HTMLCanvasElement).toDataURL()
    const width = canvas.width
    const height = canvas.height
    const dim = getBox(width * scale, height * scale)

    console.log(
      '%c' + dim.string,
      dim.style +
        'background-image: url(' +
        imageUrl +
        '); background-size: ' +
        width * scale +
        'px ' +
        height * scale +
        'px;  background-size: 100% 100%; background-repeat: norepeat; color: transparent;'
    )
  }

  /**
   * Display an image in the console.
   * @param  {string} url The url of the image.
   * @param  {int} scale Scale factor on the image
   * @return {null}
   */
  console.image = (url: string, scale = 1) => {
    scale = scale || 1
    let img = new Image()

    img.onload = () => {
      let dim = getBox(img.width * scale, img.height * scale)
      console.log(
        '%c' + dim.string,
        dim.style +
          'background: url(' +
          url +
          '); background-size: ' +
          img.width * scale +
          'px ' +
          img.height * scale +
          'px;  background-size: 100% 100%; background-repeat: norepeat; color: transparent;'
      )
    }

    img.src = url
  }

  /**
   * Display an image in the console.
   * @param  {string} url The url of the image.
   * @param  {int} scale Scale factor on the image
   * @return {null}
   */
  console.bitmap = async (bitmap: ImageBitmap, scale = 1) => {
    scale = scale || 1
    const canvas = createCanvas({ w: bitmap.width, h: bitmap.height })
    // @ts-ignore
    const ctx = canvas.getContext(
      'bitmaprenderer'
    ) as ImageBitmapRenderingContext
    const bitmap2 = await createImageBitmap(bitmap)
    ctx.transferFromImageBitmap(bitmap2)
    // console.screenshot(ctx.canvas, scale)
  }
})(console)

declare global {
  interface Console {
    screenshot: (
      canvas: OffscreenCanvas | HTMLCanvasElement,
      scale?: number
    ) => void
    bitmap: (bitmap: ImageBitmap, scale?: number) => void
    image: (src: string, scale?: number) => void
  }
}

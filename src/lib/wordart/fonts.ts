import * as opentype from 'opentype.js'

export const loadFont = (path: string): Promise<opentype.Font> =>
  new Promise<opentype.Font>((resolve, reject) =>
    opentype.load(path, (error, font) => {
      if (!font || error) {
        reject(error || new Error('Failed to load font'))
        return
      }
      resolve(font)
    })
  )

export const parseFontFromBuffer = (buffer: ArrayBuffer): opentype.Font =>
  opentype.parse(buffer)

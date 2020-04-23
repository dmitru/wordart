import { Rect } from 'lib/wordart/geometry'
import { Shape } from 'lib/wordart/image-to-shapes'
import { HBounds } from 'lib/wordart/hbounds'
import { Font } from 'opentype.js'

export abstract class SceneGen {
  params: GeneratorParams
  constructor(params: GeneratorParams) {
    this.params = params
  }
  abstract setBgShape(ctx: CanvasRenderingContext2D): void
  abstract generate(params: GenerateParams): GenerateHandle
  abstract clearTags(): void
}

export type GeneratorParams = {
  viewBox: Rect
  bgImgSize: number
}

export type WordConfig = {
  text: string
}

export type ShapeConfig = {
  font: Font
  words?: WordConfig[]
  angles?: number[]
  color?: string
  scale?: number
}

export type GenerateParams = {
  words: WordConfig[]
  shapeConfigs: ShapeConfig[]
  /** A list of allowed angles in degrees */
  debug?: {
    ctx: CanvasRenderingContext2D
    logWordPlacementImg: boolean
  }
  bgImageCtx?: CanvasRenderingContext2D
  progressCallback?: (percentage: number) => void
}

export type GenerateHandle = {
  start: () => Promise<GenerationResult>
  cancel: () => void
}

export type GenerationResult = {
  status: 'finished' | 'cancelled'
}

import { Rect } from 'lib/wordart/geometry'
import { WasmModule, HBoundsWasm } from 'lib/wordart/wasm/wasm-module'
import {
  LayoutGenWasm,
  HBoundsWasmSerialized,
  Matrix,
} from 'lib/wordart/wasm/wasm-gen-types'

export class CollisionDetectorWasm {
  wasm: WasmModule
  layoutGen: LayoutGenWasm
  shapeBoundsInverted?: HBoundsWasm
  shapeBoundsInvertedJs?: HBoundsWasmSerialized
  bounds?: Rect

  constructor(
    wasm: WasmModule,
    bounds: Rect,
    shapeBoundsInverted?: HBoundsWasm
  ) {
    this.wasm = wasm
    this.bounds = bounds
    if (shapeBoundsInverted) {
      this.shapeBoundsInverted = shapeBoundsInverted
      this.shapeBoundsInvertedJs = this.shapeBoundsInverted.get_js()
      this.bounds = {
        x: this.shapeBoundsInvertedJs.bounds.x,
        y: this.shapeBoundsInvertedJs.bounds.y,
        w: this.shapeBoundsInvertedJs.bounds.w,
        h: this.shapeBoundsInvertedJs.bounds.h,
      }
    }
    this.layoutGen = new wasm.LayoutGenWasm(this.bounds.w, this.bounds.h)
  }

  addItem = (hbounds: HBoundsWasm, transform?: Matrix): boolean => {
    let hboundsTransformed = hbounds
    if (this.shapeBoundsInverted) {
      if (transform) {
        if (
          this.shapeBoundsInverted.collides_transformed(
            hboundsTransformed,
            transform
          )
        ) {
          return false
        }
      } else {
        if (this.shapeBoundsInverted.collides(hboundsTransformed)) {
          return false
        }
      }
    }
    const itemId = this.layoutGen.add_item(hboundsTransformed, transform)
    return itemId != null
  }
}

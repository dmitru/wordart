import {
  Rect,
  areRectsIntersecting,
  isRectInsideRect,
  transformRect,
} from 'lib/wordart/geometry'
import { WasmModule, HBoundsWasm } from 'lib/wordart/wasm/wasm-module'
import {
  LayoutGenWasm,
  HBoundsWasmSerialized,
  Matrix,
} from 'lib/wordart/wasm/wasm-gen-types'
import * as tm from 'transformation-matrix'

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
      this.bounds = shapeBoundsInverted.get_bounds()
    }
    this.layoutGen = new wasm.LayoutGenWasm(this.bounds.w, this.bounds.h)
  }

  addItem = (hbounds: HBoundsWasm, transform?: Matrix): boolean => {
    const bounds = hbounds.get_bounds(transform ? transform.copy() : undefined)

    if (this.bounds && !isRectInsideRect(bounds, this.bounds)) {
      return false
    }

    if (this.shapeBoundsInverted) {
      if (transform) {
        if (this.shapeBoundsInverted.collides_transformed(hbounds, transform)) {
          return false
        }
      } else {
        if (this.shapeBoundsInverted.collides(hbounds)) {
          return false
        }
      }
    }
    const itemId = this.layoutGen.add_item(hbounds, transform)
    return itemId != null
  }
}

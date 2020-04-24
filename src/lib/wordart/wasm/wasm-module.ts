import type * as Wasm from 'lib/wordart/wasm/wasm-gen-types'
import { Rect } from 'lib/wordart/geometry'
import { Matrix } from 'transformation-matrix'

export type WasmModule = typeof Wasm

let _wasm: WasmModule | null = null

export const getWasmModule = async (): Promise<WasmModule> => {
  if (!_wasm) {
    const wasm = await import('lib/wordart/wasm/wasm-gen/pkg/wasm_gen')
    _wasm = wasm
  }
  return _wasm
}

export type {
  HBoundsWasm,
  Matrix as MatrixWasm,
  LayoutGenWasm,
  create_hbounds,
  fill_shapes_by_color,
} from 'lib/wordart/wasm/wasm-gen-types'

export type HBoundsWasmSerialized = {
  bounds: Rect
  overlaps_shape: boolean
  children: HBoundsWasmSerialized[]
  transform?: Matrix
}

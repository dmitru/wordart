import type * as Wasm from 'lib/wordart/wasm/wasm-gen-types'

export type WasmModule = typeof Wasm

let _wasm: WasmModule | null = null

export const getWasmModule = async (): Promise<WasmModule> => {
  if (!_wasm) {
    const wasm = await import('lib/wordart/wasm/wasm-gen/pkg/wasm_gen')
    // @ts-ignore
    _wasm = wasm
  }
  // @ts-ignore
  return _wasm
}

export type {
  HBoundsWasm,
  HBoundsWasmSerialized,
  Matrix as MatrixWasm,
  LayoutGenWasm,
  create_hbounds,
  fill_shapes_by_color,
} from 'lib/wordart/wasm/wasm-gen-types'

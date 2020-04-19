import path from 'path'
import fs from './wasm-gen/pkg/wasm_gen.wasm'

describe('wasm setup', () => {
    let wasmInstance: any
    
    beforeAll(async () => {
    const wasmPath = path.resolve(__dirname, './was');
    const buffer = fs.readFileSync(wasmPath);
    const results = await WebAssembly.instantiate(buffer, {
    env: {
    memoryBase: 0,
    tableBase: 0,
    memory: new WebAssembly.Memory({ initial: 1024 }),
    table: new WebAssembly.Table({ initial: 16, element: ‘anyfunc’ }),
    abort: console.log
    }
    });
    wasmInstance = results.instance.exports;

  it('Should call a WASM function: 2 int args, return 1 int', () => {
    console.log(wasm)
    expect(wasm.sum(2, 3)).toBe(5)
  })
})

export const foo = 1

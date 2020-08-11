import * as wasm from './wasm_gen_bg.wasm';

const lTextDecoder = typeof TextDecoder === 'undefined' ? require('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachegetUint8Memory0 = null;
function getUint8Memory0() {
    if (cachegetUint8Memory0 === null || cachegetUint8Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

const heap = new Array(32).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let cachegetUint32Memory0 = null;
function getUint32Memory0() {
    if (cachegetUint32Memory0 === null || cachegetUint32Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachegetUint32Memory0;
}

let WASM_VECTOR_LEN = 0;

function passArray32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4);
    getUint32Memory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachegetInt32Memory0 = null;
function getInt32Memory0() {
    if (cachegetInt32Memory0 === null || cachegetInt32Memory0.buffer !== wasm.memory.buffer) {
        cachegetInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachegetInt32Memory0;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 36) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

function getArrayJsValueFromWasm0(ptr, len) {
    const mem = getUint32Memory0();
    const slice = mem.subarray(ptr / 4, ptr / 4 + len);
    const result = [];
    for (let i = 0; i < slice.length; i++) {
        result.push(takeObject(slice[i]));
    }
    return result;
}
/**
* @param {Uint32Array} img_data
* @param {number} width
* @param {number} height
* @param {number} threshold_percent
* @returns {any[]}
*/
export function fill_shapes_by_color(img_data, width, height, threshold_percent) {
    try {
        var ptr0 = passArray32ToWasm0(img_data, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        wasm.fill_shapes_by_color(8, ptr0, len0, width, height, threshold_percent);
        var r0 = getInt32Memory0()[8 / 4 + 0];
        var r1 = getInt32Memory0()[8 / 4 + 1];
        var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 4);
        return v1;
    } finally {
        img_data.set(getUint32Memory0().subarray(ptr0 / 4, ptr0 / 4 + len0));
        wasm.__wbindgen_free(ptr0, len0 * 4);
    }
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1);
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}
/**
* @param {Uint8Array} img_data
* @param {number} img_width
* @param {number} img_height
* @param {number} bounds_x
* @param {number} bounds_y
* @param {number} bounds_width
* @param {number} bounds_height
* @param {number} aspect_ratio
* @returns {Rect}
*/
export function largest_rect(img_data, img_width, img_height, bounds_x, bounds_y, bounds_width, bounds_height, aspect_ratio) {
    try {
        var ptr0 = passArray8ToWasm0(img_data, wasm.__wbindgen_malloc);
        var len0 = WASM_VECTOR_LEN;
        var ret = wasm.largest_rect(ptr0, len0, img_width, img_height, bounds_x, bounds_y, bounds_width, bounds_height, aspect_ratio);
        return Rect.__wrap(ret);
    } finally {
        img_data.set(getUint8Memory0().subarray(ptr0 / 1, ptr0 / 1 + len0));
        wasm.__wbindgen_free(ptr0, len0 * 1);
    }
}

/**
*/
export class LabInt {

    static __wrap(ptr) {
        const obj = Object.create(LabInt.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_labint_free(ptr);
    }
    /**
    * @returns {number}
    */
    get color_int() {
        var ret = wasm.__wbg_get_labint_color_int(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set color_int(arg0) {
        wasm.__wbg_set_labint_color_int(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get count() {
        var ret = wasm.__wbg_get_labint_count(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set count(arg0) {
        wasm.__wbg_set_labint_count(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get r() {
        var ret = wasm.__wbg_get_labint_r(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set r(arg0) {
        wasm.__wbg_set_labint_r(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get g() {
        var ret = wasm.__wbg_get_labint_g(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set g(arg0) {
        wasm.__wbg_set_labint_g(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get b() {
        var ret = wasm.__wbg_get_labint_b(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set b(arg0) {
        wasm.__wbg_set_labint_b(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get a() {
        var ret = wasm.__wbg_get_labint_a(this.ptr);
        return ret >>> 0;
    }
    /**
    * @param {number} arg0
    */
    set a(arg0) {
        wasm.__wbg_set_labint_a(this.ptr, arg0);
    }
}
/**
*/
export class Rect {

    static __wrap(ptr) {
        const obj = Object.create(Rect.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_rect_free(ptr);
    }
    /**
    * @returns {number}
    */
    get x() {
        var ret = wasm.__wbg_get_rect_x(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set x(arg0) {
        wasm.__wbg_set_rect_x(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get y() {
        var ret = wasm.__wbg_get_rect_y(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set y(arg0) {
        wasm.__wbg_set_rect_y(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get w() {
        var ret = wasm.__wbg_get_rect_w(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set w(arg0) {
        wasm.__wbg_set_rect_w(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get h() {
        var ret = wasm.__wbg_get_rect_h(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set h(arg0) {
        wasm.__wbg_set_rect_h(this.ptr, arg0);
    }
}

export const __wbg_labint_new = function(arg0) {
    var ret = LabInt.__wrap(arg0);
    return addHeapObject(ret);
};

export const __wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};


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

let WASM_VECTOR_LEN = 0;

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

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}

let cachegetUint32Memory0 = null;
function getUint32Memory0() {
    if (cachegetUint32Memory0 === null || cachegetUint32Memory0.buffer !== wasm.memory.buffer) {
        cachegetUint32Memory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachegetUint32Memory0;
}

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

function isLikeNone(x) {
    return x === undefined || x === null;
}
/**
* @param {Uint32Array} data
* @param {number} width
* @param {number} height
* @param {number} r
* @param {number} g
* @param {number} b
* @param {number} a
* @param {boolean} invert
* @returns {HBoundsWasm}
*/
export function create_hbounds_by_color(data, width, height, r, g, b, a, invert) {
    var ptr0 = passArray32ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    var ret = wasm.create_hbounds_by_color(ptr0, len0, width, height, r, g, b, a, invert);
    return HBoundsWasm.__wrap(ret);
}

/**
* @param {Uint32Array} data
* @param {number} width
* @param {number} height
* @param {boolean} invert
* @returns {HBoundsWasm}
*/
export function create_hbounds(data, width, height, invert) {
    var ptr0 = passArray32ToWasm0(data, wasm.__wbindgen_malloc);
    var len0 = WASM_VECTOR_LEN;
    var ret = wasm.create_hbounds(ptr0, len0, width, height, invert);
    return HBoundsWasm.__wrap(ret);
}

/**
*/
export class HBoundsWasm {

    static __wrap(ptr) {
        const obj = Object.create(HBoundsWasm.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_hboundswasm_free(ptr);
    }
    /**
    * @returns {HBoundsWasm}
    */
    clone() {
        var ret = wasm.hboundswasm_clone(this.ptr);
        return HBoundsWasm.__wrap(ret);
    }
    /**
    * @param {Matrix | undefined} transform
    * @returns {any}
    */
    get_bounds(transform) {
        let ptr0 = 0;
        if (!isLikeNone(transform)) {
            _assertClass(transform, Matrix);
            ptr0 = transform.ptr;
            transform.ptr = 0;
        }
        var ret = wasm.hboundswasm_get_bounds(this.ptr, ptr0);
        return takeObject(ret);
    }
    /**
    * @returns {any}
    */
    get_js() {
        var ret = wasm.hboundswasm_get_js(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {number} a
    * @param {number} b
    * @param {number} c
    * @param {number} d
    * @param {number} e
    * @param {number} f
    */
    set_transform(a, b, c, d, e, f) {
        wasm.hboundswasm_set_transform(this.ptr, a, b, c, d, e, f);
    }
    /**
    * @param {Matrix} matrix
    */
    set_transform_matrix(matrix) {
        _assertClass(matrix, Matrix);
        var ptr0 = matrix.ptr;
        matrix.ptr = 0;
        wasm.hboundswasm_set_transform_matrix(this.ptr, ptr0);
    }
    /**
    * @returns {HBoundsWasm}
    */
    inverted() {
        var ret = wasm.hboundswasm_inverted(this.ptr);
        return HBoundsWasm.__wrap(ret);
    }
    /**
    * @param {HBoundsWasm} other
    * @param {number} pad_self
    * @param {number} pad_other
    * @returns {boolean}
    */
    collides(other, pad_self, pad_other) {
        _assertClass(other, HBoundsWasm);
        var ret = wasm.hboundswasm_collides(this.ptr, other.ptr, pad_self, pad_other);
        return ret !== 0;
    }
    /**
    * @param {HBoundsWasm} other
    * @param {Matrix} matrix
    * @param {number} pad_self
    * @param {number} pad_other
    * @returns {boolean}
    */
    collides_transformed(other, matrix, pad_self, pad_other) {
        _assertClass(other, HBoundsWasm);
        _assertClass(matrix, Matrix);
        var ret = wasm.hboundswasm_collides_transformed(this.ptr, other.ptr, matrix.ptr, pad_self, pad_other);
        return ret !== 0;
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
export class LayoutGenWasm {

    static __wrap(ptr) {
        const obj = Object.create(LayoutGenWasm.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_layoutgenwasm_free(ptr);
    }
    /**
    */
    constructor() {
        var ret = wasm.layoutgenwasm_new();
        return LayoutGenWasm.__wrap(ret);
    }
    /**
    * @returns {any}
    */
    get_js() {
        var ret = wasm.layoutgenwasm_get_js(this.ptr);
        return takeObject(ret);
    }
    /**
    * @param {HBoundsWasm} hbounds
    * @param {Matrix | undefined} transform
    * @param {number} pad_self
    * @param {number} pad_others
    * @returns {boolean}
    */
    collides(hbounds, transform, pad_self, pad_others) {
        _assertClass(hbounds, HBoundsWasm);
        let ptr0 = 0;
        if (!isLikeNone(transform)) {
            _assertClass(transform, Matrix);
            ptr0 = transform.ptr;
            transform.ptr = 0;
        }
        var ret = wasm.layoutgenwasm_collides(this.ptr, hbounds.ptr, ptr0, pad_self, pad_others);
        return ret !== 0;
    }
    /**
    * @param {HBoundsWasm} hbounds
    * @param {Matrix | undefined} transform
    * @param {number} pad_self
    * @param {number} pad_others
    * @returns {number | undefined}
    */
    add_item(hbounds, transform, pad_self, pad_others) {
        _assertClass(hbounds, HBoundsWasm);
        let ptr0 = 0;
        if (!isLikeNone(transform)) {
            _assertClass(transform, Matrix);
            ptr0 = transform.ptr;
            transform.ptr = 0;
        }
        wasm.layoutgenwasm_add_item(8, this.ptr, hbounds.ptr, ptr0, pad_self, pad_others);
        var r0 = getInt32Memory0()[8 / 4 + 0];
        var r1 = getInt32Memory0()[8 / 4 + 1];
        return r0 === 0 ? undefined : r1;
    }
}
/**
*/
export class Matrix {

    static __wrap(ptr) {
        const obj = Object.create(Matrix.prototype);
        obj.ptr = ptr;

        return obj;
    }

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_matrix_free(ptr);
    }
    /**
    * @returns {number}
    */
    get a() {
        var ret = wasm.__wbg_get_matrix_a(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set a(arg0) {
        wasm.__wbg_set_matrix_a(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get b() {
        var ret = wasm.__wbg_get_matrix_b(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set b(arg0) {
        wasm.__wbg_set_matrix_b(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get c() {
        var ret = wasm.__wbg_get_matrix_c(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set c(arg0) {
        wasm.__wbg_set_matrix_c(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get d() {
        var ret = wasm.__wbg_get_matrix_d(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set d(arg0) {
        wasm.__wbg_set_matrix_d(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get e() {
        var ret = wasm.__wbg_get_matrix_e(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set e(arg0) {
        wasm.__wbg_set_matrix_e(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get f() {
        var ret = wasm.__wbg_get_matrix_f(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set f(arg0) {
        wasm.__wbg_set_matrix_f(this.ptr, arg0);
    }
    /**
    */
    constructor() {
        var ret = wasm.matrix_new();
        return Matrix.__wrap(ret);
    }
    /**
    * @returns {Matrix}
    */
    copy() {
        var ret = wasm.matrix_copy(this.ptr);
        return Matrix.__wrap(ret);
    }
    /**
    * @param {Matrix} from
    * @param {Matrix} to
    * @param {number} ratio
    * @returns {Matrix}
    */
    static between(from, to, ratio) {
        _assertClass(from, Matrix);
        _assertClass(to, Matrix);
        var ret = wasm.matrix_between(from.ptr, to.ptr, ratio);
        return Matrix.__wrap(ret);
    }
    /**
    * @param {number} x
    * @param {number} y
    */
    translate_mut(x, y) {
        wasm.matrix_translate_mut(this.ptr, x, y);
    }
    /**
    * @param {number} x
    * @param {number} y
    * @returns {Matrix}
    */
    translate(x, y) {
        var ptr = this.ptr;
        this.ptr = 0;
        var ret = wasm.matrix_translate(ptr, x, y);
        return Matrix.__wrap(ret);
    }
    /**
    * @param {number} x
    * @param {number} y
    */
    scale_mut(x, y) {
        wasm.matrix_scale_mut(this.ptr, x, y);
    }
    /**
    * @param {number} x
    * @param {number} y
    * @returns {Matrix}
    */
    scale(x, y) {
        var ptr = this.ptr;
        this.ptr = 0;
        var ret = wasm.matrix_scale(ptr, x, y);
        return Matrix.__wrap(ret);
    }
    /**
    * @param {number} angle
    */
    rotate_mut(angle) {
        wasm.matrix_rotate_mut(this.ptr, angle);
    }
    /**
    * @param {number} angle
    * @returns {Matrix}
    */
    rotate(angle) {
        var ptr = this.ptr;
        this.ptr = 0;
        var ret = wasm.matrix_rotate(ptr, angle);
        return Matrix.__wrap(ret);
    }
    /**
    * @param {number} angle
    */
    skew_x_mut(angle) {
        wasm.matrix_skew_x_mut(this.ptr, angle);
    }
    /**
    * @param {number} angle
    * @returns {Matrix}
    */
    skew_x(angle) {
        var ptr = this.ptr;
        this.ptr = 0;
        var ret = wasm.matrix_skew_x(ptr, angle);
        return Matrix.__wrap(ret);
    }
    /**
    * @param {number} angle
    */
    skew_y_mut(angle) {
        wasm.matrix_skew_y_mut(this.ptr, angle);
    }
    /**
    * @param {number} angle
    * @returns {Matrix}
    */
    skew_y(angle) {
        var ptr = this.ptr;
        this.ptr = 0;
        var ret = wasm.matrix_skew_y(ptr, angle);
        return Matrix.__wrap(ret);
    }
    /**
    * @param {Matrix} matrix
    */
    transform_mut(matrix) {
        _assertClass(matrix, Matrix);
        wasm.matrix_transform_mut(this.ptr, matrix.ptr);
    }
    /**
    * @param {number} pa
    * @param {number} pb
    * @param {number} pc
    * @param {number} pd
    * @param {number} pe
    * @param {number} pf
    */
    transform_values_mut(pa, pb, pc, pd, pe, pf) {
        wasm.matrix_transform_values_mut(this.ptr, pa, pb, pc, pd, pe, pf);
    }
    /**
    * @param {Matrix} matrix
    * @returns {Matrix}
    */
    transform(matrix) {
        _assertClass(matrix, Matrix);
        var ret = wasm.matrix_transform(this.ptr, matrix.ptr);
        return Matrix.__wrap(ret);
    }
    /**
    * @param {number} pa
    * @param {number} pb
    * @param {number} pc
    * @param {number} pd
    * @param {number} pe
    * @param {number} pf
    * @returns {Matrix}
    */
    transform_values(pa, pb, pc, pd, pe, pf) {
        var ptr = this.ptr;
        this.ptr = 0;
        var ret = wasm.matrix_transform_values(ptr, pa, pb, pc, pd, pe, pf);
        return Matrix.__wrap(ret);
    }
    /**
    */
    reset_mut() {
        wasm.matrix_reset_mut(this.ptr);
    }
    /**
    * @param {number} a
    * @param {number} b
    * @param {number} c
    * @param {number} d
    * @param {number} e
    * @param {number} f
    */
    set_mut(a, b, c, d, e, f) {
        wasm.matrix_set_mut(this.ptr, a, b, c, d, e, f);
    }
    /**
    * @returns {number}
    */
    det() {
        var ret = wasm.matrix_det(this.ptr);
        return ret;
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
/**
*/
export class RectF {

    free() {
        const ptr = this.ptr;
        this.ptr = 0;

        wasm.__wbg_rectf_free(ptr);
    }
    /**
    * @returns {number}
    */
    get x() {
        var ret = wasm.__wbg_get_rectf_x(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set x(arg0) {
        wasm.__wbg_set_rectf_x(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get y() {
        var ret = wasm.__wbg_get_rectf_y(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set y(arg0) {
        wasm.__wbg_set_rectf_y(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get w() {
        var ret = wasm.__wbg_get_rectf_w(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set w(arg0) {
        wasm.__wbg_set_rectf_w(this.ptr, arg0);
    }
    /**
    * @returns {number}
    */
    get h() {
        var ret = wasm.__wbg_get_rectf_h(this.ptr);
        return ret;
    }
    /**
    * @param {number} arg0
    */
    set h(arg0) {
        wasm.__wbg_set_rectf_h(this.ptr, arg0);
    }
}

export const __wbg_labint_new = function(arg0) {
    var ret = LabInt.__wrap(arg0);
    return addHeapObject(ret);
};

export const __wbindgen_json_parse = function(arg0, arg1) {
    var ret = JSON.parse(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export const __wbindgen_throw = function(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};


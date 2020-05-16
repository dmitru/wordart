/* tslint:disable */
/* eslint-disable */
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
export function largest_rect(img_data: Uint8Array, img_width: number, img_height: number, bounds_x: number, bounds_y: number, bounds_width: number, bounds_height: number, aspect_ratio: number): Rect;
/**
* @param {Uint32Array} img_data 
* @param {number} width 
* @param {number} height 
* @param {number} threshold_percent 
* @returns {any[]} 
*/
export function fill_shapes_by_color(img_data: Uint32Array, width: number, height: number, threshold_percent: number): any[];
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
export function create_hbounds_by_color(data: Uint32Array, width: number, height: number, r: number, g: number, b: number, a: number, invert: boolean): HBoundsWasm;
/**
* @param {Uint32Array} data 
* @param {number} width 
* @param {number} height 
* @param {boolean} invert 
* @returns {HBoundsWasm} 
*/
export function create_hbounds(data: Uint32Array, width: number, height: number, invert: boolean): HBoundsWasm;
export class HBoundsWasm {
  free(): void;
/**
* @returns {HBoundsWasm} 
*/
  clone(): HBoundsWasm;
/**
* @param {Matrix | undefined} transform 
* @returns {any} 
*/
  get_bounds(transform?: Matrix): any;
/**
* @returns {any} 
*/
  get_js(): any;
/**
* @param {number} a 
* @param {number} b 
* @param {number} c 
* @param {number} d 
* @param {number} e 
* @param {number} f 
*/
  set_transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
/**
* @param {Matrix} matrix 
*/
  set_transform_matrix(matrix: Matrix): void;
/**
* @returns {HBoundsWasm} 
*/
  inverted(): HBoundsWasm;
/**
* @param {HBoundsWasm} other 
* @param {number} pad_self 
* @param {number} pad_other 
* @returns {boolean} 
*/
  collides(other: HBoundsWasm, pad_self: number, pad_other: number): boolean;
/**
* @param {HBoundsWasm} other 
* @param {Matrix} matrix 
* @param {number} pad_self 
* @param {number} pad_other 
* @returns {boolean} 
*/
  collides_transformed(other: HBoundsWasm, matrix: Matrix, pad_self: number, pad_other: number): boolean;
}
export class LabInt {
  free(): void;
  a: number;
  b: number;
  color_int: number;
  count: number;
  g: number;
  r: number;
}
export class LayoutGenWasm {
  free(): void;
/**
*/
  constructor();
/**
* @returns {any} 
*/
  get_js(): any;
/**
* @param {HBoundsWasm} hbounds 
* @param {Matrix | undefined} transform 
* @param {number} pad_self 
* @param {number} pad_others 
* @returns {boolean} 
*/
  collides(hbounds: HBoundsWasm, transform: Matrix | undefined, pad_self: number, pad_others: number): boolean;
/**
* @param {HBoundsWasm} hbounds 
* @param {Matrix | undefined} transform 
* @param {number} pad_self 
* @param {number} pad_others 
* @returns {number | undefined} 
*/
  add_item(hbounds: HBoundsWasm, transform: Matrix | undefined, pad_self: number, pad_others: number): number | undefined;
}
export class Matrix {
  free(): void;
/**
*/
  constructor();
/**
* @returns {Matrix} 
*/
  copy(): Matrix;
/**
* @param {Matrix} from 
* @param {Matrix} to 
* @param {number} ratio 
* @returns {Matrix} 
*/
  static between(from: Matrix, to: Matrix, ratio: number): Matrix;
/**
* @param {number} x 
* @param {number} y 
*/
  translate_mut(x: number, y: number): void;
/**
* @param {number} x 
* @param {number} y 
* @returns {Matrix} 
*/
  translate(x: number, y: number): Matrix;
/**
* @param {number} x 
* @param {number} y 
*/
  scale_mut(x: number, y: number): void;
/**
* @param {number} x 
* @param {number} y 
* @returns {Matrix} 
*/
  scale(x: number, y: number): Matrix;
/**
* @param {number} angle 
*/
  rotate_mut(angle: number): void;
/**
* @param {number} angle 
* @returns {Matrix} 
*/
  rotate(angle: number): Matrix;
/**
* @param {number} angle 
*/
  skew_x_mut(angle: number): void;
/**
* @param {number} angle 
* @returns {Matrix} 
*/
  skew_x(angle: number): Matrix;
/**
* @param {number} angle 
*/
  skew_y_mut(angle: number): void;
/**
* @param {number} angle 
* @returns {Matrix} 
*/
  skew_y(angle: number): Matrix;
/**
* @param {Matrix} matrix 
*/
  transform_mut(matrix: Matrix): void;
/**
* @param {number} pa 
* @param {number} pb 
* @param {number} pc 
* @param {number} pd 
* @param {number} pe 
* @param {number} pf 
*/
  transform_values_mut(pa: number, pb: number, pc: number, pd: number, pe: number, pf: number): void;
/**
* @param {Matrix} matrix 
* @returns {Matrix} 
*/
  transform(matrix: Matrix): Matrix;
/**
* @param {number} pa 
* @param {number} pb 
* @param {number} pc 
* @param {number} pd 
* @param {number} pe 
* @param {number} pf 
* @returns {Matrix} 
*/
  transform_values(pa: number, pb: number, pc: number, pd: number, pe: number, pf: number): Matrix;
/**
*/
  reset_mut(): void;
/**
* @param {number} a 
* @param {number} b 
* @param {number} c 
* @param {number} d 
* @param {number} e 
* @param {number} f 
*/
  set_mut(a: number, b: number, c: number, d: number, e: number, f: number): void;
/**
* @returns {number} 
*/
  det(): number;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}
export class Rect {
  free(): void;
  h: number;
  w: number;
  x: number;
  y: number;
}
export class RectF {
  free(): void;
  h: number;
  w: number;
  x: number;
  y: number;
}

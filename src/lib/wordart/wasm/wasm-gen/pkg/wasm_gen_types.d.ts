/* tslint:disable */
/* eslint-disable */
/**
 * @param {Uint32Array} img_data
 * @param {number} width
 * @param {number} height
 * @param {number} threshold_percent
 * @returns {any[]}
 */
export function fill_shapes_by_color(
  img_data: Uint32Array,
  width: number,
  height: number,
  threshold_percent: number
): any[]
/**
 * @param {Uint32Array} data
 * @param {number} width
 * @param {number} height
 * @returns {HBoundsWasm}
 */
export function create_hbounds(
  data: Uint32Array,
  width: number,
  height: number
): HBoundsWasm
export class HBoundsWasm {
  free(): void
  /**
   * @returns {HBoundsWasm}
   */
  clone(): HBoundsWasm
  /**
   * @returns {any}
   */
  get_js(): any
}
export class LabInt {
  free(): void
  b: number
  color_int: number
  count: number
  g: number
  r: number
}
export class LayoutGenWasm {
  free(): void
  /**
   * @param {number} width
   * @param {number} height
   */
  constructor(width: number, height: number)
  /**
   * @returns {any}
   */
  get_js(): any
  /**
   * @param {HBoundsWasm} hbounds
   * @param {Matrix | undefined} transform
   * @returns {number | undefined}
   */
  add_item(hbounds: HBoundsWasm, transform?: Matrix): number | undefined
}
export class Matrix {
  free(): void
  /**
   */
  constructor()
  /**
   * @param {Matrix} from
   * @param {Matrix} to
   * @param {number} ratio
   * @returns {Matrix}
   */
  static between(from: Matrix, to: Matrix, ratio: number): Matrix
  /**
   * @param {number} x
   * @param {number} y
   */
  translate_mut(x: number, y: number): void
  /**
   * @param {number} x
   * @param {number} y
   * @returns {Matrix}
   */
  translate(x: number, y: number): Matrix
  /**
   * @param {number} x
   * @param {number} y
   */
  scale_mut(x: number, y: number): void
  /**
   * @param {number} x
   * @param {number} y
   * @returns {Matrix}
   */
  scale(x: number, y: number): Matrix
  /**
   * @param {number} angle
   */
  rotate_mut(angle: number): void
  /**
   * @param {number} angle
   * @returns {Matrix}
   */
  rotate(angle: number): Matrix
  /**
   * @param {number} angle
   */
  skew_x_mut(angle: number): void
  /**
   * @param {number} angle
   * @returns {Matrix}
   */
  skew_x(angle: number): Matrix
  /**
   * @param {number} angle
   */
  skew_y_mut(angle: number): void
  /**
   * @param {number} angle
   * @returns {Matrix}
   */
  skew_y(angle: number): Matrix
  /**
   * @param {Matrix} matrix
   */
  transform_mut(matrix: Matrix): void
  /**
   * @param {number} pa
   * @param {number} pb
   * @param {number} pc
   * @param {number} pd
   * @param {number} pe
   * @param {number} pf
   */
  transform_values_mut(
    pa: number,
    pb: number,
    pc: number,
    pd: number,
    pe: number,
    pf: number
  ): void
  /**
   * @param {Matrix} matrix
   * @returns {Matrix}
   */
  transform(matrix: Matrix): Matrix
  /**
   * @param {number} pa
   * @param {number} pb
   * @param {number} pc
   * @param {number} pd
   * @param {number} pe
   * @param {number} pf
   * @returns {Matrix}
   */
  transform_values(
    pa: number,
    pb: number,
    pc: number,
    pd: number,
    pe: number,
    pf: number
  ): Matrix
  /**
   */
  reset_mut(): void
  /**
   * @param {number} a
   * @param {number} b
   * @param {number} c
   * @param {number} d
   * @param {number} e
   * @param {number} f
   */
  set_mut(
    a: number,
    b: number,
    c: number,
    d: number,
    e: number,
    f: number
  ): void
  /**
   * @returns {number}
   */
  det(): number
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}
export class Rect {
  free(): void
  h: number
  w: number
  x: number
  y: number
}

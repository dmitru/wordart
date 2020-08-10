/* tslint:disable */
/* eslint-disable */
/**
* @param {Uint32Array} img_data 
* @param {number} width 
* @param {number} height 
* @param {number} threshold_percent 
* @returns {any[]} 
*/
export function fill_shapes_by_color(img_data: Uint32Array, width: number, height: number, threshold_percent: number): any[];
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
export class LabInt {
  free(): void;
  a: number;
  b: number;
  color_int: number;
  count: number;
  g: number;
  r: number;
}
export class Rect {
  free(): void;
  h: number;
  w: number;
  x: number;
  y: number;
}

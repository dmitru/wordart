/**
 * Intuition

Imagine an algorithm where for each point we computed a rectangle by doing the following:

Finding the maximum height of the rectangle by iterating upwards until a filled area is reached

Finding the maximum width of the rectangle by iterating outwards left and right until a height that doesn't accommodate the maximum height of the rectangle

We know that the maximal rectangle must be one of the rectangles constructed in this manner (the max rectangle must have a point on its base where the next filled square is height above that point).

For each point we define some variables:

h - the height of the rectangle defined by that point

l - the left bound of the rectangle defined by that point

r - the right bound of the rectangle defined by that point

These three variables uniquely define the rectangle at that point. We can compute the area of this rectangle with h * (r - l). The global maximum of all these areas is our result.

Using dynamic programming, we can use the h, l, and r of each point in the previous row to compute the h, l, and r for every point in the next row in linear time.

Algorithm

Given row matrix[i], we keep track of the h, l, and r of each point in the row by defining three arrays - height, left, and right.

height[j] will correspond to the height of matrix[i][j], and so on and so forth with the other arrays.

The question now becomes how to update each array.

height

h is defined as the number of continuous unfilled spaces in a line from our point. We increment if there is a new space, and set it to zero if the space is filled (we are using '1' to indicate an empty space and '0' as a filled one).

new_height[j] = old_height[j] + 1 if row[j] == '1' else 0
left:

Consider what causes changes to the left bound of our rectangle. Since all instances of filled spaces occurring in the row above the current one have already been factored into the current version of left, the only thing that affects our left is if we encounter a filled space in our current row.

As a result we can define:

new_left[j] = max(old_left[j], cur_left)
cur_left is one greater than rightmost filled space we have encountered. When we "expand" the rectangle to the left, we know it can't expand past that point, otherwise it'll run into the filled space.

right:

Here we can reuse our reasoning in left and define:

new_right[j] = min(old_right[j], cur_right)
cur_right is the leftmost occurrence of a filled space we have encountered.
 * // https://stackoverflow.com/questions/7245/puzzle-find-largest-rectangle-maximal-rectangle-problem
*/
use std::cmp;
use wasm_bindgen::prelude::*;

use crate::hbounds::*;
use crate::utils::*;

// Console.log macro
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[macro_export]
macro_rules! dpi {
    ( $row:expr, $col:expr, $width:expr ) => {{
        $col + $row * $width
    }};
}

#[macro_export]
macro_rules! imi {
    ( $row:expr, $col:expr, $width:expr, $x1:expr, $y1:expr ) => {{
        4 * ($col + $x1 + ($row + $y1) * $width)
    }};
}

static mut dp_H: [usize; 1024] = [0usize; 1024 as usize];
static mut dp_L: [usize; 1024] = [0usize; 1024 as usize];
static mut dp_R: [usize; 1024] = [0usize; 1024 as usize];
static mut img_row: [usize; 1024] = [0usize; 1024 as usize];

// https://stackoverflow.com/questions/11481868/largest-rectangle-of-1s-in-2d-binary-matrix
pub unsafe fn largest_rect(
    img: &ImgDataU8,
    bounds_x: usize,
    bounds_y: usize,
    bounds_width: usize,
    bounds_height: usize,
    aspect_ratio: f32,
) -> Rect {
    let img_width = img.width as usize;
    let img = img.data;
    let x1 = bounds_x as usize;
    let y1 = bounds_y as usize;

    // let _timer = Timer::new("time1");

    let dp_width = bounds_width;

    // let _timer2 = Timer::new("time2");

    let n: usize = bounds_width;
    let m: usize = bounds_height;

    // Init DP
    for c in 0..n {
        dp_H[c] = 0;
        dp_L[c] = n;
        dp_R[c] = 0;
    }

    // console_log!("checkpoint1");

    let mut max_area = 0f32;
    let mut max_rect = Rect {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
    };

    // Compute DP
    for i in 0..m {
        let mut cur_left: usize = 0;
        let mut cur_right: usize = n;
        // console_log!("row1 {} {}", r, bounds_height);

        // Update height
        for j in 0..n {
            let alpha = img[imi!(i, j, img_width, bounds_x, bounds_y) + 3];
            let is_empty = alpha < 255;

            if is_empty {
                dp_H[j] = 0;
                img_row[j] = 0;
            } else {
                dp_H[j] = dp_H[j] + 1;
                img_row[j] = 1;
            }
        }

        // Update left
        for j in 0..n {
            let is_empty = img_row[j] == 0;
            if !is_empty {
                if dp_L[j] < cur_left {
                    dp_L[j] = cur_left;
                }
            } else {
                dp_L[j] = 0;
                cur_left = j + 1;
            }
        }

        // Update right
        for j in (0..n).rev() {
            let is_empty = img_row[j] == 0;
            if !is_empty {
                if dp_R[j] > cur_right {
                    dp_R[j] = cur_right;
                }
            } else {
                dp_R[j] = n;
                cur_right = j;
            }
        }

        // Update the area
        for j in 0..n {
            let h = dp_H[j] as i32;
            let w = (dp_R[j] as i32 - dp_L[j] as i32);
            let mut a = (w * h) as f32;
            if a > 0.0 {
                let aa = (w as f32) / (h as f32);
                if aa > aspect_ratio {
                    a = (h as f32) * aspect_ratio * (h as f32);
                } else {
                    a = (w as f32) / aspect_ratio * (w as f32);
                }
            }

            if a > max_area {
                max_area = a;
                max_rect = Rect {
                    x: dp_L[j] as i32,
                    y: (i as i32 - dp_H[j] as i32),
                    h: h as i32,
                    w: w as i32,
                }
            }
        }
    }

    return max_rect;
}

#[wasm_bindgen(js_name=largest_rect)]
pub fn largest_rect_js(
    img_data: &mut [u8],
    img_width: i32,
    img_height: i32,
    bounds_x: i32,
    bounds_y: i32,
    bounds_width: i32,
    bounds_height: i32,
    aspect_ratio: f32,
) -> Rect {
    unsafe {
        let rect = largest_rect(
            &ImgDataU8 {
                data: img_data,
                width: img_width,
                height: img_height,
            },
            bounds_x as usize,
            bounds_y as usize,
            bounds_width as usize,
            bounds_height as usize,
            aspect_ratio,
        );
        return rect;
    }
}

static WHITE: u32 = 0x00ffffff;
static BLACK: u32 = 0xff000000;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_largest_rect() {
        assert_eq!(
            largest_rect(
                &ImgData {
                    data: &[
                        WHITE, WHITE, WHITE, //
                        WHITE, BLACK, WHITE, //
                        WHITE, WHITE, WHITE, //
                    ],
                    width: 3,
                    height: 3,
                },
                0,
                0,
                3,
                3
            ),
            Rect {
                x: 0,
                y: 1,
                w: 1,
                h: 1
            },
            1.0
        );

        assert_eq!(
            largest_rect(
                &ImgData {
                    data: &[
                        WHITE, WHITE, WHITE, WHITE, WHITE, //
                        WHITE, WHITE, BLACK, BLACK, WHITE, //
                        WHITE, WHITE, BLACK, BLACK, WHITE, //
                        WHITE, WHITE, BLACK, BLACK, WHITE, //
                        WHITE, WHITE, BLACK, BLACK, WHITE, //
                    ],
                    width: 5,
                    height: 5,
                },
                0,
                0,
                5,
                5
            ),
            Rect {
                x: 1,
                y: 1,
                w: 1,
                h: 3
            },
            1.0,
        );
    }
}

/**
 * 23

I'll step through a few solutions of increasing difficulty / decreasing runtime complexity.

First, a brute force solution. Generate every possible rectangle. You can do this by iterating through every pair of points (r1,c1) (r2,c2) with r1 ≤ r2 and c1 ≤ c2 (can be done with 4 for loops). If a rectangle does not contain a 0, you compare the area to the largest area found so far. This is an O(R^3C^3).

We can speed up the valid rectangle check to O(1). We do this by doing a DP where dp(r, c) stores the number of 0's in the rectangle ((1, 1), (r, c)).

dp(r, 0) = 0
dp(0, c) = 0
dp(r,c) = dp(r−1,c)+dp(r,c−1)−dp(r−1,c−1)+(matrix[r][c]?0:1)
Then the number of 0's in ((r1, c1), (r2, c2)) is

nzeroes(r1,c1,r2,c2) = dp[r2][c2]−dp[r1 −1][c2]−dp[r2][c1 −1]+dp[r1 −1][c1 −1]
You can then check if a rectangle is valid by nzeroes(r1,c1,r2,c2) == 0.

There is an O(R^2C) solution for this using a simple DP and a stack. The DP works per column, by finding the number of 1 cells above a cell until the next 0. The dp is as follows:

dp(r, 0) = 0
dp(r, c) = 0 if matrix[r][c] == 0
dp(r, c) = dp(r-1, c) + 1 otherwise
You then do the following:

area = 0
for each row r:
  stack = {}
  stack.push((height=0, column=0))
  for each column c:
    height = dp(r, c)
    c1 = c
    while stack.top.height > height:
      c1 = stack.top.column
      stack.pop()
    if stack.top.height != height:
      stack.push((height=height, column=c1))
    for item in stack:
      a = (c - item.column + 1) * item.height
      area = max(area, a)
It is also possible to solve the problem in O(RC) using three DP’s:

h(r, c): if we start at (r, c) and go upwards, how many 1 cells do we find before the first 0?
l(r, c): how far left can we extend a rectangle with bottom-right corner at (r, c) and height h(r, c)?
r(r,c): how far right can we extend a rectangle with bottom-left corner at (r, c) and height h(r, c)?
The three recurrence relations are:

h(0, c) = 0
h(r, c) = 0 if matrix[r][c] == 0
h(r, c) = h(r-1, c)+1 otherwise

l(r, 0) = 0

l(r, c) = c-p if matrix[r-1][c] == 0
l(r, c) = min(l(r − 1, c), c − p) otherwise

r(r,C+1) = 0

r(r,c) = p-c if matrix[r-1][c] == 0
r(r,c) = min(r(r − 1, c), p − c) otherwise
where p is the column of the previous 0 as we populate l from left-right and r from right-left.

The answer is then:

max_r,c(h(r, c) ∗ (l(r, c) + r(r, c) − 1))
This works because of the observation that the largest rectangle will always touch a 0 (considering the edge as being covered in 0's) on all four sides. By considering all rectangles with at least top, left and right touching a 0, we cover all candidate rectangles. Generate every possible rectangle. You can do this by iterating through every pair of points (r1,c1) (r2,c2) with r1 ≤ r2 and c1 ≤ c2 (can be done with 4 for loops). If a rectangle does not contain a 0, you compare the area to the largest area found so far.
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

static mut dp_H: [i32; 129600] = [0i32; 360 as usize * 360 as usize];
static mut dp_L: [i32; 129600] = [0i32; 360 as usize * 360 as usize];
static mut dp_R: [i32; 129600] = [0i32; 360 as usize * 360 as usize];
static mut img_row: [bool; 360] = [false; 360 as usize];

// https://stackoverflow.com/questions/11481868/largest-rectangle-of-1s-in-2d-binary-matrix
pub unsafe fn largest_rect(
    img: &ImgDataU8,
    bounds_x: usize,
    bounds_y: usize,
    bounds_width: usize,
    bounds_height: usize,
) -> Rect {
    let img_width = img.width as usize;
    let img = img.data;
    let x1 = bounds_x as usize;
    let y1 = bounds_y as usize;

    // let _timer = Timer::new("time1");

    let dp_width = bounds_width;
    let dp_size = (bounds_width * bounds_height) as usize;
    // let mut dp_H = vec![0i32; dp_size];
    // let mut dp_L = vec![0i32; dp_size];
    // let mut dp_R = vec![0i32; dp_size];

    // let _timer2 = Timer::new("time2");

    // Compute DP
    for c in 0..bounds_width {
        dp_H[dpi!(0, c, dp_width)] = 0;
    }

    // console_log!("checkpoint1");

    for r in 1..(bounds_height) {
        dp_L[dpi!(r, 0, dp_width)] = 0;
        // console_log!("row1 {} {}", r, bounds_height);

        let mut p = 0;
        for c in 0..(bounds_width) {
            // console_log!(
            //     "row1 0 {}",
            //     imi!(r - 1, c, img_width, bounds_x, bounds_y) + 3
            // );
            let alpha = img[imi!(r - 1, c, img_width, bounds_x, bounds_y) + 3];
            let is_empty = alpha < 128;
            img_row[c] = is_empty;
            let dp_i = dpi!(r, c, dp_width);
            let cpdiff = (c as i32 - p as i32);
            let dp_i_prev_row = dp_i - dp_width;

            if is_empty {
                dp_H[dp_i] = 0;
                dp_L[dp_i] = cpdiff;
                p = c;
            } else {
                dp_H[dp_i] = dp_H[dp_i_prev_row] + 1;
                if dp_L[dp_i_prev_row] < cpdiff {
                    dp_L[dp_i] = dp_L[dp_i_prev_row];
                } else {
                    dp_L[dp_i] = cpdiff;
                }
            }
        }

        // console_log!("row2 {} {}", r, bounds_height);

        p = (bounds_width) - 1;
        dp_R[dpi!(r, p, dp_width)] = 0;

        for c in (0..bounds_width).rev() {
            // let alpha = img[imi!(r - 1, c, img_width, bounds_x, bounds_y) + 3];
            // let is_empty = alpha < 128;
            let is_empty = img_row[c];
            let dp_i = dpi!(r, c, dp_width);
            let dp_i_prev_row = dp_i - dp_width;
            let pcdiff = (p as i32 - c as i32);
            if is_empty {
                dp_R[dp_i] = pcdiff;
                p = c;
            } else {
                if dp_R[dp_i_prev_row] < pcdiff {
                    dp_R[dp_i] = dp_R[dp_i_prev_row];
                } else {
                    dp_R[dp_i] = pcdiff;
                }
            }
        }
    }

    // println!("H = {:?}\nL = {:?}\nR = {:?}", dp_H, dp_L, dp_R);

    // console_log!("checkpoint2");

    // let _timer3 = Timer::new("time3");

    // Compute answer
    let mut max_area = 0i32;
    let mut max_r = 0;
    let mut max_c = 0;
    for r in 0..bounds_height {
        for c in 0..bounds_width {
            let dpi = dpi!(r, c, dp_width);
            let candidate = (dp_H[dpi] as i32) * (dp_L[dpi] as i32 + dp_R[dpi] as i32 - 1i32);
            if candidate > max_area {
                max_area = candidate;
                // console_log!("checkpoint3 {}", max_area);
                max_r = r;
                max_c = c;
            }
        }
    }

    // console_log!("checkpoint3 {}", max_area);

    let result = Rect {
        x: (bounds_x as i32 + max_c as i32 - dp_L[dpi!(max_r, max_c, dp_width)] as i32) as i32,
        y: (bounds_y as i32 + max_r as i32 - dp_H[dpi!(max_r, max_c, dp_width)] as i32) as i32,
        w: (dp_L[dpi!(max_r, max_c, dp_width)] as i32 + dp_R[dpi!(max_r, max_c, dp_width)] as i32
            - 1) as i32,
        h: dp_H[dpi!(max_r, max_c, dp_width)] as i32,
    };

    // console_log!("checkpoint4 {:?}", result);

    return result;
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
) -> JsValue {
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
        );
        return JsValue::from_serde(&rect).unwrap();
    }
}

static WHITE: u32 = 0x00ffffff;
static BLACK: u32 = 0xff000000;

// #[cfg(test)]
// mod tests {
//     use super::*;

//     #[test]
//     fn test_largest_rect() {
//         assert_eq!(
//             largest_rect(
//                 &ImgData {
//                     data: &[
//                         WHITE, WHITE, WHITE, //
//                         WHITE, BLACK, WHITE, //
//                         WHITE, WHITE, WHITE, //
//                     ],
//                     width: 3,
//                     height: 3,
//                 },
//                 0,
//                 0,
//                 3,
//                 3
//             ),
//             Rect {
//                 x: 0,
//                 y: 1,
//                 w: 1,
//                 h: 1
//             }
//         );

//         assert_eq!(
//             largest_rect(
//                 &ImgData {
//                     data: &[
//                         WHITE, WHITE, WHITE, WHITE, WHITE, //
//                         WHITE, WHITE, BLACK, BLACK, WHITE, //
//                         WHITE, WHITE, BLACK, BLACK, WHITE, //
//                         WHITE, WHITE, BLACK, BLACK, WHITE, //
//                         WHITE, WHITE, BLACK, BLACK, WHITE, //
//                     ],
//                     width: 5,
//                     height: 5,
//                 },
//                 0,
//                 0,
//                 5,
//                 5
//             ),
//             Rect {
//                 x: 1,
//                 y: 1,
//                 w: 1,
//                 h: 3
//             }
//         );
//     }
// }

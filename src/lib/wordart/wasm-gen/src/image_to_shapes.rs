use wasm_bindgen::prelude::*;

use deltae::*;
use palette::{rgb, FromColor, IntoColor, Lab, Lch, Srgb};
use std::collections::HashMap;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! get_ch_b {
    ( $feature:expr ) => {{
        (($feature & 0xff0000u32) >> 16)
    }};
}

macro_rules! get_ch_g {
    ( $feature:expr ) => {{
        (($feature & 0xff00u32) >> 8)
    }};
}

macro_rules! get_ch_r {
    ( $feature:expr ) => {{
        ($feature & 0xffu32)
    }};
}

pub fn calc_e_diff(lab1: &Lab, lab2: &Lab) -> f32 {
    let lab_v_1 = LabValue {
        l: lab1.l,
        a: lab1.a,
        b: lab1.b,
    };
    let lab_v_2 = LabValue {
        l: lab2.l,
        a: lab2.a,
        b: lab2.b,
    };
    let result = DeltaE::new(&lab_v_1, &lab_v_2, DE2000);
    return result.value;
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone)]
pub struct LabInt {
    pub color_int: u32,
    pub count: i32,
    pub r: u32,
    pub g: u32,
    pub b: u32,
    lab: Lab,
}

#[wasm_bindgen]
pub fn fill_shapes_by_color(
    img_data: &mut [u32],
    w: i32,
    h: i32,
    threshold_part: i32,
) -> Box<[JsValue]> {
    let mut color_counts = HashMap::new();

    for col in 0..w {
        for row in 0..h {
            let fi = (row * w + col) as usize;
            let color = img_data[fi];

            if let Some(x) = color_counts.get_mut(&color) {
                *x = *x + 1;
            } else {
                color_counts.insert(color, 1);
            }
        }
    }

    let total_pixels = w * h;
    let threshold_pixels = total_pixels / threshold_part;
    color_counts.retain(|_, v| *v >= threshold_pixels);

    console_log!("Size: {}", color_counts.len());

    let mut lab_colors: Vec<LabInt> = vec![];
    for (color_int, count) in &color_counts {
        let r = get_ch_r!(color_int);
        let g = get_ch_g!(color_int);
        let b = get_ch_b!(color_int);
        console_log!("color: {}, {}, {} {} {}", color_int, count, r, g, b);
        let lab = Lab::from(Srgb::new(
            (r as f32) / 255.0,
            (g as f32) / 255.0,
            (b as f32) / 255.0,
        ));
        lab_colors.push(LabInt {
            lab,
            r,
            g,
            b,
            color_int: *color_int,
            count: *count,
        });
    }
    lab_colors.sort_by(|a, b| b.count.cmp(&a.count));

    for col in 0..w {
        for row in 0..h {
            let fi = (row * w + col) as usize;
            let color_int = img_data[fi];
            let r = get_ch_r!(color_int);
            let g = get_ch_g!(color_int);
            let b = get_ch_b!(color_int);

            let lab1 = Lab::from(Srgb::new(
                (r as f32) / 255.0,
                (g as f32) / 255.0,
                (b as f32) / 255.0,
            ));

            let mut min_e = 1000000f32;
            let mut result: u32 = 0;
            for lab_int_2 in &lab_colors {
                let e = calc_e_diff(&lab1, &lab_int_2.lab);
                if e < min_e {
                    min_e = e;
                    result = lab_int_2.color_int;
                }
            }

            if min_e > 0.0 {
                // console_log!("{} {}: {}", row, col, min_e);
                img_data[fi] = result;
            }

            // console_log!("{}", result);
        }
    }

    let result: Vec<JsValue> = lab_colors.into_iter().map(JsValue::from).collect();
    result.into_boxed_slice()
}

use wasm_bindgen::prelude::*;

use crate::hbounds::*;
use crate::layout_gen::*;
use crate::matrix::*;
use std::collections::HashMap;

// Console.log macro
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub struct HBoundsWasm {
    wrapped: HBounds,
}

#[wasm_bindgen]
impl HBoundsWasm {
    #[wasm_bindgen]
    pub fn clone(&self) -> HBoundsWasm {
        HBoundsWasm {
            wrapped: self.wrapped.clone(),
        }
    }

    #[wasm_bindgen]
    pub fn get_js(&self) -> JsValue {
        JsValue::from_serde(&self.wrapped).unwrap()
    }

    #[wasm_bindgen]
    pub fn set_transform(&mut self, a: f32, b: f32, c: f32, d: f32, e: f32, f: f32) {
        let mut m = Matrix::new();
        m.a = a;
        m.b = b;
        m.c = c;
        m.d = d;
        m.e = e;
        m.f = f;
        self.wrapped.transform = Some(m);
    }
}

// JS interface
#[wasm_bindgen]
pub fn create_hbounds(data: &[u32], width: i32, height: i32, invert: bool) -> HBoundsWasm {
    // for row in 0..width {
    //     for col in 0..height {
    //         let fi = (row * width + col) as usize;
    //         let color = data[fi];
    //         // console_log!("color: {}", color);
    //     }
    // }
    let hb = HBounds::from(
        ImgData {
            data,
            width,
            height,
        },
        invert,
    );
    HBoundsWasm { wrapped: hb }
}

#[wasm_bindgen]
pub struct LayoutGenWasm {
    wrapped: LayoutGen,
}

#[wasm_bindgen]
impl LayoutGenWasm {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f32, height: f32) -> Self {
        LayoutGenWasm {
            wrapped: LayoutGen::new(width, height),
        }
    }

    pub fn get_js(&self) -> JsValue {
        JsValue::from_serde(&self.wrapped).unwrap()
    }

    pub fn add_item(&mut self, hbounds: &HBoundsWasm, transform: Option<Matrix>) -> Option<i32> {
        let mut item = Item::new(&hbounds.wrapped.clone());
        if (transform.is_some()) {
            item.transform = transform.unwrap();
        }
        return self.wrapped.add_item(item);
    }
}

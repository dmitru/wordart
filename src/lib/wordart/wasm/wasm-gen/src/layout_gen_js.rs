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
    pub fn get_bounds(&self, transform: Option<Matrix>) -> JsValue {
        let rect = self.wrapped.get_bounds(transform);
        JsValue::from_serde(&rect).unwrap()
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

    #[wasm_bindgen]
    pub fn set_transform_matrix(&mut self, matrix: Matrix) {
        self.wrapped.transform = Some(matrix);
    }

    #[wasm_bindgen]
    pub fn inverted(&self) -> HBoundsWasm {
        HBoundsWasm {
            wrapped: self.wrapped.inverted(),
        }
    }

    #[wasm_bindgen]
    pub fn collides(&self, other: &HBoundsWasm, pad_self: f32, pad_other: f32) -> bool {
        HBounds::intersects(&self.wrapped, &other.wrapped, None, pad_self, pad_other)
    }

    #[wasm_bindgen]
    pub fn collides_transformed(
        &self,
        other: &HBoundsWasm,
        matrix: &Matrix,
        pad_self: f32,
        pad_other: f32,
    ) -> bool {
        HBounds::intersects(
            &self.wrapped,
            &other.wrapped,
            Some(matrix.copy()),
            pad_self,
            pad_other,
        )
    }
}

// JS interface
#[wasm_bindgen]
pub fn create_hbounds_by_color(
    data: &[u32],
    width: i32,
    height: i32,
    r: u32,
    g: u32,
    b: u32,
    a: u32,
    invert: bool,
) -> HBoundsWasm {
    let hb = HBounds::from(
        ImgData {
            data,
            width,
            height,
        },
        Some(Rgba { r, g, b, a }),
        invert,
    );
    HBoundsWasm { wrapped: hb }
}

#[wasm_bindgen]
pub fn create_hbounds(data: &[u32], width: i32, height: i32, invert: bool) -> HBoundsWasm {
    let hb = HBounds::from(
        ImgData {
            data,
            width,
            height,
        },
        None,
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
    pub fn new() -> Self {
        LayoutGenWasm {
            wrapped: LayoutGen::new(),
        }
    }

    pub fn get_js(&self) -> JsValue {
        JsValue::from_serde(&self.wrapped).unwrap()
    }

    pub fn collides(
        &mut self,
        hbounds: &HBoundsWasm,
        transform: Option<Matrix>,
        pad_self: f32,
        pad_others: f32,
    ) -> bool {
        let mut item = Item::new(&hbounds.wrapped.clone());
        if (transform.is_some()) {
            item.transform = transform.unwrap();
        }
        return self.wrapped.collides(&item, pad_self, pad_others);
    }

    pub fn add_item(
        &mut self,
        hbounds: &HBoundsWasm,
        transform: Option<Matrix>,
        pad_self: f32,
        pad_others: f32,
    ) -> Option<i32> {
        let mut item = Item::new(&hbounds.wrapped.clone());
        if (transform.is_some()) {
            item.transform = transform.unwrap();
        }
        let bounds = item.bounds();
        let result = self.wrapped.add_item(item, pad_self, pad_others);
        // if (result.is_some()) {
        // console_log!(
        //     "Item bounds: {:?} {:?}",
        //     hbounds.wrapped.get_bounds(None),
        //     bounds
        // );
        // }
        return result;
    }
}

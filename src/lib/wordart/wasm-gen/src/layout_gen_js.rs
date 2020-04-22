use wasm_bindgen::prelude::*;

use crate::hbounds::*;
use crate::layout_gen::*;

#[wasm_bindgen]
pub struct HBoundsJs {
    wrapped: HBounds,
}

#[wasm_bindgen]
impl HBoundsJs {
    // Given an opaque pointer, returns a full serialized JSON to JS
    pub fn get_js(&self) -> JsValue {
        JsValue::from_serde(&self.wrapped).unwrap()
    }
}

// JS interface
#[wasm_bindgen]
pub fn create_hbounds(data: &[u32], width: i32, height: i32) -> HBoundsJs {
    let hb = HBounds::from(ImgData {
        data,
        width,
        height,
    });
    HBoundsJs { wrapped: hb }
}

#[wasm_bindgen]
pub struct LayoutGenJs {
    wrapped: LayoutGen,
}

#[wasm_bindgen]
impl LayoutGenJs {
    pub fn new(width: f32, height: f32) -> Self {
        LayoutGenJs {
            wrapped: LayoutGen::new(width, height),
        }
    }

    pub fn get_js(&self) -> JsValue {
        JsValue::from_serde(&self.wrapped).unwrap()
    }

    pub fn foo(self) -> i32 {
        return 42;
    }
}

use wasm_bindgen::prelude::*;

use crate::hbounds::*;
use crate::layout_gen::*;
use crate::matrix::*;

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
pub struct HBoundsJs {
    wrapped: HBounds,
}

#[wasm_bindgen]
impl HBoundsJs {
    #[wasm_bindgen]
    pub fn clone(&self) -> HBoundsJs {
        HBoundsJs {
            wrapped: self.wrapped.clone(),
        }
    }

    pub fn get_js(&self) -> JsValue {
        JsValue::from_serde(&self.wrapped).unwrap()
    }
}

// JS interface
#[wasm_bindgen]
pub fn create_hbounds(data: &[u32], width: i32, height: i32) -> HBoundsJs {
    // for row in 0..width {
    //     for col in 0..height {
    //         let fi = (row * width + col) as usize;
    //         let color = data[fi];
    //         // console_log!("color: {}", color);
    //     }
    // }
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
    #[wasm_bindgen(constructor)]
    pub fn new(width: f32, height: f32) -> Self {
        LayoutGenJs {
            wrapped: LayoutGen::new(width, height),
        }
    }

    pub fn get_js(&self) -> JsValue {
        JsValue::from_serde(&self.wrapped).unwrap()
    }

    pub fn add_item(&mut self, hbounds: &HBoundsJs, transform: Option<Matrix>) -> Option<i32> {
        let mut item = Item::new(&hbounds.wrapped.clone());
        if (transform.is_some()) {
            item.transform = transform.unwrap();
        }
        return self.wrapped.add_item(item);
    }
}


#[macro_use]
mod utils;
mod image_to_shapes;

extern crate wasm_bindgen;

use wasm_bindgen::prelude::*;


// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;


#[wasm_bindgen]
extern {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() {
    alert("Hello, wasm-gen!");
}

#[wasm_bindgen]
pub fn sum(a: i32, b:i32) -> i32 {
    a + b
}
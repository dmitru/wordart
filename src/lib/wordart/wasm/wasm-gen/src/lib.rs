#[macro_use]
mod utils;
mod hbounds;
mod image_to_shapes;
mod layout_gen;
mod layout_gen_js;
mod matrix;

#[macro_use]
extern crate serde_derive;
extern crate spaceindex;
extern crate wasm_bindgen;
extern crate web_sys;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

pub fn sum(a: i32, b: i32) -> i32 {
    a + b
}

use wasm_bindgen::prelude::*;

pub fn set_panic_hook() {
    // When the `console_error_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// Console.log macro
#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[macro_export]
macro_rules! get_ch_a {
    ( $feature:expr ) => {{
        (($feature & 0xff000000u32) >> 24)
    }};
}

#[macro_export]
macro_rules! get_ch_b {
    ( $feature:expr ) => {{
        (($feature & 0xff0000u32) >> 16)
    }};
}

#[macro_export]
macro_rules! get_ch_g {
    ( $feature:expr ) => {{
        (($feature & 0xff00u32) >> 8)
    }};
}

#[macro_export]
macro_rules! get_ch_r {
    ( $feature:expr ) => {{
        ($feature & 0xffu32)
    }};
}

use web_sys::console;

pub struct Timer<'a> {
    name: &'a str,
}

impl<'a> Timer<'a> {
    pub fn new(name: &'a str) -> Timer<'a> {
        console::time_with_label(name);
        Timer { name }
    }

    pub fn drop_explicit(&mut self) {
        console::time_end_with_label(self.name);
    }
}

impl<'a> Drop for Timer<'a> {
    fn drop(&mut self) {
        console::time_end_with_label(self.name);
    }
}

pub struct ImgData<'a> {
    pub data: &'a [u32],
    pub width: i32,
    pub height: i32,
}

pub struct ImgDataU8<'a> {
    pub data: &'a [u8],
    pub width: i32,
    pub height: i32,
}

#[derive(PartialEq, Debug, Copy, Clone, Serialize)]
pub struct Rgba {
    pub r: u32,
    pub g: u32,
    pub b: u32,
    pub a: u32,
}

pub struct ImgDataMut<'a> {
    pub data: &'a mut [u32],
    pub width: i32,
    pub height: i32,
}

#[wasm_bindgen]
#[derive(PartialEq, Debug, Copy, Clone, Serialize)]
pub struct Rect {
    pub x: i32,
    pub y: i32,
    pub w: i32,
    pub h: i32,
}

impl Rect {
    fn area(&self) -> i32 {
        self.w * self.h
    }
}

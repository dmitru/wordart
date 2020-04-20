use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
#[derive(Debug, Copy, Clone, Serialize)]
pub struct Rect {
    pub x: f64,
    pub y: f64,
    pub w: f64,
    pub h: f64,
}

impl Rect {
    fn area(&self) -> f64 {
        self.w * self.h
    }
}

#[wasm_bindgen]
#[derive(Serialize)]
pub struct HBounds {
    pub bounds: Rect,
    pub count: i32,
    pub level: i32,
    pub overlapping_area: f64,
    pub overlaps_shape: bool,
    children: Vec<HBounds>,
}

#[wasm_bindgen]
impl HBounds {
    pub fn getJS(&mut self) -> JsValue {
        JsValue::from_serde(&self).unwrap()
    }
}

#[wasm_bindgen]
pub fn create_hbounds(img_data: &[u32], w: i32, h: i32) -> HBounds {
    let hb = create_hbounds_for_image(img_data, w, h);
    hb
    // JsValue::from_serde(&2).unwrap()
}

// #[wasm_bindgen]
// pub fn get_serialized_hbounds(hb: &mut HBounds) -> JsValue {
//     JsValue::from_serde(&hb).unwrap()
// }

enum ShapeIntesectionKind {
    Empty,
    Partial,
    Full,
}

fn divide_bounds(bounds: Rect) -> Vec<Rect> {
    let x1 = bounds.x;
    let x2 = bounds.x + bounds.w;
    let y1 = bounds.y;
    let y2 = bounds.y + bounds.h;
    let mx = (x1 + x2) / 2f64;
    let my = (y1 + y2) / 2f64;
    let result: Vec<Rect> = vec![
        Rect {
            x: x1,
            y: y1,
            w: mx - x1,
            h: my - y1,
        },
        Rect {
            x: mx,
            y: y1,
            w: x2 - mx,
            h: my - y1,
        },
        Rect {
            x: x1,
            y: my,
            w: mx - x1,
            h: y2 - my,
        },
        Rect {
            x: mx,
            y: my,
            w: x2 - mx,
            h: y2 - my,
        },
    ];
    return result;
}

fn create_hbounds_for_image(img_data: &[u32], w: i32, h: i32) -> HBounds {
    let is_pixel_intersecting = |row: i32, col: i32| -> bool {
        let index = (col + row * w) as usize;
        let color_int = img_data[index];
        let r = get_ch_r!(color_int);
        return r < 244;
    };

    let is_rect_intersecting = |rect: Rect| -> ShapeIntesectionKind {
        let x1 = rect.x.floor() as i32;
        let y1 = rect.y.floor() as i32;
        let x2 = x1 + rect.w.ceil() as i32;
        let y2 = y1 + rect.h.ceil() as i32;

        let mut checked_cnt = 0;
        let mut intersecting_cnt = 0;

        for row in y1..y2 {
            for col in x1..x2 {
                if is_pixel_intersecting(row, col) {
                    intersecting_cnt += 1;
                }
                checked_cnt += 1;
            }
        }

        if checked_cnt == 0 || intersecting_cnt == 0 {
            return ShapeIntesectionKind::Empty;
        }

        if checked_cnt == intersecting_cnt {
            return ShapeIntesectionKind::Full;
        }

        return ShapeIntesectionKind::Partial;
    };

    let compute_hbounds = |bounds: Rect, min_size: f64, max_level: i32| -> HBounds {
        fn compute_hbounds_impl(
            bounds: Rect,
            level: i32,
            min_size: f64,
            max_level: i32,
            is_rect_intersecting: &dyn Fn(Rect) -> ShapeIntesectionKind,
        ) -> HBounds {
            let intersection = is_rect_intersecting(bounds);

            match intersection {
                ShapeIntesectionKind::Empty => {
                    return HBounds {
                        count: 1,
                        bounds,
                        level,
                        overlaps_shape: false,
                        overlapping_area: 0f64,
                        children: vec![],
                    };
                }

                ShapeIntesectionKind::Full => {
                    return HBounds {
                        count: 1,
                        bounds,
                        level,
                        overlaps_shape: true,
                        overlapping_area: bounds.area(),
                        children: vec![],
                    };
                }

                ShapeIntesectionKind::Partial => {
                    let has_children =
                        level <= max_level && bounds.w >= min_size && bounds.h >= min_size;

                    if !has_children {
                        return HBounds {
                            count: 1,
                            bounds,
                            level,
                            overlaps_shape: false,
                            overlapping_area: 0f64,
                            children: vec![],
                        };
                    }

                    let children_bounds = divide_bounds(bounds);
                    let children: Vec<HBounds> = children_bounds
                        .iter()
                        .map(|child_bounds| {
                            compute_hbounds_impl(
                                *child_bounds,
                                level + 1,
                                min_size,
                                max_level,
                                &is_rect_intersecting,
                            )
                        })
                        .collect();

                    return HBounds {
                        count: 1,
                        bounds,
                        level,
                        overlaps_shape: true,
                        overlapping_area: 0f64,
                        children,
                    };
                }
            }
        };

        return compute_hbounds_impl(bounds, 1, min_size, max_level, &is_rect_intersecting);
    };

    compute_hbounds(
        Rect {
            x: 0f64,
            y: 0f64,
            w: w as f64,
            h: h as f64,
        },
        4f64,
        12,
    )
}

#[cfg(test)]
mod tests {
    use crate::hbounds;

    #[test]
    fn it_works() {
        let img: [u32; 9] = [0, 0, 0, 1, 1, 1, 0, 0, 0];
        let res = hbounds::create_hbounds_for_image(&img, 3, 3);
    }
}

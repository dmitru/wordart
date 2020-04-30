use std::rc::Rc;
use wasm_bindgen::prelude::*;

use crate::matrix::Matrix;
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

#[derive(PartialEq, Debug, Copy, Clone)]
pub struct PointF {
    pub x: f32,
    pub y: f32,
}

impl PointF {
    pub fn transform(&self, m: Matrix) -> PointF {
        PointF {
            x: self.x * m.a + m.e,
            y: self.y * m.d + m.f,
        }
    }
}

#[wasm_bindgen]
#[derive(PartialEq, Debug, Copy, Clone, Serialize)]
pub struct RectF {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

impl RectF {
    pub fn intersect(r1: Self, r2: Self, pad1: f32, pad2: f32) -> bool {
        let minx1 = r1.x - pad1;
        let maxx1 = r1.x + r1.w + 2f32 * pad1;
        let minx2 = r2.x - pad2;
        let maxx2 = r2.x + r2.w + 2f32 * pad2;

        let miny1 = r1.y - pad1;
        let maxy1 = r1.y + r1.h + 2f32 * pad1;
        let miny2 = r2.y - pad2;
        let maxy2 = r2.y + r2.h + 2f32 * pad2;

        if miny1 >= maxy2 || miny2 >= maxy1 {
            return false;
        }

        if minx1 >= maxx2 || minx2 >= maxx1 {
            return false;
        }

        return true;
    }
    pub fn from(rect: Rect) -> RectF {
        RectF {
            x: rect.x as f32,
            y: rect.y as f32,
            w: rect.w as f32,
            h: rect.h as f32,
        }
    }
    pub fn transform_mut(&mut self, m: Matrix) {
        let br = PointF {
            x: self.x + self.w,
            y: self.y + self.h,
        };
        let br_transformed = br.transform(m);
        let tl = PointF {
            x: self.x,
            y: self.y,
        };
        let tl_transformed = tl.transform(m);

        self.x = tl_transformed.x;
        self.y = tl_transformed.y;
        self.w = br_transformed.x - tl_transformed.x;
        self.h = br_transformed.y - tl_transformed.y;
    }
    pub fn transform(&self, m: Matrix) -> RectF {
        let tl = PointF {
            x: self.x,
            y: self.y,
        };
        let tl_transformed = tl.transform(m);

        let br = PointF {
            x: self.x + self.w,
            y: self.y + self.h,
        };
        let br_transformed = br.transform(m);

        RectF {
            x: tl_transformed.x,
            y: tl_transformed.y,
            w: br_transformed.x - tl_transformed.x,
            h: br_transformed.y - tl_transformed.y,
        }
    }
}

#[derive(PartialEq, Debug, Clone, Serialize)]
pub struct HBounds {
    pub bounds: Rect,
    pub count: i32,
    pub level: i32,
    pub overlapping_area: i32,
    pub overlaps_shape: bool,
    pub children: Rc<Vec<HBounds>>,
    pub transform: Option<Matrix>,
}

impl HBounds {
    pub fn get_bounds(&self, transform: Option<Matrix>) -> RectF {
        let rect = RectF::from(self.bounds);
        let rect = match (self.transform) {
            Some(selfTransform) => rect.transform(selfTransform),
            None => rect,
        };
        let rect = match (transform) {
            Some(t) => rect.transform(t),
            None => rect,
        };
        return rect;
    }

    pub fn transform(&self, transform: Matrix) -> HBounds {
        // let _timer = Timer::new("HBounds::transform");
        HBounds {
            bounds: self.bounds,
            count: self.count,
            level: self.level,
            overlapping_area: self.overlapping_area,
            overlaps_shape: self.overlaps_shape,
            children: self.children.clone(),
            transform: Some(match self.transform {
                Some(selfTransform) => transform.transform(&selfTransform),
                None => transform,
            }),
        }
    }

    pub fn intersects(hbounds1: &Self, hbounds2: &Self, t2: Option<Matrix>) -> bool {
        // println!(
        //     "compute_hbounds_impl: {:?} {:?}",
        //     hbounds1.bounds, hbounds2.bounds
        // );

        // console_log!("{:?}", t2);

        // let _timer = Timer::new("HBounds::intersects");
        fn collides_rec_impl(
            hbounds1: &HBounds,
            hbounds2: &HBounds,
            transform1: Matrix,
            transform2: Matrix,
            level1: i32,
            level2: i32,
            max_level1: i32,
            max_level2: i32,
            min_size: f32,
            pad1: f32,
            pad2: f32,
        ) -> bool {
            if !hbounds1.overlaps_shape || !hbounds2.overlaps_shape {
                // println!("case 1");
                return false;
            }

            // invariant: at least one hbounds overlaps the shape

            let mut bounds1 = RectF::from(hbounds1.bounds).transform(transform1);
            // bounds1.transform_mut(transform1);
            // println!("bounds1: \n{:?}", bounds1);

            let mut bounds2 = RectF::from(hbounds2.bounds).transform(transform2);
            // bounds2.transform_mut(transform2);
            // println!("bounds2: \n{:?}\n", bounds2);
            if !RectF::intersect(bounds1, bounds2, pad1, pad2) {
                // println!("case 2");
                return false;
            }

            let has_children1 = level1 < max_level1
                && bounds1.w >= min_size
                && bounds1.h >= min_size
                && hbounds1.children.len() > 0;
            let has_children2 = level2 < max_level2
                && bounds2.w >= min_size
                && bounds2.h >= min_size
                && hbounds2.children.len() > 0;

            if !has_children1 && !has_children2 {
                // println!("case 3");
                return hbounds1.overlaps_shape && hbounds2.overlaps_shape;
            }

            // invariant: at least one hbounds has children

            if has_children1 && !has_children2 {
                // println!("case 4");
                for child in hbounds1.children.iter() {
                    if !child.overlaps_shape {
                        continue;
                    }

                    let child_transform = match child.transform {
                        Some(t) => transform1.transform(&t),
                        None => transform1,
                    };
                    let child_result = collides_rec_impl(
                        child,
                        hbounds2,
                        child_transform,
                        transform2,
                        level1 + 1,
                        level2,
                        max_level1,
                        max_level2,
                        min_size,
                        pad1,
                        pad2,
                    );

                    if child_result {
                        return true;
                    }
                }
            }

            if has_children2 && !has_children1 {
                // println!("case 5");
                for child in hbounds2.children.iter() {
                    if !child.overlaps_shape {
                        continue;
                    }

                    let child_transform = match child.transform {
                        Some(t) => transform2.transform(&t),
                        None => transform2,
                    };
                    let child_result = collides_rec_impl(
                        hbounds1,
                        child,
                        transform1,
                        child_transform,
                        level1,
                        level2 + 1,
                        max_level1,
                        max_level2,
                        min_size,
                        pad1,
                        pad2,
                    );

                    if child_result {
                        return true;
                    }
                }
            }

            // println!("case 6");
            for child1 in hbounds1.children.iter() {
                if !child1.overlaps_shape {
                    continue;
                }
                let child1_transform = match child1.transform {
                    Some(t) => transform1.transform(&t),
                    None => transform1,
                };

                for child2 in hbounds2.children.iter() {
                    if !child2.overlaps_shape {
                        continue;
                    }

                    let child2_transform = match child2.transform {
                        Some(t) => transform2.transform(&t),
                        None => transform2,
                    };

                    let child_result = collides_rec_impl(
                        child1,
                        child2,
                        child1_transform,
                        child2_transform,
                        level1 + 1,
                        level2 + 1,
                        max_level1,
                        max_level2,
                        min_size,
                        pad1,
                        pad2,
                    );

                    if child_result {
                        return true;
                    }
                }
            }

            // println!("case 7");

            return false;
        }

        let max_level1 = 10;
        let max_level2 = 10;
        let min_size = 2f32;
        let pad1 = 0f32;
        let pad2 = 0f32;

        let transform1 = match hbounds1.transform {
            Some(t) => t,
            None => Matrix::new(),
        };

        let mut transform2 = Matrix::new();

        if t2.is_some() {
            transform2 = transform2.transform(&t2.unwrap());
        }

        if hbounds2.transform.is_some() {
            transform2 = transform2.transform(&hbounds2.transform.unwrap());
        }

        collides_rec_impl(
            hbounds1, hbounds2, transform1, transform2, 1, 1, max_level1, max_level2, min_size,
            pad1, pad2,
        )
    }

    pub fn inverted(&self) -> HBounds {
        let total_area = self.bounds.w * self.bounds.h;
        HBounds {
            bounds: self.bounds,
            count: self.count,
            level: self.level,
            overlapping_area: total_area - self.overlapping_area,
            overlaps_shape: !self.overlaps_shape,
            children: Rc::new(self.children.iter().map(|c| c.inverted()).collect()),
            transform: self.transform,
        }
    }

    pub fn from(img_data: ImgData, color: Option<Rgba>, invert: bool) -> HBounds {
        match img_data {
            ImgData {
                data,
                width,
                height,
            } => {
                // console_log!("New!");
                // for row in 0..width {
                //     for col in 0..height {
                //         let fi = (row * width + col) as usize;
                //         let color = data[fi];
                //         let r = get_ch_r!(data[fi]);
                //         let g = get_ch_g!(data[fi]);
                //         let b = get_ch_b!(data[fi]);
                //         console_log!("color: {:x?} - {:x?} {:x?} {:x?}", color, r, g, b);
                //     }
                // }
                let is_pixel_intersecting = |row: i32, col: i32, color: Option<Rgba>| -> bool {
                    let index = (col + row * width) as usize;
                    let color_int = data[index];

                    match color {
                        Some(rgba) => {
                            let r = get_ch_r!(color_int);
                            let g = get_ch_g!(color_int);
                            let b = get_ch_b!(color_int);
                            let a = get_ch_a!(color_int);

                            let matches =
                                !(r != rgba.r || g != rgba.g || b != rgba.b || a != rgba.a);
                            if invert {
                                return !matches;
                            } else {
                                return matches;
                            }
                        }
                        None => {
                            let a = get_ch_a!(color_int);

                            if invert {
                                return a == 0;
                            } else {
                                return a > 0;
                            }
                        }
                    };
                };

                let is_rect_intersecting =
                    |rect: Rect, color: Option<Rgba>| -> ShapeIntesectionKind {
                        let x1 = rect.x;
                        let y1 = rect.y;
                        let x2 = x1 + rect.w;
                        let y2 = y1 + rect.h;
                        let mut checked_cnt = 0;
                        let mut intersecting_cnt = 0;
                        for row in y1..y2 {
                            for col in x1..x2 {
                                if is_pixel_intersecting(row, col, color) {
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
                let compute_hbounds = |bounds: Rect,
                                       color: Option<Rgba>,
                                       min_size: i32,
                                       max_level: i32|
                 -> HBounds {
                    fn compute_hbounds_impl(
                        bounds: Rect,
                        color: Option<Rgba>,
                        level: i32,
                        min_size: i32,
                        max_level: i32,
                        is_rect_intersecting: &dyn Fn(Rect, Option<Rgba>) -> ShapeIntesectionKind,
                    ) -> HBounds {
                        let intersection = is_rect_intersecting(bounds, color);

                        match intersection {
                            ShapeIntesectionKind::Empty => {
                                // console_log!("cas 1");
                                return HBounds {
                                    count: 1,
                                    bounds,
                                    level,
                                    overlaps_shape: false,
                                    overlapping_area: 0,
                                    children: Rc::new(vec![]),
                                    transform: None,
                                };
                            }
                            ShapeIntesectionKind::Full => {
                                // console_log!("cas 2");
                                return HBounds {
                                    count: 1,
                                    bounds,
                                    level,
                                    overlaps_shape: true,
                                    overlapping_area: bounds.area(),
                                    children: Rc::new(vec![]),
                                    transform: None,
                                };
                            }
                            ShapeIntesectionKind::Partial => {
                                let has_children = level <= max_level
                                    && bounds.w >= min_size
                                    && bounds.h >= min_size;
                                if !has_children {
                                    return HBounds {
                                        count: 1,
                                        bounds,
                                        level,
                                        overlaps_shape: false,
                                        overlapping_area: bounds.area(),
                                        children: Rc::new(vec![]),
                                        transform: None,
                                    };
                                }
                                let children_bounds = divide_bounds(bounds);
                                let children: Vec<HBounds> = children_bounds
                                    .iter()
                                    .map(|child_bounds| {
                                        compute_hbounds_impl(
                                            *child_bounds,
                                            color,
                                            level + 1,
                                            min_size,
                                            max_level,
                                            &is_rect_intersecting,
                                        )
                                    })
                                    .collect();
                                return HBounds {
                                    count: children.iter().map(|child| child.count).sum(),
                                    bounds,
                                    level,
                                    overlaps_shape: true,
                                    overlapping_area: children
                                        .iter()
                                        .map(|child| child.overlapping_area)
                                        .sum(),
                                    children: Rc::new(children),
                                    transform: None,
                                };
                            }
                        }
                    };

                    return compute_hbounds_impl(
                        bounds,
                        color,
                        1,
                        min_size,
                        max_level,
                        &is_rect_intersecting,
                    );
                };
                compute_hbounds(
                    Rect {
                        x: 0,
                        y: 0,
                        w: width,
                        h: height,
                    },
                    color,
                    1,
                    12,
                )
            }
        }
    }
}

enum ShapeIntesectionKind {
    Empty,
    Partial,
    Full,
}

pub struct ImgData<'a> {
    pub data: &'a [u32],
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

fn divide_bounds(bounds: Rect) -> Vec<Rect> {
    let x1 = bounds.x;
    let x2 = bounds.x + bounds.w;
    let y1 = bounds.y;
    let y2 = bounds.y + bounds.h;
    let mx = (x1 + x2) / 2;
    let my = (y1 + y2) / 2;

    if x2 - x1 > 1 && y2 - y1 > 1 {
        return vec![
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
    }

    if x2 - x1 > 1 {
        return vec![
            Rect {
                x: x1,
                y: y1,
                w: mx - x1,
                h: 1,
            },
            Rect {
                x: mx,
                y: y1,
                w: x2 - mx,
                h: 1,
            },
        ];
    }

    if y2 - y1 > 1 {
        return vec![
            Rect {
                x: x1,
                y: y1,
                w: 1,
                h: my - y1,
            },
            Rect {
                x: x1,
                y: my,
                w: 1,
                h: y2 - my,
            },
        ];
    }

    vec![Rect {
        x: x1,
        y: y1,
        w: 1,
        h: 1,
    }]
}

static WHITE: u32 = 0x00ffffff;
static BLACK: u32 = 0xff000000;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_divide_bounds() {
        let bounds = Rect {
            x: 0,
            y: 0,
            w: 4,
            h: 4,
        };
        let divided_bounds = divide_bounds(bounds);

        assert_eq!(
            divided_bounds,
            vec![
                Rect {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2
                },
                Rect {
                    x: 2,
                    y: 0,
                    w: 2,
                    h: 2
                },
                Rect {
                    x: 0,
                    y: 2,
                    w: 2,
                    h: 2
                },
                Rect {
                    x: 2,
                    y: 2,
                    w: 2,
                    h: 2
                }
            ]
        );
    }

    #[test]
    fn test_divide_bounds_2() {
        let bounds = Rect {
            x: 0,
            y: 0,
            w: 1,
            h: 1,
        };
        let divided_bounds = divide_bounds(bounds);

        assert_eq!(
            divided_bounds,
            vec![Rect {
                x: 0,
                y: 0,
                w: 1,
                h: 1
            }]
        );
    }

    #[test]
    fn test_divide_bounds_3() {
        assert_eq!(
            divide_bounds(Rect {
                x: 0,
                y: 0,
                w: 2,
                h: 1,
            }),
            vec![
                Rect {
                    x: 0,
                    y: 0,
                    w: 1,
                    h: 1
                },
                Rect {
                    x: 1,
                    y: 0,
                    w: 1,
                    h: 1
                }
            ]
        );
    }

    #[test]
    fn test_divide_bounds_4() {
        let divided_bounds = divide_bounds(Rect {
            x: 0,
            y: 0,
            w: 3,
            h: 3,
        });

        assert_eq!(
            divided_bounds,
            vec![
                Rect {
                    x: 0,
                    y: 0,
                    w: 1,
                    h: 1
                },
                Rect {
                    x: 1,
                    y: 0,
                    w: 2,
                    h: 1
                },
                Rect {
                    x: 0,
                    y: 1,
                    w: 1,
                    h: 2
                },
                Rect {
                    x: 1,
                    y: 1,
                    w: 2,
                    h: 2
                }
            ]
        );

        assert_eq!(
            divide_bounds(Rect {
                x: 0,
                y: 1,
                w: 1,
                h: 2
            },),
            vec![
                Rect {
                    x: 0,
                    y: 1,
                    w: 1,
                    h: 1
                },
                Rect {
                    x: 0,
                    y: 2,
                    w: 1,
                    h: 1
                }
            ]
        );
    }

    #[test]
    fn test_hbounds_from_2_x_2_full() {
        let img = ImgData {
            data: &[
                BLACK, BLACK, //
                BLACK, BLACK,
            ],
            width: 2,
            height: 2,
        };

        // TODO: wrap img in ImageData {} type

        let res = HBounds::from(img, None, false);
        assert_eq!(
            res,
            HBounds {
                transform: None,
                bounds: Rect {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2
                },
                count: 1,
                level: 1,
                overlapping_area: 4,
                overlaps_shape: true,
                children: Rc::new(vec![]),
            }
        );
    }

    #[test]
    fn test_hbounds_from_2_x_2_empty() {
        let img = ImgData {
            data: &[
                WHITE, WHITE, //
                WHITE, WHITE,
            ],
            width: 2,
            height: 2,
        };

        // TODO: wrap img in ImageData {} type

        let res = HBounds::from(img, None, false);
        assert_eq!(
            res,
            HBounds {
                transform: None,
                bounds: Rect {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2
                },
                count: 1,
                level: 1,
                overlapping_area: 0,
                overlaps_shape: false,
                children: Rc::new(vec![]),
            }
        );
    }

    #[test]
    fn test_hbounds_from_2_x_2_1() {
        let img = ImgData {
            data: &[
                BLACK, BLACK, //
                BLACK, WHITE,
            ],
            width: 2,
            height: 2,
        };

        let res = HBounds::from(img, None, false);
        assert_eq!(
            res,
            HBounds {
                bounds: Rect {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2
                },
                count: 4,
                level: 1,
                overlapping_area: 3,
                overlaps_shape: true,
                children: Rc::new(vec![
                    HBounds {
                        bounds: Rect {
                            x: 0,
                            y: 0,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 1,
                        overlaps_shape: true,
                        children: Rc::new(vec![]),
                        transform: None
                    },
                    HBounds {
                        bounds: Rect {
                            x: 1,
                            y: 0,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 1,
                        overlaps_shape: true,
                        children: Rc::new(vec![]),
                        transform: None
                    },
                    HBounds {
                        bounds: Rect {
                            x: 0,
                            y: 1,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 1,
                        overlaps_shape: true,
                        children: Rc::new(vec![]),
                        transform: None
                    },
                    HBounds {
                        bounds: Rect {
                            x: 1,
                            y: 1,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 0,
                        overlaps_shape: false,
                        children: Rc::new(vec![]),
                        transform: None
                    }
                ]),
                transform: None
            }
        );
    }

    #[test]
    fn test_hbounds_from_2_x_2() {
        let img = ImgData {
            data: &[
                WHITE, WHITE, //
                WHITE, BLACK,
            ],
            width: 2,
            height: 2,
        };

        let res = HBounds::from(img, None, false);
        assert_eq!(
            res,
            HBounds {
                transform: None,
                bounds: Rect {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2
                },
                count: 4,
                level: 1,
                overlapping_area: 1,
                overlaps_shape: true,
                children: Rc::new(vec![
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 0,
                            y: 0,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 0,
                        overlaps_shape: false,
                        children: Rc::new(vec![])
                    },
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 1,
                            y: 0,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 0,
                        overlaps_shape: false,
                        children: Rc::new(vec![])
                    },
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 0,
                            y: 1,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 0,
                        overlaps_shape: false,
                        children: Rc::new(vec![])
                    },
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 1,
                            y: 1,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 1,
                        overlaps_shape: true,
                        children: Rc::new(vec![])
                    }
                ])
            }
        );
    }

    #[test]
    fn test_hbounds_from_3_x_3_triangle() {
        let img = ImgData {
            data: &[
                WHITE, WHITE, WHITE, //
                WHITE, WHITE, BLACK, //
                WHITE, BLACK, BLACK, //
            ],
            width: 3,
            height: 3,
        };

        let res = HBounds::from(img, None, false);
        assert_eq!(
            res,
            HBounds {
                transform: None,
                bounds: Rect {
                    x: 0,
                    y: 0,
                    w: 3,
                    h: 3
                },
                count: 7,
                level: 1,
                overlapping_area: 3,
                overlaps_shape: true,
                children: Rc::new(vec![
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 0,
                            y: 0,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 0,
                        overlaps_shape: false,
                        children: Rc::new(vec![])
                    },
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 1,
                            y: 0,
                            w: 2,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 0,
                        overlaps_shape: false,
                        children: Rc::new(vec![])
                    },
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 0,
                            y: 1,
                            w: 1,
                            h: 2
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 0,
                        overlaps_shape: false,
                        children: Rc::new(vec![])
                    },
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 1,
                            y: 1,
                            w: 2,
                            h: 2
                        },
                        count: 4,
                        level: 2,
                        overlapping_area: 3,
                        overlaps_shape: true,
                        children: Rc::new(vec![
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 1,
                                    y: 1,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 0,
                                overlaps_shape: false,
                                children: Rc::new(vec![])
                            },
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 2,
                                    y: 1,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 1,
                                overlaps_shape: true,
                                children: Rc::new(vec![])
                            },
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 1,
                                    y: 2,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 1,
                                overlaps_shape: true,
                                children: Rc::new(vec![])
                            },
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 2,
                                    y: 2,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 1,
                                overlaps_shape: true,
                                children: Rc::new(vec![])
                            }
                        ])
                    }
                ])
            }
        );
    }

    #[test]
    fn test_hbounds_from_3_x_3_stripe() {
        let img = ImgData {
            data: &[
                WHITE, WHITE, WHITE, //
                BLACK, BLACK, BLACK, //
                WHITE, WHITE, WHITE, //
            ],
            width: 3,
            height: 3,
        };

        let res = HBounds::from(img, None, false);
        assert_eq!(
            res,
            HBounds {
                transform: None,
                bounds: Rect {
                    x: 0,
                    y: 0,
                    w: 3,
                    h: 3
                },
                count: 8,
                level: 1,
                overlapping_area: 3,
                overlaps_shape: true,
                children: Rc::new(vec![
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 0,
                            y: 0,
                            w: 1,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 0,
                        overlaps_shape: false,
                        children: Rc::new(vec![])
                    },
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 1,
                            y: 0,
                            w: 2,
                            h: 1
                        },
                        count: 1,
                        level: 2,
                        overlapping_area: 0,
                        overlaps_shape: false,
                        children: Rc::new(vec![])
                    },
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 0,
                            y: 1,
                            w: 1,
                            h: 2
                        },
                        count: 2,
                        level: 2,
                        overlapping_area: 1,
                        overlaps_shape: true,
                        children: Rc::new(vec![
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 0,
                                    y: 1,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 1,
                                overlaps_shape: true,
                                children: Rc::new(vec![])
                            },
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 0,
                                    y: 2,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 0,
                                overlaps_shape: false,
                                children: Rc::new(vec![])
                            }
                        ])
                    },
                    HBounds {
                        transform: None,
                        bounds: Rect {
                            x: 1,
                            y: 1,
                            w: 2,
                            h: 2
                        },
                        count: 4,
                        level: 2,
                        overlapping_area: 2,
                        overlaps_shape: true,
                        children: Rc::new(vec![
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 1,
                                    y: 1,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 1,
                                overlaps_shape: true,
                                children: Rc::new(vec![])
                            },
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 2,
                                    y: 1,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 1,
                                overlaps_shape: true,
                                children: Rc::new(vec![])
                            },
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 1,
                                    y: 2,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 0,
                                overlaps_shape: false,
                                children: Rc::new(vec![])
                            },
                            HBounds {
                                transform: None,
                                bounds: Rect {
                                    x: 2,
                                    y: 2,
                                    w: 1,
                                    h: 1
                                },
                                count: 1,
                                level: 3,
                                overlapping_area: 0,
                                overlaps_shape: false,
                                children: Rc::new(vec![])
                            }
                        ])
                    }
                ])
            }
        );
    }

    #[test]
    fn test_collision_self() {
        let img = ImgData {
            data: &[
                BLACK, BLACK, //
                BLACK, WHITE,
            ],
            width: 2,
            height: 2,
        };

        let res = HBounds::from(img, None, false);

        assert_eq!(HBounds::intersects(&res, &res, None), true);
    }

    #[test]
    fn test_collision_simple_1() {
        let hbounds1 = HBounds::from(
            ImgData {
                data: &[
                    BLACK, WHITE, //
                    BLACK, WHITE,
                ],
                width: 2,
                height: 2,
            },
            None,
            false,
        );
        let hbounds2 = HBounds::from(
            ImgData {
                data: &[
                    BLACK, BLACK, //
                    WHITE, WHITE,
                ],
                width: 2,
                height: 2,
            },
            None,
            false,
        );
        let hbounds3 = HBounds::from(
            ImgData {
                data: &[
                    WHITE, BLACK, //
                    WHITE, BLACK,
                ],
                width: 2,
                height: 2,
            },
            None,
            false,
        );
        let hbounds4 = HBounds::from(
            ImgData {
                data: &[
                    WHITE, WHITE, //
                    BLACK, BLACK,
                ],
                width: 2,
                height: 2,
            },
            None,
            false,
        );

        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2, None), true);
        assert_eq!(HBounds::intersects(&hbounds2, &hbounds1, None), true);

        assert_eq!(HBounds::intersects(&hbounds2, &hbounds3, None), true);
        assert_eq!(HBounds::intersects(&hbounds3, &hbounds2, None), true);

        assert_eq!(HBounds::intersects(&hbounds3, &hbounds4, None), true);
        assert_eq!(HBounds::intersects(&hbounds4, &hbounds3, None), true);

        assert_eq!(HBounds::intersects(&hbounds4, &hbounds1, None), true);
        assert_eq!(HBounds::intersects(&hbounds1, &hbounds4, None), true);

        assert_eq!(HBounds::intersects(&hbounds1, &hbounds3, None), false);
        assert_eq!(HBounds::intersects(&hbounds3, &hbounds1, None), false);

        assert_eq!(HBounds::intersects(&hbounds2, &hbounds4, None), false);
        assert_eq!(HBounds::intersects(&hbounds4, &hbounds2, None), false);
    }

    #[test]
    fn test_collision_translate() {
        let mut hbounds1 = HBounds::from(
            ImgData {
                data: &[
                    WHITE, WHITE, //
                    BLACK, WHITE,
                ],
                width: 2,
                height: 2,
            },
            None,
            false,
        );

        let mut hbounds2 = HBounds::from(
            ImgData {
                data: &[
                    WHITE, BLACK, //
                    WHITE, WHITE,
                ],
                width: 2,
                height: 2,
            },
            None,
            false,
        );

        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2, None), false);

        hbounds1.transform = None;
        hbounds2.transform = Some(Matrix::new().translate(-1f32, 1f32));
        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2, None), true);

        hbounds1.transform = Some(Matrix::new().translate(1f32, -1f32));
        hbounds2.transform = None;
        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2, None), true);
    }

    #[test]
    fn test_collision_translate_2() {
        let mut hbounds1 = HBounds::from(
            ImgData {
                data: &[
                    WHITE, WHITE, WHITE, WHITE, WHITE, WHITE, //
                    WHITE, WHITE, WHITE, WHITE, WHITE, WHITE, //
                    WHITE, WHITE, WHITE, WHITE, WHITE, WHITE, //
                    BLACK, WHITE, WHITE, WHITE, WHITE, WHITE, //
                ],
                width: 6,
                height: 4,
            },
            None,
            false,
        );

        let mut hbounds2 = HBounds::from(
            ImgData {
                data: &[
                    WHITE, WHITE, BLACK, WHITE, //
                    WHITE, WHITE, WHITE, WHITE, //
                    WHITE, WHITE, WHITE, WHITE, //
                ],
                width: 4,
                height: 3,
            },
            None,
            false,
        );

        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2, None), false);

        hbounds1.transform = Some(Matrix::new().translate(1f32, -2f32));
        hbounds2.transform = Some(Matrix::new().translate(-1f32, 1f32));
        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2, None), true);

        hbounds1.transform = Some(Matrix::new().translate(0f32, 0f32));
        hbounds2.transform = Some(Matrix::new().translate(-2f32, 3f32));
        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2, None), true);

        // hbounds1.transform = Some(Matrix::new().translate(1f32, -1f32));
        // hbounds2.transform = None;
        // assert_eq!(HBounds::intersects(&hbounds1, &hbounds2, None), true);
    }

    #[test]
    fn test_rect_intersections() {
        assert_eq!(
            RectF::intersect(
                RectF::from(Rect {
                    x: 0,
                    y: 0,
                    w: 1,
                    h: 1,
                }),
                RectF::from(Rect {
                    x: 1,
                    y: 0,
                    w: 1,
                    h: 1,
                }),
                0f32,
                0f32
            ),
            false
        );
        assert_eq!(
            RectF::intersect(
                RectF::from(Rect {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2,
                }),
                RectF::from(Rect {
                    x: 1,
                    y: 0,
                    w: 2,
                    h: 2,
                }),
                0f32,
                0f32
            ),
            true
        );
        assert_eq!(
            RectF::intersect(
                RectF::from(Rect {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2,
                }),
                RectF::from(Rect {
                    x: 1,
                    y: 1,
                    w: 1,
                    h: 1,
                }),
                0f32,
                0f32
            ),
            true
        );
        assert_eq!(
            RectF::intersect(
                RectF::from(Rect {
                    x: 1,
                    y: 1,
                    w: 1,
                    h: 1,
                }),
                RectF::from(Rect {
                    x: 0,
                    y: 0,
                    w: 2,
                    h: 2,
                }),
                0f32,
                0f32
            ),
            true
        );
    }

    #[test]
    fn test_rect_intersections_transformed() {
        assert_eq!(
            RectF::intersect(
                RectF::from(Rect {
                    x: 0,
                    y: 0,
                    w: 1,
                    h: 1,
                }),
                RectF::from(Rect {
                    x: 1,
                    y: 0,
                    w: 1,
                    h: 1,
                })
                .transform(Matrix::new().translate(-1f32, 0f32)),
                0f32,
                0f32
            ),
            true
        );
    }

    #[test]
    fn test_point_transforms() {
        assert_eq!(
            (PointF { x: 0f32, y: 0f32 }).transform(Matrix::new().translate(1f32, 2f32)),
            PointF { x: 1f32, y: 2f32 },
        );
        assert_eq!(
            (PointF { x: 1f32, y: 2f32 }).transform(Matrix::new().translate(1f32, 2f32)),
            PointF { x: 2f32, y: 4f32 },
        );
        assert_eq!(
            (PointF { x: 1f32, y: 2f32 }).transform(Matrix::new().translate(-1f32, -2f32)),
            PointF { x: 0f32, y: 0f32 },
        );
    }

    #[test]
    fn test_rect_transforms() {
        assert_eq!(
            (RectF {
                x: 0f32,
                y: 0f32,
                h: 1f32,
                w: 1f32
            })
            .transform(Matrix::new().translate(1f32, 2f32)),
            RectF {
                x: 1f32,
                y: 2f32,
                h: 1f32,
                w: 1f32
            },
        );
    }
}

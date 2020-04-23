use wasm_bindgen::prelude::*;

use crate::matrix::Matrix;

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

#[derive(PartialEq, Debug, Copy, Clone)]
pub struct RectF {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

impl RectF {
    pub fn intersect(r1: Self, r2: Self) -> bool {
        let minx1 = r1.x;
        let maxx1 = r1.x + r1.w;
        let minx2 = r2.x;
        let maxx2 = r2.x + r2.w;

        let miny1 = r1.y;
        let maxy1 = r1.y + r1.h;
        let miny2 = r2.y;
        let maxy2 = r2.y + r2.h;

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
    pub children: Vec<HBounds>,
    pub transform: Option<Matrix>,
}

impl HBounds {
    pub fn clone(&self) -> HBounds {
        HBounds {
            bounds: self.bounds,
            count: self.count,
            level: self.level,
            overlapping_area: self.overlapping_area,
            overlaps_shape: self.overlaps_shape,
            children: self.children.clone(),
            transform: self.transform.clone(),
        }
    }

    pub fn transform(&self, transform: Matrix) -> HBounds {
        HBounds {
            bounds: self.bounds,
            count: self.count,
            level: self.level,
            overlapping_area: self.overlapping_area,
            overlaps_shape: self.overlaps_shape,
            children: self.children.clone(),
            transform: Some(match self.transform {
                Some(t) => t.transform(&transform),
                None => transform,
            }),
        }
    }

    pub fn from(img_data: ImgData) -> HBounds {
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
                let is_pixel_intersecting = |row: i32, col: i32| -> bool {
                    let index = (col + row * width) as usize;
                    let color_int = data[index];
                    let r = get_ch_r!(color_int);
                    return r < 244;
                };
                let is_rect_intersecting = |rect: Rect| -> ShapeIntesectionKind {
                    let x1 = rect.x;
                    let y1 = rect.y;
                    let x2 = x1 + rect.w;
                    let y2 = y1 + rect.h;
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
                let compute_hbounds = |bounds: Rect, min_size: i32, max_level: i32| -> HBounds {
                    fn compute_hbounds_impl(
                        bounds: Rect,
                        level: i32,
                        min_size: i32,
                        max_level: i32,
                        is_rect_intersecting: &dyn Fn(Rect) -> ShapeIntesectionKind,
                    ) -> HBounds {
                        let intersection = is_rect_intersecting(bounds);

                        match intersection {
                            ShapeIntesectionKind::Empty => {
                                // console_log!("cas 1");
                                return HBounds {
                                    count: 1,
                                    bounds,
                                    level,
                                    overlaps_shape: false,
                                    overlapping_area: 0,
                                    children: vec![],
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
                                    children: vec![],
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
                                        children: vec![],
                                        transform: None,
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
                                    count: children.iter().map(|child| child.count).sum(),
                                    bounds,
                                    level,
                                    overlaps_shape: true,
                                    overlapping_area: children
                                        .iter()
                                        .map(|child| child.overlapping_area)
                                        .sum(),
                                    children,
                                    transform: None,
                                };
                            }
                        }
                    };

                    return compute_hbounds_impl(
                        bounds,
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
                    1,
                    8,
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

static WHITE: u32 = 0xffffff;
static BLACK: u32 = 0x000000;

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

        let res = HBounds::from(img);
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
                children: vec![],
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

        let res = HBounds::from(img);
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
                children: vec![],
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

        let res = HBounds::from(img);
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
                children: vec![
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
                        children: vec![]
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
                        children: vec![]
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
                        children: vec![]
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
                        children: vec![]
                    }
                ]
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

        let res = HBounds::from(img);
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
                children: vec![
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
                        children: vec![]
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
                        children: vec![]
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
                        children: vec![]
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
                        children: vec![
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
                                children: vec![]
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
                                children: vec![]
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
                                children: vec![]
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
                                children: vec![]
                            }
                        ]
                    }
                ]
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

        let res = HBounds::from(img);
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
                children: vec![
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
                        children: vec![]
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
                        children: vec![]
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
                        children: vec![
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
                                children: vec![]
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
                                children: vec![]
                            }
                        ]
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
                        children: vec![
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
                                children: vec![]
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
                                children: vec![]
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
                                children: vec![]
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
                                children: vec![]
                            }
                        ]
                    }
                ]
            }
        );
    }
}

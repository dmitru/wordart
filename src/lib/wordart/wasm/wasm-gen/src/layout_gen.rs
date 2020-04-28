use wasm_bindgen::prelude::*;

use crate::utils::*;
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

use crate::hbounds::*;
use crate::matrix::Matrix;
use crate::spaceindex::rtree::RTree;

#[derive(PartialEq, Debug, Clone, Serialize)]
pub struct Item {
    pub transform: Matrix,
    pub hbounds: HBounds,
}

impl Item {
    pub fn new(hbounds: &HBounds) -> Self {
        Item {
            hbounds: hbounds.clone(),
            transform: Matrix::new(),
        }
    }

    pub fn bounds(&self) -> RectF {
        let mut rect = RectF::from(self.hbounds.bounds);
        if (self.hbounds.transform.is_some()) {
            rect = rect.transform(self.hbounds.transform.unwrap());
        }
        rect = rect.transform(self.transform);
        return rect;
    }

    fn intersects(&self, other: &Self) -> bool {
        let hb1 = self.hbounds.transform(self.transform);
        // let hb2 = other.hbounds.transform(other.transform);
        // console_log!("check1");
        // let _timer = Timer::new("Item::intersects");
        let result = HBounds::intersects(&hb1, &other.hbounds, Some(other.transform));
        // console_log!("check2");
        return result;
    }
}

#[derive(Serialize)]
pub struct LayoutGen {
    next_id: i32,

    #[serde(skip_serializing)]
    pub rtree: RTree<Item>,
}

impl LayoutGen {
    pub fn new() -> Self {
        LayoutGen {
            next_id: 0,
            rtree: RTree::new(2),
        }
    }
    pub fn add_item(&mut self, item: Item) -> Option<i32> {
        let rect = item.bounds();
        let region = (
            (rect.x as f64, rect.y as f64),
            ((rect.x + rect.w) as f64, (rect.y + rect.h) as f64),
        );
        // console_log!("add 1");
        // let mut _timer = Timer::new("rtree::region_intersection_lookup");
        let result = self.rtree.region_intersection_lookup(region);
        // _timer.drop_explicit();
        // console_log!("candidates: {}", result.len());

        for candidate_index in result.iter() {
            // let mut _timer = Timer::new("rtree::loop");
            match self.rtree.get_node(*candidate_index).get_data() {
                Some(candidate_item) => {
                    if item.intersects(candidate_item) {
                        return None;
                    }
                }
                None => {
                    console_log!("None!");
                }
            }
        }

        let item_id = self.next_id;
        self.next_id += 1;
        self.rtree.insert(region, item);
        return Some(item_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    static BLACK: u32 = 0xff000000;
    static WHITE: u32 = 0x00ffffff;

    #[test]
    fn test_collision_self() {
        let width = 2;
        let height = 2;
        let mut layout = LayoutGen::new();

        let item1 = Item::new(&HBounds::from(
            ImgData {
                data: &[
                    BLACK, BLACK, //
                    BLACK, WHITE,
                ],
                width,
                height,
            },
            None,
            false,
        ));
        let item2 = item1.clone();

        assert_eq!(layout.add_item(item1), Some(0));
        assert_eq!(layout.add_item(item2), None);

        let item3 = Item::new(&HBounds::from(
            ImgData {
                data: &[
                    WHITE, WHITE, //
                    WHITE, BLACK,
                ],
                width,
                height,
            },
            None,
            false,
        ));

        assert_eq!(layout.add_item(item3), Some(1));
    }
}

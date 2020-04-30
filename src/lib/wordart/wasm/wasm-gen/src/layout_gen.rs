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
        self.hbounds.get_bounds(Some(self.transform))
    }

    fn intersects(&self, other: &Self) -> bool {
        let hb1 = self.hbounds.transform(self.transform);
        let hb2 = other.hbounds.transform(other.transform);
        // let hb1 = &self.hbounds;
        // let hb2 = &other.hbounds;
        // let rect1 = self.bounds();
        // let rect2 = other.bounds();
        // return RectF::intersect(rect1, rect2, 0f32, 0f32);
        // console_log!("check1");
        // let _timer = Timer::new("Item::intersects");
        return HBounds::intersects(&hb1, &hb2, None);
        // console_log!("check2");
        // return result;
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

    pub fn collides(&mut self, item: &Item) -> bool {
        let rect = item.bounds();
        let region = (
            (rect.x as f64, rect.y as f64),
            ((rect.x + rect.w) as f64, (rect.y + rect.h) as f64),
        );
        // console_log!("add 1");
        // let mut _timer = Timer::new("rtree::collides");
        let result = self.rtree.region_intersection_lookup(region);
        // let result = self
        //     .rtree
        //     .region_intersection_lookup(((-100f64, -100f64), (10000f64, 100000f64)));
        // _timer.drop_explicit();

        // console_log!("CANDIDATES LEN: {}, rect: {:?}", result.len(), rect);

        let mut count = 0;
        for candidate_index in result.iter() {
            // let mut _timer = Timer::new("rtree::loop");
            match self.rtree.get_node(*candidate_index).get_data() {
                Some(candidate_item) => {
                    if item.intersects(candidate_item) {
                        return true;
                    }
                    // console_log!(
                    //     "{}: {:?} {:?}",
                    //     count,
                    //     item.bounds(),
                    //     candidate_item.bounds()
                    // );
                }
                None => {
                    // console_log!("{:?} {:?}", item.bounds(), candidate_item.bounds());
                }
            }

            count += 1;
        }

        // console_log!("\n");

        return false;
    }

    pub fn add_item(&mut self, item: Item) -> Option<i32> {
        let rect = item.bounds();
        let region = (
            (rect.x as f64, rect.y as f64),
            ((rect.x + rect.w) as f64, (rect.y + rect.h) as f64),
        );
        let collides = self.collides(&item);

        // console_log!("candidates: {}", result.len());

        if !collides {
            let item_id = self.next_id;
            self.next_id += 1;
            self.rtree.insert(region, item);
            return Some(item_id);
        } else {
            return None;
        }
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

        assert_eq!(layout.collides(&item3), false);
    }

    #[test]
    fn test_collision_transform() {
        let width = 3;
        let height = 3;
        let mut layout = LayoutGen::new();

        let mut item1 = Item::new(&HBounds::from(
            ImgData {
                data: &[
                    BLACK, WHITE, WHITE, //
                    WHITE, WHITE, WHITE, //
                    WHITE, WHITE, WHITE, //
                ],
                width,
                height,
            },
            None,
            false,
        ));
        let mut item2 = item1.clone();
        let mut item3 = item1.clone();
        let mut item4 = item1.clone();
        item1.transform = Matrix::new().scale(3f32, 2f32).translate(-1f32, -1f32);
        // println!("{:?}", item1.bounds());
        item2.transform = Matrix::new();

        assert_eq!(layout.add_item(item1), Some(0));
        assert_eq!(layout.add_item(item2), None);

        item3.transform = Matrix::new().translate(1f32, 0f32);
        assert_eq!(layout.add_item(item3), None);

        item4.transform = Matrix::new().translate(1f32, 1f32);
        assert_eq!(layout.add_item(item4), Some(1));
    }
}

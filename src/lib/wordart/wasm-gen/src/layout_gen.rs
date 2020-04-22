use wasm_bindgen::prelude::*;

use std::collections::HashMap;

use crate::hbounds::*;
use crate::matrix::Matrix;
use crate::quadtree_cd::{BoundingBox, Intersection, Tree};

#[derive(PartialEq, Debug, Clone, Serialize)]
pub struct Item {
    pub transform: Matrix,
    pub hbounds: HBounds,
}

impl Item {
    pub fn new(hbounds: HBounds) -> Self {
        Item {
            hbounds,
            transform: Matrix::new(),
        }
    }

    pub fn bounds(&self) -> RectF {
        return RectF::from(self.hbounds.bounds).transform(self.transform);
    }
}

impl Intersection for Item {
    fn intersects(&self, other: &Self) -> bool {
        let hb1 = self.hbounds.transform(self.transform);
        let hb2 = other.hbounds.transform(other.transform);
        HBounds::intersects(&hb1, &hb2)
    }
}

#[derive(Serialize)]
pub struct LayoutGen {
    next_id: i32,
    #[serde(skip_serializing)]
    pub quadtree: Tree<Item>,
}

impl LayoutGen {
    pub fn new(width: f32, height: f32) -> Self {
        LayoutGen {
            next_id: 0,
            // items: HashMap::new(),
            quadtree: Tree::new(width, height),
        }
    }
    pub fn add_item(&mut self, item: Item) -> Option<i32> {
        let rect = item.bounds();
        let bbox = BoundingBox {
            x0: rect.x,
            y0: rect.y,
            x1: rect.x + rect.w,
            y1: rect.y + rect.h,
        };
        let result = self.quadtree.insert_unless_intersecting(item, &bbox);
        if result {
            let item_id = self.next_id;
            self.next_id += 1;
            // self.items.insert(item_id, item);
            return Some(item_id);
        }

        return None;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    static BLACK: u32 = 0x000000;
    static WHITE: u32 = 0xffffff;

    #[test]
    fn test_collision_self() {
        let width = 2;
        let height = 2;
        let mut layout = LayoutGen::new(width as f32, height as f32);

        let item1 = Item::new(HBounds::from(ImgData {
            data: &[
                BLACK, BLACK, //
                BLACK, WHITE,
            ],
            width,
            height,
        }));
        let item2 = item1.clone();

        assert_eq!(layout.add_item(item1), Some(0));
        assert_eq!(layout.add_item(item2), None);

        let item3 = Item::new(HBounds::from(ImgData {
            data: &[
                WHITE, WHITE, //
                WHITE, BLACK,
            ],
            width,
            height,
        }));

        assert_eq!(layout.add_item(item3), Some(1));
    }
}

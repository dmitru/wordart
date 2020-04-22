use crate::hbounds::*;
use crate::matrix::Matrix;
use crate::quadtree_cd::Intersection;

impl HBounds {
    pub fn intersects(hbounds1: &Self, hbounds2: &Self) -> bool {
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

            let mut bounds1 = RectF::from(hbounds1.bounds);
            bounds1.transform_mut(transform1);

            let mut bounds2 = RectF::from(hbounds2.bounds);
            bounds2.transform_mut(transform2);

            // println!("bounds1: {:?}\n{:?}", hbounds1, bounds1);
            // println!("bounds2: {:?}\n{:?}\n", hbounds2, bounds2);

            if !RectF::intersect(bounds1, bounds2) {
                // println!("case 2");
                return false;
            }

            let has_children1 = level1 <= max_level1
                && bounds1.w >= min_size
                && bounds1.h >= min_size
                && hbounds1.children.len() > 0;
            let has_children2 = level2 <= max_level2
                && bounds2.w >= min_size
                && bounds2.h >= min_size
                && hbounds2.children.len() > 0;

            if !has_children1 && !has_children2 {
                // println!("case 3");
                return hbounds1.overlaps_shape && hbounds2.overlaps_shape;
            }

            // invariant: at least one hbounds has children

            if hbounds1.overlaps_shape && has_children1 && !has_children2 {
                // println!("case 4");
                for child in hbounds1.children.iter() {
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

            if hbounds2.overlaps_shape && has_children2 && !has_children1 {
                // println!("case 5");
                for child in hbounds2.children.iter() {
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

        let max_level1 = 12;
        let max_level2 = 12;
        let min_size = 1f32;
        let pad1 = 0f32;
        let pad2 = 0f32;

        let transform1 = match hbounds1.transform {
            Some(t) => t,
            None => Matrix::new(),
        };

        let transform2 = match hbounds2.transform {
            Some(t) => t,
            None => Matrix::new(),
        };

        collides_rec_impl(
            hbounds1, hbounds2, transform1, transform2, 1, 1, max_level1, max_level2, min_size,
            pad1, pad2,
        )
    }
}

impl Intersection for HBounds {
    fn intersects(&self, other: &Self) -> bool {
        HBounds::intersects(self, other)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    static BLACK: u32 = 0x000000;
    static WHITE: u32 = 0xffffff;

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
        let hbounds = HBounds::from(img);

        assert_eq!(HBounds::intersects(&hbounds, &hbounds), true);
    }

    #[test]
    fn test_collision_simple_1() {
        let hbounds1 = HBounds::from(ImgData {
            data: &[
                BLACK, WHITE, //
                BLACK, WHITE,
            ],
            width: 2,
            height: 2,
        });
        let hbounds2 = HBounds::from(ImgData {
            data: &[
                BLACK, BLACK, //
                WHITE, WHITE,
            ],
            width: 2,
            height: 2,
        });
        let hbounds3 = HBounds::from(ImgData {
            data: &[
                WHITE, BLACK, //
                WHITE, BLACK,
            ],
            width: 2,
            height: 2,
        });
        let hbounds4 = HBounds::from(ImgData {
            data: &[
                WHITE, WHITE, //
                BLACK, BLACK,
            ],
            width: 2,
            height: 2,
        });

        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2), true);
        assert_eq!(HBounds::intersects(&hbounds2, &hbounds1), true);

        assert_eq!(HBounds::intersects(&hbounds2, &hbounds3), true);
        assert_eq!(HBounds::intersects(&hbounds3, &hbounds2), true);

        assert_eq!(HBounds::intersects(&hbounds3, &hbounds4), true);
        assert_eq!(HBounds::intersects(&hbounds4, &hbounds3), true);

        assert_eq!(HBounds::intersects(&hbounds4, &hbounds1), true);
        assert_eq!(HBounds::intersects(&hbounds1, &hbounds4), true);

        assert_eq!(HBounds::intersects(&hbounds1, &hbounds3), false);
        assert_eq!(HBounds::intersects(&hbounds3, &hbounds1), false);

        assert_eq!(HBounds::intersects(&hbounds2, &hbounds4), false);
        assert_eq!(HBounds::intersects(&hbounds4, &hbounds2), false);
    }

    #[test]
    fn test_collision_translate() {
        let mut hbounds1 = HBounds::from(ImgData {
            data: &[
                WHITE, WHITE, //
                BLACK, WHITE,
            ],
            width: 2,
            height: 2,
        });
        let mut hbounds2 = HBounds::from(ImgData {
            data: &[
                WHITE, BLACK, //
                WHITE, WHITE,
            ],
            width: 2,
            height: 2,
        });
        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2), false);

        hbounds1.transform = None;
        hbounds2.transform = Some(Matrix::new().translate(-1f32, 1f32));
        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2), true);

        hbounds1.transform = Some(Matrix::new().translate(1f32, -1f32));
        hbounds2.transform = None;
        assert_eq!(HBounds::intersects(&hbounds1, &hbounds2), true);
    }
}

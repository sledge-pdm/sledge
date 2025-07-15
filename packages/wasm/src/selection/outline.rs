use wasm_bindgen::prelude::*;

// 座標型
#[derive(Clone, Copy, Debug, PartialEq)]
struct Point {
    x: i32,
    y: i32,
}

// 直線セグメント型
#[derive(Clone, Debug)]
struct Segment {
    p1: Point,
    p2: Point,
}

/// 選択範囲マスクからSVGパス文字列を生成
#[wasm_bindgen]
pub fn mask_to_path(
    mask: &[u8],
    width: u32,
    height: u32,
    offset_x: f32,
    offset_y: f32,
) -> String {
    let w = width as i32;
    let h = height as i32;
    
    // 1. 境界セグメント抽出
    let raw_segments = extract_boundary_segments(mask, w, h);
    
    // 2. セグメントマージ
    let merged_segments = merge_segments(raw_segments);
    
    // 3. ループ構築
    let loops = build_loops(merged_segments);
    
    // 4. SVGパス文字列生成
    let mut path_parts = Vec::new();
    
    for loop_points in loops {
        for (i, pt) in loop_points.iter().enumerate() {
            let x = pt.x as f32 + offset_x;
            let y = pt.y as f32 + offset_y;
            
            if i == 0 {
                path_parts.push(format!("M {} {}", x, y));
            } else {
                path_parts.push(format!("L {} {}", x, y));
            }
        }
        path_parts.push("Z".to_string());
    }
    
    path_parts.join(" ")
}

/// 1. 境界セグメント抽出
fn extract_boundary_segments(mask: &[u8], w: i32, h: i32) -> Vec<Segment> {
    use std::collections::HashMap;
    
    let mut key_set: HashMap<String, Segment> = HashMap::new();
    
    let add_or_remove = |key_set: &mut HashMap<String, Segment>, a: Point, b: Point| {
        // 頂点をソートしてキーを統一
        let (p1, p2) = if a.x < b.x || (a.x == b.x && a.y < b.y) {
            (a, b)
        } else {
            (b, a)
        };
        
        let key = format!("{},{}-{},{}", p1.x, p1.y, p2.x, p2.y);
        
        if key_set.contains_key(&key) {
            key_set.remove(&key); // 重複なら内部→除去
        } else {
            key_set.insert(key, Segment { p1, p2 });
        }
    };
    
    for y in 0..h {
        for x in 0..w {
            let idx = (y * w + x) as usize;
            if idx >= mask.len() || mask[idx] == 0 {
                continue;
            }
            
            // 上辺
            if y == 0 || mask[((y - 1) * w + x) as usize] == 0 {
                add_or_remove(&mut key_set, Point { x, y }, Point { x: x + 1, y });
            }
            // 下辺
            if y == h - 1 || mask[((y + 1) * w + x) as usize] == 0 {
                add_or_remove(&mut key_set, Point { x: x + 1, y: y + 1 }, Point { x, y: y + 1 });
            }
            // 左辺
            if x == 0 || mask[(y * w + x - 1) as usize] == 0 {
                add_or_remove(&mut key_set, Point { x, y: y + 1 }, Point { x, y });
            }
            // 右辺
            if x == w - 1 || mask[(y * w + x + 1) as usize] == 0 {
                add_or_remove(&mut key_set, Point { x: x + 1, y }, Point { x: x + 1, y: y + 1 });
            }
        }
    }
    
    key_set.into_values().collect()
}

/// 2. セグメントマージ
fn merge_segments(segs: Vec<Segment>) -> Vec<Segment> {
    let mut horiz = Vec::new();
    let mut vert = Vec::new();
    
    // 水平・垂直に分類
    for s in segs {
        if s.p1.y == s.p2.y {
            horiz.push(order_horizontal(s));
        } else {
            vert.push(order_vertical(s));
        }
    }
    
    let mut result = Vec::new();
    
    // 水平線をグループ化してマージ
    let mut horiz_groups: std::collections::HashMap<i32, Vec<Segment>> = std::collections::HashMap::new();
    for seg in horiz {
        horiz_groups.entry(seg.p1.y).or_insert_with(Vec::new).push(seg);
    }
    
    for mut group in horiz_groups.into_values() {
        result.extend(merge_line(&mut group, true));
    }
    
    // 垂直線をグループ化してマージ
    let mut vert_groups: std::collections::HashMap<i32, Vec<Segment>> = std::collections::HashMap::new();
    for seg in vert {
        vert_groups.entry(seg.p1.x).or_insert_with(Vec::new).push(seg);
    }
    
    for mut group in vert_groups.into_values() {
        result.extend(merge_line(&mut group, false));
    }
    
    result
}

fn order_horizontal(s: Segment) -> Segment {
    if s.p1.x <= s.p2.x { s } else { Segment { p1: s.p2, p2: s.p1 } }
}

fn order_vertical(s: Segment) -> Segment {
    if s.p1.y <= s.p2.y { s } else { Segment { p1: s.p2, p2: s.p1 } }
}

fn merge_line(list: &mut Vec<Segment>, is_horizontal: bool) -> Vec<Segment> {
    if list.is_empty() {
        return Vec::new();
    }
    
    // ソート
    if is_horizontal {
        list.sort_by(|a, b| a.p1.x.cmp(&b.p1.x));
    } else {
        list.sort_by(|a, b| a.p1.y.cmp(&b.p1.y));
    }
    
    let mut result = Vec::new();
    let mut current = list[0].clone();
    
    for i in 1..list.len() {
        let seg = &list[i];
        
        let can_merge = if is_horizontal {
            current.p2.x >= seg.p1.x
        } else {
            current.p2.y >= seg.p1.y
        };
        
        if can_merge {
            // マージ
            if is_horizontal {
                current.p2.x = current.p2.x.max(seg.p2.x);
            } else {
                current.p2.y = current.p2.y.max(seg.p2.y);
            }
        } else {
            result.push(current);
            current = seg.clone();
        }
    }
    
    result.push(current);
    result
}

/// 3. ループ構築
fn build_loops(segs: Vec<Segment>) -> Vec<Vec<Point>> {
    use std::collections::{HashMap, HashSet};
    
    let mut used = HashSet::new();
    let mut idx_by_pt: HashMap<String, Vec<Segment>> = HashMap::new();
    
    // 頂点→セグメント索引の逆引き
    for seg in &segs {
        for pt in [seg.p1, seg.p2] {
            let key = format!("{},{}", pt.x, pt.y);
            idx_by_pt.entry(key).or_insert_with(Vec::new).push(seg.clone());
        }
    }
    
    let mut loops = Vec::new();
    
    for s0 in &segs {
        let id0 = seg_key(s0.p1, s0.p2);
        if used.contains(&id0) {
            continue;
        }
        
        let mut loop_points = vec![s0.p1, s0.p2];
        used.insert(id0);
        
        let mut prev = s0.p1;
        let mut cur = s0.p2;
        
        // 次々とつながるセグメントを追跡
        loop {
            let cur_key = format!("{},{}", cur.x, cur.y);
            let empty_vec = Vec::new();
            let candidates = idx_by_pt.get(&cur_key).unwrap_or(&empty_vec);
            
            let next = candidates.iter().find(|s| {
                let k = seg_key(s.p1, s.p2);
                !used.contains(&k) && !points_equal(s, prev)
            });
            
            if let Some(next) = next {
                let next_key = seg_key(next.p1, next.p2);
                used.insert(next_key);
                
                let next_pt = if next.p1.x == cur.x && next.p1.y == cur.y {
                    next.p2
                } else {
                    next.p1
                };
                
                loop_points.push(next_pt);
                prev = cur;
                cur = next_pt;
                
                // ループ完成チェック
                if cur.x == loop_points[0].x && cur.y == loop_points[0].y {
                    break;
                }
            } else {
                break;
            }
        }
        
        loops.push(loop_points);
    }
    
    loops
}

fn seg_key(a: Point, b: Point) -> String {
    format!("{},{}-{},{}", a.x, a.y, b.x, b.y)
}

fn points_equal(s: &Segment, pt: Point) -> bool {
    (s.p1.x == pt.x && s.p1.y == pt.y) || (s.p2.x == pt.x && s.p2.y == pt.y)
}

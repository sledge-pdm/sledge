use super::parser::{parse_pipeline, PipelineNode};
use crate::commands::{brightness, grayscale, invert, jpeg_glitch, sepia};
use crate::commands::{decode_image_base64, encode_image_base64};

#[tauri::command]
pub fn run_pipeline(
    dsl: String,
    encoded: String,
    width: usize,
    height: usize,
) -> Result<String, String> {
    // DSL文字列をパースしてASTにする
    let nodes = parse_pipeline(&dsl)?;

    // 画像をデコードしてRGBAのバッファを作る
    let mut buffer = decode_image_base64(&encoded)?;

    // パイプラインノードを順に処理
    for node in nodes {
        match node {
            PipelineNode::Command { name, args } => {
                // matchで対応コマンドを呼び分け（必要なら引数あり）
                buffer = match name.as_str() {
                    "grayscale" => {
                        let encoded = encode_image_base64(&buffer)?;
                        decode_image_base64(&grayscale(encoded, width, height)?)?
                    }
                    "jpeg_glitch" => {
                        if args.len() < 2 {
                            return Err("jpeg_glitch requires 2 arguments: seed, quality".into());
                        }
                        let seed = args[0].parse().map_err(|_| "Invalid seed")?;
                        let quality = args[1].parse().map_err(|_| "Invalid quality")?;
                        let amount = args[2].parse().map_err(|_| "Invalid amount")?;
                        let encoded = encode_image_base64(&buffer)?;
                        decode_image_base64(&jpeg_glitch(
                            encoded, width, height, seed, quality, amount,
                        )?)?
                    }

                    "invert" => {
                        let encoded = encode_image_base64(&buffer)?;
                        decode_image_base64(&invert(encoded, width, height)?)?
                    }
                    "sepia" => {
                        let encoded = encode_image_base64(&buffer)?;
                        decode_image_base64(&sepia(encoded, width, height)?)?
                    }
                    "brightness" => {
                        if args.len() != 1 {
                            return Err("brightness requires 1 argument".to_string());
                        }
                        let delta: i8 = args[0]
                            .parse()
                            .map_err(|_| "Invalid number for brightness".to_string())?;
                        let encoded = encode_image_base64(&buffer)?;
                        decode_image_base64(&brightness(encoded, width, height, delta)?)?
                    }
                    _ => return Err(format!("Unknown command: {name}")),
                };
            }

            PipelineNode::Output { target: _ } => {
                // 今のところ *out(layerX) は文字列だけ保持 → JSに返すだけ
                // ここで base64 して return
                return encode_image_base64(&buffer);
            }
        }
    }

    Err("No *out(...) specified in pipeline.".to_string())
}

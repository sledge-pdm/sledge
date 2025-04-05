#[derive(Debug)]
pub enum PipelineNode {
    // コマンド（名前と引数）
    Command { name: String, args: Vec<String> },
    // 出力指定ノード（*out(layerX) 形式）
    Output { target: String },
}

/// パイプライン文字列をパースし、PipelineNodeのベクタを返す
pub fn parse_pipeline(input: &str) -> Result<Vec<PipelineNode>, String> {
    input
        .split('>')
        .map(|part| {
            let trimmed = part.trim();

            // 出力指定ノード：*out(layerX)
            if let Some(captures) = trimmed
                .strip_prefix("*out(")
                .and_then(|s| s.strip_suffix(")"))
            {
                Ok(PipelineNode::Output {
                    target: captures.to_string(),
                })
            }
            // コマンド＋引数：command(arg1,arg2)
            else if let Some(idx) = trimmed.find('(') {
                if trimmed.ends_with(')') {
                    let name = &trimmed[..idx];
                    let args_str = &trimmed[idx + 1..trimmed.len() - 1];
                    let args = args_str.split(',').map(|s| s.trim().to_string()).collect();
                    Ok(PipelineNode::Command {
                        name: name.to_string(),
                        args,
                    })
                } else {
                    Err(format!("Malformed command: {trimmed}"))
                }
            }
            // 引数なしの単純なコマンド
            else {
                Ok(PipelineNode::Command {
                    name: trimmed.to_string(),
                    args: vec![],
                })
            }
        })
        .collect()
}

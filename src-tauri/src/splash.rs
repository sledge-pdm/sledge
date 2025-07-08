use eframe::egui;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Instant;
#[cfg(target_os = "windows")]
use winit::platform::windows::EventLoopBuilderExtWindows;

pub struct SplashScreen {
    start_time: Instant,
    should_close: Arc<AtomicBool>,
}

impl SplashScreen {
    pub fn new(should_close: Arc<AtomicBool>) -> Self {
        Self {
            start_time: Instant::now(),
            should_close,
        }
    }
}

impl eframe::App for SplashScreen {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        // 閉じる指示があれば終了
        if self.should_close.load(Ordering::Relaxed) {
            ctx.send_viewport_cmd(egui::ViewportCommand::Close);
            return;
        }

        // 背景色設定
        let dark_bg = egui::Color32::from_rgb(26, 26, 26);

        egui::CentralPanel::default()
            .frame(egui::Frame::none().fill(dark_bg))
            .show(ctx, |ui| {
                ui.with_layout(egui::Layout::top_down(egui::Align::Center), |ui| {
                    ui.add_space(60.0);

                    // ロゴ（カスタムフォント使用、フォールバック付き）
                    let logo_text = egui::RichText::new("sledge")
                        .size(32.0)
                        .color(egui::Color32::WHITE);

                    // カスタムフォントが利用可能かチェック
                    let logo_text = if ctx.fonts(|f| {
                        f.families()
                            .contains(&egui::FontFamily::Name("04B_08".into()))
                    }) {
                        logo_text.family(egui::FontFamily::Name("04B_08".into()))
                    } else {
                        logo_text.family(egui::FontFamily::Monospace) // フォールバック
                    };

                    ui.label(logo_text);

                    ui.add_space(15.0);

                    // シンプルなローディングテキスト
                    let elapsed = self.start_time.elapsed().as_secs_f32();
                    let dots = ".".repeat(((elapsed * 2.0) as usize % 4) + 1);

                    ui.label(
                        egui::RichText::new(format!("Loading{}", dots))
                            .size(12.0)
                            .color(egui::Color32::from_gray(180)),
                    );
                });
            });

        // アニメーション用に再描画を要求
        ctx.request_repaint();
    }
}

fn setup_custom_fonts(ctx: &egui::Context) {
    let mut fonts = egui::FontDefinitions::default();

    // 04B_08フォントを読み込み
    // 開発環境とリリース環境の両方に対応
    let font_paths = vec![
        // 開発環境用
        "src-tauri/resources/fonts/04B_08__.ttf",
        "./resources/fonts/04B_08__.ttf",
        "../resources/fonts/04B_08__.ttf",
        // リリース環境用（実行ファイルと同じディレクトリ）
    ];

    // 実行ファイルからの相対パスも試す
    let exe_relative_path = std::env::current_exe().ok().and_then(|exe| {
        exe.parent()
            .map(|p| p.join("resources").join("fonts").join("04B_08__.ttf"))
    });

    let mut font_loaded = false;

    // 各パスを順番に試す
    for path_str in font_paths {
        if let Ok(font_data) = std::fs::read(path_str) {
            fonts
                .font_data
                .insert("04B_08".to_owned(), egui::FontData::from_owned(font_data));

            // フォントファミリーに追加
            fonts.families.insert(
                egui::FontFamily::Name("04B_08".into()),
                vec!["04B_08".to_owned()],
            );

            ctx.set_fonts(fonts.clone());
            println!("💫 [PERF] Custom font 04B_08 loaded from {}", path_str);
            font_loaded = true;
            break;
        }
    }

    // 実行ファイル相対パスも試す
    if !font_loaded {
        if let Some(path) = exe_relative_path {
            if let Ok(font_data) = std::fs::read(&path) {
                fonts
                    .font_data
                    .insert("04B_08".to_owned(), egui::FontData::from_owned(font_data));

                fonts.families.insert(
                    egui::FontFamily::Name("04B_08".into()),
                    vec!["04B_08".to_owned()],
                );

                ctx.set_fonts(fonts);
                println!("💫 [PERF] Custom font 04B_08 loaded from {:?}", path);
                font_loaded = true;
            }
        }
    }

    if !font_loaded {
        println!("⚠️ [PERF] Failed to load custom font, using default");
    }
}

pub fn show_splash_screen() -> Arc<AtomicBool> {
    let should_close = Arc::new(AtomicBool::new(false));
    let should_close_clone = should_close.clone();

    std::thread::spawn(move || {
        use eframe::egui::ViewportBuilder;

        // Windowsで任意のスレッドからイベントループを作成
        #[cfg(target_os = "windows")]
        let event_loop_builder: Option<
            Box<dyn for<'a> FnOnce(&'a mut winit::event_loop::EventLoopBuilder<eframe::UserEvent>)>,
        > = Some(Box::new(|builder| {
            builder.with_any_thread(true);
        }));

        let options = eframe::NativeOptions {
            viewport: ViewportBuilder::default()
                .with_inner_size([280.0, 160.0])
                .with_decorations(false)
                .with_always_on_top()
                .with_resizable(false),
            event_loop_builder,
            centered: true,
            ..Default::default()
        };

        println!("💫 [PERF] Native splash screen starting");

        let _ = eframe::run_native(
            "Loading Sledge",
            options,
            Box::new(|cc| {
                // カスタムフォントを読み込み
                setup_custom_fonts(&cc.egui_ctx);
                Ok(Box::new(SplashScreen::new(should_close_clone)))
            }),
        );

        println!("💫 [PERF] Native splash screen closed");
    });

    should_close
}

pub fn close_splash_screen(closer: Arc<AtomicBool>) {
    closer.store(true, Ordering::Relaxed);
    println!("💫 [PERF] Splash screen close signal sent");
}

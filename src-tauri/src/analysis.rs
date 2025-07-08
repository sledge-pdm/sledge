
use serde::Serialize;
use sysinfo::{ProcessesToUpdate, System, get_current_pid};

#[derive(Serialize)]
pub struct ProcessMem {
    /// 本体プロセス＋子プロセスの合計 RSS（バイト）
    total_bytes: u64,
    /// 本体だけ
    main_bytes: u64,
    /// 子プロセス（レンダラー等）だけ
    children_bytes: u64,
}

#[tauri::command]
pub fn get_process_memory() -> ProcessMem {
    let pid = get_current_pid().unwrap();
    let mut sys = System::new_all();
    sys.refresh_processes(ProcessesToUpdate::All, false);

    let mut main = 0;
    let mut children = 0;
    for proc in sys.processes().values() {
        if proc.pid() == pid {
            main = proc.memory();
        } else {
            // 直上の親が自分なら子
            let mut parent = proc.parent();
            while let Some(p) = parent {
                if p == pid {
                    children += proc.memory();
                    break;
                }
                parent = sys.process(p).and_then(|pp| pp.parent());
            }
        }
    }

    ProcessMem {
        total_bytes: main + children,
        main_bytes: main,
        children_bytes: children,
    }
}
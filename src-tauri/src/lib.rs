use tauri::{Builder, Manager};

use tauri_plugin_deep_link::DeepLinkExt;
use tauri_plugin_store::StoreExt;

mod commands;


/*
pub struct AppState {
  theme: String
}
*/

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  Builder::default()
    .invoke_handler(tauri::generate_handler![
      //commands::get_theme
    ])
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_store::Builder::new().build())
    .setup(|app| {
      _ = app.store_builder("storage.json")
        .default("theme".to_string(), "mint")
        .build()?;

      #[cfg(any(windows, target_os = "linux"))]
      { app.deep_link().register_all()?; }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

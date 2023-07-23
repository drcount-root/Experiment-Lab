use std::fs;
use std::path::{ Path, PathBuf };

fn organize_files_by_type(folder_path: &Path) {
    let audio_folder = folder_path.join("audio");
    let video_folder = folder_path.join("video");
    let other_folder = folder_path.join("other");

    for entry in fs::read_dir(folder_path).unwrap() {
        if let Ok(entry) = entry {
            let file_path = entry.path();
            if file_path.is_file() {
                let extension = file_path
                    .extension()
                    .and_then(|ext| ext.to_str())
                    .unwrap_or("");
                match extension.to_lowercase().as_str() {
                    "mp3" | "wav" | "ogg" | "flac" => move_to_folder(&file_path, &audio_folder),
                    "mp4" | "avi" | "mkv" | "mov" => move_to_folder(&file_path, &video_folder),
                    _ => move_to_folder(&file_path, &other_folder),
                }
            }
        }
    }
}

fn move_to_folder(file_path: &Path, destination_folder: &Path) {
    if !destination_folder.exists() {
        fs::create_dir_all(destination_folder).unwrap();
    }
    println!("Moving {:?} to {:?}", file_path, destination_folder);
    let new_file_path = destination_folder.join(file_path.file_name().unwrap());
    fs::rename(file_path, &new_file_path).unwrap();
}

fn main() {
    let folder_path = std::env::args().nth(1).expect("Please provide the folder path.");
    let folder_path = PathBuf::from(folder_path);
    organize_files_by_type(&folder_path);
    println!("Files organized successfully!");
}

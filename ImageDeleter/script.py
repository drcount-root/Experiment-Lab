import os

def delete_image_files(folder_path):
    # Iterate through all files in the folder
    for root, dirs, files in os.walk(folder_path):
        for file in files:
            if file.endswith(".png") or file.endswith(".jpg"):
                # Construct the absolute path to the file
                file_path = os.path.join(root, file)
                try:
                    # Delete the file
                    os.remove(file_path)
                    print(f"Deleted file: {file_path}")
                except OSError as e:
                    print(f"Error deleting file: {file_path} - {e}")

# Provide the folder path
folder_path = "./TestFolder/"
delete_image_files(folder_path)

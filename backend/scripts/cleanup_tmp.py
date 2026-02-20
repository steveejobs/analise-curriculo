import os
import shutil

TMP_DIR = '../.tmp'

def cleanup():
    if os.path.exists(TMP_DIR):
        print(f"Cleaning up {TMP_DIR}...")
        for filename in os.listdir(TMP_DIR):
            file_path = os.path.join(TMP_DIR, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f'Failed to delete {file_path}. Reason: {e}')
        print("Cleanup complete.")
    else:
        print("Temp directory does not exist.")

if __name__ == "__main__":
    cleanup()

import requests
import cv2
import numpy as np
import os
import time

# Create a dummy video
def create_dummy_video(filename="test_video.mp4", duration_sec=2, fps=10):
    height, width = 480, 640
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(filename, fourcc, fps, (width, height))
    
    for i in range(duration_sec * fps):
        # Create a frame with some text
        frame = np.zeros((height, width, 3), dtype=np.uint8)
        cv2.putText(frame, "Sponsored Content", (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.putText(frame, "Fitness Challenge", (50, 300), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        out.write(frame)
        
    out.release()
    return filename

def test_backend():
    video_file = create_dummy_video()
    url = "http://localhost:8000/api/scan/upload"
    
    print(f"Uploading {video_file} to {url}...")
    
    try:
        with open(video_file, 'rb') as f:
            files = {'file': f}
            data = {'userId': 'test-user', 'platform': 'tiktok'}
            response = requests.post(url, files=files, data=data)
            
        if response.status_code == 200:
            print("Success!")
            print(response.json())
        else:
            print(f"Failed with status {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if os.path.exists(video_file):
            os.remove(video_file)

if __name__ == "__main__":
    # Wait for user to start server manually or assume it's running?
    # For this script, we assume the server is running.
    test_backend()

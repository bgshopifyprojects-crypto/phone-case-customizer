import cv2
import numpy as np
import sys
import base64
import requests
from io import BytesIO

def generate_frame(image_url):
    """Generate frame from phone case image with camera detection"""
    
    # Download image
    response = requests.get(image_url)
    image_array = np.asarray(bytearray(response.content), dtype=np.uint8)
    img = cv2.imdecode(image_array, cv2.IMREAD_UNCHANGED)
    
    # Add alpha channel if missing
    if len(img.shape) == 2 or img.shape[2] == 3:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
    
    h, w = img.shape[:2]
    
    # Convert to grayscale and blur to reduce noise
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (9, 9), 0)
    
    # Inverse threshold to highlight dark/colored regions
    _, thresh = cv2.threshold(blur, 60, 255, cv2.THRESH_BINARY_INV)
    
    # Find contours
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    # Collect camera candidate regions
    camera_regions = []
    for c in contours:
        area = cv2.contourArea(c)
        # Ignore tiny noise
        if area < 200:
            continue
        
        x, y, cw, ch = cv2.boundingRect(c)
        
        # Heuristic: usually camera modules are in upper part of phone
        # and are not extremely large full-frame shapes.
        if y < h * 0.4 and cw < w * 0.5 and ch < h * 0.5:
            camera_regions.append((x, y, cw, ch))
    
    # If no camera regions are found, return empty frame
    if not camera_regions:
        print("No camera region detected!", file=sys.stderr)
        # Return transparent image
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
    else:
        # Create final image with transparent background
        rgba = np.zeros((h, w, 4), dtype=np.uint8)
        for (x, y, cw, ch) in camera_regions:
            # Copy just the camera bounding box from original
            camera_roi = img[y:y+ch, x:x+cw]
            rgba[y:y+ch, x:x+cw] = camera_roi
    
    # Encode to PNG
    _, buffer = cv2.imencode('.png', rgba)
    
    # Convert to base64
    base64_frame = base64.b64encode(buffer).decode('utf-8')
    
    return base64_frame

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: Image URL required", file=sys.stderr)
        sys.exit(1)
    
    image_url = sys.argv[1]
    
    try:
        frame_base64 = generate_frame(image_url)
        print(frame_base64)  # Output to stdout
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

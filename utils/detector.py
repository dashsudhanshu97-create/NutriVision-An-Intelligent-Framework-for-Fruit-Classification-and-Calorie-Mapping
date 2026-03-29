from ultralytics import YOLO
from collections import Counter

# load model once
model = YOLO("yolov8n.pt")

def detect_fruits(image):
    results = model(image, conf=0.4)

    if len(results[0].boxes) == 0:
        return {}

    labels = results[0].boxes.cls.tolist()
    names = model.names

    detected = [names[int(i)] for i in labels]
    return Counter(detected)
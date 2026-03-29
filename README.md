🍎 NutriVision: AI-Powered Fruit & Calorie Detection
NutriVision is an intelligent Computer Vision application that identifies fruits and estimates their caloric content in real-time. By leveraging the YOLO object detection framework and a Flask backend, the system provides high-speed recognition and mapping to nutritional data through a seamless, modern web interface.
---
🚀 Quick Start: Installation & Setup
Follow these steps to get the project running on your local machine.

1. Clone the Repository
Bash
git clone https://github.com/yourusername/NutriVision.git
cd NutriVision
2. Set Up a Virtual Environment
Windows:

Bash
python -m venv venv
.\venv\Scripts\activate
Ubuntu/Linux:

Bash
sudo apt update && sudo apt install python3-venv libgl1 -y
python3 -m venv venv
source venv/bin/activate
3. Install Dependencies
Bash
pip install -r requirements.txt
4. Run the Application
Bash
python app.py
Once running, open your browser and navigate to: http://127.0.0.1:5000

🛠️ Project Structure
To ensure the code runs correctly, maintain the following directory layout:

Plaintext
NutriVision/
├── app.py              # Main Flask server
├── requirements.txt    # Library dependencies
├── utils/
│   ├── __init__.py     # Makes utils a Python package
│   ├── detector.py     # YOLO detection logic
│   └── calorie.py      # Calorie calculation mapping
├── templates/
│   └── index.html      # Frontend UI
└── static/             # CSS, JS, and Images
🧪 Tech Stack
AI Engine: YOLOv8 (Ultralytics) for object detection.

Backend: Flask (Python) for API handling.

Frontend: Tailwind CSS & Vanilla JavaScript.

Imaging: OpenCV & Pillow (PIL).

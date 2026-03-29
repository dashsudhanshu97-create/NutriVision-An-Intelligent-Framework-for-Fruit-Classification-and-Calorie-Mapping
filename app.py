from flask import Flask, render_template, request, jsonify
from PIL import Image
import io

# Importing your custom logic!
from utils.detector import detect_fruits
from utils.calorie import calculate_calories

app = Flask(__name__)

# --- Route 1: Serve your custom HTML UI ---
@app.route('/')
def home():
    return render_template('index.html')

# --- Route 2: The API for your JavaScript ---
@app.route('/api/analyze', methods=['POST'])
def run_analysis():
    # 1. Grab the image sent by JavaScript
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image uploaded"}), 400
        
    file = request.files['image']
    
    # 2. Open the image just like you did in Streamlit
    img_bytes = file.read()
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    
    # 3. RUN YOUR LOGIC
    count = detect_fruits(image)
    
    if not count:
        return jsonify({"status": "error", "message": "No fruits detected ❌"}), 200
        
    total_calories, details = calculate_calories(count)
    
    # Calculate the total number of items found
    total_items = sum(count.values())
    
    # Create a string of the fruit names found (e.g., "Apple, Banana")
    fruit_names = ", ".join(count.keys())
    
    # 4. Send the exact data back to your JavaScript
    response_data = {
        "status": "success",
        "fruit": fruit_names,
        "items_detected": total_items,
        "total_calories": total_calories,
        "freshness_score": 94, # Placeholder if you don't have a freshness model yet
        "details": details # Sending the breakdown just in case you want to display it later!
    }

    return jsonify(response_data)

if __name__ == '__main__':
    # Start the Flask server
    app.run(debug=True, port=5000)
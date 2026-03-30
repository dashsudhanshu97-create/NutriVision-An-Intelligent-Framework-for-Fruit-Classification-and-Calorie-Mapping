import io
import logging
from flask import Flask, render_template, request, jsonify
from celery import Celery, Task
from PIL import Image

# Importing your custom logic
from utils.detector import detect_fruits
from utils.calorie import calculate_calories

app = Flask(__name__)

# --- 1. Celery Configuration ---
app.config.update(
    CELERY_BROKER_URL='redis://localhost:6379/0',
    CELERY_RESULT_BACKEND='redis://localhost:6379/0',
    CELERY_TASK_SERIALIZER='pickle',  # Allowing bytes to be passed easily
    CELERY_ACCEPT_CONTENT=['pickle', 'json']
)

# --- 2. Custom Task Class for Flask Context ---
class FlaskTask(Task):
    """
    Ensures that the Celery worker runs within the Flask application context.
    This prevents 'RuntimeError: Working outside of application context'.
    """
    def __call__(self, *args, **kwargs):
        with app.app_context():
            return self.run(*args, **kwargs)

# Initialize Celery with the custom base class
celery = Celery(app.name, task_cls=FlaskTask, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)
celery.config_from_object(app.config, namespace='CELERY')


# --- 3. The Background Task ---
@celery.task(bind=True, base=FlaskTask)
def process_fruit_analysis(self, img_bytes):
    try:
        # Convert bytes back to Image
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        
        # Run detection logic
        count = detect_fruits(image)
        
        if not count:
            return {"status": "error", "message": "No fruits detected ❌"}
            
        total_calories, details = calculate_calories(count)
        total_items = sum(count.values())
        fruit_names = ", ".join(count.keys())
        
        # Return a structured dictionary for the frontend
        return {
            "status": "success",
            "fruit": fruit_names,
            "items_detected": total_items,
            "total_calories": total_calories,
            "freshness_score": 94,
            "details": details
        }
    except Exception as e:
        logging.error(f"Task Failed: {str(e)}")
        # Returning a structured error prevents 'undefined' on JS side
        return {"status": "error", "message": "An internal error occurred during analysis."}


# --- 4. Routes ---

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def run_analysis():
    if 'image' not in request.files:
        return jsonify({"status": "error", "message": "No image uploaded"}), 400
        
    file = request.files['image']
    img_bytes = file.read()
    
    # Trigger the background task
    task = process_fruit_analysis.apply_async(args=[img_bytes])
    
    # Return the Task ID immediately
    return jsonify({"status": "pending", "task_id": task.id}), 202

@app.route('/api/status/<task_id>')
def get_status(task_id):
    task = process_fruit_analysis.AsyncResult(task_id)
    
    if task.state == 'PENDING':
        response = {"state": "PENDING", "result": None}
    elif task.state == 'SUCCESS':
        response = {"state": "SUCCESS", "result": task.result}
    else:
        # Handles FAILURE or other states
        response = {"state": task.state, "result": {"status": "error", "message": str(task.info)}}
        
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
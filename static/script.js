// Wait for the page to fully load
document.addEventListener("DOMContentLoaded", () => {
  // Select elements
  const analyzeBtn = document.getElementById("analyze-btn");
  const fileInput = document.getElementById("imageUpload");

  const resultName = document.getElementById("result-name");
  const resultFreshness = document.getElementById("result-freshness");
  const resultCount = document.getElementById("result-count");
  const resultCalories = document.getElementById("result-calories");
  const fruitImg = document.getElementById("result-fruit-image");
  const resultCard = document.getElementById("result-card");
  const fruitButtons = document.querySelectorAll("#fruit-options button");

  const imageUpload = document.getElementById("imageUpload");
  const dropZone = document.getElementById("dropZone");
  const progressState = document.getElementById("progressState");
  const progressBar = document.getElementById("progressBar");
  const previewState = document.getElementById("previewState");
  const imagePreview = document.getElementById("imagePreview");
  const removeImage = document.getElementById("removeImage");

  imageUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = function (event) {
        dropZone.classList.add("hidden");
        progressState.classList.remove("hidden");

        let width = 0;
        const interval = setInterval(() => {
          width += 5;
          progressBar.style.width = width + "%";

          if (width >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              imagePreview.src = event.target.result;
              progressState.classList.add("hidden");
              previewState.classList.remove("hidden");
              progressBar.style.width = "0%";
            }, 400);
          }
        }, 50);
      };
      reader.readAsDataURL(file);
    }
  });

  removeImage.addEventListener("click", () => {
    imageUpload.value = "";
    previewState.classList.add("hidden");
    dropZone.classList.remove("hidden");
    // Hide result card on reset
    resultCard.classList.add("opacity-0", "scale-95", "translate-y-4", "pointer-events-none");
  });

  fruitButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      fruitButtons.forEach((otherBtn) => {
        otherBtn.classList.remove("bg-primary", "text-on-primary", "shadow-lg", "scale-105");
        otherBtn.classList.add("bg-surface-container-highest", "hover:bg-secondary-container");
      });

      this.classList.remove("bg-surface-container-highest", "hover:bg-secondary-container");
      this.classList.add("bg-primary", "text-on-primary", "shadow-lg", "scale-105");

      const selectedFruit = this.querySelector("span:last-child").innerText;
      console.log("Active selection:", selectedFruit);
    });
  });

  async function getFruitImage(fruitName) {
    const accessKey = "9xZO9jFcHI5e2KtqDTz4AYDkeG5L6qIMHB5ZtgkeQz4";
    try {
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${fruitName} fruit&client_id=${accessKey}`);
      const data = await res.json();
      return (data.results && data.results.length > 0) ? data.results[0].urls.small : `https://source.unsplash.com/400x400/?${fruitName},fruit`;
    } catch (err) {
      console.error("Image API error:", err);
      return `https://source.unsplash.com/400x400/?fruit`;
    }
  }

  async function compressImage(file, options = {}) {
    const { maxWidth = 800, quality = 0.7 } = options;
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target.result; };
      reader.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = height * (maxWidth / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error("Compression failed")); return; }
          resolve(blob);
        }, "image/jpeg", quality);
      };
      img.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // --- NEW: Polling Logic for Celery ---
  async function pollTaskStatus(taskId, originalButtonText) {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/status/${taskId}`);
        const data = await response.json();

        if (data.state === 'SUCCESS') {
          clearInterval(interval);
          handleAnalysisSuccess(data.result, originalButtonText);
        } else if (data.state === 'FAILURE' || (data.result && data.result.status === 'error')) {
          clearInterval(interval);
          alert("Error: " + (data.result?.message || "Task failed"));
          resetButton(originalButtonText);
        }
        // If PENDING, do nothing and wait for next interval
      } catch (err) {
        clearInterval(interval);
        console.error("Polling error:", err);
        resetButton(originalButtonText);
      }
    }, 1500); // Poll every 1.5s
  }

  async function handleAnalysisSuccess(data, originalButtonText) {
    if (data.status === "success") {
      resultName.innerText = data.fruit;
      resultFreshness.innerText = data.freshness_score + "% Fresh";
      resultCalories.innerText = data.total_calories + " kcal";
      resultCount.innerText = data.items_detected === 1 ? "1 Unit" : data.items_detected + " Units";

      fruitImg.classList.add("opacity-50", "scale-95");
      const fruitName = data.fruit.split(',')[0].trim().toLowerCase(); // Handle multiple fruits
      const imageUrl = await getFruitImage(fruitName);
      
      fruitImg.src = imageUrl;
      fruitImg.onload = () => {
        fruitImg.classList.remove("opacity-50", "scale-95");
        fruitImg.classList.add("opacity-100", "scale-100");
      };

      resultCard.classList.remove("opacity-0", "scale-95", "translate-y-4", "pointer-events-none");
      resultCard.classList.add("opacity-100", "scale-100", "translate-y-0");
    } else {
      alert("Error: " + data.message);
    }
    resetButton(originalButtonText);
  }

  function resetButton(originalText) {
    analyzeBtn.innerHTML = originalText;
    analyzeBtn.disabled = false;
    analyzeBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }

  // Analyze Button click
  analyzeBtn.addEventListener("click", async () => {
    if (fileInput.files.length === 0) {
      alert("Please select a fruit image first!");
      return;
    }

    analyzeBtn.disabled = true;
    analyzeBtn.classList.add("opacity-50", "cursor-not-allowed");
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = "Processing...";

    try {
      const originalFile = fileInput.files[0];
      const compressedBlob = await compressImage(originalFile, { maxWidth: 800, quality: 0.7 });

      const formData = new FormData();
      formData.append("image", compressedBlob, "image.jpg");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "pending" || data.task_id) {
        analyzeBtn.innerHTML = "Analyzing in Cloud...";
        pollTaskStatus(data.task_id, originalText);
      } else {
        throw new Error(data.message || "Failed to start task");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to connect to the neural engine.");
      resetButton(originalText);
    }
  });
});
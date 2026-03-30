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
  // 1. Target all buttons inside your specific ID
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
        // 1. Hide Upload Box, Show Progress
        dropZone.classList.add("hidden");
        progressState.classList.remove("hidden");

        // 2. Animate Progress Bar
        let width = 0;
        const interval = setInterval(() => {
          width += 5;
          progressBar.style.width = width + "%";

          if (width >= 100) {
            clearInterval(interval);

            // 3. Show Preview after short delay
            setTimeout(() => {
              imagePreview.src = event.target.result;
              progressState.classList.add("hidden");
              previewState.classList.remove("hidden");
              progressBar.style.width = "0%"; // Reset for next time
            }, 400);
          }
        }, 50); // Speed of the loading bar
      };

      reader.readAsDataURL(file);
    }
  });

  // Remove Image Logic
  removeImage.addEventListener("click", () => {
    imageUpload.value = ""; // Clear input
    previewState.classList.add("hidden");
    dropZone.classList.remove("hidden");
  });

  fruitButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      // 2. THE RESET: Remove 'Active' styles from all buttons
      fruitButtons.forEach((otherBtn) => {
        // Remove the Primary (Active) colors
        otherBtn.classList.remove(
          "bg-primary",
          "text-on-primary",
          "shadow-lg",
          "scale-105",
        );

        // Add back the Default (Inactive) colors
        otherBtn.classList.add(
          "bg-surface-container-highest",
          "hover:bg-secondary-container",
        );
      });

      // 3. THE UPDATE: Add 'Active' styles to the clicked button
      this.classList.remove(
        "bg-surface-container-highest",
        "hover:bg-secondary-container",
      );
      this.classList.add(
        "bg-primary",
        "text-on-primary",
        "shadow-lg",
        "scale-105",
      );

      // 4. Get the text for your Unsplash search
      const selectedFruit = this.querySelector("span:last-child").innerText;
      console.log("Active selection:", selectedFruit);
    });
  });

  // 🔥 Helper: Get fruit image from Unsplash API
  async function getFruitImage(fruitName) {
    const accessKey = "9xZO9jFcHI5e2KtqDTz4AYDkeG5L6qIMHB5ZtgkeQz4"; // 🔑 replace this

    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${fruitName} fruit&client_id=${accessKey}`,
      );

      const data = await res.json();

      if (data.results && data.results.length > 0) {
        return data.results[0].urls.small;
      } else {
        // fallback
        return `https://source.unsplash.com/400x400/?${fruitName},fruit`;
      }
    } catch (err) {
      console.error("Image API error:", err);
      return `https://source.unsplash.com/400x400/?fruit`;
    }
  }

  // Button click
  analyzeBtn.addEventListener("click", async () => {
    
    if (fileInput.files.length === 0) {
      alert("Please select a fruit image first!");
      return;
    }
    // let freeze the button ohk
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add("opacity-50", "cursor-not-allowed"); // Optional: visual feedback


    // Loading state
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.innerHTML = "Scanning with AI...";

    const formData = new FormData();
    formData.append("image", fileInput.files[0]);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "success") {
        // ✅ Update text UI
        resultName.innerText = data.fruit;
        resultFreshness.innerText = data.freshness_score + "% Fresh";
        resultCalories.innerText = data.total_calories + " kcal";

        resultCount.innerText =
          data.items_detected === 1 ? "1 Unit" : data.items_detected + " Units";

        // 🔥 Image loading animation
        fruitImg.classList.add("opacity-50", "scale-95");

        const fruitName = data.fruit.toLowerCase();

        // 🔥 Get image from API
        const imageUrl = await getFruitImage(fruitName);
        fruitImg.src = imageUrl;

        // Fallback if image fails
        fruitImg.onerror = () => {
          fruitImg.src = "https://source.unsplash.com/400x400/?fruit";
        };

        // Smooth reveal
        fruitImg.onload = () => {
          fruitImg.classList.remove("opacity-50", "scale-95");
          fruitImg.classList.add("opacity-100", "scale-100");
        };

        // 🔥 Show result card animation
        resultCard.classList.remove(
          "opacity-0",
          "scale-95",
          "translate-y-4",
          "pointer-events-none",
        );

        resultCard.classList.add("opacity-100", "scale-100", "translate-y-0");
      } else {
        alert("Error from AI: " + data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to connect to the neural engine.");
    } finally {
      analyzeBtn.innerHTML = originalText;
      analyzeBtn.disabled = false;
    analyzeBtn.classList.remove("opacity-50", "cursor-not-allowed"); // Optional: visual feedback
    }
  });
});

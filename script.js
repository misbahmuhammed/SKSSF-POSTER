// --- This is the new, clean script.js ---

// Wait for the entire page to load
window.onload = () => {

    // Get all the HTML elements
    const generateBtn = document.getElementById("generateBtn");
    const imageUpload = document.getElementById("imageUpload");
    const fileNameEl = document.getElementById("fileName");
    const fileInputLabel = document.getElementById("fileInputLabel");
    const firstNameEl = document.getElementById("firstName");
    const lastNameEl = document.getElementById("lastName");
    const canvas = document.getElementById("posterCanvas");
    const ctx = canvas.getContext("2d");
    const outputArea = document.getElementById("outputArea");
    const previewImg = document.getElementById("posterPreview");
    const downloadBtn = document.getElementById("downloadBtn");

    let cropper = null;
    let croppedImage = null;

    // Update the file input text when a file is selected and show crop modal
    imageUpload.addEventListener("change", (e) => {
        if (imageUpload.files.length > 0) {
            const file = imageUpload.files[0];
            const name = file.name;
            fileNameEl.textContent = name;
            fileInputLabel.classList.add("file-selected");
            
            // Show crop modal
            const reader = new FileReader();
            reader.onload = (event) => {
                const cropImage = document.getElementById('cropImage');
                cropImage.src = event.target.result;
                
                // Initialize cropper
                if (cropper) {
                    cropper.destroy();
                }
                cropper = new Cropper(cropImage, {
                    aspectRatio: 3/4,
                    viewMode: 1,
                    dragMode: 'move',
                    autoCropArea: 1,
                    restore: false,
                    guides: true,
                    center: true,
                    highlight: false,
                    cropBoxMovable: true,
                    cropBoxResizable: true,
                    toggleDragModeOnDblclick: false,
                });
                
                document.getElementById('cropModal').classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            fileNameEl.textContent = "";
            fileInputLabel.classList.remove("file-selected");
        }
    });

    // Crop modal handlers
    function resetCropper() {
        document.getElementById('cropModal').classList.add('hidden');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        // Reset the file input completely
        imageUpload.value = '';
        fileNameEl.textContent = '';
        fileInputLabel.classList.remove('file-selected');
    }

    document.getElementById('closeCropModal').addEventListener('click', resetCropper);
    document.getElementById('cancelCrop').addEventListener('click', resetCropper);

    document.getElementById('applyCrop').addEventListener('click', () => {
        if (cropper) {
            croppedImage = cropper.getCroppedCanvas().toDataURL();
            document.getElementById('cropModal').classList.add('hidden');
            cropper.destroy();
            cropper = null;
            // Clear the file input but keep the filename displayed
            const fileName = imageUpload.files[0].name;
            imageUpload.value = ''; // Reset the file input
            fileNameEl.textContent = fileName + ' (Cropped)';
        }
    });

    // Main "Generate" button click event
    generateBtn.addEventListener("click", () => {
        const firstName = firstNameEl.value;
        const lastName = lastNameEl.value;
        const file = imageUpload.files[0];

        // 1. Validation
        if (!firstName || !lastName || !file) {
            alert("Please fill in all fields and upload a photo.");
            return;
        }

        generateBtn.textContent = "Generating...";
        generateBtn.disabled = true;

        // 2. Create image objects
        const baseImage = new Image();
        const userImage = new Image();

        // Set crossOrigin for the template image to avoid canvas errors
        baseImage.crossOrigin = "Anonymous";
        
        // 3. Set up event listeners for image loading
        let baseImageLoaded = false;
        let userImageLoaded = false;

        baseImage.onload = () => {
            baseImageLoaded = true;
            if (userImageLoaded) {
                drawCanvas(firstName, lastName, baseImage, userImage);
            }
        };

        userImage.onload = () => {
            userImageLoaded = true;
            if (baseImageLoaded) {
                drawCanvas(firstName, lastName, baseImage, userImage);
            }
        };

        baseImage.onerror = () => {
            alert("Failed to load template.jpg. Make sure it's in the same folder.");
            generateBtn.textContent = "Generate Poster";
            generateBtn.disabled = false;
        };

        userImage.onerror = () => {
            alert("Could not load your image. Please try a different file.");
            generateBtn.textContent = "Generate Poster";
            generateBtn.disabled = false;
        };

        // 4. Start loading the images
        baseImage.src = "template.jpg";
        if (croppedImage) {
            userImage.src = croppedImage;
            croppedImage = null; // Clear it after use
        } else {
            userImage.src = URL.createObjectURL(file);
        }
    });

    function drawCanvas(firstName, lastName, baseImage, userImage) {
        // Set canvas dimensions to match the template
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;

        // Draw the new background image (bg.jpg) synchronously before everything else
        const bgImg = new window.Image();
        bgImg.crossOrigin = "Anonymous";  // Add cross-origin support
        bgImg.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            // Draw the template overlay
            ctx.drawImage(baseImage, 0, 0);

            // --- Blue box (frame) ---
            const box = { x: 80, y: 588, w: 380, h: 400, r: 30 };
            ctx.save();
            ctx.beginPath();
            roundedRect(ctx, box.x, box.y, box.w, box.h, box.r);
            ctx.fillStyle = '#176574';
            ctx.fill();
            ctx.restore();

            // --- Larger image frame, thinner border ---
            const imgMargin = 18; // smaller margin for bigger image
            const nameHeight = 60;
            const imageBox = {
                x: box.x + imgMargin,
                y: box.y + imgMargin,
                w: box.w - imgMargin * 2,
                h: box.h - imgMargin * 2 - nameHeight
            };
            ctx.save();
            ctx.beginPath();
            roundedRect(ctx, imageBox.x, imageBox.y, imageBox.w, imageBox.h, 22);
            ctx.clip();
            const { x, y, width, height } = getCoverDimensions(userImage, imageBox);
            ctx.drawImage(userImage, x, y, width, height);
            ctx.restore();
            ctx.save();
            ctx.beginPath();
            roundedRect(ctx, imageBox.x, imageBox.y, imageBox.w, imageBox.h, 22);
            ctx.lineWidth = 2.5; // thinner border
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.restore();

            // --- Name inside the blue box, just below the image ---
            const fullName = `${firstName} ${lastName}`;
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.font = 'bold 32px Arial Black';
            const textX = box.x + box.w / 2;
            const textY = imageBox.y + imageBox.h + 38;
            if (textY < box.y + box.h - 16) {
                ctx.fillText(fullName, textX, textY);
            } else {
                ctx.fillText(fullName, textX, box.y + box.h - 16);
            }
            ctx.restore();

            // Show the result
            const finalImageDataURL = canvas.toDataURL('image/png');
            previewImg.src = finalImageDataURL;
            downloadBtn.href = finalImageDataURL;
            outputArea.classList.remove('hidden');
            // Reset button
            generateBtn.textContent = 'Generate Poster';
            generateBtn.disabled = false;
            
            // Hide the cropping feature and file input after generating
            document.querySelector('.file-input-wrapper').style.display = 'none';
            document.getElementById('cropModal').classList.add('hidden');
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
        };
        // Use the template image as background
        bgImg.src = '111612.jpg';
    }

    // Helper: draw a rounded rectangle path
    function roundedRect(ctx, x, y, w, h, r) {
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
    }

    // Helper function to scale an image to "cover" a container
    function getCoverDimensions(img, box) {
        const imgRatio = img.width / img.height;
        const boxRatio = box.w / box.h;
        let newWidth, newHeight, newX, newY;

        if (imgRatio > boxRatio) {
            // Image is wider than the box
            newHeight = box.h;
            newWidth = newHeight * imgRatio;
            newX = box.x - (newWidth - box.w) / 2; // Center horizontally
            newY = box.y;
        } else {
            // Image is taller or same ratio
            newWidth = box.w;
            newHeight = newWidth / imgRatio;
            newY = box.y - (newHeight - box.h) / 2; // Center vertically
            newX = box.x;
        }
        
        return { x: newX, y: newY, width: newWidth, height: newHeight };
    }
};
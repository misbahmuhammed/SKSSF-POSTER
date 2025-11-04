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

    // Mobile detection
    function isMobileDevice() {
        return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || window.innerWidth <= 700;
    }

    // Cropper initialization with mobile-friendly options
    function initCropper(image) {
        if (cropper) {
            cropper.destroy();
        }
        cropper = new Cropper(image, {
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
            responsive: true,
            zoomOnTouch: true,
            zoomOnWheel: false,
            minContainerHeight: 300,
        });
    }

    // Crop control handlers
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const rotateLeftBtn = document.getElementById('rotateLeft');
    const rotateRightBtn = document.getElementById('rotateRight');
    const resetCropViewBtn = document.getElementById('resetCropView');
    const openCropBtn = document.getElementById('openCropBtn');

    if (zoomInBtn) zoomInBtn.addEventListener('click', () => cropper && cropper.zoom(0.1));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => cropper && cropper.zoom(-0.1));
    if (rotateLeftBtn) rotateLeftBtn.addEventListener('click', () => cropper && cropper.rotate(-90));
    if (rotateRightBtn) rotateRightBtn.addEventListener('click', () => cropper && cropper.rotate(90));
    if (resetCropViewBtn) resetCropViewBtn.addEventListener('click', () => cropper && cropper.reset());

    // Open cropper on mobile
    if (openCropBtn) {
        openCropBtn.addEventListener('click', () => {
            if (!imageUpload.files || !imageUpload.files[0]) {
                alert('Please select an image first.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                const cropImage = document.getElementById('cropImage');
                cropImage.src = event.target.result;
                initCropper(cropImage);
                document.getElementById('cropModal').classList.remove('hidden');
                openCropBtn.classList.add('hidden');
            };
            reader.readAsDataURL(imageUpload.files[0]);
        });
    }

    // File selection handler
    imageUpload.addEventListener("change", (e) => {
        if (imageUpload.files.length > 0) {
            const file = imageUpload.files[0];
            const name = file.name;
            fileNameEl.textContent = name;
            fileInputLabel.classList.add("file-selected");
            
            if (!isMobileDevice()) {
                // Desktop: Auto-open cropper
                const reader = new FileReader();
                reader.onload = (event) => {
                    const cropImage = document.getElementById('cropImage');
                    cropImage.src = event.target.result;
                    initCropper(cropImage);
                    document.getElementById('cropModal').classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                // Mobile: Show crop button
                openCropBtn.classList.remove('hidden');
                openCropBtn.disabled = false;
            }
        } else {
            fileNameEl.textContent = "";
            fileInputLabel.classList.remove("file-selected");
            if (openCropBtn) {
                openCropBtn.classList.add('hidden');
                openCropBtn.disabled = true;
            }
        }
    });

    // Crop modal handlers
    function resetCropper() {
        document.getElementById('cropModal').classList.add('hidden');
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
        if (openCropBtn) {
            openCropBtn.classList.remove('hidden');
            openCropBtn.disabled = false;
        }
    }

    document.getElementById('closeCropModal').addEventListener('click', resetCropper);
    document.getElementById('cancelCrop').addEventListener('click', resetCropper);

    document.getElementById('applyCrop').addEventListener('click', () => {
        if (cropper) {
            croppedImage = cropper.getCroppedCanvas().toDataURL();
            document.getElementById('cropModal').classList.add('hidden');
            cropper.destroy();
            cropper = null;
            const fileName = imageUpload.files[0].name;
            fileNameEl.textContent = fileName + ' (Cropped)';
            if (openCropBtn) {
                openCropBtn.classList.add('hidden');
                openCropBtn.disabled = true;
            }
        }
    });

    // Generate button handler
    generateBtn.addEventListener("click", () => {
        const firstName = firstNameEl.value;
        const lastName = lastNameEl.value;
        const file = imageUpload.files[0];

        if (!firstName || !lastName || !file) {
            alert("Please fill in all fields and upload a photo.");
            return;
        }

        generateBtn.textContent = "Generating...";
        generateBtn.disabled = true;

        const baseImage = new Image();
        const userImage = new Image();

        baseImage.crossOrigin = "Anonymous";
        
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

        baseImage.src = "template.jpg";
        if (croppedImage) {
            userImage.src = croppedImage;
            croppedImage = null;
        } else {
            userImage.src = URL.createObjectURL(file);
        }
    });

    function drawCanvas(firstName, lastName, baseImage, userImage) {
        canvas.width = baseImage.width;
        canvas.height = baseImage.height;

        const bgImg = new window.Image();
        bgImg.crossOrigin = "Anonymous";
        bgImg.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
            ctx.drawImage(baseImage, 0, 0);

            const box = { x: 80, y: 588, w: 380, h: 400, r: 30 };
            ctx.save();
            ctx.beginPath();
            roundedRect(ctx, box.x, box.y, box.w, box.h, box.r);
            ctx.fillStyle = '#176574';
            ctx.fill();
            ctx.restore();

            const imgMargin = 18;
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
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'white';
            ctx.stroke();
            ctx.restore();

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

            const finalImageDataURL = canvas.toDataURL('image/png');
            previewImg.src = finalImageDataURL;
            downloadBtn.href = finalImageDataURL;
            outputArea.classList.remove('hidden');
            
            generateBtn.textContent = 'Generate Poster';
            generateBtn.disabled = false;
            
            document.querySelector('.file-input-wrapper').style.display = 'none';
            document.getElementById('cropModal').classList.add('hidden');
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
        };
        bgImg.src = '111612.jpg';
    }

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

    function getCoverDimensions(img, box) {
        const imgRatio = img.width / img.height;
        const boxRatio = box.w / box.h;
        let newWidth, newHeight, newX, newY;

        if (imgRatio > boxRatio) {
            newHeight = box.h;
            newWidth = newHeight * imgRatio;
            newX = box.x - (newWidth - box.w) / 2;
            newY = box.y;
        } else {
            newWidth = box.w;
            newHeight = newWidth / imgRatio;
            newY = box.y - (newHeight - box.h) / 2;
            newX = box.x;
        }
        
        return { x: newX, y: newY, width: newWidth, height: newHeight };
    }
};
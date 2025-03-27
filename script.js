/**
 * Texture Gen v3 - Main JavaScript
 * 
 * This script handles all the functionality for the Texture Gen v3 application,
 * including texture map generation, 3D preview, UI interactions, and export functionality.
 * 
 * @author Enrico Deiana
 * @version 3.0
 * @license MIT
 */
document.addEventListener("DOMContentLoaded", function() {
    // Scene variables
    let scene, camera, renderer, mesh, light, grid;
    let imageData;
    let baseTexture, normalTexture, roughnessTexture, displacementTexture, aoTexture;
    
    // State variables
    let textureUploaded = false;
    let autoRotate = true;
    let rotationSpeed = { x: 0.0005, y: 0.004 };
    let manualRotationActive = false;
    let dragActive = false;
    let animationFrame = null;
    let dragStart = { x: 0, y: 0 };
    let gridVisible = true;
    let currentModelType = "sphere";
    let currentScale = 1.0;
    
    // Default settings
    let defaultSettings = {
        baseStrength: 1,
        normalStrength: 1,
        roughnessStrength: 0.5,
        displacementStrength: 0.2,
        aoStrength: 0.5,
        metalness: 0,
        lightX: 5,
        lightY: 5,
        lightZ: 5
    };
    
    // DOM Elements
    const uploadArea = document.getElementById("upload-area");
    const uploadContent = document.querySelector(".upload-content");
    const textureUpload = document.getElementById("texture-upload");
    const previewOverlay = document.getElementById("preview-overlay");
    const uploadedImage = document.getElementById("uploaded-image");
    const deleteImageBtn = document.getElementById("delete-image");
    const modelContainer = document.getElementById("model-container");
    
    // Stats elements
    const resolutionStat = document.getElementById("resolution-stat");
    const filesizeStat = document.getElementById("filesize-stat");
    const formatStat = document.getElementById("format-stat");
    const baseMapSize = document.getElementById("base-map-size");
    const normalMapSize = document.getElementById("normal-map-size");
    const roughnessMapSize = document.getElementById("roughness-map-size");
    const displacementMapSize = document.getElementById("displacement-map-size");
    const aoMapSize = document.getElementById("ao-map-size");
    
    // Navigation elements
    const navTabs = document.querySelectorAll(".nav-tab");
    const pageContents = document.querySelectorAll(".page-content");
    
    // 3D control elements
    const modelTypeSelect = document.getElementById("model-type");
    const modelScaleSlider = document.getElementById("model-scale");
    const scaleValueDisplay = document.getElementById("scale-value");
    const rotationXSlider = document.getElementById("rotation-x");
    const rotationYSlider = document.getElementById("rotation-y");
    const autoRotateToggle = document.getElementById("toggle-auto-rotate");
    const toggleGridBtn = document.getElementById("toggle-grid");
    
    // Canvas elements
    const baseMapCanvas = document.getElementById("base-map");
    const normalMapCanvas = document.getElementById("normal-map");
    const roughnessMapCanvas = document.getElementById("roughness-map");
    const displacementMapCanvas = document.getElementById("displacement-map");
    const aoMapCanvas = document.getElementById("ao-map");
    
    // Slider controls
    const baseStrengthSlider = document.getElementById("base-strength");
    const normalStrengthSlider = document.getElementById("normal-strength");
    const roughnessStrengthSlider = document.getElementById("roughness-strength");
    const displacementStrengthSlider = document.getElementById("displacement-strength");
    const aoStrengthSlider = document.getElementById("ao-strength");
    const metalnessSlider = document.getElementById("metalness");
    const lightXSlider = document.getElementById("light-x");
    const lightYSlider = document.getElementById("light-y");
    const lightZSlider = document.getElementById("light-z");
    
    // Value displays
    const baseValueDisplay = document.getElementById("base-value");
    const normalValueDisplay = document.getElementById("normal-value");
    const roughnessValueDisplay = document.getElementById("roughness-value");
    const displacementValueDisplay = document.getElementById("displacement-value");
    const aoValueDisplay = document.getElementById("ao-value");
    const metalnessValueDisplay = document.getElementById("metalness-value");
    
    // Download buttons
    const downloadBaseBtn = document.getElementById("download-base");
    const downloadNormalBtn = document.getElementById("download-normal");
    const downloadRoughnessBtn = document.getElementById("download-roughness");
    const downloadDisplacementBtn = document.getElementById("download-displacement");
    const downloadAoBtn = document.getElementById("download-ao");
    
    // Export options
    const exportZipBtn = document.getElementById("export-zip");
    const exportThreeJsBtn = document.getElementById("export-threejs");
    const exportBaseCheckbox = document.getElementById("export-base");
    const exportNormalCheckbox = document.getElementById("export-normal");
    const exportRoughnessCheckbox = document.getElementById("export-roughness");
    const exportDisplacementCheckbox = document.getElementById("export-displacement");
    const exportAoCheckbox = document.getElementById("export-ao");
    const exportFormatSelect = document.getElementById("export-format");
    
    // Format selects
    const baseFormatSelect = document.getElementById("base-format");
    const normalFormatSelect = document.getElementById("normal-format");
    const roughnessFormatSelect = document.getElementById("roughness-format");
    const displacementFormatSelect = document.getElementById("displacement-format");
    const aoFormatSelect = document.getElementById("ao-format");
    
    // Other UI elements
    const resetControlsBtn = document.getElementById("reset-controls");
    const processingIndicator = document.getElementById("processing-indicator");
    const progressBar = document.getElementById("progress-bar");
    const processingMessage = document.getElementById("processing-message");
    const notificationContainer = document.getElementById("notification-container");
    
    // Loading messages for texture generation
    const loadingMessages = [
        "Teaching photons how to bounce properly...",
        "Converting 2D boringness into 3D awesomeness...",
        "Convincing pixels to work in the third dimension...",
        "Calculating normal vectors (they seem quite abnormal)...",
        "Making your texture look fabulous in 3D...",
        "Generating bumps where there were none before...",
        "Analyzing surface details with microscopic precision...",
        "Persuading light to interact with virtual materials...",
        "Extracting roughness from smooth images (it's rough work)...",
        "Creating ambient occlusion where the sun don't shine...",
        "Giving depth to the depthless...",
        "Turning flat images into not-so-flat textures...",
        "Simulating reality one pixel at a time...",
        "Activating hyper-realistic texture algorithms...",
        "Applying digital sandpaper for perfect roughness...",
        "Making virtual surfaces feel touchable...",
        "Crafting PBR magic with digital pixie dust...",
        "Converting your image into a material science miracle...",
        "Enhancing reality without the RTX graphics card...",
        "Calculating how shadows would hide if they could..."
    ];

    /**
     * Creates or updates the 3D geometry based on selected model type
     */
    function createModel() {
        if (mesh) {
            scene.remove(mesh);
        }
        
        let geometry;
        
        // Create geometry based on model type
        switch (currentModelType) {
            case "cube":
                geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8, 32, 32, 32);
                break;
            case "plane":
                geometry = new THREE.PlaneGeometry(2, 2, 64, 64);
                break;
            case "torus":
                geometry = new THREE.TorusGeometry(1, 0.4, 32, 64);
                break;
            case "cylinder":
                geometry = new THREE.CylinderGeometry(1, 1, 2, 32, 32);
                break;
            case "cone":
                geometry = new THREE.ConeGeometry(1, 2, 32, 32);
                break;
            case "sphere":
            default:
                geometry = new THREE.SphereGeometry(1, 64, 64);
                break;
        }
        
        // Create material
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: parseFloat(roughnessStrengthSlider.value),
            metalness: parseFloat(metalnessSlider.value)
        });
        
        // Update textures
        if (baseTexture) {
            baseTexture.needsUpdate = true;
        }
        if (normalTexture) {
            normalTexture.needsUpdate = true;
        }
        if (roughnessTexture) {
            roughnessTexture.needsUpdate = true;
        }
        if (displacementTexture) {
            displacementTexture.needsUpdate = true;
        }
        if (aoTexture) {
            aoTexture.needsUpdate = true;
        }
        
        // Apply textures to material
        material.map = baseTexture;
        material.normalMap = normalTexture;
        material.roughnessMap = roughnessTexture;
        material.displacementMap = displacementTexture;
        material.aoMap = aoTexture;
        
        // Set texture strengths
        if (normalTexture) {
            material.normalScale = new THREE.Vector2(
                parseFloat(normalStrengthSlider.value),
                parseFloat(normalStrengthSlider.value)
            );
        }
        if (displacementTexture) {
            material.displacementScale = parseFloat(displacementStrengthSlider.value);
        }
        
        material.needsUpdate = true;
        
        // Create mesh
        mesh = new THREE.Mesh(geometry, material);
        
        // Add second UV set for ambient occlusion
        geometry.setAttribute('uv2', geometry.attributes.uv);
        
        // Apply scale
        mesh.scale.set(currentScale, currentScale, currentScale);
        
        // Add to scene
        scene.add(mesh);
        
        console.log("Model created with textures:", {
            base: !!material.map,
            normal: !!material.normalMap,
            roughness: !!material.roughnessMap,
            displacement: !!material.displacementMap,
            ao: !!material.aoMap
        });
    }

    /**
     * Handles window resize to keep the 3D view responsive
     */
    function handleResize() {
        if (camera && renderer && modelContainer) {
            camera.aspect = modelContainer.clientWidth / modelContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
        }
    }

    /**
     * Handles mouse down on the 3D model for rotation
     */
    function handleMouseDown(event) {
        if (!mesh) return;
        
        dragActive = true;
        dragStart = {
            x: event.clientX,
            y: event.clientY
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        event.preventDefault();
    }

    /**
     * Handles mouse movement for model rotation
     */
    function handleMouseMove(event) {
        if (!dragActive || !mesh) return;
        
        let delta = {
            x: event.clientX - dragStart.x,
            y: event.clientY - dragStart.y
        };
        
        mesh.rotation.y += delta.x * 0.01;
        mesh.rotation.x += delta.y * 0.01;
        
        // Update rotation sliders
        if (!manualRotationActive) {
            rotationXSlider.value = mesh.rotation.x;
            rotationYSlider.value = mesh.rotation.y;
        }
        
        dragStart = {
            x: event.clientX,
            y: event.clientY
        };
    }

    /**
     * Handles mouse up to end rotation
     */
    function handleMouseUp() {
        dragActive = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    /**
     * Handles touch start for mobile rotation
     */
    function handleTouchStart(event) {
        if (!mesh) return;
        
        event.preventDefault();
        dragActive = true;
        
        if (event.touches.length === 1) {
            dragStart = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
            
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
        }
    }

    /**
     * Handles touch movement for mobile rotation
     */
    function handleTouchMove(event) {
        if (dragActive && mesh) {
            event.preventDefault();
            
            if (event.touches.length === 1) {
                let delta = {
                    x: event.touches[0].clientX - dragStart.x,
                    y: event.touches[0].clientY - dragStart.y
                };
                
                mesh.rotation.y += delta.x * 0.01;
                mesh.rotation.x += delta.y * 0.01;
                
                // Update rotation sliders
                if (!manualRotationActive) {
                    rotationXSlider.value = mesh.rotation.x;
                    rotationYSlider.value = mesh.rotation.y;
                }
                
                dragStart = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY
                };
            }
        }
    }

    /**
     * Handles touch end to stop rotation
     */
    function handleTouchEnd() {
        dragActive = false;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }

    /**
     * Toggles grid visibility
     */
    function toggleGrid() {
        if (!grid) return;
        
        gridVisible = !gridVisible;
        grid.visible = gridVisible;
        
        if (gridVisible) {
            toggleGridBtn.classList.add("active");
            showNotification("Grid enabled", "info");
        } else {
            toggleGridBtn.classList.remove("active");
            showNotification("Grid disabled", "info");
        }
    }

    /**
     * Resets controls to default values
     */
    function resetControls() {
        baseStrengthSlider.value = defaultSettings.baseStrength;
        normalStrengthSlider.value = defaultSettings.normalStrength;
        roughnessStrengthSlider.value = defaultSettings.roughnessStrength;
        displacementStrengthSlider.value = defaultSettings.displacementStrength;
        aoStrengthSlider.value = defaultSettings.aoStrength;
        metalnessSlider.value = defaultSettings.metalness;
        lightXSlider.value = defaultSettings.lightX;
        lightYSlider.value = defaultSettings.lightY;
        lightZSlider.value = defaultSettings.lightZ;
        
        // Update value displays
        baseValueDisplay.textContent = defaultSettings.baseStrength.toFixed(1);
        normalValueDisplay.textContent = defaultSettings.normalStrength.toFixed(1);
        roughnessValueDisplay.textContent = defaultSettings.roughnessStrength.toFixed(1);
        displacementValueDisplay.textContent = defaultSettings.displacementStrength.toFixed(1);
        aoValueDisplay.textContent = defaultSettings.aoStrength.toFixed(1);
        metalnessValueDisplay.textContent = defaultSettings.metalness.toFixed(1);
        
        // Reset model type and scale
        modelTypeSelect.value = "sphere";
        currentModelType = "sphere";
        modelScaleSlider.value = 1.0;
        currentScale = 1.0;
        scaleValueDisplay.textContent = "1.0";
        
        // Update material if exists
        if (mesh && mesh.material) {
            mesh.material.roughness = defaultSettings.roughnessStrength;
            mesh.material.metalness = defaultSettings.metalness;
            
            if (mesh.material.normalMap) {
                mesh.material.normalScale.set(defaultSettings.normalStrength, defaultSettings.normalStrength);
            }
            
            if (mesh.material.displacementMap) {
                mesh.material.displacementScale = defaultSettings.displacementStrength;
            }
            
            mesh.material.needsUpdate = true;
            
            // Reset scale
            mesh.scale.set(1, 1, 1);
        }
        
        // Update light position
        if (light) {
            light.position.set(defaultSettings.lightX, defaultSettings.lightY, defaultSettings.lightZ);
        }
        
        // Recreate model with default shape
        createModel();
        
        showNotification("Settings reset to defaults", "success");
    }

    /**
     * Clears a canvas
     */
    function clearCanvas(canvas) {
        let ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    /**
     * Handles file upload from input change
     */
    function handleFileUpload(event) {
        console.log("File upload triggered", event.target.files);
        if (event.target.files && event.target.files.length) {
            processFile(event.target.files[0]);
        }
    }

    /**
     * Processes the uploaded image file
     */
    function processFile(file) {
        console.log("Processing file:", file);
        
        if (!file || !file.type.match('image.*')) {
            showNotification("Please upload an image file.", "error");
            return;
        }
        
        // Show random loading message
        let message = getRandomLoadingMessage();
        showProcessingIndicator(message, 10);
        
        // Read the file
        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                // Update progress
                updateProgress(30);
                updateProcessingMessage(getRandomLoadingMessage());
                
                // Display uploaded image
                uploadedImage.src = e.target.result;
                previewOverlay.style.display = "flex";
                textureUploaded = true;
                
                // Update file statistics
                updateFileStats(file);
                
                // Process the image for textures
                let img = new Image();
                img.onload = function() {
                    try {
                        // Update progress
                        updateProgress(50);
                        updateProcessingMessage(getRandomLoadingMessage());
                        
                        // Get image data for processing
                        imageData = getImageData(img);
                        
                        // Update progress
                        updateProgress(60);
                        updateProcessingMessage(getRandomLoadingMessage());
                        
                        // Generate texture maps
                        generateBaseMap(img);
                        generateNormalMap(imageData);
                        generateRoughnessMap(imageData);
                        generateDisplacementMap(imageData);
                        generateAoMap(imageData);
                        
                        // Update map size stats
                        if (baseMapCanvas.width && baseMapCanvas.height) {
                            baseMapSize.textContent = `${baseMapCanvas.width} × ${baseMapCanvas.height}`;
                            normalMapSize.textContent = `${normalMapCanvas.width} × ${normalMapCanvas.height}`;
                            roughnessMapSize.textContent = `${roughnessMapCanvas.width} × ${roughnessMapCanvas.height}`;
                            displacementMapSize.textContent = `${displacementMapCanvas.width} × ${displacementMapCanvas.height}`;
                            aoMapSize.textContent = `${aoMapCanvas.width} × ${aoMapCanvas.height}`;
                        }
                        
                        // Update progress
                        updateProgress(90);
                        updateProcessingMessage("Applying to 3D model... Almost there!");
                        
                        // Create or update the 3D model
                        createModel();
                        
                        // Finish up with slight delay
                        setTimeout(() => {
                            updateProgress(100);
                            hideProcessingIndicator();
                            showNotification("Texture maps generated successfully!", "success");
                        }, 500);
                    } catch (err) {
                        console.error("Error processing image:", err);
                        handleProcessingError();
                    }
                };
                
                img.src = e.target.result;
                
            } catch (err) {
                console.error("Error loading image:", err);
                handleProcessingError();
            }
        };
        
        reader.onerror = function() {
            handleProcessingError();
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * Gets image data from an HTML Image element
     */
    function getImageData(img) {
        let canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        let ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    /**
     * Updates file statistics in the UI
     */
    function updateFileStats(file) {
        // Size in KB or MB
        let sizeInKB = file.size / 1024;
        let sizeDisplay;
        
        if (sizeInKB >= 1024) {
            sizeDisplay = (sizeInKB / 1024).toFixed(2) + " MB";
        } else {
            sizeDisplay = sizeInKB.toFixed(2) + " KB";
        }
        
        // Format (jpg, png, etc)
        let formatMatch = file.type.match(/image\/(\w+)/);
        let formatDisplay = formatMatch ? formatMatch[1].toUpperCase() : "Unknown";
        
        // Update stats display
        filesizeStat.textContent = sizeDisplay;
        formatStat.textContent = formatDisplay;
        
        // Get resolution
        let img = new Image();
        img.onload = function() {
            resolutionStat.textContent = img.width + " × " + img.height;
        };
        img.src = URL.createObjectURL(file);
    }

    /**
     * Generates base color map from image
     */
    function generateBaseMap(img) {
        baseMapCanvas.width = img.width;
        baseMapCanvas.height = img.height;
        let ctx = baseMapCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        baseTexture = new THREE.Texture(baseMapCanvas);
        
        // Enable anisotropic filtering if available
        if (renderer) {
            baseTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        }
        
        baseTexture.needsUpdate = true;
        
        console.log("Base color map generated");
    }

    /**
     * Generates normal map from image data
     */
    function generateNormalMap(imgData) {
        normalMapCanvas.width = imgData.width;
        normalMapCanvas.height = imgData.height;
        let ctx = normalMapCanvas.getContext('2d');
        
        let outputData = ctx.createImageData(imgData.width, imgData.height);
        
        // Sobel operators for edge detection
        let sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        let sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        
        for (let y = 0; y < imgData.height; y++) {
            for (let x = 0; x < imgData.width; x++) {
                let gx = 0;
                let gy = 0;
                
                // Apply the sobel operators
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        // Get boundaries
                        let pixelX = Math.min(imgData.width - 1, Math.max(0, x + kx));
                        let pixelY = Math.min(imgData.height - 1, Math.max(0, y + ky));
                        
                        let idx = (pixelY * imgData.width + pixelX) * 4;
                        
                        // Grayscale value
                        let val = (imgData.data[idx] + imgData.data[idx + 1] + imgData.data[idx + 2]) / 3;
                        
                        gx += val * sobelX[(ky + 1) * 3 + (kx + 1)];
                        gy += val * sobelY[(ky + 1) * 3 + (kx + 1)];
                    }
                }
                
                // Normalize and convert to normal map format
                let nx = -(gx * 3);
                let ny = -(gy * 3);
                let nz = Math.sqrt(nx * nx + ny * ny + 40000); // Adjust strength here
                
                let outIdx = (y * imgData.width + x) * 4;
                
                // RGB values for normal map
                outputData.data[outIdx] = (nx / nz * 0.5 + 0.5) * 255;     // R
                outputData.data[outIdx + 1] = (ny / nz * 0.5 + 0.5) * 255; // G
                outputData.data[outIdx + 2] = (200 / nz * 0.5 + 0.5) * 255; // B
                outputData.data[outIdx + 3] = 255; // Alpha
            }
        }
        
        ctx.putImageData(outputData, 0, 0);
        
        normalTexture = new THREE.Texture(normalMapCanvas);
        normalTexture.needsUpdate = true;
        
        console.log("Normal map generated");
    }

    /**
     * Generates roughness map from image data
     */
    function generateRoughnessMap(imgData) {
        roughnessMapCanvas.width = imgData.width;
        roughnessMapCanvas.height = imgData.height;
        let ctx = roughnessMapCanvas.getContext('2d');
        
        let outputData = ctx.createImageData(imgData.width, imgData.height);
        
        for (let y = 0; y < imgData.height; y++) {
            for (let x = 0; x < imgData.width; x++) {
                let centerIdx = (y * imgData.width + x) * 4;
                let totalVariance = 0;
                let sampleCount = 0;
                
                // Measure local variance (roughness)
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        let sampleX = Math.min(imgData.width - 1, Math.max(0, x + kx));
                        let sampleY = Math.min(imgData.height - 1, Math.max(0, y + ky));
                        
                        let sampleIdx = (sampleY * imgData.width + sampleX) * 4;
                        let centerIdx = (y * imgData.width + x) * 4;
                        
                        let centerVal = (imgData.data[centerIdx] + imgData.data[centerIdx + 1] + imgData.data[centerIdx + 2]) / 3;
                        let sampleVal = (imgData.data[sampleIdx] + imgData.data[sampleIdx + 1] + imgData.data[sampleIdx + 2]) / 3;
                        
                        totalVariance += Math.pow(sampleVal - centerVal, 2);
                        sampleCount++;
                    }
                }
                
                // Calculate roughness from variance and brightness
                let variance = Math.sqrt(totalVariance / sampleCount) / 16;
                let brightness = (imgData.data[centerIdx] + imgData.data[centerIdx + 1] + imgData.data[centerIdx + 2]) / 3;
                
                // Mix variance with inverted brightness (darker areas tend to be rougher)
                variance = variance * 0.6 + ((255 - brightness) / 255) * 0.4;
                variance = Math.min(1, Math.max(0, variance));
                
                let val = variance * 255;
                
                outputData.data[centerIdx] = val;
                outputData.data[centerIdx + 1] = val;
                outputData.data[centerIdx + 2] = val;
                outputData.data[centerIdx + 3] = 255;
            }
        }
        
        ctx.putImageData(outputData, 0, 0);
        
        roughnessTexture = new THREE.Texture(roughnessMapCanvas);
        roughnessTexture.needsUpdate = true;
        
        console.log("Roughness map generated");
    }

    /**
     * Generates displacement map from image data
     */
    function generateDisplacementMap(imgData) {
        displacementMapCanvas.width = imgData.width;
        displacementMapCanvas.height = imgData.height;
        let ctx = displacementMapCanvas.getContext('2d');
        
        let outputData = ctx.createImageData(imgData.width, imgData.height);
        
        // Simple grayscale conversion with contrast enhancement
        for (let i = 0; i < imgData.data.length; i += 4) {
            let r = imgData.data[i];
            let g = imgData.data[i + 1];
            let b = imgData.data[i + 2];
            
            // Convert to grayscale
            let gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            
            // Enhance contrast
            gray = Math.max(0, Math.min(255, (gray - 128) * 1.2 + 128));
            
            outputData.data[i] = gray;
            outputData.data[i + 1] = gray;
            outputData.data[i + 2] = gray;
            outputData.data[i + 3] = 255;
        }
        
        ctx.putImageData(outputData, 0, 0);
        
        displacementTexture = new THREE.Texture(displacementMapCanvas);
        displacementTexture.needsUpdate = true;
        
        console.log("Displacement map generated");
    }

    /**
     * Generates ambient occlusion map from image data
     */
    function generateAoMap(imgData) {
        aoMapCanvas.width = imgData.width;
        aoMapCanvas.height = imgData.height;
        let ctx = aoMapCanvas.getContext('2d');
        
        let outputData = ctx.createImageData(imgData.width, imgData.height);
        
        // Create a blurred version of the image for comparison
        let blurCanvas = document.createElement('canvas');
        blurCanvas.width = imgData.width;
        blurCanvas.height = imgData.height;
        let blurCtx = blurCanvas.getContext('2d');
        
        blurCtx.putImageData(imgData, 0, 0);
        blurCtx.filter = 'blur(2px)';
        blurCtx.drawImage(blurCanvas, 0, 0);
        
        let blurredData = blurCtx.getImageData(0, 0, blurCanvas.width, blurCanvas.height);
        blurCtx.filter = 'none';
        
        // Calculate AO by comparing original image with blurred version
        for (let y = 0; y < imgData.height; y++) {
            for (let x = 0; x < imgData.width; x++) {
                let idx = (y * imgData.width + x) * 4;
                let totalDifference = 0;
                let sampleCount = 0;
                
                // Sample nearby pixels to find edges and crevices
                for (let ky = -2; ky <= 2; ky++) {
                    for (let kx = -2; kx <= 2; kx++) {
                        // Skip the center pixel
                        if (kx === 0 && ky === 0) continue;
                        
                        let sampleX = Math.min(imgData.width - 1, Math.max(0, x + kx));
                        let sampleY = Math.min(imgData.height - 1, Math.max(0, y + ky));
                        
                        let sampleIdx = (sampleY * imgData.width + sampleX) * 4;
                        
                        let centerVal = (blurredData.data[idx] + blurredData.data[idx + 1] + blurredData.data[idx + 2]) / 3;
                        let sampleVal = (blurredData.data[sampleIdx] + blurredData.data[sampleIdx + 1] + blurredData.data[sampleIdx + 2]) / 3;
                        
                        totalDifference += Math.abs(sampleVal - centerVal);
                        sampleCount++;
                    }
                }
                
                let avgDifference = totalDifference / sampleCount;
                let aoVal = 255 - (avgDifference * 1.5); // Invert and scale
                
                // Mix with image brightness
                let brightness = (imgData.data[idx] + imgData.data[idx + 1] + imgData.data[idx + 2]) / 3;
                
                // Darker areas = more occlusion, brighter areas = less occlusion
                aoVal = Math.max(0, Math.min(255, aoVal = 0.7 * aoVal + (255 - brightness) * 0.3));
                
                // Enhance contrast
                aoVal = Math.max(100, Math.min(255, (aoVal - 128) * 1.2 + 128));
                
                outputData.data[idx] = aoVal;
                outputData.data[idx + 1] = aoVal;
                outputData.data[idx + 2] = aoVal;
                outputData.data[idx + 3] = 255;
            }
        }
        
        ctx.putImageData(outputData, 0, 0);
        
        aoTexture = new THREE.Texture(aoMapCanvas);
        aoTexture.needsUpdate = true;
        
        console.log("AO map generated");
    }

    /**
     * Gets a random loading message
     */
    function getRandomLoadingMessage() {
        return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    }

    /**
     * Handles processing errors
     */
    function handleProcessingError() {
        hideProcessingIndicator();
        showNotification("Error processing image. Please try another image.", "error");
    }

    /**
     * Shows the processing indicator with message and progress
     */
    function showProcessingIndicator(message, progress = 0) {
        processingMessage.textContent = message;
        progressBar.style.width = `${progress}%`;
        processingIndicator.style.display = "flex";
    }

    /**
     * Updates the progress bar
     */
    function updateProgress(value) {
        progressBar.style.width = `${value}%`;
    }

    /**
     * Updates the processing message
     */
    function updateProcessingMessage(message) {
        processingMessage.textContent = message;
    }

    /**
     * Hides the processing indicator
     */
    function hideProcessingIndicator() {
        processingIndicator.style.display = "none";
    }

    /**
     * Shows a notification to the user
     */
    function showNotification(message, type = "info") {
        let notification = document.createElement("div");
        notification.className = `notification ${type}`;
        
        const iconMap = {
            success: "fa-check-circle",
            error: "fa-exclamation-circle",
            info: "fa-info-circle",
            warning: "fa-exclamation-triangle"
        };
        
        const titleMap = {
            success: "Success",
            error: "Error",
            info: "Information",
            warning: "Warning"
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${iconMap[type]}"></i>
            </div>
            <div class="notification-content">
                <h4 class="notification-title">${titleMap[type]}</h4>
                <p class="notification-message">${message}</p>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Add close button event listener
        let closeBtn = notification.querySelector(".notification-close");
        closeBtn.addEventListener("click", () => {
            notification.classList.remove("show");
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Show with slight delay for animation
        setTimeout(() => {
            notification.classList.add("show");
        }, 10);
        
        // Auto-close after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove("show");
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Updates texture slider values in the 3D model
     */
    function updateTextureStrengths() {
        // Update value displays
        baseValueDisplay.textContent = parseFloat(baseStrengthSlider.value).toFixed(1);
        normalValueDisplay.textContent = parseFloat(normalStrengthSlider.value).toFixed(1);
        roughnessValueDisplay.textContent = parseFloat(roughnessStrengthSlider.value).toFixed(1);
        displacementValueDisplay.textContent = parseFloat(displacementStrengthSlider.value).toFixed(1);
        aoValueDisplay.textContent = parseFloat(aoStrengthSlider.value).toFixed(1);
        
        // Update material if available
        if (mesh && mesh.material) {
            if (mesh.material.normalMap) {
                mesh.material.normalScale.set(
                    parseFloat(normalStrengthSlider.value),
                    parseFloat(normalStrengthSlider.value)
                );
            }
            
            if (mesh.material.displacementMap) {
                mesh.material.displacementScale = parseFloat(displacementStrengthSlider.value);
            }
            
            mesh.material.needsUpdate = true;
        } else {
            // If no mesh yet, create it
            createModel();
        }
    }

    /**
     * Updates metalness value in the 3D model
     */
    function updateMetalness() {
        metalnessValueDisplay.textContent = parseFloat(metalnessSlider.value).toFixed(1);
        
        if (mesh && mesh.material) {
            mesh.material.metalness = parseFloat(metalnessSlider.value);
            mesh.material.needsUpdate = true;
        }
    }

    /**
     * Updates light position in the scene
     */
    function updateLightPosition() {
        if (light) {
            light.position.set(
                parseFloat(lightXSlider.value),
                parseFloat(lightYSlider.value),
                parseFloat(lightZSlider.value)
            );
        }
    }

    /**
     * Calculates estimated file size for texture map
     */
    function calculateFileSize(canvas, format) {
        let width = canvas.width;
        let height = canvas.height;
        
        // Approximate compression ratios
        const compressionRatio = {
            png: 0.8,  // Lossless but some compression
            webp: 0.4, // Better compression
            jpeg: 0.2  // Higher compression
        };
        
        // Bytes per pixel for RGBA
        let bytesPerPixel = 4;
        
        // Calculate estimated size in bytes
        let estimatedBytes = width * height * bytesPerPixel * compressionRatio[format];
        
        // Convert to human-readable size
        if (estimatedBytes > 1024 * 1024) {
            return (estimatedBytes / (1024 * 1024)).toFixed(2) + " MB";
        } else {
            return (estimatedBytes / 1024).toFixed(2) + " KB";
        }
    }

    /**
     * Downloads a texture map
     */
    function downloadTextureMap(canvas, name, format = 'png') {
        if (!textureUploaded) {
            showNotification("Please upload a texture first", "error");
            return;
        }
        
        let link = document.createElement('a');
        
        switch (format) {
            case 'webp':
                link.href = canvas.toDataURL('image/webp');
                link.download = `${name}.webp`;
                break;
            case 'jpeg':
                link.href = canvas.toDataURL('image/jpeg', 0.9);
                link.download = `${name}.jpg`;
                break;
            default: // png
                link.href = canvas.toDataURL('image/png');
                link.download = `${name}.png`;
                break;
        }
        
        link.click();
        
        let formatName = {
            png: "PNG",
            webp: "WebP",
            jpeg: "JPEG"
        }[format];
        
        showNotification(`${name.split('-')[0]} map downloaded as ${formatName}`, "success");
    }

    /**
     * Exports all selected texture maps as a ZIP file
     */
    function exportZip() {
        if (!textureUploaded) {
            showNotification("Please upload a texture first", "error");
            return;
        }
        
        if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
            showNotification("ZIP export libraries not loaded. Please refresh and try again.", "error");
            return;
        }
        
        let zip = new JSZip();
        let baseFileName = "texture";
        let exportCount = 0;
        let format = exportFormatSelect.value;
        let extension = format === 'webp' ? 'webp' : format === 'jpeg' ? 'jpg' : 'png';
        
        showProcessingIndicator("Packaging texture maps...", 10);
        
        // Add base color map
        if (exportBaseCheckbox.checked && baseMapCanvas) {
            let dataURL;
            if (format === 'webp') {
                dataURL = baseMapCanvas.toDataURL('image/webp');
            } else if (format === 'jpeg') {
                dataURL = baseMapCanvas.toDataURL('image/jpeg', 0.9);
            } else {
                dataURL = baseMapCanvas.toDataURL('image/png');
            }
            
            zip.file(`${baseFileName}_basecolor.${extension}`, dataURLToBlob(dataURL), { base64: false });
            exportCount++;
            updateProgress(20);
        }
        
        // Add normal map - normal maps should ideally be PNG or WebP but not JPEG
        if (exportNormalCheckbox.checked && normalMapCanvas) {
            let normalFormat = format === 'jpeg' ? 'png' : format;
            let normalExtension = normalFormat === 'webp' ? 'webp' : 'png';
            
            let dataURL;
            if (normalFormat === 'webp') {
                dataURL = normalMapCanvas.toDataURL('image/webp');
            } else {
                dataURL = normalMapCanvas.toDataURL('image/png');
            }
            
            zip.file(`${baseFileName}_normal.${normalExtension}`, dataURLToBlob(dataURL), { base64: false });
            exportCount++;
            updateProgress(40);
        }
        
        // Add roughness map
        if (exportRoughnessCheckbox.checked && roughnessMapCanvas) {
            let dataURL;
            if (format === 'webp') {
                dataURL = roughnessMapCanvas.toDataURL('image/webp');
            } else if (format === 'jpeg') {
                dataURL = roughnessMapCanvas.toDataURL('image/jpeg', 0.9);
            } else {
                dataURL = roughnessMapCanvas.toDataURL('image/png');
            }
            
            zip.file(`${baseFileName}_roughness.${extension}`, dataURLToBlob(dataURL), { base64: false });
            exportCount++;
            updateProgress(60);
        }
        
        // Add displacement map - should ideally be PNG or WebP but not JPEG
        if (exportDisplacementCheckbox.checked && displacementMapCanvas) {
            let dispFormat = format === 'jpeg' ? 'png' : format;
            let dispExtension = dispFormat === 'webp' ? 'webp' : 'png';
            
            let dataURL;
            if (dispFormat === 'webp') {
                dataURL = displacementMapCanvas.toDataURL('image/webp');
            } else {
                dataURL = displacementMapCanvas.toDataURL('image/png');
            }
            
            zip.file(`${baseFileName}_displacement.${dispExtension}`, dataURLToBlob(dataURL), { base64: false });
            exportCount++;
            updateProgress(80);
        }
        
        // Add ambient occlusion map
        if (exportAoCheckbox.checked && aoMapCanvas) {
            let dataURL;
            if (format === 'webp') {
                dataURL = aoMapCanvas.toDataURL('image/webp');
            } else if (format === 'jpeg') {
                dataURL = aoMapCanvas.toDataURL('image/jpeg', 0.9);
            } else {
                dataURL = aoMapCanvas.toDataURL('image/png');
            }
            
            zip.file(`${baseFileName}_ao.${extension}`, dataURLToBlob(dataURL), { base64: false });
            exportCount++;
            updateProgress(90);
        }
        
        // Check if any maps were added
        if (exportCount === 0) {
            hideProcessingIndicator();
            showNotification("Please select at least one map to export", "warning");
            return;
        }
        
        // Generate ZIP file
        updateProcessingMessage("Creating ZIP file...");
        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                updateProgress(100);
                saveAs(content, `${baseFileName}_maps.zip`);
                
                setTimeout(() => {
                    hideProcessingIndicator();
                    showNotification(`${exportCount} texture maps exported successfully as ${format.toUpperCase()}!`, "success");
                }, 500);
            })
            .catch(function(error) {
                console.error("Error creating ZIP file:", error);
                hideProcessingIndicator();
                showNotification("Error creating ZIP file. Please try again.", "error");
            });
    }

    /**
     * Converts a data URL to a Blob object
     */
    function dataURLToBlob(dataURL) {
        let parts = dataURL.split(';base64,');
        let contentType = parts[0].split(':')[1];
        let raw = window.atob(parts[1]);
        let rawLength = raw.length;
        let uInt8Array = new Uint8Array(rawLength);
        
        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }
        
        return new Blob([uInt8Array], { type: contentType });
    }

    /**
     * Toggles auto-rotation of the 3D model
     */
    function toggleAutoRotation() {
        autoRotate = !autoRotate;
        
        if (autoRotate) {
            autoRotateToggle.classList.add("active");
            showNotification("Auto-rotation enabled", "info");
        } else {
            autoRotateToggle.classList.remove("active");
            showNotification("Auto-rotation disabled", "info");
        }
    }

    /**
     * Updates model rotation manually from sliders
     */
    function updateManualRotation() {
        if (!mesh) return;
        
        if (!manualRotationActive) {
            manualRotationActive = true;
            autoRotate = false;
            autoRotateToggle.classList.remove("active");
        }
        
        mesh.rotation.x = parseFloat(rotationXSlider.value);
        mesh.rotation.y = parseFloat(rotationYSlider.value);
    }

    /**
     * Updates model type based on dropdown selection
     */
    function updateModelType() {
        currentModelType = modelTypeSelect.value;
        createModel();
        showNotification(`Changed model to ${currentModelType}`, "info");
    }

    /**
     * Updates model scale based on slider
     */
    function updateModelScale() {
        currentScale = parseFloat(modelScaleSlider.value);
        scaleValueDisplay.textContent = currentScale.toFixed(1);
        
        if (mesh) {
            mesh.scale.set(currentScale, currentScale, currentScale);
        }
    }

    /**
     * Exports Three.js code for the current material setup
     */
    function exportThreeJsCode() {
        if (!textureUploaded) {
            showNotification("Please upload a texture first", "error");
            return;
        }
        
        let format = exportFormatSelect.value;
        let extension = format === 'webp' ? 'webp' : format === 'jpeg' ? 'jpg' : 'png';
        
        showProcessingIndicator("Generating Three.js code...", 50);
        
        // Generate Three.js code with current settings
        let code = `/**
 * Three.js Material Example with Exported Textures
 * Generated by Texture Gen v3
 * 
 * This code implements a PBR material setup using the texture maps
 * generated and configured in Texture Gen v3.
 */
import * as THREE from 'three';

// Create a scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Load textures
const textureLoader = new THREE.TextureLoader();
const baseTexture = textureLoader.load('texture_basecolor.${extension}');
const normalTexture = textureLoader.load('texture_normal.${format === 'jpeg' ? 'png' : extension}');
const roughnessTexture = textureLoader.load('texture_roughness.${extension}');
const displacementTexture = textureLoader.load('texture_displacement.${format === 'jpeg' ? 'png' : extension}');
const aoTexture = textureLoader.load('texture_ao.${extension}');

// Create geometry
let geometry;
// The model type is set to ${currentModelType}
${getGeometryCode()}

// Create material with all maps
const material = new THREE.MeshStandardMaterial({
    map: baseTexture,
    normalMap: normalTexture,
    roughnessMap: roughnessTexture,
    displacementMap: displacementTexture,
    aoMap: aoTexture,
    normalScale: new THREE.Vector2(${normalStrengthSlider.value}, ${normalStrengthSlider.value}),
    roughness: ${roughnessStrengthSlider.value},
    metalness: ${metalnessSlider.value},
    displacementScale: ${displacementStrengthSlider.value}
});

// Create mesh
const mesh = new THREE.Mesh(geometry, material);

// Apply scale
mesh.scale.set(${currentScale}, ${currentScale}, ${currentScale});

// For ambient occlusion to work, we need UV2
geometry.setAttribute('uv2', geometry.attributes.uv);

scene.add(mesh);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(${lightXSlider.value}, ${lightYSlider.value}, ${lightZSlider.value});
scene.add(directionalLight);

// Add subtle hemisphere light for better detail visibility
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotation animation
    mesh.rotation.y += 0.005;
    
    renderer.render(scene, camera);
}

animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});`;

        setTimeout(() => {
            updateProgress(100);
            
            // Create blob and download
            let blob = new Blob([code], { type: "text/javascript" });
            let url = URL.createObjectURL(blob);
            let link = document.createElement("a");
            link.href = url;
            link.download = "texture_material.js";
            link.click();
            
            hideProcessingIndicator();
            showNotification("Three.js code exported successfully", "success");
        }, 800);

        // Helper function to generate geometry code based on current model type
        function getGeometryCode() {
            switch (currentModelType) {
                case "cube":
                    return "geometry = new THREE.BoxGeometry(1.8, 1.8, 1.8, 32, 32, 32);";
                case "plane":
                    return "geometry = new THREE.PlaneGeometry(2, 2, 64, 64);";
                case "torus":
                    return "geometry = new THREE.TorusGeometry(1, 0.4, 32, 64);";
                case "cylinder":
                    return "geometry = new THREE.CylinderGeometry(1, 1, 2, 32, 32);";
                case "cone":
                    return "geometry = new THREE.ConeGeometry(1, 2, 32, 32);";
                case "sphere":
                default:
                    return "geometry = new THREE.SphereGeometry(1, 64, 64);";
            }
        }
    }

    /**
     * Initialize the application
     */
    function init() {
        // Check if required libraries are available
        if (typeof THREE === 'undefined') {
            console.error("THREE is not defined. Please check if Three.js is loaded correctly.");
            showNotification("Error loading Three.js library. Please refresh and try again.", "error");
            return;
        }
        
        if (typeof JSZip === 'undefined') {
            console.error("JSZip is not defined. Please check if JSZip is loaded correctly.");
            showNotification("Error loading JSZip library. Please refresh and try again.", "error");
            return;
        }
        
        try {
            initThreeJs();
            initEventListeners();
            
            // Set initial UI state
            toggleGridBtn.classList.add("active");
            autoRotateToggle.classList.add("active");
            
        } catch (error) {
            console.error("Error initializing application:", error);
            showNotification("Error initializing application. Please refresh the page.", "error");
        }
    }

    /**
     * Initialize Three.js scene, camera, renderer, lights, etc.
     */
    function initThreeJs() {
        // Create Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0D1117);
        
        // Create Camera
        camera = new THREE.PerspectiveCamera(75, modelContainer.clientWidth / modelContainer.clientHeight, 0.1, 1000);
        camera.position.z = 3;
        camera.position.y = 0.5;
        
        // Create Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        modelContainer.appendChild(renderer.domElement);
        
        // Add lighting
        light = new THREE.DirectionalLight(0xFFFFFF, 1.5);
        light.position.set(5, 5, 5);
        scene.add(light);
        
        let ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.7);
        scene.add(ambientLight);
        
        let hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x444444, 0.3);
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);
        
        // Add grid helper
        grid = new THREE.GridHelper(10, 20, 0x444444, 0x252525);
        grid.position.y = -1.5;
        scene.add(grid);
        
        // Create initial model (will be replaced when texture is uploaded)
        createModel();
        
        // Show processing indicator briefly during initialization
        showProcessingIndicator("Initializing 3D environment...", 0);
        
        // Animate progress for a nice loading effect
        let progress = 0;
        let progressInterval = setInterval(() => {
            progress += 10;
            if (progress <= 100) {
                updateProgress(progress);
            } else {
                clearInterval(progressInterval);
                hideProcessingIndicator();
            }
        }, 100);
        
        // Add window resize listener
        window.addEventListener('resize', handleResize);
        
        // Start animation loop
        function animate() {
            animationFrame = requestAnimationFrame(animate);
            
            // Auto-rotate if enabled and not dragging
            if (mesh && autoRotate && !dragActive) {
                mesh.rotation.y += rotationSpeed.y;
                mesh.rotation.x += rotationSpeed.x;
                
                // Update rotation sliders if not manually rotating
                if (!manualRotationActive) {
                    rotationXSlider.value = (mesh.rotation.x % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
                    rotationYSlider.value = (mesh.rotation.y % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
                }
            }
            
            // Render scene
            if (renderer) {
                renderer.render(scene, camera);
            }
        }
        
        animate();
    }

    /**
     * Initialize all event listeners
     */
    function initEventListeners() {
        // File upload handling
        textureUpload.addEventListener("change", handleFileUpload);
        textureUpload.addEventListener("click", function(e) {
            e.stopPropagation();
        });
        
        // Drag and drop handling
        uploadArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadArea.classList.add("active");
        });
        
        uploadArea.addEventListener("dragleave", () => {
            uploadArea.classList.remove("active");
        });
        
        uploadArea.addEventListener("drop", (e) => {
            e.preventDefault();
            uploadArea.classList.remove("active");
            if (e.dataTransfer.files.length) {
                processFile(e.dataTransfer.files[0]);
            }
        });
        
        // Upload click handling
        uploadContent.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!textureUploaded) {
                textureUpload.value = "";
                setTimeout(() => {
                    textureUpload.click();
                }, 10);
            }
        });
        
        // Delete image handling
        deleteImageBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            previewOverlay.style.display = "none";
            uploadedImage.src = "";
            textureUploaded = false;
            
            // Reset stats
            resolutionStat.textContent = "-";
            filesizeStat.textContent = "-";
            formatStat.textContent = "-";
            baseMapSize.textContent = "-";
            normalMapSize.textContent = "-";
            roughnessMapSize.textContent = "-";
            displacementMapSize.textContent = "-";
            aoMapSize.textContent = "-";
            
            // Clear textures on model
            if (mesh && mesh.material) {
                mesh.material.map = null;
                mesh.material.normalMap = null;
                mesh.material.roughnessMap = null;
                mesh.material.displacementMap = null;
                mesh.material.aoMap = null;
                mesh.material.needsUpdate = true;
            }
            
            // Clear canvases
            clearCanvas(baseMapCanvas);
            clearCanvas(normalMapCanvas);
            clearCanvas(roughnessMapCanvas);
            clearCanvas(displacementMapCanvas);
            clearCanvas(aoMapCanvas);
            
            // Clear texture references
            baseTexture = null;
            normalTexture = null;
            roughnessTexture = null;
            displacementTexture = null;
            aoTexture = null;
            imageData = null;
            
            showNotification("Image removed", "info");
        });
        
        // Texture settings handling
        baseStrengthSlider.addEventListener("input", updateTextureStrengths);
        normalStrengthSlider.addEventListener("input", updateTextureStrengths);
        roughnessStrengthSlider.addEventListener("input", updateTextureStrengths);
        displacementStrengthSlider.addEventListener("input", updateTextureStrengths);
        aoStrengthSlider.addEventListener("input", updateTextureStrengths);
        metalnessSlider.addEventListener("input", updateMetalness);
        
        // Light position handling
        lightXSlider.addEventListener("input", updateLightPosition);
        lightYSlider.addEventListener("input", updateLightPosition);
        lightZSlider.addEventListener("input", updateLightPosition);
        
        // Model controls
        modelTypeSelect.addEventListener("change", updateModelType);
        modelScaleSlider.addEventListener("input", updateModelScale);
        
        // UI controls
        toggleGridBtn.addEventListener("click", toggleGrid);
        resetControlsBtn.addEventListener("click", resetControls);
        
        // Download buttons
        downloadBaseBtn.addEventListener("click", () => downloadTextureMap(baseMapCanvas, "basecolor-map", baseFormatSelect.value));
        downloadNormalBtn.addEventListener("click", () => downloadTextureMap(normalMapCanvas, "normal-map", normalFormatSelect.value));
        downloadRoughnessBtn.addEventListener("click", () => downloadTextureMap(roughnessMapCanvas, "roughness-map", roughnessFormatSelect.value));
        downloadDisplacementBtn.addEventListener("click", () => downloadTextureMap(displacementMapCanvas, "displacement-map", displacementFormatSelect.value));
        downloadAoBtn.addEventListener("click", () => downloadTextureMap(aoMapCanvas, "ao-map", aoFormatSelect.value));
        
        // Export handling
        exportZipBtn.addEventListener("click", exportZip);
        exportThreeJsBtn.addEventListener("click", exportThreeJsCode);
        
        // Rotation handling
        rotationXSlider.addEventListener("input", updateManualRotation);
        rotationYSlider.addEventListener("input", updateManualRotation);
        autoRotateToggle.addEventListener("click", toggleAutoRotation);
        
        // Model interaction
        modelContainer.addEventListener("mousedown", handleMouseDown);
        modelContainer.addEventListener("touchstart", handleTouchStart, { passive: false });
        
        // Handle slider interaction state
        let sliders = document.querySelectorAll('input[type="range"]');
        sliders.forEach(slider => {
            slider.addEventListener("mousedown", () => {
                manualRotationActive = true;
                document.addEventListener("mouseup", function onMouseUp() {
                    manualRotationActive = false;
                    document.removeEventListener("mouseup", onMouseUp);
                }, { once: true });
            });
            
            slider.addEventListener("touchstart", () => {
                manualRotationActive = true;
                document.addEventListener("touchend", function onTouchEnd() {
                    manualRotationActive = false;
                    document.removeEventListener("touchend", onTouchEnd);
                }, { once: true });
            });
        });
        
        // Tab switching
        navTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                // Remove active class from all tabs
                navTabs.forEach(t => t.classList.remove("active"));
                
                // Add active class to clicked tab
                tab.classList.add("active");
                
                // Show corresponding page
                let pageName = tab.dataset.page;
                
                pageContents.forEach(page => {
                    if (page.id === `${pageName}-page`) {
                        page.classList.remove("hidden");
                        
                        // Slight delay to trigger animation
                        setTimeout(() => {
                            page.style.opacity = "1";
                            page.style.transform = "translateY(0)";
                        }, 50);
                    } else {
                        page.style.opacity = "0";
                        page.style.transform = "translateY(10px)";
                        
                        // Hide after animation
                        setTimeout(() => {
                            page.classList.add("hidden");
                        }, 300);
                    }
                });
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener("keydown", (e) => {
            // Ignore if typing in an input field
            if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") {
                return;
            }
            
            switch (e.key.toLowerCase()) {
                case "r":
                    resetControls();
                    break;
                case "g":
                    toggleGrid();
                    break;
                case "a":
                    toggleAutoRotation();
                    break;
                case "e":
                    textureUploaded ? exportZip() : showNotification("Please upload a texture first", "warning");
                    break;
                case "c":
                    textureUploaded ? exportThreeJsCode() : showNotification("Please upload a texture first", "warning");
                    break;
                case "arrowleft":
                    if (mesh) {
                        mesh.rotation.y -= 0.1;
                        if (!manualRotationActive) {
                            rotationYSlider.value = mesh.rotation.y;
                        }
                    }
                    break;
                case "arrowright":
                    if (mesh) {
                        mesh.rotation.y += 0.1;
                        if (!manualRotationActive) {
                            rotationYSlider.value = mesh.rotation.y;
                        }
                    }
                    break;
                case "arrowup":
                    if (mesh) {
                        mesh.rotation.x -= 0.1;
                        if (!manualRotationActive) {
                            rotationXSlider.value = mesh.rotation.x;
                        }
                    }
                    break;
                case "arrowdown":
                    if (mesh) {
                        mesh.rotation.x += 0.1;
                        if (!manualRotationActive) {
                            rotationXSlider.value = mesh.rotation.x;
                        }
                    }
                    break;
            }
        });
    }

    // Initialize the application when DOM is ready
    init();
});

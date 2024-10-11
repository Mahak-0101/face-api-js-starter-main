window.addEventListener('load', async function() {
    const video = document.getElementById('video');

    // Load the face-api.js models from the 'models' directory
    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('./models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
        faceapi.nets.faceExpressionNet.loadFromUri('./models') // For detecting expressions
    ]);

    // Start video stream
    startVideo();

    function startVideo() {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => video.srcObject = stream)
            .catch(err => console.error("Error accessing webcam: ", err));
    }

    video.addEventListener('play', () => {
        const canvas = faceapi.createCanvasFromMedia(video);
        document.getElementById('container').append(canvas);
        const displaySize = { width: video.width, height: video.height };
        faceapi.matchDimensions(canvas, displaySize);

        // Example roll numbers and their associated image files
        const rollNumbers = {
            "Roll No: 1": './stored-images/22049C04034.jpg', // Add actual roll numbers and file paths
             "Roll No: 2": './stored-images/22049C04048.jpg', 
            // Add more roll numbers and corresponding image paths as needed
        };

        // Load images for each roll number into the face recognition model
        async function loadLabeledImages() {
            return Promise.all(
                Object.keys(rollNumbers).map(async rollNumber => {
                    const imgUrl = rollNumbers[rollNumber];
                    const img = await faceapi.fetchImage(imgUrl);
                    const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
                    if (!detections) {
                        console.error(`No face detected in image: ${imgUrl}`);
                        return null;
                    }
                    return new faceapi.LabeledFaceDescriptors(rollNumber, [detections.descriptor]);
                })
            );
        }

        loadLabeledImages().then(labeledDescriptors => {
            const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors.filter(d => d !== null), 0.6);

            // Set interval to detect faces and update information every 100ms
            setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video).withFaceLandmarks().withFaceDescriptors().withFaceExpressions();
                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                // Clear the canvas for the next frame
                canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

                resizedDetections.forEach(detection => {
                    const box = detection.detection.box;
                    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);
                    const rollNumberText = bestMatch.toString(); // Get roll number from matched result

                    // Detect user activity based on facial expressions and orientation (simplified)
                    const activity = determineActivity(detection.expressions);

                    const textField = new faceapi.draw.DrawTextField([rollNumberText, `Activity: ${activity}`], box.bottomLeft);
                    textField.draw(canvas);
                });

            }, 100); // Run every 100ms
        });
    });
});

// Function to determine user activity based on expressions (placeholder)
function determineActivity(expressions) {
    const neutral = expressions.neutral;
    const happy = expressions.happy;
    const angry = expressions.angry;

    // Simplified logic to determine activity based on expression probabilities
    if (happy > 0.5) {
        return "Active (Happy)";
    } else if (angry > 0.5) {
        return "Active (Angry)";
    } else if (neutral > 0.5) {
        return "Inactive";
    } else {
        return "Unknown";
    }
}

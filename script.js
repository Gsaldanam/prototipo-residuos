const URL = "https://teachablemachine.withgoogle.com/models/ovbVEoEWg/";

let model, webcam, labelContainer, maxPredictions;

async function init() {
    const errorContainer = document.getElementById("error-container");
    errorContainer.innerHTML = "";

    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        webcam = new tmImage.Webcam(300, 300, true);
        await webcam.setup();
        await webcam.play();
        window.requestAnimationFrame(loop);

        document.getElementById("webcam-container").appendChild(webcam.canvas);
        labelContainer = document.getElementById("label-container");
    } catch (error) {
        console.error(error);
        errorContainer.innerHTML = "Error: " + error.message;
    }
}

async function loop() {
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    const prediction = await model.predict(webcam.canvas);

    let highest = prediction.reduce((prev, current) =>
        prev.probability > current.probability ? prev : current
    );

    labelContainer.innerHTML =
        "Residuo detectado: " +
        highest.className +
        " (" +
        (highest.probability * 100).toFixed(2) +
        "%)";
}

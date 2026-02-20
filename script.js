const URL = "https://teachablemachine.withgoogle.com/models/ovbVEoEWg/";

let model, webcam, maxPredictions;
let isRunning = false;

const categoryIcons = {
    "PAPEL": "📄", "PLASTICO": "🧴", "VIDRIO": "🍶",
    "METAL": "🥫", "ORGANICO": "🍂", "ELECTRONICO": "💻",
    "CARTON": "📦", "TEXTIL": "👕", "PELIGROSO": "⚠️"
};

function getIcon(className) {
    const key = Object.keys(categoryIcons).find(k =>
        className.toUpperCase().includes(k)
    );
    return key ? categoryIcons[key] : "🗑️";
}

async function init() {
    if (isRunning) return;

    const btnStart = document.getElementById("btn-start");
    const errorBox = document.getElementById("error-container");

    errorBox.classList.remove("visible");
    errorBox.innerHTML = "";
    btnStart.disabled = true;
    btnStart.innerHTML = `Cargando modelo<span class="loading-dot">.</span><span class="loading-dot">.</span><span class="loading-dot">.</span>`;

    try {
        const modelURL = URL + "model.json";
        const metadataURL = URL + "metadata.json";

        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();

        const webcamContainer = document.getElementById("webcam-container");
        webcamContainer.innerHTML = "";

        webcam = new tmImage.Webcam(320, 320, true);
        await webcam.setup();
        await webcam.play();

        webcamContainer.appendChild(webcam.canvas);
        webcamContainer.classList.add("visible");

        document.getElementById("placeholder").classList.add("hidden");
        document.getElementById("camera-header").classList.add("visible");
        document.getElementById("label-container").classList.add("visible");
        document.getElementById("btn-stop").classList.add("visible");

        btnStart.style.display = "none";
        isRunning = true;

        window.requestAnimationFrame(loop);
    } catch (error) {
        console.error(error);
        errorBox.innerHTML = "⚠️ " + error.message;
        errorBox.classList.add("visible");
        btnStart.disabled = false;
        btnStart.innerHTML = "Iniciar Cámara";
    }
}

function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (webcam) {
        webcam.stop();
        webcam = null;
    }

    const webcamContainer = document.getElementById("webcam-container");
    webcamContainer.innerHTML = "";
    webcamContainer.classList.remove("visible");

    document.getElementById("placeholder").classList.remove("hidden");
    document.getElementById("camera-header").classList.remove("visible");
    document.getElementById("label-container").classList.remove("visible");
    document.getElementById("btn-stop").classList.remove("visible");

    const btnStart = document.getElementById("btn-start");
    btnStart.style.display = "block";
    btnStart.disabled = false;
    btnStart.innerHTML = "Iniciar Cámara";
}

async function loop() {
    if (!isRunning) return;
    webcam.update();
    await predict();
    window.requestAnimationFrame(loop);
}

async function predict() {
    if (!model || !webcam) return;

    const prediction = await model.predict(webcam.canvas);
    const highest = prediction.reduce((prev, current) =>
        prev.probability > current.probability ? prev : current
    );

    const pct = (highest.probability * 100).toFixed(1);

    document.getElementById("result-icon").textContent = getIcon(highest.className);
    document.getElementById("result-class").textContent = highest.className;
    document.getElementById("result-confidence").textContent = `Confianza: ${pct}%`;
    document.getElementById("confidence-fill").style.width = `${pct}%`;
}

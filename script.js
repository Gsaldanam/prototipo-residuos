const MODEL_URL = "https://teachablemachine.withgoogle.com/models/O1DYbPuPe/";

let model, webcam;
let isRunning = false;

const categoryIcons = {
    "PAPEL":       "\uD83D\uDCC4",
    "PLÁSTICO":    "\uD83E\uDDF4",
    "VIDRIO":      "\uD83C\uDF76",
    "METÁLICO":    "\uD83E\uDD6B",
    "ORGÁNICO":    "\uD83C\uDF42",
    "ELECTRÓNICO": "\uD83D\uDCBB",
    "CARTÓN":      "\uD83D\uDCE6",
    "TEXTIL":      "\uD83D\uDC55",
    "PELIGROSO":   "\u26A0\uFE0F"
};

function normalizeText(text) {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();
}

function getIcon(name) {
    const normalizedName = normalizeText(name);
    const key = Object.keys(categoryIcons).find(k => normalizedName.includes(normalizeText(k)));
    return key ? categoryIcons[key] : "\u267B\uFE0F";
}

function el(id) { return document.getElementById(id); }
function show(id)        { const e = el(id); if (e) e.classList.add("visible"); }
function hide(id)        { const e = el(id); if (e) e.classList.remove("visible"); }
function addCls(id, cls) { const e = el(id); if (e) e.classList.add(cls); }
function remCls(id, cls) { const e = el(id); if (e) e.classList.remove(cls); }

async function init() {
    if (isRunning) return;

    const btnStart = el("btn-start");
    const errorBox = el("error-container");

    if (errorBox) { errorBox.classList.remove("visible"); errorBox.innerHTML = ""; }
    if (btnStart) {
        btnStart.disabled = true;
        btnStart.innerHTML = 'Cargando<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>';
    }

    try {
        model = await tmImage.load(MODEL_URL + "model.json", MODEL_URL + "metadata.json");

        const container = el("webcam-container");
        if (container) container.innerHTML = "";

        webcam = new tmImage.Webcam(520, 520, true);
        await webcam.setup();
        await webcam.play();

        if (container) {
            container.appendChild(webcam.canvas);
            container.classList.add("visible");
        }

        addCls("placeholder", "hidden");
        show("scan-line");
        show("status-live");
        show("label-container");
        show("btn-stop");

        if (btnStart) btnStart.style.display = "none";
        isRunning = true;
        window.requestAnimationFrame(loop);

    } catch (err) {
        console.error(err);
        if (errorBox) { errorBox.innerHTML = "\u26A0\uFE0F " + err.message; errorBox.classList.add("visible"); }
        if (btnStart) { btnStart.disabled = false; btnStart.innerHTML = "Iniciar C\u00E1mara"; }
    }
}

function stop() {
    if (!isRunning) return;
    isRunning = false;

    if (webcam) { webcam.stop(); webcam = null; }

    const container = el("webcam-container");
    if (container) { container.innerHTML = ""; container.classList.remove("visible"); }

    remCls("placeholder", "hidden");
    hide("scan-line");
    hide("status-live");
    hide("label-container");
    hide("btn-stop");

    const btnStart = el("btn-start");
    if (btnStart) {
        btnStart.style.display = "block";
        btnStart.disabled = false;
        btnStart.innerHTML = "Iniciar C\u00E1mara";
    }
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
    const best = prediction.reduce((a, b) => a.probability > b.probability ? a : b);
    const pct  = (best.probability * 100).toFixed(1);

    const icon = el("result-icon");       if (icon) icon.textContent = getIcon(best.className);
    const name = el("result-class");      if (name) name.textContent = best.className;
    const conf = el("result-confidence"); if (conf) conf.textContent = "Confianza: " + pct + "%";
    const big  = el("result-pct-big");   if (big)  big.innerHTML = pct + '<span>%</span>';
    const bar  = el("confidence-fill");   if (bar)  bar.style.width = pct + "%";
}
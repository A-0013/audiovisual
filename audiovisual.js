//get audio and take a looksie
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();

//more audio snatching
const audio = new Audio();
audio.crossOrigin = "anonymous"; 
const source = audioContext.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioContext.destination);

document.addEventListener("DOMContentLoaded", function() {
    // use the file
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "audio/*";
    document.body.appendChild(fileInput);

    fileInput.addEventListener("change", function(e) {
        //more file using
        const file = e.target.files[0];
        if (file) {
            audio.src = URL.createObjectURL(file);
            audio.load();
        }
    });

    // make the fractal
    const canvas = document.getElementById("fractal-canvas");
    const slider = document.getElementById("julia-slider");
    function drawJuliaFractal(shift) {
        if (canvas && canvas.getContext) {
            //add canvas
            const ctx = canvas.getContext("2d");
            const width = canvas.width;
            const height = canvas.height;
            const imageData = ctx.createImageData(width, height);

            //he did the math
            const cRe = -0.8 +  (shift/300) * 0.5;
            const cIm = 0.27015 + (shift/300) * 0.5;

            const maxIter = 100;
            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    //he did the monster math
                    let zx = 1.5 * (x - width / 2) / (0.5 * width);
                    let zy = (y - height / 2) / (0.5 * height);
                    let i = 0;
                    while (zx * zx + zy * zy < 4 && i < maxIter) {
                        //he did the math
                        let tmp = zx * zx - zy * zy + cRe;
                        zy = 2.0 * zx * zy + cIm;
                        zx = tmp;
                        i++;
                    }
                    //it was a graveyard graph
                    const pixelIndex = (y * width + x) * 4;
                    const color = { r: 15, g: 0, b: 11 };
                    const blackness = 3;
                    const k = ((color.r + color.g + color.b) * blackness) / 3;
                    if (i === maxIter) {
                        imageData.data[pixelIndex] = 0;
                        imageData.data[pixelIndex + 1] = 0;
                        imageData.data[pixelIndex + 2] = 0;
                    } else {
                        imageData.data[pixelIndex] = i * color.r - k;
                        imageData.data[pixelIndex + 1] = i * color.g - k;
                        imageData.data[pixelIndex + 2] = i * color.b - k;
                    }
                    imageData.data[pixelIndex + 3] = 255;
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }
    }
    drawJuliaFractal(slider ? parseInt(slider.value) : 27);

    const freq = new Uint8Array(analyser.frequencyBinCount);

    function animate() {
    requestAnimationFrame(animate);
    analyser.getByteFrequencyData(freq);

    const bassBins = freq.slice(0, 50);
    const bass = bassBins.reduce((a, b) => a + b, 0) / bassBins.length;

    // Pick a reasonable "resting" average bass level
    const baseline = 100; // tune this until fractal sits nicely centered
    const delta = bass - baseline;

    // Scale it so it pulses but doesn’t run off screen
    const shift = Math.max(Math.min(delta * 2, 300), -300);

    drawJuliaFractal(shift);
}

    animate();

    //ninjago time claws refrence
    audio.controls = true;
    document.body.appendChild(audio);

    audio.onplay = function() {
        audioContext.resume();
    };
});

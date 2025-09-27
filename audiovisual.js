// audio setup

//nonchalant audiocontext setup
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 256;

//did someone say more audio context setup
const audio = new Audio();
audio.crossOrigin = "anonymous"; 
//are you the media element source because you're the audio
//or the audio because you're the media element source
const source = audioContext.createMediaElementSource(audio);
source.connect(analyser);
//nah I'd win
analyser.connect(audioContext.destination);

document.addEventListener("DOMContentLoaded", function() {
const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", function(e)
{
    const file = e.target.files[0];
    if (file) {
        //jam aquired
        audio.src = URL.createObjectURL(file);
        audio.load();
    }
    });

    // fractal setup
    const canvas = document.getElementById("fractal-canvas");
    const ctx = canvas.getContext("2d");
    
    // parameter map setup
    const paramCanvas = document.getElementById("parameter-canvas");
    const paramCtx = paramCanvas.getContext("2d");
    
    // julia set parameters (can be modified by clicking the parameter map)
    let baseC = { re: -0.8, im: 0.27015 };
    
    function drawParameterMap() {
        const width = paramCanvas.width;
        const height = paramCanvas.height;
        const imageData = paramCtx.createImageData(width, height);
        
        // map the canvas to complex plane (roughly -2 to 2 for both real and imaginary)
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const cRe = (x - width/2) * 4 / width;
                const cIm = (y - height/2) * 4 / height;
                
                // quick test to see if this point makes an interesting julia set
                // we'll just do a few iterations to get a rough idea
                let zx = 0, zy = 0;
                let i = 0;
                const maxIter = 50;
                while (zx * zx + zy * zy < 4 && i < maxIter) {
                    let tmp = zx * zx - zy * zy + cRe;
                    zy = 2.0 * zx * zy + cIm;
                    zx = tmp;
                    i++;
                }
                
                const pixelIndex = (y * width + x) * 4;
                // color based on iteration count for a preview
                if (i === maxIter) {
                    imageData.data[pixelIndex] = 20;     // r
                    imageData.data[pixelIndex + 1] = 20; // g  
                    imageData.data[pixelIndex + 2] = 60; // b
                } else {
                    const intensity = (i / maxIter) * 255;
                    imageData.data[pixelIndex] = intensity * 0.3;
                    imageData.data[pixelIndex + 1] = intensity * 0.6;
                    imageData.data[pixelIndex + 2] = intensity * 0.9;
                }
                imageData.data[pixelIndex + 3] = 255; // alpha
            }
        }
        paramCtx.putImageData(imageData, 0, 0);
        
        // draw crosshairs at current selection
        paramCtx.strokeStyle = '#ff0000';
        paramCtx.lineWidth = 2;
        const currentX = (baseC.re * paramCanvas.width / 4) + paramCanvas.width/2;
        const currentY = (baseC.im * paramCanvas.height / 4) + paramCanvas.height/2;
        
        // draw crosshairs
        paramCtx.beginPath();
        paramCtx.moveTo(currentX - 10, currentY);
        paramCtx.lineTo(currentX + 10, currentY);
        paramCtx.moveTo(currentX, currentY - 10);
        paramCtx.lineTo(currentX, currentY + 10);
        paramCtx.stroke();
    }
    
    // add click handler for parameter map
    paramCanvas.addEventListener('click', (e) => {
        const rect = paramCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // convert click position to complex number
        baseC.re = (x - paramCanvas.width/2) * 4 / paramCanvas.width;
        baseC.im = (y - paramCanvas.height/2) * 4 / paramCanvas.height;
        
        // redraw parameter map with new crosshairs
        drawParameterMap();
    });

    function drawJuliaFractal(shift) {
        //set the canvas size up
        //I actually fully understood what I wrote here
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.createImageData(width, height);

        //set parameters, imaginary and real parts (now with audio modulation)
        const cRe = baseC.re + (shift/300) * 0.5;
        const cIm = baseC.im + (shift/300) * 0.4;

        const maxIter = 100;
        //keep cycling thru the stuff to draw picture
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                let zx = 1.5 * (x - width / 2) / (0.5 * width);
                let zy = (y - height / 2) / (0.5 * height);
                let i = 0;
            while (zx * zx + zy * zy < 4 && i < maxIter) {
                let tmp = zx * zx - zy * zy + cRe;
                zy = 2.0 * zx * zy + cIm;
                zx = tmp;
                i++;
            }
            //jk I lied we draw the picture here
            const pixelIndex = (y * width + x) * 4;
            //you can also mess with like any of this for a cooler picture
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
        //you can put 26-7 here
        drawJuliaFractal(27);

        //set up the bar stuff (it took so long)
        const freq = new Uint8Array(analyser.frequencyBinCount);

        //yes I did actully use a ton of divs and called it that
        //I like divs
        //and I can center them
        //oooohh scary
        const bars = document.querySelectorAll('.bar');

        // selection state
        let selStart = null;
        let selEnd = null;

        //this is top 10 worst ways to program something oat who cares tho
        function updateSelection() {
        bars.forEach((bar, i) => {
            //what w3 schools does to a mfer
            const inRange = selStart !== null && selEnd !== null && i >= Math.min(selStart, selEnd) && i <= Math.max(selStart, selEnd);
            bar.classList.toggle("selected", inRange);
        });
      }

      //select the bars
        bars.forEach((bar, i) => {
        bar.addEventListener("click", () => {
            if (selStart === null) {
                //set the starting point for selection
                selStart = i;
                selEnd = i;
            }
            else if (i === selStart) {
                //reset selection
                selStart = null;
                selEnd = null;
            }
            else {
                //select it
                selEnd = i;
            }
            updateSelection();
        });
    });

    function animate() {
        requestAnimationFrame(animate);
        analyser.getByteFrequencyData(freq);

        // change the fractal based on the range given by eq bars
        const chunkSize = Math.floor(freq.length / bars.length);
        let selectedValues = [];
        
        // FIX: Only process if we have a valid selection, and ensure proper range
        if (selStart !== null && selEnd !== null) {
            const startIdx = Math.min(selStart, selEnd);
            const endIdx = Math.max(selStart, selEnd);
            
            for (let i = startIdx; i <= endIdx; i++) {
                //figure out size and then average
                const start = i * chunkSize;
                const end = start + chunkSize;
                const slice = freq.slice(start, end);
                const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
                selectedValues.push(avg);
            }
        }
        
        //define variables for everything because who care about memory you're probably running this on chrome anyway
        const avgSelected = selectedValues.length > 0 ? selectedValues.reduce((a,b)=>a+b,0)/selectedValues.length : 0;

        const baseline = 100;
        const delta = avgSelected - baseline;
        const shift = Math.max(Math.min(delta * 2, 300), -300);
        drawJuliaFractal(shift);

        //more bar stuff, which seems redundant but breaks it if I don't add it
        bars.forEach((bar, i) => {
            const start = i * chunkSize;
            const end = start + chunkSize;
            const slice = freq.slice(start, end);
            //more math
            const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
            const percent = avg / 255;
            bar.style.height = `${10 + percent * 90}px`;
            //if you're wondering why some of this code is bad and some looks good, I only had to google like 40% of it, the other 60% was stuff I remmebered from freshman year
        });
    }

    animate();

    //5th season ninjago refrence
    audio.controls = true;
    document.body.appendChild(audio);

    audio.onplay = function() {
        audioContext.resume();
    };
})
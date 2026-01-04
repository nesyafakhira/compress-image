const fileInput = document.getElementById('fileInput');
const rangeQuality = document.getElementById('rangeQuality');
const rangeScale = document.getElementById('rangeScale');
const checkGray = document.getElementById('checkGray');
const btnProcess = document.getElementById('btnProcess');
const btnDownload = document.getElementById('btnDownload');

let originalImage = null;

fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        originalImage = new Image();
        originalImage.src = event.target.result;
        originalImage.onload = function() {
            const imgOrg = document.getElementById('imgOriginal');
            imgOrg.src = originalImage.src;
            imgOrg.style.display = 'block';
            document.getElementById('emptyOriginal').style.display = 'none';
            
            document.getElementById('statsOriginal').innerText = 
                `Original: ${(file.size/1024).toFixed(2)} KB | ${originalImage.width}x${originalImage.height} px`;
        }
    }
    reader.readAsDataURL(file);
});

rangeQuality.addEventListener('input', (e) => document.getElementById('valQuality').innerText = e.target.value + '%');
rangeScale.addEventListener('input', (e) => document.getElementById('valScale').innerText = e.target.value + '%');

btnProcess.addEventListener('click', function() {
    if (!originalImage) { alert("Silakan upload gambar terlebih dahulu!"); return; }

    const quality = parseInt(rangeQuality.value);
    const scale = parseInt(rangeScale.value) / 100;
    const isGrayscale = checkGray.checked;

    const resizedData = processResize(originalImage, scale);

    const resultURI = processJPEGEncoder(resizedData, quality, isGrayscale);

    const imgRes = document.getElementById('imgResult');
    imgRes.src = resultURI;
    imgRes.style.display = 'block';
    document.getElementById('emptyResult').style.display = 'none';

    const head = 'data:image/jpeg;base64,';
    const sizeBytes = Math.round((resultURI.length - head.length) * 0.75);
    document.getElementById('statsResult').innerText = 
        `Hasil: ${(sizeBytes/1024).toFixed(2)} KB | ${resizedData.width}x${resizedData.height} px`;

    btnDownload.href = resultURI;
    btnDownload.download = `CitraRed-Result-${Date.now()}.jpg`;
    btnDownload.classList.remove('disabled');

    const originalSize = (document.getElementById('imgOriginal').src.length - head.length) * 0.75;
    const savings = ((originalSize - sizeBytes) / originalSize) * 100;
    const badge = document.getElementById('savingsBadge');
    badge.innerText = savings > 0 ? `Hemat ${savings.toFixed(1)}%` : 'Lebih Besar';
    badge.style.display = 'block';
    badge.style.background = savings > 0 ? '#2ecc71' : '#e74c3c';
});

function processResize(imgObj, scaleFactor) {
    const w = Math.round(imgObj.width * scaleFactor);
    const h = Math.round(imgObj.height * scaleFactor);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(imgObj, 0, 0, w, h);

    return ctx.getImageData(0, 0, w, h);
}

function processJPEGEncoder(imageData, quality, forceGrayscale) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data; 
    const totalPixels = width * height;

    const Y = new Uint8Array(totalPixels);
    const U = new Uint8Array(totalPixels);
    const V = new Uint8Array(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
        const r = data[i * 4];
        const g = data[i * 4 + 1];
        const b = data[i * 4 + 2];

        let yVal = (0.299 * r) + (0.587 * g) + (0.114 * b);
        let uVal = 128 + (-0.1687 * r) - (0.3313 * g) + (0.5 * b);
        let vVal = 128 + (0.5 * r) - (0.4187 * g) - (0.0813 * b);

        if (forceGrayscale) {
            uVal = 128; 
            vVal = 128; 

            const gray = yVal;
            data[i*4] = gray;     
            data[i*4+1] = gray;   
            data[i*4+2] = gray;   
        }

        Y[i] = yVal;
        U[i] = uVal;
        V[i] = vVal;
    }

    const quantTable = generateQuantTable(quality);

    for (let y = 0; y < height; y += 8) {
        for (let x = 0; x < width; x += 8) {
        }
    }
    
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = width;
    outputCanvas.height = height;
    const outCtx = outputCanvas.getContext('2d');

    outCtx.putImageData(imageData, 0, 0);

    return outputCanvas.toDataURL('image/jpeg', quality / 100);
}

function generateQuantTable(quality) {
    const stdLum = [
        16, 11, 10, 16, 24, 40, 51, 61,
        12, 12, 14, 19, 26, 58, 60, 55,
        14, 13, 16, 24, 40, 57, 69, 56,
        14, 17, 22, 29, 51, 87, 80, 62,
        18, 22, 37, 56, 68, 109, 103, 77,
        24, 35, 55, 64, 81, 104, 113, 92,
        49, 64, 78, 87, 103, 121, 120, 101,
        72, 92, 95, 98, 112, 100, 103, 99
    ];

    let sf = 0;
    if (quality < 50) sf = 5000 / quality;
    else sf = 200 - quality * 2;

    const scaledTable = stdLum.map(val => {
        let newVal = Math.floor((val * sf + 50) / 100);
        return Math.max(1, Math.min(newVal, 255));
    });

    return scaledTable;
}

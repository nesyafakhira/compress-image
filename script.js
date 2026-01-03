const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const rangeQuality = document.getElementById('rangeQuality');
const rangeScale = document.getElementById('rangeScale');
const checkGray = document.getElementById('checkGray');
const btnProcess = document.getElementById('btnProcess');
const btnDownload = document.getElementById('btnDownload');

const valQuality = document.getElementById('valQuality');
const valScale = document.getElementById('valScale');

let originalImage = null;

rangeQuality.addEventListener('input', (e) => valQuality.innerText = e.target.value + '%');
rangeScale.addEventListener('input', (e) => valScale.innerText = e.target.value + '%');

fileInput.addEventListener('change', handleFileSelect);

btnProcess.addEventListener('click', processImage);

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
        alert('Mohon pilih file gambar (JPG atau PNG)!');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(event) {
        originalImage = new Image();
        originalImage.src = event.target.result;

        originalImage.onload = function() {
            const imgPreview = document.getElementById('imgOriginal');
            imgPreview.src = originalImage.src;
            imgPreview.style.display = 'block';
            document.getElementById('emptyOriginal').style.display = 'none';

            const sizeKB = (file.size / 1024).toFixed(2);
            document.getElementById('statsOriginal').innerText = `Size: ${sizeKB} KB | Dimensi: ${originalImage.width}x${originalImage.height}`;

            resetResult();
        }
    }
    reader.readAsDataURL(file);
}

function resetResult() {
    document.getElementById('imgResult').style.display = 'none';
    document.getElementById('emptyResult').style.display = 'block';
    document.getElementById('statsResult').innerText = 'Size: - | Dimensi: -';
    document.getElementById('savingsBadge').style.display = 'none';
    btnDownload.classList.add('disabled');
}

function processImage() {
    if (!originalImage) {
        alert('Silakan upload gambar terlebih dahulu!');
        return;
    }

    const quality = parseInt(rangeQuality.value) / 100; // 0.1 - 1.0
    const scale = parseInt(rangeScale.value) / 100;     // 0.1 - 1.0
    const isGrayscale = checkGray.checked;

    const targetWidth = Math.round(originalImage.width * scale);
    const targetHeight = Math.round(originalImage.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(originalImage, 0, 0, targetWidth, targetHeight);

    if (isGrayscale) {
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imageData.data; 

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            const gray = (0.299 * r) + (0.587 * g) + (0.114 * b);

            data[i] = gray;     
            data[i+1] = gray;   
            data[i+2] = gray;   
        }
        ctx.putImageData(imageData, 0, 0);
    }

    const resultDataUrl = canvas.toDataURL('image/jpeg', quality);

    const imgResult = document.getElementById('imgResult');
    imgResult.src = resultDataUrl;
    imgResult.style.display = 'block';
    document.getElementById('emptyResult').style.display = 'none';

    const head = 'data:image/jpeg;base64,';
    const sizeBytes = Math.round((resultDataUrl.length - head.length) * 0.75);
    const sizeKB = (sizeBytes / 1024).toFixed(2);

    const originalSizeEstimate = (document.getElementById('imgOriginal').src.length - head.length) * 0.75;
    const savings = ((originalSizeEstimate - sizeBytes) / originalSizeEstimate) * 100;

    document.getElementById('statsResult').innerText = `Size: ${sizeKB} KB | Dimensi: ${targetWidth}x${targetHeight}`;
    
    const badge = document.getElementById('savingsBadge');
    if (savings > 0) {
        badge.innerText = `Hemat ${savings.toFixed(1)}%`;
        badge.style.display = 'block';
        badge.style.background = '#2ecc71'; // Hijau
    } else {
        badge.innerText = `Lebih Besar`;
        badge.style.display = 'block';
        badge.style.background = '#e74c3c'; // Merah
    }

    btnDownload.href = resultDataUrl;
    btnDownload.download = `CitraRed_Result_${new Date().getTime()}.jpg`;
    btnDownload.classList.remove('disabled');
}
class FloatExporter {
    constructor(audioData = new Float32Array([]), sampleRate = 48000) {
        if (!(audioData instanceof Float32Array)) {
            console.error("Input must be a Float32Array.")
            this.audioData = new Float32Array([])
        } else {
            this.audioData = audioData
        }
        this.sampleRate = sampleRate
        this.backupData = new Float32Array(this.audioData)
    }

    convertToWav(exp = "blob") {
        const numChannels = 1;
        const buffer = new ArrayBuffer(44 + this.audioData.length * 2)
        const view = new DataView(buffer)
        writeString(view, 0, 'RIFF')
        view.setUint32(4, 36 + this.audioData.length * 2, true)
        writeString(view, 8, 'WAVE')
        writeString(view, 12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true) // PCM format
        view.setUint16(22, numChannels, true)
        view.setUint32(24, this.sampleRate, true)
        view.setUint32(28, this.sampleRate * 2, true)
        view.setUint16(32, 2, true)
        view.setUint16(34, 16, true) // 16-bit samples
        writeString(view, 36, 'data')
        view.setUint32(40, this.audioData.length * 2, true)
        let offset = 44
        for (let i = 0; i < this.audioData.length; i++) {
            view.setInt16(offset, Math.max(-32768, Math.min(32767, this.audioData[i] * 32767)), true)
            offset += 2
        }
        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i))
            }
        }
        return exp === "blob" ? new Blob([view], { type: 'audio/wav' }) : exp === "dataview" ? view : undefined
    }
}

document.getElementById('generateSound').addEventListener('click', async () => {
    const input = document.getElementById('imageInput');
    const file = input.files[0];

    if (!file) {
        alert('Please upload an image.');
        return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const floatArray = new Float32Array(canvas.width * canvas.height);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            floatArray[i / 4] = (r + g + b + a / 510) - 1;
        }

        const exporter = new FloatExporter(floatArray);
        const wavBlob = exporter.convertToWav();
        
        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = URL.createObjectURL(wavBlob);
        downloadLink.download = 'output.wav';
        downloadLink.style.display = 'block';
        downloadLink.textContent = 'Download WAV';
    };
});

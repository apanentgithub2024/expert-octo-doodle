class FloatExporter {
    constructor(audioData = new Float32Array([]), sampleRate = 48000) {
        if (!(audioData instanceof Float32Array)) {
            console.error("Input must be a Float32Array.");
            this.audioData = new Float32Array([]);
        } else {
            this.audioData = audioData;
        }
        this.sampleRate = sampleRate;
        this.backupData = new Float32Array(this.audioData);
    }

    convertToWav(exp = "blob") {
        const numChannels = 1;
        const buffer = new ArrayBuffer(44 + this.audioData.length * 2);
        const view = new DataView(buffer);

        // RIFF chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + this.audioData.length * 2, true); // File size minus first 8 bytes
        this.writeString(view, 8, 'WAVE');

        // FMT sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Sub-chunk size (16 for PCM)
        view.setUint16(20, 1, true); // Audio format (1 = PCM)
        view.setUint16(22, numChannels, true); // Number of channels
        view.setUint32(24, this.sampleRate, true); // Sample rate
        view.setUint32(28, this.sampleRate * 2, true); // Byte rate (SampleRate * NumChannels * BitsPerSample/8)
        view.setUint16(32, 2, true); // Block align (NumChannels * BitsPerSample/8)
        view.setUint16(34, 16, true); // Bits per sample

        // Data sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, this.audioData.length * 2, true); // Sub-chunk 2 size (NumSamples * NumChannels * BitsPerSample/8)

        // Write PCM data
        let offset = 44;
        for (let i = 0; i < this.audioData.length; i++) {
            const s = Math.max(-1, Math.min(1, this.audioData[i]));
            view.setInt16(offset, s < 0 ? s * 32768 : s * 32767, true); // Convert float to 16-bit PCM
            offset += 2;
        }

        return exp === "blob" ? new Blob([view], { type: 'audio/wav' }) : exp === "dataview" ? view : undefined;
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}

document.getElementById('generateSound').addEventListener('click', async () => {
    const input = document.getElementById('imageInput');
    const file = input.files[0];

    if (!file) {
        alert('Please upload any file.');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        const floatArray = new Float32Array(arrayBuffer);

        const exporter = new FloatExporter(floatArray);
        const wavBlob = exporter.convertToWav();

        const downloadLink = document.getElementById('downloadLink');
        downloadLink.href = URL.createObjectURL(wavBlob);
        downloadLink.download = 'output.wav';
        downloadLink.style.display = 'block';
        downloadLink.textContent = 'Download WAV';

        document.getElementById("audio").src = downloadLink.href;
    };

    reader.readAsArrayBuffer(file);
});

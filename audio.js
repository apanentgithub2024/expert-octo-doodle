class AudioProcessor {
	constructor(audioData = new Float32Array([]), sampleRate = 48000) {
		if (!(audioData instanceof Float32Array)) {
			console.error("Input must be a Float32Array.")
			this.audioData = new Float32Array([])
		} else {
			this.audioData = audioData
		}
		this.sampleRate = sampleRate
		this.backupData = new Float32Array(this.audioData)
		this.FX = {
			normalize: () => {
				if (this.audioData.length === 0) return
				let max = 0, min = 0
				for (let i = 0; i < this.audioData.length; i++) {
					max = max < this.audioData[i] ? this.audioData[i] : max
					min = min > this.audioData[i] ? this.audioData[i] : min
				}
				const maxAbs = Math.max(Math.abs(max), Math.abs(min))
				if (maxAbs === 0) return
				for (let i = 0; i < this.audioData.length; i++) {
					this.audioData[i] /= maxAbs
				}
			},
			applyGain: gain => {
				if (gain < 0) {
					console.warn("Gain should be a non-negative value.")
					return
				}
				for (let i = 0; i < this.audioData.length; i++) {
					this.audioData[i] = Math.max(-1, Math.min(1, this.audioData[i] * gain))
				}
			},
			forbiddenFaster: factor => {
				console.warn("This method is intended for playful purposes! If you want a more advanced way of boosting the audio's speed, use another method instead.")
				this.audioData = new Float32Array(Array.from(this.audioData).filter((_, i) => i % factor === 0))
			},
			fadeIn: (duration = 48000) => {
				const durat = Math.min(duration, this.audioData.length)
				for (let i = 0; i < durat; i++) {
					this.audioData[i] *= i / duration
				}
			},
			fadeOut: (duration = 48000) => {
				const durat = Math.max(this.audioData.length - duration, 0)
				for (let i = this.audioData.length - 1; i >= durat; i--) {
					this.audioData[i] *= (this.audioData.length - i) / duration
				}
			},
			combineAudioSynchronously: (audioData = new Float32Array([])) => {
				if (!(audioData instanceof Float32Array)) {
					console.error("Input must be a Float32Array.")
					audioData = new Float32Array([])
				}
				const oldAudioData = new Float32Array(this.audioData.length + audioData.length)
				oldAudioData.set(this.audioData)
				oldAudioData.set(audioData, this.audioData.length)
				this.audioData = oldAudioData
			},
			combineAudioAsynchronously: (audioData = new Float32Array([])) => {
				if (!(audioData instanceof Float32Array)) {
					console.error("Input must be a Float32Array.")
					audioData = new Float32Array([])
				}
				const oldAudioData = new Float32Array(Math.max(this.audioData.length, audioData.length))
				for (let i = 0; i < oldAudioData.length; i++) {
					oldAudioData[i] = ((this.audioData[i] || 0) + (audioData[i] || 0)) / 2
				}
				this.audioData = oldAudioData
			},
			reverse: () => {
				this.audioData = new Float32Array([...this.audioData].reverse())
			},
			echo: (layers = 3, samplesDelay = 300) => {
				if (layers <= 0 || samplesDelay <= 0) return
				const totalLength = this.audioData.length + (samplesDelay * layers)
				const newData = new Float32Array(totalLength)
				newData.set(this.audioData)
				for (let i = 1; i <= layers; i++) {
					const delayOffset = i * samplesDelay
					for (let j = 0; j < this.audioData.length; j++) {
						const index = j + delayOffset
						if (index < totalLength) {
							newData[index] += this.audioData[j] * Math.pow(0.5, i)
						}
					}
				}
				this.audioData = newData
			},
			quantize: (bits = 256) => {
				if (![4, 8, 16, 32, 64, 128, 256].includes(bits)) {
					console.warn("The bits must be squared (exponentially).")
					return
				}
				this.audioData = new Float32Array([...this.audioData].map(sample => Math.round(sample * bits) / bits))
			},
			chop: (bits = 256) => {
				if (![4, 8, 16, 32, 64, 128, 256].includes(bits)) {
					console.warn("The bits must be squared (exponentially).")
					return
				}
				this.audioData = new Float32Array([...this.audioData].map(sample => Math.trunc(sample * bits) / bits)) // 0.5 would be 1, while -0.5 would be -1
			}
		}
	}
	load(array) {
		if (!(array instanceof Float32Array)) {
			console.error("Input must be a Float32Array.")
			return
		}
		this.audioData = array
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
		return exp == "blob" ? new Blob([view], {type: 'audio/wav'}) : exp == "dataview" ? view : undefined
	}
	restore() {
		this.audioData = new Float32Array(this.backupData)
	}
	static sampleStatic(length = 48000) {
		return new AudioProcessor(new Float32Array(new Array(length, () => Math.random() * 2 - 1)))
	}
}

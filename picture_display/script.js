const config = {
	cellSize: 12,
	revealRadius: 88,
	trailDuration: 240,
	frameRate: 30,
	density: 0.88,
}

function getContainMetrics(boxWidth, boxHeight, imageWidth, imageHeight) {
	const scale = Math.min(boxWidth / imageWidth, boxHeight / imageHeight)
	const width = imageWidth * scale
	const height = imageHeight * scale
	return {
		width,
		height,
		offsetX: (boxWidth - width) * 0.5,
		offsetY: (boxHeight - height) * 0.5,
	}
}

function initPixelReveal(container) {
	const overlay = container.querySelector('.pixel-overlay')
	if (!overlay) return

	const overlaySrc = '../torgrimstudios.png'
	const overlayImage = new Image()
	overlayImage.decoding = 'async'
	overlayImage.src = overlaySrc

	const state = {
		cells: [],
		pointerX: 0,
		pointerY: 0,
		inside: false,
		lastFrame: 0,
		frameInterval: 1000 / config.frameRate,
	}

	const radiusSquared = config.revealRadius * config.revealRadius

	function buildGrid() {
		if (!overlayImage.naturalWidth || !overlayImage.naturalHeight) return

		const rect = container.getBoundingClientRect()
		const width = Math.max(1, Math.floor(rect.width))
		const height = Math.max(1, Math.floor(rect.height))
		const cols = Math.ceil(width / config.cellSize)
		const rows = Math.ceil(height / config.cellSize)
		const imageFit = getContainMetrics(
			width,
			height,
			overlayImage.naturalWidth,
			overlayImage.naturalHeight,
		)

		overlay.innerHTML = ''
		state.cells = []

		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const x = col * config.cellSize
				const y = row * config.cellSize
				const w = Math.min(config.cellSize, width - x)
				const h = Math.min(config.cellSize, height - y)

				const cell = document.createElement('span')
				cell.className = 'pixel-cell'
				cell.style.left = `${x}px`
				cell.style.top = `${y}px`
				cell.style.width = `${w}px`
				cell.style.height = `${h}px`
				cell.style.backgroundImage = `url("${overlaySrc}")`
				cell.style.backgroundSize = `${imageFit.width}px ${imageFit.height}px`
				cell.style.backgroundPosition = `${imageFit.offsetX - x}px ${imageFit.offsetY - y}px`
				overlay.appendChild(cell)

				state.cells.push({
					element: cell,
					centerX: x + w * 0.5,
					centerY: y + h * 0.5,
					visibleUntil: 0,
					isOn: false,
				})
			}
		}
	}

	function stamp(now) {
		if (!state.inside) return
		for (const cell of state.cells) {
			const dx = state.pointerX - cell.centerX
			const dy = state.pointerY - cell.centerY
			const distanceSquared = dx * dx + dy * dy
			if (distanceSquared > radiusSquared) continue
			if (Math.random() > config.density) continue

			const distanceRatio = 1 - distanceSquared / radiusSquared
			cell.visibleUntil = Math.max(
				cell.visibleUntil,
				now + config.trailDuration + distanceRatio * 95,
			)
		}
	}

	function tick(now) {
		if (now - state.lastFrame < state.frameInterval) {
			requestAnimationFrame(tick)
			return
		}
		state.lastFrame = now

		stamp(now)
		for (const cell of state.cells) {
			const nextState = cell.visibleUntil > now
			if (nextState === cell.isOn) continue
			cell.isOn = nextState
			cell.element.classList.toggle('is-on', nextState)
		}

		requestAnimationFrame(tick)
	}

	function updatePointer(event) {
		const rect = container.getBoundingClientRect()
		state.pointerX = event.clientX - rect.left
		state.pointerY = event.clientY - rect.top
	}

	container.addEventListener('pointerenter', event => {
		state.inside = true
		updatePointer(event)
	})

	container.addEventListener('pointermove', event => {
		updatePointer(event)
	})

	container.addEventListener('pointerleave', () => {
		state.inside = false
	})

	let resizeTimer = 0
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer)
		resizeTimer = window.setTimeout(buildGrid, 120)
	})

	overlayImage.addEventListener('load', buildGrid)
	if (overlayImage.complete && overlayImage.naturalWidth) buildGrid()
	requestAnimationFrame(tick)
}

document.addEventListener('DOMContentLoaded', () => {
	document.querySelectorAll('.hover-img').forEach(container => {
		initPixelReveal(container)
	})
})

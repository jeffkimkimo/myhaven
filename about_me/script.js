gsap.registerPlugin(SplitText, ScrambleTextPlugin)

document.querySelectorAll('.text-block').forEach(root => {
	const p = root.querySelector('p')
	if (!p) return

	const radius = parseFloat(root.dataset.radius || '100')
	const duration = parseFloat(root.dataset.duration || '1.2')
	const speed = parseFloat(root.dataset.speed || '0.5')
	const scrambleChars = root.dataset.scrambleChars || '.:'
	const maxFps = Math.max(
		10,
		Math.min(60, parseFloat(root.dataset.maxFps || '30')),
	)

	const split = SplitText.create(p, { type: 'chars', charsClass: 'char' })
	const chars = split.chars

	for (let i = 0; i < chars.length; i++) {
		const c = chars[i]
		c.dataset.content = c.innerHTML
	}

	let centers = new Array(chars.length)
	let dirty = true

	const recalc = () => {
		const rr = root.getBoundingClientRect()
		for (let i = 0; i < chars.length; i++) {
			const r = chars[i].getBoundingClientRect()
			centers[i] = {
				x: r.left - rr.left + r.width / 2,
				y: r.top - rr.top + r.height / 2,
			}
		}
		dirty = false
	}

	const markDirty = () => {
		dirty = true
	}

	let mx = 0
	let my = 0
	let inside = false

	const setPointer = (clientX, clientY) => {
		const rr = root.getBoundingClientRect()
		mx = clientX - rr.left
		my = clientY - rr.top
		inside = mx >= 0 && my >= 0 && mx <= rr.width && my <= rr.height
	}

	const onMove = e => setPointer(e.clientX, e.clientY)
	const onTouch = e => {
		const t = e.touches[0]
		if (!t) return
		setPointer(t.clientX, t.clientY)
	}

	root.addEventListener('pointermove', onMove)
	root.addEventListener('pointerenter', onMove)
	root.addEventListener('pointerleave', () => {
		inside = false
	})
	window.addEventListener('touchmove', onTouch, { passive: true })

	const debouncedResize = (() => {
		let id = 0
		return () => {
			clearTimeout(id)
			id = setTimeout(markDirty, 100)
		}
	})()

	window.addEventListener('resize', debouncedResize)
	window.addEventListener('scroll', markDirty, { passive: true })

	const lastKick = new Float32Array(chars.length)
	const r2 = radius * radius
	const minInterval = 70

	let lastFrame = 0
	const frameInterval = 1000 / maxFps

	const tick = () => {
		const now = performance.now()
		if (now - lastFrame < frameInterval) return
		lastFrame = now

		if (!inside) return
		if (dirty) recalc()

		for (let i = 0; i < chars.length; i++) {
			const c = centers[i]
			const dx = mx - c.x
			const dy = my - c.y
			if (dx > radius || dx < -radius || dy > radius || dy < -radius) continue
			const d2 = dx * dx + dy * dy
			if (d2 >= r2) continue

			if (now - lastKick[i] < minInterval) continue
			lastKick[i] = now

			const d = Math.sqrt(d2)
			gsap.to(chars[i], {
				overwrite: true,
				duration: duration * (1 - d / radius),
				scrambleText: {
					text: chars[i].dataset.content || '',
					chars: scrambleChars,
					speed,
				},
				ease: 'none',
			})
		}
	}

	gsap.ticker.add(tick)

	root._scrambleCleanup = () => {
		gsap.ticker.remove(tick)
		root.removeEventListener('pointermove', onMove)
		root.removeEventListener('pointerenter', onMove)
		window.removeEventListener('touchmove', onTouch)
		window.removeEventListener('resize', debouncedResize)
		window.removeEventListener('scroll', markDirty)
		split.revert()
	}
})

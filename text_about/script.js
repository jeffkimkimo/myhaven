gsap.registerPlugin(ScrollTrigger, SplitText)

const dist = (a, b) => {
	const dx = b.x - a.x
	const dy = b.y - a.y
	return Math.sqrt(dx * dx + dy * dy)
}

const getAttr = (d, m, min, max) => {
	const v = max - Math.abs((max * d) / m)
	return Math.max(min, v + min)
}

const debounce = (fn, t) => {
	let id
	return () => {
		clearTimeout(id)
		id = setTimeout(fn, t)
	}
}

function createTextPressure(
	el,
	{
		width = true,
		weight = true,
		italic = true,
		alpha = false,
		flex = true,
		scale = false,
		minFontSize = 36,
	} = {},
) {
	const text = el.dataset.text || ''
	const chars = text.split('')

	const title = document.createElement('h1')
	title.className = `pressure-title${flex ? ' flex' : ''}`
	title.style.fontFamily = 'Compressa VF'

	const spans = chars.map(ch => {
		const s = document.createElement('span')
		s.textContent = ch === ' ' ? '\u00A0' : ch
		title.appendChild(s)
		return s
	})

	el.innerHTML = ''
	el.appendChild(title)

	const mouse = { x: 0, y: 0 }
	const cursor = { x: 0, y: 0 }

	const center = () => {
		const r = el.getBoundingClientRect()
		mouse.x = r.left + r.width / 2
		mouse.y = r.top + r.height / 2
		cursor.x = mouse.x
		cursor.y = mouse.y
	}

	const resize = () => {
		const r = el.getBoundingClientRect()
		let fs = r.width / (chars.length / 2)
		fs = Math.max(fs, minFontSize)
		title.style.fontSize = `${fs}px`
		title.style.transform = 'scale(1,1)'

		if (!scale) return
		requestAnimationFrame(() => {
			const tr = title.getBoundingClientRect()
			const y = r.height / tr.height
			title.style.transform = `scale(1,${y})`
			title.style.lineHeight = y
		})
	}

	const onMove = e => {
		cursor.x = e.clientX
		cursor.y = e.clientY
	}

	const onTouch = e => {
		const t = e.touches[0]
		cursor.x = t.clientX
		cursor.y = t.clientY
	}

	center()
	resize()

	window.addEventListener('mousemove', onMove)
	window.addEventListener('touchmove', onTouch, { passive: true })
	window.addEventListener('resize', debounce(resize, 100))

	let raf
	const animate = () => {
		mouse.x += (cursor.x - mouse.x) / 15
		mouse.y += (cursor.y - mouse.y) / 15

		const r = title.getBoundingClientRect()
		const max = r.width / 2

		spans.forEach(span => {
			const b = span.getBoundingClientRect()
			const c = { x: b.x + b.width / 2, y: b.y + b.height / 2 }
			const d = dist(mouse, c)

			const wdth = width ? Math.floor(getAttr(d, max, 5, 200)) : 100
			const wght = weight ? Math.floor(getAttr(d, max, 100, 900)) : 400
			const italVal = italic ? getAttr(d, max, 0, 1).toFixed(2) : 0
			const alphaVal = alpha ? getAttr(d, max, 0, 1).toFixed(2) : 1

			span.style.fontVariationSettings = `'wght' ${wght}, 'wdth' ${wdth}, 'ital' ${italVal}`
			span.style.opacity = alphaVal
		})

		raf = requestAnimationFrame(animate)
	}

	ScrollTrigger.create({
		trigger: el,
		start: 'top 85%',
		once: true,
		onEnter: () =>
			gsap.fromTo(
				title,
				{ opacity: 0, y: 20 },
				{ opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
			),
	})

	animate()

	return () => cancelAnimationFrame(raf)
}

createTextPressure(document.querySelector('#pressure'))

document.addEventListener('DOMContentLoaded', () => {
	const hasGsap =
		typeof window.gsap !== 'undefined' &&
		typeof window.ScrollTrigger !== 'undefined'
	const cardContainer = document.querySelector('.card-container')
	const stickyHeader = document.querySelector('.sticky-header h1')

	let isGapAnimationCompleted = false
	let isFlipAnimationCompleted = false
	let hasReachedScrollEnd = false
	let mediaContext = null
	let endCheckTimer = null
	let touchY = null

	const getDocumentHeight = () => {
		const doc = document.documentElement
		const body = document.body
		return Math.max(
			doc.scrollHeight,
			body.scrollHeight,
			doc.offsetHeight,
			body.offsetHeight,
			doc.clientHeight,
		)
	}

	const getScrollTop = () => {
		return (
			window.scrollY ||
			document.documentElement.scrollTop ||
			document.body.scrollTop ||
			0
		)
	}

	const notifyScrollEnd = () => {
		if (hasReachedScrollEnd) return

		const viewportHeight = window.innerHeight || document.documentElement.clientHeight
		const scrollHeight = getDocumentHeight()
		const scrollTop = getScrollTop()
		const canScroll = scrollHeight > viewportHeight + 2
		const reachedEnd = !canScroll || scrollTop + viewportHeight >= scrollHeight - 16

		if (!reachedEnd) return
		hasReachedScrollEnd = true
		window.parent.postMessage({ type: 'intro-scroll-end' }, '*')
	}

	const startEndCheckLoop = () => {
		if (endCheckTimer !== null) {
			window.clearInterval(endCheckTimer)
			endCheckTimer = null
		}

		endCheckTimer = window.setInterval(() => {
			notifyScrollEnd()
			if (!hasReachedScrollEnd) {
				return
			}
			window.clearInterval(endCheckTimer)
			endCheckTimer = null
		}, 180)
	}

	const initAnimations = () => {
		if (!hasGsap || !cardContainer || !stickyHeader) {
			return
		}

		if (mediaContext) {
			mediaContext.revert()
			mediaContext = null
		}

		ScrollTrigger.getAll().forEach(trigger => trigger.kill())
		mediaContext = gsap.matchMedia()

		mediaContext.add('(max-width: 999px)', () => {
			document
				.querySelectorAll('.card, .card-container, .sticky-header h1')
				.forEach(el => {
					el.removeAttribute('style')
				})
			return {}
		})

		mediaContext.add('(min-width: 1000px)', () => {
			ScrollTrigger.create({
				trigger: '.sticky',
				start: 'top top',
				end: `+=${window.innerHeight * 4}px`,
				scrub: 1,
				pin: true,
				pinSpacing: true,
				onUpdate: self => {
					const progress = self.progress

					if (progress >= 0.1 && progress <= 0.25) {
						const headerProgress = gsap.utils.mapRange(0.1, 0.25, 0, 1, progress)
						gsap.set(stickyHeader, {
							y: gsap.utils.mapRange(0, 1, 40, 0, headerProgress),
							opacity: gsap.utils.mapRange(0, 1, 0, 1, headerProgress),
						})
					} else if (progress < 0.1) {
						gsap.set(stickyHeader, { y: 40, opacity: 0 })
					} else if (progress > 0.25) {
						gsap.set(stickyHeader, { y: 0, opacity: 1 })
					}

					if (progress <= 0.25) {
						gsap.set(cardContainer, {
							width: `${gsap.utils.mapRange(0, 0.25, 62, 48, progress)}%`,
						})
					} else {
						gsap.set(cardContainer, { width: '48%' })
					}

					if (progress >= 0.35 && !isGapAnimationCompleted) {
						gsap.to(cardContainer, {
							gap: '34px',
							duration: 0.5,
							ease: 'power3.out',
						})
						gsap.to(['#card-1', '#card-2'], {
							borderRadius: '20px',
							duration: 0.5,
							ease: 'power3.out',
						})
						isGapAnimationCompleted = true
					} else if (progress < 0.35 && isGapAnimationCompleted) {
						gsap.to(cardContainer, {
							gap: '0px',
							duration: 0.5,
							ease: 'power3.out',
						})
						gsap.to('#card-1', {
							borderRadius: '20px 0 0 20px',
							duration: 0.5,
							ease: 'power3.out',
						})
						gsap.to('#card-2', {
							borderRadius: '0 20px 20px 0',
							duration: 0.5,
							ease: 'power3.out',
						})
						isGapAnimationCompleted = false
					}

					if (progress >= 0.7 && !isFlipAnimationCompleted) {
						gsap.to('.card', {
							rotationY: 180,
							duration: 0.75,
							ease: 'power3.inOut',
							stagger: 0.1,
						})
						gsap.to(['#card-1', '#card-2'], {
							y: 30,
							rotationZ: i => [-15, 15][i],
							duration: 0.75,
							ease: 'power3.inOut',
						})
						isFlipAnimationCompleted = true
					} else if (progress < 0.7 && isFlipAnimationCompleted) {
						gsap.to('.card', {
							rotationY: 0,
							duration: 0.75,
							ease: 'power3.inOut',
							stagger: -0.1,
						})
						gsap.to(['#card-1', '#card-2'], {
							y: 0,
							rotationZ: 0,
							duration: 0.75,
							ease: 'power3.inOut',
						})
						isFlipAnimationCompleted = false
					}
				},
			})

			return () => {}
		})
	}

	if (hasGsap) {
		gsap.registerPlugin(ScrollTrigger)
		initAnimations()

		let resizeTimer
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimer)
			resizeTimer = setTimeout(() => {
				initAnimations()
				ScrollTrigger.refresh()
				notifyScrollEnd()
			}, 250)
		})
	}

	notifyScrollEnd()
	startEndCheckLoop()
	window.addEventListener('scroll', notifyScrollEnd, { passive: true })
	window.addEventListener('resize', notifyScrollEnd)
	window.addEventListener('touchmove', notifyScrollEnd, { passive: true })

	window.addEventListener(
		'touchstart',
		event => {
			if (!event.touches || event.touches.length !== 1) return
			touchY = event.touches[0].clientY
		},
		{ passive: true },
	)

	window.addEventListener(
		'touchmove',
		event => {
			if (touchY === null || !event.touches || event.touches.length !== 1) return
			const currentY = event.touches[0].clientY
			const deltaY = touchY - currentY

			if (Math.abs(deltaY) < 0.8) return
			window.scrollBy(0, deltaY)
			touchY = currentY
			notifyScrollEnd()

			if (event.cancelable) {
				event.preventDefault()
			}
		},
		{ passive: false },
	)

	window.addEventListener(
		'touchend',
		() => {
			touchY = null
		},
		{ passive: true },
	)

	window.addEventListener(
		'touchcancel',
		() => {
			touchY = null
		},
		{ passive: true },
	)
})

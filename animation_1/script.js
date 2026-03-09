document.addEventListener('DOMContentLoaded', () => {
	if (
		typeof window.gsap === 'undefined' ||
		typeof window.ScrollTrigger === 'undefined'
	) {
		return
	}

	gsap.registerPlugin(ScrollTrigger)

	const cardContainer = document.querySelector('.card-container')
	const stickyHeader = document.querySelector('.sticky-header h1')

	let isGapAnimationCompleted = false
	let isFlipAnimationCompleted = false
	let hasReachedScrollEnd = false

	const notifyScrollEnd = () => {
		if (hasReachedScrollEnd) return
		const doc = document.documentElement
		const reachedEnd = window.innerHeight + window.scrollY >= doc.scrollHeight - 8

		if (!reachedEnd) return
		hasReachedScrollEnd = true
		window.parent.postMessage({ type: 'intro-scroll-end' }, '*')
	}

	function initAnimations() {
		ScrollTrigger.getAll().forEach(trigger => trigger.kill())

		const mm = gsap.matchMedia()

		mm.add('(max-width: 999px)', () => {
			document
				.querySelectorAll('.card, .card-container, .sticky-header h1')
				.forEach(el => {
					el.style = ''
				})
			return {}
		})

		mm.add('(min-width: 1000px)', () => {
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
						const headerProgress = gsap.utils.mapRange(
							0.1,
							0.25,
							0,
							1,
							progress,
						)

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

	initAnimations()
	notifyScrollEnd()
	window.addEventListener('scroll', notifyScrollEnd, { passive: true })
	window.addEventListener('resize', notifyScrollEnd)

	let resizeTimer
	window.addEventListener('resize', () => {
		clearTimeout(resizeTimer)
		resizeTimer = setTimeout(() => {
			initAnimations()
			ScrollTrigger.refresh()
			notifyScrollEnd()
		}, 250)
	})
})

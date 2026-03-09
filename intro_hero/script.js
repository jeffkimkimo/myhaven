document.addEventListener('DOMContentLoaded', () => {
	const counterProgress = document.querySelector('.preloader-counter h1')
	const counterContainer = document.querySelector('.preloader-counter')
	const counter = { value: 0 }
	const LOAD_DURATION = 4.2
	const HOLD_AT_END = 0.55
	let hasCompleted = false

	const completeLoader = () => {
		if (hasCompleted) return
		hasCompleted = true
		window.parent.postMessage({ type: 'intro-hero-complete' }, '*')
	}

	const tl = gsap.timeline({
		onComplete: completeLoader,
	})

	tl.to(counter, {
		value: 100,
		duration: LOAD_DURATION,
		ease: 'power2.out',
		onUpdate: () => {
			counterProgress.textContent = Math.floor(counter.value)
		},
	})

	tl.to(
		counterContainer,
		{
			scale: 1,
			duration: LOAD_DURATION,
			ease: 'power2.out',
		},
		'<',
	)

	tl.to(
		'.progress-bar',
		{
			scaleX: 1,
			duration: LOAD_DURATION,
			ease: 'power2.out',
		},
		'<',
	)

	tl.to(
		'.progress',
		{
			scaleX: 1,
			duration: 0.7,
			ease: 'power2.out',
		},
		'-=0.45',
	)

	tl.to({}, { duration: HOLD_AT_END })
})



const folders = [...document.querySelectorAll('.folder')]
const folderWrappers = [...document.querySelectorAll('.folder-wrapper')]
const previewImagesAll = [...document.querySelectorAll('.folder-preview-img')]
const folderPapers = [...document.querySelectorAll('.folder-paper')]
const PAPER_REST_Y = 74

let isMobile = window.innerWidth < 1000

// --------------------
// INIT POSITIONS
// --------------------
function setInitialPositions() {
	gsap.set(folderWrappers, { y: isMobile ? 0 : 25 })
	gsap.set(previewImagesAll, { y: '0%', rotation: 0 })
	gsap.set(folderPapers, {
		y: isMobile ? 0 : PAPER_REST_Y,
		rotation: -0.4,
		scale: 1,
		autoAlpha: 1,
	})
	folders.forEach(folder => folder.classList.remove('disabled'))
}

// --------------------
// HOVER LOGIC
// --------------------
function handleEnter(folder, index) {
	if (isMobile) return

	const images = folder.querySelectorAll('.folder-preview-img')
	const paper = folder.querySelector('.folder-paper')

	// disable siblings
	folders.forEach(f => {
		if (f !== folder) f.classList.add('disabled')
	})

	// lift wrapper
	gsap.to(folderWrappers[index], {
		y: 0,
		duration: 0.25,
		ease: 'back.out(1.7)',
	})

	// animate images
	images.forEach((img, i) => {
		const rotation =
			i === 0
				? gsap.utils.random(-20, -10)
				: i === 1
					? gsap.utils.random(-10, 10)
					: gsap.utils.random(10, 20)

		gsap.to(img, {
			y: '-100%',
			rotation,
			duration: 0.25,
			ease: 'back.out(1.7)',
			delay: i * 0.025,
		})
	})

	if (paper) {
		const paperPullY = -(folder.offsetHeight - 12)
		gsap.to(paper, {
			y: paperPullY,
			rotation: gsap.utils.random(-0.2, 0.85),
			scale: 1,
			duration: 0.62,
			ease: 'power3.out',
		})
	}
}

function handleLeave(index) {
	if (isMobile) return

	const images = folders[index].querySelectorAll('.folder-preview-img')
	const paper = folders[index].querySelector('.folder-paper')

	folders.forEach(f => f.classList.remove('disabled'))

	gsap.to(folderWrappers[index], {
		y: 25,
		duration: 0.25,
		ease: 'back.out(1.7)',
	})

	images.forEach((img, i) => {
		gsap.to(img, {
			y: '0%',
			rotation: 0,
			duration: 0.25,
			ease: 'back.out(1.7)',
			delay: i * 0.05,
		})
	})

	if (paper) {
		gsap.to(paper, {
			y: PAPER_REST_Y,
			rotation: -0.4,
			scale: 1,
			duration: 0.56,
			ease: 'power3.inOut',
		})
	}
}

// --------------------
// EVENTS
// --------------------
folders.forEach((folder, index) => {
	folder.addEventListener('mouseenter', () => handleEnter(folder, index))
	folder.addEventListener('mouseleave', () => handleLeave(index))
})

// --------------------
// RESIZE
// --------------------
window.addEventListener('resize', () => {
	const newIsMobile = window.innerWidth < 1000

	if (newIsMobile !== isMobile) {
		isMobile = newIsMobile
		setInitialPositions()
	}
})

// --------------------
// START
// --------------------
setInitialPositions()

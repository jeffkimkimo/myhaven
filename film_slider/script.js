document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof CustomEase === 'undefined') {
    return
  }

  gsap.registerPlugin(CustomEase)

  if (!CustomEase.get('hop')) {
    CustomEase.create(
      'hop',
      'M0,0 C0.488,0.02 0.467,0.286 0.5,0.5 0.532,0.712 0.58,1 1,1',
    )
  }

  const slider = document.querySelector('.slider')
  const sliderTitle = document.querySelector('.slider-title')
  const sliderCounter = document.querySelector(
    '.slider-counter p span:first-child',
  )
  const sliderCounterTotal = document.querySelector(
    '.slider-counter p span:last-child',
  )
  const sliderItems = document.querySelector('.slider-items')
  const sliderPreview = document.querySelector('.slider-preview')
  const watchLink = document.querySelector('#watch-link')

  if (!slider || !sliderTitle || !sliderCounter || !sliderItems || !sliderPreview) {
    return
  }

  const scriptSource = document.currentScript?.src ||
    Array.from(document.scripts)
      .find((script) => script.src.includes('film_slider/script.js') || script.src.endsWith('/script.js'))
      ?.src

  const scriptBase = scriptSource ? new URL('.', scriptSource).href : window.location.href

  const defaultSliderContent = [
    { name: 'Serene Space', img: new URL('img/img1.jpg', scriptBase).toString(), href: '#' },
    { name: 'Gentle Horizon', img: new URL('img/img2.jpg', scriptBase).toString(), href: '#' },
    { name: 'Quiet Flow', img: new URL('img/img3.jpg', scriptBase).toString(), href: '#' },
    { name: 'Ethereal Light', img: new URL('img/img4.jpg', scriptBase).toString(), href: '#' },
    { name: 'Calm Drift', img: new URL('img/img5.jpg', scriptBase).toString(), href: '#' },
    { name: 'Subtle Balance', img: new URL('img/img6.jpg', scriptBase).toString(), href: '#' },
    { name: 'Soft Whisper', img: new URL('img/img7.jpg', scriptBase).toString(), href: '#' },
  ]

  const sliderContent = Array.isArray(window.filmSliderConfig) && window.filmSliderConfig.length >= 3
    ? window.filmSliderConfig
    : defaultSliderContent

  const totalSlides = sliderContent.length
  let activeSlideIndex = 1
  let isAnimating = false
  let isNavigatingToTarget = false
  const imagePreloadCache = new Map()
  const SLIDE_DURATION = 1.2
  const TITLE_DURATION = 0.8
  const TITLE_DELAY = 0
  const PREVIEW_DURATION = 0.6
  const PREVIEW_DELAY = 0
  const COUNTER_UPDATE_DELAY_MS = 450
  const SLIDE_DURATION_MS = Math.round(SLIDE_DURATION * 1000)

  if (sliderCounterTotal) {
    sliderCounterTotal.textContent = String(totalSlides)
  }

  const clipPath = {
    closed: 'polygon(25% 30%, 75% 30%, 75% 70%, 25% 70%)',
    open: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
  }

  const slidePositions = {
    prev: { left: '15%', rotation: -90 },
    active: { left: '50%', rotation: 0 },
    next: { left: '85%', rotation: 90 },
  }

  function normalizeSlideIndex(index) {
    return ((index - 1 + totalSlides) % totalSlides) + 1
  }

  function getSlideIndex(increment) {
    return normalizeSlideIndex(activeSlideIndex + increment)
  }

  function getContentByIndex(index) {
    return sliderContent[normalizeSlideIndex(index) - 1]
  }

  function preloadImage(src) {
    if (!src) {
      return Promise.resolve(null)
    }

    if (imagePreloadCache.has(src)) {
      return imagePreloadCache.get(src)
    }

    const request = new Promise((resolve) => {
      const image = new Image()
      image.decoding = 'async'
      image.onload = () => resolve(image)
      image.onerror = () => resolve(null)
      image.src = src

      if (image.complete) {
        resolve(image)
      }
    })

    imagePreloadCache.set(src, request)
    return request
  }

  function preloadSlidesAround(index) {
    const offsets = [-2, -1, 0, 1, 2]

    offsets.forEach((offset) => {
      const content = getContentByIndex(index + offset)
      void preloadImage(content.img)
    })
  }

  function getNavigationPlan(targetIndex) {
    const normalizedTargetIndex = normalizeSlideIndex(targetIndex)
    const nextSteps =
      (normalizedTargetIndex - activeSlideIndex + totalSlides) % totalSlides
    const prevSteps =
      (activeSlideIndex - normalizedTargetIndex + totalSlides) % totalSlides

    if (nextSteps === 0) {
      return null
    }

    return nextSteps <= prevSteps
      ? { direction: 'next', steps: nextSteps }
      : { direction: 'prev', steps: prevSteps }
  }

  function splitTextIntoSpans(element) {
    element.innerHTML = element.innerText
      .split('')
      .map((char) => `<span>${char === ' ' ? '&nbsp;&nbsp;' : char}</span>`)
      .join('')
  }

  function createSlide(index, className) {
    const content = getContentByIndex(index)
    const slide = document.createElement('div')
    slide.className = `slide-container ${className}`
    slide.innerHTML = `
      <div class="slide-img">
        <img
          src="${content.img}"
          alt="${content.name}"
          loading="eager"
          decoding="async"
          fetchpriority="${className === 'active' ? 'high' : 'auto'}"
        >
      </div>
    `
    return slide
  }

  function buildInitialSlides() {
    slider.querySelectorAll('.slide-container').forEach((slide) => slide.remove())

    const prevSlide = createSlide(activeSlideIndex - 1, 'prev')
    const activeSlide = createSlide(activeSlideIndex, 'active')
    const nextSlide = createSlide(activeSlideIndex + 1, 'next')

    slider.insertBefore(prevSlide, sliderTitle)
    slider.insertBefore(activeSlide, sliderTitle)
    slider.insertBefore(nextSlide, sliderTitle)

    Object.entries(slidePositions).forEach(([key, value]) => {
      gsap.set(`.slide-container.${key}`, {
        ...value,
        xPercent: -50,
        yPercent: -50,
        clipPath: key === 'active' ? clipPath.open : clipPath.closed,
      })

      if (key !== 'active') {
        gsap.set(`.slide-container.${key} .slide-img`, {
          rotation: -value.rotation,
        })
      }
    })
  }

  function buildSliderItems() {
    sliderItems.innerHTML = ''

    sliderContent.forEach((content, index) => {
      const item = document.createElement('p')
      item.textContent = content.name
      item.dataset.index = String(index + 1)
      sliderItems.appendChild(item)
    })
  }

  function updateWatchLink(index) {
    if (!watchLink) return

    const slideData = getContentByIndex(index)
    const href = slideData.href || ''
    const hasLink = href.trim() !== '' && href !== '#'
    const isCancelled = slideData.status === 'cancelled'

    watchLink.href = hasLink ? href : '#'
    watchLink.textContent = isCancelled
      ? 'Cancelled'
      : hasLink
        ? 'Watch film'
        : 'Film not yet out'
    watchLink.classList.toggle('is-disabled', !hasLink)
    watchLink.classList.toggle('is-cancelled', isCancelled)
    watchLink.setAttribute('aria-disabled', String(!hasLink))
    watchLink.tabIndex = hasLink ? 0 : -1
  }

  function updateCounterAndHighlight(index) {
    sliderCounter.textContent = String(index)

    sliderItems
      .querySelectorAll('p')
      .forEach((item, itemIndex) =>
        item.classList.toggle('activeItem', itemIndex === index - 1),
      )

    updateWatchLink(index)
  }

  function updatePreviewImage(content) {
    const newImage = document.createElement('img')
    newImage.src = content.img
    newImage.alt = content.name
    sliderPreview.appendChild(newImage)

    gsap.fromTo(
      newImage,
      { opacity: 0 },
      {
        opacity: 1,
        duration: PREVIEW_DURATION,
        ease: 'power2.inOut',
        delay: PREVIEW_DELAY,
        onComplete: () => {
          const previousPreview = sliderPreview.querySelector('img:not(:last-child)')
          if (previousPreview) {
            previousPreview.remove()
          }
        },
      },
    )
  }

  function createAndAnimateTitle(content, direction) {
    const existingTitles = Array.from(sliderTitle.querySelectorAll('h1'))
    const currentTitle = existingTitles.at(-1) || null

    existingTitles.slice(0, -1).forEach((title) => title.remove())

    const newTitle = document.createElement('h1')
    newTitle.innerText = content.name
    sliderTitle.appendChild(newTitle)
    splitTextIntoSpans(newTitle)

    const yOffset = direction === 'next' ? 60 : -60
    const newTitleSpans = newTitle.querySelectorAll('span')

    gsap.set(newTitleSpans, { y: yOffset, opacity: 0 })
    gsap.to(newTitleSpans, {
      y: 0,
      opacity: 1,
      duration: TITLE_DURATION,
      stagger: 0.02,
      ease: 'hop',
      delay: TITLE_DELAY,
    })

    if (currentTitle) {
      const currentTitleSpans = currentTitle.querySelectorAll('span')

      gsap.killTweensOf(currentTitleSpans)
      gsap.to(currentTitleSpans, {
        y: -yOffset,
        opacity: 0,
        duration: TITLE_DURATION * 0.7,
        stagger: 0.015,
        ease: 'power2.in',
        onComplete: () => currentTitle.remove(),
      })
    }
  }

  function animateSlide(slide, props) {
    gsap.to(slide, { ...props, duration: SLIDE_DURATION, ease: 'hop' })
    gsap.to(slide.querySelector('.slide-img'), {
      rotation: -props.rotation,
      duration: SLIDE_DURATION,
      ease: 'hop',
    })
  }

  function transitionSlides(direction) {
    if (isAnimating) {
      return Promise.resolve(false)
    }

    isAnimating = true

    const [outgoingPos, incomingPos] =
      direction === 'next' ? ['prev', 'next'] : ['next', 'prev']

    const outgoingSlide = slider.querySelector(`.${outgoingPos}`)
    const activeSlide = slider.querySelector('.active')
    const incomingSlide = slider.querySelector(`.${incomingPos}`)

    if (!outgoingSlide || !activeSlide || !incomingSlide) {
      isAnimating = false
      return Promise.resolve(false)
    }

    animateSlide(incomingSlide, {
      ...slidePositions.active,
      clipPath: clipPath.open,
    })
    animateSlide(activeSlide, {
      ...slidePositions[outgoingPos],
      clipPath: clipPath.closed,
    })

    gsap.to(outgoingSlide, {
      scale: 0,
      opacity: 0,
      duration: SLIDE_DURATION,
      ease: 'hop',
    })

    const newSlideIndex = getSlideIndex(direction === 'next' ? 2 : -2)
    const newSlide = createSlide(newSlideIndex, incomingPos)

    slider.insertBefore(newSlide, sliderTitle)

    gsap.set(newSlide, {
      ...slidePositions[incomingPos],
      xPercent: -50,
      yPercent: -50,
      scale: 0,
      opacity: 0,
      clipPath: clipPath.closed,
    })
    gsap.to(newSlide, {
      scale: 1,
      opacity: 1,
      duration: SLIDE_DURATION,
      ease: 'hop',
    })

    const nextActiveIndex = getSlideIndex(direction === 'next' ? 1 : -1)
    createAndAnimateTitle(getContentByIndex(nextActiveIndex), direction)
    updatePreviewImage(getContentByIndex(nextActiveIndex))

    setTimeout(() => {
      updateCounterAndHighlight(nextActiveIndex)
    }, COUNTER_UPDATE_DELAY_MS)

    return new Promise((resolve) => {
      setTimeout(() => {
        outgoingSlide.remove()
        activeSlide.className = `slide-container ${outgoingPos}`
        incomingSlide.className = 'slide-container active'
        newSlide.className = `slide-container ${incomingPos}`
        activeSlideIndex = nextActiveIndex
        preloadSlidesAround(activeSlideIndex)
        isAnimating = false
        resolve(true)
      }, SLIDE_DURATION_MS)
    })
  }

  async function navigateToSlide(targetIndex) {
    const plan = getNavigationPlan(targetIndex)
    if (!plan || isAnimating || isNavigatingToTarget) {
      return
    }

    isNavigatingToTarget = true

    for (let step = 0; step < plan.steps; step += 1) {
      const transitioned = await transitionSlides(plan.direction)
      if (!transitioned) {
        break
      }
    }

    isNavigatingToTarget = false
  }

  function init() {
    sliderTitle.innerHTML = ''

    const initialTitle = document.createElement('h1')
    initialTitle.textContent = getContentByIndex(activeSlideIndex).name
    sliderTitle.appendChild(initialTitle)

    splitTextIntoSpans(initialTitle)
    gsap.fromTo(
      initialTitle.querySelectorAll('span'),
      { y: 60 },
      { y: 0, duration: TITLE_DURATION, stagger: 0.02, ease: 'hop' },
    )

    buildInitialSlides()
    buildSliderItems()
    preloadSlidesAround(activeSlideIndex)

    sliderPreview.innerHTML = ''
    const previewImage = document.createElement('img')
    previewImage.src = getContentByIndex(activeSlideIndex).img
    previewImage.alt = getContentByIndex(activeSlideIndex).name
    sliderPreview.appendChild(previewImage)

    updateCounterAndHighlight(activeSlideIndex)

    slider.addEventListener('click', (event) => {
      const clickedSlide = event.target.closest('.slide-container')
      if (!clickedSlide || isAnimating || isNavigatingToTarget) return

      void transitionSlides(clickedSlide.classList.contains('next') ? 'next' : 'prev')
    })

    sliderItems.querySelectorAll('p').forEach((item) => {
      item.addEventListener('click', () => {
        const targetIndex = Number(item.dataset.index)
        if (
          targetIndex === activeSlideIndex ||
          isAnimating ||
          isNavigatingToTarget
        ) {
          return
        }

        void navigateToSlide(targetIndex)
      })
    })
  }

  init()
})

/* =====================================================
   OLIVIER NAV MENU — script.js

   Behaviour:
   - Click the toggle → drop-down nav opens with staggered
     character-by-character text reveal
   - Hover any link   → blur every OTHER link + swap the
     preview image on the right
   - Click toggle again → everything reverses
   ===================================================== */

/* ── DOM references ─────────────────────────────────── */
const toggle      = document.getElementById('js-toggle')
const burger      = document.getElementById('js-burger')
const labelMenu   = document.getElementById('js-label-menu')
const labelClose  = document.getElementById('js-label-close')
const shop        = document.getElementById('js-shop')
const nav         = document.getElementById('js-nav')
const navBody     = document.getElementById('js-nav-body')
const navLinks    = document.querySelectorAll('.nav__link')
const navImage    = document.getElementById('js-nav-image')
const navImageEl  = document.getElementById('js-nav-image-el')
const footerItems = document.querySelectorAll('.nav__footer li')
const background  = document.getElementById('js-background')

/* ── 1. Split every nav link into <span> per character ──
   This lets us stagger each character independently for
   the iconic "wave" text reveal. We build the spans once
   on load so they're ready when the timeline plays. */
navLinks.forEach(link => {
   const text = link.textContent
   link.textContent = ''  // clear original text
   text.split('').forEach(char => {
      const span = document.createElement('span')
      // Preserve spaces; otherwise they collapse when inline-block
      span.textContent = char === ' ' ? '\u00A0' : char
      link.appendChild(span)
   })
})

/* Grab every char span for later animation */
const allChars = document.querySelectorAll('.nav__link span')

/* ── 2. Set initial (hidden) states ─────────────────────
   Characters start 100% below their line and transparent.
   Footer items start below their line too.
   Close label is already opacity 0 via CSS. */
gsap.set(allChars,    { y: '100%', opacity: 0 })
gsap.set(footerItems, { y: '100%', opacity: 0 })

/* ── 3. Main timeline — paused until user clicks ────────
   The standard ease used throughout matches the original
   cubic-bezier(0.76, 0, 0.24, 1). */
const ease = 'power3.inOut'

const tl = gsap.timeline({ paused: true })

tl
   /* Drop-down panel expands.
      We use height:"auto" — GSAP measures the natural
      height automatically, so the panel grows to fit
      whatever content is inside (responsive-friendly). */
   .to(nav, { height: 'auto', duration: 1, ease }, 0)

   /* Dark overlay slides down to cover the page */
   .to(background, { height: '100vh', duration: 1, ease }, 0)

   /* Cross-fade the toggle labels: "Menu" out, "Close" in */
   .to(labelMenu,  { opacity: 0, duration: 0.35 }, 0)
   .to(labelClose, { opacity: 1, duration: 0.35 }, 0)

   /* Fade out the shop block on the right */
   .to(shop, { opacity: 0, duration: 0.35 }, 0)

   /* Characters slide up from y:100% with a stagger.
      stagger: 0.02 → 20ms between each character — this
      creates the diagonal "wave" across the whole list. */
   .to(
      allChars,
      { y: '0%', opacity: 1, duration: 1, ease, stagger: 0.02 },
      0.2,
   )

   /* Footer items slide up right after */
   .to(
      footerItems,
      { y: '0%', opacity: 1, duration: 1, ease, stagger: 0.05 },
      0.4,
   )

/* ── 4. Toggle button ──────────────────────────────────
   `tl.reversed()` is true when the timeline has been
   reversed to the start. `progress() === 0` handles the
   very first click (before any play/reverse has happened). */
toggle.addEventListener('click', () => {
   if (tl.reversed() || tl.progress() === 0) {
      burger.classList.add('header__burger--active')
      tl.play()
   } else {
      burger.classList.remove('header__burger--active')
      tl.reverse()
   }
})

/* ── 5. Hover effects ──────────────────────────────────
   When a link is hovered:
   - fade + blur every OTHER link (highlights the active one)
   - swap and fade in the preview image on the right

   IMPORTANT: we listen on the PARENT (nav__body), not on each
   link. If we listened on every link, moving the cursor from
   one link to another would fire mouseleave on the old link
   AND mouseenter on the new one — the two tweens would queue
   up and cause visible flicker/lag. A single listener on the
   parent gives us one clean state change per hover. */
navBody.addEventListener('mouseover', (e) => {
   const link = e.target.closest('.nav__link')
   if (!link) return

   const hoveredIndex = link.dataset.index

   // Blur/dim all non-hovered links; reset the hovered one.
   // `overwrite: true` kills any in-flight tween on the same
   // target so we never stack conflicting animations.
   navLinks.forEach(other => {
      const isHovered = other.dataset.index === hoveredIndex
      gsap.to(other, {
         filter: isHovered ? 'blur(0px)' : 'blur(4px)',
         opacity: isHovered ? 1 : 0.6,
         duration: 0.3,
         overwrite: true,
      })
   })

   // Swap preview image and fade it in
   navImageEl.src = 'img/' + link.dataset.src
   gsap.to(navImage, { opacity: 1, duration: 0.35, overwrite: true })
})

/* Single mouseleave on the whole body — fires only when the
   cursor actually leaves the list, not when moving between
   its children. */
navBody.addEventListener('mouseleave', () => {
   gsap.to(navLinks, {
      filter: 'blur(0px)',
      opacity: 1,
      duration: 0.3,
      overwrite: true,
   })
   gsap.to(navImage, { opacity: 0, duration: 0.35, overwrite: true })
})

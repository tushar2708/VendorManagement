document.addEventListener('DOMContentLoaded', () => {
  const sections = gsap.utils.toArray('.double');

  sections.forEach((section) => {
    const firstImage = section.querySelector('.image-container:first-child');
    const secondImage = section.querySelector('.image-container:last-child');
    const reversed = section.dataset.reversed === 'true';

    let rafId = null;
    let xPercent = reversed ? 100 : 0;
    let currentXPercent = reversed ? 100 : 0;
    const speed = 0.15;

    const animateWidths = () => {
      const delta = xPercent - currentXPercent;
      currentXPercent = currentXPercent + delta * speed;

      const firstWidth = 66.66 - currentXPercent * 0.33;
      const secondWidth = 33.33 + currentXPercent * 0.33;

      firstImage.style.width = `${firstWidth}%`;
      secondImage.style.width = `${secondWidth}%`;

      if (Math.round(currentXPercent) === Math.round(xPercent)) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else {
        rafId = requestAnimationFrame(animateWidths);
      }
    };

    section.addEventListener('mousemove', (event) => {
      const clientX = event.clientX;
      xPercent = (clientX / window.innerWidth) * 100;

      if (!rafId) {
        rafId = requestAnimationFrame(animateWidths);
      }
    });
  });
});

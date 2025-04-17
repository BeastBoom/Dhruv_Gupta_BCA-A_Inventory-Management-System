const container = document.querySelector('.reviews-container');
const leftBtn = document.querySelector('.left-btn');
const rightBtn = document.querySelector('.right-btn');

let isScrolling = true;
let scrollInterval;
const scrollSpeed = 10; // Increased speed for smoother, faster scrolling

container.innerHTML += container.innerHTML; // Duplicate content for seamless scrolling

// Auto-scrolling function
function autoScroll() {
  if (isScrolling) {
    container.scrollLeft += scrollSpeed;
    if (container.scrollLeft >= container.scrollWidth / 2) {
      container.scrollLeft = 0;
    }
  }
}

// Start auto-scrolling
function startScrolling() {
  isScrolling = true;
  scrollInterval = setInterval(autoScroll, 10);
}

// Stop auto-scrolling
function stopScrolling() {
  isScrolling = false;
  clearInterval(scrollInterval);
}

// Stop scrolling when hovering over a card (using event delegation)
container.addEventListener('mouseover', (event) => {
  if (event.target.closest('.review-card')) {
    stopScrolling();
  }
});

container.addEventListener('mouseout', (event) => {
  if (event.target.closest('.review-card')) {
    startScrolling();
  }
});

// Allow manual scrolling through arrows
leftBtn.addEventListener('mouseenter', stopScrolling);
rightBtn.addEventListener('mouseenter', stopScrolling);

leftBtn.addEventListener('click', () => {
  container.scrollBy({ left: -300, behavior: 'smooth' });
});

rightBtn.addEventListener('click', () => {
  container.scrollBy({ left: 300, behavior: 'smooth' });
});

// Resume auto-scrolling when mouse leaves the container
container.addEventListener('mouseleave', startScrolling);

// Start scrolling initially
startScrolling();

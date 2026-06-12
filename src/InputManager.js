export class InputManager {
  constructor() {
    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false
    };
    
    this.swipe = {
      left: false,
      right: false
    };

    this.touchStartX = 0;
    this.touchEndX = 0;

    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    
    // Mobile Touch Events
    window.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    });

    window.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });
  }

  onKeyDown(e) {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = true;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = true;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.up = true;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.down = true;
  }

  onKeyUp(e) {
    if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') this.keys.left = false;
    if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') this.keys.right = false;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.up = false;
    if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.down = false;
  }

  handleSwipe() {
    const swipeThreshold = 50;
    if (this.touchEndX < this.touchStartX - swipeThreshold) {
      this.swipe.left = true;
    }
    if (this.touchEndX > this.touchStartX + swipeThreshold) {
      this.swipe.right = true;
    }
  }

  consumeSwipeLeft() {
    if (this.swipe.left) {
      this.swipe.left = false;
      return true;
    }
    return false;
  }

  consumeSwipeRight() {
    if (this.swipe.right) {
      this.swipe.right = false;
      return true;
    }
    return false;
  }
}

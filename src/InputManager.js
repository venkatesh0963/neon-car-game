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
      
      // Skip side tap logic if pressing a D-Pad button
      if (e.target.closest('.dpad-btn')) return;
      
      // Tap on left/right side of screen for quick lane change
      const tapX = e.changedTouches[0].clientX;
      const screenWidth = window.innerWidth;
      // Only consider it a tap if we are in the lower 70% of the screen so we don't interfere with top UI buttons
      if (e.changedTouches[0].clientY > window.innerHeight * 0.3) {
        if (tapX < screenWidth / 2) {
          this.swipe.left = true;
        } else {
          this.swipe.right = true;
        }
      }
    });

    window.addEventListener('touchend', (e) => {
      if (e.target.closest('.dpad-btn')) return;
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });

    // D-Pad Event Listeners
    this.setupDPad('dpad-up', 'up');
    this.setupDPad('dpad-down', 'down');
    this.setupDPad('dpad-left', 'left');
    this.setupDPad('dpad-right', 'right');
  }

  setupDPad(id, key) {
    const btn = document.getElementById(id);
    if (!btn) return;

    const press = (e) => {
      e.preventDefault();
      this.keys[key] = true;
      btn.classList.add('pressed');
    };

    const release = (e) => {
      e.preventDefault();
      this.keys[key] = false;
      btn.classList.remove('pressed');
    };

    btn.addEventListener('mousedown', press);
    btn.addEventListener('touchstart', press);
    
    btn.addEventListener('mouseup', release);
    btn.addEventListener('mouseleave', release);
    btn.addEventListener('touchend', release);
    btn.addEventListener('touchcancel', release);
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

// Keyboard and mouse input. Keys are tracked by their code so WASD and the
// arrow keys share the same actions; mouse clicks are delivered as canvas
// coordinates for the menu buttons.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set();
    this.mouse = { x: -1, y: -1, clicked: false, clickX: -1, clickY: -1 };
    this.onFirstGesture = null;
    window.addEventListener('keydown', (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
      if (!event.repeat) this.pressed.add(event.code);
      this.keys.add(event.code);
      if (this.onFirstGesture) this.onFirstGesture();
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
    });
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('pointermove', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });
    canvas.addEventListener('pointerdown', (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.clickX = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouse.clickY = ((event.clientY - rect.top) / rect.height) * canvas.height;
      this.mouse.clicked = true;
      if (this.onFirstGesture) this.onFirstGesture();
    });
  }

  held(...codes) {
    return codes.some((code) => this.keys.has(code));
  }

  wasPressed(...codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }

  consumeClick() {
    if (!this.mouse.clicked) return null;
    this.mouse.clicked = false;
    return { x: this.mouse.clickX, y: this.mouse.clickY };
  }
}

export function hitButton(click, rect) {
  return click && click.x >= rect.x && click.x <= rect.x + rect.width
    && click.y >= rect.y && click.y <= rect.y + rect.height;
}

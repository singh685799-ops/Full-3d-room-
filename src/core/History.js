export class History {
  constructor(limit = 80) {
    this.limit = limit;
    this.stack = [];
    this.index = -1;
  }

  get canUndo() {
    return this.index >= 0;
  }

  get canRedo() {
    return this.index < this.stack.length - 1;
  }

  push(command) {
    if (!command || typeof command.undo !== 'function' || typeof command.redo !== 'function') return;
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(command);
    if (this.stack.length > this.limit) this.stack.shift();
    this.index = this.stack.length - 1;
  }

  undo() {
    if (!this.canUndo) return false;
    const cmd = this.stack[this.index];
    try {
      cmd.undo();
    } catch (err) {
      console.warn('[atrium] undo failed', err);
    }
    this.index -= 1;
    return true;
  }

  redo() {
    if (!this.canRedo) return false;
    const cmd = this.stack[this.index + 1];
    try {
      cmd.redo();
    } catch (err) {
      console.warn('[atrium] redo failed', err);
    }
    this.index += 1;
    return true;
  }

  clear() {
    this.stack = [];
    this.index = -1;
  }
}

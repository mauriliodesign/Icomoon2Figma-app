export class AppState {
  constructor() {
    this._currentFont = null;
    this._currentIcons = [];
    this._currentView = 'table';
    this._subscribers = new Set();
    this.updateIconCounter(0); // Initialize counter
  }

  // Update icon counter in the UI
  updateIconCounter(count) {
    const iconCounter = document.getElementById('iconCount');
    if (iconCounter) {
      iconCounter.textContent = count;
    }
  }

  // Getters
  get currentFont() {
    return this._currentFont;
  }

  get currentIcons() {
    return this._currentIcons;
  }

  get currentView() {
    return this._currentView;
  }

  // Setters with state updates
  set currentFont(font) {
    this._currentFont = font;
    this._notifySubscribers();
  }

  set currentIcons(icons) {
    this._currentIcons = icons;
    this.updateIconCounter(icons.length); // Update counter when icons change
    this._notifySubscribers();
  }

  set currentView(view) {
    this._currentView = view;
    this._notifySubscribers();
  }

  // Subscribe to state changes
  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }

  // Notify all subscribers of state changes
  _notifySubscribers() {
    this._subscribers.forEach(callback => callback(this));
  }
} 
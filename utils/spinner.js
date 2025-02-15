class Spinner {
  constructor(message = '') {
    this.spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.message = message;
    this.currentFrame = 0;
    this.interval = null;
    this.startTime = null;
  }

  formatElapsedTime(elapsed) {
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds.toFixed(1)}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds.toFixed(1)}s`;
    } else {
      return `${seconds.toFixed(1)}s`;
    }
  }

  start() {
    this.startTime = Date.now();
    this.interval = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const formattedTime = this.formatElapsedTime(elapsed);
      process.stdout.write('\r' + this.spinnerFrames[this.currentFrame] + ' ' + 
        this.message + ` (${formattedTime})`);
      this.currentFrame = (this.currentFrame + 1) % this.spinnerFrames.length;
    }, 80);
  }

  stop() {
    clearInterval(this.interval);
    const totalTime = ((Date.now() - this.startTime) / 1000);
    process.stdout.write('\r' + ' '.repeat(this.message.length + 20) + '\r');
    console.log(`Done! (${this.formatElapsedTime(totalTime)})`);
  }
}

module.exports = Spinner; 
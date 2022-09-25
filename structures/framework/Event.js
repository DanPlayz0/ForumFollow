module.exports = class Event {
  constructor(client, options) {
    this.client = client;
    this.conf = { 
      name: null,
      enabled: options.enabled || false,
      ws: options.ws || false
    };
  }

  run() {
    throw new Error('Command run method not implemented');
  }
}

const WebhookClient = require('./WebhookClient');
module.exports = class WebhookManager {
  constructor(client) {
    this.client = client;
    

    for(let webhook of client.config.webhooks) {
      if(webhook.id && webhook.token || webhook.url) this[webhook.name] = new WebhookClient(this.client, webhook);
      else this[webhook.name] = { send: (content) => console.log(`[WEBHOOK - ${webhook.name}]`, content?.content ?? content) };
    }
  }
}
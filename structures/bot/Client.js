const Discord = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = class BotClient extends Discord.Client {
  constructor(options) {
    super(options);

    // Configuration
    this.config = require('@root/config');

    // Collections
    for (const name of ["commands", "events", "cooldowns"]) this[name] = new Discord.Collection();

    // Packages
    this.pkg = {
      mongoDb: require('mongodb'),
      axios: require('axios'),
      path, fs,
    }
    this.discord = Discord;
    this.fs = fs;
    this.moment = require('moment'); require("moment-timezone"); require("moment-duration-format");
    this.duration = require("humanize-duration");
    this.hashids = require('hashids');
    
    // Miscelaneous
    this.framework = {
      interactionContext: require("@structures/framework/ContextInteraction"),
    }
    this.database = new (require('./DatabaseManager.js'))(this);
    this.webhooks = new (require('@structures/webhooks/WebhookManager.js'))(this);
    this.loader = new (require('./Loader.js'))(this);
  }
  
  start() {
    this.database.init();
    this.loader.start();
  }
}
let private;
try {
  private = {
    token: process.env.DISCORD_TOKEN,
    mongo_uri: process.env.MONOG_URI,
    webhooks: {
      shard: process.env.WEBHOOK_SHARD,
      error: process.env.WEBHOOK_ERROR,
      command: process.env.WEBHOOK_COMMAND,
      guilds: process.env.WEBHOOK_GUILD,
    } 
  }
} catch {}
try {
  private = require('./config-private');
} catch {}
module.exports = {
  // Bot Token
  token: private.token,

  // Bot Administators (Access to Admin Dash & System Commands)
  admins: ['209796601357533184', '229285505693515776'],
  
  // Database Crap (MongoDB)
  mongo_uri: private.mongo_uri,
  
  // Support server. (For the "dashboard.example/join")
  supportServerInvite: "https://discord.gg/KkS6yP8",
 
  // Restful API
  restapi: {
    port: 3000, 
  },
  
  // Bot Logging (Webhooks)
  webhooks: [
    { name: "shard", url: private.webhooks?.shard },
    { name: "error", url: private.webhooks?.error },
    { name: "command", url: private.webhooks?.command },
    { name: "guilds", url: private.webhooks?.guilds },
  ],
}
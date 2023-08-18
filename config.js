let private;
try {
  private = {
    token: process.env.DISCORD_TOKEN,
    mongo_uri: process.env.MONOG_URI,
    webhooks: {
      shard: process.env.WEBHOOK_SHARD,
      error: process.env.WEBHOOK_ERROR,
      command: process.env.WEBHOOK_COMMAND,
      guild: process.env.WEBHOOK_GUILD,
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
    { name: "shard", id: private.webhooks?.shard?.id, token: private.webhooks?.shard?.token },
    { name: "error", id: private.webhooks?.error?.id, token: private.webhooks?.error?.token },
    { name: "command", id: private.webhooks?.command?.id, token: private.webhooks?.command?.token },
    { name: "guilds", id: private.webhooks?.guilds?.id, token: private.webhooks?.guilds?.token },
  ],
}
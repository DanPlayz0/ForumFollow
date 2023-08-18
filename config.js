module.exports = {
  // Bot Token
  token: process.env.DISCORD_TOKEN,

  // Bot Administators (Access to Admin Dash & System Commands)
  admins: ['209796601357533184', '229285505693515776'],
  
  // Database Crap (MongoDB)
  mongo_uri: process.env.MONGODB_URI,
  
  // Support server. (For the "dashboard.example/join")
  supportServerInvite: "https://discord.gg/KkS6yP8",
 
  // Restful API
  restapi: {
    port: 3000,
  },
  
  // Bot Logging (Webhooks)
  webhooks: [
    { name: "shard", url: process.env.WEBHOOK_SHARD },
    { name: "error", url: process.env.WEBHOOK_ERROR },
    { name: "command", url: process.env.WEBHOOK_COMMAND },
    { name: "guilds", url: process.env.WEBHOOK_GUILD },
  ],
}
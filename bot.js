require('module-alias/register');

const { Partials } = require('discord.js');
const BotClient = require('@structures/bot/Client.js');
const client = new BotClient({ 
  intents: [
    'Guilds', 'GuildBans',
    'GuildEmojisAndStickers',
    'GuildIntegrations', 'GuildWebhooks', 
    'GuildInvites', 'DirectMessages',
    'GuildMessages', 'GuildMessageReactions',
    'MessageContent',
  ],
  partials: [Partials.Message, Partials.Channel]
});

client.login(client.config.token);

String.prototype.toProperCase = function () {
  return this.replace(/([^\W_]+[^\s-]*) */g, (txt) => `${txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()}`);
};

// These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
process.on("uncaughtException", (err) => {
  const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, "g"), "./");
  console.error("Uncaught Exception: ", errorMsg);
  client.webhooks.error.send({content: `**${client.user.username} - uncaughtException:**\n\`\`\`\n${err.stack}`.slice(0,1995)+'\`\`\`' })
  // process.exit(1);
});

process.on("unhandledRejection", err => {
  console.error("Uncaught Promise Error: ", err);
  client.webhooks.error.send({content: `**${client.user.username} - unhandledRejection:**\n\`\`\`\n${err.stack}`.slice(0,1995)+'\`\`\`' })
});
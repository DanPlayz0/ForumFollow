const Event = require('@structures/framework/Event');
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    });
  }

  async run(client, guild) {
    if(!guild.available) return;
    console.log(`[GUILD LEAVE] ${guild.name} (${guild.id}) removed the bot.`);

    const owner = await client.users.fetch(guild.ownerId);
    const e = new client.discord.EmbedBuilder()
      .setTitle(`LEFT \`${guild.name}\``)
      .setColor('#36393E')
      .setDescription(`Members: ${guild.memberCount}\nID: ${guild.id}\nOwner: ${owner.username} (${guild.ownerId})`);
    client.webhooks.guilds.send({embeds: [e], allowedMentions: { parse: [] }});
  }
}
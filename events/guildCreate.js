const Event = require('@structures/framework/Event');
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    });
  }

  async run(client, guild) {
    console.log(`[GUILD JOIN] ${guild.name} (${guild.id}) added the bot. Owner: ${guild.ownerId}`);
    
    const owner = await guild.fetchOwner();
    const e = new client.discord.EmbedBuilder()
      .setTitle(`JOINED \`${guild.name}\``)
      .setColor('#36393E')
      .setDescription(`Members: ${guild.memberCount}\nID: ${guild.id}\nOwner: ${owner.user.username} (${guild.ownerId})`);
    client.webhooks.guilds.send({embeds: [e], allowedMentions: { parse: [] }});
  }
}
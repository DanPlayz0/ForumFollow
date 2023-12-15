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

    const db = await client.database.findOne('guilds', { id: guild.id });
    if (!db) await client.database.insertOne('guilds', { id: guild.id, botInServer: true, discord: { name: guild.name, icon: guild.icon }, lastUpdate: new Date().toISOString(), addedAt: new Date().toISOString() });
    else await client.database.updateOne('guilds', {id: guild.id}, {$set:{botInServer: true, discord: { name: guild.name, icon: guild.icon }, lastUpdate: new Date().toISOString() }});
  }
}
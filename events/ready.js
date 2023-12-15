const Event = require('@structures/framework/Event');
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    });
  }

  async run(client) {
    console.log(`Logged in as ${client.user.tag}`);

    async function setupInit() {
      // Set the game as the "Watching forums • /help"
      client.user.setActivity(`forums • /help`, { type: 3 });
    }

    client.activityInterval = setInterval(setupInit, 90000);
    setupInit();

    // Setup the website.
    if(!client.shard || !client.shardId) {
      client.site = new (require("@structures/restapi/index.js"))(client);
      client.site.listen(client.config.restapi.port);
    }

    // // Ensure guildid on channels
    // const channels = await client.database.find('channels', {});
    // let deleted = [], permissions = [];
    // for (const channel of channels) {
    //   if (channel.guildid) continue;
    //   let discordChannel = null;
    //   try {
    //     discordChannel = await client.channels.fetch(channel.id);
    //     if (!discordChannel) continue;
    //   } catch (e) {
    //     if (e.message == "Unknown Channel") deleted.push(channel.id);
    //     else if (e.message == "Missing Access") permissions.push(channel.id);
    //     else console.log(e.message);
    //     continue;
    //   }
    //   if (discordChannel?.guild?.id) {
    //     await client.database.updateOne('channels', { id: channel.id }, {$set:{ guildid: discordChannel.guild.id }});
    //     continue;
    //   }
    // }
    
    // if(client.guilds.cache.has('783178035322159156')) client.guilds.cache.get('783178035322159156').commands.set(client.commands.map(m=>m.commandData))
    // client.application.commands.set(client.commands.map(m=>m.commandData));
  }
}
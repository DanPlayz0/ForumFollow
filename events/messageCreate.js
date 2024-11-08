const Event = require('@structures/framework/Event');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    });
  }

  async run(client, message) {
    if (!message.webhookId || !message.author.bot) return;

    const relays = await client.database.find('relay', {webhookid: message.webhookId, guildid: message.guild.id});
    if (!relays || relays.length < 1) return;

    for (const relay of relays) {
      const channel = await client.channels.fetch(relay.channelid);
      if (!channel) continue;

      if (relay.threadid) {
        // Existing Thread Relay
        const thread = await channel.threads.fetch(relay.threadid);
        if (!thread) {
          await client.database.deleteOne('relay', {webhookid: message.webhookId, guildid: message.guild.id, channelid: channel.id, threadid: relay.threadid});
          continue;
        }

        try {
          await thread.send({
            content: message.content?.slice(0, 2000),
            embeds: [...message.embeds],
            files: message.attachments.map(a => a.url),
            allowedMentions: {parse: []},
          });
        } catch (err) {
          console.log(err);
          await sleep(800);
          continue;
        }
      } else {
        // New Thread Relay
        try {
          await channel.threads.create({
            name: getTitle(message, 100),
            appliedTags: [channel.availableTags.find(tag => tag.name === 'Relay')?.id, relay.tag].filter(x=>x),
            message: message.content.slice(0, 2000),
            reason: `Relayed by ${message.author.tag} (${message.author.id})`,
          })
        } catch (err) {
          console.log(err);
          await sleep(800);
          continue;
        }
      }

      
      await sleep(200);
    }
  }
}

function getTitle(message, maxLength = 256) {
  const headingIndex = message.content.split('\n').findIndex(line => line.startsWith('**') || line.startsWith('#'));
  if (headingIndex === -1) return message.cleanContent.slice(0, maxLength);
  const headingLine = message.cleanContent.split('\n').length > 1 ? message.cleanContent.split('\n')[headingIndex] : message.cleanContent;
  const heading = headingLine.replace(/^(#+ )/, '').trim();
  return heading.slice(0, maxLength);
}
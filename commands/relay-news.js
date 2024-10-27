const Command = require('@structures/framework/Command');
module.exports = class extends Command {
  constructor(client) {
    super(client, {
      enabled: true,
      description: 'Relay followed channels into a forum channel.',
      options: [
        {
          type: 3,
          name: 'follow',
          description: 'Which followed webhook to relay.',
          required: true,
          autocomplete: true,
        },
        {
          type: 7,
          name: 'channel',
          description: 'A forum channel.',
          channel_types: [15],
          required: true,
        },
        {
          type: 3,
          name: 'tag',
          description: 'A tag to add to the post.',
          required: false,
          autocomplete: true,
        }
      ],
      category: "General",
    })
  }

  async run(ctx) {
    if(!ctx.member.permissions.has('ManageChannels')) return ctx.sendMsg('You must have `MANAGE_CHANNELS` to relay followed channels to a forum channel.');

    const guildWebhooks = await ctx.guild.fetchWebhooks();
    const followWebhook = guildWebhooks.find(x=> x.id === ctx.args.getString('follow'));
    if (!followWebhook) return ctx.sendMsg('This webhook does not exist.', {ephemeral: true});
    if (!followWebhook.sourceGuild || !followWebhook.sourceChannel) return ctx.sendMsg('This webhook is not a followed webhook.', {ephemeral: true});
    
    const channel = ctx.args.getChannel('channel'), tag = ctx.args.getString('tag');
    const relayFollow = await ctx.database.findOne('relay', {webhookid: followWebhook.id, guildid: ctx.guild.id, channelid: channel.id});

    if (tag) {
      const availableTags = channel.availableTags;
      if (!availableTags.some(x=> x.id === tag.toLowerCase())) return ctx.sendMsg(`This tag is not available in ${channel}. Make sure to use the autocomplete, as it provides the tag id... Available tags: ${availableTags.map(x=> `- ${x.name} (ID: ${x.id})`).join('\n ')}`, {ephemeral: true});
    }

    if(relayFollow) {
      if (relayFollow.tag === ctx.args.getString('tag')) return ctx.sendMsg(`This webhook is already being relayed to ${channel} with the tag \`${channel.availableTags.find(x=>x.id == relayFollow.tag)?.name || "----"}\``, {ephemeral: true});
      await ctx.database.updateOne('relay', {webhookid: followWebhook.id, guildid: ctx.guild.id, channelid: channel.id}, {$set: {tag: ctx.args.getString('tag')}});
      ctx.sendMsg(`This webhook was updated to relay to ${channel} with the tag \`${channel.availableTags.find(x=>x.id == ctx.args.getString('tag'))?.name || "----"}\``, {ephemeral: true});
      return;
    }

    await ctx.database.insertOne('relay', {webhookid: followWebhook.id, guildid: ctx.guild.id, channelid: channel.id, tag: ctx.args.getString('tag')});
    ctx.sendMsg(`This webhook is now being relayed to ${channel} with the tag \`${channel.availableTags.find(x=>x.id == ctx.args.getString('tag'))?.name || "----"}\``, {ephemeral: true});
  }

  async runAutocomplete(ctx) {
    const focused = ctx.args.getFocused(true);
    if (focused.name == 'follow') {
      const webhooks = await ctx.guild.fetchWebhooks();
      const followedWebhooks = webhooks.filter(x=> x.sourceGuild || x.sourceChannel);
      return followedWebhooks.map(x=>({
        name: `${x.sourceGuild ? x.sourceGuild.name : 'Unknown'} #${x.sourceChannel ? x.sourceChannel.name : 'Unknown'}`.slice(0, 75),
        value: x.id,
      })).filter(x=> x.name.toLowerCase().includes((focused.value||"").toLowerCase())).slice(0,25);
    }
    if (focused.name == 'tag') {
      const channel = await ctx.guild.channels.fetch(ctx.args._hoistedOptions.find(x=>x.name==='channel').value);
      if (!channel) return []; // error it out to the user
      return channel.availableTags.map(x=>({
        name: x.name,
        value: x.id,
      })).filter(x=> x.name.toLowerCase().includes((focused.value||"").toLowerCase())).slice(0,25);
    }
  }
  
}
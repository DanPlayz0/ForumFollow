const Command = require('@structures/framework/Command');
module.exports = class extends Command {
  constructor(client) {
    super(client, {
      enabled: true,
      description: 'Relay followed channels into a forum channel.',
      options: [
        {
          type: 1,
          name: 'setup',
          description: 'Setup the relay webhook in a channel.',
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
              description: 'A tag to add to the post. (Only if not reusing thread)',
              required: false,
              autocomplete: true,
            },
            {
              type: 3,
              name: 'thread',
              description: 'Relay messages into a forum thread, not create a new thread.',
              required: false,
              autocomplete: true,
            }
          ]
        },
        {
          type: 1,
          name: 'remove',
          description: 'Remove a relayed webhook from a channel.',
          options: [
            {
              type: 3,
              name: 'relay_id',
              description: 'Which relay to remove.',
              required: true,
              autocomplete: true,
            }
          ]
        },
        {
          type: 1,
          name: 'list',
          description: 'List all relayed webhooks.',
          options: [
            {
              type: 7,
              name: 'channel',
              description: 'A forum channel.',
              channel_types: [15],
              required: true,
            }
          ]
        },
      ],
      category: "General",
    })
  }

  async run(ctx) {
    if(!ctx.member.permissions.has('ManageChannels')) return ctx.sendMsg('You must have `MANAGE_CHANNELS` to relay followed channels to a forum channel.');
    if (ctx.args._subcommand === 'setup') return this.runSetup(ctx);
    else if (ctx.args._subcommand === 'remove') return this.runRemove(ctx);
    else if (ctx.args._subcommand === 'list') return this.runList(ctx);
  }

  async runSetup(ctx) {
    if (!ctx.guild.members.me.permissions.has('ManageWebhooks')) return ctx.sendMsg('I must have `MANAGE_WEBHOOKS` to setup a relay to a forum channel.');

    const guildWebhooks = await ctx.guild.fetchWebhooks();
    const followWebhook = guildWebhooks.find(x=> x.id === ctx.args.getString('follow'));
    if (!followWebhook) return ctx.sendMsg('This webhook does not exist.', {ephemeral: true});
    if (!followWebhook.sourceGuild || !followWebhook.sourceChannel) return ctx.sendMsg('This webhook is not a followed webhook.', {ephemeral: true});
    
    const channel = ctx.args.getChannel('channel'), tag = ctx.args.getString('tag'), thread = ctx.args.getString('thread');
    if (tag && thread) return ctx.sendMsg('You cannot use a tag and a thread at the same time. There are separate behaviors for each.', {ephemeral: true});
    if (thread && !channel.threads.cache.has(thread)) return ctx.sendMsg('This thread does not exist.', {ephemeral: true});

    if (thread) {
      const relayFollow = await ctx.database.findOne('relay', {webhookid: followWebhook.id, guildid: ctx.guild.id, channelid: channel.id, threadid: thread});
      if(relayFollow) return ctx.sendMsg(`This webhook is already being relayed to ${channel} in the thread \`${thread}\``, {ephemeral: true});
      await ctx.database.insertOne('relay', {webhookid: followWebhook.id, guildid: ctx.guild.id, channelid: channel.id, threadid: thread});
      ctx.sendMsg(`This webhook is now being relayed to ${channel} in the thread \`${thread}\``, {ephemeral: true});
      return;
    }

    const relayFollow = await ctx.database.findOne('relay', {webhookid: followWebhook.id, guildid: ctx.guild.id, channelid: channel.id});
    if (relayFollow.threadid) return ctx.sendMsg("You can only have thread relays or tag relays, not both in the same channel.", {ephemeral: true});

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

    await ctx.database.insertOne('relay', {id: String(Date.now()), webhookid: followWebhook.id, guildid: ctx.guild.id, channelid: channel.id, tag: ctx.args.getString('tag')});
    ctx.sendMsg(`This webhook is now being relayed to ${channel} with the tag \`${channel.availableTags.find(x=>x.id == ctx.args.getString('tag'))?.name || "----"}\``, {ephemeral: true});
  }

  async runRemove(ctx) {
    if (!ctx.guild.members.me.permissions.has('ManageWebhooks')) return ctx.sendMsg('I must have `MANAGE_WEBHOOKS` to remove a relay from a forum channel.');

    const relayFollow = await ctx.database.findOne('relay', {id: ctx.args.getString('relay_id'), guildid: ctx.guild.id});
    if (!relayFollow) return ctx.sendMsg('This relay does not exist.', {ephemeral: true});

    await ctx.database.deleteOne('relay', {id: ctx.args.getString('relay_id'), guildid: ctx.guild.id});
    ctx.sendMsg('This relay has been removed.', {ephemeral: true});
  }

  async runList(ctx) {
    const channel = ctx.args.getChannel('channel');
    if (!channel) return ctx.sendMsg('This channel does not exist.', {ephemeral: true});

    const relays = await ctx.database.find('relay', {guildid: ctx.guild.id, channelid: channel.id});
    if (!relays || relays.length < 1) return ctx.sendMsg('There are no relays in this channel.', {ephemeral: true});

    const webhooks = await ctx.guild.fetchWebhooks();
    const threads = channel.threads.cache;

    const embed = new ctx.EmbedBuilder()
      .setTitle(`Relays in ${channel.name}`)
      .setDescription(relays.map(x=> {
        const webhook = webhooks.get(x.webhookid);
        return `**${webhook.name}** -> <#${x.threadid ? x.threadid : channel.id}>`;
      }).join('\n'))
      .setColor('#9f9f9f');
    ctx.sendMsg({embeds: [embed]});
  }

  async runAutocomplete(ctx) {
    const focused = ctx.args.getFocused(true);
    if (focused.name == 'follow') {
      if (!ctx.guild.members.me.permissions.has('ManageWebhooks')) return [{name: 'Bot does not have `MANAGE_WEBHOOKS`', value: 'error_no_manage_webhooks'}];
      const webhooks = await ctx.guild.fetchWebhooks();
      const followedWebhooks = webhooks.filter(x=> x.sourceGuild || x.sourceChannel);
      return followedWebhooks.map(x=>({
        name: `${x.sourceGuild ? x.sourceGuild.name : 'Unknown'} #${x.sourceChannel ? x.sourceChannel.name : 'Unknown'}`.slice(0, 75),
        value: x.id,
      })).filter(x=> x.name.toLowerCase().includes((focused.value||"").toLowerCase())).slice(0,25);
    }
    if (focused.name == 'tag') {
      if (!ctx.args._hoistedOptions.find(x=>x.name==='channel').value) {
        return [{name: 'Please select a channel first', value: 'error_no_channel'}];
      }
      const channel = await ctx.guild.channels.fetch(ctx.args._hoistedOptions.find(x=>x.name==='channel').value);
      if (!channel) return []; // error it out to the user
      return channel.availableTags.map(x=>({
        name: x.name,
        value: x.id,
      })).filter(x=> x.name.toLowerCase().includes((focused.value||"").toLowerCase())).slice(0,25);
    }
    if (focused.name == 'thread') {
      if (!ctx.args._hoistedOptions.find(x=>x.name==='channel').value) {
        return [{name: 'Please select a channel first', value: 'error_no_channel'}];
      }
      const channel = await ctx.guild.channels.fetch(ctx.args._hoistedOptions.find(x=>x.name==='channel').value);
      if (!channel) return [{name: 'No threads found', value: 'error_no_threads'}]; // error it out to the user
      if (!channel.threads) return [{name: 'Threads are not enabled in this channel', value: 'error_no_threads'}];
      return channel.threads.cache.map(x=>({
        name: x.name,
        value: x.id,
      })).filter(x=> x.name.toLowerCase().includes((focused.value||"").toLowerCase())).slice(0,25);
    }
    if (focused.name == 'relay_id') {
      if (!ctx.guild.members.me.permissions.has('ManageWebhooks')) return [{name: 'Bot does not have `MANAGE_WEBHOOKS`', value: 'error_no_manage_webhooks'}];
      const webhooks = await ctx.guild.fetchWebhooks();
      const channels = ctx.guild.channels.cache

      const relays = await ctx.database.find('relay', {guildid: ctx.guild.id});
      return relays.map(x=>({
        name: `${webhooks.get(x.webhookid).name} -> ${channels.get(x.channelid).name}${x.threadid ? ` -> ${channels.get(x.channelid).threads.cache.get(x.threadid).name}` : ''}`.slice(0,100),
        value: x.id,
      })).filter(x=> x.name.toLowerCase().includes((focused.value||"").toLowerCase())).slice(0,25);
    }
  }
  
}
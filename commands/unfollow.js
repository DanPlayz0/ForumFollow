const Command = require('@structures/framework/Command');
module.exports = class extends Command {
  constructor(client) {
    super(client, {
      enabled: true,
      description: 'Follow a forum channel.',
      options: [
        {
          type: 7,
          name: 'destination',
          description: "The channel sending updates to.",
          channel_types: [0,5],
          required: true,
        },
        {
          type: 3,
          name: 'followed',
          description: 'The followed forum channel id to unfollow.',
          required: true,
          autocomplete: true,
        },
      ],
      category: "General",
    })
  }

  async runAutocomplete(ctx) {
    const focused = ctx.args.getFocused(true);
    if (focused.name === 'followed') {
      const follows = await ctx.database.find('follow', { guildid: ctx.guild.id, active: true });
      const options = follows.map(f => {
        const channel = ctx.client.channels.cache.get(f.followid);
        return {
          name: channel ? `${channel.name} - ${channel.id}` : `Unknown Channel - ${f.followid}`,
          value: f.followid,
        };
      });
      return options.filter((option) => option.name.toLowerCase().includes(focused.value.toLowerCase())).slice(0, 25);
    }
  }

  async run(ctx) {
    if(!ctx.member.permissions.has('ManageGuild')) return ctx.sendMsg('You must have `MANAGE_GUILD` to follow a channel.');
    if(!ctx.member.permissions.has('ManageWebhooks')) return ctx.sendMsg('You must have `MANAGE_WEBHOOKS` to follow a channel.');
    if(!ctx.guild.members.me.permissions.has('ManageWebhooks')) return ctx.sendMsg('I am missing `MANAGE_WEBHOOKS` to execute this command.');

    const updateChannel = ctx.args.getChannel('destination');
    if (!updateChannel) return ctx.sendMsg("You must provide a valid channel to send updates into.");

    const followChannelId = ctx.args.getString('followed').replace(/[^\d]/g,'');
    if (!followChannelId) return ctx.sendMsg("You must provide a valid channel ID to follow.");
    const followChannel = await ctx.client.channels.fetch(followChannelId);
    if (!followChannel) return ctx.sendMsg("That channel does not exist.");

    const followed = await ctx.database.findOne('follow', { guildid: ctx.guild.id, active: true, followid: followChannel.id });
    if (!followed) return ctx.sendMsg("That channel is not setup as a follow.");
    
    try {
      const webhooks = await updateChannel.fetchWebhooks();
      const followedWebhook = webhooks.get(followed.webhook.id);
      if (followedWebhook) await followedWebhook.delete("Channel was unfollowed [/unfollow]");
    } catch (err) {
      console.error("[unfollow] Failed to delete webhook:", err);
    }
    await ctx.database.deleteOne('follow', { guildid: ctx.guild.id, active: true, followid: followChannel.id });

    await ctx.sendMsg(new ctx.EmbedBuilder()
      .setTitle("Unfollowed")
      .setDescription(`You have successfully unfollowed ${followChannel.name} (${followChannel.id}).`)
      .setColor('Red')
    );
  }
  
}
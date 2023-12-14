const Command = require('@structures/framework/Command');
module.exports = class extends Command {
  constructor(client) {
    super(client, {
      enabled: true,
      description: 'Follow a forum channel.',
      options: [
        {
          type: 3,
          name: 'id',
          description: 'A fourm channel id to follow.',
          required: true,
        },
        {
          type: 7,
          name: 'destination',
          description: "The channel to send the updates into.",
          channel_types: [0,5],
          required: true, 
        }
      ],
      category: "General",
    })
  }

  async run(ctx) {
    if(!ctx.member.permissions.has('ManageGuild')) return ctx.sendMsg('You must have `MANAGE_GUILD` to follow a channel.');
    if(!ctx.member.permissions.has('ManageWebhooks')) return ctx.sendMsg('You must have `MANAGE_WEBHOOKS` to follow a channel.');
    if(!ctx.guild.members.me.permissions.has('ManageWebhooks')) return ctx.sendMsg('I am missing `MANAGE_WEBHOOKS` to execute this command.');

    const channelId = ctx.args.getString('id').replace(/[^\d]/g,'');

    const followChannel = await ctx.client.channels.fetch(channelId);
    if (!followChannel) return ctx.sendMsg("That channel does not exist.");
    if (followChannel.type != 15) return ctx.sendMsg("You can only follow **forum** channels.");
    const followable = await ctx.database.findOne('channels', { id: followChannel.id });
    if (!followable) return ctx.sendMsg("That channel was not setup to be followed.");
    // if (followable.followByOthers == "own" && )

    const updateChannel = ctx.args.getChannel('destination');
    
    const msg = await ctx.sendMsg(new ctx.EmbedBuilder()
      .setTitle("Confirmation")
      .setDescription("Please confirm this is the correct channel you'd like to follow.")
      .setColor('Blurple')
      .addFields([
        { name: 'Server Name', value: ''+followChannel?.guild?.name, inline: true},
        { name: 'Server ID', value: ''+followChannel?.guild?.id, inline: true},
        { name: '\u200b', value: '\u200b', inline: true},
        { name: 'Follow Channel', value: ''+followChannel.toString(), inline: true},
        { name: 'Follow Channel ID', value: ''+followChannel.id, inline: true},
        { name: '\u200b', value: '\u200b', inline: true},
        { name: 'Update Channel', value: ''+updateChannel.toString(), inline: true},
        { name: 'Update Channel ID', value: ''+updateChannel.id, inline: true},
        { name: '\u200b', value: '\u200b', inline: true},
      ])
      .setFooter({text: `This will create a webhook in the update channel.`}),
        { components: [
          {type:1,components: [
            {type:2, style:3, label: "Follow", custom_id: "followc_confirm", },
            {type:2, style:4, label: "Cancel", custom_id: "followc_cancel", }
          ]}
      ]})

    const collector = msg.createMessageComponentCollector({ filter: (inter) => inter.customId.startsWith('followc_') && inter.user.id === ctx.author.id, time: 5*60*1e3 })

    collector.on('collect', async (interaction) => {
      interaction.deferUpdate();
      if(interaction.customId === 'followc_cancel') return collector.stop();
      else if(interaction.customId === 'followc_confirm') {
        collector.stop('start');
        const followExists = await ctx.database.findOne('follow', { guildid: ctx.guild.id, channelid: updateChannel.id, followid: followChannel.id, active: true });
        if (followExists) return ctx.sendMsg(new ctx.EmbedBuilder().setTitle('Channel Follow Cancelled').setDescription(`The channel ${updateChannel} is already following ${followChannel}.`).setColor('Red'), {components:[],ephemeral:true});
        
        const webhook = await updateChannel.createWebhook({ name: `${ctx.guild.name} #${followChannel.name}`, avatar: ctx.client.guilds.cache.get(ctx.guild.id).iconURL({format:"png",static:true}), reason: `Followed ${followChannel.name} (${followChannel.id}) from ${ctx.guild.name}` });
        await ctx.database.insertOne('follow', { guildid: ctx.guild.id, channelid: updateChannel.id, followid: followChannel.id, active: true, webhook: { id: webhook.id, token: webhook.token }, messages: [] });
        return ctx.sendMsg(new ctx.EmbedBuilder().setTitle('Channel Followed 🎉').setDescription(`The channel ${followChannel} was successfully **followed**.`).setColor('Green'), {components:[], ephemeral:true});
      }
    })

    collector.on('end', (_,reason) => {
      if(reason === 'start') return;
      ctx.sendMsg(new ctx.EmbedBuilder().setTitle('Channel Follow Cancelled').setDescription(`The channel ${followChannel} was **not** followed.`).setColor('Red'), {components:[],ephemeral:true});
    })
  }
  
}
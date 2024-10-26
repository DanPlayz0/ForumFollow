const Command = require('@structures/framework/Command');
const crosspostBehaviors = [
  {name: 'When Post Created', value: 'create'},
  // {name: 'On Context Menu', value: 'context'},
  {name: 'Disabled', value: 'disabled'},
];
const crossServerBehaviors = [
  {name: 'Everyone (Anyone can follow)', value: 'everyone'},
  {name: 'Restricted (This guild only)', value: 'own'},
];
module.exports = class extends Command {
  constructor(client) {
    super(client, {
      enabled: true,
      description: 'Make a fourm channel followable.',
      options: [
        {
          type: 7,
          name: 'channel',
          description: 'A fourm channel.',
          channel_types: [15],
          required: true,
        },
        {
          type: 3,
          name: 'crosspost',
          description: 'The behavior of the crossposting.',
          choices: crosspostBehaviors,
          required: true,
        },
        { 
          type: 3,
          name: 'cross-server-follow',
          description: 'Can this be followed from other servers?',
          required: false,
          choices: crossServerBehaviors
        },
      ],
      category: "General",
    })
  }

  async run(ctx) {
    if(!ctx.member.permissions.has('ManageChannels')) return ctx.sendMsg('You must have `MANAGE_CHANNELS` to set a channel as followable.');

    const channel = ctx.args.getChannel('channel'), crosspostStr = ctx.args.getString('crosspost'), followByOthersStr = ctx.args.getString('cross-server-follow') || 'everyone';
    const forumFollow = await ctx.database.findOne('channels', {id: channel.id, guildid: ctx.guild.id});
    
    if(forumFollow) {
      await ctx.database.updateOne('channels', {id: channel.id}, {$set: { behavior: crosspostStr, followByOthers: followByOthersStr }});
      ctx.sendMsg(`Crossposting behavior changed from \`${crosspostBehaviors.find(x=>x.value === forumFollow.behavior)?.name}\` to \`${crosspostBehaviors.find(x=>x.value === crosspostStr).name}\``)
      return;
    }

    try {
      const followAble = await channel.threads.create({
        name: "Follow Posts", autoArchiveDuration: 10080,
        message: { 
          content: "Add this channel's posts to your server!\nPressing the button below will provide instructions to follow this channel.", 
          components: [
            {type:1, components:[
              {type:2, style:3, label: "Follow", custom_id: 'follow_channel'},
              {type:2, style:5, label: "Invite", url: `https://discord.com/api/oauth2/authorize?client_id=1023320359786774528&permissions=395674250320&scope=applications.commands%20bot` },
              {type:2, style:5, label: "Terms of Service", url: `https://gist.github.com/DanPlayz0/96589fd6509926ae8dc3aa315e629705` },
              {type:2, style:5, label: "Privacy Policy", url: `https://gist.github.com/DanPlayz0/ecbbfb7104570e366353a056b9e254d2` },
            ]
          }]
        }
      });
      await followAble.join();
      await followAble.edit({flags:2});
    } catch {}

    await ctx.database.insertOne('channels', { id: channel.id, guildid: ctx.guild.id, behavior: crosspostStr, followByOthers: followByOthersStr });
    ctx.sendMsg(`People can now follow ${ctx.args.getChannel('channel')} and posts will only be crossposted \`${crosspostBehaviors.find(x=>x.value === crosspostStr).name}\`!`, {ephemeral: true})
  }
  
}
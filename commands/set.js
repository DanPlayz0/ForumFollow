const Command = require('@structures/framework/Command');
const crosspostBehaviors = [
  {name: 'When Post Created', value: 'create'},
  // {name: 'On Context Menu', value: 'context'},
  {name: 'Disabled', value: 'disabled'},
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
        }
      ],
      category: "General",
    })
  }

  async run(ctx) {
    const channel = ctx.args.getChannel('channel'), behaviorStr = ctx.args.getString('crosspost');
    const forumFollow = await ctx.database.findOne('channels', {id: channel.id});
    if(forumFollow) {
      await ctx.database.updateOne('channels', {id: channel.id}, {$set: { behavior: behaviorStr }})
      ctx.sendMsg(`Crossposting behavior changed from \`${crosspostBehaviors.find(x=>x.value === forumFollow.behavior)?.name}\` to \`${crosspostBehaviors.find(x=>x.value === behaviorStr).name}\``)
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
            {type:2, style:5, label: "Invite", url: `https://discord.com/api/oauth2/authorize?client_id=1023320359786774528&permissions=395674250320&scope=applications.commands%20bot` }
          ]}]
        }
      });
      await followAble.join();
      await followAble.edit({flags:2});
    } catch {}

    await ctx.database.insertOne('channels', { id: channel.id, behavior: behaviorStr, followByOthers: "everyone" });
    ctx.sendMsg(`People can now follow ${ctx.args.getChannel('channel')} and posts will only be crossposted \`${crosspostBehaviors.find(x=>x.value === behaviorStr).name}\`!`, {ephemeral: true})
  }
  
}
const Command = require('@structures/framework/Command');
const crosspostBehaviors = [
  {name: 'Anyone can follow (Default)', value: 'everyone'},
  {name: 'This guild only', value: 'own'},
];
module.exports = class extends Command {
  constructor(client) {
    super(client, {
      enabled: true,
      description: 'Toggle a channel from followed from other servers.',
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
          name: 'toggle',
          description: 'The behavior for other servers.',
          choices: crosspostBehaviors,
          required: true,
        }
      ],
      category: "General",
    })
  }

  async run(ctx) {
    const channel = ctx.args.getChannel('channel'), behaviorStr = ctx.args.getString('toggle');
    const forumFollow = await ctx.database.findOne('channels', {id: channel.id});
    if (!forumFollow) return ctx.sendMsg("Please set that channel as a followable channel before configuring the cross-server following setting.");
    
    await ctx.database.updateOne('channels', {id: channel.id}, {$set: { followByOthers: behaviorStr }})
    ctx.sendMsg(`The behavior for other servers has changed from \`${crosspostBehaviors.find((x) => x.value === (forumFollow?.followByOthers||"everyone"))?.name}\` to \`${crosspostBehaviors.find((x) => x.value === behaviorStr)?.name}\``)
  }
  
}

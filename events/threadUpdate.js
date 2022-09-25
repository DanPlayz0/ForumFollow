const Event = require('@structures/framework/Event');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    });
  }

  async run(client, old, thread) {
    if(old?.name == thread?.name) return;
    const followers = await client.database.find('follow', { active: true, messages: {$elemMatch: { "reference.threadId": thread.id }} });
    if(followers.length == 0) return;

    const msg = await thread.messages.fetch({limit: 1, after:0});
    let followMessage = `**${thread.name}**\n${msg.first().content}`;
    if(followMessage.length > 2000) followMessage = followMessage.slice(0,1997)+'...';

    for (let follower of followers) {
      const message = follower.messages.find(x => x.reference.threadId === thread.id);
      const sentMessage = await client.pkg.axios.patch(`https://discord.com/api/webhooks/${follower.webhook.id}/${follower.webhook.token}/messages/${message.data.id}?wait=true`, {
        content: followMessage,
        components: [
          {type:1,components:[{type:2, style:5, label: "Original Message", url: message.data.components[0].components[0].url }] }
        ],
        allowed_mentions: { parse: [] },
      }, {headers:{"Content-Type":"application/json"}}).then(x=>({data:x.data, code: x.status})).catch(err=>({data:err.response.data, code: err.response.status}));
      follower.messages[follower.messages.findIndex(x=>x.reference.threadId == thread.id)] = { ...sentMessage, reference: message.reference };
      await client.database.updateOne('follow', { guildid: follower.guildid, channelid: follower.channelid, followid: follower.followid, active: true }, {$set: {messages: follower.messages }});
      await sleep(200);
    }
  }
}
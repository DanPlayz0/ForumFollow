const Event = require('@structures/framework/Event');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    });
  }

  async run(client, msg) {
    const followers = await client.database.find('follow', { active: true, messages: {$elemMatch: { "reference.messageId": msg.id }} });
    if(followers.length == 0) return;
    for (let follower of followers) {
      const message = follower.messages.find(x => x.reference.messageId === msg.id);
      await client.pkg.axios.patch(`https://discord.com/api/webhooks/${follower.webhook.id}/${follower.webhook.token}/messages/${message.data.id}?wait=true`, {
        content: `[Original Message Deleted]`,
        components: [
          {type:1,components:[{type:2, style:5, label: "Original Message", url: message.data.components[0].components[0].url, disabled: true }] }
        ],
        allowed_mentions: { parse: [] },
      }, {headers:{"Content-Type":"application/json"}}).then(x=>({data:x.data, code: x.status})).catch(err=>({data:err.response.data, code: err.response.status}));
      await client.database.updateOne('follow', { guildid: follower.guildid, channelid: follower.channelid, followid: follower.followid, active: true }, {$set: {messages: follower.messages.filter(x => x.reference.messageId != msg.id) }});
      await sleep(200);
    }
  }
}
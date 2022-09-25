const Event = require('@structures/framework/Event');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    });
  }

  async run(client, thread) {
    if (client.channels.cache.get(thread.parentId)?.type != 15) return;
    await sleep(500);
    const followedPeople = await client.database.find('follow', {followid: thread.parentId});
    if(followedPeople.length == 0) return;
    
    const messages = await thread.messages.fetch();
    const message = messages.first();
    

    let followMessage = `**${thread.name}**\n${message.content}`;
    if(followMessage.length > 2000) followMessage = followMessage.slice(0,1997)+'...'

    for (let follower of followedPeople) {
      const sentMessage = await client.pkg.axios.post(`https://discord.com/api/webhooks/${follower.webhook.id}/${follower.webhook.token}?wait=true`, {
        content: followMessage,
        components: [
          {type:1,components:[{type:2, style:5, label: "Original Message", url: message.url }] }
        ],
        allowed_mentions: { parse: [] },
      }, {headers:{"Content-Type":"application/json"}}).then(x=>({data:x.data, code: x.status})).catch(err=>({data:err.response.data, code: err.response.status}));
      await client.database.updateOne('follow', { guildid: follower.guildid, channelid: follower.channelid, followid: follower.followid, active: true }, {$push:{messages:
        {...sentMessage, reference: { threadId: thread.id, messageId: message.id} }
      }});
      await sleep(200);
    }


    

  }

}
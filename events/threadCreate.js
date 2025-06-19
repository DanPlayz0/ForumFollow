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

    const fourmSettings = await client.database.findOne('channels', {id: thread.parentId});
    if(!fourmSettings || fourmSettings.behavior != 'create') return;

    const followedPeople = await client.database.find('follow', {followid: thread.parentId});
    if(followedPeople.length == 0) return;
    
    let messages = await thread.messages.fetch();
    let message = messages.first();
    if (!message) {
      await sleep(1000);
      messages = await thread.messages.fetch();
      message = messages.first();
      if (!message) {
        console.error(`[threadCreate] No messages found (after retry) in thread ${thread.id} in channel ${thread.parentId}`);
        client.webhooks.error.send({content: `**${client.user.username} - threadCreate (with retry) - id: ${thread.id} - parent: ${thread.parentId}:**\n\`\`\`${JSON.stringify(messages)}\`\`\``});
        return;
      }
    }
    if (!message) {
      console.error(`[threadCreate] No message found in thread ${thread.id} in channel ${thread.parentId}`);
      client.webhooks.error.send({content: `**${client.user.username} - threadCreate - id: ${thread.id} - parent: ${thread.parentId}:**\n\`\`\`\n${JSON.stringify(messages)}`.slice(0,1995)+'\`\`\`' });
      return;
    }

    let followMessage = `**${thread.name}**\n${message?.content || "[Missing content]"}`;
    if(followMessage.length > 2000) followMessage = followMessage.slice(0,1997)+'...'

    for (let follower of followedPeople) {
      let followerMessage = followMessage;
      if (follower.copy_content == 'no') followerMessage = `**${thread.name}**`;

      let followerMentions = [];
      if (follower.copy_pings == 'role') followerMentions.push("roles");
      else if (follower.copy_pings == 'user') followerMentions.push("users");
      else if (follower.copy_pings == 'user_role') followerMentions.push("users", "roles");
      else if (follower.copy_pings == 'everyone') followerMentions.push("everyone");

      const sentMessage = await client.pkg.axios.post(`https://discord.com/api/webhooks/${follower.webhook.id}/${follower.webhook.token}?wait=true`, {
        content: followerMessage,
        components: [
          {type:1,components:[{type:2, style:5, label: "Original Message", url: message.url }] }
        ],
        allowed_mentions: { parse: followerMentions },
      }, {headers:{"Content-Type":"application/json"}}).then(x=>({data:x.data, code: x.status})).catch(err=>({data:err.response.data, code: err.response.status}));
      await client.database.updateOne('follow', { guildid: follower.guildid, channelid: follower.channelid, followid: follower.followid, active: true }, {$push:{messages:
        {...sentMessage, reference: { threadId: thread.id, messageId: message.id} }
      }});
      await sleep(200);
    }

  }
}
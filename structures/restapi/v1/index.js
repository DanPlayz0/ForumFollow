const { Router } = require("express");

const route = Router();

route.get('/stats', async (req, res, next) => {
  let redisStats = await req.redis.get(`${req.client.config.redis.prefix}BOT:STATS`);
  if(req.query.forceCache) redisStats = null;
  if(redisStats) redisStats = JSON.parse(redisStats)
  else {
    const guildCount = req.client.shard ? await req.client.shard.fetchClientValues('guilds.cache.size') : [req.client.guilds.cache.size];
    const ping = req.client.shard ? await req.client.shard.fetchClientValues('ws.ping') : [req.client.ws.ping];
    const users = req.client.shard ? await req.client.shard.broadcastEval(() => this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)) : [req.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)];

    let shards = [];
    guildCount.map((count, shardId) => {
      shards.push({
        id: shardId, 
        guilds: count,
        users: users[shardId], 
        ping: ping[shardId],
      })
    });
    redisStats = {
      version: {
        nodejs: process.version,
        discordjs: "v"+req.client.discord.version,
      },
      shards: shards,
      total: {
        guilds: guildCount.reduce((servers, num) => num + servers, 0),
        users: users.reduce((users, num) => num + users, 0),
        ping: Math.round(ping.reduce((users, num) => num + users, 0) / ping.length)
      }
    };
    await req.redis.setex(`${req.client.config.redis.prefix}BOT:STATS`, 2 * 60, JSON.stringify(redisStats))
  }
  res.json(redisStats)
});

module.exports = route;
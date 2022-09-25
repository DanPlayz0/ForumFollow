const { Router } = require("express");

const { getUser, addUser } = require('./discordAPI');

function createKey(len=44) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < len; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

const route = Router();

route.get("/login", async (req, res, next) => {
  res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${req.client.user.id}&response_type=code&scope=identify%20guilds&prompt=none&redirect_uri=${encodeURIComponent(req.client.config.restapi.domain)}/auth/callback`);
});

route.get("/callback", async (req, res, next) => {
  const rc = {redis: req.redis, client: req.client};
  if (!req.query.code) return res.redirect(req.client.config.domain);
  const code = req.query.code;
  const result = await getUser({code}, rc);
  if (!result) return res.redirect('/auth/login');
  const [user, {refresh_token, access_token}] = result;
  
  const userKey = `${createKey(16)}`;
  await req.redis.setex(`PRIMO_USER_${userKey}`, 7*24*60*60, JSON.stringify(user));
  await req.redis.setex(`PRIMO_USER_${userKey}_KEYS`, 7*24*60*60, JSON.stringify({refresh_token, access_token}));
  res.cookie("seshkey", `${userKey}`, {
    httpOnly: true,
    expire: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secret: 'MatarATuPrimo'
  });
  
  res.redirect(`${req.client.config.domain}/api/auth/callback?token=${userKey}`);
});

route.get("/logout", async (req, res, next) => {
  const { seshkey } = req.cookies;
  if(seshkey) {
    await req.redis.setex(`PRIMO_USER_${seshkey}`, 15, null);
    await req.redis.setex(`PRIMO_USER_${seshkey}_KEYS`, 15, null);
  }
  res.clearCookie("seshkey");
  res.clearCookie("backURL");

  res.redirect(req.client.config.domain);
});

route.get('/discord', async (req,res,next) => {
  res.redirect(req.client.config.supportServerInvite);
})

route.get('/invite', async (req,res,next) => {
  if(req.query.guildId) return res.redirect(`https://discord.com/oauth2/authorize?client_id=${req.client.user.id}&permissions=8&response_type=code&scope=bot%20identify%20guilds&redirect_uri=${encodeURIComponent(req.client.config.restapi.domain)}/auth/callback&guild_id=${req.query.guildId}`)
  res.redirect(`https://discord.com/oauth2/authorize?client_id=${req.client.user.id}&permissions=8&response_type=code&scope=bot%20identify%20guilds&redirect_uri=${encodeURIComponent(req.client.config.restapi.domain)}/auth/callback`)
})

module.exports = route;

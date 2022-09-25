const axios = require('axios');
const config = require('@root/config');

module.exports.refreshUser = async (opts, rc) => {
  if (!rc) throw Error('Redis & Client was not defined.');
  const params = new URLSearchParams();
  params.append("client_id", rc.client.user.id);
  params.append("client_secret", config.restapi.oauth.client_secret);
  params.append("redirect_uri", `${config.restapi.domain}/auth/callback`);
  params.append("scope", "identify");

  if (opts.code) {
    params.append("grant_type", "authorization_code");
    params.append("code", opts.code);
  } else if (opts.refresh_token) {
    params.append("grant_type", "refresh_token");
    params.append("code", opts.refresh_token);
  }

  const response = await axios({
    url: `https://discord.com/api/oauth2/token`,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  let json = await response.json();
  return json;
}

module.exports.getUser = async (opts, rc) => {
  if (!rc) throw Error('Redis & Client was not defined.');
  let access_token, refresh_token;
  if (!opts.access_token) {
    let json = await module.exports.refreshUser(opts, rc);
    access_token = json.access_token;
    refresh_token = json.refresh_token
  } else {
    access_token = opts.access_token;
    refresh_token = opts.refresh_token;
  }

  let user = await axios({
    url: `https://discord.com/api/users/@me`,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).then(res => res.data).catch(err => { });

  user.guilds = await axios({
    url: `https://discord.com/api/users/@me/guilds`,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).then(res => res.data).catch(err => { });

  if (user.code === 0) return false;

  return [user, { refresh_token, access_token }];
};

module.exports.getGuilds = async (access_token) => {
  return await axios({
    url: `https://discord.com/api/users/@me/guilds`,
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  }).then(res => res.data);
}

module.exports.getBot = (id) => {
  return new Promise(function (resolve, reject) {
    axios({
      url: `https://discord.com/api/users/${id}`,
      headers: {
        Authorization: `Bot ${config.token}`
      }
    }).then(res => res.data).then(data => {
      if (data.code == 10013) return resolve(false);
      resolve(data);
    })
  });
};

module.exports.addUser = async (opts) => {
  if (!opts.userId || !opts.accessToken) throw Error('an opt is undefined.');
  return new Promise(function (resolve, reject) {
    axios({
      url: `https://discord.com/api/guilds/${opt.guildId}/members/${opts.userId}`,
      headers: {
        Authorization: `Bot ${config.token}`,
        access_token: opts.accessToken,
        roles: ['793680728348164107']
      }
    }).then(res => res.data).then(data => {
      resolve(data);
    })
  });
};

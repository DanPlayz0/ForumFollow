const Event = require('@structures/framework/Event');
const Context = require('@structures/framework/ContextInteraction');
module.exports = class extends Event {
  constructor(client) {
    super(client, {
      enabled: true,
    });
  }

  async run(client, interaction) {
    if(interaction.type == 4) this.autoComplete(client, interaction);
    if(interaction.type == 2) this.slashCommand(client, interaction);
    if (interaction.customId == 'follow_channel') this.buttonFollow(client, interaction);
  }

  async buttonFollow (client, interaction) {
    interaction.reply({
      content: [
        "How to follow this channel in your server.\n",
        "1. Invite the bot (If you haven't already)",
        `2. Run \`/follow id:${interaction.channel.parentId}\`\n`,
        "The update channel is going to be where the updates will be sent"
      ].join('\n'),
      components: [
        {
          type: 1,
          components: [
            {type:2, style:5, label: "Invite", url: `https://discord.com/api/oauth2/authorize?client_id=1023320359786774528&permissions=395674250320&scope=applications.commands%20bot` },
          ]
        }
      ],
      ephemeral: true,
    })
  }

  async autoComplete(client, interaction) {
    const cmd = client.commands.get(interaction.commandName);
    if(!cmd) return interaction.respond([]);

    const ctx = new Context({client, interaction, commandType: 'interaction'});
    return cmd._entrypoint(ctx, 'autocomplete');
  }

  async slashCommand(client, interaction) {
    const ctx = new Context({client, interaction, commandType: 'interaction'});

    // Command Cooldown System
    const now = Date.now(), timestamps = client.cooldowns, cooldownAmount = 4500;
    if (timestamps.has(ctx.author.id)) {
      const expirationTime = timestamps.get(ctx.author.id) + cooldownAmount;
  
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return ctx.interaction.reply({content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the command.`, ephemeral: true})
      }
    }
    timestamps.set(ctx.author.id, now);
    setTimeout(() => timestamps.delete(ctx.author.id), cooldownAmount);

    const command = client.commands.get(interaction.commandName);
    if(!command) return;
    client.webhooks.command.send({content: `${ctx.author.tag} \`${ctx.author.id}\` used **${interaction.commandName}** in ${interaction.guild.name} \`${interaction.guild.id}\` ||/${interaction.commandName} ${interaction.options._hoistedOptions.map(m => `${m.name}:${m.value}`).join(' ')}`.slice(0,1995)+'||', allowedMentions: { parse: [] } })
    return command._entrypoint(ctx, 'slash');
  }
}
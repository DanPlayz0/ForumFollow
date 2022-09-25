module.exports = class Command {
  constructor(client, options) {
    this.client = client;
    this.location = null;
    this.fileName = null;
    this.enabled = "enabled" in options ? options.enabled : true;
    
    this.commandData = {
      name: null,
      description: options.description,
      options: options.options,
      defaultPermissions: options.defaultPermissions,
    }

    this.conf = {
      cooldown: options?.cooldown ?? 1,
      aliases: options?.aliases ?? [],
      category: options?.category ?? 'Other',
    }

    this.permissions = {
      user: options?.permissions?.user ?? [],
      bot: options?.permissions?.bot ?? [],
    }
  }

  // This function will run everytime the slash command is ran
  run(ctx) {
    throw new Error('Command run method not implemented');
  }

  // This function will fire when the command has an option with the flag autocomplete.
  runAutocomplete(ctx) {
    return [];
  }

  // This function will run everytime the context menu is ran
  runContext(ctx) {
    throw new Error('Command runContext method not implemented');
  }

  // Error Catching Functions
  async _entrypoint(ctx, commandType) {
    if(commandType === 'slash') {
      await ctx.interaction.deferReply();
      try {
        await this.run(ctx);
      } catch (err) {
        console.error(err);
        ctx.client.webhooks.error.send(`**${ctx.client.user.username} - Command Error:**\n\`\`\`\n${err.stack}`.slice(0,1995)+'\`\`\`')
        ctx.sendMsg(new ctx.MessageEmbed()
          .setTitle('Oops')
          .setColor('Red')
          .setDescription(`The error that occured has been logged into our systems. If this is repeative, report it to DanPlayz#7757 at <${ctx.client.config.supportServerInvite}>.\n\`\`\`js\n${err.message}\`\`\``))
      }
    } else if(commandType === 'autocomplete') {
      try {
        const value = await this.runAutocomplete(ctx);
        ctx.interaction.respond(value);
      } catch (err) {
        console.error(err);
        ctx.client.webhooks.error.send(`**${ctx.client.user.username} - Command Autocomplete Error:**\n\`\`\`\n${err.stack}`.slice(0,1995)+'\`\`\`')
        ctx.interaction.respond([]);
      }
    } else return ctx.sendMsg(`This seems to be a broken command. Please report this to DanPlayz#7757 at <${ctx.client.config.supportServerInvite}>.`);
  }
}
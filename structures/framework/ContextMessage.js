/**
 * This class provides a object of options for the run method
 */
module.exports = class Context {
  constructor(options) {
    this.client = options.client;
    this.commandType = 'message';
    
    this.commandName = options.commandName;
    this.commandData = options.commandData;

    this.message = options.message;
    this.action = options.message;
    this.prefix = options.prefix || this.client.config.settings.prefix

    this.member = this.action.member;
    this.guild = this.action.guild;
    this.author = this.action.author;
    this.channel = this.action.channel;
    
    this.args = new (this.client.framework.messageArguments)(this, options.args, this.commandData.options);
    this.query = this.args.query;

    this.database = this.client.database;
    this.services = this.client.services;

    this.discord = this.client.discord;
    this.MessageEmbed = this.discord.EmbedBuilder;
    this.Permissions = this.discord.PermissionsBitField.Flags;

    this.pagify = this.pagify;
    this.sendMsg = this.sendMsg;
  }

  async sendMsg(content = null, options = {}) {
    if (!content) throw ReferenceError('content is not defined');
    if (typeof content === 'object' && !(content instanceof this.MessageEmbed)) { options = content; content = undefined; }
    if (options instanceof this.MessageEmbed) options = { embeds: [options] };

    let message;
    if(options.message) message = options.message, delete options.message;

    const newOptions = Object.assign({
      content: typeof content === 'string' ? content : undefined,
      embeds: content instanceof this.MessageEmbed ? [content] : [],
    }, options);

    let msg;
    if (message) msg = await message.edit(newOptions);
    else msg = await this.action.channel.send(newOptions);

    return msg;
  }

  async pagify(embeds, options = {}) {
    if (typeof embeds !== 'object') throw TypeError('embeds must be typeof Object');
    if (!Array.isArray(embeds)) embeds = [embeds];

    let pages = embeds.length, currentPage = (options && options.currentPage) || 0, descriptions = (options && options.descriptions) || [];
    embeds.filter(m => m instanceof this.MessageEmbed).map((embed, i) => embed.setFooter(`Requested by ${this.author.username} • Page ${i + 1} of ${pages}${embed?.footer?.text ? `\n${embed.footer.text}` : ''}`));

    let selectMenu = [];
    embeds.map((_a, i) => selectMenu.push({ label: `Page ${i + 1}`, description: descriptions.length >= i ? descriptions[i] : undefined, value: `page_${i}`, default: i == 0 }));
    selectMenu = selectMenu.slice(0, 25)

    const buttons = [
      {
        type: 1,
        components: [ 
          { type: 3, custom_id: "pagination_pageselect", options: selectMenu, placeholder: "Choose a page", min_values: 1, max_values: 1, disabled: pages == 1 }
        ]
      },
      {
        type: 1,
        components: [
          { style: 1, type: 2, emoji: { name: undefined, id: '849472262868697119' }, custom_id: 'pagination_prev', disabled: pages == 1 },
          { style: 4, type: 2, emoji: { name: undefined, id: '849472262884556842' }, custom_id: 'pagination_stop' },
          { style: 1, type: 2, emoji: { name: undefined, id: '849472263190740992' }, custom_id: 'pagination_next', disabled: pages == 1 },
          { style: 4, type: 2, emoji: { name: undefined, id: '848216792845516861' }, custom_id: 'pagination_delete' },
        ]
      },
    ];

    const msg = await this.sendMsg(embeds[currentPage], { components: buttons });

    const filter = (interaction) => interaction.customId.startsWith('pagination_') && interaction.user.id === this.author.id && interaction.message.id == msg.id;
    const collector = this.interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('end', (collected, action) => {
      if (action == 'trash') return;
      buttons.map(row => row.components.map(btn => btn.disabled = true));
      this.sendMsg(embeds[currentPage], { components: buttons, message: msg });
    });
    collector.on("collect", async (button) => {
      collector.resetTimer();
      button.deferUpdate();

      function updateSelectMenu(cPage) {
        selectMenu = [];
        embeds.map((_a, i) => selectMenu.push({ label: `Page ${i + 1}`, description: descriptions.length >= i ? descriptions[i] : undefined, value: `page_${i}`, default: i == cPage }));
        selectMenu = selectMenu.slice(0, 25)
        buttons.find(row => row.components.find(item => item.type == 3)).components.find(item => item.type == 3).options = selectMenu;
      }

      try {
        switch (button.customId) {
          case "pagination_pageselect": {
            currentPage = Number(button.values[0].slice('page_'.length));
            updateSelectMenu(currentPage);
            this.sendMsg(embeds[currentPage], { components: buttons, message: msg });
          } break;
          case "pagination_next": {
            currentPage++;
            if (currentPage == pages) currentPage = 0;
            updateSelectMenu(currentPage);
            this.sendMsg(embeds[currentPage], { components: buttons, message: msg });
          } break;
          case "pagination_stop": {
            collector.stop();
            buttons.map(row => row.components.map(btn => btn.disabled = true));
            this.sendMsg(embeds[currentPage], { components: buttons, message: msg });
          } break;
          case "pagination_prev": {
            --currentPage;
            if (currentPage == -1) currentPage = pages - 1;
            updateSelectMenu(currentPage);
            this.sendMsg(embeds[currentPage], { components: buttons, message: msg });
          } break;
          case "pagination_delete": {
            collector.stop('trash');
            msg.delete();
          } break;
        }
      } catch (err) {
        console.log(err.message);
      }
    });

    return msg;
  }
}
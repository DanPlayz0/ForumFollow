const klaw = require("klaw"), path = require("path");

module.exports = class Loader {
  constructor(client) {
    this.client = client;

    // Debug Option
    this.DEBUG = false;
  }

  start() {
    this.loadCommands('./commands');
    this.loadEvents('./events');
  }

  /**
   * Loads the commands folder.
   *
   * @param {*} folder the relative path to the commands folder, i suggest keeping it in the default location 'commands'.
   */
  loadCommands(folder) {
    klaw(folder).on('data', (file) => {
      const commandFile = path.parse(file.path);
      if (!commandFile.ext || commandFile.ext !== '.js') return;

      const response = this.loadCommand(commandFile.dir, `${commandFile.name}${commandFile.ext}`);

      if (response) console.error(response);
    });
  }


  /**
   * LOAD COMMAND
   *
   * Used to simplify loading commands from multiple locations
   * @param {String} cmdPath
   * @param {String} cmdName
   */
  loadCommand(cmdPath, cmdName) {
    try {
      const props = new (require(path.resolve(cmdPath, cmdName)))(this.client);

      if (!props.enabled) return;

      props.location = cmdPath;
      props.fileName = cmdName;
      props.commandData.name = cmdName.replace(/\..+$/,'')

      if (props.init) props.init(this.client);

      this.client.commands.set(props.commandData.name, props);

      // props.aliases.forEach((alias) => {
      //   this.client.aliases.set(alias, props.help.name);
      // });
      console.log(`Loading command ${props.commandData.name}`);
      return false;
    } catch (error) {
      return `Unable to load command ${cmdName}: ${error.message}`;
    }
  }

  /**
   * UNLOAD COMMAND
   *
   * Used to simplify unloads commands from multiple locations
   * @param {String} cmdPath
   * @param {String} cmdName
   */
  async unloadCommand(cmdPath, cmdName) {
    let command;
    if (this.client.commands.has(cmdName)) {
      command = this.client.commands.get(cmdName);
    } else if (this.client.aliases.has(cmdName)) {
      command = this.client.commands.get(this.client.aliases.get(cmdName));
    } else {
      return `The command '${cmdName}' doesn't exist, it's not an alias either.`;
    }

    if (command.shutdown) {
      await command.shutdown(this.client);
    }

    delete require.cache[require.resolve(path.resolve(cmdPath, command.conf.fileName))];
    return false;
  }

  /**
   * Loads the events folder.
   *
   * @param {*} folder the relative path to the events folder, i suggest keeping it in the default location 'events'.
   */
  loadEvents(folder) {
    klaw(folder).on('data', (file) => {
      const eventFile = path.parse(file.path);
      if (!eventFile.ext || eventFile.ext !== '.js') return;

      const response = this.loadEvent(eventFile.dir, `${eventFile.name}${eventFile.ext}`);

      if (response) console.error(response);
    });
  }

  /**
   * LOAD EVENT
   *
   * Used to simplify loading events from multiple locations
   * @param {String} evtPath
   * @param {String} evtName
   */
  loadEvent(evtPath, evtName) {
    try {
      const props = new (require(path.resolve(evtPath, evtName)))(this.client);
      if (props.conf.enabled === false) return;
      props.conf.location = evtPath;
      props.conf.fileName = evtName;
      props.conf.name = evtName.replace(/\..+$/,'')

      if (props.init) {
        props.init(this.client);
      }
      
      this.client.events.set(props.conf.name, props);
      
      if(props.conf.ws) this.client.ws.on(props.conf.name, (...args) => props.run(this.client, ...args));
      else this.client.on(props.conf.name, (...args) => props.run(this.client, ...args));

      console.log(`Loading event ${props.conf.name}`);
      return false;
    } catch (error) {
      return `Unable to load event ${evtName}: ${error.message}`;
    }
  }

  /**
   * UNLOAD EVENT
   *
   * Used to simplify unloads events from multiple locations
   * @param {String} evtPath
   * @param {String} evtName
   */
  async unloadEvent(evtPath, evtName) {
    let event;
    if (this.client.events.has(evtName)) {
      event = this.client.events.get(evtName);
    } else {
      return `The event '${evtName}' doesn't exist`;
    }

    if (event.shutdown) await event.shutdown(this.client);
    
    this.client.removeAllListeners(evtName);
    this.client.ws.removeAllListeners(evtName);
    this.client.events.delete(evtName);
    

    delete require.cache[require.resolve(path.resolve(evtPath, event.conf.fileName))];
    return false;
  }
}
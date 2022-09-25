module.exports = class MessageArguments {
  constructor(ctx, args, commandOptions) {
    this.ctx = ctx;
    
    this.data = args;
    this.commandOptions = commandOptions;
    this.query = args.join(' ');
  }

  get(name) {
    if (this.commandOptions.length === 0) return null;
    if (this.commandOptions.length === 1) return this.data.join(' ');
    const option = this.commandOptions.findIndex(m=>m.name===name);
    return this.data[option] || null;
  }

  getString(name) {
    return this.get(name);
  }
}
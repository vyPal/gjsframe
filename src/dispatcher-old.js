/**
 * Class for handling and running commands
 */
 class FrameDispatcher {
  /**
   * Creates a dispatcher
   * @param {FrameClient} client - The client for which the dispatcher is being created
   * @param {FrameRegistry} registry - The registry in which groups and commands are registered
   */
  constructor(client, registry) {
    Object.defineProperty(this, 'client', { value: client });
    this.registry = registry || this.client.registry;
  }

  /**
   * Handles a incoming message
   * @param {Message} message - The message to handle
   * @return {boolean} - False if not executed and true if executed
   */
  handleMessage(message) {
    if(this.client.provider.get('global', 'user-blacklist', []).some(id => message.author.id === id)) return false;
    let prefix = this.client.provider.get(message.guild.id, 'prefix', this.client.options.commandPrefix);
    if(message.content.startsWith(prefix)) {
      return this.handleCommand(message, 1, prefix);
    }
    if(message.mentions.has(this.client.user.id)) {
      return this.handleCommand(message, 2);
    }
  }

  /**
   * Handles a slash command
   * @param {Interaction} interaction - The interaction to handle
   */
  handleSlash(interaction) {
    if(interaction.isCommand()) {
      this.handleCommand(interaction, 3);
    }
  }

  /**
   * Handles a command
   * @param {Message|Interaction} message - The message (or interaction) containing the command
   * @param {Integer} [starttype=1] - The type of the command start (1-prefix, 2-mention, 3-interaction)
   * @param {String} [prefix=null] - The prefix used if starttype == 1
   */
  handleCommand(message, starttype = 1, prefix = null){
    if(starttype === 1) {
      let args = message.content.split(' ');
      let commandName = args[0].slice(prefix.length);
      args = args.slice(1);
      let command = this.registry.commands.get(commandName.toLowerCase());
      command.info.clientPermissions.forEach((perm) => {
        if(!message.guild.me.permissions.has(perm)) return false;
      });
      command.info.userPermissions.forEach((perm) => {
        if(!message.member.permissions.has(perm)) return false;
      });
      if(command.info.ownerOnly && !this.client.isOwner(message.member)) return false;
      return command.run(message, args);
    }else if(starttype === 2) {
      let args = message.content.split(' ');
      let commandName = args[1];
      args = args.slice(2);
      let command = this.client.registry.commands.get(commandName.toLowerCase());
      command.info.clientPermissions.forEach((perm) => {
        if(!message.guild.me.permissions.has(perm)) return false;
      });
      command.info.userPermissions.forEach((perm) => {
        if(!message.member.permissions.has(perm)) return false;
      });
      if(command.info.ownerOnly && !this.client.isOwner(message.member)) return false;
      return command.run(message, args);
    }else if(starttype === 3) {
      let args = message.options;
      let commandName = message.commandName;
      let command = this.client.registry.commands.get(commandName.toLowerCase());
      command.info.clientPermissions.forEach((perm) => {
        if(!message.guild.me.permissions.has(perm)) return false;
      });
      command.info.userPermissions.forEach((perm) => {
        if(!message.member.permissions.has(perm)) return false;
      });
      if(command.info.ownerOnly && !this.client.isOwner(message.member)) return false;
      return command.runSlash(interaction, args);
    }
  }
}

module.exports = FrameDispatcher;
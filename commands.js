////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// COMMANDS ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////

var queueLimit = 20;

var util = require('./util.js');

var commands = [
    {
        command: "stop",
        aliases: [],
        description: "Stops playlist (will also skip current song!)",
        parameters: [],
        permissions: ['admin'],
        execute: function (message, params, context) {
            context.bot.reply(message, "stopping");
            context.bot.voiceConnection.stopPlaying();
            context.stopped = true;
        }
    },

    {
        command: "resume",
        aliases: [],
        description: "Resumes playlist",
        parameters: [],
        permissions: ['admin'],
        execute: function (message, params, context) {
            context.bot.reply(message, "resuming playlist");
            context.stopped = false;
        }
    },

    {
        command: "request",
        aliases: ["play"],
        description: "Adds the requested video to the playlist queue",
        parameters: ["YouTube URL or video ID"],
        permissions: [],
        execute: function (message, params, context) {
            if (queueLimit != -1 && context.queue.length >= queueLimit) {
                context.bot.reply(message, "queue is full, request rejected!");
                return;
            }
            var videoID = context.getVideoId(params[1]);
            context.addVideoToQueue(videoID, message);
        }
    },

    {
        command: "np",
        aliases: ["currentsong", "nowplaying", "songname", "song"],
        description: "Displays the current song",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            context.bot.reply(message, context.getNowPlaying());
        }
    },

    {
        command: "commands",
        aliases: ["help"],
        description: "Displays this message, duh!",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            var response = "available commands:";

            for (var i = 0; i < commands.length; i++) {
                var c = commands[i];
                response += "\n!" + c.command;

                for (var k = 0; k < c.aliases.length; k++) {
                    response += "/" + c.aliases[k];
                }

                for (var j = 0; j < c.parameters.length; j++) {
                    response += " <" + c.parameters[j] + ">";
                }

                response += ": " + c.description;
            }

            context.bot.reply(message, response);
        }
    },

    {
        command: "setnp",
        aliases: [],
        description: "Sets whether the bot will announce the current song or not",
        parameters: ["on/off"],
        permissions: ['admin'],
        execute: function (message, params, context) {
            var response;
            if (params[1].toLowerCase() == "on") {
                response = "will announce song names in chat";
                context.np = true;
            } else if (params[1].toLowerCase() == "off") {
                response = "will no longer announce song names in chat";
                context.np = false;
            } else {
                response = "sorry? Please use only either `on` or `off` as parameter for this command";
            }

            context.bot.reply(message, response);
        }
    },

    {
        command: "skip",
        aliases: ["next", "nextsong"],
        description: "Skips the current song",
        parameters: [],
        permissions: ['admin'],
        execute: function (message, params, context) {
            context.playNextTrack();
        }
    },

    {
        command: "queue",
        aliases: ["songlist"],
        description: "Displays the queue",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            context.getSongQueue(message);
        }
    },

    {
        command: "clearqueue",
        aliases: [],
        description: "Removes all songs from the queue",
        parameters: [],
        permissions: ['admin'],
        execute: function (message, params, context) {
            context.clearQueue(message);
        }
    },

    {
        command: "permissions",
        aliases: [],
        description: "Checks the required role to use a command",
        parameters: ["command name"],
        permissions: [],
        execute: function (message, params, context) {

            var command = searchCommand(params[1]);
            var response;

            if (command) {
                response = "roles that can use command \"" + params[1] + "\": ";
                var permissions = command.permissions;
                if (permissions.length == 0) {
                    response += "(any role)";
                } else {
                    for (var i = 0; i < permissions.length; i++) {
                        response += permissions[i];

                        if (i != permissions.length - 1) {
                            response += ", ";
                        }
                    }
                }
            } else {
                response = "unknown command: \"" + params[1] + "\"";
            }

            context.bot.reply(message, response);
        }
    },

    {
        command: "addpermission",
        aliases: [],
        description: "Allows a role to execute a certain command",
        parameters: ["command name", "role name"],
        permissions: ['admin'],
        execute: function (message, params, context) {

            var command = searchCommand(params[1]);

            if (!command) {
                context.bot.reply(message, "unknown command: \"" + params[1] + "\"");
                return;
            }

            var pos = util.inArray(params[2].toLowerCase(), command.permissions);

            if (pos !== false) {
                context.bot.reply(message, "that role can already execute that command");
                return;
            }

            command.permissions.push(params[2].toLowerCase());
            context.bot.reply(message, "users with role " + params[2] + " can now execute command " + params[1]);
        }
    },

    {
        command: "removepermission",
        aliases: [],
        description: "Revokes a role's permission to execute a certain command",
        parameters: ["command name", "role name"],
        permissions: ['admin'],
        execute: function (message, params, context) {

            var command = searchCommand(params[1]);

            if (!command) {
                context.bot.reply(message, "unknown command: \"" + params[1] + "\"");
                return;
            }

            var pos = util.inArray(params[2].toLowerCase(), command.permissions);

            if (pos === false) {
                context.bot.reply(message, "that role cannot already execute that command");
                return;
            }

            command.permissions.splice(pos, 1);
            context.bot.reply(message, "users with role " + params[2] + " can no longer execute command " + params[1]);

            if (command.permissions.length == 0) {
                context.bot.reply(message, "command " + params[1] + " can now be executed by anyone.");
            }
        }
    },

    {
        command: "queuelimit",
        aliases: [],
        description: "Displays the current queue limit",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            if (queueLimit != -1) {
                context.bot.reply(message, "crrent queue limit is set to " + queueLimit + " songs.");
            } else {
                context.bot.reply(message, "there is no queue limit currently.");
            }

        }
    },

    {
        command: "volume",
        aliases: ["setvolume"],
        description: "Sets the output volume of the bot",
        parameters: [],
        permissions: ["admin"],
        execute: function (message, params, context) {
            var newVolume = parseFloat(params[1]);

            if (isNaN(newVolume) || newVolume < -1) {
                context.bot.reply(message, "please, provide a valid number");
            } else {
                context.bot.voiceConnection.setVolume(newVolume);
                context.bot.reply(message, "volume set to " + newVolume);
            }
        }
    },
    
    {
        command: "setqueuelimit",
        aliases: [],
        description: "Changes the queue limit. Set to -1 for no limit.",
        parameters: ['limit'],
        permissions: ['admin'],
        execute: function (message, params, context) {
            var newLimit = parseInt(params[1]);
            var response;

            if (isNaN(newLimit) || newLimit < -1) {
                response = "please, provide a valid number";
            } else {
                queueLimit = newLimit;
                response = (newLimit == -1) ? "queue limit removed" : "new queue limit set to " + newLimit + " songs";
            }

            context.bot.reply(message, response);
        }
    }

];

function searchCommand(command) {
    var commandName = command.toLowerCase();

    for (var i = 0; i < commands.length; i++) {
        if (commands[i].command == commandName || util.containsElement(commandName, commands[i].aliases)) {
            return commands[i];
        }
    }

    return false;
}

function setAdminRole(roleName) {
    if (typeof roleName !== 'string') {
        throw new Error('New role name must be String');
    }

    for (var i = 0; i < commands.length; i++) {
        var pos = util.inArray('admin', commands[i].permissions);
        if (pos !== false) {
            commands[i].permissions[pos] = roleName.toLowerCase();
        }
    }
}

var exports = module.exports = {
    searchCommand: searchCommand,
    setAdminRole: setAdminRole
};

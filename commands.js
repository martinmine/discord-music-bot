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
            context.bot.reply(message, "Stopping!");
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
            context.bot.reply(message, "Resuming playlist!");
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
                context.bot.reply(message, "Queue is full!");
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
            context.bot.reply(message, "Now Playing: " + context.getNowPlaying());
        }
    },

    {
        command: "commands",
        aliases: ["help"],
        description: "Displays this message, duh!",
        parameters: [],
        permissions: [],
        execute: function (message, params, context) {
            var response = "Available commands:";

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
                response = "Will announce song names in chat";
                context.np = true;
            } else if (params[1].toLowerCase() == "off") {
                response = "Will no longer announce song names in chat";
                context.np = false;
            } else {
                response = "Sorry?";
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
                response = "Roles that can use command \"" + params[1] + "\": ";
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
                response = "Unknown command: \"" + params[1] + "\"";
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
                context.bot.reply(message, "Unknown command: \"" + params[1] + "\"");
                return;
            }

            var pos = util.inArray(params[2].toLowerCase(), command.permissions);

            if (pos !== false) {
                context.bot.reply(message, "That role can already execute that command");
                return;
            }

            command.permissions.push(params[2].toLowerCase());
            context.bot.reply(message, "Users with role " + params[2] + " can now execute command " + params[1]);
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
                context.bot.reply(message, "Unknown command: \"" + params[1] + "\"");
                return;
            }

            var pos = util.inArray(params[2].toLowerCase(), command.permissions);

            if (pos === false) {
                context.bot.reply(message, "That role cannot already execute that command");
                return;
            }

            command.permissions.splice(pos, 1);
            context.bot.reply(message, "Users with role " + params[2] + " can no longer execute command " + params[1]);

            if (command.permissions.length == 0) {
                context.bot.reply(message, "Command " + params[1] + " can now be executed by anyone.");
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
                context.bot.reply(message, "Current queue limit is set to " + queueLimit + " songs.");
            } else {
                context.bot.reply(message, "There is no queue limit currently.");
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
                response = "Please, provide a valid number";
            } else {
                queueLimit = newLimit;
                response = (newLimit == -1) ? "Queue limit removed" : "New queue limit set to " + newLimit + " songs";
            }

            context.bot.reply(message, response);
        }
    }

];

function searchCommand(command) {
    var commandName = command.toLowerCase();

    for (var i = 0; i < commands.length; i++) {
        if (commands[i].command == commandName || util.inArray(commandName, commands[i].aliases)) {
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

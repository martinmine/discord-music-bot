////////////////////////////////////////////////////////////////////////////////
//					      Copyright (C) agubelu 2016                          //   
//                                                                            //   
//    This program is free software: you can redistribute it and/or modify    //   
//    it under the terms of the GNU General Public License as published by    //   
//    the Free Software Foundation, either version 3 of the License, or       //   
//    (at your option) any later version.                                     //   
//                                                                            //   
//    This program is distributed in the hope that it will be useful,         //   
//    but WITHOUT ANY WARRANTY; without even the implied warranty of          //   
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the           //   
//    GNU General Public License for more details.                            //   
//                                                                            //   
//    You should have received a copy of the GNU General Public License       //   
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.   //   
////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// DEFAULT MESSAGES ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: Make responses configurable (i18n?)


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// STUFF DECLARATION ///////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var myID, serverName, channelName, textChannelName;
var stopped = false;
var np = true;

var currentSong;

var queue = [];

var request = require('request');
var Discord = require("discord.js");

var bot = new Discord.Client();
var commands = require('./commands.js');
var util = require('./util.js');

// TODO: Remove this after more refactoring
var botFacade = {
    bot: bot,
    stopped : stopped,
    getVideoId: getVideoId,
    addVideoToQueue: addVideoToQueue,
    queue: queue,
    getNowPlaying: getNowPlaying,
    np: np,
    playNextTrack: playNextTrack,
    getSongQueue: getSongQueue,
    clearQueue: clearQueue
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// EXPORTED METHODS ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.run = function (email, password, server, channel, textChannel) {
    serverName = server;
    channelName = channel;
    textChannelName = textChannel;

    bot.login(email, password);
};

exports.setCommandPermissions = function (commandName, arg1) {
    var command = commands.searchCommand(commandName);
    var args = arguments.length;

    if (args < 2) {
        throw new Error("Insufficient arguments!");
    }

    if (!command) {
        throw new Error("Command " + commandName + " does not exist");
    }

    if (Array.isArray(arg1)) {

        for (var i = 0; i < arg1.length; i++) {
            if (typeof arg1[i] !== 'string') {
                throw new Error("Element " + i + " in array is not String");
            }
        }

        command.permissions = arg1;

    } else {
        var array = [];

        for (var i = 1; i < args; i++) {
            if (typeof arguments[i] !== 'string') {
                throw new Error("Argument " + (i + 1) + " is not String");
            }
            array.push(arguments[i]);
        }

        command.permissions = array;
    }
};

exports.setDefaultAdminRole = function (roleName) {
    commands.setAdminRole(roleName);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// EVENT HANDLERS ///////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

bot.on('ready', function () {
    console.log('Bot ready!');
    sendMessageToChat("Ready to take requests!");

    var channel = bot.servers.get('name', serverName).channels.get('name', channelName);
    bot.joinVoiceChannel(channel, function (error) {
        console.log(error.message);
    });

    var mentionText = bot.user.mention();
    myID = mentionText.substring(2, mentionText.length - 1);
    checkQueue();
});

//Message handler
//I should probably reduce this if-else stacking
bot.on("message", function (message) {

    if (message.author.id != myID) { // Message sent by somebody else (to prevent an infinite loop with direct messages)

        if (message.channel.topic !== undefined) { // Message sent through server channel (instead of DM)

            if (message.channel.name == textChannelName) { //Message sent through the text channel the bot is listening to

                if (message.content[0] == '!') { // Command issued
                    handleCommand(message, message.content.substring(1));

                } else if (message.isMentioned(myID)) { //Bot mentioned in message
                    bot.reply(message, "omg, hi! Use !commands to see my command list.");
                }
            }

        } else { // Direct Message
            console.log('User ' + message.author.username + ' said -> ' + message.content);
            bot.reply(message, "I'm agubot! Use !commands in #" + channelName + " see the command list.");
        }
    }
});

//Command handler
function handleCommand(message, command) {
    console.log(getTime() + message.author.username + " -> " + command);
    var params = command.split(' ');
    var com = commands.searchCommand(params[0]);

    if (com) {
        if (!hasPermission(message.author, com)) {
            bot.reply(message, "sorry, you don't have permission to use that command.");
        } else if (params.length - 1 < com.parameters.length) {
            bot.reply(message, "insufficient parameters!");
        } else {
            com.execute(message, params, botFacade);
        }
    } else {
        bot.reply(message, "unknown command: \"" + params[0] + "\"");
    }
}

//Queue handler
var checkQueue = function () {
    if (!stopped && !queueEmpty() && !bot.voiceConnection.playing) {
        playNextTrack();
    }

    setTimeout(checkQueue, 5000);
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// AUXILIARY FUNCTIONS ///////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function hasPermission(user, command) {
    var permissions = command.permissions;

    if (permissions.length == 0) {
        return true;
    }

    var userRoles = bot.servers.get('name', serverName).rolesOfUser(user);

    for (var i = 0; i < userRoles.length; i++) {
        if (util.inArray(userRoles[i].name.toLowerCase(), permissions) !== false) {
            return true;
        }
    }

    return false;
}

function clearQueue(message) {
    queue = [];
    bot.reply(message, "queue has been cleared!");
}

function getSongQueue(message) {

    var response = "";

    if (queueEmpty()) {
        response = "the queue is empty.";
    } else {
        for (var i = 0; i < queue.length; i++) {
            var video = queue[i];
            response += video.title + " | `" + video.duration +  "` | requested by " + video.mention + "\n";
        }
    }

    bot.reply(message, response);
}

function playNextTrack() {

    if (queueEmpty()) {
        sendMessageToChat("Queue is empty!");
        bot.voiceConnection.stopPlaying();
        return;
    }

    var nextTrack = queue[0];

    bot.voiceConnection.playFile(nextTrack.fileName, false, function(e) {
        if (e != null) {
            sendMessageToChat("There was a problem playing this song (" + nextTrack.title + "), skipping to next");
            console.log('Error while playing song', e);
            playNextTrack();
        }
    });

    currentSong = nextTrack;

    console.log(getTime() + "NP: \"" + nextTrack.title + "\" (by " + nextTrack.user + ")");

    if (np) {
        sendMessageToChat("**" + nextTrack.title + " | `" + nextTrack.duration + "` | by " + nextTrack.mention + " | https://youtu.be/" + nextTrack.id + "**");
    }

    queue.splice(0, 1);
}

function getNowPlaying() {
    if (bot.voiceConnection.playing) {
        return "now playing " + currentSong.title + " | `" + currentSong.duration + "` | requested by " + currentSong.mention + "";
    } else {
        if (queueEmpty()) {
            return "nothing, queue empty";
        } else {
            return "waiting for next song";
        }
    }
}

function addVideoToQueue(videoID, message) {
    bot.reply(message, '**grabbing track info for `' + videoID + '`**', function(error, sentInfoMessage) {
        bot.deleteMessage(message);
        
        var fs = require('fs');
        var youtubedl = require('youtube-dl');
        console.log('Starting downloading', videoID);
        var video = youtubedl('http://www.youtube.com/watch?v=' + videoID,
            ['--extract-audio', '-f bestaudio'],
            { cwd: __dirname });

        video.on('info', function(info) {
            video.pipe(fs.createWriteStream(info._filename));

            video.on('end', function() {
                queue.push({
                    title: info.title,
                    user: message.author.username,
                    mention: message.author.mention(),
                    fileName: info._filename,
                    duration: util.formatTimestamp(info.duration),
                    id: videoID
                });

                bot.deleteMessage(sentInfoMessage);
                bot.reply(message, "**queued " + info.title + " | `" + util.formatTimestamp(info.duration) + "` | https://youtu.be/" + videoID + "**");
            });
        });

        video.on('error', function(error) {
            bot.reply(message, "unable to queue song, make sure its is a valid Youtube URL or contact a server admin.");
            console.log('Error while downloading yt video', error);
        });
    });
}

function sendMessageToChat(message) {
    bot.sendMessage(bot.servers.get('name', serverName).channels.get('name', textChannelName), message);
}

function getVideoId(string) {
    var searchToken = "?v=";
    var i = string.indexOf(searchToken);

    if (i == -1) {
        searchToken = "&v=";
        i = string.indexOf(searchToken);
    }

    if (i == -1) {
        searchToken = "youtu.be/";
        i = string.indexOf(searchToken);
    }

    if (i != -1) {
        var substr = string.substring(i + searchToken.length);
        var j = substr.indexOf("&");

        if (j == -1) {
            j = substr.indexOf("?");
        }

        if (j == -1) {
            return substr;
        } else {
            return substr.substring(0, j);
        }
    }

    return string;
}

function queueEmpty() {
    return queue.length === 0;
}

function getTime() {
    function f(x) {
        return x < 10 ? "0" + x : x;
    }

    var date = new Date();
    return "[" + f(date.getHours()) + ":" + f(date.getMinutes()) + ":" + f(date.getSeconds()) + "] ";
}

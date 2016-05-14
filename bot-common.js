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

var nowPlayingTitle = "";
var nowPlayingUser = "";

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
    bot.sendMessage(bot.servers.get('name', serverName).channels.get('name', textChannelName), "Ready to take requests!");

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
                    bot.reply(message, "Use !commands to see the command list.");
                } else {
                    bot.reply(message, "You're typing in a music-only chat. Type !commands to see what I can do.")
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
            bot.reply(message, "Sorry, you don't have permission to use that command.");
        } else if (params.length - 1 < com.parameters.length) {
            bot.reply(message, "Insufficient parameters!");
        } else {
            com.execute(message, params, botFacade);
        }
    } else {
        bot.reply(message, "Unknown command: \"" + params[0] + "\"");
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
    bot.reply(message, "Queue has been cleared!");
}

function getSongQueue(message) {

    var response = "";

    if (queueEmpty()) {
        response = "the queue is empty.";
    } else {
        for (var i = 0; i < queue.length; i++) {
            response += "\"" + queue[i]['title'] + "\" (requested by @" + queue[i]['user'] + ")\n";
        }
    }

    bot.reply(message, response);
}

function playNextTrack() {

    if (queueEmpty()) {
        bot.sendMessage(bot.servers.get('name', serverName).channels.get('name', textChannelName), "Queue is empty!");
        bot.voiceConnection.stopPlaying();
        return;
    }

    bot.voiceConnection.playFile(queue[0]['url']);

    nowPlayingTitle = queue[0]['title'];
    nowPlayingUser = queue[0]['user'];

    var videoId = queue[0]['id'];

    console.log(getTime() + "NP: \"" + nowPlayingTitle + "\" (by " + nowPlayingUser + ")");

    if (np) {
        var msg = "**Playing [" + nowPlayingTitle + "] by " + queue[0]['mention'] + " | https://youtu.be/" + videoId + "**";
        bot.sendMessage(bot.servers.get('name', serverName).channels.get('name', textChannelName), msg);
    }

    queue.splice(0, 1);
}

function getNowPlaying() {
    if (bot.voiceConnection.playing) {
        return "\"" + nowPlayingTitle + "\" (requested by @" + nowPlayingUser + ")";
    } else {
        return "Nothing!";
    }
}

function addVideoToQueue(videoID, message) {

    var baseURL = "https://savedeo.com/download?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D";

    request(baseURL + videoID, function (error, response, body) {

        if (!error && response.statusCode == 200) {
            var cheerio = require('cheerio'), $ = cheerio.load(body);
            var videoTitle = $('title').text();

            if (videoTitle.indexOf('SaveDeo') != -1) {
                bot.reply(message, "Sorry, this track can't be played outside of Youtube.");
                return;
            }

            // TODO: get API for this
            var audioURL = $('#main div.clip table tbody tr th span.fa-music').first().parent().parent().find('td a').attr('href');

            queue.push({
                title: videoTitle,
                user: message.author.username,
                mention: message.author.mention(),
                url: audioURL,
                id: videoID
            });

            bot.reply(message, "**[" + videoTitle + "] added to the queue. https://youtu.be/" + videoID + "**");
            bot.deleteMessage(message);
        } else {
            bot.reply(message, "There has been a problem handling your request. (Error:" + error + ")");
            console.log(error);
        }
    });
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

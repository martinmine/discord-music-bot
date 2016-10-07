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
var voiceConnection;
var nowPlaying = false;
var currentSongStream;

// TODO: Remove this after more refactoring
var botFacade = {
    bot: bot,
    stopped : stopped,
    addVideoToQueue: addVideoToQueue,
    queue: queue,
    getNowPlaying: getNowPlaying,
    np: np,
    playNextTrack: playNextTrack,
    getSongQueue: getSongQueue,
    clearQueue: clearQueue,
    requestSong: requestSong,
    getVolume: getVolume,
    setVolume: setVolume
};

function getVolume() {
    if (currentSongStream != null) {
        return currentSongStream.volume;
    } else {
        return -1;
    }
}

function setVolume(volume) {
    if (currentSongStream != null) {
        currentSongStream.setVolume(volume);
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////// EXPORTED METHODS ///////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.run = function (email, password, server, channel, textChannel) {
    serverName = server;
    channelName = channel;
    textChannelName = textChannel;

    bot.login(email, password)
        .catch(function (e) {
            console.log(e);
            console.log('Unable to sign in, invalid username/password or client not allowed to sign in in this area (check your email)');
        });
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

    var channel = bot.guilds.find('name', serverName).channels.find('name', channelName);
    channel.join().then(connection => {
        voiceConnection = connection;
    });

    var mentionText = bot.user.toString();
    myID = mentionText.substring(2, mentionText.length - 1);
    checkQueue();
});

//Message handler
//I should probably reduce this if-else stacking
bot.on("message", function (message) {

    if (message.author.id != myID) { // Message sent by somebody else (to prevent an infinite loop with direct messages)

        if (message.channel.topic !== undefined) { // Message sent through server channel (instead of DM)

            if (message.channel.name == textChannelName) { //Message sent through the text channel the bot is listening to

                if (validURL(message.content)) {
                    requestSong(message, message.content);
                } else if (message.content[0] == '!') { // Command issued
                    handleCommand(message, message.content.substring(1));
                } else if (message.isMentioned(myID)) { //Bot mentioned in message
                    message.reply("omg, hi! Use !commands to see my command list.");
                }
            }

        } else { // Direct Message
            console.log('User ' + message.author.username + ' said -> ' + message.content);
            message.reply("I'm agubot! Use !commands in #" + channelName + " see the command list.");
        }
    }
});

bot.on('disconnect', function() {
    console.log('bot disconnected');
});

function validURL(str) {
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if(!regex.test(str)) {
        return false;
    } else {
        return true;
    }
}

//Command handler
function handleCommand(message, command) {
    console.log(getTime() + message.author.username + " -> " + command);
    var params = command.split(' ');
    var com = commands.searchCommand(params[0]);

    if (com) {
        if (!hasPermission(message.author, com)) {
            message.reply("sorry, you don't have permission to use that command.");
        } else if (params.length - 1 < com.parameters.length) {
            message.reply("insufficient parameters!");
        } else {
            com.execute(message, params, botFacade);
        }
    } else {
        message.reply("unknown command: \"" + params[0] + "\"");
    }
}

//Queue handler
var checkQueue = function () {
    if (!stopped && !queueEmpty() && !nowPlaying) {
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

    var userRoles = bot.guilds.find('name', serverName).members.find('user', user).roles.array();

    for (var i = 0; i < userRoles.length; i++) {
        if (util.inArray(userRoles[i].name.toLowerCase(), permissions) !== false) {
            return true;
        }
    }

    return false;
}

function clearQueue(message) {
    queue = [];
    message.reply("queue has been cleared!");
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

    message.reply(response);
}

function playNextTrack() {

    if (queueEmpty()) {
        sendMessageToChat("Queue is empty!");
        if (currentSongStream != null) {
            currentSongStream.end();
        }
        return;
    }

    var nextTrack = queue[0];

    nowPlaying = true;

    currentSongStream = voiceConnection.playFile(nextTrack.fileName);

    currentSongStream.on('end', () => {
        console.log('song done');
        nowPlaying = false;
        currentSongStream = null;
    });
    currentSongStream.on('error', (err) => {
        if (e != null) {
            sendMessageToChat("There was a problem playing this song (" + nextTrack.title + "), skipping to next");
            console.log('Error while playing song', e);
            playNextTrack();
        }

        currentSongStream = null;
    });

    currentSong = nextTrack;
    console.log(getTime() + "NP: \"" + nextTrack.title + "\" (by " + nextTrack.user + ")");

    if (np) {
        sendMessageToChat("**" + nextTrack.title + " | `" + nextTrack.duration + "` | by " + nextTrack.mention + " | " + nextTrack.id + "**");
    }

    queue.splice(0, 1);
}

function getNowPlaying() {
    if (nowPlaying) {
        return "now playing " + currentSong.title + " | `" + currentSong.duration + "` | requested by " + currentSong.mention + "";
    } else {
        if (queueEmpty()) {
            return "nothing, queue empty";
        } else {
            return "waiting for next song";
        }
    }
}

function addVideoToQueue(url, message) {
    message.reply('**grabbing track info for `' + url + '`**')
        .then(sentInfoMessage => {
            message.delete();

            var fs = require('fs');
            var youtubedl = require('youtube-dl');
            console.log('Starting downloading', url);
            var video = youtubedl(url,
                ['--extract-audio', '-f bestaudio'],
                { cwd: __dirname });

            video.on('info', function(info) {
                video.pipe(fs.createWriteStream(info._filename));

                video.on('end', function() {
                    queue.push({
                        title: info.title,
                        user: message.author.username,
                        mention: message.author.toString(),
                        fileName: info._filename,
                        duration: util.formatTimestamp(info.duration),
                        id: url
                    });

                    sentInfoMessage.delete();
                    message.reply("**queued " + info.title + " | `" + util.formatTimestamp(info.duration) + "` | " + url + "**");
                });
            });

            video.on('error', function(error) {
                message.reply("unable to queue song, make sure its is a valid supported URL or contact a server admin.");
                console.log('Error while downloading video', error);
            });
        });
}

function sendMessageToChat(message) {
    var guild = bot.guilds.find('name', serverName);
    var channel = guild.channels.find('name', textChannelName);
    channel.sendMessage(message);
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

function requestSong(message, url) {
    if (commands.getQueueLimit() != -1 && queue.length >= commands.getQueueLimit()) {
        message.reply("queue is full, request rejected!");
        return;
    }

    addVideoToQueue(url, message);
}
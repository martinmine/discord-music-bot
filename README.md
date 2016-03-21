# WORK IN PROGRESS
sorry i've been busy i'll attend this some day i swear

[![NPM](https://nodei.co/npm/discord-music-bot.png?downloads=true)](https://nodei.co/npm/discord-music-bot/)

---

*Discord Music Bot* aims to be a flexible, yet simple to use bot which implements a song playlist in a Discord server. It handles requests from users, places them in a queue and plays the songs the users requested.

It requires very little and simple configuration and can be deployed in any server in a matter of minutes.

---

##Commands
####Public commands

* **!request \<YouTube URL or video ID\>**: Places the requested song into the queue.
* **!np**: Displays the current song.
* **!commands**: Displays all available commands.
* **!queue**: Displays the song queue.
* **!permissions \<command name\>**: Displays the required role to execute a certain command.
* **!queuelimit**: Displays the maximum number of songs the queue can hold.
 
####Admin commands

* **!stop**: Stops the playlist.
* **!resume**: Resumes playlist playback
* **!setnp \<on/off\>**: Selects whether the bot will announce the current song in chat or not.
* **!skip**: Skips the current song.
* **!clearqueue**: Removes all songs from the queue.
* **!setqueuelimit \<limit\>**: Changes the maximum number of songs the queue can hold. Set to -1 for no limit.
* **!addpermission \<command name\> \<role name\>**: Allows a role to execute a certain command.
* **!removepermission \<command name\> \<role name\>**: Revokes a role's permission to execute a certain command.

`addpermission and removepermission should only be used for exceptional circumstances since they are not the preferred way to set command permissions. Please read below.`
 
####Regarding command permissions
By default, any user can use any of the public commands and only users with server role 'Admin' can execute admin commands.

It is highly likely that you need to further customise these permissions, since the administrative role name in your server may not be called 'Admin' or because you just want to change these permissions in any way. This can be achieved through the **!addpermission** and **!removepermission** commands, but they have some drawbacks: they can't be used with any role name that contains spaces, permissions set through these commands are not persisted and will be lost on a bot restart, and also without any further setup you will not be even able to use them if you don't have 'Admin' role.

These issues will be fixed on future updates.

TODO explains how to properly setup command permissions.



#Setup

###1. Installing Node.js and discord-bot-music module
You can download Node.js [here](https://nodejs.org/en/). You'll need version 0.12 or latest.

After Node.js has been successfully installed, you'll need to install discord-music-bot module. If you're using Windows, please see [discord.js' documentation](https://discordjs.readthedocs.org/en/latest/installing.html) regarding some aditional software you'll need to install for the *discord.js* library to work properly, which is used by the bot.

After you have installed everything required by *discord.js*, you can install the *discord-music-bot* module just by opening a command prompt and typing:

`npm install discord-music-bot`

If you're using Linux, just run the above command and everything should work fine.

###2. Setting up a Discord account

You will need a Discord account to be used as the music bot. You can use an existing one or create a new one for this purpose. If you decide to create a new account to serve as the bot, you will need to register it with an email and a password.

In any case, the account you decide to use **must already be a member of the server** you'll use the bot in. If it isn't, just get an invitation and manually join the server.

###3. Setting up the bot
####Simplest configuration
Ok, since everything is ready, you can now set up your bot! In this example, let's assume you have a server role called 'Admin' and you're fine with the default permission system.

Let's create a .js file called *whatever*.js with the following content:
```js
var myBot = require('discord-music-bot');
myBot.run("account email", "account password", "Server name", "Voice channel name", "Text channel name");
```

For example, if the credentials of my bot account are *agu@be.lu* / *SuperStrongPassword*, my server is called *Cool Discord Server*, I want the bot to join voice channel *Music* and to listen to text channel *#general* for commands:

```js
var myBot = require('discord-music-bot');
bot.run("agu@be.lu", "SuperStrongPassword", "Cool Discord Server", "Music", "general");
```

Note that you don't need to include the *#* in the text channel name.



And that's it! To run your bot, open a command prompt and type:

`node /path/to/my/file/whatever.js`

Your bot should now have joined your server in the desired voice channel. You can now start typing commands in chat!

---

####Changing admin role name

If you think the default permissions are fine but your administrative role name in the server is called, say, *Boss* instead of *Admin*, then there is a very simple way to fix that without having to change permissions for every command:

```js
var myBot = require('discord-music-bot');
myBot.setDefaultAdminRole("Boss");
myBot.run("agu@be.lu", "SuperStrongPassword", "Cool Discord Server", "Music", "general");
```

Now every user with role *Boss* will be able to execute administrative commands.

---

####Setting individual permissions for each command

Of course, you can customise permissions further than just changing the *Admin* role name.

In the following example, we will set permissions so that users with role *Boss* can execute all administrative commands, but users with role *DJ* can also use *!stop*, *!resume* and *!skip* in addition to the regular public commands.

```js
var myBot = require('discord-music-bot');

myBot.setCommandPermissions("stop", "Boss", "DJ");
myBot.setCommandPermissions("resume", "Boss", "DJ");
myBot.setCommandPermissions("skip", "Boss", "DJ");
myBot.setCommandPermissions("setnp", "Boss");
myBot.setCommandPermissions("clearqueue", "Boss");
myBot.setCommandPermissions("setqueuelimit", "Boss");
myBot.setCommandPermissions("addpermission", "Boss");
myBot.setCommandPermissions("removepermission", "Boss");

myBot.run("agu@be.lu", "SuperStrongPassword", "Cool Discord Server", "Music", "general");
```

We have overrided the default permission list of those commands: *stop*, *resume* and *skip* can be executed by both *Boss* and *DJ*, and the remaining commands can only be executed by *Boss*. We didn't override the rest of the commands, so they are still public.



But we can make it much shorter:

```js
var myBot = require('discord-music-bot');

myBot.setDefaultAdminRole("Boss");
myBot.setCommandPermissions("stop", "Boss", "DJ");
myBot.setCommandPermissions("resume", "Boss", "DJ");
myBot.setCommandPermissions("skip", "Boss", "DJ");

myBot.run("agu@be.lu", "SuperStrongPassword", "Cool Discord Server", "Music", "general");
```

All administrative commands are to be run by role *Boss* instead of *Admin*. Also, *stop*, *resume* and *skip* are available to both *Boss* and *DJ*

You can also use string arrays as parameters:

```js
var myBot = require('discord-music-bot');

myBot.setDefaultAdminRole("Boss");
myBot.setCommandPermissions("stop", ["Boss", "DJ"]);
myBot.setCommandPermissions("resume", ["Boss", "DJ"]);
myBot.setCommandPermissions("skip", ["Boss", "DJ"]);

myBot.run("agu@be.lu", "SuperStrongPassword", "Cool Discord Server", "Music", "general");
```

If a command has an empty permission list, then it can be run by anyone. It becomes a public command.

```js
var myBot = require('discord-music-bot');

myBot.setCommandPermissions("skip", []);

myBot.run("agu@be.lu", "SuperStrongPassword", "Cool Discord Server", "Music", "general");
```

This code runs a bot with default permissions, but command *skip* can be executed by anyone.



Let's end with a more complicated example. Consider the following permissions:

* Role *Friends* is requested to use command *!request*
* Role *Boss* can run all commands
* Role *M



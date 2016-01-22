# WORK IN PROGRESS

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

###2. Setting up Discord account

You will need a Discord account to be used as the music bot. You can use an existing one or create a new one for this purpose. If you decide to create a new account to serve as the bot, you will need to register it with an email and a password.

In any case, the account you decide to use **must already be a member of the server** you'll use the bot in. If it isn't, just get an invitation and manually join the server.

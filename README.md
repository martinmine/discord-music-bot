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

It is highly likely that you need to further customise these permissions, since the administrative role name in your server may not be called 'Admin' or because you just want to change these permissions in any way. This can be achieved through the **!addpermission** and **!removepermission** commands, but they have some drawbacks: they can't be used with any role name that contains spaces, permissions set through these commands are not saved and will be lost on a bot restart, and also without any further setup you will not be even able to use them if you don't have 'Admin' role.

These issues will be fixed on future updates.

TODO explains how to properly setup command permissions.

#Setup

dfgsagsagfasg

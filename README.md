# WORK IN PROGRESS

[![NPM](https://nodei.co/npm/discord-music-bot.png?downloads=true)](https://nodei.co/npm/discord-music-bot/)

---

*Discord Music Bot* aims to be a flexible, yet simple to use bot which implements a song playlist in a Discord server. It handles requests from users, places them in a queue and plays the songs the users requested.

It requires very little and simple configuration and can be deployed in any server in a matter of minutes.

---

##Commands
####User commands

* **!request \<YouTube URL or video ID\>**: Places the requested song into the queue.
* **!np**: Displays the current song.
* **!commands**: Displays all available commands.
* **!queue**: Displays the song queue.
* **!permissions \<command name\>**: Displays the required role to execute a certan command.
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

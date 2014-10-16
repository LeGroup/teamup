TeamUp Node Server is a Node.js -based server for hosting TeamUp without Wookie Widget Server. 

It is not 100% complete, but it is the recommended way for hosting future TeamUp servers.

Created by Jukka Purma and Antti Keränen 2013-2014. Published under GPL3 license, since this requires GPL3-licensed TeamUp to work. See COPYING.txt 


in this folder you should have a symlink:

www/ 	- goes to team_up_server: ../team_up_server/  (use absolute path)

in team_up_server you should have a symlink to app:

app/	- goes to TeamUp client, eg. ../TeamUp/


you can use these commands to create them:

(in teamup_node_server:)
ln -s (abs path to team_up_server) www 
(in team_up_server:)
ln -s (abs path to TeamUp) app

 

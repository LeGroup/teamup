in this folder you should have a symlink:

www/ 	- goes to team_up_server: ../team_up_server/  (use absolute path)

in team_up_server you should have a symlink to app:

app/	- goes to TeamUp client, eg. ../TeamUp/


you can use these commands to create them:

(in teamup_node_server:)
ln -s (abs path to team_up_server) www 
(in team_up_server:)
ln -s (abs path to TeamUp) app

 
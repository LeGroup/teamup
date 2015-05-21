TeamUp
======

`TeamUp` - client/widget for making teams in classrooms or other larger groups and recording their progress

`team_up_server` - site for launching TeamUp classes and simple server to store the media produced by Wookie widget-based installation.

`teamup_node_server` - Node.js -based server to remove the need for widget server 

see directories for further instructions, licenses and authors.
 

### TeamUp Vagrant

Includes:

- Apache 2.4
- PHP 5.5
- Node 0.12
- MongoDB 3.0

Initializes the server to `10.12.14.16`

Synced folders:

* `TeamUp` mapped to `/teamup_app`
* `team_up_server` mapped to `/var/www/html`
* `teamup_node_server` mapped to `/node_server`

Note: Because the synced folders contain symlinks you must run the bash as adminstrator in Windows
before doing `vagrant up`.


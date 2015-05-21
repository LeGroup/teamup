#
# https://vagrantup.com
#

VAGRANTFILE_API_VERSION = '2'

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = 'ubuntu/trusty64'

  config.vm.network 'private_network', ip: '10.12.14.16'

  config.vm.synced_folder './team_up_server', '/var/www/html', \
    owner: 'www-data', \
    group: 'www-data', \
    mount_options: ['dmode=755', 'fmode=644']

  config.vm.synced_folder './teamup_node_server', '/node_server'

  config.vm.synced_folder './TeamUp', '/teamup_app'

  config.vm.provision 'shell', path: './provisioning/provisioning.sh'

  config.ssh.shell = "bash -c 'BASH_ENV=/etc/profile exec bash'"
end

#!/usr/bin/env bash

#
# This script installs the development environment.
#

# Require all variables to be set and exit on first error.
set -u
set -e

LOG='/vagrant/provisioning/provisioning.log'

APACHE_CONF='/etc/apache2/apache2.conf'
PHP_CONF='/etc/php5/apache2/php.ini'

# Clear the log
> ${LOG}

# Make sure we're running as root
sudo su

# A quiet unattended installation
export DEBIAN_FRONTEND=noninteractive

echo 'Now provisioning! Why not get a coffee?'
echo "Output and errors are logged into ${LOG}."

echo 'Configuring the system...'

# Set a proper locale
echo 'LC_ALL="en_US.UTF-8"' >> /etc/environment

echo 'Upgrading the system...'

apt-get -qy update &>> ${LOG}
apt-get -qy upgrade &>> ${LOG}

echo 'Installing utilities...'

apt-get -qy install git-core curl &>> ${LOG}

echo 'Installing Apache...'

apt-get -qy install apache2 &>> ${LOG}

# Enable URL rewriting globally, doesn't need to be secure
a2enmod rewrite &>> ${LOG}
sed -Ei 's/AllowOverride\s+None/AllowOverride All/g' ${APACHE_CONF}

echo 'Installing PHP...'

apt-get -qy install php5 &>> ${LOG}

# Enable error reporting
sed -i 's/display_errors\s*=\s*Off/display_errors = On/g' ${PHP_CONF}

echo 'Installing Node.js...'

curl -sL https://deb.nodesource.com/setup_0.12 | bash - &>> ${LOG}

apt-get -qy install nodejs &>> ${LOG}

echo 'Installing MongoDB...'

# Import MongoDB key and repository
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10 \
    &>> ${LOG}

echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" \
    > /etc/apt/sources.list.d/mongodb-org-3.0.list

apt-get -qy update &>> ${LOG}

apt-get -qy install mongodb-org &>> ${LOG}

echo 'Starting servers...'

service apache2 restart &>> ${LOG}
service mongod restart &>> ${LOG}

echo 'Done!'

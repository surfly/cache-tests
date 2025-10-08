#!/bin/bash


## squid

# Create log dir
mkdir -p ${SQUID_LOG_DIR}
chmod -R 755 ${SQUID_LOG_DIR}
chown -R ${SQUID_USER}:${SQUID_USER} ${SQUID_LOG_DIR}

# Create cache dir
mkdir -p ${SQUID_CACHE_DIR}
chown -R ${SQUID_USER}:${SQUID_USER} ${SQUID_CACHE_DIR}

if [[ ! -d ${SQUID_CACHE_DIR}/00 ]]; then
echo "Initializing cache..."
$(which squid) -N -f /etc/squid/squid.conf -z 2&> /dev/null
fi


## apache

mkdir /var/run/apache2
mkdir /var/cache/apache
chown -R www-data /var/cache/apache

# varnish
sed -i s/8080/8000/ /etc/varnish/default.vcl

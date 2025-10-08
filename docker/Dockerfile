FROM --platform=linux/amd64 ubuntu:devel
LABEL maintainer="Mark Nottingham <mnot@mnot.net>"


# package installs

RUN apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    nodejs npm git openssh-client \
    squid \
    nginx \
    apache2 \
    varnish \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean


# squid

COPY squid/squid.conf /etc/squid/conf.d/cache-test.conf

ENV SQUID_CACHE_DIR=/var/spool/squid
ENV SQUID_LOG_DIR=/var/log/squid
ENV SQUID_USER=proxy
EXPOSE 8001


# nginx

RUN mkdir /var/cache/nginx
COPY nginx/nginx.conf /etc/nginx/sites-enabled/cache-test.conf
EXPOSE 8002

# apache

RUN a2enmod cache_socache
RUN a2enmod cache_disk
RUN a2enmod proxy_http

COPY apache/ports.conf /etc/apache2/ports.conf
COPY apache/apache.conf /etc/apache2/sites-enabled/cache-test.conf
EXPOSE 8004


# varnish

EXPOSE 8005


# setup

COPY setup.sh /sbin/setup.sh
RUN chmod 755 /sbin/setup.sh
RUN /sbin/setup.sh

# serve

COPY serve.sh /sbin/serve.sh
RUN chmod 755 /sbin/serve.sh


# entrypoint

COPY entrypoint.sh /sbin/entrypoint.sh
RUN chmod 755 /sbin/entrypoint.sh
ENTRYPOINT ["/sbin/entrypoint.sh"]
CMD []

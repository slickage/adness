# DOCKER-VERSION 0.8.1
FROM    centos:6.4
RUN     rpm -Uvh http://download.fedoraproject.org/pub/epel/6/i386/epel-release-6-8.noarch.rpm
RUN     yum install -y npm

ADD . /src
RUN cd /src; \
    rm -rf node_modules; \
    npm install

EXPOSE  8080
CMD cd /src; \
    node index.js

# Use the codercom/code-server image
FROM codercom/code-server:latest
MAINTAINER steven velozo

VOLUME /home/coder/.config
VOLUME /home/coder/.vscode

RUN echo "...installing debian dependencies..."
RUN sudo apt update
RUN sudo apt install vim curl tmux -y
RUN sudo apt install default-mysql-server default-mysql-client -y
# RUN sudo apt install sysv-rc-conf -y

RUN echo "Building RETOLD development image..."

RUN echo "...configuring mariadb (mysql) server..."
RUN sudo sed -i "s|bind-address|#bind-address|g" /etc/mysql/mariadb.conf.d/50-server.cnf
ADD ./.config/MySQL-Security.sql /home/coder/MySQL-Configure-Security.sql
ADD ./.config/MySQL-Laden-Entry.sh /usr/bin/MySQL-Laden-Entry.sh
RUN ( sudo mysqld_safe --skip-grant-tables --skip-networking & ) && sleep 5 &&  mysql -u root < /home/coder/MySQL-Configure-Security.sql

# Enable MariaDB even without systemd
# RUN sudo sysv-rc-conf --level 0123456S mariadb on

# Import the initial database
RUN sudo service mariadb restart && sleep 5 && mysql -u root -p"123456789" -e "CREATE DATABASE YOURDATABASENAMEHERE;"

SHELL ["/bin/bash", "-c"]
USER coder

# Copy any default configs for the coding environment we want (e.g. dark theme)
# COPY ./.config/.default_home/ /home/coder/

RUN echo "...mapping library specific volumes..."
# Volume mappings for code
VOLUME /home/coder/YOURLIBRARYNAMEHERE
# VOLUME /home/coder/YOURLIBRARYNAMEHERE/node_modules

RUN echo "...installing node version manager..."
# Because there is a .bashrc chicken/egg problem, we will create one here to simulate logging in.  This is not great.
RUN touch ~/.bashrc && chmod +x ~/.bashrc
RUN curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash

RUN echo "...installing node version 14 as the default..."
RUN . ~/.nvm/nvm.sh && source ~/.bashrc && nvm install 14
RUN . ~/.nvm/nvm.sh && source ~/.bashrc && nvm alias default 14

WORKDIR /home/coder/YOURLIBRARYNAMEHERE

ENTRYPOINT ["/usr/bin/MySQL-Laden-Entry.sh"]
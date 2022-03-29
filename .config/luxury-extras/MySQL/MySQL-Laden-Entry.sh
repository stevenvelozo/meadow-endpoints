#!/bin/bash

trap 'kill -TERM $PID' TERM INT

/usr/bin/entrypoint.sh --bind-addr "0.0.0.0:8080" . &

PID=$!

sleep 2

sudo service mariadb restart

wait $PID
trap - TERM INT
wait $PID
EXIT_STATUS=$?
echo "Service exited with status ${EXIT_STATUS}"
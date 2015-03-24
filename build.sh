#!/bin/bash
# Builds individual containers
set -e
ns="slackcast"
for d in *.docker
do
  n=${d%%.docker}
  docker build -f $d -t $ns/$n .
done

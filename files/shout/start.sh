#!/bin/bash
# - generates xml config files from json, injecting env vars
# - creates log files
# - starts icecast2
# - starts ezstream with output of station.py

/usr/bin/python gen_cfg.py
base=/usr/share/icecast2
log="$base/log"
mkdir -p $log
for l in error.log access.log start.log
do
    touch "$log/$l"
    chmod 666 "$log/$l"
    chown icecast2:icecast "$log/$l"
done

nohup icecast2 -b -c icecast.xml 2>&1 1>$log/start.log &
sleep 3
/usr/bin/python station.py | ezstream -qc ez.xml

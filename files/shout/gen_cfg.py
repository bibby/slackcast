import json
import os
import re
from xml2json import json2xml

def env_replace(json_data):
    for k in json_data:
        v = json_data[k]
        if isinstance(v, (dict,)):
            json_data[k] = env_replace(v)
        if isinstance(v, (unicode,)):
            for ev in icecast_env:
                json_data[k] = re.sub(ev, os.environ.get(ev, ev), json_data[k])
    return json_data

icecast_env = [k for k in os.environ if re.match('^ICECAST_', k)]

for service in ("ez", "icecast"):
    json_data = json.load(open(service + ".json"))
    out_file = file(service + ".xml", "w")
    if len(icecast_env):
        json_data = env_replace(json_data)
    out_file.write(json2xml(json_data))
    out_file.close()
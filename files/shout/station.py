import os
import time
from redis import StrictRedis

r = StrictRedis(host='redis')
sub = r.pubsub()
sub.subscribe(os.environ.get("CHANNEL_IN"))
silence = "/opt/mp3s/silence.mp3";
while True:
    message = sub.get_message()
    if message:
	fa = message.get("data")
        if isinstance(fa, (int, long)):
            continue
        if not os.path.isfile(fa):
            continue
    else:
        fa = silence

    f = open(fa)
    nbuf = f.read(4096)
    while 1:
        buf = nbuf
        nbuf = f.read(4096)
        if len(buf) == 0:
            break
        print buf
    f.close()

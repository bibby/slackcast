# Slackcast

A streaming mp3 broadcast of your Slack team chat using Ivona text-to-speech.

Using Slack as the center of team chat can be a great benefit (the same could be said for HipChat, Hangouts, or IRC), but if you're making an effort to be distraction-free, having a window begging to be watched can become a source of pressure. Why watch when you can listen? 

## Before you begin

This application ships in a few docker containers, and start/stopped using `docker-compose`. Named dockerfiles are used, so the minimum docker version required is 1.5.

You will need a Slack token to hook into the Real Time Messaging API. Learn more about that in the Slack documentation. You will likely need to create a named bot user in your team roster.

Finally, you will need an API Key to Ivona to generate mp3s using their TTS service.

## Installing

Clone this repository and run the `build.sh` script. It simply runs `docker build` on each of the `*.docker` files at the project root.

```
git clone https://github.com/bibby/slackcast
cd slackcast
./build.sh
```

## Configure

You will want to edit `docker-compose.yml` and fill in your API keys and other settings. I've made a reasonable attempt to call out each of those requiring attention. 

## Starting

To start the service, run docker-compose in daemon mode.

```
docker-compose up -d
```

After a short while, you should see your slack bot come *online* in Slack. Next, tune your media player (mplayer, vlc, chrome browser) to `/stream` on the host and port you configured it to be. Using the defaults, that would make the url `http://localhost:8000/stream`

If a play timer is moving, then you are streaming and connected. The channel will be continuously repeating `silence.mp3` until a chat event occurs.

NOTE that there WILL BE LAG! The delay is due to the buffering that most clients seem to want to do. And with a lo-fi stream such as this, that can add up to a hefty delay (30-60 seconds, looking for help here). Where possible, try to reduce the preload cache size.

## How it works

slackcast is composed of five docker containers, with redis pubsub gluing them together.`rtm` listens to Slack and pumps the messages into the redis channel for ivona. `ivona` processes the texts into mp3s, saving the file to the volume given by the `storage` container, and the name of the file is punblished to the redis channel for the final broadcast container. `shout`, the streaming container, is running icecast2 and ezstream. A python script is continually feeding raw bytes to the ezstream, either from a mp3 file whose name came over its redis sub or a silent mp3 while it waits for one.

![slackcast graph](https://raw.github.com/bibby/slackcast/master/slackcast-graph.png)

## Contribute

You are encouraged to clone this repository and make changes and improvements. Please create github issues for any problems or improvements you have. Pull requests with features and fixes will be appreciated.

See the TODOs in this document or the github issues if you want to help out.

You are also invited to fork this project and make it your own. No big deal.

## Legal

By using this software, you agree not to hold me liable for any charges or damages that might be caused from its use. Additionally, I cannot be made liable or party to any infractions to the terms of service for Slack.com or Ivona.com. Read and understand them.

## Todo

Part of the reason I used separate containers for components was the idea that Slack could be replaced with Hipchat or IRC, or that Ivona could be switched out with espeak or another TTS. With that in mind, is there a clean enough interface?

My slack rtm service was originally a coffeescript example that I compiled to javascript and then changed. Should those changes be put back into coffeescript?

Continue looking into reducing the lag time between slack chat and audible stream. 

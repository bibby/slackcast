/*
- Accepts incoming messages from the slack-rtm via its
  incoming redis pubsub channel.

- Uses the Ivona TTS API to convert the strings to mp3.

- Publishes the filename to an outgoing redis pubsub
  channel for consumption by the icecast container.

Voices for known users can be mapped in voice-map.json,
otherwise a random voice is assigned; favoring English.

TODO: method cleanText has no function. It's intended to
transform links and other text that listeners don't care
to hear verbatim.
*/
var Ivona = require('ivona-node')
var fs = require('fs');
var voices = require('./voices');
var voice_map = require('./voice-map');
var redis = require('redis'),
    redis_host = 'redis',
    redis_port = 6379,
    in_channel = redis.createClient(redis_port, redis_host),
    out_channel = redis.createClient(redis_port, redis_host);

var sha256 = require('js-sha256');
var shuffle = require('./shuffle')
var ivona = new Ivona({
    accessKey: process.env['IVONA_ACCESS_KEY'],
    secretKey: process.env['IVONA_SECRET_KEY']
});

var Voice = {
    get: function(name)
    {
        if (name in voice_map)
            return voice_map[name];

        if(Voice.avail.length == 0)
            Voice.used.forEach(function(v)
            {
                Voice.avail.push(v);
            });

        Voice.avail = shuffle(Voice.avail);
        var voice = Voice.avail.shift();
        voice_map[name] = voice;
            return voice;
    },
    create: function(voice, message, callback)
    {
        var settings = {
            Voice: voices[voice],
            Parameters: {sentenceBreak: 300}
        };

        var sha = sha256(voice + ':' + message.text);
        var filename = '/opt/mp3s/' + sha + '.mp3';
        if (fs.existsSync(filename))
            return callback(filename);

        var ws = ivona.createVoice(message.text, {body: settings}).pipe(fs.createWriteStream(filename));
        ws.on('finish', function()
        {
            console.log("completed", filename);
            callback(filename);
        });
    }
};

Voice.used = (function(m)
{
    var v = {};
    for(var k in m)
        v[m[k]] = 1;
    return Object.keys(v);
}(voice_map));

Voice.avail = Object.keys(voices).filter(function(v)
{
    return Voice.used.indexOf(v) == -1 && voices[v].language.substr(0,3) == 'en-';
});


var process_message = function(message)
{
    try {
        cleanText(message);
        voice = Voice.get(message.user);
        Voice.create(voice, message, publishFile);
        return true;
    } catch(e) {
        console.error(e);
    }
}

var cleanText = function(message)
{
    // translate links, code blocks, weird things.
};

var publishFile = function(filename)
{
    res = out_channel.publish(process.env['CHANNEL_OUT'], filename);
    console.log("out->" , res);
};

in_channel.on("subscribe", function (channel, count)
{
    console.log("connected to channel.", channel);
});

in_channel.on("message", function (channel, message)
{
    console.log("received message", channel, message)
    try {
        message = new Buffer(message, 'base64').toString('utf8');
        message = JSON.parse(message);
        if(process_message(message))
            console.log("processed");
    } catch (e) {
        console.log("not a json message", message, e);
    }
});


in_channel.subscribe(process.env['CHANNEL_IN']);

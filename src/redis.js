const Redis = require('ioredis');

const redisConfig = {

    port: 6379, // Redis port
    host: '127.0.0.1', // Redis host

};

const redis = new Redis(redisConfig);
const pub = new Redis(redisConfig);

redis.subscribe('chat', (err, count) => {
    if (err) {
        throw err;
    }
    console.log('subscribe to chat channel:', count);

    // pub.publish('news', 'Hello world!');
    // pub.publish('music', 'Hello again!');
});




exports.sendMsg = message => pub.publish('chat', message);
exports.redis = redis;
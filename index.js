// // These are important and needed before anything else
// import 'zone.js/dist/zone-node';
// import 'reflect-metadata';

// import { enableProdMode } from '@angular/core';

// // import * as express from 'express'; 
// const express = require('express');
// import { join } from 'path';

// // Faster server renders w/ Prod mode (dev mode never needed)
// enableProdMode();

// // Express server
// const app = express();

// const port = process.env.PORT;
// //const PORT = process.env.PORT || 4000;
// const DIST_FOLDER = join(process.cwd(), 'dist');

// // * NOTE :: leave this as require() since this file is built Dynamically from webpack
// const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('../.././client/chatApp/dist/server/main');

// // Express Engine
// import { ngExpressEngine } from '@nguniversal/express-engine';
// // Import module map for lazy loading
// import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

// app.engine('html', ngExpressEngine({
//   bootstrap: AppServerModuleNgFactory,
//   providers: [
//     provideModuleMap(LAZY_MODULE_MAP)
//   ]
// }));

// app.set('view engine', 'html');
// app.set('views', join(DIST_FOLDER, 'browser'));




//const express = require('express');
//const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const rredis = require('redis');
const session = require('express-session');
const Redis = require('ioredis');
const redis = new Redis();
const pub = new Redis();
const client = rredis.createClient();
//var pm2 = require('pm2');
//const angular = require('static-angular');

// const options = {
//     path: 'localhost:4200'
// }

//app.use(angular(options));

const socket = require('socket.io');
const port = process.env.PORT;
console.log(port);

const server = app.listen(port, () => console.log('listening on port ' + port));

app.use(cors({
    origin: [
        "http://localhost:4200"
    ],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));


app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    // cookie: {
    //     maxAge: 24 * 60 * 60 * 1000,
    //     httpOnly: false
    // }
}));

redis.on('connect', () => {
    console.log('redis is connected');
})

app.post('/login/:username', (req, res, next) => {
    const un = req.params.username;
    let pw = req.body.password;
    client.get(un, (err, obj) => {
        console.log('objet:' + obj)
        if (err) {
            console.log('error');
        } else {

            if (pw !== obj) {

                const result = {
                    'result': 'please insert valid password and username'
                };
                res.send(result);
            } else {

                const result = {
                    'result': 'passwordIsValid'
                };
                req.session.user = un;
                req.session.save();
                console.log(un);
                console.log(req.session.user);

                res.send(result);
            }
        }

    })
});


app.get('/loginValidation', (req, res) => {
    const stringResult = JSON.stringify(req.session.user);
    res.send(stringResult);
});





usersArray = [];

let io = socket(server);
io.on('connection', (socket) => {
    console.log('socket connection is on');


    socket.on('join', (data) => {

        socket.join(data.channel);

        redis.subscribe(data.channel, (err, message) => {

            console.log('  joined  ' + data.channel);
            //  console.log('subscribe channel %s', data.channel);
            pub.publish(data.channel, data.message);
        });
        io.to(data.channel).emit('joined', (data.message));
    });



    socket.on('message', data => {

        socket.join(data.channel);

        redis.subscribe(data.channel, (err, message) => {

            pub.publish(data.channel, data.message);

            console.log('Receive message %s from channel %s', data.message, data.channel);
        });
        io.sockets.emit('message', (data.channel, data.message));
        /// should be  :   io.to('some room').emit('some event');

    });



    socket.on('user connected', data => {

        socket.join(data.user);

        redis.subscribe(data.user, (err, message) => {

        });

        if (data) {
            if (usersArray.includes(data.user)) {
                //console.log(data.user + ' is  already exist');
            } else {
                usersArray.push(data.user);
            };
        }
        io.sockets.emit('user connected', usersArray);
    });





    socket.on('user left', (data) => {

        console.log(data.user + '  has left  ');

        if (usersArray.includes(data.user)) {

            let index = usersArray.indexOf(data.user);
            if (index > -1) {
                usersArray.splice(index, 1);
            };
        }
        io.sockets.emit('user left', usersArray);


    });

});
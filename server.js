// Imports
const express = require('express');
const webRoutes = require('./routes/web');

// Session imports
let cookieParser = require('cookie-parser');
let session = require('express-session');

// Express app creation
const app = express();


// Configurations
const appConfig = require('./configs/app');

// View engine configs
const exphbs = require('express-handlebars');
const hbshelpers = require("handlebars-helpers");
const multihelpers = hbshelpers();
const extNameHbs = 'hbs';
const hbs = exphbs.create({
    extname: extNameHbs,
    helpers: multihelpers
});
app.engine(extNameHbs, hbs.engine);
app.set('view engine', extNameHbs);

// Session configurations
let sessionStore = new session.MemoryStore;
app.use(cookieParser());
app.use(session({
    cookie: {
        maxAge: 60000
    },
    store: sessionStore,
    saveUninitialized: true,
    resave: 'true',
    secret: appConfig.secret
}));


// Receive parameters from the Form requests
app.use(express.urlencoded({
    extended: true
}))

// Routes
app.use('/', webRoutes);
app.use('/', express.static(__dirname + '/public'));

// Socket.io
var server = require('http').Server(app);
var io = require('socket.io')(server);

// App init
server.listen(appConfig.expressPort, () => {
    console.log(`Server is listenning on ${appConfig.expressPort}! (http://localhost:${appConfig.expressPort})`);
});

randomChar = () => {
    const min = 65;
    const max = 90;
    randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
    return String.fromCharCode(randomInt);
}


var emoji = require('node-emoji');
let playerCount = 0;
let gameLock = false;
const minPlayers = 2;
let firstSubmission = false;
let players = {};
let submissions = {};
io.on('connection', function(socket) {
    const sessionID = socket.id;
    const username = emoji.random();
    console.log(username.emoji);

    /*
    setTimeout(() => {
        console.log("disconnect");
        console.log(socket.rooms);
        playeCount--;
        socket.disconnect(true);
        delete players.sessionID;
    }, 10000);
*/

    const joinWaitingRoom = () => {
        socket.join('waiting-room');
        players[sessionID] = socket;

        if (playerCount < minPlayers) {
            console.log("Waiting players");
            console.log(sessionID);
            //io.sockets.to(sessionID).emit('waiting-players', 'this is only for you');
            socket.emit('waiting-players');
        }

        if (playerCount >= minPlayers) {
            startGame();
        }
    };

    const startGame = () => {
        if (!gameLock) {
            console.log("Start game");
            console.log("Player Count" + Object.keys(players).length);
            io.to('waiting-room').emit('test', 'kicking out');
            for (let key in players) {
                players[key].leave('waiting-room');
                players[key].join('game');
            }
            currChar = randomChar();
            console.log(currChar);
            io.to('game').emit('start-game', currChar);
            gameLock = true;
        } else {
            console.log("Waiting Game");
            socket.emit('waiting-game');
        }
    };

    socket.on('say to someone', function(id, msg) {
        socket.broadcast.to(id).emit('my message', msg);
    });

    socket.on('game-submit', function(data) {
        console.log(data);
        submissions[sessionID] = data;
        submitCount = Object.keys(submissions).length;
        if (submitCount == 1) {
            io.to('game').emit('begin-countdown');
            firstSubmission = true;
        }
        roomCount = io.sockets.adapter.rooms['game'].length;
        console.log("roomCount");
        if (submitCount == roomCount) {
            gradeSubmission(submissions);
        }
    });

    socket.on('reset-player', () => {
        console.log("Reset Player");
    });

    socket.on('cancel-player', () => {
        console.log("Cancel Player");
    });

    socket.emit('setup', {
        'username': `${username.emoji}`
    });

    socket.on('confirm-setup', () => {
        console.log("Confirm Setup");
        playerCount++;
        joinWaitingRoom();
    });
    const endGame =
        const gradeSubmission = (submissions) => {
            grades = {}
            countwords = {}
            console.log("Grading submission");

            // Count occurrences
            for (let key in submissions) {
                if (key["nombre"] !== "") {

                    if (countwords["nombre"][key["nombre"]]) {
                        countwords["nombre"][key["nombre"]]++;
                    } else {
                        countwords["nombre"][key["nombre"]] = 0;
                    }
                }

                if (key["color"] !== "") {
                    if (countwords["color"][key["color"]]) {
                        countwords["color"][key["color"]]++;
                    } else {
                        countwords["color"][key["color"]] = 0;
                    }
                }

                if (key["fruto"] !== "") {
                    if (countwords["fruto"][key["fruto"]]) {
                        countwords["fruto"][key["fruto"]]++;
                    } else {
                        countwords["fruto"][key["fruto"]] = 0;
                    }
                }
            }
            // Grade
            for (let key in submissions) {
                grades[key] = 0;
                if (key["nombre"] !== "") {
                    grades[key] += 100 / countwords["nombre"][key["fruto"]];
                }
                if (key["color"] !== "") {
                    grades[key] += 100 / countwords["color"][key["fruto"]];
                }
                if (key["fruto"] !== "") {
                    grades[key] += 100 / countwords["fruto"][key["fruto"]];
                }
            }
            console.log("Graded");
            console.log(grades);
            // Get max
            test = Object.keys(object).filter(x => {
                return object[x] == Math.max.apply(null,
                    Object.values(object));
            });
            test = Object.keys(grades).reduce((a, b) => grades[a] > grades[b] ? grades[a] : grades[b]);
            for (let key in submissions) {
                if (grades[key] === test) {
                    io.sockets.to(sessionID).emit('game-results', true);
                } else {
                    io.sockets.to(sessionID).emit('game-results', false);
                }
            }

        };
});

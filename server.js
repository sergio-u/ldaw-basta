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
let gameLock = false;
const minPlayers = 2;
let firstSubmission = false;
let players = {};
let submissions = {};
let currChar = '';
io.on('connection', function (socket) {
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
    const playerCount = io.sockets.adapter.rooms['waiting-room'].length;
    if (gameLock){
      socket.emit('waiting-game');
      return;
    }
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
      currChar = 'A';
      console.log(currChar);
      io.to('game').emit('start-game', currChar);
      gameLock = true;
    } else {
      console.log("Waiting Game");
      socket.emit('waiting-game');
    }
  };

  socket.on('rejoin', function () {
    console.log('Rejoin');
    joinWaitingRoom();
  })

  socket.on('disconnect', function () {
    console.log("Before"+ players);
    if (Object.keys(players).length === 1) {
      players = {}
    } else {
      delete players[sessionID];
    }
    console.log("After" +players);
  })
  socket.on('say to someone', function (id, msg) {
    socket.broadcast.to(id).emit('my message', msg);
  });

  socket.on('game-submit', function (data) {
    console.log(data);
    submissions[sessionID] = data;
    const submitCount = Object.keys(submissions).length;
    if (submitCount === 1) {
      io.to('game').emit('begin-countdown');
      firstSubmission = true;
    }
    const roomCount = io.sockets.adapter.rooms['game'].length;
    console.log("roomCount");
    if (submitCount === roomCount) {
      io.to('game').emit('grading');
      gradeSubmission(submissions);
      submissions = {};
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
    joinWaitingRoom();
  });
  const endGame = () => {

  }
  const gradeSubmission = (submissions) => {
    let grades = {}
    let countwords = {"nombre":{}, "color":{}, "fruto":{}}
    console.log("Grading submission");
    io.to(Object.keys(submissions)[0]).emit('test','hello 1');
    io.to(`${Object.keys(submissions)[0]}`).emit('test','hello');
    io.to(Object.keys(submissions)[1]).emit('test','bye 1');
    io.to(`${Object.keys(submissions)[1]}`).emit('test','bye');

    // Count occurrences
    for (const [key,value] of Object.entries(submissions)) {
      if (value["nombre"] !== "") {
        value["nombre"] = value["nombre"].toLowerCase()

        if (countwords["nombre"][value["nombre"]]) {
          countwords["nombre"][value["nombre"]]++;
        } else {
          countwords["nombre"][value["nombre"]] = 1;
        }
      }

      if (value["color"] !== "") {
        value["color"] = value["color"].toLowerCase()
        if (countwords["color"][value["color"]]) {
          countwords["color"][value["color"]]++;
        } else {
          countwords["color"][value["color"]] = 1;
        }
      }

      if (value["fruto"] !== "") {
        value["fruto"] = value["fruto"].toLowerCase()
        if (countwords["fruto"][value["fruto"]]) {
          countwords["fruto"][value["fruto"]]++;
        } else {
          countwords["fruto"][value["fruto"]] = 1;
        }
      }
    }
    // Grade
    for (const [key,value] of Object.entries(submissions)) {
      grades[key] = 0;
      if (value["nombre"] !== "" && value["nombre"][0] === currChar.toLowerCase()) {
        grades[key] += 100 / countwords["nombre"][value["nombre"]];
      }
      if (value["color"] !== "" && value["color"][0] === currChar.toLowerCase()) {
        grades[key] += 100 / countwords["color"][value["color"]];
      }
      if (value["fruto"] !== "" && value["fruto"][0] === currChar.toLowerCase()) {
        grades[key] += 100 / countwords["fruto"][value["fruto"]];
      }
    }
    console.log("Graded");
    console.log(grades);
    // Get max
    test = Object.keys(grades).reduce((a, b) => grades[a] > grades[b] ? grades[a] : grades[b]);
    for (let key in submissions) {
      if (grades[key] === test) {
        //socket.emit('game-results', true);
        //io.to(key).emit('game-results',true);
        //io.to(`${key}`).emit('game-results',true);
        io.to(key).emit('game-results',true);
        players[key].leave('game');
      } else {
        //socket.emit('game-results', false);
        //io.to(key).emit('game-results',false);
        //io.to(`${key}`).emit('game-results',false);
        io.to(key).emit('game-results',false);
        players[key].leave('game');
      }
    }
    gameLock = false;
    submissions = {};
    submitCount = 0;
    console.log("Done");
  };
});

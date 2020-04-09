function confirmContinue(data) {
  message = data ? "You won!" : "You lost!";
  alertify.confirm(message, message + ' Do you wish to continue playing?', function () {
      socket.emit('rejoin');
      resetState();
    }
    , function () {
      doDisconnect();
    }).set({'closableByDimmer': false});
}


var socket = null;
var username = null;
var gameStatus = ""; // waiting, started, ended
var startedCountdown = false;
var isSubmitted = false;
var x;

function beginCountDown() {
  if (!startedCountdown) {
    startedCountdown = true;
    let count = 10;
    $('#countdown').show();
    $('#countdown').text("Quedan: " + count + " segundos");
    x = setInterval(function () {
      $('#countdown').text("Quedan: " + count + " segundos");
      count -= 1;
      if (count < 0) {
        disableInputs();
        clearInterval(x);
        console.log("Real done");
        doSubmit();
      }
    }, 1000);
  }
}


function connectToSocketIo() {
  socket = io();

  socket.on('setup', function (data) {

    console.log(data);
    console.log(socket.id);
    socket.emit('confirm-setup');
    username = data.username;
    $("#username").text("Jugador: " + username);
    $("#page-loader").hide();
    $("#main-screen").show();

    // Testing
    //$("#main-screen").show();
    //$("#game-screen").show();
  });

  socket.on('test', function (data) {
    console.log("test");
    console.log(data);
  });


  socket.on('begin-countdown', function () {
    beginCountDown();
  });


  socket.on('waiting-game', function () {
    console.log("waiting-game");
    $("#game-loader").show();
  });

  socket.on('game-results', function (data) {
    console.log("game-results");
    console.log(data);
    confirmContinue(data);
  });

  socket.on('waiting-players', function () {
    $("#player-loader").show();
    console.log("waiting-players");
  });

  socket.on('start-game', function (data) {
    console.log("start-game");
    console.log(data);
    $("#game-screen").show();
    $("#current-letter").text("Letra actual: " + data);
    $("#game-loader").hide();
    $("#player-loader").hide();
    prepareGame();
  });
}

$(".input").on("change keypress paste focus textInput input", function () {
  if ($('#nombre').val() !== '' &&
    $('#color').val() !== '' &&
    $('#fruto').val() != '') {
    $('#submit').prop('disabled', false);
  } else {
    $('#submit').prop('disabled', true);
  }
});


function doDisconnect() {
  console.log("Do Disconnect");
  $('#die').show();
  socket.emit('disconnect');
  socket.disconnect();
}

function resetState() {
  toggleInputs(false);
  clearInterval(x);
  $('#countdown').hide();
  $('#game-screen').hide();
  $('#nombre').val("");
  $('#color').val("");
  $('#fruto').val("");
  isSubmitted = false;
  startedCountdown =false;
  console.log("Reset State");
}

function prepareGame() {
  enableInputs();
  console.log("Prepare Game");
}


function handleSubmit(e) {
  console.log(e);
  console.log("Submit");
  e.preventDefault();
  doSubmit();
}

function doSubmit() {
  if (!isSubmitted) {
    let userAnswer = {};
    userAnswer['nombre'] = $('#nombre').val();
    userAnswer['color'] = $('#color').val();
    userAnswer['fruto'] = $('#fruto').val();
    console.log(userAnswer);
    socket.emit('game-submit', userAnswer);
    isSubmitted = true;
    disableInputs();
    beginCountDown();
  }
}

function disableInputs() {
  toggleInputs(true);
  $('#submit').prop('disabled', true);
}

function enableInputs() {
  toggleInputs(false);
}

function toggleInputs(value) {
  $('#nombre').prop("disabled", value);
  $('#color').prop("disabled", value);
  $('#fruto').prop("disabled", value);
}

$('#user-answers').submit(handleSubmit);

$(function () {
  connectToSocketIo();
  //alertify.myAlert("Browser dialogs made easy!");
});

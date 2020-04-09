if (!alertify.myAlert) {
    //define a new dialog
    alertify.dialog('myAlert', function() {
        return {
            main: function(message) {
                this.message = message;
            },
            setup: function() {
                return {
                    buttons: [{
                        text: "cool!",
                        key: 27 /*Esc*/
                    }],
                    focus: {
                        element: 0
                    }
                };
            },
            prepare: function() {
                this.setContent(this.message);
            }
        };
    });
}

var socket = null;
var username = null;
var gameStatus = ""; // waiting, started, ended
var startedCountdown = false;
var isSubmitted = false;

function beginCountDown() {
    if (!startedCountdown) {
        startedCountdown = true;
        $('#countdown').show();
        count = 10;
        var x = setInterval(function() {
            count -= 1;
            $('#countdown').text("Quedan: " + count + " segundos");
            if (count <= 0) {
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

    socket.on('setup', function(data) {

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

    socket.on('test', function(data) {
        console.log("test");
        console.log(data);
    });


    socket.on('begin-countdown', function() {
        beginCountDown();
    });


    socket.on('waiting-game', function() {
        console.log("waiting-game");
        $("#game-loader").show();
    });

  socket.on('game-results', function(data) {
    console.log("game-results");
    console.log(data);
    askIfContinue();
  });

    socket.on('waiting-players', function() {
        $("#player-loader").show();
        console.log("waiting-players");
    });

    socket.on('start-game', function(data) {
        console.log("start-game");
        console.log(data);
        $("#game-screen").show();
        $("#current-letter").text("Letra actual: " + data);
        $("#game-loader").hide();
        $("#player-loader").hide();
    });
}

$(".input").on("change keypress paste focus textInput input", function() {
    if ($('#nombre').val() !== '' &&
        $('#color').val() !== '' &&
        $('#fruto').val() != '') {
        $('#submit').prop('disabled', false);
    } else {
        $('#submit').prop('disabled', true);
    }
});

let continuePlaying = true;
function askIfContinue(){
  // Do Stuff
  if (continuePlaying) {
    resetState();
  } else {
    doDisconnect();
  }
}

function doDisconnect(){
  console.log("Do Disconnect");
}

function resetState(){
  console.log("Reset State");
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
}

function enableInputs() {
    toggleInputs(false);
}

function toggleInputs(value) {
    $('#nombre').prop("disabled", value);
    $('#color').prop("disabled", value);
    $('#fruto').prop("disabled", value);
    $('#submit').prop("disabled", value);
}

$('#user-answers').submit(handleSubmit);

$(function() {
    connectToSocketIo();
    //alertify.myAlert("Browser dialogs made easy!");
});

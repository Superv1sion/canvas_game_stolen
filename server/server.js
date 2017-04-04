var mysql = require('mysql')

var utils ={
    isDefined: function (item) {
        if (typeof item == 'undefined') {
            return false;
        }
        return true;
    },
    determineSign(a, b, val){
        if(a>b){
            return -val;
        }else{
            return val;
        }
    }
}
var coordinator = {
    getPlayerCoords: function (Token) {
        return new Promise(function (resolve, reject) {
            if( utils.isDefined(localDb[Token].x) ){
                resolve();
                //return {x: localDb[Token].x, y: localDb[Token].y};
            }


            db.query('select * from PlayersCoordinates where PlayerID = ?', [localDb[Token].PlayerID])
                .on('result', function (data) {

                    localDb[Token].x = data.x;
                    localDb[Token].y = data.y;

                    resolve();
                })
        })
    },
    getNearItems: function (Token){

        return new Promise(function (resolve, reject) {

            var playerData = localDb[Token];
            console.log(playerData);
            var step = 1000;
            var items = [];
            db.query('select * from ItemsCoordinates where x between ? and ? and y between ? and ?', [playerData.x-step, playerData.x+step, playerData.y-step, playerData.y+step ])
                .on('result', (data) => {

                    var relativeDistanceX = Math.abs(playerData.x - data.x);
                    var relativeDistanceY = Math.abs(playerData.y - data.y);
                    relativeDistanceX = utils.determineSign(playerData.x, data.x, relativeDistanceX);
                    relativeDistanceY = utils.determineSign(playerData.y, data.y, relativeDistanceY);
                    items.push({x: relativeDistanceX, y: relativeDistanceY, ItemID: data.ItemID});

                }).on('end', function(){

                    resolve(items);

                })

        });

    },

}

// Let’s make node/socketio listen on port 3000
var io = require('socket.io').listen(3000)
// Define our db creds
var db = mysql.createConnection({
    host: 'localhost',
    user: 'game',
    database: 'game',
    password: 'root',
    insecureAuth: true
})
 
// Log any errors connected to the db
db.connect(function(err){
    if (err) console.log(err)
})

var localDb = {};
// Define/initialize our global vars

var isInitNotes = false
var socketCount = 0

function getToken(PlayerID) {
    return 'token_'+PlayerID;
}

function checkToken(Token) {
    if(localDb[Token]){
        return 1;
    }
}



io.sockets.on('connection', function(socket){
    // Socket has connected, increase socket count

    io.sockets.emit('users connected', socketCount)

    socket.on('login', function (data) {
         db.query('select * from Players where Login=? and Password=?', [data.Login, data.Password] )
             .on('result', function (data) {
                console.log(data);
                data.SessionToken = getToken(data.PlayerID);
                db.query('update Players set SessionToken = ? where PlayerID= ?', [data.SessionToken, data.PlayerID]);
                 localDb[data.SessionToken] = {};
                localDb[data.SessionToken].PlayerID = data.PlayerID;
                socket.emit('loginSuccess', data);
             });
    })
    socket.on('requestItems', function (data) {
        if(!checkToken(data.SessionToken)){
            return;
        }

        coordinator.getPlayerCoords(data.SessionToken)
        .then(function () {

                return coordinator.getNearItems(data.SessionToken)
        })
        .then(function (data) {
            console.log('send items');
                socket.emit('getItems', data);
        });

        //var promise = new Promise( (resolve, reject) => {
        //    coordinator.getPlayerCoords(data.SessionToken);
//
        //});
        //promise.then(()=>{
//
//
        //   return ;
        //})
        //var playerCoords = coordinator.getPlayerCoords(data.SessionToken).getNearItems();
        //console.log(playerCoords);
        //var nearItems = getNearItems

    })

    socket.on('sendOffset', function (data) {
        var playerData = localDb[data.SessionToken];
        console.log('offsetReceived');
        //console.log(playerData);
        //console.log(data);
        db.query('update PlayersCoordinates  set x = x + ?, y= y + ? where PlayerID = ?', [data.offsetX, data.offsetY, playerData.PlayerID]);
        localDb[data.SessionToken].x+=data.offsetX;
        localDb[data.SessionToken].y+=data.offsetY;
        console.log('here is');
        socket.emit('offsetProcessed', {done:1});

    })
    socketCount++


    socket.on('disconnect', function() {

        // Decrease the socket count on a disconnect, emit
        socketCount--
        io.sockets.emit('users connected', socketCount)
    })
 


})

setInterval(function(){
   // db.query('insert into ItemsCoordinates set x = ?, y = ?', [localDb['token_1'].x - Math.random()*1000, localDb['token_1'].y - Math.random()*1000]);
}, 5000);
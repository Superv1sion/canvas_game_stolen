var mysql = require('mysql')
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
 
// Define/initialize our global vars

var isInitNotes = false
var socketCount = 0



io.sockets.on('connection', function(socket){
    // Socket has connected, increase socket count
    console.log(socket.conn.Socket);
    var items = [];
    io.sockets.emit('users connected', socketCount)

setInterval(function () {
    db.query('SELECT * FROM ItemsCoordinates')
        .on('result', function(data){
            // Push results onto the notes array
            items.push(data)
            console.log(data);
        })
        .on('end', function(){
            // Only emit notes after query has been completed
            console.log(items);
            socket.emit('all items', items)
        })
}, 5000);

    socketCount++
    //console.log(socketCount);
    // Let all sockets know how many are connected


    socket.on('disconnect', function() {

        // Decrease the socket count on a disconnect, emit
        socketCount--
        io.sockets.emit('users connected', socketCount)
    })
 
    socket.on('new note', function(data){
        // New note added, push to all sockets and insert into db

        db.query('INSERT INTO ItemsCoordinates (ItemId, x, y) VALUES (?, ?, ?)', data.id, data.x, data.y);

        // Use node's db injection format to filter incoming data

    })

})

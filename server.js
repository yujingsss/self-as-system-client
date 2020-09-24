let express = require('express');
let app = express();

let server = require("http").createServer(app);
// build a own server to allow accessing the Socket.io library
//create script in html to access this library
let io = require("socket.io")(server);
let port = process.env.PORT || 3000;

server.listen(port);

app.use(express.static('public'));


console.log("my socket server is runnning");

io.sockets.on('connection', newConnection);

function newConnection(socket) {
    console.log(`new connection: ${socket.id}`);

    socket.on('multiMouse', mouseMsg);

    function mouseMsg(data) {
        socket.broadcast.emit('multiMouse', data);
        // io.sockets.emit('multiMouse', data);
        // console.log(data);
    }
}
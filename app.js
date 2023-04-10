
const serialPortLIB = require('serialport');
var SerialPort = serialPortLIB.SerialPort;
const { ReadlineParser } = require('@serialport/parser-readline')



var portNumber = "";
var port = "";
var parser = "";
var count = 0;
var itemList = [];

// list all serial ports available    
(async () => {
    try {
        const serialPortList = await SerialPort.list();
        if (serialPortList.length > 0) {
            itemList.push("select a port");
            serialPortList.forEach(port => {
                itemList.push(port.path);
            });
        }
    } catch (e) {
        console.log(e);
    }
})();

// Imports
const express = require('express')
const app = express()
const httpServer = require('http').Server(app);
//const port = 3000


// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/img', express.static(__dirname + 'public/img'))

// Set Views
app.set('views', './views')
app.set('view engine', 'ejs')

app.get('', (req, res) => {
    res.render('index', { text: 'This is EJS'})
})

app.get('/about', (req, res) => {
    res.render('about', { text: 'About Page'})
})

const io = require('socket.io')(httpServer);

io.on('connect', socket => {
    socket.emit('plist', itemList);

    socket.on('sport', (DATA_RECEIVED_FROM_HTML) => {
        if (DATA_RECEIVED_FROM_HTML == "select a port") {
        } else {
            portNumber = DATA_RECEIVED_FROM_HTML;
        }
    });

    socket.on('sconnect', (DATA_RECEIVED_FROM_HTML) => {
        port = new SerialPort({
            path: portNumber,
            baudRate: 9600,
        });
        parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
        parser.on('data', function (data) {
            socket.emit('stemp', data.slice(0,5));
            socket.emit('smoisture', data.slice(6, 11));
            if(data === 'd'){
                socket.emit('events', 'The plant is too dry please irrigate it');
            }
            else if(data === 'h'){
                socket.emit('events', 'It is too hot');
            }
            else{
                socket.emit('events', 'port opened');
            }
        });

        port.on('open', function (data) {
            socket.emit('events', 'Serial Port ' + portNumber + ' is opened.');
        });
    });

    socket.on('sirrigate', (DATA_RECEIVED_FROM_HTML) => {
        console.log(DATA_RECEIVED_FROM_HTML);
        port.write(DATA_RECEIVED_FROM_HTML);
    });

    socket.on('sdisconnect', (DATA_RECEIVED_FROM_HTML) => {
        port.close(function (err) {
            socket.emit('events', 'Serial Port ' + portNumber + ' is closed.');
        });
    });

});




httpServer.listen(3000, () => {
    console.log('go to http://localhost:3000');
})



// //  Listen on port 3000
// app.listen(port, () => console.info(`Listening on port ${port}`))
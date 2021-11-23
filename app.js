const { Client } = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io')
const qrcode = require('qrcode');
const fs = require('fs');
const http = require('http')

const app = express();
const server = http.createServer(app)
const io = socketIO(server)

app.use(express.json());
app.use(express.urlencoded({ extended:true }));

const SESSION_FILE_PATH = './whatsapp-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

app.get('/', (req, res) => {
    res.sendFile('index.html', {root: __dirname})
})
const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.on('message', msg => {
    if (msg.body == '!ping') {
        msg.reply('pong');
    }
});

client.initialize();

//socket io
io.on('connection', (socket) =>{
    socket.emit('message', 'Connecting... please wait');
    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (errm, url) => {
            socket.emit('qr', url)
            socket.emit('message', 'QR Code received, please scan')
        });
    });
    
    client.on('ready', () => {
        console.log('ready')
        socket.emit('message', 'Whatsapp Ready')
    });
})

// send message
app.post('/send-message', (req, res) => {
    const number = req.body.number+'@c.us';
    const message = req.body.message;
    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status:true,
            response:response
        });
    }).catch(err =>{
        res.status(500).json({
            status:false,
            response:err
        });
    });
});

server.listen(8000, () => {
    console.log('app running at:' +8000);
});
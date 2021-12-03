const {
    Client
} = require('whatsapp-web.js');
const express = require('express');
const socketIO = require('socket.io')
const qrcode = require('qrcode');
const fs = require('fs');
const http = require('http')
const {
    phoneNumberFormatter
} = require('./helper/formatter');
const {
    check,
    validationResult
} = require('express-validator');

const app = express();
const server = http.createServer(app)
const io = socketIO(server)
const port = process.env.PORT || 8000;
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));


app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root: __dirname
    })
})
const SESSION_FILE_PATH = './whatsapp-session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const createSession = () => {
    const client = new Client({
        restartOnAuthFail: true,
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process', // <- this one doesn't works in Windows
                '--disable-gpu'
            ],
        },
        session: sessionCfg
    });
    client.on('message', msg => {
        if (msg.body == 'p' || msg.body == 'P') {
            msg.reply('pong');
        }
    });
    client.on('disconnected', (reason) => {
        console.log('Whatsapp disconnected')
        fs.unlinkSync(SESSION_FILE_PATH, function (err) {
            if (err) return console.log(err);
            console.log('Session file deleted!');
        });
        client.destroy();
        client.initialize();
    });

    client.initialize();

    client.on('qr', (qr) => {
        // Generate and scan this code with your phone
        console.log('QR RECEIVED', qr);
        qrcode.toDataURL(qr, (errm, url) => {
            io.emit('qr', url)
            io.emit('message', 'QR Code received, please scan')
            io.emit('scan', 'QR Code received, please scan')
        });
    });
    client.on('ready', () => {
        console.log('ready')
        io.emit('message', 'Whatsapp Ready')
        io.emit('ready', 'Whatsapp Ready')
        // if (fs.existsSync(SESSION_FILE_PATH)) {
        //     io.emit('ready', 'Whatsapp Ready')
        //     io.emit('authenticated', 'Whatsapp authenticated')
        // }
    });
    client.on('authenticated', (session) => {
        console.log('AUTHENTICATED', session);
        io.emit('authenticated', 'Whatsapp authenticated')
        io.emit('message', 'Whatsapp authenticated')
        sessionCfg = session;
        fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
            if (err) {
                console.error(err);
            }
        });
    });
    client.on('auth_failure', function (session) {
        io.emit('message', 'Auth failure, restarting...');
    });
}

//socket io
io.on('connection', (socket) => {
    socket.emit('message', 'Connecting... please wait');
    createSession()
})

// send message
app.post('/send-message', [
    check('number')
    .isLength({
        min: 5
    })
    .withMessage('must be at least 5 chars long')
    .matches(/^[0-9]+$/)
    .withMessage('number only'),
    check('message').notEmpty().withMessage('message cannot be empty'),
], (req, res) => {
    const errors = validationResult(req).formatWith(({
        msg
    }) => {
        return msg;
    });
    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: false,
            message: errors.mapped()
        })
    }
    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;
    client.sendMessage(number, message).then(response => {
        res.status(200).json({
            status: true,
            response: response
        });
    }).catch(err => {
        res.status(500).json({
            status: false,
            response: err
        });
    });
});

server.listen(port, () => {
    console.log('app running at:' + port);
});
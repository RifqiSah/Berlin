require('dotenv').config()

const { Socket } = require('net');
const axios = require('axios');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('./db/servers_db.json');
const db = low(adapter);

const { logger } = require("./utils/logger");

// daftar server
const servers = require("./db/servers.json");

// max percobaan ( n - 1 )
const maxTry = 5;

async function checkServer() {
    if (process.env.DISABLE === "true") {
        logger.warn('Server check is disabled');
        return false;
    }

    for (let i = 0; i < servers.length; i++) {
        db.read();

        await new Promise((resolve, reject) => {
            const server = servers[i];

            // init socket
            const socket = new Socket();
            socket.setTimeout(1000 * 15);

            let status = 0;

            logger.info(`[${server.name}] Connecting to ${server.ip}:${server.port}`);
            socket.connect(server.port, server.ip, function() {
                // logger.info(`[${server.name}] Connected!`);
            });

            socket.on('data', function(data) {
                // logger.info(`[${server.name}] Received: ${data}`);
                logger.info(`[${server.name}] Server is UP!`);
                status = 1;

                socket.destroy();
            });

            socket.on('error', (err) => {
                logger.warn(`[${server.name}] Server is DOWN!`);
                status = 0;
            })

            socket.on('timeout', () => {
                logger.warn(`[${server.name}] Server is TIMEOUT!`);
                socket.destroy();
            });

            socket.on('close', function() {
                const val = db.get('servers').find({ name: server.name }).value();

                if (val.status !== status) {
                    // tambah percobaan
                    db.get('servers').find({ name: server.name }).update('try', n => n + 1).write()
                    logger.info(`[${server.name}] Check attemp: ${Number(val.try)}`);

                    // cek x kali percobaan, apakah benar-benar down atau tidak
                    if (val.try >= maxTry || status === 1) {
                        logger.info(`[${server.name}] > Sending notification ...`);

                        axios.get(`${process.env.AISHA_API}/server_update/${server.name.toLowerCase()}`)
                            .then((res) => {
                                db.get('servers').find({ name: server.name }).assign({ try: 0, status }).write();
                                return true;
                            })
                            .catch(function (error) {
                                logger.error(error);
                            });
                    }
                } else {
                    db.get('servers').find({ name: server.name }).assign({ try: 0 }).write();
                }

                logger.info(`[${server.name}] Closed!`);
                logger.info(' ');

                resolve();
            });
        });
    }
}

initDb = () => {
    const datas = servers.map((srv) => {
        return {
            name: srv.name,
            status: 1,
            try: 0,
        };
    });

    db.defaults({ servers: datas }).write();
};

initDb();

checkServer();
setInterval(checkServer, 1000 * 60 * 1);
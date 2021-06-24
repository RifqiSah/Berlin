const { Socket } = require('net');
const axios = require('axios');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('./db/servers.json');
const db = low(adapter);

const { logger } = require("./utils/logger");

// daftar server
const servers = [
    // SOUTHEAST_ASIA
    { id: 1, name: "SEA", ip: "13.76.128.50", port: 14301 },
    { id: 2, name: "SEA", ip: "13.76.135.145", port: 14301 },
    { id: 3, name: "SEA", ip: "52.230.66.176", port: 14301 },

    // NORTH_AMERICA
    { id: 11, name: "NA", ip: "110.234.17.5", port: 14300 },
    { id: 12, name: "NA", ip: "110.234.17.5", port: 14301 },
    { id: 13, name: "NA", ip: "110.234.17.51", port: 14300 },
    { id: 14, name: "NA", ip: "110.234.17.51", port: 14301 },

    // KOREA
    { id: 21, name: "KO", ip: "211.56.89.200", port: 14300 },
    { id: 22, name: "KO", ip: "211.56.89.201", port: 14300 },
];

// max percobaan ( n - 1 )
const maxTry = 4;

async function checkServer() {
    for (let i = 0; i < servers.length; i++) {
        await new Promise((resolve, reject) => {
            const server = servers[i];

            // init socket
            const socket = new Socket();
            socket.setTimeout(1000 * 10);

            db.read();
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
                    logger.info(`[${server.name}] Check attemp: ${Number(val.try) + 1}`);

                    // cek x kali percobaan, apakah benar-benar down atau tidak
                    if (val.try >= maxTry) {
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
setInterval(checkServer, 1000 * 60 * 2);
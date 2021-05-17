const { Socket } = require('net');
const axios = require('axios');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('./db/servers.json');
const db = low(adapter);

const servers = [
    { name: "SEA", ip: "13.76.128.50", port: 14301 },
    { name: "NA", ip: "110.234.17.5", port: 14300 },
];

async function checkServer() {
    for (let i = 0; i < servers.length; i++) {
        await new Promise((resolve, reject) => {
            const server = servers[i];

            const socket = new Socket();
            socket.setTimeout(15000);

            db.read();
            let status = 0;

            console.log(`[${server.name}] Connecting to ${server.ip}`);
            socket.connect(server.port, server.ip, function() {
                console.log(`[${server.name}] Connected!`);
            });

            socket.on('data', function(data) {
                // console.log(`[${server.name}] Received: ${data}`);
                console.log(`[${server.name}] Server is UP!`);
                status = 1;

                socket.destroy();
            });

            socket.on('error', (err) => {
                console.log(`[${server.name}] Server is DOWN!`);
                status = 0;
            })

            socket.on('timeout', () => {
                console.log(`[${server.name}] Server is TIMEOUT!`);
                socket.destroy();
            });

            socket.on('close', function() {
                const val = db.get('servers').find({ name: server.name }).value();

                if (val.status !== status) {
                    db.get('servers').find({ name: server.name }).assign({ status }).write();
                    console.log(`[${server.name}] > Sending notification ...`);

                    axios.get(`${process.env.AISHA_API}/server_update/${server.name.toLowerCase()}`)
                        .then((res) => true )
                        .catch(function (error) {
                            console.error(error);
                        });
                }

                console.log(`[${server.name}] Closed!`);
                console.log(' ');

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
        };
    });

    db.defaults({ servers: datas }).write();
};

initDb();
setInterval(checkServer, 60000);
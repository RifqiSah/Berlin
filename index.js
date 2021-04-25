const { Socket } = require('net');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('./db/servers.json');
const db = low(adapter);

const servers = [
    { name: "SEA", ip: "13.76.128.50", port: 14301 },
];

async function checkServer() {
    for (let i = 0; i < servers.length; i++) {
        const server = servers[i];

        const socket = new Socket();
        socket.setTimeout(5000);

        db.read();
        let status = 0;

        console.log(`Connecting to ${server.name} (${server.ip})`);
        socket.connect(server.port, server.ip, function() {
            console.log('Connected!');
        });

        socket.on('data', function(data) {
            console.log('Received: ' + data);
            console.log(server.name + " server is UP!");
            status = 1;

            socket.destroy();
        });

        socket.on('error', (err) => {
            console.log(server.name + " server is DOWN!");
            status = 0;
        })

        socket.on('timeout', () => {
            console.log(server.name + " server is TIMEOUT!");
            socket.destroy();
        });

        socket.on('close', function() {
            const val = db.get('servers').find({ name: server.name }).value();

            console.log(val.status);
            console.log(status);

            if (val.status !== status) {
                db.get('servers').find({ name: server.name }).assign({ status }).write();
                console.log('>> send webhook/notification here ...');
            }

            console.log('Closed!');
            console.log('');
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
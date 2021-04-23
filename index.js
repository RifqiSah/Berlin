const { Socket } = require('net');

const servers = [
    { name: "SEA", ip: "13.76.128.50", port: 14301 },
];

async function checkServer() {
    for (let i = 0; i < servers.length; i++) {
        const server = servers[i];

        const socket = new Socket();
        socket.setTimeout(5000);

        console.log(`Connecting to ${server.name} (${server.ip})`);
        socket.connect(server.port, server.ip, function() {
            console.log('Connected!');
        });

        socket.on('data', function(data) {
            console.log('Received: ' + data);
            console.log(server.name + " server is UP!");

            socket.destroy();
        });

        socket.on('error', (err) => {
            console.log(server.name + " server is DOWN!");
        })

        socket.on('timeout', () => {
            console.log(server.name + " server is TIMEOUT!");
            socket.destroy();
        });

        socket.on('close', function() {
            console.log('Closed!');
            console.log('');
        });
    }
}

setInterval(checkServer, 60000);
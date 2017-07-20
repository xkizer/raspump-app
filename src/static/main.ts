/**
 * Created by kizer on 20/07/2017.
 */
const config = {
    "local": {
        "host": "192.168.8.103",
        "port": 32000
    },
    "remote": {
        "host": "192.168.8.103",
        "port": 39000
    },
    "auth": {
        "user": "boostpump",
        "password": "`H(-5mk*k^H)}bDE"
    },
    "deviceId": "boostpump"
};


const localConfig = config.local;
const remoteConfig = config.remote;
const authInfo = config.auth;
const deviceId = config.deviceId;

const localUrl = `http://${localConfig.host}:${localConfig.port}`;
const remoteUrl = `http://${remoteConfig.host}:${remoteConfig.port}`;

let remoteSocket: SocketClient;
let localSocket: SocketClient;

// Connect to both local and remote at the same time
socket.connect(localUrl)
    .then(socket => localSocket = socket)
    .then(commonSetup)
    .then(localSetup);

socket.connect(remoteUrl)
    .then(socket => remoteSocket = socket)
    .then(commonSetup)
    .then(remoteSetup);

let pumpBtn;
let statusDsp;
let pumpStatus;

$(() => {
    pumpBtn = $('#pump-button');
    statusDsp = $('#pump-status');
});

function statusListener(status) {
    console.log('STATUS', status);
    pumpBtn[0].disabled = false;
    pumpStatus = status.status;

    if (status.status) {
        console.log('SWITCHING...');
        pumpBtn.text('Switch Off').addClass('on').removeClass('off');
        statusDsp.text('On').addClass('on').removeClass('off');
    } else {
        console.log('SWITCHING OFF...');
        pumpBtn.text('Switch On').addClass('off').removeClass('on');
        statusDsp.text('Off').addClass('off').removeClass('on');
    }
}

function commonSetup(socket: SocketClient) {
    // Login first
    return socket.login(authInfo.user, authInfo.password)
        .then(() => getInitialStatus(socket))
        .then(() => {
            pumpBtn.click(() => {
                socket.setStatus(deviceId, !pumpStatus);
            });
        })
        .then(() => socket) // Return the socket for chaining
        .catch((e) => {
            // Unable to authenticate, abort
            console.error(e);
            throw new Error(e);
        });
}

function localSetup(socket: SocketClient) {
    // Disconnect the remote server
    remoteSocket && remoteSocket.disconnect();
    socket.subscribe(deviceId, statusListener);

    const onReconnect = () => {
        // Set up the socket again
        commonSetup(socket)
            .then(() => {
                // When we reconnect, disable remote
                remoteSocket && remoteSocket.disconnect();
                socket.subscribe(deviceId, statusListener);
            });
    };

    const onDisconnect = () => {
        // When we disconnect, try to reconnect the remote
        remoteSocket && remoteSocket.reconnect();
        socket.unsubscribe(deviceId, statusListener);
    };

    socket.onDisconnect = onDisconnect;
    socket.onReconnect = onReconnect;
}

function remoteSetup(socket: SocketClient) {
    socket.subscribe(deviceId, statusListener);
    const pushButtonListerner = status => socket.setStatus(deviceId, status);

    const onReconnect = () => {
        // Set up the socket again
        commonSetup(socket)
            .then(() => {
                socket.subscribe(deviceId, statusListener);
            });
    };

    const onDisconnect = () => {
        // Unsibscribe
        socket.unsubscribe(deviceId, statusListener);
    };

    socket.onDisconnect = onDisconnect;
    socket.onReconnect = onReconnect;
}

function getInitialStatus(socket) {
    console.log('GETTING INTIAL STATUS');
    // Get the current status of the pump
    return socket.getStatus(deviceId)
        .then(statusListener);
}

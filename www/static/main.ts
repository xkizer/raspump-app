/**
 * Created by kizer on 20/07/2017.
 */
(() => {
    const config = {
        "local": {
            "host": "192.168.8.103",
            "port": 32000
        },
        "remote": {
            "host": "178.62.107.6",
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

    let pumpStatus;

    const pumpBtn: any = $('#pump-button');
    const statusDsp = $('#pump-status');

    function statusListener(status) {
        console.log('STATUS', status);
        pumpBtn[0].disabled = false;
        pumpStatus = status.status;

        console.log('pumpBtn', pumpBtn);

        if (status.status) {
            console.log('SWITCHING ON...');
            pumpBtn.text('Switch Off').addClass('on').removeClass('off');
            statusDsp.text('On').addClass('on').removeClass('off');
        } else {
            console.log('SWITCHING OFF...');
            pumpBtn.text('Switch On').addClass('off').removeClass('on');
            statusDsp.text('Off').addClass('off').removeClass('on');
        }
    }

// Connect to both local and remote at the same time
    socket.connect(localUrl)
        .then(socket => localSocket = socket)
        .then(commonSetup)
        .then(localSetup)
        .then(() => console.info('CONNECTED TO LOCAL'))
        .catch(e => console.error('FAILED TO CONNECT TO LOCAL', e));

    socket.connect(remoteUrl)
        .then(socket => remoteSocket = socket)
        .then(commonSetup)
        .then(remoteSetup)
        .then(() => console.info('CONNECTED TO REMOTE'))
        .catch(e => console.error('FAILED TO CONNECT TO REMOTE', e));

    function commonSetup(socket: SocketClient) {
        // Login first
        return socket.login(authInfo.user, authInfo.password)
            .then(() => getInitialStatus(socket))
            .then(() => socket) // Return the socket for chaining
            .catch((e) => {
                // Unable to authenticate, abort
                console.error(e);
                throw new Error(e);
            });
    }

    function localSetup(socket: SocketClient) {
        console.log('SETTING UP LOCAL SERVER');

        const setStatus = (...args) => {
            socket.setStatus(deviceId, !pumpStatus);
        };

        const onConnected = () => {
            pumpBtn.on('click', setStatus);

            // Is local connected?
            console.log('ABOUT TO DISCONNECT REMOTE', remoteSocket);
            remoteSocket && remoteSocket.disconnect();
            socket.subscribe(deviceId, statusListener);
        };

        const onReconnect = () => {
            console.log('LOCAL RECONNECTED');
            // Set up the socket again
            commonSetup(socket)
                .then(onConnected);
        };

        const onDisconnect = () => {
            console.log('LOCAL DISCONNECTED');
            // When we disconnect, try to reconnect the remote
            console.log('REMOTE===>', remoteSocket);
            remoteSocket && remoteSocket.reconnect();
            socket.unsubscribe(deviceId, statusListener);
            pumpBtn.off('click', setStatus);
        };

        socket.onDisconnect = onDisconnect;
        socket.onReconnect = onReconnect;
        onConnected();
    }

    function remoteSetup(socket: SocketClient) {
        console.log('SETTING UP REMOTE SERVER');

        const setStatus = (...args) => {
            socket.setStatus(deviceId, !pumpStatus);
        };

        const onConnected = () => {
            pumpBtn.on('click', setStatus);

            // Is local connected?
            localSocket && localSocket.socket.connected && socket.disconnect();
            socket.subscribe(deviceId, statusListener);
        };

        const onReconnect = () => {
            console.log('REMOTE RECONNECTED');
            // Set up the socket again
            commonSetup(socket)
                .then(() => onConnected);
        };

        const onDisconnect = () => {
            console.log('REMOTE DISCONNECTED');
            // Unsibscribe
            socket.unsubscribe(deviceId, statusListener);
            pumpBtn.off('click', setStatus);
        };

        socket.onDisconnect = onDisconnect;
        socket.onReconnect = onReconnect;
        onConnected();
    }

    function getInitialStatus(socket) {
        console.log('GETTING INTIAL STATUS');
        // Get the current status of the pump
        return socket.getStatus(deviceId)
            .then(statusListener);
    }
})();
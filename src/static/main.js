/**
 * Created by kizer on 20/07/2017.
 */
var config = {
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
var localConfig = config.local;
var remoteConfig = config.remote;
var authInfo = config.auth;
var deviceId = config.deviceId;
var localUrl = "http://" + localConfig.host + ":" + localConfig.port;
var remoteUrl = "http://" + remoteConfig.host + ":" + remoteConfig.port;
var remoteSocket;
var localSocket;
var pumpBtn;
var statusDsp;
var pumpStatus;
$(function () {
    pumpBtn = $('#pump-button');
    statusDsp = $('#pump-status');
});
function statusListener(status) {
    console.log('STATUS', status);
    pumpBtn[0].disabled = false;
    pumpStatus = status.status;
    console.log('pumpBtn', pumpBtn);
    if (status.status) {
        console.log('SWITCHING ON...');
        pumpBtn.text('Switch Off').addClass('on').removeClass('off');
        statusDsp.text('On').addClass('on').removeClass('off');
    }
    else {
        console.log('SWITCHING OFF...');
        pumpBtn.text('Switch On').addClass('off').removeClass('on');
        statusDsp.text('Off').addClass('off').removeClass('on');
    }
}
// Connect to both local and remote at the same time
socket.connect(localUrl)
    .then(function (socket) { return localSocket = socket; })
    .then(commonSetup)
    .then(localSetup)
    .then(function () { return console.info('CONNECTED TO LOCAL'); })
    .catch(function (e) { return console.error('FAILED TO CONNECT TO LOCAL', e); });
socket.connect(remoteUrl)
    .then(function (socket) { return remoteSocket = socket; })
    .then(commonSetup)
    .then(remoteSetup)
    .then(function () { return console.info('CONNECTED TO REMOTE'); })
    .catch(function (e) { return console.error('FAILED TO CONNECT TO REMOTE', e); });
function commonSetup(socket) {
    // Login first
    return socket.login(authInfo.user, authInfo.password)
        .then(function () { return getInitialStatus(socket); })
        .then(function () { return socket; }) // Return the socket for chaining
        .catch(function (e) {
        // Unable to authenticate, abort
        console.error(e);
        throw new Error(e);
    });
}
function localSetup(socket) {
    console.log('SETTING UP LOCAL SERVER');
    var setStatus = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        socket.setStatus(deviceId, !pumpStatus);
    };
    var onConnected = function () {
        pumpBtn.on('click', setStatus);
        // Is local connected?
        console.log('ABOUT TO DISCONNECT REMOTE', remoteSocket);
        remoteSocket && remoteSocket.disconnect();
        socket.subscribe(deviceId, statusListener);
    };
    var onReconnect = function () {
        console.log('LOCAL RECONNECTED');
        // Set up the socket again
        commonSetup(socket)
            .then(onConnected);
    };
    var onDisconnect = function () {
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
function remoteSetup(socket) {
    console.log('SETTING UP REMOTE SERVER');
    var setStatus = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        socket.setStatus(deviceId, !pumpStatus);
    };
    var onConnected = function () {
        pumpBtn.on('click', setStatus);
        // Is local connected?
        localSocket && localSocket.socket.connected && socket.disconnect();
        socket.subscribe(deviceId, statusListener);
    };
    var onReconnect = function () {
        console.log('REMOTE RECONNECTED');
        // Set up the socket again
        commonSetup(socket)
            .then(function () { return onConnected; });
    };
    var onDisconnect = function () {
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
//# sourceMappingURL=main.js.map
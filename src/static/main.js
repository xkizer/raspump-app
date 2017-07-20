/**
 * Created by kizer on 20/07/2017.
 */
var config = {
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
var localConfig = config.local;
var remoteConfig = config.remote;
var authInfo = config.auth;
var deviceId = config.deviceId;
var localUrl = "http://" + localConfig.host + ":" + localConfig.port;
var remoteUrl = "http://" + remoteConfig.host + ":" + remoteConfig.port;
var remoteSocket;
var localSocket;
// Connect to both local and remote at the same time
socket.connect(localUrl)
    .then(function (socket) { return localSocket = socket; })
    .then(commonSetup)
    .then(localSetup);
socket.connect(remoteUrl)
    .then(function (socket) { return remoteSocket = socket; })
    .then(commonSetup)
    .then(remoteSetup);
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
    if (status.status) {
        console.log('SWITCHING...');
        pumpBtn.text('Switch Off').addClass('on').removeClass('off');
        statusDsp.text('On').addClass('on').removeClass('off');
    }
    else {
        console.log('SWITCHING OFF...');
        pumpBtn.text('Switch On').addClass('off').removeClass('on');
        statusDsp.text('Off').addClass('off').removeClass('on');
    }
}
function commonSetup(socket) {
    // Login first
    return socket.login(authInfo.user, authInfo.password)
        .then(function () { return getInitialStatus(socket); })
        .then(function () {
        pumpBtn.click(function () {
            socket.setStatus(deviceId, !pumpStatus);
        });
    })
        .then(function () { return socket; }) // Return the socket for chaining
        .catch(function (e) {
        // Unable to authenticate, abort
        console.error(e);
        throw new Error(e);
    });
}
function localSetup(socket) {
    // Disconnect the remote server
    remoteSocket && remoteSocket.disconnect();
    socket.subscribe(deviceId, statusListener);
    var onReconnect = function () {
        // Set up the socket again
        commonSetup(socket)
            .then(function () {
            // When we reconnect, disable remote
            remoteSocket && remoteSocket.disconnect();
            socket.subscribe(deviceId, statusListener);
        });
    };
    var onDisconnect = function () {
        // When we disconnect, try to reconnect the remote
        remoteSocket && remoteSocket.reconnect();
        socket.unsubscribe(deviceId, statusListener);
    };
    socket.onDisconnect = onDisconnect;
    socket.onReconnect = onReconnect;
}
function remoteSetup(socket) {
    socket.subscribe(deviceId, statusListener);
    var pushButtonListerner = function (status) { return socket.setStatus(deviceId, status); };
    var onReconnect = function () {
        // Set up the socket again
        commonSetup(socket)
            .then(function () {
            socket.subscribe(deviceId, statusListener);
        });
    };
    var onDisconnect = function () {
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
//# sourceMappingURL=main.js.map
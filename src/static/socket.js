var socket = {
    connect: function (url) {
        return new Promise(function (res, rej) {
            // Attempt connection
            var client = io(url);
            client.once('connect', function () {
                res(new SocketClient(client));
            });
            client.on('connect_error', function (e) {
                rej(e);
            });
        });
    }
};
var SocketClient = (function () {
    function SocketClient(socket) {
        var _this = this;
        this.socket = socket;
        this.socket.on('disconnect', function () {
            // After disconnect, we are no longer logged in
            _this.user = null;
            if (_this.onDisconnect) {
                _this.onDisconnect();
            }
        });
        this.socket.on('reconnect', function () {
            if (_this.onReconnect) {
                _this.onReconnect();
            }
        });
    }
    SocketClient.prototype.login = function (user, password) {
        var _this = this;
        return new Promise(function (res, rej) {
            if (_this.user) {
                // Already logged in...
                res(true);
            }
            _this.socket.emit('auth', { user: user, password: password }, function (e) {
                if (e) {
                    res(true);
                    _this.user = user;
                }
                else {
                    rej();
                }
            });
        });
    };
    SocketClient.prototype.subscribe = function (deviceId, callback) {
        var _this = this;
        return new Promise(function (res) {
            _this.requireLogin();
            _this.socket.emit('subscribe', deviceId, function (e) { return res(e); });
            _this.socket.on('status', function (status) {
                if (status.deviceId === deviceId) {
                    callback(status);
                }
            });
        });
    };
    SocketClient.prototype.unsubscribe = function (deviceId, callback) {
        if (this.socket.connected) {
            this.socket.emit('unsubscribe', deviceId);
        }
        this.socket.off('status', callback);
    };
    SocketClient.prototype.setStatus = function (deviceId, status) {
        var _this = this;
        return new Promise(function (res) {
            _this.requireLogin();
            _this.socket.emit('setStatus', { deviceId: deviceId, status: status }, function (r) { return res(r); });
        });
    };
    SocketClient.prototype.getStatus = function (deviceId) {
        var _this = this;
        return new Promise(function (res) {
            _this.requireLogin();
            _this.socket.emit('getStatusAndDate', deviceId, function (r) { return res(r); });
        });
    };
    SocketClient.prototype.disconnect = function () {
        this.socket.disconnect();
    };
    SocketClient.prototype.reconnect = function () {
        var _this = this;
        if (this.socket.connected) {
            // Socket already connected
            return;
        }
        this.socket.once('connect', function () {
            if (_this.onReconnect) {
                _this.onReconnect();
            }
        });
    };
    SocketClient.prototype.requireLogin = function () {
        if (!this.user) {
            throw new Error('Not logged in');
        }
    };
    return SocketClient;
}());
var win = window;
win.socket = socket;
//# sourceMappingURL=socket.js.map
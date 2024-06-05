
class Network {
    static id = null;
    static peer = null;
    static onOpen = () => {};
    static onMessage = () => {};

    static open() {
        this.peer = new Peer();
        this.peer.on('open', id => {
            Network.id = id;
            Network.onOpen(id);
        });
        this.peer.on('connection', conn => {
            const msg = decodeFromBase36(conn.peer.substring(10));
            Network.onMessage(msg);
            conn.close();
        });
        this.peer.on('error', err => {
            console.error(err);
            alert('An error occurred while trying to connect to the peer.');
        });
        this.peer.on('disconnect', () => {
            console.log("Disconnected!");
        });
    }

    static close() {
        if (!this.peer) return;
        this.peer.disconnect();
    }

    static send(id, msg) {
        let msgId = randomString(10);
        msg = msgId + encodeToBase36(msg);

        let peer = new Peer(msg);
        peer.on('open', () => {
            let conn = peer.connect(id);
            conn.on('open', conn => {
                // console.log("Message sent!");
            });
            conn.on('error', function (err) {
                console.error(err);
                alert('An error occurred while trying to connect to the peer.');
            });
        });

        setTimeout(() => {
            peer.disconnect();
        }, 5000);
    }

    static on(event, callback) {
        if (event == "open") this.onOpen = callback;
        if (event == "message") this.onMessage = callback;
    }
}

// Function to encode a string to base 36 without spaces
function encodeToBase36(str) {
    let encoded = '';
    for (let i = 0; i < str.length; i++) {
        let charCode = str.charCodeAt(i);
        let base36 = charCode.toString(36).padStart(4, '0');
        encoded += base36;
    }
    return encoded;
}

// Function to decode a base 36 string back to original without spaces
function decodeFromBase36(encodedStr) {
    let decoded = '';
    for (let i = 0; i < encodedStr.length; i += 4) {
        let base36Chunk = encodedStr.slice(i, i + 4);
        let charCode = parseInt(base36Chunk, 36);
        decoded += String.fromCharCode(charCode);
    }
    return decoded;
}

const path = require('path');

exports.getRoom = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/room.html'));
};
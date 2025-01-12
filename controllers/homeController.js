const path = require('path');

exports.getIndex = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/index.html'));
};

exports.getHome = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/home.html'));
};

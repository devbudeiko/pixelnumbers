const path = require('path');

exports.getRules = (req, res) => {
    res.sendFile(path.join(__dirname, '../views/rules.html'));
};

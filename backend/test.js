require('dotenv').config();
const db = require('./db');
db.query('DESCRIBE admins',
    (err, rows) => {
        console.log
        (rows.map(r => r.Field + ': ' + r.Type));
        process.exit(0);
    }
);
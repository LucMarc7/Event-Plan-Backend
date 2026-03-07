const bcrypt = require('bcrypt');

const password = 'Jenechoueraisjamais@1994';
const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);
console.log(hash);
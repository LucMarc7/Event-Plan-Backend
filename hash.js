const bcrypt = require('bcrypt');

const password = 'Neverbackdown@1994';
const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);
console.log(hash);
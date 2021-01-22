const crypto = require('crypto');

let shasum = crypto.createHash('sha256');
// console.log(shasum)

let random = crypto.randomBytes(32).toString('hex');
// console.log(random);

shasum.update('password' + random);
// console.log(shasum);

// console.log(shasum.digest('hex'));
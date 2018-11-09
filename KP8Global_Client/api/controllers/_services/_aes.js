var logging = require('../_services/_log4')
  , logs = logging();

const crypto = require('crypto');
let bufferedTxt = new Buffer('kp8nodejs_MlhuillierInc_KPGlobal'); // Must be 256 bytes (32 characters) //secret key
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', bufferedTxt, iv);
  let encrypted = cipher.update(text);

  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  try {
    let textParts = text.split(':');
    let iv = new Buffer(textParts.shift(), 'hex');
    let encryptedText = new Buffer(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', bufferedTxt, iv);
    let decrypted = decipher.update(encryptedText);

    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  }
  catch (err) {
    throw err;
  }
}

module.exports = { decrypt, encrypt }
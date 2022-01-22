var mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

var Schema = mongoose.Schema;

var userSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},
    key: {type: String, required: true}
});


//Hashing the password with bcrypt.
//According to - https://www.usenix.org/legacy/events/usenix99/provos/provos.pdf - bcrypt is the way to go.
// https://codahale.com/how-to-safely-store-a-password/

userSchema.methods.encryptPassword = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);
};

userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
};


//Creating methods for encrypting the hash for the 2FA Authentication.

userSchema.methods.encrypt2FA = function(key){
    return bcrypt.hashSync(key, bcrypt.genSaltSync(5), null);
};

userSchema.methods.decrypt2FA = function(key){
    return bcrypt.compareSync(key, this.key);
};

module.exports = mongoose.model('User', userSchema);


var mongoose = require('mongoose');

var Schema = mongoose.Schema();

var authSchema = new Schema({
    value: {type: String, required: true},
    expires: {type: Number, default: Date.now(), required: true}
});

module.exports = mongoose.model('Authtoken', authSchema);


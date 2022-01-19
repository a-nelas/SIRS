var mongoose = require('mongoose');
const bcrypt = require("bcryptjs");

var Schema = mongoose.Schema;

var userSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true}
});


//Hashing the password with bcrypt.
//According to - https://www.usenix.org/legacy/events/usenix99/provos/provos.pdf - bcrypt is the way to go.
// https://codahale.com/how-to-safely-store-a-password/

//Using PRE middleware functions from mongoose to be sure to perform this operation before the data is saved.

userSchema.pre("save", function(next){
    const user = this;

    if(this.isModified("password") || this.isNew){
	bcrypt.genSalt(10,function(saltError, salt){
	    if(saltError){
		return next(SaltError);
	    }else{
		bcrypt.hash(user.password, salt, function(hashError, hash){
		    if(hasError){
			return next(hashError);
		    }

		    user.password = hash;
		    next()
		});
	    }
	});
    }else{
	return next();
    }
});

module.exports = mongoose.model('User', userSchema);

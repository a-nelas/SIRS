var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;
var TotpStrategy = require('passport-totp').Strategy;
var base32 = require('thirty-two');

passport.serializeUser(function(user, done){
    done(null, user.id); 
});

passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
	done(err, user); 
    });
});


passport.use('local.signup',new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
}, function(req, email, password, done){
    req.checkBody('email', 'Invalid email, use a correct email').notEmpty().isEmail();
    req.checkBody('password','Invalid password').notEmpty().isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1
    })
    .withMessage("Password must be greater than 8 and contain at least one uppercase letter, one lowercase letter, and one number");

    var errors = req.validationErrors();
    if(errors){
	var messages = [];
	errors.forEach(function(error){
	    messages.push(error.msg);
	});
	return done(null, false, req.flash('error', messages));
    }
    
    User.findOne({'email':email}, function(err, user){
	if(err){
	    console.log(err);
	    return done(err);
	}
	if(user){
	    return done(null, false, {message: 'The email is already registered'});
	}
	var newUser = new User();
	newUser.email = email;
	newUser.password = newUser.encryptPassword(password);
	newUser.key = "";
	newUser.save(function(err, result){
	    if(err){
		return done(err);
	    }
	    return done(null, newUser);
	});
    });
}));

			 

passport.use('local.signin',new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
    
}, function(req, email, password, done){
    req.checkBody('email', 'Invalid email, use a correct email').notEmpty().isEmail();
    req.checkBody('password','Invalid password').notEmpty();
    var errors = req.validationErrors();
    
    if(errors){
        var messages = [];
        errors.forEach(function(error){
            messages.push(error.msg);
        });
        return done(null, false, req.flash('error', messages));
    }

    User.findOne({'email':email}, function(err, user){
        if(err){
            console.log(err);
            return done(err);
        }
        if(!user){
            return done(null, false, {message: 'The user is not registered'});
        }
	if(!user.validPassword(password)){
	    return done(null, false, {mesages: 'The password is not matching'});
	}
	return done(null, user);
    });
}));

//Authenticating with FA authentication. 

passport.use(new TotpStrategy(
    function(user, done) {
        var key = user.key;
	console.log("Passport-config: "+user)
        if(!key) {
	    console.log("No Key");
            return done(new Error('No key'));
        } else {
	    console.log("There is a key");
            return done(null, base32.decode(key), 30); //30 = valid key period
        }
    })
);

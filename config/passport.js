var passport = require('passport');
var User = require('../models/user');
var LocalStrategy = require('passport-local').Strategy;
var TotpStrategy = require('passport-2fa-totp').Strategy;
var GoogleAuthenticator = require('passport-2fa-totp').GoogeAuthenticator //For some reason, it is Googe and not Google. 


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
    req.checkBody('password','Invalid password').notEmpty().isLength({min: 4});

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
	console.log("Aqui andamos");
	if(!user.validPassword(password)){
	    console.log("Ahora andamos dentro del if");
	    return done(null, false, {mesages: 'The password is not matching'});
	}
	return done(null, user);
    });
}));

//Authenticating with FA authentication. 

passport.use('totp-signup', new TotpStrategy ({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
},function(req, email, password, done){
    User.findOne({'email': email}, function(err, user){
	console.log("Imprimiendo el usuario");
	console.log(user)
	if(!(user.decrypt2FA(user.key))){
	    returne done(null, false, {messages: "There is no key"});
	}else{
	    return done(null, base32.decode(user.decrypt2FA(user.key)), 30);
	}
    });
}));



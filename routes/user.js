
var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var csrfProtection = csrf({cookie: true});
var sprintf = require('sprintf');
var crypto = require('crypto');
var base32 = require('thirty-two');
var User = require('../models/user');



router.get('/profile', isLoggedIn , function(req, res, next){
    res.render('user/profile');
});

router.get('/logout', isLoggedIn,  function(req, res, next){
    req.logout();
    res.redirect('/');
});


router.get('/totp-input', isLoggedIn, csrfProtection, function(req, res){

    User.findOne({'email':req.user.email}, function(err, user){
	if(err){
            console.log(err);
            return res.write("Error!");
        }
        if(user){
	    var testKey = user.key;
            if(!testKey){
		console.log("Logic error, totp-input requested with no key set");
		res.redirect('/');
	    }
	    res.render('user/totp-input', {csrfToken: req.csrfToken()});
	}
    });
});

router.post('/totp-input', isLoggedIn, csrfProtection, passport.authenticate('totp', {
    failureRedirect: '/user/signin',
    successRedirect: '/'
}));

router.get('/totp-setup', isLoggedIn, ensureTotp,  csrfProtection,  function(req, res, next){

    User.findOne({'email':req.user.email}, function(err, user){
        if(err){
            console.log(err);
            return res.write("Error!");
        }
	if(user){
	    var url = null;
	    var testKey = user.key;
	    if(testKey){
		var qrData = sprintf('otpauth://totp/%s?secret=%s',req.user.email,testKey);
		url = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=" + qrData;
	
	    }
	    res.render('user/totp-setup', {csrfToken: req.csrfToken(), user:req.user, qrUrl: url});
	}
    });
});


router.post('/totp-setup', isLoggedIn, ensureTotp, csrfProtection, function(req, res) {

    User.findOne({'email':req.user.email}, function(err, user){
        if(err){
	    console.log(err);
	    return res.write("Error!");
	}
	if(user){
	    if(req.body.totp) {
		req.session.method = 'totp';
		var secret = base32.encode(crypto.randomBytes(16));  
		secret = secret.toString().replace(/=/g, '');
		req.user.key = secret;
		user.key = secret;
		user.save(function(err){
		    if(err){
			return handleError(err);
		    }
		});
	    } else {	    
		req.session.method = 'plain';
		req.user.key = null;
            }
	    res.redirect('/user/totp-setup');
     	}
    });
});

router.use('/', notLoggedIn, function(req, res, next){
    next();
});

router.get('/signup', csrfProtection, function(req, res, next){
    var messages = req.flash('error');
    res.render('user/signup', {csrfToken: req.csrfToken(), messages: messages, isError: messages.length > 0});
});

router.post('/signup', csrfProtection , passport.authenticate('local.signup', {failureRedirect: '/user/signup', failureFlash: true }),
	    function(req, res){
		if(req.user.key){
		    req.session.method = 'totp';
		    res.redirect('/user/totp-input');
		} else {
		    req.session.method = 'plain';
		    res.redirect('/user/totp-setup');
		}
	    }
);

router.get('/signin', csrfProtection, function(req, res, next){
    var messages = req.flash('error');
    res.render('user/signin', {csrfToken: req.csrfToken(), messages: messages, isError: messages.length > 0});
});

router.post('/signin', csrfProtection, passport.authenticate('local.signin', {failureRedirect: '/user/signin', failureFlash: true}),
function(req, res, next){
    User.findOne({'email':req.user.email}, function(err, user){
        if(err){
            console.log(err);
            return res.write("Error!");
        }
	if(user){
	    if(user.key){
		req.session.method = 'totp';
		res.redirect('/user/totp-input');
	    } else {
		req.session.method = 'plain';
		res.redirect('/user/totp-setup');
	    }
	}
    });
});


module.exports = router;


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
	return next(); 
    }
    res.redirect('/');
}



function ensureTotp(req, res, next){
        if((req.user.key && req.session.method == 'totp') || (!req.user.key && req.session.method == 'plain')) {
        return next();
    } else {
	//console.log("req.user.key"+req.user.key);
	//console.log("req.session.method"+req.session.method);
	res.redirect('/');
    }
}


function notLoggedIn(req, res, next){
    if(!req.isAuthenticated()){
	return next(); 
    }
    res.redirect('/');
}


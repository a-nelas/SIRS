
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


router.get('/totp-setup', isLoggedIn, ensureTotp,  csrfProtection,  function(req, res, next){

    User.findOne({'email':req.user.email}, function(err, user){
        console.log("Post method of totp");
        if(err){
            console.log(err);
            return res.write("Error!");
        }
	if(user){
	    var url = null;
	    var testKey = user.key;
	    console.log("GET / req.user.key: "+req.user.key);
	    if(testKey){
		var qrData = sprintf('otpauth://totp/%s?secret=%s',req.user.email,testKey);
		url = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=" + qrData;
	    }
	    console.log(req.user);
	    res.render('user/totp-setup', {csrfToken: req.csrfToken(), user:req.user, qrUrl: url});
	}
    });
});


router.post('/totp-setup', isLoggedIn, ensureTotp, csrfProtection, function(req, res) {

    User.findOne({'email':req.user.email}, function(err, user){
        console.log("Post method of totp");
	if(err){
	    console.log(err);
	    return res.write("Error!");
	}
	if(user){
	    if(req.body.totp) {
		console.log("Enabling TOTP");
		req.session.method = 'totp';
		var secret = base32.encode(crypto.randomBytes(16));  //This is important, since there CAN NOT be two same secrets.
		secret = secret.toString().replace(/=/g, '');
		req.user.key = secret;
		user.key = secret;
		user.save(function(err){
		    if(err){
			return handleError(err);
		    }
		});
		console.log("PostTotp: "+req.user);
	    } else {	    
		console.log("Not enabling totp");
		req.session.method = 'plain';
		req.user.key = null;
            }
	    console.log("Redirect totp post");
	    res.redirect('/user/totp-setup');
     	}
    });
});

router.use('/', notLoggedIn, function(req, res, next){
    next();
});

router.get('/signup', csrfProtection, function(req, res, next){
    var messages = req.flash('error');
    console.log("GetSignUp: "+req.csrfToken())
    res.render('user/signup', {csrfToken: req.csrfToken(), messages: messages, isError: messages.length > 0});
});

router.post('/signup', csrfProtection , passport.authenticate('local.signup', {failureRedirect: '/user/signup', failureFlash: true }),
	    function(req, res){
		console.log("PostSignUp: "+req.csrfToken())
		if(req.user.key){
		    console.log("redirect /user/totp-input");
		    req.session.method = 'totp';
		    res.redirect('/user/totp-input');
		} else {
		    console.log("redirect user/totp-setup");
		    req.session.method = 'plain';
		    res.redirect('/user/totp-setup');
		}
	    }
);

router.get('/signin', csrfProtection, function(req, res, next){
    var messages = req.flash('error');
    res.render('user/signin', {csrfToken: req.csrfToken(), messages: messages, isError: messages.length > 0});
});

router.post('/signin', csrfProtection, passport.authenticate('local.signin', {
    successRedirect: '/user/totp-setup',
    failureRedirect: '/user/signin',
    failureFlash: true
}), function(req, res, next){
    if(req.user.key){
	req.session.method = 'totp';
            res.redirect('/user/totp-input');
    } else {
	req.session.method = 'plain';
        res.redirect('/user/totp-setup');
    }
});


module.exports = router;


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
	console.log("Autenticado");
	console.log("AutenticadoRE: "+req.user);
	return next(); 
    }
    console.log(req.isAuthenticated());
    console.log("Redirecting isLoggedIn");
    res.redirect('/');
}



function ensureTotp(req, res, next){
    console.log("=============================");
    console.log(req.isAuthenticated());
    console.log(req.user);
    console.log("EnsureTotp :"+req.user.key);
    console.log("EnsureTotp: "+req.session.method);
    console.log("req.isAuthneticated(): "+req.isAuthenticated());
    
    if((req.user.key && req.session.method == 'totp') || (!req.user.key && req.session.method == 'plain')) {
        return next();
    } else {
	//console.log("req.user.key"+req.user.key);
	//console.log("req.session.method"+req.session.method);
	console.log("Redirecting ensureTotp");
	res.redirect('/');
    }
}


function notLoggedIn(req, res, next){
    if(!req.isAuthenticated()){
	return next(); 
    }
    console.log(req.isAuthenticated());
    console.log("Redirecting notLoggedIn");
    res.redirect('/');
}


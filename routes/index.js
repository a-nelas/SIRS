var express = require('express');
var router = express.Router();
var Product = require('../models/product');
var csrf = require('csurf');
var passport = require('passport');

var csrfToken = csrf();
router.use(csrfToken);

/* GET home page. */
router.get('/', function(req, res, next) {
    Product.find(function(err, docs){
	var chunks = [];
	var chSize = 3;
	for(var i = 0; i < docs.length; i+= chSize){
	    chunks.push(docs.slice(i, i+chSize));
	}
	res.render('shop/index', { title: 'SIRS Project', products: chunks});
    });
});

router.get('/user/signup', function(req, res, next){
    var messages = req.flash('error');
    res.render('user/signup', {csrfToken: req.csrfToken(), messages: messages, isError: messages.length > 0});
});

router.post('/user/signup', passport.authenticate('local.signup', {
    successRedirect: '/user/profile',
    failureRedirect: '/user/signup',
    failureFlash: true
}));


router.get('/user/profile', function(req, res, next){
    res.render('user/profile');
});



module.exports = router;

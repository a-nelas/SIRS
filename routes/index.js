var express = require('express');
var router = express.Router();
var Product = require('../models/product');
var csrf = require('csurf');

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
    res.render('user/signup', {csrfToken: req.csrfToken()});
});

router.post('/user/signup', function(req, res, next){
    res.redirect('/');
});

module.exports = router;

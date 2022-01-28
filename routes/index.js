var express = require('express');
var router = express.Router();
var passport = require('passport');
const bcrypt = require("bcryptjs");
var util= require('util');
var Product = require('../models/product');
var Cart = require('../models/cart');
var https = require('https');
var http = require('http')
var fs = require('fs');
const { check, validationResult } = require('express-validator');


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


router.get('/add-to-cart/:id', function(req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    Product.findById(productId, function(err, product) {
       if (err) {
           return res.redirect('/');
       }
        cart.addProducts(product, product.id);
        req.session.cart = cart;
        res.redirect('/');
    });
});


router.get('/cart', function(req, res, next){
    if(!req.session.cart){
	return res.render('shop/cart', {products: null});
    }
    var cart = new Cart(req.session.cart);
    res.render('shop/cart', {products: cart.generateArray(), totalPrice: cart.totalPrice, totalQuantity: cart.totalQuantity});
});



router.get('/checkout', function(req, res, next){
    if(!req.session.cart){
	return res.redirect('/cart');
    }
    var cart = new Cart(req.session.cart); 
    var messages = req.flash('error');
    res.render('shop/checkout', {total: cart.totalPrice, messages: messages, isError: messages.length > 0});
});

router.post('/checkout', isLoggedIn, verifyData , function(req, res, next){
    if (!req.session.cart) {
        return res.redirect('/cart');
    }
    var cart = new Cart(req.session.cart);
    var phone = req.body.phone;
    var address = req.body.address;
    var cardname = req.body.cardname;
    var tmp1 = req.body.cardnumber; //For some reason bcrypt function does not accept the parameters with a dot inside it. 
    var tmp2 = req.body.cardcvc;   // Same as above
    var creditCardNumber = bcrypt.hashSync(tmp1, bcrypt.genSaltSync(5), null);
    var cvc = bcrypt.hashSync(tmp2, bcrypt.genSaltSync(5), null);
    var tmp3 = creditCardNumber+cvc; //Same as in tmp1 and tmp2 ... 
    var uuid = bcrypt.hashSync(tmp3, bcrypt.genSaltSync(5), null);
    var totalPrice = cart.totalPrice;
    var obj = {
	"creditcard":creditCardNumber,
	"cv":cvc,
	"phone":phone,
	"cardname": cardname,
	"totalPrice": totalPrice,
	"uuid": uuid
    };
    const dataTransaction = JSON.stringify(obj);
    const data = new TextEncoder().encode(dataTransaction);
    const options = {
	hostname: '192.168.1.50',
	port: 5000,
	path: '/transactions',
	method: 'POST',
	key: fs.readFileSync('/home/osboxes/Documents/Proyecto/MerchantSIRS/keys/https/merchant.pem'),
	cert: fs.readFileSync('/home/osboxes/Documents/Proyecto/MerchantSIRS/keys/https/cert.pem'),
	rejectUnauthorized: false,
	//requestCert: true,
	//agent: false,
	headers: {
	    'Content-Type': 'application/json',
	    'Content-Length': data.length
	}
    };
    const request = http.request(options, res => {
	res.on('data', d => {
	    console.log("res.on: "+d);
	    process.stdout.write(d);
	});
    });
    request.on('error', error => {
	console.error(error);
    });
    
    request.write(data);
    request.end();

});



module.exports = router;

function verifyData(req, res, next){
    
    req.checkBody('phone', 'Invalid email, use a correct email').notEmpty().isMobilePhone();
    req.checkBody('cardname', 'Invalid Card Number').notEmpty().matches(/^[A-Za-z\s]+$/);
    req.checkBody('cardnumber', 'Invalid Card name').notEmpty().isNumeric();
    req.checkBody('cardcvc', 'Invalid CVC').isInt().isLength({max: 3});
    req.checkBody('card-expiry-month', 'Invalid Month').isInt().isLength({max: 2});
    req.checkBody('card-expiry-year', 'Invalid Month').isInt().isLength({max: 4});
    
    var errors = req.validationErrors();
    if(errors){
	var messages = [];
	errors.forEach(function(error){
            messages.push(error.msg);
	    
	});
	console.log(messages);
	res.redirect("/checkout");
    }
    return next();
}

function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
	return next();
    }
    res.redirect('/');
}



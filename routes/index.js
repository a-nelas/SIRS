var express = require('express');

var router = express.Router();

var passport = require('passport');
var Product = require('../models/product');
var Cart = require('../models/cart');

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
        console.log(req.session.cart);
        res.redirect('/');
    });
});



module.exports = router;

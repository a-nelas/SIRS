var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressHbs = require('express-handlebars');
var mongoose = require('mongoose');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var validator = require('express-validator');
var MongoStore = require('connect-mongo')(session);

var routes = require('./routes/index');
var userRoutes = require('./routes/user');

var app = express();





//MongoDB SSL Connection.
const db_server_ip = '192.168.0.100'
const db_server_port = '27017'
const db_name = 'SIRSProject'
const db_server_url = `mongodb://${db_server_ip}:${db_server_port}/${db_name}`;

const mongo_client_options = {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsCertificateKeyFile: `${__dirname}/keys/mongodb_client.pem`
};

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(db_server_url, mongo_client_options);
  console.log(`Esta viva!`);
};

require('./config/passport');

// view engine setup
app.engine('.hbs', expressHbs.engine({defaultLayout: 'layout', extname: '.hbs', runtimeOptions: {allowProtoPropertiesByDefault: true, allowProtoMethodsByDefault: true}}));
app.set('view engine', '.hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(validator());
app.use(cookieParser());

app.use(session({
    secret: 'sirs',
    resave: false,
    saveUnitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection}),
    cookie: { maxAge: 120 * 60 * 1000  } //120 minutos and the sessions will expire. 
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function(req, res, next){
    res.locals.login = req.isAuthenticated();
    res.locals.session = req.session; 
    next();
});

app.use('/user', userRoutes);
app.use('/', routes);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// develoment error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;

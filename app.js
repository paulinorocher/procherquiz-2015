var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var partials = require('express-partials');
var methodOverride = require('method-override');
var session = require('express-session');

var routes = require('./routes/index');

var app = express();

var sessionDateTime = new Date();   // Fecha y hora de la ultima transaccion
var interval = 10;                  // Intervalo en segundos tras el cual se hara auto logout
var timeout = 0;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(partials());

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser('Quiz 2015'));
app.use(session());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Helpers dinamicos:
app.use(function(req, res, next) {

    // guardar path en session.redir para despues de login
    if (!req.path.match(/\/login|\/logout/)) {
        req.session.redir = req.path;
        timeout = 0;
    }

    // Hacer visible req.session en las vistas
    res.locals.session = req.session;

    // Hacer visible req.timeout en las vistas
    res.locals.timeout = timeout;
    
    next();
});

// auto logout
app.use(function(req, res, next) {

    var newDateTime = new Date();
    var lapse = ((60 * newDateTime.getMinutes()) + newDateTime.getSeconds()) - ((60 * sessionDateTime.getMinutes()) + sessionDateTime.getSeconds());
    console.log("-----------------------------------------------------------------------------\n" +
                "-> Han pasado " + lapse + " segundos desde la última transacción. Limite: " + interval + " \n" +
                "-----------------------------------------------------------------------------");
    var aux = sessionDateTime;
    //aux.setMinutes(sessionDateTime.getMinutes() + interval);
    aux.setSeconds(sessionDateTime.getSeconds() + interval);
    sessionDateTime = newDateTime;

    // El código no se ejecutará si el usuario esta intentando hacer login o logout
    if (req.path.match(/\/login|\/logout/)) {
        next();
    } else {
        if ( newDateTime < aux ) {
            next();
        } else 
            if ( req.session.user ) {
                delete req.session.user;
                console.log(">> AUTO LOGOUT: SESSION DESTROYED <<");
                timeout = 1;
                res.redirect('/login');
            } else { 
                console.log("O> EL USUARIO NO ESTA AUTENTICADO <O");
                next();
            }
    }
});

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err, 
            errors: []
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}, 
        errors: []
    });
});


module.exports = app;

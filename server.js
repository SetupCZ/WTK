var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('app:server');
var http = require('http');
var expressJwt=require('express-jwt');
var jwt=require('jsonwebtoken');
// const cors = require('cors');

const { refreshTokens, getTokens, setTokens } = require('./authentication');

process.env.SECRET = "secret"
process.env.SECRET2 = "secret"

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(cors('*')) // include before other routes

// routes
var index = require('./routes/index');
var users = require('./routes/users');
app.use('/', index);
app.use('/users', users);


// wtk
// wtk routes
const wtk = require('./wtk/wtk.js');
app.use(wtk)

// const wtkInit = require('./routes/wtk-init');
// const wtkAuth = require('./routes/wtk-auth');
// app.use('/wtk', wtk.wtkInit);
// app.use('/wtk/auth', async (req, res, next) => {
//   const [accessToken, refreshToken] = getTokens(req)
//   if (!accessToken) return next()
//   try {
//     const { user } = jwt.verify(accessToken, process.env.SECRET)
//     req.user = user
//     console.log('inTokenVerified');

//   } catch (err) {
//     console.log('inError');
//     if (err.name === "TokenExpiredError" && err.message === "jwt expired") {
//       console.log('inTokenExpirated');
//       const [newAccessToken, newRefreshToken, user] = await refreshTokens(accessToken, refreshToken, process.env.SECRET, process.env.SECRET2)
//       if (newAccessToken && newRefreshToken) {
//         console.log('inNewTokens');
//         setTokens(newAccessToken, newRefreshToken, user.id, res)
//         req.user = user
//       }
//     }
//   }
//   next()
// });
// app.use('/wtk/auth', wtkAuth);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



// start server
var port = normalizePort(process.env.PORT || '3010');
app.set('port', port);

var server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  console.log(error);
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

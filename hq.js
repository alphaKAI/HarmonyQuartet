/**
  Harmony Quartet Version 0.0.1
  The Twitter Client Written in Node.js
  Copyright (C) alphaKAI 2014 <alpha.kai.net@alpha-kai-net.info>
  */

// Load package setings
package = require('./package.json');
// Load Libraries
var io = require('socket.io'),
fs = require('fs'),
qs = require('qs'),
url = require('url'),
ejs = require('ejs'),
http = require('http'),
path = require('path'),
util = require('util'),
twit = require('twit'),
confu = require('confu'),
async = require('async'),
routes  = require('./routes'),
express = require('express'),
favicon = require('serve-favicon'),
session = require('express-session'),
cookieParser = require('cookie-parser'),
bodyParser   = require('body-parser'),
MongoStore   = require('connect-mongo')(session);
// Create Instances
var app = express();

// Configure
app.set('port', 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(session({
  secret:"secret",
  store: new MongoStore({
    db: 'session',
    host: 'localhost',
    clear_interval: 60 * 60
  }),
  cookie:{
    httpOnly: false,
    maxAge: new Date(Date.now() + 60 * 60 * 1000)
  }
}));

app.use(bodyParser.json());
//app.use(express.logger('dev'));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded());
//app.use(app.router);

// configure routing
var loginCheck = function(req, res){
  if(req.session.user){
    res.redirect('/main');
  }else{
    res.redirect('/login');
  }
};
app.get('/', function (req, res){
  loginCheck();
  //Todo : multiuser
//  start(req, res);
}, routes.index);

app.get('/', loginCheck, routes.index);
app.get('/login', routes.login);
app.post('/register', routes.register);
app.get('/logout', function(req, res){
  req.session.destroy();
  console.log('deleted sesstion');
  res.redirect('/');
});

app.get('/main', routes.main);

var oauth = new (require('oauth').OAuth)(
  'https://api.twitter.com/oauth/request_token',
  'https://api.twitter.com/oauth/access_token',
  '8ZgnC0RgcDsHUkzV2MIRyw',
  'fB5VuIEBr8qsxCtLAJ8JQYsJ0XlmoybXlM6DnmOeOE',
  '1.0',
  'http://127.0.0.1:3000/signin/twitter',
  'HMAC-SHA1'
);

app.get('/signin', function(req, res) {
    oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
        if(error) {
            res.send(error)
        } else {
            req.session.oauth = {};
            req.session.oauth.token = oauth_token;
            req.session.oauth.token_secret = oauth_token_secret;
            res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token);
        }
    });
});

app.get('/signin/twitter', function(req, res){
    if(req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;
        oauth.getOAuthAccessToken(req.session.oauth.token, req.session.oauth.token_secret, req.session.oauth.verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results){
                if(error){
                  res.send(error);
                } else {
                  req.session.oauth.access_token = oauth_access_token;
                  req.session.oauth.access_token_secret = oauth_access_token_secret;
                  req.session.user_profile = results;
                  res.redirect('/login', [oauth_access_token, oauth_access_token_secret]);
                }
            }
        );
    }
});

// Start Server
var server = http.createServer(app).listen(app.get('port'), function (){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server).set('log level', 1);

var setting_file = confu('setting.json');
var account = {
  'consumer_key': setting_file.consumer_key,
  'consumer_secret': setting_file.consumer_secret,
  'access_token': setting_file.access_token,
  'access_token_secret': setting_file.access_token_secret
};
twitter = null;
admin_name = null;
oa = null;
need_oauth_flag = false;
// Check  for consumer_key and consumer_secret
if(!account.consumer_key || !account.consumer_secret){
  console.log('ERROR: ConsumerKey or ConsumerSecret is empty. Please Configure setting.json');
  process.exit();
}
if(!account.access_token || !account.access_token_secret){
  console.log('get access token');
  get_access_token();
} else {
  twitter = new twit(account);
  admin_name = get_admin_name(twitter);
}
//Main Program
function get_access_token(){
  oa = new OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    account.consumer_key,
    account.consumer_secret,
    '1.0',
    'http://127.0.0.1:3000/auth/callback',
    'HMAC-SHA1'
  );
  need_oauth_flag = true;
}
function get_admin_name(twitter){
  twitter.get('account/verify_credentials', function (err, res){
    admin_name = res['screen_name'];
  });
}
function ref_admin_name(twitter){
  if(!admin_name)
    admin_name = get_admin_name(twitter);
  return admin_name;
}
function buildUserPage(data){
  var tasks = []; 
  var target = data.id;
  var tweets;
  var followings
  var followers;

  // These functions is not work
  tasks[0] = function(){
    console.log('task1');
    tweets = twitter.get('statuses/user_timeline', {
      screen_name:target,
      count:10
    }, function(err, res){});
  };
  tasks[1] = function(){
    console.log('task2');
    followings = twitter.get('friends/ids', {
      screen_name:target
    }, function(err, res){});
  };
  tasks[2] = function(){
    console.log('task3');
    followers = twitter.get('followers/ids', {
      screen_name:target
    });
  };
  tasks[3] = function(){
    console.log('tweets');
    console.log(tweets);
    console.log('followings');
    console.log(followings);
    console.log('followers');
    console.log(followers);
  }
  async.series(tasks);
  //
}
var session_status = false;
function start(req, res){
  // Check access token
  var ustream = twitter.stream('user');
  var session_id = null;

  io.sockets.on('connection', function (socket){
    session_id = socket.id;
    session_status = true;
    // Commands request by client
    socket.on('initialize', function (){
      emit_to_client('initialize', ref_admin_name(twitter), session_id);
    });

    socket.on('tweet', function (data){
      twitter.post('statuses/update', {
        status: data.text
      }, function (err, res){});
    });

    socket.on('tweetDestory', function (data){
      twitter.post('statuses/destroy/:id')
    });

    socket.on('reply', function (data){
      twitter.post('statuses/update', {
        status: data.text, 
        in_reply_to_status_id: data.in_reply_to_status_id
      }, function (err, res){});
    });

    socket.on('retweet', function (data){
      twitter.post('statuses/retweet/:id', {
        id: data.id
      }, function (err, res){});
    });

    socket.on('favorite', function (data){
      twitter.post('favorites/create', {
        id: data.id
      }, function (err, res){});
    });

    socket.on('unfavorite', function (data){
      twitter.post('favorites/destroy', {
        id: data.id
      }, function (err, res){});
    });

    socket.on('getUserPage', function (data){
      console.log('start');
      buildUserPage(data);
      //emit_to_client('userPage', buildUserPage(data), session_id);
    });
    socket.on('disconnect', function (){
      session_id = null;
      session_status = false;
    });
  });

  ustream.on('tweet', function (data){
    data.text = data.text.replace(/(https?|ftp)(:\/\/[-_.!~*?'()a-zA-Z0-9;?\/?:?@&=+?$,%#]+)/gi, '<a href="$1$2">$1$2</a> ');
    if(data.text.match(admin_name)){
      emit_to_client('reply', {
        'status': 'reply',
        'id': data.id_str,
        'name': data.user.name,
        'screen_name': data.user.screen_name,
        'text': data.text,
        'icon_url': data.user.profile_image_url
      }, session_id);
    } else {
      emit_to_client('tweet', {
        'status': 'tweet',
        'id': data.id_str,
        'name': data.user.name,
        'screen_name': data.user.screen_name,
        'text': data.text,
        'icon_url': data.user.profile_image_url
      }, session_id);
    }
  });
}
function emit_to_client(method, data, session_id){
  if(session_id == null){ return 'error'; }
  io.sockets.socket(session_id).emit(method, data);
}

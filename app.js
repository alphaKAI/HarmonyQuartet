/**
 * Harmony Quartet
 * GPLv3 LICENSE  
 * Copyleft (C) alphaKAI 2013 http://alpha-kai-net.info  
 */
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , util = require('util');

var app = express();

// add start
var twitter = require('ntwitter');
var io = require('socket.io').listen(app);

var twitter = new twitter({
  consumer_key: '',
  consumer_secret: '',
  access_token_key: '',
  access_token_secret: ''
});
// add end

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);

var cnt = 1

io.sockets.on('connection', function (socket) {
	socket.on('post', function (data){
		if(data.mode == "tweet"){
			console.log("=> " + data.text);
			twitter.updateStatus(data.text, function(err, data){});
		}
	});
});
app.get('/', function(req, res){
  res.render('index');
  var admin_name = new String;
  twitter.verifyCredentials(function (err, data) {
	admin_name = data["screen_name"];
  });
  
   twitter.stream('user', {}, function (stream){
	stream.on('data', function (data){
		var uinfo = {};
		var tweet = new String;
		tweet = data["text"];
		
		//クラッシュしないようにツイートがあるか判定する
		if(tweet != undefined){
			uinfo = data["user"];
			var uname = uinfo["name"];
			var div_twi = new String;
			
			if(tweet.indexOf(admin_name) != -1){
				div_twi = '<div class="tweet reply">'
			} else{
				div_twi = '<div class="tweet">'
			}
			
			var str = "<img src=\"" + uinfo["profile_image_url"] + "\"> " 
						+
					div_twi + uname + "<br>" + tweet + '</div>';
			io.sockets.emit('message', str);
			console.log(str);
		}
		cnt++;
	});
	stream.on('end', function (response){
  
    });
    stream.on('destroy', function (response){
  
    });
  });
});
//Read model
var model = require('../model.js'),
User      = model.User;

exports.index = function(req, res){
  res.render('index', { 
    title: 'HarmonyQuartet',
    user: req.session.user
  });
  console.log(req.session.user);
};

exports.register = function(req, res){
  twitter.get('account/verify_credentials', function (err, res){
    admin_name = res['screen_name'];
  });

  var newUser = new User(req.body);
  newUser.save(function(err){
    if(err){
      console.log(err);
      res.redirect('back');
    }else{
      res.redirect('/');
    }
  });
};

/*ログイン機能*/
exports.login = function(req, res, oauthData){
  if(oauthData.length > 0){
    res.redirect('/main', oauthData)
  }
  res.redirect('/signin/twitter');
  User.find(query, function(err, data){
    if(err){
      console.log(err);
    }
    if(data == ""){
      res.render('login');
    }else{
      res.redirect('/');
    }
  });
};
exports.main = function(req, res){
  res.render('index', { title: 'HarmonyQuartet' });
};
//exports. some pages routing role

/* GET home page. */
exports.index = function(req, res){
  res.render('index', { title: 'HarmonyQuartet' });
};
exports.main = function(req, res){
  res.render('index', { title: 'HarmonyQuartet' });
}
exports.wait = function(req, res){
  res.render('wait', { title: 'Please Wait 2 sec' });
}
//exports. some pages routing role


/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
  res.render('index', {
	content: req.body.textbox
  });
};
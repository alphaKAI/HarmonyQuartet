window.onload = function(){
 tab("recent"); 
  in_reply_to_status_id = null;
  socket     = io.connect("http://localhost:3000");
  select_id = null;
  admin_name = null;
  socket_io_toggle();
  socket.emit("initialize", null);
}
function socket_io_toggle(){
  socket.on("initialize", function(data){ admin_name = data; });
  socket.on("tweet", function(data){
    console.log(data.text);
    console.log(data.icon_url);
    build_format(data);
  });
  socket.on("reply", function(data){
    build_format(data);
  });
}
function set_id(id){
  in_reply_status_id = id;
}
function build_format(data){
  var div_string = 
    ' <div class ="statusIs' + data.status + '" id="' + data.id + '" '
  + ' onclick="javascript:click_tweet(\'' + data.id + '\');" > ' 
  + '   <img class="userIcon" src="'+ data.icon_url +'" /> '
  + '   <div class="userName">'+ data.name +'(@'+ data.screen_name+')</div> '
  + '   <div class="tweetBody">' + data.text + '</div> '
  + '   <div class="toggleReaction"> '
  + '     <a class="toggle" href="javascript:reply(\'' + data.screen_name+ '\', \'' + data.id +'\');"> '
  + '       <span class="toggleParts">Reply</span> '
  + '     </a> '
  + '     <a class="toggle" href="javascript:retweet(\''+ data.id +'\');"> '
  + '       <span class="toggleParts">Retweet</span> '
  + '     </a> '
  + '     <a class="toggle" href="javascript:favorite(\''+ data.id +'\');"> '
  + '       <span class="toggleParts">Favorite</span> '
  + '     </a> '
  + '   </div> '
  + ' </div> ';
  var target = null;
  switch(data.status){
    case "tweet":
      target = "recent";
      break;
    default:
      target = data.status;
      break;
  }
  var arg_data = {
    "target": target,
    "div_string": div_string
  }
  adding_tweet_to_tab(arg_data);
}
function adding_tweet_to_tab(data){
  var target = data.target;
  var div_string = data.div_string;
  switch(target){
    case "reply":
      $("#reply").prepend(div_string);
      target = "recent";
      break;
  }
  $("#" + target).prepend(div_string);
}
function click_post_button(){
  post($("#textbox").val());
  in_reply_to_status_id = null;
   $("#textbox").val("");
}
function click_tweet(id){
  set_id(id);
  $("#"+id).css("background-color", "red");
  if(select_id) $("#" + select_id).css("background-color", "#b9a3a3");
  select_id = id;
}
function reply(target_id, status_id){
  set_id(status_id);
  $("#textbox").val("@" + target_id + " ");
}
function tab(id) {
	var lis = document.getElementById("tabs").getElementsByTagName("li");
	for(var i = 0; i < lis.length;i++) {
		if(id) {
			var n = lis[i].getAttribute("name");
			var box = document.getElementById(n);
			if(n == id) {
				box.style.display		= "block";
				box.style.visibility	= "visible";
				lis[i].className		= "open boxs timeline";
			} else {
				box.style.display		= "none";
				box.style.visibility	= "hidden";
				lis[i].className		= "boxs timeline";
			}
		} else {
			lis[i].onclick = function() {
				tab(this.getAttribute("name"));
			}
		}
	}
}

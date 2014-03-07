function post(text){
  if(in_reply_to_status_id){
    socket.emit("tweet", {text: text});
  } else {
    socket.emit("reply", {text: text, in_reply_to_status_id: in_reply_to_status_id});
  }
}
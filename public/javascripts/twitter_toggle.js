function post(text){
  if(reply_flag){
    socket.emit("tweet", {
      text: text
    });
  } else {
    socket.emit("reply", {
      text: text, "in_reply_to_status_id": in_reply_to_status_id
    });
  }
}

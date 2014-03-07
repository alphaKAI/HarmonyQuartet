$.fn.urlAutoLink = function(baseURL){
	return this.each(function(){  
		var srcText = this.innerHTML;
		this.innerHTML = srcText.replace(/(http:\/\/[\x21-\x7e]+)/gi, "<a href='$1'>$1</a>");  
	});
}

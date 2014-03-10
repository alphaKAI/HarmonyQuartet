function rgbConvertToHex(rgb){
  rgb = rgb.replace("rgb(","");
  rgb = rgb.replace(")","");
  rgb = rgb.split(",");
  rgb = "#"+parseInt(rgb[0]).toString(16)+parseInt(rgb[1]).toString(16)+parseInt(rgb[2]).toString(16);
  return rgb
}
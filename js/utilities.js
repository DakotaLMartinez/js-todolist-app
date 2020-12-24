DOMTokenList.prototype.set = function(classString) {
  this.add(...classString.split(" "));
}
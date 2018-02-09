if (!Array.from) {
  Array.from = function () {
    return Array.prototype.slice.call(arguments);
  }
}

function once(func) {

  if (typeof func !== 'function') {
    throw Error('Argument must be a function.');
  }

  return function () {
    if (func !== null) {
      func();
      func = null;
    }

  };
}

module.exports = once;

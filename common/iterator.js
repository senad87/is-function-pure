const once = require('./once');

function Iterator() {

  function iterate(array, step, end) {

    function next(array, index) {

      const lastIndex = array.length - 1;
      if (index <= lastIndex) {
        step(array[index], once(next.bind(undefined, array, index + 1)), index);
      } else {
        end();
      }

    }

    next(array, 0);
  }

  return {
    iterate
  };
}

module.exports = Iterator;
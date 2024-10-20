var IsFunctionPure = require("is-function-pure");


const isPure = IsFunctionPure.isPure(`
    function add(a, b) {
    return a + b;
  }
`);

console.log(isPure);

const { isPure } = require('is-function-pure');

const pureFunction = `
  function multiply(a, b) {
    return a * b;
  }
`;

console.log(isPure(pureFunction)); // Output: true

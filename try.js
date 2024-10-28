const { isPure } = require('is-function-pure');

const pureFunction = `
  function multiply(a, b) {
    return a * b;
  }
`;

console.log(isPure(pureFunction)); // Output: false


const impureFunction = `
  function setUseName(name) {
    return globalUserObject.name = name;
  }
`;

console.log(isPure(impureFunction)); // Output: false

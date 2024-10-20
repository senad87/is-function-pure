# is-function-pure

is-function-pure is a JavaScript utility for detecting if function is pure.


## Installation
To install the package, use npm:

```
npm install is-function-pure
```


## Usage
### separate(sourceCode)
The separate function analyzes a block of code and returns an object containing two arrays: pure and impure. Each array holds details about the functions found in the code.

Input: A string containing JavaScript code.

Output: An object with pure and impure arrays.


```
const { separate } = require('is-function-pure');

const code = `
  const x = 5;
  function add(a, b) {
    return a + b;
  }
  function impure(a) {
    return a + x;
  }
`;

const result = separate(code);

console.log('Pure Functions:', result.pure);
console.log('Impure Functions:', result.impure);
```



### isPure(singleFunctionSourseCode)
The isPure function checks if a single function in the given code is pure. It returns true if the function is pure, and false otherwise.

Input: A string containing a single JavaScript function.

Output: A boolean indicating whether the function is pure.


```
const { isPure } = require('is-function-pure');

const pureFunction = `
  function multiply(a, b) {
    return a * b;
  }
`;

console.log(isPure(pureFunction)); // Output: true
```

## Testing
Tests are written using chai and can be run with:


```
npm run test
```


## Sponsors

Support this project by becoming a sponsor. Your contributions help me improve the library and create more open-source tools for the community.

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-blue?logo=github&style=flat-square)](https://github.com/sponsors/senad87)
<!-- [![Patreon](https://img.shields.io/badge/Patreon-Support-orange?logo=patreon&style=flat-square)](https://www.patreon.com/your-patreon-link)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Buy%20me%20a%20coffee-29ABE0?logo=ko-fi&style=flat-square)](https://ko-fi.com/your-kofi-link)
[![PayPal](https://img.shields.io/badge/Donate-PayPal-blue?logo=paypal&style=flat-square)](https://www.paypal.com/paypalme/your-paypal-link) -->

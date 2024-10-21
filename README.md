# is-function-pure

is-function-pure is a JavaScript utility for detecting if function is pure.


## Installation
To install the package, use npm:

```
npm install is-function-pure
```


## Usage

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

### Which function is considered pure
For this you can read through the test cases:
https://github.com/senad87/is-function-pure/blob/main/tests/main-test.js
https://github.com/senad87/is-function-pure/blob/main/tests/purity-detector-test.js

## Testing
Tests are written using chai and can be run with:


```
npm run test
```


## Sponsors

Love this project? ❤️ 
Support its development by becoming a sponsor.

[![Support me on Ko-fi](https://img.shields.io/badge/Ko--fi-Buy%20Me%20a%20Coffee-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/senad87)
[![Donate via PayPal](https://img.shields.io/badge/PayPal-Donate-blue?style=for-the-badge&logo=paypal&logoColor=white)](https://www.paypal.com/paypalme/senadmehic87)
[![Support me on Patreon](https://img.shields.io/badge/Patreon-Support%20Me-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://www.patreon.com/senad87)

Any amount is greatly appreciated! 🌟


const beautify = require('js-beautify').js;

function getNumOfArgs(funcSourceCode) {
  return createFunction(funcSourceCode).length;
}

function createFunction(funcSourceCode) {
  eval('var funcName = ' + funcSourceCode);
  return funcName;
}

function addAssignment(varName) {
  let varNameCount = 0;
  return function(funcSourceCode) {
    varNameCount = varNameCount + 1;
    return createDeclaration(varName, varNameCount) + ' = ' + funcSourceCode;
  }
}

function createDeclaration(varName, count) {
  return 'let ' + varName + count;
}

function compress(func) {
  return sanitizeSpaces(func.replace(/[\r\n]/g, ''));
}

function sanitizeSpaces(str) {
  return str.replace(/  /g, " ").replace(/  /g, " ").trim();
}

function decompress(func) {
  return beautify(func, {indent_size: 2, space_in_empty_paren: true});
}

module.exports = {
  getNumOfArgs,
  createFunction,
  addAssignment,
  compress,
  decompress
};
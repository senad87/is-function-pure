var escope = require("escope");
var esprima = require("esprima");
var recast = require("recast");

var purityDetector = require("./purity-detector");


function separate(code) {
  var pure = [];
  var impure = [];

  const withoutShebang = removeShebangLine(code);

  const ast = esprima.parse(withoutShebang, {
    loc: true,
  });
  const scopes = escope.analyze(ast, { optimistic: true }).scopes;

  const functionsScopes = scopes.filter((scope) => scope.type === "function");

  for (const scope of functionsScopes) {
    const functionScope = scope;
    var funcCode = recast.print(functionScope.block).code;

    if (purityDetector.isPure(functionScope, funcCode)) {
      pure.push({
        func: funcCode,
        argsCount: purityDetector.getArgumentsCount(functionScope),
      });
    } else {
      impure.push({
        func: funcCode,
      });
    }
  }

  return {
    pure: pure,
    impure: impure,
  };
}

function removeShebangLine(fileContent) {
  return fileContent.replace(/^#!(.*\n)/, "");
}

function isPure(singleFunctionCode) {
  const functions = separate(singleFunctionCode);
  return functions.pure.length === 1;
}

module.exports = {
  separate,
  isPure
};

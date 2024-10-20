var escope = require("escope");
var esprima = require("esprima");
var estraverse = require("estraverse");
var recast = require("recast");
const builders = recast.types.builders;
const chalk = require("chalk");
// var inspect = require("eyes").inspector({ styles: { all: "magenta" } });

var purityDetector = require("./purity-detector");


async function separate(code) {
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

    } else if (purityDetector.canBePurified(functionScope, scopes)) {
      const resolvedReferences = functionScope.through.map((reference) => {
        return reference.resolved;
      });

      const resolvedReferencesWithoutDuplicates = getUnique(
        resolvedReferences,
        "name"
      );

      const outsideVars = resolvedReferencesWithoutDuplicates.map(
        (resRef) => resRef.defs[0]
      );

      const ast = recast.parse(funcCode);
      const funcAst = ast.program.body[0];

      const variableDeclarations = outsideVars.map((outsideVar) => {
        if (outsideVar.node.type === "FunctionDeclaration") {
          return builders.functionDeclaration(
            outsideVar.node.id,
            outsideVar.node.params,
            outsideVar.node.body
          );
        }

        if (outsideVar.node.type === "VariableDeclarator") {
          return builders.variableDeclaration(outsideVar.kind, [
            outsideVar.node,
          ]);
        }
      });

      funcAst.body.body = [...variableDeclarations, ...funcAst.body.body];

      ast.program.body[0] = builders.functionDeclaration(
        funcAst.id,
        funcAst.params,
        funcAst.body
      );

      const purifiedFuncCode = recast.print(ast).code;

      pure.push({
        func: purifiedFuncCode,
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

function printFunctionWithColoredReturn(funcCode) {
  return funcCode.replace(new RegExp("return", "g"), chalk.red(">>>>> return"));
}

function removeShebangLine(fileContent) {
  return fileContent.replace(/^#!(.*\n)/, "");
}

// i([{ a: 1 }, { a: 1 }], "a").o([{ a: 1 }]);
// i([{ a: 1 }, { b: 1 }], "a").o([{ a: 1 }, { b: 1 }]);
// i([{ a: 1 }, { b: 2 }, { a: 2 }], "a").o([
//   { a: 1 },
//   { b: 2 },
//   { a: 2 },
// ]);
// i([{ a: 2 }, { a: 2 }, { a: 1 }, { b: 2 }, { a: 2 }], "a").o([
//   { a: 2 },
//   { a: 1 },
//   { b: 2 },
// ]);

function getUnique(arr, propNameToBeUnique) {
  var lookup = {};
  return arr.filter(function anonymous(a) {
    if (!lookup[a[propNameToBeUnique]]) {
      lookup[a[propNameToBeUnique]] = true;
      return true;
    }
    return false;
  });
}

function traverseFunction(code, callback) {
  var ast = esprima.parse(code);
  var scopeManager = escope.analyze(ast);

  var currentScope = scopeManager.acquire(ast); // global scope

  estraverse.traverse(ast, {
    enter: function (node) {
      // do stuff
      if (/Function/.test(node.type)) {
        currentScope = scopeManager.acquire(node); // get current function scope

        if (currentScope.type === "function-expression-name") {
          callback(currentScope.childScopes[0]);
        } else {
          callback(currentScope);
        }
      }
    },
    leave: function (node, parent) {
      if (/Function/.test(node.type)) {
        currentScope = currentScope.upper; // set to parent scope
      }

      // do stuff
    },
  });
}

function getAllScopes(code, callback) {
  let ast = esprima.parse(code);
  let scopeManager = escope.analyze(ast);

  let allScopes = [];
  estraverse.traverse(ast, {
    enter: function (node) {
      if (/Function/.test(node.type)) {
        let currentScope = scopeManager.acquire(node); // get current function scope
        allScopes.push(currentScope);

        //lastScope
        console.log(currentScope.childScopes.length);
        if (currentScope.childScopes.length === 0) {
          callback(allScopes);
          return;
        }
      }
    },
  });
}

//methods for single function source
async function isPure(singleFunctionCode) {
  const functions = await separate(singleFunctionCode);
  return functions.pure.length === 1;
}

function isImpure(singleFunctionCode) {
  const functions = separate(singleFunctionCode);
  return functions.impure.length === 1;
}

module.exports = {
  separate,
  isPure,
  isImpure,
  traverseFunction,
  getAllScopes,
};

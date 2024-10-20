const recast = require("recast");
const allowedNativeRefs = require("./allowed-native-refs");
// const functionUtils = require("./common/function-utils");
var inspect = require("eyes").inspector({ styles: { all: "magenta" } });
const debug = false;
const Linter = require("eslint").Linter;
const linter = new Linter();

// For ussage in functions bellow, only temporaraly until we make tests pass
let AllFuncScopes;

function isPure(funcScope, funcCode) {
  if (hasEmptyBody(funcScope)) {
    showReason("hasEmptyBody");
    return false;
  }

  if (hasNoReturn(funcScope)) {
    showReason("invalidReturn");
    return false;
  }

  if (hasForbidenRefsToOutsideScope(funcScope)) {
    showReason("hasForbidenRefsToOutsideScope");
    return false;
  }

  if (hasThisFound(funcScope)) {
    showReason("hasThisFound");
    return false;
  }

  if (hasNoParams(funcScope)) {
    showReason("hasNoParams");
    return false;
  }

  if (isAsyncFunction(funcScope)) {
    showReason("isAsyncFunction");
    return false;
  }

  if (hasMathRandomReference(funcScope)) {
    showReason("hasMathRandomReference");
    return false;
  }

  if (hasUnusedArguments(funcCode, "test")) {
    showReason("hasUnusedArguments");
    return false;
  }

  return true;
}

function canBePurified(funcScope, allFuncScopes) {
  AllFuncScopes = allFuncScopes;
  return (
    hasEmptyBody(funcScope) === false &&
    hasNoReturn(funcScope) === false &&
    hasThisFound(funcScope) === false &&
    hasNoParams(funcScope) === false &&
    isAsyncFunction(funcScope) === false &&
    hasMathRandomReference(funcScope) === false &&
    hasRefsToOutsideScope(funcScope) === true &&
    hasOnlyPureRefsToValsInOutsideScope(funcScope) === true
  );
}

function hasEmptyBody(funcScope) {
  const body = funcScope.block.body.body;
  return body && body.length === 0;
}

function hasNoReturn(funcScope) {
  return !hasReturn(funcScope);
}

function hasReturn(funcScope) {
  const funcBodyStatements = funcScope.block.body.body;
  return (
    funcBodyStatements &&
    funcBodyStatements.some((statement) => hasReturnInside(statement))
  );
}

function hasReturnInside(statement) {
  if (statement.type === "ReturnStatement") {
    return true;
  }

  if (statement.type === "IfStatement") {
    return isReturnInIfStatement(statement);
  }

  if (statement.type === "SwitchStatement") {
    return statement.cases.some((switchCase) => {
      return switchCase.consequent.some((statement) =>
        hasReturnInside(statement)
      );
    });
  }

  if (statement.type === "TryStatement") {
    const hasReturnInTry = statement.block.body.some((statement) =>
      hasReturnInside(statement)
    );
    const hasReturnInCatch = statement.handler.body.body.some((statement) =>
      hasReturnInside(statement)
    );
    const hasReturnInFinally =
      statement.finalizer &&
      statement.finalizer.body.some((statement) => hasReturnInside(statement));

    return hasReturnInTry || hasReturnInCatch || hasReturnInFinally;
  }

  if (
    statement.type === "ForStatement" ||
    statement.type === "ForInStatement" ||
    statement.type === "ForOfStatement" ||
    statement.type === "WhileStatement" ||
    statement.type === "DoWhileStatement"
  ) {
    const loopHasCurlyBraces = statement.body.type === "BlockStatement";
    if (loopHasCurlyBraces) {
      return (
        statement.body.body &&
        statement.body.body.some((statement) => hasReturnInside(statement))
      );
    } else {
      return hasReturnInside(statement.body);
    }
  }

  return false;
}

function isReturnInIfStatement(ifStatement) {
  const isReturnInIfBody =
    ifStatement.consequent.body &&
    ifStatement.consequent.body.some((statement) => hasReturnInside(statement));

  const isReturnInIfWithNoBody =
    ifStatement.consequent.type === "ReturnStatement";

  const isReturnInIf = isReturnInIfBody || isReturnInIfWithNoBody;

  if (isReturnInIf) {
    return true;
  }

  const hasElseIf =
    ifStatement.alternate && ifStatement.alternate.type === "IfStatement";

  if (hasElseIf) {
    return isReturnInIfStatement(ifStatement.alternate);
  } else {
    const isReturnInElseBody =
      ifStatement.alternate &&
      ifStatement.alternate.body &&
      ifStatement.alternate.body.some((statement) =>
        hasReturnInside(statement)
      );

    const isReturnInElseWithNoBody =
      ifStatement.alternate && ifStatement.alternate.type === "ReturnStatement";

    const isReturnInElse = isReturnInElseBody || isReturnInElseWithNoBody;

    return isReturnInIf || isReturnInElse;
  }
}

function hasRefsToOutsideScope(funcScope) {
  return funcScope.through.length > 0;
}

function hasForbidenRefsToOutsideScope(funcScope) {
  return (
    hasRefsToOutsideScope(funcScope) && hasOneForbiddenRef(funcScope.through)
  );
}

function hasOneForbiddenRef(refs) {
  return refs.find(isRefForbidden) !== undefined;
}

function isRefForbidden(ref) {
  return !isRefAllowed(ref);
}

function isRefAllowed(ref) {
  return allowedNativeRefs.includes(ref.identifier.name);
}

function hasOnlyPureRefsToValsInOutsideScope(funcScope) {
  return hasRefsToOutsideScope(funcScope) && hasOnlyPureRefs(funcScope);
}

function hasOnlyPureRefs(funcScope) {
  return funcScope.through.every(isRefToOuterScopePure);
}

function isRefToOuterScopePure(ref) {
  if (ref.resolved === null) {
    return false;
  }

  const node = ref.resolved.defs[0].node;

  if (isRefVariableDeclaration(node) && isRefPure(node)) {
    return true;
  }

  if (
    isRefFunctionDeclaration(node) &&
    isPure(findFuncScopeByName(node.id.name))
  ) {
    return true;
  }
}

function isRefVariableDeclaration(node) {
  return node.type === "VariableDeclarator";
}

function isRefFunctionDeclaration(node) {
  return node.type === "FunctionDeclaration";
}

function isRefPure(node) {
  return (
    node.init &&
    (node.init.type === "Literal" ||
      isRefToUndefined(node) ||
      isRefToFunctionExpression(node))
  );
}

function isRefToUndefined(node) {
  return node.init.type === "Identifier" && node.init.name === "undefined";
}

function isRefToFunctionExpression(node) {
  return (
    node.init.type === "FunctionExpression" &&
    isPure(findFunctionScopeByItsBodyLocation(node.init.body.loc))
  );
}

function findFuncScopeByName(name) {
  return AllFuncScopes.find((scope) => {
    return scope.block.id && scope.block.id.name === name;
  });
}

function findFunctionScopeByItsBodyLocation(location) {
  return AllFuncScopes.find((scope) => {
    return isSameLocation(scope.block.body.loc, location);
  });
}

function isSameLocation(location1, location2) {
  if (!location1 || !location2) {
    return false;
  }
  return JSON.stringify(location1) === JSON.stringify(location2);
}

function hasThisFound(funcScope) {
  const funcCode = recast.print(funcScope.block).code;
  return funcScope.thisFound === true || /.this[.|,|;|\[|)].*/.test(funcCode);
}

function hasNoParams(funcScope) {
  return getArgumentsCount(funcScope) === 0;
}

function showReason(message) {
  if (debug) {
    console.log("Function is Not pure: ", message);
  }
}

function isAsyncFunction(funcScope) {
  return funcScope.block.async;
}

function hasMathRandomReference(funcScope) {
  const funcCode = recast.print(funcScope.block).code;
  return /.*Math.random\(.*/.test(funcCode);
}

function hasUnusedArguments(funcCode, functionVarName) {
  const messages = linter.verify(deanonymizeFunc(funcCode, functionVarName), {
    env: {
      node: true,
      es6: true,
    },
    parserOptions: {
      ecmaVersion: 8,
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: functionVarName }],
    },
  });
  const hasErrors = messages.length > 0;
  // "no-unused-vars" rule that we are using detects unused var enywhere and we want to detect only those on the first line
  // because we want to detect only unused function arguments.
  const areAllErrorsOnTheFirstLine = messages.some((m) => m.line === 1);
  return hasErrors && areAllErrorsOnTheFirstLine;
}

function deanonymizeFunc(funcCode, functionVarName) {
  return `var ${functionVarName} = ${funcCode}`;
}

function lint(funcCode, functionVarName) {
  const messages = linter.verify(funcCode, {
    env: {
      node: true,
      es6: true,
    },
    parserOptions: {
      ecmaVersion: 8,
    },
    // parser: 'esprima',
    rules: {
      //
      "no-unused-vars": ["error", { varsIgnorePattern: functionVarName }],
      // "no-labels": 2,
      // "no-constant-condition": 2, // <- OBAVEZNO OVAJ DA KORISTIS
      // "no-unmodified-loop-condition": 2,
      // "for-direction": 2,

      // "no-unused-vars": ["error", { "vars": "all", "args": "all", "ignoreRestSiblings": false }]

      // "no-constant-condition": 2
      // "no-unmodified-loop-condition": 2
      // "no-param-reassign": 2
      // "no-unused-vars": "error",
      // "no-unused-vars": ["error", { "vars": "none", "args": "all" }]
    },
  });
  return messages;
}


function getArgumentsCount(funcScope) {
  return funcScope.block.params.length;
}

module.exports = {
  isPure: isPure,
  canBePurified: canBePurified,
  hasReturn,
  getArgumentsCount
};

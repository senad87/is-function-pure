const chai = require("chai");
const expect = chai.expect;
var escope = require("escope");
var esprima = require("esprima");
const purityDetector = require("../purity-detector");

// List of known syntaxes under which return is not found:
// 1. nested block
// function(array) {
//   {
//       return array.length;
//   }
// }
// 2. switch in else without a body:
// function(a, b, c) {
//   var d = [], k = "";

//   if (0 == c.indexOf("ERROR"))
//       k = c;
//   else switch (b) { //<--------- HERE!!!!
//   case "=":
//       b = c.split("<dimStructure.structureId>");
//       d = ["<table>"];

//       for (c = 1; c < b.length; c++) d.push(
//           "<tr><td valign=top><a href=\"javascript:Jmol.search(" + a._id + ",'=" + b[c].substring(0, 4) + "')\">" + b[c].substring(0, 4) + "</a></td>"
//       ), d.push("<td>" + b[c].split("Title>")[1].split("</")[0] + "</td></tr>");

//       d.push("</table>");
//       k = b.length - 1 + " matches";
//       break;
//   case "$":
//   case ":":
//       break;
//   default:
//       return;
//   }

//   a._infoHeader = k;
//   a._info = d.join("");
//   a._showInfo(!0);
// }
//
// 3. Labels:
//
// function get(_x, _x2, _x3) {
//   var _again = true;

//   _function: // <------------ HERE !!!!
//   while (_again) {
//       var object = _x, property = _x2, receiver = _x3;
//       desc = parent = getter = undefined;
//       _again = false;
//       var desc = Object.getOwnPropertyDescriptor(object, property);

//       if (desc === undefined) {
//           var parent = Object.getPrototypeOf(object);

//           if (parent === null) {
//               return undefined;
//           } else {
//               _x = parent;
//               _x2 = property;
//               _x3 = receiver;
//               _again = true;
//               continue _function;
//           }
//       } else if ("value" in desc) {
//           return desc.value;
//       } else {
//           var getter = desc.get;

//           if (getter === undefined) {
//               return undefined;
//           }

//           return getter.call(receiver);
//       }
//   }
// }

describe("Function can be converted to PURE if it", function () {
  it("has reference to variable initialized with the literal value in any of the upper scopes", function () {
    const code = `
            const b = 2;
            function pure(a) { 
              return a + b;
            }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];

    expect(purityDetector.canBePurified(funcScope)).to.equal(true);
    expect(purityDetector.isPure(funcScope)).to.equal(false);
  });
});

describe("Function is pure if it", () => {
  it("has return statement at the top level in its body", () => {
    const code = `
    function pure(a, b) { 
      return a + b;
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];

    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement inside the 'if' statement", () => {
    const code = `
    function pure(a, b) {
      if (a) {
        return a + b;
      }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];

    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement inside 'if' without body (curly braces)", () => {
    const code = `
      function pure(test, a) {
            if (test) return a;
      }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement inside nested 'if' statements", () => {
    const code = `
    function pure(a, b) {
      if (a) {
        if (b) {
          if (b) {
            return 1;
          }
        }
      }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];

    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement inside 'else' with no body", () => {
    const code = `
    function pure(a, b) {
      if (a) {
        //whateva
      } else return b;
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];

    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement inside 'else' when both 'if' and 'else' are without body", () => {
    const code = `
    function pure(a, b) {
      if (a)
        a;
      else 
        return b;
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];

    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement inside 'elseif' statement", () => {
    const code = `
      function pure(a, b) {
        if (a) {
          //empty
        } else if(b) {
          //empty
        } else {
          return b;
        }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];

    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement inside nested else", () => {
    const code = `
    function pure(a, b) {
      if (a) {
        if (a) {

        } else {
          
        }
      } else {
        if (a) {

        } else {
          if (a) {

          } else {
            return 1;
          }
        }

      }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];

    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement inside switch statement", () => {
    const code = `
    function pure(a, b) {
      switch (a) {
        case 1:
          return b;
      }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement inside default switch case", () => {
    const code = `
    function pure(a, b) {
      switch (a) {
        case 1:
          //anything
        break;
        default:
          return b;
      }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement nested switch case", () => {
    const code = `
    function pure(a, b) {
      switch (a) {
        case 1:
          switch (a) {
            case 1:
              return 1;
          }
      }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return statement in case after deeply nested switches that do not have return", () => {
    const code = `
    function pure(a, b) {
      switch (a) {
        case 1:
          switch (a) {
            case 1:
              switch (a) {
                case 1:
                  switch (a) {
                    case 1:
                      //nothing   
                  }  
              }  
          }
        case 2:
          return b;
      }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in try clause", () => {
    const code = `
    function pure(a, b) {
        try {
          return a + b;
        } catch(e) {
          //nothing
        }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in nested try clause", () => {
    const code = `
    function pure(a, b) {
        try {
          try {
            try {
              return a + b;
            } catch(e) {
              //nothing
            }
          } catch(e) {
            //nothing
          }
        } catch(e) {
          //nothing
        }
      
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in catch clause", () => {
    const code = `
    function pure(a, b) {
        try {
          throw new Error(b);
        } catch(e) {
          return a;
        }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in finally clause", () => {
    const code = `
    function pure(a, b) {
        try {
          a+b;
        } catch(e) {
          //not important
        } finally {
          return b;
        }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in for loop", () => {
    const code = `
    function pure(array) {
        for (var i=0; i < array.length; i++) {
          return i;
        }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in for...in loop without body (curly brances)", () => {
    const code = `
    function schemaHasRules(schema, rules) {
      for (var key in schema) if (rules[key])
          return true;
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in for...in loop", () => {
    const code = `
      function pure(prop) {
        const object = { a: 1, b: 2, c: 3 };
      
        for (const property in object) {
          return object[prop];
        }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in for...of loop", () => {
    const code = `
    function pure(prop) {
      const object = { a: 1, b: 2, c: 3 };

      for (let property of object) {
        return object[prop];
      }
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in while loop", () => {
    const code = `
      function pure(array) {
        while(array.length > 0) {
          return 1;
        }
      }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("has return in do...while loop", () => {
    const code = `
      function pure(a) { 
        do {
          return a;
        } while (a < 5);
      }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });

  it("real world example that failed", () => {
    const code = `
    function s(body) {
      var json = JSON.parse(body);
      var id = json.Id;
      var errorMessage = json.errorMessage;
      var message = json.message;
  
      if (id) {
          return id;
      } else if (errorMessage || message) {
          throw new Error(errorMessage || message);
      }
  }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope)).to.equal(true);
  });
});

describe("Function is not pure", () => {
  // this is probably a check that should be moved to someting called like usefulnes-detector,
  // since this function is pure technically but its signature is making it usless to be searched.
  it("has unused argument", () => {
    const code = `function pure(a, b, c) {
        return a + b;
    }`;

    const ast = esprima.parse(code);
    const scopes = escope.analyze(ast, { optimistic: true }).scopes;
    const funcScope = scopes[1];
    expect(purityDetector.isPure(funcScope, code)).to.equal(false);
  });
});




describe("Get number of arguments", () => {



  it("should return number of arguments", () => {
    const code = `function noArgsFunction(a, b) {
      return a + b;
  }`;

  const ast = esprima.parse(code);
  const scopes = escope.analyze(ast, { optimistic: true }).scopes;
  const funcScope = scopes[1];
  expect(purityDetector.getArgumentsCount(funcScope)).to.equal(2);
  });


  it("should return zero if no arguments", () => {
    const code = `function noArgsFunction() {
      return a + b;
  }`;

  const ast = esprima.parse(code);
  const scopes = escope.analyze(ast, { optimistic: true }).scopes;
  const funcScope = scopes[1];
  expect(purityDetector.getArgumentsCount(funcScope)).to.equal(0);
  });
})

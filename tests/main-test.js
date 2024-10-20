const chai = require("chai");
const expect = chai.expect;
const stringHelper = require("./helpers/string-helper");
const main = require("../main.js");

describe("Returns two arrays, one with pure and other with impure functions", () => {
  it("should return two empty arrays if empty string is given as code",  async () => {
    const functions = await main.separate("");
    expect(functions.pure.length).to.equal(0);
    expect(functions.impure.length).to.equal(0);
  });

  it("should extract pure function from a file that starts with shebang '#!/usr/bin/env' node", async () => {
    const fileContent = 
    `#!/usr/local/bin/node
      function pure(a, b) { 
        return a + b;
      }`;
    const functions = await main.separate(fileContent);
    expect(functions.pure.length, "Function can't be purified").to.equal(1);
  })

  describe("Function is PURE if it", function () {
    describe("has literal reference to outside scope and can be purified by moving these variable declarations inside the function scope", () => {
      it("single const number reference", async () => {
        const testScope = `
          const b = 2;
          function pure(a) { 
            return a + b;
          }`;

        const functions = await main.separate(testScope);

        expect(functions.pure.length, "Function can't be purified").to.equal(1);

        stringHelper.expectToBeEqualWithoutSpaces(
          functions.pure[0].func,
          `
            function pure(a) {
              const b = 2;
              return a + b;
            }
          `);
      });

      it("const, var and let number references", async () => {
        const testScope = `
          const b = 2;
          var c = 3;
          let d = 3;
          function pure(a) { 
            return a + b + c + d;
        }`;

        const functions = await main.separate(testScope);

        expect(functions.pure.length, "Function can't be purified").to.equal(1);

        stringHelper.expectToBeEqualWithoutSpaces(
          functions.pure[0].func,
          `function pure(a) {
            const b = 2;
            var c = 3;
            let d = 3;
            return a + b + c + d;
          }`
        );
      });

      it("string reference", async () => {
        const testScope = `
          var b = "bees-string";
          function pure(a) { 
            return a + b;
        }`;

        const functions = await main.separate(testScope);

        expect(functions.pure.length, "Function can't be purified").to.equal(1);

        stringHelper.expectToBeEqualWithoutSpaces(
          functions.pure[0].func,
          `function pure(a) {
              var b = "bees-string";
              return a + b;
          }`
        );
      });

      it("null reference", async () => {
        const testScope = `
          var b = null;
          function pure(a) { 
            return a + b;
        }`;

        const functions = await main.separate(testScope);

        expect(functions.pure.length, "Function can't be purified").to.equal(1);

        stringHelper.expectToBeEqualWithoutSpaces(
          functions.pure[0].func,
          `function pure(a) {
              var b = null;
              return a + b;
          }`
        );
      });

      it("undefined reference", async () => {
        const testScope = `
          var b = undefined;
          function pure(a) { 
            return a + b;
        }`;

        const functions = await main.separate(testScope);

        expect(functions.pure.length, "Function can't be purified").to.equal(1);

        stringHelper.expectToBeEqualWithoutSpaces(
          functions.pure[0].func,
          `function pure(a) {
              var b = undefined;
              return a + b;
          }`
        );
      }); 

      it("pure function reference (FunctionDeclaration)", async () => {
        const testScope = `
          function multiply(x) { return x*x; }
          function pure(a, b) { 
            return a + multiply(b);
          }`;

        const functions = await main.separate(testScope);

        expect(functions.pure.length, "Function can't be purified").to.equal(2); //both are pure

        stringHelper.expectToBeEqualWithoutSpaces(
          functions.pure[1].func,
          `function pure(a, b) { 
            function multiply(x) { return x*x; }
            return a + multiply(b);
          }`
        );
      });

      it("pure function reference (FunctionDeclaration)", async () => {
        const testScope = `
          function multiply(x) { return x*x; }
          function pure(a, b) { 
            return a + multiply(b);
          }`;

        const functions = await main.separate(testScope);

        expect(functions.pure.length, "Function can't be purified").to.equal(2); //both are pure

        stringHelper.expectToBeEqualWithoutSpaces(
          functions.pure[1].func,
          `function pure(a, b) { 
            function multiply(x) { return x*x; }
            return a + multiply(b);
          }`
        );
      });

      it("pure function reference (VariableDeclaration)", async () => {
        const testScope = `
          var multiply = function(x) { return x*x; }
          function pure(a, b) { 
            return a + multiply(b);
          }`;

        const functions = await main.separate(testScope);
        expect(functions.pure.length, "Function can't be purified").to.equal(2); //both are pure

        stringHelper.expectToBeEqualWithoutSpaces(
          functions.pure[1].func,
          `function pure(a, b) { 
            var multiply = function(x) { return x*x; };
            return a + multiply(b);
          }`
        );
      });

      it("having multiple references to same variable (var x) should result in single variable declaration created inside function scope ", async () => {
        const testScope = `
          var x = "true";
          function pure(a) { 
            if (x === "true") {
              return x;
            }
            return a;
        }`;

        const functions = await main.separate(testScope);

        expect(functions.pure.length, "Function can't be purified").to.equal(1);

        stringHelper.expectToBeEqualWithoutSpaces(
          functions.pure[0].func,
          `function pure(a) { 
            var x = "true";
            if (x === "true") {
              return x;
            }
            return a;
        }`
        );
      });


    });

    it("is absolutely pure", async function () {
      const testScope = "function pure(x) { return x*x;}";

      expect(await main.isPure(testScope)).to.equal(true);
    });

    it("has immutable native references", async () => {
      const testScope = "function pure(x) { return Math.abs(x);}";

      expect(await main.isPure(testScope)).to.equal(true);
    });

    it('has "this" found inside comment ', async () => {
      const testScope = `function pure(x) {
          // this function does nothing
          return x;
      }`;

      expect(await main.isPure(testScope)).to.equal(true);
    });

    it('has "this" found inside variable name ', async () => {
      const testScope = `function pure(x) {
          var thisVar;
          return thisVar + x;
      }`;

      expect(await main.isPure(testScope)).to.equal(true);
    });

    it('has "this" found in function name ', async () => {
      const testScope = `function thisIsFunction(x) {
          return x;
      }`;

      expect(await main.isPure(testScope)).to.equal(true);
    });
  });

  describe("Given function is NOT PURE if", () => {

    it("is without a body", async () => {
      const testScope = "function noBody() { }";

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it("does not return", async () => {
      const testScope = "function noReturn() { var nope; }";

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it("has references to outside scope that is not initialized(undfined)", async () => {
      const outside = "var outsideVar;";
      const func = "function notPure() { return outsideVar; }";
      const testScope = outside + func;

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it("has Date() reference", async () => {
      const testScope = "function notPure() { Date(); }";

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it("has NO arguments", async () => {
      const testScope = 'function noArgs() { return "I have no args"; }';

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it('has "this" keyword inside', async () => {
      const testScope = "function iWasInClass(x) { return this.someProp; }";
      expect(await main.isPure(testScope)).to.equal(false);
    });

    it('has "this" keyword inside a function that is defined as object property', async () => {
      const testScope = `var s = {
        value: function someFunc(client) {
                           return this;
                }
        }`;

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it('has "this" keyword inside a nested function followed by semicolon', async () => {
      const testScope = `function something(a) {
          function withThis() { return this;}
          return a;
      }`;

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it('has "this" keyword inside a nested function followed by dot', async () => {
      const testScope = `function something(a) {
          function withThis() { return this.someProp;}
          return a;
      }`;

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it('has "this" keyword inside a nested function followed by square bracket', async () => {
      const testScope = `function something(a) {
          function withThis() { return this[1];}
          return a;
      }`;

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it('has "this" keyword inside a nested function followed by comma', async () => {
      const testScope = `function something(a) {
          function withThis() { return [this, 's'];}
          return a;
      }`;

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it('has "this" keyword inside a nested function followed by parentheses', async () => {
      const testScope = `function something(a) {
          function withThis() { return withThis(this);}
          return a;
      }`;

      expect(await main.isPure(testScope)).to.equal(false);
    });

    //TODO: List here all the posible contexts in wich function could be find. write test for all

    it("is async function", async () => {
      const testScope = `async function f(x) {
                            return x;
                         }`;

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it("has Promise reference insides", async () => {
      const testScope = `function f(x) {
                            var p = new Promise();
                            return x;
                         }`;

      expect(await main.isPure(testScope)).to.equal(false);
    });

    it("has Math.random reference", async () => {
      const testScope = `function f(x) {
                            return Math.random();
                         }`;

      expect(await main.isPure(testScope)).to.equal(false);
    });


    it("has NOT pure function reference", async () => {
      const testScope = `
        function multiply(x) { return Operations.multi(x); }
        function pure(a, b) { 
          return a + multiply(b);
        }`;

      const functions = await main.separate(testScope);

      expect(functions.pure.length, "Function can't be purified").to.equal(0);

    });
  });
});

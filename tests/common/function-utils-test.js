const chai = require('chai');
const expect = chai.expect;
const funcUtils = require('../../common/function-utils');



describe('Func utils', () => {

  describe('getNumOfArgs', () => {

    it('should return zero for function string with no arguments', () => {
      expect(funcUtils.getNumOfArgs('function s() {}')).to.equal(0);
    });

    it('should return two when given function with two args', () => {
      expect(funcUtils.getNumOfArgs('function s(a,b) {}')).to.equal(2);
    });

    it('should work for unnamed functions', () => {
      expect(funcUtils.getNumOfArgs('function(a,b) {}')).to.equal(2);
    });

  });

  describe('createFunction', () => {

    it('should return function value given function string', () => {

        const funcString = 'function some() {}';
        const result = funcUtils.createFunction(funcString);

        expect(funcString).to.equal(result.toString());
    });

  });

});
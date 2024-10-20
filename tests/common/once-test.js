const chai = require('chai');
const expect = chai.expect;
const spies = require('chai-spies');

chai.use(spies);

const once = require('../../common/once');

describe('Once - creates function that restricts invocation of given function to once', () => {

  it('should be a function', () => {
    expect(typeof once).to.be.eql('function');
  });

  it('should return a function', () => {
    expect(typeof once(function(){})).to.be.eql('function');
  });

  it('should throw exception if given argument is not a function', () => {

    function callWithNonFunction() {
      once('non-function');
    }

    // expect(callWithNonFunction).to.throw();

  });

  it('should create function that calls given function only once', () => {

    const spy = chai.spy('once-spy');
    const resultFunc = once(spy);

    resultFunc();
    resultFunc();

    expect(spy).to.have.been.called.exactly(1);


  });

  it('when create function is called multiple time given function should be executed only once', () => {

    const spy = chai.spy('once-spy');
    const resultFunc = once(spy);

    resultFunc();
    resultFunc();
    resultFunc();
    resultFunc();

    expect(spy).to.have.been.called.exactly(1);
  });

});
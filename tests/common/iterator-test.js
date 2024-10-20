const chai = require('chai');
const expect = chai.expect;
const Iterator = require('../../common/iterator');
const spies = require('chai-spies');

chai.use(spies);


describe('Iterator', () => {

  describe('iterate', () => {

    it('should call iterate over elements one by one calling next() to go to next element', () => {

      const iterator = Iterator();

      function original (el, next) {
        next();
      }

      const stepSpy = chai.spy(original);
      const endSpy = chai.spy();

      iterator.iterate([1,2,3], stepSpy, endSpy);

      expect(stepSpy).on.nth(1).called.with(1);
      expect(stepSpy).on.nth(2).called.with(2);
      expect(stepSpy).on.nth(3).called.with(3);
      expect(stepSpy).to.have.been.called.exactly(3);
      expect(endSpy).to.have.been.called.once;
    });
    
  });

  it('should call end when reaching the end', () => {

    const iterator = Iterator();

    function original (el, next) {
      next();
    }

    const stepSpy = chai.spy(original);
    const endSpy = chai.spy();

    iterator.iterate([1], stepSpy, endSpy);

    expect(stepSpy).on.nth(1).called.with(1);
    expect(stepSpy).to.have.been.called.exactly(1);
    expect(endSpy).to.have.been.called.once;

  });

  it('should do nothing if next() is called after end of array is reached', () => {

    const iterator = Iterator();

    const eachElSpy = chai.spy('eachElSpy');
    const endSpy = chai.spy('endSpy');

    iterator.iterate([1,2], (el, next) => {
      eachElSpy();

        next();
        next();

    }, endSpy);

    expect(eachElSpy).to.have.been.called.exactly(2);

  })


});
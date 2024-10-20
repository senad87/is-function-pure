var chai = require('chai');
var expect = chai.expect;

function expectToBeEqualWithoutSpaces(actual, expected) {
    expect(clearSpaces(actual), "Functions do not match!").to.equal(clearSpaces(expected));
}

function clearSpaces(str) {
    return str.replace(/\s/g, '');
}

function clearSpacesFromElements(array) {
    return array.map(clearSpaces);
}

module.exports = {
    expectToBeEqualWithoutSpaces: expectToBeEqualWithoutSpaces,
    clearSpacesFromElements
};

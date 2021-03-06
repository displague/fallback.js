/*global describe, expect, fallback, it*/

describe('tests.unit.core.isDefined', function() {
	it('should be a Function', function() {
		var test = fallback.isDefined;
		expect(test).to.be.a('function');
	});

	it('to always return a Boolean', function() {
		var test = fallback.isDefined();
		expect(typeof test).to.equal('boolean');
	});

	it('undefined should return false', function() {
		expect(fallback.isDefined(undefined)).to.equal(false);
	});

	it('null should return true', function() {
		expect(fallback.isDefined(null)).to.equal(true);
	});

	it('1 should return true', function() {
		expect(fallback.isDefined(1)).to.equal(true);
	});

	it('variable should return true', function() {
		window.isDefinedTestDefined = 1;
		expect(fallback.isDefined(window.isDefinedTestDefined)).to.equal(true);
		window.isDefinedTest = undefined;
	});

	it('variable should return false', function() {
		expect(fallback.isDefined(window.isDefinedTestUndefined)).to.equal(false);
	});
});

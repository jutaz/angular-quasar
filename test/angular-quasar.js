var expect = chai.expect;

(function () {
	'use strict';

	describe('Quasar', function () {
		beforeEach(module('jutaz.quasar'));
		var q, rootScope, httpResponseMock;

		beforeEach(inject(function ($q, $rootScope) {
			q = $q;
			rootScope = $rootScope;

			httpResponseMock = {
				data: 'a',
				status: 200,
				headers: function () {},
				config: {},
				statusText: 'OK'
			};
		}));

		describe('#all()', function () {
			it('should be a function', function() {
				expect(q.all).to.be.a('function');
			});
			it('should resolve Array of promises', function(done) {
				var defer = q.defer();
				q.all([defer.promise, defer.promise, defer.promise]).then(function (resolved) {
					resolved.forEach(function (p) {
						expect(p).to.be.equal('Unicorn1337');
					});
					done();
				});
				defer.resolve('Unicorn1337');
				rootScope.$digest();
			});
			it('should pass through non-promise elements', function(done) {
				q.all(['1337', 'unicorn', 1]).then(function (resolved) {
					expect(resolved.length).to.be.equal(3);
					done();
				});
				rootScope.$digest();
			});
			it('should return extended promise', function() {
				var p = q.all([]);
				expect(p.extended).to.be.equal(true);
			});
		});

		describe('#fcall()', function() {
			it('should be a function', function() {
				expect(q.fcall).to.be.a('function');
			});
			it('should return extended promise', function() {
				var p = q.fcall(function () {});
				expect(p.extended).to.be.equal(true);
			});
		});

		describe('#when()', function() {
			it('should be a function', function() {
				expect(q.when).to.be.a('function');
			});
			it('should return extended promise', function() {
				var p = q.when(true);
				expect(p.extended).to.be.equal(true);
			});
		});

		describe('#reject()', function() {
			it('should be a function', function() {
				expect(q.reject).to.be.a('function');
			});
		});

		describe('#defer()', function() {
			it('should be a function', function() {
				expect(q.when).to.be.a('function');
			});
			it('should return extended promise', function() {
				var defer = q.defer();
				expect(defer.promise.extended).to.be.equal(true);
			});
		});

		describe('#promise', function() {
			var defer, promise;
			beforeEach(function () {
				defer = q.defer();
				promise = defer.promise;
			});

			it('should be an object', function() {
				expect(promise).to.be.an('object');
			});

			describe('#extended', function() {
				it('should be set to `true`', function() {
					expect(promise.extended).to.equal(true);
				});
			});

			describe('#_then()', function() {
				it('should be a function', function() {
					expect(promise._then).to.be.a('function');
				});
			});

			describe('#then()', function() {
				it('should be a function', function() {
					expect(promise.then).to.be.a('function');
				});

				it('should return a promise', function() {
					var p = promise.then(function () {});
					expect(p).to.be.an('object');
				});

				it('should bind a function to given scope', function(done) {
					promise.then(function () {
						expect(this.unicorn).to.be.equal(1337);
						done();
					}, {unicorn: 1337});
					defer.resolve();
					rootScope.$digest();
				});
			});

			describe('#success()', function() {
				it('should be a function', function() {
					expect(promise.success).to.be.a('function');
				});

				it('should call passed function with 4 params if data is http resonse', function(done) {
					q.fcall(function () {
						return httpResponseMock;
					}).success(function () {
						expect(arguments.length).to.be.equal(4);
						done();
					});
					rootScope.$digest();
				});

				it('should be called with 1 param if data is not http response', function(done) {
					q.fcall(function () {
						return {};
					}).success(function () {
						expect(arguments.length).to.be.equal(1);
						done();
					});
					rootScope.$digest();
				});
			});

			describe('#error()', function() {
				it('should be a function', function() {
					expect(promise.error).to.be.a('function');
				});

				it('should call passed function with 4 params if data is http resonse', function(done) {
					q.fcall(function () {
						return q.reject(httpResponseMock);
					}).error(function () {
						expect(arguments.length).to.be.equal(4);
						done();
					});
					rootScope.$digest();
				});

				it('should be called with 1 param if data is not http response', function(done) {
					q.fcall(function () {
						return q.reject({});
					}).error(function () {
						expect(arguments.length).to.be.equal(1);
						done();
					});
					rootScope.$digest();
				});
			});

			describe('#spread()', function() {
				it('should be a function', function() {
					expect(promise.spread).to.be.a('function');
				});

				it('should spread array as arguments', function(done) {
					promise.spread(function (a, b, c) {
						expect(a).to.be.equal('a');
						expect(b).to.be.equal('b');
						expect(c).to.be.equal('c');
						done();
					});
					defer.resolve(['a', 'b', 'c']);
					rootScope.$digest();
				});

				it('should resolve and spread passed promises', function(done) {
					var d = q.defer();
					promise.spread(function (a, b, c) {
						expect(a).to.be.equal('a');
						expect(b).to.be.equal('b');
						expect(c).to.be.equal('c');
						done();
					});
					defer.resolve(['a', d.promise, 'c']);
					d.resolve('b');
					rootScope.$digest();
				});
			});

			describe('#delay()', function() {
				var timerCallback;
				beforeEach(function () {
					timerCallback = jasmine.createSpy("timerCallback");
					jasmine.clock().install();
				});

				afterEach(function() {
					jasmine.clock().uninstall();
				});

				it('should be a function', function() {
					expect(promise.delay).to.be.a('function');
					expect(promise.timeout).to.be.a('function');
				});

				it('should delay execution of passed function', function() {
					promise.delay(function () {
						timerCallback();
					}, 50);
					defer.resolve();
					rootScope.$digest();
					expect(timerCallback.calls.count()).to.be.equal(0);

					jasmine.clock().tick(51);
					rootScope.$digest();
					expect(timerCallback.calls.count()).to.be.equal(1);
				});
			});

			describe('#all()', function() {
				it('should be a function', function() {
					expect(promise.all).to.be.a('function');
				});

				it('should resolve passed promises', function() {
					var d = q.defer();
					promise.all(function (resolved) {
						expect(resolved.length).to.be.equal(2);
						expect(resolved[0]).to.be.equal('Magic!');
						expect(resolved[1]).to.be.equal(1337);
					});
					d.resolve('Magic!');
					defer.resolve([d.promise, 1337]);
					rootScope.$digest();
				});
			});

		});

	});
}).call(this);

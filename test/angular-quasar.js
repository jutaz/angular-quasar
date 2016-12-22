var expect = chai.expect;

(function () {
	'use strict';

	describe('Quasar', function () {
		beforeEach(module('jutaz.quasar'));
		var q,
			rootScope,
			httpResponseMock,
			MyCustomError,
			MyAnotherCustomError;

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

			MyCustomError = function () {}
			MyCustomError.prototype = Object.create(Error.prototype);
			MyAnotherCustomError = function () {}
			MyAnotherCustomError.prototype = Object.create(Error.prototype);
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
				expect(q.defer).to.be.a('function');
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

				it('should bind all argument functions to `#_context`, if present.', function() {
					var ctx = {
						a: 'b'
					};
					promise.bind(ctx).then(function () {
						expect(this.a).to.be.equal(ctx.a);
					}, function () {
						expect(this.a).to.be.equal(ctx.a);
					}, function () {
						expect(this.a).to.be.equal(ctx.a);
					}).then(function () {
						expect(this.a).to.be.equal(ctx.a);
					}, function () {
						expect(this.a).to.be.equal(ctx.a);
					}, function () {
						expect(this.a).to.be.equal(ctx.a);
					});
					defer.resolve();
					rootScope.$digest();
				});
			});

			describe('#finally()', function() {
				it('should be a function', function() {
					expect(promise.finally).to.be.a('function');
				});

				it('should return a promise', function() {
					var p = promise.finally(function () {});
					expect(p).to.be.an('object');
				});

				it('should bind `#_context`, if present.', function() {
					var ctx = {
						a: 'b'
					};
					promise.bind(ctx).finally(function () {
						expect(this.a).to.be.equal(ctx.a);
					});
					defer.resolve();
					rootScope.$digest();
				});
			});

			describe('#catch()', function() {
				it('should be a function', function() {
					expect(promise.catch).to.be.a('function');
				});

				it('should call `#then()` with function as 2nd argument', function() {
					var fn = function () {};
					spyOn(promise, 'then');
					promise.catch(fn);
					expect(promise.then.calls.count()).to.be.equal(1);
					expect(promise.then.calls.first().args).to.be.eql([null, fn]);
					rootScope.$digest();
				});

				it('should catch a filtered exception', function () {
					var fn = jasmine.createSpy('catch'),
							err = new MyCustomError();
					q.reject(err)
						.catch(MyCustomError, fn)
						.then(function () {
							expect(fn.calls.count()).to.be.equal(1);
							expect(fn.calls.first().args).to.be.eql([err]);
						});
					rootScope.$digest();
				});

				it('should bypass unmatched exceptions', function () {
					var fn = jasmine.createSpy('catch'),
							fn2 = jasmine.createSpy('catch2'),
							err = new MyCustomError();

					q.reject(err)
						.catch(MyAnotherCustomError, fn)
						.catch(MyCustomError, fn2)
						.then(function () {
							expect(fn.calls.count()).to.be.equal(0);
							expect(fn2.calls.count()).to.be.equal(1);
							expect(fn2.calls.first().args).to.be.eql([err]);
						});
					rootScope.$digest();
				});

				it('should allow multiple filtered exceptions', function () {
					var fn = jasmine.createSpy('catch'),
							err = new MyCustomError();
					q.reject(err)
						.catch(MyAnotherCustomError, MyCustomError, fn)
						.then(function () {
							expect(fn.calls.count()).to.be.equal(1);
							expect(fn.calls.first().args).to.be.eql([err]);
						});
					rootScope.$digest();
				});

				it('should not further reject filtered exception', function () {
					var fn = jasmine.createSpy('catch'),
							err = new MyCustomError();
					q.reject(err)
						.catch(MyCustomError, angular.noop)
						.catch(fn)
						.then(function () {
							expect(fn.calls.count()).to.be.equal(0);
						});
					rootScope.$digest();
				});
			});

			describe('#bind()', function() {
				it('should be a function', function() {
					expect(promise.bind).to.be.a('function');
				});

				it('should set `#_context` with given context', function() {
					promise.bind({
						a: 'b'
					});
					expect(promise._context).to.be.eql({
						a: 'b'
					});
					rootScope.$digest();
				});
			});

			describe('#unbind()', function() {
				it('should be a function', function() {
					expect(promise.unbind).to.be.a('function');
				});

				it('should set `#_context` to `null`.', function() {
					promise._context = {};
					promise.unbind();
					expect(promise._context).to.be.eql(null);
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

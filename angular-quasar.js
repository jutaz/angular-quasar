(function() {
	'use strict';

	var unpackHttpRes = function(fn, value) {
		if (angular.isObject(value) && value.data && value.status && value.headers && value.config && value.statusText && angular.isFunction(value.headers)) {
			return fn(value.data, value.status, value.headers, value.config);
		} else {
			return fn(value);
		}
	};

	angular.module('jutaz.quasar', []).config(['$provide', function ($provide) {
		$provide.decorator('$q', ['$delegate', function ($delegate) {
			var q = {
				when: $delegate.when,
				reject: $delegate.reject,
				all: $delegate.all,
				defer: $delegate.defer
			};

			function decoratePromise(promise) {
				promise._then = promise.then;
				promise.then = function(thenFn, errFn, notifyFn) {
					if (angular.isObject(errFn)) {
						thenFn = thenFn.bind(errFn);
					}
					var p = promise._then(thenFn, errFn, notifyFn);
					return decoratePromise(p);
				};
				promise.success = function (fn) {
					return promise.then(unpackHttpRes.bind(undefined, fn));
				};
				promise.error = function (fn) {
					return promise.then(null, unpackHttpRes.bind(undefined, fn));
				};
				promise.spread = function (fn) {
					return promise.then(function (data) {
						if (!angular.isArray(data)) {
							return fn(data);
						} else {
							var resolved = q.all(data); // Resolve promises, if any
							return fn.apply(undefined, resolved);
						}
					});
				};
				promise.delay = promise.timeout = function (fn, time) {
					// In case people have other preference
					if (angular.isNumber(fn) && angular.isFunction(time)) {
						var tmp = fn;
						fn = time;
						time = tmp;
					}
					var deferred = q.defer();
					setTimeout(function () {
						promise.then(fn).then(deferred.resolve);
					}, time);
					return decoratePromise(deferred.promise);
				};
				promise.all = function (fn) {
					var p = promise.then(function (data) {
						if (angular.isArray(data)) {
							return q.all(data);
						} else {
							return data;
						}
					}).then(fn);
					return p;
				};
				return promise;
			}

			$delegate.fcall = function (fn) {
				return $delegate.when().then(fn);
			};

			$delegate.defer = function() {
				var deferred = q.defer();
				decoratePromise(deferred.promise);
				return deferred;
			};

			['all', 'reject', 'when'].forEach(function (fn) {
				$delegate[fn] = function () {
					return decoratePromise(q[fn].apply(this, arguments));
				};
			});
			return $delegate;
		}]);
	}]);

})();

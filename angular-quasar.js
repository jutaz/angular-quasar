function unpackHttpRes(fn, value) {
	if (angular.isObject(value) && value.data && value.status && value.headers && value.config && value.statusText && angular.isFunction(value.headers)) {
		fn(value.data, value.status, value.headers, value.config);
	} else {
		fn(value);
	}
}

angular.module('jutaz.quasar', []).config(['$provide', function ($provide) {
	$provide.decorator('$q', function ($delegate) {
		var q = {
			when: $delegate.when,
			reject: $delegate.reject,
			all: $delegate.all,
			defer: $delegate.defer
		};

		function decoratePromise(promise) {
			promise._then = promise.then;
			promise.then = function(thenFn, errFn, notifyFn) {
				var p = promise._then(thenFn, errFn, notifyFn);
				return decoratePromise(p);
			};
			promise.success = function (fn) {
				promise.then(unpackHttpRes.bind(undefined, fn));
				return promise;
			};
			promise.error = function (fn) {
				promise.then(null, unpackHttpRes.bind(undefined, fn));
				return promise;
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
				promise.then(q.all).then(fn);
				return decoratePromise(promise);
			};
			return promise;
		}

		$delegate.fcall = function (fn) {
			return $delegate.when(true).then(fn);
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
	});
}]);

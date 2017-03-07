(function () {
  'use strict';

  var unpackHttpRes = function (fn, value) {
    if (
        angular.isObject(value) &&
        value.data &&
        value.status &&
        value.headers &&
        value.config &&
        value.statusText &&
        angular.isFunction(value.headers)
      ) {
      return fn(value.data, value.status, value.headers, value.config);
    }
    return fn(value);
  };

  angular.module('jutaz.quasar', []).config(['$provide', function ($provide) {
    $provide.decorator('$q', ['$delegate', function ($delegate) {
      var q = {},
          originalDelegate = angular.copy($delegate);

      $delegate = function (cb) {
        return decoratePromise(originalDelegate(cb));
      };

      angular.forEach(originalDelegate, function (value, key) {
        q[key] = originalDelegate[key];
      });

      function decoratePromise(promise, originalPromise) {
        promise._then = promise.then;
        promise._finally = promise.finally;
        promise.extended = true; // Good to have for tests
        promise._context = originalPromise ? originalPromise._context : null;

        promise.bind = function (context) {
          if (angular.isObject(context)) {
            promise._context = context;
          }

          return this;
        };

        promise.unbind = function () {
          promise._context = null;
          return this;
        };

        promise.finally = function (fn) {
          if (angular.isFunction(fn)) {
            fn = fn.bind(promise._context);
          }

          return this._finally(fn);
        };

        promise.catch = function (errFn) {
          var catchArguments = arguments;
          if (catchArguments.length === 1) {
            return promise.then(null, errFn);
          }
          return promise.then(null, function (e) {
            for (var i = 0; i < catchArguments.length; i++) {
              if (i === catchArguments.length - 1) {
                return q.reject(e);
              }
              if (e instanceof catchArguments[i]) {
                return catchArguments[catchArguments.length - 1].call(promise._context, e);
              }
            }
          });
        };

        promise.then = function (thenFn, errFn, notifyFn) {
          if (angular.isFunction(thenFn)) {
            thenFn = thenFn.bind(promise._context);
          }

          if (angular.isFunction(errFn)) {
            errFn = errFn.bind(promise._context);
          }

          if (angular.isFunction(notifyFn)) {
            notifyFn = notifyFn.bind(promise._context);
          }

          var p = promise._then(thenFn, errFn, notifyFn);
          return decoratePromise(p, promise);
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
              return fn.call(promise._context, data);
            } else {
              return q.all(data).then(function (resolved) {
                return fn.apply(promise._context, resolved);
              }); // Resolve promises, if any
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

          return decoratePromise(deferred.promise, promise);
        };

        promise.all = function (fn) {
          var p = promise.then(function (data) {
            if (angular.isArray(data) || angular.isObject(data)) {
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

      $delegate.defer = function () {
        var deferred = q.defer();
        decoratePromise(deferred.promise);
        return deferred;
      };

      angular.forEach(originalDelegate, function (value, key) {
        if (!angular.isFunction(q[key]) || key === 'defer') {
          return;
        }
        $delegate[key] = function () {
          return decoratePromise(q[key].apply(this, arguments));
        };
      });

      return $delegate;
    },
  ]);
  },
]);
})();

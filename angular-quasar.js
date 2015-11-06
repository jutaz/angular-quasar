(function() {
  'use strict';

  var unpackHttpRes = function(fn, value) {
    if (angular.isObject(value) && value.data && value.status && value.headers && value.config && value.statusText && angular.isFunction(value.headers)) {
      return fn(value.data, value.status, value.headers, value.config);
    } else {
      return fn(value);
    }
  };

  angular.module('jutaz.quasar', []).config(['$provide', function($provide) {
    $provide.decorator('$q', ['$delegate', function($delegate) {
      var q = {
        when: $delegate.when,
        reject: $delegate.reject,
        all: $delegate.all,
        defer: $delegate.defer,
      };

      function decoratePromise(promise) {
        promise._then = promise.then;
        promise.extended = true; // Good to have for tests
        promise._context = null;

        promise.bind = function(context) {
          if (angular.isObject(context)) {
            promise._context = context;
          }

          return this;
        };

        promise.unbind = function() {
          promise._context = null;
          return this;
        };

        promise.catch = function(errFn, bind) {
          if (angular.isObject(bind)) {
            errFn = errFn.bind(bind);
          }

          return this.then(null, errFn);
        };

        promise.then = function(thenFn, errFn, notifyFn) {
          if (promise._context) {
            if (angular.isFunction(thenFn)) {
              thenFn = thenFn.bind(promise._context);
            }

            if (angular.isFunction(errFn)) {
              errFn = errFn.bind(promise._context);
            }

            if (angular.isFunction(notifyFn)) {
              notifyFn = notifyFn.bind(promise._context);
            }
          } else if (angular.isObject(errFn)) {
            thenFn = thenFn.bind(errFn);
          }

          var p = promise._then(thenFn, errFn, notifyFn);
          return decoratePromise(p);
        };

        promise.success = function(fn) {
          return promise.then(unpackHttpRes.bind(undefined, fn));
        };

        promise.error = function(fn) {
          return promise.then(null, unpackHttpRes.bind(undefined, fn));
        };

        promise.spread = function(fn, context) {
          return promise.then(function(data) {
            if (!angular.isArray(data)) {
              return fn.call(context, data);
            } else {
              return q.all(data).then(function(resolved) {
                return fn.apply(context, resolved);
              }); // Resolve promises, if any
            }
          });
        };

        promise.delay = promise.timeout = function(fn, time, context) {
          // In case people have other preference
          if (angular.isNumber(fn) && angular.isFunction(time)) {
            var tmp = fn;
            fn = time;
            time = tmp;
          }

          var deferred = q.defer();
          setTimeout(function() {
            promise.then(fn, context).then(deferred.resolve);
          }, time);

          return decoratePromise(deferred.promise);
        };

        promise.all = function(fn, context) {
          var p = promise.then(function(data) {
            if (angular.isArray(data) || angular.isObject(data)) {
              return q.all(data);
            } else {
              return data;
            }
          }).then(fn, context);
          return p;
        };

        return promise;
      }

      $delegate.fcall = function(fn, context) {
        return $delegate.when().then(fn, context);
      };

      $delegate.defer = function() {
        var deferred = q.defer();
        decoratePromise(deferred.promise);
        return deferred;
      };

      ['all', 'reject', 'when'].forEach(function(fn) {
        $delegate[fn] = function() {
          return decoratePromise(q[fn].apply(this, arguments));
        };
      });

      return $delegate;
    },
  ]);
  },
]);
})();

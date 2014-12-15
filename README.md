angular-quasar
==============

Enhanced angular $q on steroids.

## API

### .fcall

Allows to create new promise chain

```js
$q.fcall(function () {
  // Do things
}).then(function () {
  // More things
});
```

### .success

Passes `$http`\`s `.success` response down the chain.

```js
$q.fcall(function() {
  $http.get('http://cutekittens.com/meow');
}).success(function (data, status, headers, config) {
  // Oh, the hard work here!
});
```

### .error

Passes `$http`\`s `.error` response down the chain.

```js
$q.fcall(function() {
  $http.get('http://cutekittens.com/meow');
}).error(function (data, status, headers, config) {
  // Oh, error happened!
});
```

### .delay or .timeout

Integrates timeout right into promise chain!

```js
$q.fcall(function () {
  // Whatever hard work here
}).delay(function () {
  // Executed after 500ms
}, 500).then(function() {
  // Executed normally
});
```

### .all

Removes need to do separate `return $q.all(Array)` call.

```js
$q.fcall(function () {
  return [Promise, Promise, Promise];
}).all(function (resolved) {
  // `resolved` contains resolved promises array
});
```

### .spread

Spreads array items as arguments.

```js
$q.fcall(function () {
  return ['a', 'b', 'c'];
}).all(function (a, b, c) {
  // `a`, `b`, `c` contain their respective values
});
```

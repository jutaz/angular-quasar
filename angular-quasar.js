angular.module('jutaz.quasar', []).config(['$provide', function ($provide) {
	$provide.decorator('$q', function ($delegate) {
		$delegate.fcall = function (fn) {
			return $delegate.when(true).then(fn);
		};
		return $delegate;
	});
}]);

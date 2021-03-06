var weekday = new Array(7);
weekday[0]=  "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";

var app = angular.module('myApp', ['firebase','ngRoute']).run(function($rootScope,$firebase){
	var playersRef = new Firebase("https://workoutWager.firebaseio.com/players");
	var codesRef = new Firebase("https://workoutWager.firebaseio.com/codes");
	var checkinsRef = new Firebase("https://workoutWager.firebaseio.com/checkins");
	$rootScope.players = $firebase(playersRef);
	$rootScope.codes = $firebase(codesRef);
	$rootScope.checkins = $firebase(checkinsRef);
	$rootScope.checkedIn = false;
});

app.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/Checkin', {
        templateUrl: 'checkin.html',
        controller: 'CheckinController'
	}).
      when('/Wager', {
        templateUrl: 'wager.html',
        controller: 'WagerController'
  	}).
      when('/Login', {
        templateUrl: 'login.html',
        controller: 'LoginController'
  	}).
      otherwise({
        redirectTo: '/Checkin'
      });
}]);



// Controllers 
app.controller('CheckinController', ['$scope', '$firebase', '$location', '$firebaseSimpleLogin', function($scope,$firebase,$location,$firebaseSimpleLogin){	
	$scope.checkin = function(){
		var code = this.code;
		var message = this.checkinMessage;
		var validCode = false;		
		// Dummy Validation
		for(currentCode in $scope.codes){
			if(code == $scope.codes[currentCode]){
				validCode = true;
				$scope.user = $scope.players[code];
				break;
			}
		}

		if(!validCode){
			alert('User Code is Invalid.');		
			return;
		}
		else{
			if(!$scope.user.checkins){
				$scope.user.checkins = {};
			}

			var today = new Date();
			var day = weekday[today.getDay()];
			if(!$scope.user.checkins[day]){
				$scope.user.checkins[day] = {'time': today, 'message': message, 'name': $scope.user.name};
				
				$scope.user.checkedInDay = today.getDay();
				$scope.players.$set($scope.players);
				$scope.checkins.$add($scope.user.checkins[day]);
				$scope.code = "";
				$scope.checkinMessage = "";
				alert("You've successfully checked in!")
			}
			else{
				$scope.checkedIn = true;
				alert("You've already checked in today "+$scope.user.name+"! Good Job!");
			}	

  			$location.path('/Wager');
		}
	}

	$scope.adjustDice = function(){
		var wagerAmount = 3;
		var defaultDice = 6;

		for(var i in $scope.players){
			var player = $scope.players[i];

			// Skip over angular junk -> TODO how to cleanly skip $$
			if(player.name !== undefined){
				var totalCheckins = _.size(player.checkins);
				var adjustment = totalCheckins - wagerAmount;			
				if(adjustment > 2) {
					adjustment = 2;
				}
				player.selectedDice = defaultDice + adjustment;
			}			
		}
		$scope.players.$set($scope.players);
	}

	$scope.findWinner = function(){

	}
}]);

app.controller('LoginController', ['$scope', '$firebase', '$firebaseSimpleLogin', function($scope, $firebase, $firebaseSimpleLogin){
	var dataRef = new Firebase("https://workoutwager.firebaseio.com");
    $scope.loginObj = $firebaseSimpleLogin(dataRef);

    $scope.login = function(){
		$scope.loginObj.$login('password', {
		   email: this.email,
		   password: this.password
		}).then(function(user) {
		   console.log('Logged in as: ', user.uid);
		}, function(error) {
		   console.error('Login failed: ', error);
		});
	}

	$scope.logout = function(){
		$scope.loginObj.$logout();
	}

}]);

app.controller('WagerController', ['$scope', '$firebase', function($scope, $firebase){
	$scope.currentDay = new Date().getDay();
	$scope.fullDay = new Date();

	$scope.getPercentage = function(player){
		var totalCheckins = 3; // default
		var checkins = _.size(player.checkins);
		var percentage = checkins / totalCheckins * 100;

		return percentage+"%";
	};

	$scope.getCheckinCount = function(player){
		return _.size(player.checkins);
	}
	// $scope.timeSort = function(checkin){
	// 	return checkin.time;
	// };
	// var playersRef = new Firebase("https://workoutWager.firebaseio.com/players");
	// var codesRef = new Firebase("https://workoutWager.firebaseio.com/codes");
	// $scope.players = $firebase(playersRef);
	// $scope.codes = $firebase(codesRef);
}]);

app.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});











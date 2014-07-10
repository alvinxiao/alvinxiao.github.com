var weekday = new Array(7);
weekday[0]=  "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";

var app = angular.module('myApp', ['firebase']).run(function($rootScope,$firebase){
	var playersRef = new Firebase("https://workoutWager.firebaseio.com/players");
	var codesRef = new Firebase("https://workoutWager.firebaseio.com/codes");
	$rootScope.players = $firebase(playersRef);
	$rootScope.codes = $firebase(codesRef);
	$rootScope.checkedIn = false;
	// var today = new Date().getDay();

	// for(currentCode in $scope.codes){
	// 	var code = $scope.codes[currentCode]);
	// 	$scope.user = $scope.players[code];
	// 	if($scope.user.checkins){
	// 		if($scope.user.checkins[today]){
	// 			$scope.checkedInToday = true;
	// 		}
	// 	}
	// }
});

// Controllers 
app.controller('CheckinController', ['$scope', '$firebase', function($scope,$firebase){


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
				$scope.user.checkins[day] = {'time': today, 'message': message};
				
				$scope.user.checkedInDay = today.getDay();
				$scope.players.$set($scope.players);
				$scope.code = "";
				$scope.checkinMessage = "";
				alert("You've successfully checked in!")
			}
			else{
				$scope.checkedIn = true;
				alert("You've already checked in today "+$scope.user.name+"! Good Job!");
			}			
		}
	}
}]);

app.controller('WagerController', ['$scope', '$firebase', function($scope, $firebase){
	$scope.currentDay = new Date().getDay();
	// var playersRef = new Firebase("https://workoutWager.firebaseio.com/players");
	// var codesRef = new Firebase("https://workoutWager.firebaseio.com/codes");
	// $scope.players = $firebase(playersRef);
	// $scope.codes = $firebase(codesRef);


}]);













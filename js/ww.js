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
			if(!$scope.user.checkins[today.getDay()]){
				$scope.user.checkins[today.getDay()] = {'time': today, 'message': message};
				$scope.user.checkedInToday = true;
				$scope.players.$set($scope.players);
				$scope.checkedIn = true;
			}
			else{
				$scope.checkedIn = true;
				alert("You've already checked in today! Good Job!");
			}			
		}
	}
}]);

app.controller('WagerController', ['$scope', '$firebase', function($scope, $firebase){
	// var playersRef = new Firebase("https://workoutWager.firebaseio.com/players");
	// var codesRef = new Firebase("https://workoutWager.firebaseio.com/codes");
	// $scope.players = $firebase(playersRef);
	// $scope.codes = $firebase(codesRef);


}]);













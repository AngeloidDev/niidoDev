"use strict";
appControllers
.controller('aboutCtrl', ['$scope',
	function($scope){
		console.log("About");
        $scope.data={};
        $scope.data.showButtonsArea=false;
        $scope.showButtonArea = function(){
            console.log("in");
            if($scope.data.showButtonsArea){
                var area = document.getElementById("ButtonsAreaRedirect");
                area.className = "";
                $scope.data.showButtonsArea = false;
            } else{
                var area = document.getElementById("ButtonsAreaRedirect");
                area.className = "bounceInUp";
                $scope.data.showButtonsArea = true;
            }

        };
	}])

.controller('policyCtrl',['$rootScope', '$scope', '$timeout','UserService','SequenceService', 'ApiEndPoint','$q','$state', 'ionicService',
    function($rootScope, $scope, $timeout,UserService,SequenceService, ApiEndPoint, $q, $state, ionicService){
        $scope.data={};
        $scope.data.showButtonsArea=false;
        $scope.showButtonArea = function(){
            console.log("in");
            if($scope.data.showButtonsArea){
                var area = document.getElementById("ButtonsAreaRedirect");
                area.className = "";
                $scope.data.showButtonsArea = false;
            } else{
                var area = document.getElementById("ButtonsAreaRedirect");
                area.className = "bounceInUp";
                $scope.data.showButtonsArea = true;
            }
        };
    }])
;

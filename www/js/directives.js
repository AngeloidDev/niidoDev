"use strict";
angular.module('app.directives', [])

.directive('autosize', function() {
    return {
        restrict: 'A', // only activate on element attribute
        link: function(scope, element, attrs) {

            //element[0].style.cssText = 'height: auto; padding:0';
            //element[0].style.cssText = 'height: 18px';

        	function adjust(){
                element[0].style.cssText = 'height: auto; padding:0';
                element[0].style.cssText = 'height:' + element[0].scrollHeight + 'px';
        	}

        	scope.$watch(attrs.ngModel, function(newValue) {
	            adjust();
			});
        }
    };
})

//http://codepen.io/ionic/pen/hIzFp
.directive('headerShrink', function($document, $rootScope) {

  var shrink = function(header, content, opacity, max) {
    ionic.requestAnimationFrame(function() {
      for(var i = 0, j = header.children.length; i < j; i++) {
        header.children[i].style[ionic.CSS.TRANSITION] = 'opacity 1.5s';
        header.children[i].style.opacity = opacity;
      }
    });
  };

  $rootScope.$on('$ionicView.afterEnter', function(event, toState, toParams, fromState, fromParams){
    shrink($document[0].body.querySelector('.nav-bar-container'), null, 1, 44);
  });

  return {
    restrict: 'A',
    link: function($scope, $element, $attr) {
      var starty = $scope.$eval($attr.headerShrink) || 0;
      var shrinkAmt;

      var header = $document[0].body.querySelector('.nav-bar-container');
      var headerHeight = 44;

      $element.bind('scroll', function(e) {
        var scrollTop = null;
        if(e.detail){
          scrollTop = e.detail.scrollTop;
        }else if(e.target){
          scrollTop = e.target.scrollTop;
        }
        if(scrollTop > starty){
          // Start shrinking
          shrink(header, $element[0], 0, headerHeight);
          if(scrollTop < $scope.lastScrollTop ){
            shrink(header, $element[0], 1, headerHeight);
          }else{
            shrink(header, $element[0], 0, headerHeight);
          }
        } else {
          shrink(header, $element[0], 1, headerHeight);
        }
        $scope.lastScrollTop = scrollTop;
      });
    }
  }
})

.directive('tag', function(){
  return {
    restrict: 'E',
    scope: {
      previousText: '=previousText',
      listTaggedUsers: '=listTaggedUsers',
      listHashTags: '=listHashTags'
    },
    link: function(scope, element, atts){
      var positionTag = 0;
      var fixedHtmlFinal = "";
      var taggedUserId = 0;
      var fixedName;
      var pivotInsert = 0;
      var calcEnd = 0;
      if(scope.listTaggedUsers){
        if(scope.listTaggedUsers.length >0){
          for(var a=0; a<scope.listTaggedUsers.length;a++){
            fixedName = '@'+scope.listTaggedUsers[a].name.replace(/\s\s+/g, ' ');
            fixedName = fixedName.replace(/\s+$/g,'');
            if(scope.previousText.indexOf(fixedName) != -1){
              positionTag = scope.previousText.indexOf(fixedName, pivotInsert);
              if(positionTag == 0){
                taggedUserId = scope.listTaggedUsers[a].id || scope.listTaggedUsers[a].userSubscription.href.split('/')[6];
                scope.previousText = scope.previousText.substr(0,positionTag) + '<span class="mentionTag" id="'+ taggedUserId +'">' + fixedName + '</span>&nbsp;' + scope.previousText.substr(positionTag + fixedName.length);
                pivotInsert = pivotInsert + (positionTag-pivotInsert) + 29 + taggedUserId.toString().length + 2 + fixedName.length + 13;
              } else {
                calcEnd = positionTag + fixedName.length;
                if(calcEnd == scope.previousText.length){
                  taggedUserId = scope.listTaggedUsers[a].id || scope.listTaggedUsers[a].userSubscription.href.split('/')[6];
                  scope.previousText = scope.previousText.substr(0,positionTag) + '<span class="mentionTag" id="'+ taggedUserId +'">' + fixedName + '</span>&nbsp;' + scope.previousText.substr(positionTag + fixedName.length);
                  pivotInsert = 0;
                } else {
                  positionTag = scope.previousText.indexOf(" "+fixedName+" ");
                  if(positionTag == -1){
                    positionTag = scope.previousText.indexOf(" "+fixedName);
                  }
                  if(positionTag == -1){
                    positionTag = scope.previousText.indexOf(fixedName+" ");
                    positionTag = positionTag-1;
                  }
                  taggedUserId = scope.listTaggedUsers[a].id || scope.listTaggedUsers[a].userSubscription.href.split('/')[6];
                  positionTag = positionTag+1;
                  scope.previousText = scope.previousText.substr(0,positionTag) + '<span class="mentionTag" id="'+ taggedUserId +'">' + fixedName + '</span>&nbsp;' + scope.previousText.substr(positionTag + fixedName.length);
                }
              }
            }
          }
        }
      }
      var fixHash="";
      var positionHashTag = 0;
      var HashtagId=0;
      var calcEnd = 0;
      var fixedHashArray = [];
      if(scope.listHashTags){
        if(scope.listHashTags.length >0){
          scope.listHashTags.length--;
          for(var a=0; a<scope.listHashTags.length; a++){
            fixedHashArray[a] = '#'+ scope.listHashTags[a].hash;
          }
          fixedHashArray.sort(function(a,b){
              return b.length - a.length;
          });
          for(var b=0; b<fixedHashArray.length; b++){
            fixHash = fixedHashArray[b];
            if(scope.previousText.indexOf(fixHash) != -1){
              positionHashTag = scope.previousText.indexOf(fixHash,pivotInsert);
              if(positionHashTag == 0){
                scope.previousText = scope.previousText.substr(0,positionHashTag) + '<span class="mentionTag" name="'+ scope.listHashTags[b].hash +'">' + fixHash + '</span>&nbsp;' + scope.previousText.substr(positionHashTag + fixHash.length);
                pivotInsert = pivotInsert + (positionHashTag-pivotInsert) + 31 + scope.listHashTags[b].hash.length + 2 + fixHash.length + 13;
              }
              else{
                calcEnd = positionHashTag + fixHash.length;
                if(calcEnd == scope.previousText.length){
                  scope.previousText = scope.previousText.substr(0,positionHashTag) + '<span class="mentionTag" name="'+ scope.listHashTags[b].hash +'">' + fixHash + '</span>&nbsp;' + scope.previousText.substr(positionHashTag + fixHash.length);
                  pivotInsert = 0;
                }
                else{
                  positionHashTag=scope.previousText.indexOf(" " +fixHash+ " ");
                  if(positionHashTag == -1){
                    positionHashTag=scope.previousText.indexOf(" " +fixHash);
                  }
                  if(positionHashTag == -1){
                    positionHashTag=scope.previousText.indexOf(fixHash+ " ");
                    positionHashTag = positionHashTag-1;
                  }
                  positionHashTag = positionHashTag+1;
                  scope.previousText = scope.previousText.substr(0,positionHashTag) + '<span class="mentionTag" name="'+ scope.listHashTags[b].hash +'">' + fixHash + '</span>&nbsp;' + scope.previousText.substr(positionHashTag + fixHash.length);
                }
              }
            }
          }
        }
      }
      fixedHtmlFinal = scope.previousText;
      element[0].innerHTML = fixedHtmlFinal;
      element[0].style= "font-weight:normal !important; color:rgba(51,51,51,1);";
    }
  }
})

.filter('trusted', ['$sce', function($sce){
  return function(url) {
    return $sce.trustAsResourceUrl(url);
  };
}])
;


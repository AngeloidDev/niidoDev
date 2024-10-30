"use strict";
angular.module('app')

    .factory('AuthInterceptor',
    ['$rootScope', '$q', '$injector',
    function ($rootScope, $q, $injector) {
        return {
            responseError: function (response) {

                // whenever we get a 401 from the server.
                // * if this happens during the initial login attempt (see AuthService.login) when
                //   we are testing the provided username+password against /restful/user, then we just ignore
                // * if this happens otherwise then it means that we've lost the session, should go back to the login page
                if(response.status === 401) {

                    var $state = $injector.get("$state");
                    var AuthService = $injector.get("AuthService");

                    if($state.current.name !== "Login") {
                        AuthService.logout();
                        $state.go('login', {}, {reload: true});
                    }
                }

                return $q.reject(response);
            }
        };
    }])

    // install our interceptor for any $http requests
    .config(function ($httpProvider) {
        $httpProvider.interceptors.push('AuthInterceptor');
    })

    .service('AuthService',
            ['$q','$http','base64','$rootScope','ApiEndPoint','$filter',
            function($q, $http, base64, $rootScope,ApiEndPoint, $filter ) {

            var LOCAL_TOKEN_KEY = 'contactapp';
            var username = '';
            var isAuthenticated = false;
            var basicAuth;

            function loadUserCredentials() {
                var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
                if (token) {
                    useCredentials(token);
                }
            }

            function storeUserCredentials(name, basicAuth) {
                var token =  name + "." + basicAuth;
                window.localStorage.setItem(LOCAL_TOKEN_KEY, name + "." + basicAuth);
                useCredentials(token);
            }

            function useCredentials(token) {
                username = token.split('.')[0];
                basicAuth = token.split('.')[1];
                isAuthenticated = true;

                $http.defaults.headers.common['Authorization'] = 'Basic ' + basicAuth;
            }

            function destroyUserCredentials() {
                username = '';
                basicAuth = undefined;
                isAuthenticated = false;

                $http.defaults.headers.common.Authorization = 'Basic ';
                window.localStorage.removeItem(LOCAL_TOKEN_KEY);
            }

            var login = function(name, pw) {
                return $q(function(resolve, reject, ApiEndpoint) {
                    //console.log("authLog:", resolve);
                    // attempt to access a resource (we happen to use /restful/user)
                    // using the provided name and password
                    var basicAuth = base64.encode(name + ":" + pw);

                    //ApiEndPoint is defined in app.js
                    $http.get(ApiEndPoint.url + '/restful/version',
    		        //$http.get("/restful/user",
                            {
                                headers: {
                                    'Accept': 'application/json;profile=urn:org.apache.isis/v1;repr-type=object;',
                                    'Authorization': 'Basic ' + basicAuth,
                                    'Cache-Control': 'no-cache',
                                    'Pragma': 'no-cache',
                                    'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT' // a long time ago
                                }
                            }
                        )
                        .success(function(data) {

                            // the user/password is good, so store away in local storage, and also
                            // configure the $http service so that all subsequent calls  use the same 'Authorization' header
                            storeUserCredentials(name, basicAuth);
                            resolve(data);
                        })
                        .error(function(error){
                            var message="";
                            console.log("error",error);
                            var i =error.split("<h2>")[1];
                            var f =i.split("</h2>")[0];
                            var clean = f.split("R ")[1];
                            if(clean == "401" || clean == "500"){
                                message= $filter('translate')('ERROR.LOGIN')
                            }
                            console.log("causes ",message);
                            reject(message);
                        });
                });
            };

            var logout = function() {
                destroyUserCredentials();
            };

            loadUserCredentials();

            return {
                login: login,
                logout: logout,
                isAuthenticated: function() {
                    return isAuthenticated;
                },
                username: function() {
                    return username;
                }
            };

    }])

;

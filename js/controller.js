'use strict';

app.controller('GlobalCtrl', function($scope, $firebase, $rootScope, $location, UserService, Auth, Database, $cookies) {
  $rootScope.db = Database;
  $rootScope.loading = false;
  $rootScope.names = NAMES_TEMPLATE;
  $rootScope.customUi = CUSTOM_UI;

  Auth.$onAuthStateChanged(function(firebaseUser) {
    $rootScope.user = firebaseUser;
    if($rootScope.user) {
      UserService($rootScope.user.uid).$bindTo($scope, "userData");
    }
  });

  $rootScope.typeLimit = TYPE_LIMIT;

  $rootScope.listType = LIST_TYPE

  $rootScope.listePersos = LISTE_PERSOS;

  $rootScope.ui = {
    "spells" : {
      "name" : "spells",
      "bool" : $cookies.get("spells") || true
    },
    "stats" : {
      "name" : "stats",
      "bool" : $cookies.get("stats") || true
    },
    "sets" : {
      "name" : "sets",
      "bool" : $cookies.get("sets") || true
    },
    "infos" : {
      "name" : "infos",
      "bool" : $cookies.get("infos") || true
    },
    "items" : {
      "name" : "items",
      "bool" : $cookies.get("items") || true
    },
    "build" : {
      "name" : "build",
      "bool" : $cookies.get("build") || true
    }
  }
});

app.controller('HomeCtrl', function($scope, $firebase, $rootScope, $location, UserService, currentAuth) {
  if (currentAuth) {
    UserService(currentAuth.uid).$bindTo($scope, "userData");
  }
});

app.controller('UiMenuCtrl', function($scope, $firebase, $rootScope, $location, UserService, $cookies) {
  console.log('uimenu');
  $scope.changeUi = function(id) {
    console.log(id);
    if( $rootScope.ui[id].bool == "false") {
      $rootScope.ui[id].bool = "true";
    }
    else {
      $rootScope.ui[id].bool = "false";
    }
    $cookies.put(id, $rootScope.ui[id].bool);
    console.log($rootScope.ui);
  }
});

app.controller('ProfileCtrl', function($scope, $firebase, $rootScope, $location, Auth, currentAuth, UserService) {
  if (currentAuth) {
    UserService(currentAuth.uid).$bindTo($scope, "profil");
  }
});

app.controller('ItemsCtrl', function($scope, $firebase, $rootScope, $location, Auth, Items, Categories) {
  $scope.categories = Categories();
  $scope.items = Items('type1', 30);
  $scope.showItems = function(id) {
    $scope.items = Items(id, 30);
  }
  $scope.addItem = function() {
    $scope.item = {}
    $scope.items.$add();
  }
});

app.controller('WeaponsCtrl', function($scope, $firebase, $rootScope, $location, Auth, Items) {
  // get weapons only
  $scope.weapons = Items('type1', 30);
});

app.controller('SetsCtrl', function($scope, $firebase, $rootScope, $location, Auth, Sets) {
  $scope.sets = Sets;

  $scope.sets.$loaded().then(function() {
    $scope.nbSets = $scope.sets.length;
  });

  $scope.toNumber = function(string) {
    return string.replace(/^\D+/g, '');
  }
  $scope.addSet = function() {

    $scope.newSet = {
      "nom": "New set"
    };

    $rootScope.db.ref("sets").child('set' + parseInt($scope.nbSets + 1)).set($scope.newSet, function(error) {
      if (error) {
        console.log(error);
      } else {
        console.log('allcorrect');
        $scope.nbSets = $scope.sets.length;
      }
    });
  }
});

app.controller('SetIdCtrl', function($scope, $firebase, $rootScope, $location, Auth, SingleSet, $routeParams, Sets) {
  $scope.id = $routeParams.id;
  $scope.set = SingleSet('set' + $scope.id);
  /*$scope.removeSet = function(set) {
    set.$remove();
    history.back();
  }*/
  $scope.setsResult = {
    "bool" : false
  }

  $scope.getCompatible = function(set) {
    $scope.resultC = [];
    $scope.sets = Sets;
    $scope.sets.$loaded().then(function() {
      $scope.nbSets = $scope.sets.length;
      for (var i= 0; i < $scope.nbSets; i++)  {
          $scope.sets[i].marge = isCompatible(set, $scope.sets[i]);
          $scope.resultC.push($scope.sets[i]);
      }
      $scope.setsResult.bool = true;
    });
  }
});

app.controller('ItemIdCtrl', function($scope, $firebase, $rootScope, $location, Auth, $routeParams, Item) {
  $scope.type = $routeParams.type;
  $scope.id = $routeParams.id;
  $scope.item = Item('type' + $scope.type, $scope.id);
});

app.controller('LoginCtrl', function($scope, $firebase, $rootScope, $location, Auth) {
  $scope.loginModel = {};

  $scope.signUp = function() {
    $scope.error = null;
    Auth.$createUserWithEmailAndPassword($scope.signUpModel.email, $scope.signUpModel.password).then(function(firebaseUser) {
      firebase.database().ref('users/' + firebaseUser.uid).set({
        name: "Inconnu",
        email: $scope.signUpModel.email
      });
      $('#loginModal').modal('hide');
      $rootScope.user = firebaseUser;
    }).catch(function(error) {
      $scope.errorUp = error;
    });
  };

  $scope.doLogin = function() {
    $scope.error = null;
    Auth.$signInWithEmailAndPassword($scope.loginModel.email, $scope.loginModel.password).then(function(firebaseUser) {
      firebase.database().ref('users/' + firebaseUser.uid).ref('customUi').set({
        //$rootScope.customUi
      });
      $('#loginModal').modal('hide');
      $rootScope.user = firebaseUser;
    }).catch(function(error) {
      $scope.error = error;
    });
  };

  $scope.socialLogin = function(providerText) {
    console.log('social login ' + providerText)
    var provider = getProviderLink(providerText);
    $rootScope.auth.$signInWithPopup(provider).then(function(result) {
      var token = result.credential.accessToken;
      $rootScope.firebaseUser = result.user;
      if (result.user) {
        console.log('modification du nom de la personne');
        console.log(result.user);
        $rootScope.db.ref('/users/' + result.user.uid).set({
          name: getName(result.user),
          email: result.user.email,
          photoURL: result.user.photoURL,
          score: 0,
          current: 0,
          idQuiz: 32
        });
      }
      alert('connecté');
    }).catch(function(error) {
      console.log(error);
      if (error.code === 'auth/account-exists-with-different-credential') {
        var pendingCred = error.credential;
        var email = error.email;

        firebase.auth().fetchProvidersForEmail(email).then(function(providers) {
          if (providers[0] === 'password') {
            var password = promptUserForPassword();
            $rootScope.auth.$signInWithEmailAndPassword(email, password).then(function(user) {
              return user.link(pendingCred);
            }).then(function() {
              alert('connecté');
            });
            return;
          }
          alert('Un compte ' + providers[0] + ' existe déjà pour cette adresse email, voulez-vous essayer de vous connecter avec ?');
          var finalProvider = getProviderLink(providers[0]);
          $rootScope.auth.$signInWithPopup(finalProvider).then(function(result) {
            console.log(result);
            result.user.link(pendingCred).then(function() {
              alert('connecté');
            }).catch(function(err) {
              $scope.error = err;
            });
          });
        });
      } else {
        $scope.error = error;
      }
    });
  }

  $scope.oubli = function() {
    // fonction d'oubli de mot de passe / réinitialisation
  }
});

app.controller('HeaderCtrl', function($scope, $firebase, $rootScope, $location, $http, Auth) {
  $http.get('../json/menu.json').then(function(result) {
    $rootScope.menu = result.data.menu;
  });

  $scope.signOut = function() {
    Auth.$signOut().then(function(result) {
      $location.path("/home");
    });
  }
});

app.controller('FooterCtrl', function($scope, $firebase, $rootScope, $location, $http) {});

app.controller('ContactCtrl', function($scope, $firebase, $rootScope, $location, $http) {
  $scope.contactForm = {};
  $scope.processForm = function() {
    // traiter le formulaire
    console.log('traitement du formulaire');
  }
});

app.controller('BuildsCtrl', function($scope, $firebase, $rootScope, $location, $http, Builds, currentAuth, moment) {
  $rootScope.loading = true;
  $scope.builds = Builds(currentAuth.uid);
  $scope.builds.$loaded().then(function() {
    $scope.nbBuilds = $scope.builds.length;
    $rootScope.loading = false;
  });
  $scope.filterVar = undefined;
  $scope.createBuild = function(id) {
    var d = new Date();
    var n = d.getTime();
    $scope.newBuild = {
      "type": parseInt(id),
      "titre": "Nouveau build",
      "level": 200,
      "dateCrea": new Date().getTime()
    };
    $scope.builds.$add($scope.newBuild).then(function(ref) {
      $scope.newBuild.userId = currentAuth.uid;
      $scope.newBuild.stats = TEMPLATE_STATS;
      $scope.newBuild.items = TEMPLATE_ITEM;
      $rootScope.db.ref('buildID').child(ref.key).set($scope.newBuild, function(error) {
        if (error) {} else {
          console.log('allright');
          console.log(ref.key);
          $scope.$apply(function() {
            $location.path('/build/' + ref.key + '/edit');
          })
        }
      });
    });
  }

  $scope.deleteBuild = function(id) {
    $rootScope.db.ref('builds').child(currentAuth.uid).child(id).set(null)
    .then(function() {
      $rootScope.db.ref('buildID').child(id).set(null).then(function() {
        console.log('supprimé');
      });
    })
    .catch(function(error) {
      console.log('Synchronization failed');
    });
  }

  $scope.toggleFilter = function(key, $event) {
    $('#creationFilterUl li').removeClass('active');
    $($event.currentTarget).addClass('active');
    console.log(key);
    if(key == '') {
      $scope.filterVar = key;
    }
    else {
        $scope.filterVar = parseInt(key);
    }
    console.log($scope.filterVar);
  }
});

app.controller('BuildIdCtrl', function($scope, $firebase, $rootScope, $location, $http, BuildId, $routeParams) {
  $rootScope.loading = true;
  $scope.id = $routeParams.id;
  $scope.build = BuildId($scope.id);

  $scope.build.$loaded().then(function() {
    console.log($scope.build);
    $rootScope.loading = false;
  });
});

app.controller('BuildEditCtrl', function($scope, $firebase, $rootScope, $location, $http, BuildId, $routeParams, currentAuth, Spells, Items) {
  $rootScope.loading = true;
  $scope.itemToShow = {};
  $scope.id = $routeParams.id;
  /*localStorage.items = undefined;
  localStorage.clear();
  if (localStorage.items) {
    $scope.items = JSON.parse(localStorage.items);
    console.log($scope.items);
  } else {
    $scope.items = Items('type1', 30);
    localStorage.items = JSON.stringify(Items('type1',30));
  }*/
  var ts = Items('typeall',30);

  $scope.items = {};
  ts.$loaded().then(function() {
    ts.forEach(function(e) {
      $scope.items = Object.assign($scope.items, e);
    });
  });


  $scope.bonus = {
    "fo" : false,
    "age" : false,
    "ine" : false,
    "vi" : false,
    "sa" : false,
    "cha" : false,
    "all": false
  }
  $scope.selectedType = "all";

  $scope.build = BuildId($scope.id);

  $scope.build.$loaded().then(function() {
    $rootScope.loading = false;
    if (currentAuth.uid != $scope.build.userId) {
      $location.path('/home');
    }
    console.log($scope.build.type);
    $scope.spells = Spells('common');
  });


  $scope.$watch("build", function(build, old) {
    if (build != old) {
      $scope.build.$save().then(function(ref) {

      }, function(err) {
        $scope.build = build;
      });
    }
  });

  $scope.directlyAddItem = function(item, key) {
    console.log('add item');
    var type = "type" + item.type;

    // construction de l'objet
    if (!$scope.build.items) {
      $scope.build['items'] = {}
    }

    $scope.build.items[type] = [];
    item['idItem'] = parseInt(key);
    $scope.build.items[type].push(item);
    console.log($scope.build.items);
    // sauvegarde de l'objet
    $scope.build.$save().then(function(ref) {

    }, function(err) {
      console.log(err);
      $scope.directlyaddItemError = err;
    });
  }

  $scope.save = function() {
    $scope.updatedBuild = {
      "titre": $scope.build.titre,
      "type": $scope.build.type
    }
    $scope.build.$save().then(function(ref) {
      $rootScope.db.ref('builds').child(currentAuth.uid).child($scope.build.$id).set($scope.updatedBuild, function(error) {
        if (error) {
          console.log(error);
        } else {
          console.log('saved');
        }
      });
    }, function(error) {
      console.log(error);
    });
  }

  $scope.updateBox = function(key) {
    if ($scope.build.stats[key].bonus == 100) {
      $scope.bonus[key] = true;
    }
    $scope.build.$save().then(function(ref) {
    }, function(err) {
      console.log(err);
    });
  }
  $scope.updateStats = function(key) {
    if($scope.bonus[key]) {
      $scope.build.stats[key].bonus = 100;
    }
    else {
      $scope.build.stats[key].bonus = 0;
    }
    $scope.build.$save().then(function(ref) {
    }, function(err) {
      console.log(err);
    });
  }

  $scope.toggleAll = function() {
    var tempVal = 0;
    if ($scope.bonus.all == true) {
      tempVal = 100
    }

    for (var e in $scope.bonus) {
      if(e != 'all') {
        console.log($scope.bonus[e]);
        $scope.bonus[e] = $scope.bonus.all;
        $scope.build.stats[e].bonus = tempVal;
      }
    }
    $scope.build.$save().then(function(ref) {
    }, function(err) {
      console.log(err);
    });
  }

  $scope.updateListItems = function(value) {
    if (value != "all") {
      $scope.items = Items('type' + value, 30);
    }
    else {
      $scope.snapshot = Items('type' + value, 30);
      $scope.items = {};
      $scope.snapshot.$loaded().then(function() {
        $scope.snapshot.forEach(function(e) {
          $scope.items = Object.assign($scope.items, e);
        });
      });
    }
  }

  $scope.calculPtsRestants = function(lvl, stats) {
    if(lvl && stats) {
      var pts = (lvl - 1) * 5;
      for (var e in stats) {
        var base = stats[e].base || 0;
        if (e == 'vi') {
          pts = pts - base * 1;
        }
        else if ( e == 'sa') {
          pts = pts - base * 3;
        }
        else if (base < 101) {
          pts = pts - base;
        }
        else if (base < 201) {
          pts = pts - 2 * base + 100;
        }
        else if (base < 301) {
          pts = pts - 3 * base + 300;
        }
        else if (base < 401) {
          pts = pts - 4 * base + 600;
        }
      }
      return pts;
    }
  }
  $scope.typeSelector = {
    "bool" : false
  }

  $scope.changeType = function(type) {
    if(type > 0 && type < 17) {
      $scope.build.type = type;
      $scope.typeSelector.bool = false;
    }
    $scope.build.$save().then(function(ref) {
      $rootScope.db.ref('builds').child(currentAuth.uid).child($scope.build.$id).child('type').set(type, function(error) {
      });
    }, function(err) {
      console.log(err);
    });
  }
});

app.controller('ItemsTypeCtrl', function($scope, $firebase, $rootScope, $location, $http, $routeParams, currentAuth, Items, BuildId) {
  $rootScope.loading = true;
  $scope.buildId = $routeParams.build;

  $scope.build = BuildId($scope.buildId);

  $scope.typeId = $routeParams.type;

  $scope.items = Items('type' + $scope.typeId, 30);
  $scope.items.$loaded().then(function() {
    $rootScope.loading = false;
  });

  $scope.addToBuild = function(item, key) {
    var type = "type" + $scope.typeId;

    // construction de l'objet
    if (!$scope.build.items) {
      $scope.build['items'] = {}
    }
    $scope.build.items[type] = [];
    item['idItem'] = parseInt(key);
    $scope.build.items[type].push(item);

    // sauvegarde de l'objet
    $scope.build.$save().then(function(ref) {
      // retour au build
      history.back();
    }, function(err) {
      console.log(err);
    });
  }
});

app.controller('ModalItemCtrl', function($scope, $firebase, $rootScope, $location, $http, $routeParams, Item) {});


app.controller('CompareCtrl', function($scope, $firebase, $rootScope, $location, $http, $routeParams, currentAuth, Builds) {
  $rootScope.loading = true;
  $scope.builds = Builds(currentAuth.uid);
  $scope.builds.$loaded().then(function() {
    $scope.nbBuilds = $scope.builds.length;
    $rootScope.loading = false;
  });
  $scope.modelCompare = {
    "firstBuild" : null,
    "secondBuild" : null
  }

  $scope.compare = function() {
    var p1 = $scope.modelCompare.secondBuild;
    var p2 = $scope.modelCompare.firstBuild;
    if(p1 != null && p2 != null) {
      if(p1 == p2) {
        $scope.errorCompare = "Erreur même selection";
      }
      else {
        $location.path('/resultCompare/' + p1.$id + '/' + p2.$id);
      }
    }
    else {
      $scope.errorCompare = "Erreur lors de la séléction";
    }
  }
});


app.controller('ResultCompareCtrl', function($scope, $firebase, $rootScope, $location, $http, $routeParams, BuildId, Spells) {
  $scope.loadingCompare = true;
  $scope.p1 = $routeParams.firstBuild;
  $scope.p2 = $routeParams.secondBuild;

  $scope.build1 = BuildId($scope.p1);
  $scope.build2 = BuildId($scope.p2);

  $scope.build1.$loaded().then(function() {
    $scope.spells1 = Spells('common');
    $scope.build2.$loaded().then(function() {
      $scope.spells2 = Spells('common');
      $scope.loadingCompare = false;
    });
  });
});

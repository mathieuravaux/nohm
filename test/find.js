"use strict";
var util = require('util');

var prefix = 'nohm';

process.argv.forEach(function (val, index) {
  if (val === '--nohm-prefix') {
    prefix = process.argv[index + 1];
  }
});
var relationsprefix = prefix + ':relations:';

var redis = require('redis').createClient();
var nohm = require('nohm');
var UserFindMockup = nohm.Model.extend({
  constructor: function () {
    this.modelName = 'UserFindMockup';
    this.properties = {
      name: {
        type: 'string',
        value: 'testName',
        index: true,
        validations: [
          'notEmpty'
        ]
      },
      email: {
        type: 'string',
        value: 'testMail@test.de',
        unique: true
      },
      json: {
        type: 'json',
        value: '{}'
      },
      number: {
        type: 'integer',
        value: 1,
        index: true
      },
      number2: {
        type: 'integer',
        value: 200,
        index: true
      },
      bool: {
        type: 'bool',
        value: false
      }
    };
    nohm.Model.call(this);
  }
});

var RoleFindMockup = nohm.Model.extend({
  constructor: function () {
    this.modelName = 'RoleFindMockup';
    this.properties = {
      name: {
        type: 'string',
        value: 'user'
      }
    };
    nohm.Model.call(this);
  }
});

var errLogger = function (err) {
  if (err) {
    console.dir(err);
  }
};

var userNumeric = new UserFindMockup(),
userNumeric2 = new UserFindMockup(),
userNumeric3 = new UserFindMockup(),
all = [];

userNumeric.p({
  name: 'numericindextest',
  email: 'numericindextest@hurgel.de',
  number: 3
});
userNumeric.save(function (err) {
  errLogger(err);
  all.push(userNumeric.id);
});

userNumeric2.p({
  name: 'numericindextest',
  email: 'numericindextest2@hurgel.de',
  number: 4,
  number2: 33
});
userNumeric2.save(function (err) {
  errLogger(err);
  all.push(userNumeric2.id);
});

userNumeric3.p({
  name: 'numericindextest',
  email: 'numericindextest3@hurgel.de',
  number: 4,
  number2: 1
});
userNumeric3.save(function (err) {
  errLogger(err);
  all.push(userNumeric3.id);
});

var userUnique = new UserFindMockup();
userUnique.p({
  name: 'uniquefind',
  email: 'uniquefind@hurgel.de'
});
userUnique.save(function (err) {
  errLogger(err);
  all.push(userUnique.id);
});

var userString = new UserFindMockup();
userString.p({
  name: 'indextest',
  email: 'indextest@hurgel.de'
});
userString.save(function (err) {
  errLogger(err);
  all.push(userString.id);
});

var userString2 = new UserFindMockup();
userString2.p({
  name: 'indextest',
  email: 'indextest2@hurgel.de'
});
userString2.save(function (err) {
  errLogger(err);
  all.push(userString2.id);
});

exports.load = function (t) {
  var user = new UserFindMockup(),
  findUser = new UserFindMockup();
  t.expect(5);

  user.p({
    name: 'hurgelwurz',
    email: 'hurgelwurz@hurgel.de',
    json: { test: 1 }
  });

  user.save(function (err) {
    if (err) {
      console.dir(err);
      t.done();
    }
    all.push(user.id); // this is for findAll. we can't do findAll before this one, because this way it kinda ensures that findAll is called after all objects were saved.
    findUser.load(user.id, function (err) {
      if (err) {
        console.dir(err);
        t.done();
      }
      t.equals(user.p('name'), findUser.p('name'), 'The loaded version of the name was not the same as a set one.');
      t.equals(user.p('email'), findUser.p('email'), 'The loaded version of the email was not the same as a set one.');
      t.equals(findUser.p('json').test, 1, 'The loaded version of the json was not the same as the set one.');
      t.equals(user.id, findUser.id, 'The loaded version of the email was not the same as a set one.');
      t.equals(user.p('bool'), false, 'The loaded version of the boolean was not the same as a set one.');
      t.done();
    });
  });
};

exports.findAll = function (t) {
  // this is a fuckup and heavily relies upon the rest of this file. (the stuff above this test, not below)
  var findUser = new UserFindMockup();
  t.expect(1);
  
  findUser.find(function (err, ids) {
    t.same(all, ids, 'find() did not return all users when not given any search parameters.');
    t.done();
  });
};
 /* I don't know how to do this right now.
exports.loadArray = function (t) {
  var findUser = new UserFindMockup();
  t.expect(2);
  
  findUser.load(all, function (err, users) {
    errLogger(err);
    t.ok(Array.isArray(users), 'load()ing an array of ids did not return an array');
    t.same(all.length, users.length, 'load()ing an array of ids did not return an array with the coorect length');
  });
};*/

exports.findByUnique = function (t) {
  var findUser = new UserFindMockup();
  t.expect(1);

  findUser.find({
    email: userUnique.p('email')
  }, function (err, ids) {
    if (err) {
      console.dir(err);
    }
    t.same(ids, [userUnique.id], 'The found id did not match the id of the saved object.');
    t.done();
  });
};

exports.findByStringIndex = function (t) {
  var findUser = new UserFindMockup();
  t.expect(1);

  findUser.find({
    name: 'indextest'
  }, function (err, ids) {
    if (err) {
      console.dir(err);
    }
    t.same(ids, [userString.id, userString2.id], 'The found id did not match the id of the saved object.');
    t.done();
  });
};

exports.findByNumericIndex = function (t) {
  var findUser = new UserFindMockup();
  t.expect(1);
  
  findUser.find({
    number: {
      min: 2
    },
    number2: {
      max: 100,
      limit: 2
    }
  }, function (err, ids) {
    errLogger(err);
    t.same(ids, [userNumeric2.id, userNumeric3.id], 'The found id did not match the id of the saved object.');
    t.done();
  });
};

exports.findByMixedIndex = function (t) {
  var user = new UserFindMockup(),
  user2 = new UserFindMockup(),
  user3 = new UserFindMockup(),
  user4 = new UserFindMockup(),
  findUser = new UserFindMockup();
  t.expect(1);

  user.p({
    name: 'mixedindextest',
    email: 'mixedindextest@hurgel.de',
    number: 3,
    number2: 33
  });

  user2.p({
    name: 'mixedindextest',
    email: 'mixedindextest2@hurgel.de',
    number: 4,
    number2: 33
  });

  user3.p({
    name: 'mixedindextestNOT',
    email: 'mixedindextest3@hurgel.de',
    number: 4,
    number2: 1
  });
  
  user4.p({
    name: 'mixedindextest',
    email: 'mixedindextest4@hurgel.de',
    number: 1,
    number2: 33
  });

  user.save(function (err) {
    if (err) {
      console.dir(err);
      t.done();
    }
    user2.save(function (err) {
      if (err) {
        console.dir(err);
        t.done();
      }
      user3.save(function (err) {
        if (err) {
          console.dir(err);
          t.done();
        }
        user4.save(function (err) {
          if (err) {
            console.dir(err);
            t.done();
          }
          findUser.find({
            number: {
              min: 2
            },
            number2: {
              max: 100
            },
            name: 'mixedindextest'
          }, function (err, ids) {
            if (err) {
              console.dir(err);
            }
            t.same(ids, [user.id, user2.id], 'The found id did not match the id of the saved object.');
            t.done();
          });
        });
      });
    });
  });
};

exports.findSameNumericTwice = function (t) {
  var user = new UserFindMockup(),
  user2 = new UserFindMockup(),
  user3 = new UserFindMockup(),
  findUser = new UserFindMockup();
  t.expect(1);

  user.p({
    name: 'SameNumericTwice',
    email: 'SameNumericTwice@hurgel.de',
    number: 3000
  });

  user2.p({
    name: 'SameNumericTwice2',
    email: 'SameNumericTwice2@hurgel.de',
    number: 3000
  });

  user.save(function (err) {
    if (err) {
      console.dir(err);
      t.done();
    }
    user2.save(function (err) {
      if (err) {
        console.dir(err);
        t.done();
      }
      findUser.find({
        number: {
          min: 3000
        }
      }, function (err, ids) {
        if (err) {
          console.dir(err);
        }
        t.same(ids, [user.id, user2.id], 'The found id did not match the id of the saved objects.');
        t.done();
      });
    });
  });
};

exports.findByMixedIndexMissing = function (t) {
  var user = new UserFindMockup(),
  user2 = new UserFindMockup(),
  user3 = new UserFindMockup(),
  findUser = new UserFindMockup();
  t.expect(1);

  user2.p({
    name: 'mixedindextestMissing',
    email: 'mixedindextestMissing@hurgel.de',
    number: 4
  });

  user3.p({
    name: 'mixedindextestMissing2',
    email: 'mixedindextestMissing2@hurgel.de',
    number: 4
  });

  user.save(function (err) {
    if (err) {
      console.dir(err);
      t.done();
    }
    user2.save(function (err) {
      if (err) {
        console.dir(err);
        t.done();
      }
      user3.save(function (err) {
        if (err) {
          console.dir(err);
          t.done();
        }
        findUser.find({
          number: {
            min: 2
          },
          name: 'mixedindextASDASDestMISSING'
        }, function (err, ids) {
          if (err) {
            console.dir(err);
          }
          t.same(ids, [], 'Ids were found even though the name should not be findable.');
          t.done();
        });
      });
    });
  });
};


exports.findNumericWithoutLimit = function (t) {
  var findUser = new UserFindMockup()
  , usersLooped = 0
  , loopUserCreation = function () {
    usersLooped++;
    if (usersLooped === 55) {  
      findUser.find({
        number: {
          min: 1,
          limit: 0
        }
      }, function (err, ids) {
        errLogger(err);
        t.ok(ids.length > 54, 'The limit: 0 option did not return more than 50 ids.');
        t.done();
      });
    }
  };
  t.expect(1);
  
  for (var i = 0, len = 55; i < len; i++) {
    var user = new UserFindMockup();  
    user.p({
      name: 'findNumericWithoutLimit'+i,
      email: 'findNumericWithoutLimit'+i+'@hurgel.de',
      number: i
    });
    
    user.save(loopUserCreation);
  }
};
/*
 * Warning!! This is this hackiest goddamn script evarrr. Don't
 * judge :D
 */

var child_process = require('child_process');
var fs = require('fs');
var _ = require('underscore');
var Q = require('q');
var intl = require('../intl');
var prompt = require('prompt');
prompt.start();

var shouldBegin = Q.defer();
var translateQueue = [];
var outputLocale = 'pirate';

var titleSchema = {
  properties: {
    title: {
      message: 'What is the best translation for that title?'
    }
  }
};

var aboutSchema = {
  properties: {
    about: {
      message: 'What is the best translation for that about section?'
    }
  }
};

var translate = function(context, path, key, blob, schema) {
  translateQueue.push({
    context: context,
    schema: schema,
    path: path,
    key: key,
    blob: blob
  });
};

// CONFIG stuff
var findLevelsCommand = 'find ../../levels -name "*.js"';

var processLevelIndex = function() {
  var path = '../../levels';
  var sequenceInfo = require(path).sequenceInfo;

  var genNameContext = function(sequence) {
    var name = intl.getIntlKey(sequence, 'displayName');
    return [
      'This is a title of a level sequence "' + name + '" ',
    ].join('\n');
  };

  var genAboutContext = function(sequence) {
    var name = intl.getIntlKey(sequence, 'displayName');
    var about = intl.getIntlKey(sequence, 'about');
    return [
      'For the level sequence "' + name + '",',
      'the about section is:',
      '~~"' + about + '"',
      ''
    ].join('\n');
  };

  _.each(sequenceInfo, function(sequence) {
    translate(
      genNameContext(sequence),
      path,
      'displayName',
      sequence.displayName
    );

    translate(
      genAboutContext(sequence),
      path,
      'about',
      sequence.about
    );
  });
};

var processLevel = function(levelPath) {
  if (/index.js/.test(levelPath)) {
    return;
  }

  var level = require(levelPath).level;
  // TODO
};

child_process.exec(findLevelsCommand, function(err, output) {
  _.each(output.split('\n'), function(levelPath) {
    if (!levelPath || !levelPath.length) {
      return;
    }

    processLevel(levelPath);
  });

  processLevelIndex();
  shouldBegin.resolve();
});

var printContext = function(queueObj) {
  if (typeof queueObj.context === 'string') {
    console.log(queueObj.context);
  } else {
    var results = queueObj.context();
    if (results) { console.log(results); }
  }
};

var printSeparator = function() {
  var printLn = function() {
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  };

  var printSpace = function(num) {
    num = (num === undefined) ? 1 : num;
    for (var i = 0; i < num; i++) {
      console.log('\n');
    }
  };

  var printRandomEmoji = function() {
    var emojis = [
      ':D',
      '~~~ (> O o)> ~~~~',
      '(╯°□°)╯︵ ┻━┻',
      'ʕ •ᴥ•ʔ',
      '٩(⁎❛ᴗ❛⁎)۶',
      '୧(﹒︠ᴗ﹒︡)୨',
      '(̿▀̿ ̿Ĺ̯̿̿▀̿ ̿)̄',
      '( •_•)σ',
      'ಠ_ಠ',
      '¯\(º_o)/¯'
    ];

    var index = Math.floor(Math.random() * emojis.length);
    console.log(emojis[index]);
  };

  printLn();
  printSpace(1);
  printRandomEmoji();
  printSpace(1);
  printLn();
};

var collectInput = function(cb) {
  prompt.get(schema, function(err, result) {
    cb(result);
  });
};

var popTranslateQueue = function(queueObj) {
  var defer = Q.defer();
  printSeparator();
  printContext(queueObj);

  collectInput(function(input) {
    console.log(input);
    outputTranslation(queueObj, input);
    defer.resolve();
  });
  return defer.promise;
};

var appendLineAfterNeedleToFile = function(path, needle, line) {
  // silly relative paths
  var endPath;
  try {
    var easyPath = path + '.js';
    fs.readFileSync(easyPath);
    endPath = easyPath;
  } catch (err) {
  }
  if (!endPath) {
    // perhaps an index.js
    try {
      var indexPath = path + '/index.js';
      indexPath = indexPath.replace('//', '/');
      fs.readFileSync(indexPath);
      endPath = indexPath;
    } catch (err) {
    }
  }

  if (!endPath) {
    throw new Error('Could not find path ' + path + ' !!');
  }

  // ok now do the needle thing
  var fileContents = fs.readFileSync(endPath).toString();
  var fileLines = fileContents.split('\n');

  var toEscape = '()[]?+*'.split('');
  _.each(toEscape, function(chr) {
    needle = needle.replace(chr, '\\' + chr);
  });

  var regex = new RegExp(needle);
  var numberMatches = 0;
  _.each(fileLines, function(line) {
    if (regex.test(line)) {
      numberMatches++;
    }
  });

  if (numberMatches !== 1) {
    console.log('WARNING couldnt find needle\n', needle, 'in path\n', endPath);
    return;
  }

  // now output :OOO

};

var outputTranslation = function(queueObj, input) {
  console.log(queueObj.blob);
  var path = queueObj.path;
  var needle = queueObj.blob['en_US'];
  console.log('the needle \n', needle, '\n in path', path);

  appendLineAfterNeedleToFile(path, needle, 'haha');
};

shouldBegin.promise
.then(function() {
  // the tricky thing here is that we need to make a chain of promises
  var popChain = Q.defer();
  var promise = popChain.promise;
  _.each(translateQueue, function(queueItem) {
    promise = promise.then(function() {
      return popTranslateQueue(queueItem);
    });
  });

  popChain.resolve();
});



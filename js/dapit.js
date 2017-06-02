DapiT = (function(wheel){

  "use strict";

  /**
   * Dirty Testing object to be exported
   * messageBox and viewer are DOM
   * elements defined at runtime
   */
  var _DT = {
    messageBox : null,
    viewer : null,
    testList : [],
    failedList : [],
    logg : false,
    load_required : false
  }

  /**
   * Constants
   */
  const CONSOLE_ONLY = true

  /**
   * Counter for successful tests
   */
  let SUCCESS_COUNTER = 0

  /**
   * Initialize, load and setup according to config file
   * loading dapit.json
   * verbose is used to output more details on the console
   *
   */
  _DT.init = function(verbose = false) {

    // set extended logs
    if (verbose) {

      _DT.logg = true

    }

    // reset viewer
    _DT.viewer.innerText = '0 %';
    _DT.viewer.parentNode.classList.add('sleeping');
    _DT.viewer.parentNode.classList.remove('bad');
    _DT.viewer.parentNode.classList.remove('good');

    _DT.notify('loading configs ...')

    // Load configs
    wheel.get({ url : './dapit.json?' + _random() }, function(configs){

      // store configs
      _DT.configs = JSON.parse(configs)

      _DT.notify('loading tests ...')

      // load tests
      wheel.get({ url : _DT.configs.testsurl + '?' + _random() }, function(tests){

        // store tests array
        _DT.tests = JSON.parse(tests)

        // parse test array an store each test in the testList
        _fillTestList(_DT.tests)

        _DT.notify(_DT.testList.length + " tests, grouped in " + _DT.tests.length + " sets, are ready to run")

      });

      // render test details in the page
      // _renderTestsInfo();

    });

    // free lock
    _DT.load_required = false


    return true

  }

  /**
   * Run tests
   *
   */
  _DT.runTests = function() {

    // if lock is true load again configs and tests
    if (_DT.load_required) {

      _DT.notify('You need to load again the tests')
      return false

    }

    // check if any test has been loaded
    if (typeof _DT.tests === 'undefined') {

      _DT.notify('You need to load the tests first')
      return false

    }

    // set lock
    _DT.load_required = true

    // reset failed list
    _DT.failedList = []

    // reset counter
    SUCCESS_COUNTER = 0

    // update viewer
    _DT.viewer.parentNode.classList.add('sleeping')
    _DT.viewer.innerText = '0 %'

    _DT.notify('running ' + _DT.testList.length + ' tests ...')

    // loop through configs, tests and lunch ajax request for each test
    _DT.tests.forEach(function(test){

      _evalTest(test)

    });

    return true

  }

  /**
   * Print out a message on the messageBox and console
   *
   */
  _DT.notify = function(message, console_only = false) {

    console.log("--- DapiT --- " + message);

    if (!console_only) {

      _DT.messageBox.innerText = message;

    }

  }

  /**
   * Evaluate and perform a test
   *
   */
  function _evalTest(test) {

    if (_DT.logg) {

      console.log(test)

    }

    // load real test details if is a reference
    if (typeof test.ref !== 'undefined') {

      test = _loadRef(test)

    }

    if (_DT.logg) {

      console.log(test)

    }

    // switch between single test and set of tests
    if (typeof test.length === 'undefined') {

      _DT.notify('running test: ' + test.id + ' - ' + test.label);

      // execute the test
      // set delay to call
      // TODO that's not the proper way (no brain right now to think about a solution)
      // the call should be synchronous inside each set of tests
      _sleep((1000 * test.id)).then(() => {

        _call(test)

      })

    } else if (test.length > 1) {

      // recursively call eval test on set of tests
      test.forEach(function(subtest){

        _evalTest(subtest)

      });

    } else {

      _DT.notify('Error while parsing the test: ' + JSON.stringify(test))

    }

  }

  /**
   * Execute/Run a single test object
   *
   */
  function _call(test) {

    let isPost = true

    // switch according to request type
    if (typeof test.http === 'undefined' ||
        test.http === 'GET') {

      let url = _defineUrl(test)

      if (_DT.logg) {

        _DT.notify('calling url: ' + url + ' for test: ' + test.id, true)

      }

      wheel.get({ url : url }, function(response){

        _testCallback(response, test)

      });

    } else if (test.http === 'POST') {

      let url = _defineUrl(test, isPost),
          data = { url : url }

      if (_DT.logg) {

        _DT.notify('calling url: ' + url + ' for test: ' + test.id, true)

      }

      // check parameters attribute
      if (typeof test.parameters !== 'undefined') {

        data.parameters = test.parameters

      }

      wheel.post(data, function(response){

        _testCallback(response, test)

      });

    } else {

      _DT.notify('wrong sintax for \'http\' attribute on test ' + test.id)

    }

  }

  /**
   * Define url
   *
   */
  function _defineUrl(test, isPost = false) {

    let hasParameters = typeof test.parameters !== 'undefined'

    if (!isPost && hasParameters) {

      let pars = _serialize(test.parameters);

      return _DT.configs.baseurl + test.path + '?' + pars

    } else {

      return _DT.configs.baseurl + test.path

    }

  }

  /**
   * Test callback
   * evaluate request result, compare with
   * defined test answer
   *
   */
  function _testCallback(response, test) {

    _DT.notify('Test ' + test.id + ' done')

    // match response
    if (response == test.answer) {

      SUCCESS_COUNTER++

    } else {

      // add test to failed list
      _DT.failedList.push(test)

      _DT.notify('Test ' + test.id + ' failed')

    }

    // log response
    if (_DT.logg) {

      _DT.notify('Test ' + test.id + '\n\tReal Answer: ' + response + '\n\tExpected: ' + test.answer, CONSOLE_ONLY)

    }

    // update viewer
    _DT.viewer.innerText = Math.trunc((SUCCESS_COUNTER/_DT.testList.length)*100) + ' %'

    // look for tests end
    if ((_DT.failedList.length + SUCCESS_COUNTER) === _DT.testList.length) {

      _end()

    }

  }

  /**
   * All test have been run
   *
   */
  function _end() {

    // update viewer style

    _DT.viewer.parentNode.classList.remove('sleeping')

    if ((SUCCESS_COUNTER/_DT.testList.length) === 1) {

      _DT.notify('THE END - That\'s how you do!')

      _DT.viewer.parentNode.classList.add('good')

    } else {

      _DT.notify('THE END - You should fix something')

      _DT.viewer.parentNode.classList.add('bad')
      _DT.notify('\'DapiT.failedList\' to see ' + _DT.failedList.length + ' failed tests', CONSOLE_ONLY)

    }

  }

  /**
   * Is it json format?
   *
   */
  /*
  function _isJSON(text) {

    try {
      JSON.parse(text)
    } catch (error) {
      return false
    }
    return true;

  }
  */

  /**
   * Serialize object
   * used to serialize parameters object
   *
   */
  function _serialize(obj) {

    return Object.keys(obj).map(key => `${key}=${encodeURIComponent(obj[key])}`).join('&')

  }

  /**
   * Parse tests object and fill the testList
   *
   */
  function _fillTestList(tests) {

    if (typeof tests.length === 'undefined' ||
        tests.length < 1) {

      _DT.notify('Error while loading tests')
      return

    }

    // empty array
    _DT.testList = []

    // fill array
    tests.forEach(function(item){

      if (typeof item.id !== 'undefined') {

        _DT.testList.push(item)

      } else {

        if (typeof item.length === 'undefined' ||
            item.length < 1) {

          _DT.notify('Error loading test: ' + JSON.stringify(item), CONSOLE_ONLY)
          return

        }

        item.forEach(function(subitem){

          if (typeof subitem.id !== 'undefined') {

            _DT.testList.push(subitem)

          } else {

            _DT.notify('Error loading test: ' + JSON.stringify(subitem), CONSOLE_ONLY)

          }

        })

      }

    })

  }

  /**
   * Loop though testList and load test details
   * we basically create a new copy of the referenced test
   */
  function _loadRef(test) {

    // get real test details from test list
    let real_test = _DT.testList.find(x => x.id === test.ref)

    // override answer parameter
    if (typeof test.answer !== 'undefined') {

      real_test.answer = test.answer

    }

    // override test id
    real_test.id = test.id

    return real_test

  }

  /**
   * Render tests details in the page
   *
   */
  function _renderTestsInfo() {

    // ...

  }

  /**
   * Sleep time expects milliseconds
   *
   */
  function _sleep(ms) {

    return new Promise((resolve) => setTimeout(resolve, ms))

  }

  /**
   * Random int
   *
   */
  function _random() {

    return Math.trunc(Math.random()*1000000)

  }

  // export object
  return _DT

})(OldWheel);

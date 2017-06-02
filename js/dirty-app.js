window.addEventListener('load', function(){

  /**
   * DOM elements
   * Bubbles & Message Box
   */
  let loader = document.getElementById('test_loader'),
      runner = document.getElementById('test_runner'),
      viewer = document.getElementById('test_viewer'),
      messageBox = document.getElementById('dapit__messages');

  /**
   * Set viewer
   */
  DapiT.viewer = viewer;

  /**
   * Set message output box
   */
  DapiT.messageBox = messageBox;

  /**
   * Event listeners
   */
  loader.onclick = function(e){

    // add clicked style
    runner.parentNode.classList.remove('clicked');
    loader.parentNode.classList.add('clicked');

    // try to init()
    if (!DapiT.init()) {

      // remove clicked style
      loader.parentNode.classList.remove('clicked');

    }

  };
  runner.onclick = function(e){

    // add clicked style
    loader.parentNode.classList.remove('clicked');
    runner.parentNode.classList.add('clicked');

    // try to run tests
    if (!DapiT.runTests()) {

      // remove clicked style
      runner.parentNode.classList.remove('clicked');

    }

  };

});

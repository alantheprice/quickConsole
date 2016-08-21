# Quick Console.

A small and simple project to add a very simple console to an html page.
It is designed to be used in situations where the full featured, powerful browser dev tools aren't available.  for instance in a webview inside of a mobile application.  It captures console.[log, error, warn, info] and outputs them to a console that fills half the screen. 

Any messages that are typed into the console input will attempt to use `eval` to execute.  If that is not available (for instance in the instance of a content security policy that disallows unsafe `eval`), it will fall back to a simpler, but still powerful executor that can call single functions and output properties.

# Usage: 
1. Add to your page like so: `<script src="quickConsole.js" type="text/javascript" charset="utf-8"></script>`
2. You can toggle it in two ways: 
  1. Within your javascript call: `quickConsole.toggleConsole();`
  2. Register the key command on an element: 
    ```
    var elem = document.getElementById("yourId");
    quickConsole.registerToggleHandler(elem);
    ```
    * Now when that element is in focus and you press "Ctrl + Alt + Shift + d", you will toggle the quickConsole.
  3. Once the quick-console is open, it can be removed anytime by pressing "Ctrl + Alt + Shift + d" when focused on the input box.



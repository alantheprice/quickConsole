# Quick Console.

A small and simple project to add a very simple console to an html page.
It is designed to be used in situations where the full featured, powerful browser dev tools aren't available.  for instance in a webview inside of a mobile application.  It captures console.[log, error, warn, info] and outputs them to a console that fills half the screen. 

Any messages that are typed into the console input will attempt to use `eval` to execute.  If that is not available (for instance in the instance of a content security policy that disallows unsafe `eval`), it will fall back to a simpler, but still powerful executor that can call single functions and output properties.

# Usage: 
1. Add to your page like so: `<script src="quickConsole.js" type="text/javascript" charset="utf-8"></script>`
2. Within your javascript call: `quickConsole.init(config)`; 
3. you can toggle the console by pressing "Ctrl + Alt + Shift + D".
4. Once the quick-console is open, it can be removed anytime by pressing "Ctrl + Alt + Shift + d" when focused on the input box.

# Features:
1. Tab to complete
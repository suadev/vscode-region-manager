A simple vs code extension that helps to create/delete #regions quickly.
(i don't recommend to use #region. It's actually an anti-pattern. <strong>Instead of using #region, refactor your class or method.</strong>)

## Supported Languages / Frameworks

* csharp, visualbasic
* javascript, typescript 
* react and angular applications which is created by using typescript or javascript (supporting .ts, .tsx, .jsx files)

<strong>P.S.</strong> Feel free to add more language support

## Features

* Select some piece of code and use (ctrl+r, ctrl+e), type your region name and press enter.

* Or select some piece of code, press F1 and type "Move into #region".

* To remove region, click the line that contains '#region' and use (ctrl+r, ctrl+e).

* To remove all #regions in the active document, press F1 and type "Remove all #regions" and press enter. See the screencast below.

## Configuration ( v.1.0.8 and later )

* `vscode-region-manager.nameOnEndRegion`: Adds the region name to the `#endregion` tag as well (defaults to **false**)

* `vscode-region-manager.innerSpacing`: Adds an empty line after the `#region` and before the `#endregion` tags (defaults to **true**)

<strong>c# use case</strong>;

<img src= "https://raw.githubusercontent.com/suadev/vscode-region-manager/master/screencast.gif" />


## Release Notes

### 1.0.10

Extension renamed to 'vscode-region-manager'

### 1.0.9

In addition to c#,  js, ts and vb support was added.

### 1.0.8

Added 'vscode-region-manager.nameOnEndRegion' and 'vscode-region-manager.innerSpacing' config parameters

# Cordova and Meteor mashup using grunt

This is a set of ad-hoc grunt tasks that lets you insert a meteor app inside
a apache cordova one.

## * NOTICE:*
* This experiment is just a bunch of grunt task I use to bundle client-only
meteor apps. I used them to both insert these meteor apps in cordova and
jekyll projects. This repository only has the phonegap part, if someone is
interested, I can add the jekyll one.*

* This haven't been tested in an online context! *

To start using this you need, [`meteor`](https://www.meteor.com/),
[`cordova`](http://cordova.apache.org/) and [`grunt`](http://gruntjs.com/)
globally installed:

```
$ curl https://install.meteor.com/ | sh
$ npm install -g cordova
$ npm install -g grunt-cli
```

There are 2 main grunt tasks:
- `grunt init`: creates all the folder structure:
  - creates meteor project
  - creates cordova project
  - add Firefox OS platform to cordova.
- `grunt try`: deploys the cordova app and injects all the necessary styles and scripts:
  - bundle meteor app to temp directory
  - copy assets from bundled directory into cordova folders
  - `cordova prepare`
  - patch `platforms/firefoxos/www/index.html` file with the following content:

```
<link rel="stylesheet" type="text/css" href="css/meteor-bundled-css-file.css">
<script type="text/javascript">
  __meteor_runtime_config__ = {
    'meteorRelease':'0.8.2',
    'ROOT_URL':'',
    'ROOT_URL_PATH_PREFIX':'',
    'DDP_DEFAULT_CONNECTION_URL':''
  };
</script>

<script type="text/javascript" src="js/meteor-bundled-js-file.js"></script>
<script type="text/javascript">
  Meteor.disconnect(); \\ to stop trying to reach the server
  UI.body.INSTANTIATED = true; \\ to "trick" meteor not to inject the main template in the body

  if (typeof Package === 'undefined' ||
      ! Package.webapp ||
      ! Package.webapp.WebApp ||
      ! Package.webapp.WebApp._isCssLoaded())
    document.location.reload(); 

  Meteor.startup(function () {
    // https://github.com/meteor/meteor/blob/master/packages/templating/plugin/html_scanner.js#L178
    UI.body.INSTANTIATED = true;
    UI.DomRange.insert(UI.render(UI.body).dom, document.querySelector('#meteor-app-container') );
  });
</script>
```
## Configuration

Inside the grunt file you'll find a `conf` object, with the following properties:

- `app.name`: The name to be used to call `meteor create` and `cordova create`
- `app.cordovaDomContainerId`: The id of the element inside the cordova index file, that will hold the meteor app. Default: `meteor-app-container`.
- `app.createCordovaDomContainer`: If you want the script to create that DOM element for you. Default: `true`.
- `meteor.rootUrl`: Meteor `ROOT_URL`. Default: empty string.
- `meteor.rootUrlPathPrefix`: Meteor `ROOT_URL_PATH_PREFIX`. Default: empty string.
- `meteor.ddpDefaultConnectionUrl`: Meteor `DDP_DEFAULT_CONNECTION_URL`. Default: empty string.
- `meteor.disconnectByDefault`: If you want `Meteor.disconnect()` to be called. Default: `true`.
- `folders.temp`: The temp folder for `meteor bundle`.
- `folders.cordovaProject`: The folder to hold the cordova project. Default: `cordova`.
- `folders.meteorProject`: The folder to hold the meteor project. Default: `meteor`.

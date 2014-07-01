### Cordova and Meteor mashup using grunt

This is a set of ad-hoc grunt tasks that lets you insert a meteor app inside
a apache cordova one.

#### _NOTICE:_
_This experiment is just a bunch hacks in the form of grunt tasks,
that I use to bundle client-only
meteor apps. I used them to both insert these meteor apps in cordova and
jekyll projects. This repository only has the phonegap part, if someone is
interested, I can add the jekyll one._

_This haven't been tested neyond my use case, and isn't reliable!_


#### Getting started

To start using this, you need [`meteor`](https://www.meteor.com/),
[`cordova`](http://cordova.apache.org/) and [`grunt`](http://gruntjs.com/)
globally installed:

```
$ curl https://install.meteor.com/ | sh
$ npm install -g cordova
$ npm install -g grunt-cli
```

And install dependencies
```
npm install
```

#### Tasks

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

```html
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
  Meteor.disconnect(); // stop trying to reach the server
  UI.body.INSTANTIATED = true; // "trick" meteor not to inject the main template in the body

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

#### See it in Action
Now, to see the result you need to start the [Firefox App Manager](https://developer.mozilla.org/en-US/Firefox_OS/Using_the_App_Manager).

![](/docs/screenshot1.jpg)

1. Open `about:app-manager` in firefox.
2. Add the app to the manager. Point to the `<cordova-folder>/platforms/firefoxos/www/` directory. There's a `manifest.webapp` file inside.
3. Your app is loaded.
4. Start the simulator.
5. Once the similator is up, click `DEBUG` to start debugging your app.

##### The result
![](/docs/screenshot2.jpg)

#### Configuration

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

#### Notes
I've used Firefox OS because it's faster and easier to debug. If you want to target
other platforms add them to the
[`init` task](https://github.com/merunga/cordova-meteor-mashup/blob/master/Gruntfile.js#L35),
and add the platform `index.html` file to the 
[list of files to be patched](https://github.com/merunga/cordova-meteor-mashup/blob/master/Gruntfile.js#L125).

#### License
MIT


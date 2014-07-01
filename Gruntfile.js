var http = require('http');
var $ = require('cheerio');
var path = require('path');

var conf = {
  app: {
    name: 'example',
    cordovaDomContainerId: 'meteor-app-container',
    createCordovaDomContainer: true
  },
  meteor: {
    rootUrl: '',
    rootUrlPathPrefix: '',
    ddpDefaultConnectionUrl: '',
    disconnectByDefault: true
  },
  folders: {
    temp: 'tmp',
    cordovaProject: 'cordova',
    meteorProject: 'meteor'
  }
};

module.exports = function(grunt) {
  grunt.initConfig({
    //bowerDirectory: require('bower').config.directory,
    exec: {
      init: {
        cmd: [
          "meteor create <%= app.name %>",
          "mv <%= app.name %> <%= folders.meteorProject %>",
          "cordova create <%= app.name %> <%= app.name %> <%= app.name %>",
          "mv <%= app.name %> <%= folders.cordovaProject %>",
          "cd <%= folders.cordovaProject %>",
          "cordova platform add firefoxos"
        ].join(' && ')
      },
      meteorBundle: {
        cmd: [
          "cd <%= folders.meteorProject %>",
          "meteor bundle --directory ../<%= folders.temp %>"
        ].join(' && ')
      },
      cordovaBuild: {
        cmd: [
          "cd <%= folders.cordovaProject %>",
          "cordova prepare"
        ].join(' && ')
      }
    },
    copy: {
      meteorPublicAssets: {
        expand: true,
        cwd: '<%= folders.temp %>/programs/client/assets/',
        src: ['**/*.{json,mp3,ogg}'],
        dest: '<%= folders.cordovaProject %>/www/'
      },
      appPackagedJs: {
        expand: true,
        flatten: true,
        src: '<%= folders.temp %>/programs/client/*.js',
        dest: '<%= folders.cordovaProject %>/www/js/'
      },
      appPackagedCss: {
        expand: true,
        flatten: true,
        src: '<%= folders.temp %>/programs/client/*.css',
        dest: '<%= folders.cordovaProject %>/www/css/'
      },
    },
    clean: ["<%= folders.temp %>"],
  });

  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.config.set('app.name', conf.app.name);
  grunt.config.set('meteor.prodPort', conf.meteor.prodPort);
  grunt.config.set('meteor.devPort', conf.meteor.devPort);
  grunt.config.set('folders.temp', conf.folders.temp);
  grunt.config.set('folders.cordovaProject', conf.folders.cordovaProject);
  grunt.config.set('folders.meteorProject', conf.folders.meteorProject);

  grunt.registerTask('patchMeteorPackages', function() {
    var packagesContent = [
      "# Meteor packages used by this project, one per line.",
      "#",
      "# 'meteor add' and 'meteor remove' will edit this file for you,",
      "# but you can also edit it by hand.",
      "",
      "# Meteor packages used by this project one per line.",
      "#",
      "# meteor add and meteor remove will edit this file for you",
      "# but you can also edit it by hand.",
      "",
      "meteor",
      "webapp",
      "logging",
      "deps",
      "session",
      "livedata",
      "mongo-livedata",
      "ui",
      "spacebars",
      "templating",
      "check",
      "underscore",
      "jquery",
      "random",
      "ejson",
      "less",
      ""
    ].join('\n');

    grunt.file.write(
      path.join(conf.folders.meteorProject,'.meteor/packages'),
      packagesContent
    );
  });

  grunt.registerTask('patchCordovaIndex', function() {
    var meteor = conf.meteor;

    var fileToPatch = path.join(conf.folders.cordovaProject, 'platforms/firefoxos/www/index.html');
    var indexSrcCode = grunt.file.read(fileToPatch);
    var $indexHtml = $.load(indexSrcCode);

    var meteorBundledClientPath = path.join(conf.folders.temp, '/programs/client/');

    function getAssetName(extGlob) {
      var globPath = path.join(meteorBundledClientPath,extGlob);
      var filePath = grunt.file.expand(globPath);

      return path.basename(filePath);
    }

    var jsFileName = getAssetName('*.js');
    var cssFileName = getAssetName('*.css');

    var $patch =$([
      "<link rel='stylesheet' type='text/css' href='css/"+cssFileName+"' />",
      "<script type='text/javascript'>",
      "  __meteor_runtime_config__ = {",
      "    'meteorRelease':'0.8.2',",
      "    'ROOT_URL':'"+meteor.rootUrl+"',",
      "    'ROOT_URL_PATH_PREFIX':'"+meteor.rootUrlPathPrefix+"',",
      "    'DDP_DEFAULT_CONNECTION_URL':'"+meteor.ddpDefaultConnectionUrl+"'",
      "  };",
      "</script>",
      "",
      "<script type='text/javascript' src='js/"+jsFileName+"'></script>",
      "<script type='text/javascript'>",
      "  "+(meteor.disconnectByDefault? 'Meteor.disconnect();': ''),
      "  UI.body.INSTANTIATED = true;",
      "",
      "  if (typeof Package === 'undefined' ||",
      "      ! Package.webapp ||",
      "      ! Package.webapp.WebApp ||",
      "      ! Package.webapp.WebApp._isCssLoaded())",
      "    document.location.reload(); ",
      "",
      "  Meteor.startup(function () {",
      "    UI.body.INSTANTIATED = true;",
      "    UI.DomRange.insert(UI.render(UI.body).dom, document.querySelector('#"+conf.app.cordovaDomContainerId+"') );",
      "  });",
      "</script>",
    ].join('\n\t'));

    $indexHtml('head').append($patch);

    if(conf.app.createCordovaDomContainer) {
      $indexHtml('body').prepend("<div id='"+conf.app.cordovaDomContainerId+"'></div>");
    }

    grunt.file.write(fileToPatch, $indexHtml.html());
  });

  grunt.registerTask('init', function() {
    grunt.task.run('exec:init', 'patchMeteorPackages');
  });

  grunt.registerTask('try', function() {
    grunt.task.run([
      "exec:meteorBundle","copy","exec:cordovaBuild", "patchCordovaIndex", "clean"
    ]);
  });
};

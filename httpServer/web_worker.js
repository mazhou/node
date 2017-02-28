var log4js = require('log4js');
var web_DB_config = require("./web_DB_config.js");
var http = require('http');
var url = require("url");
var path = require("path");
var ejs = require('ejs');
var fs = require("fs");
var querystring = require("querystring");
var workDir = '../pageHandler';
var mfm = require('./'+workDir+'/controllers/mainFrame');
var config = require('./'+workDir+'/models/PageConfig');
var route = require('./'+workDir+'/models/Route');

var root = this;
var workerList = new Array();

log4js.configure(config.log4jConfig);
var logger = log4js.getLogger("web");
//*****pageHandler*****/
exports.runPageServer = function( port )
{
	port = port || config.svrPort;
	logger.info('Collector Server 127.0.0.1:'+ port );
	console.log('Collector Server 127.0.0.1:'+ port );

	var server = http.createServer(function(req, res){

			var _bufData = '';
			req.on('data', function(chunkData)
				{
				_bufData += chunkData;
				})
			.on('end', function()
				{
				var reqData;
				if( "POST" == req.method.toUpperCase() )
				{
				if(req.headers.accept.indexOf('application/json')!=-1)
				{
				reqData = JSON.parse(_bufData);
				}else
				{
				reqData = querystring.parse(_bufData);
				}
				}
				req.post = reqData;
				handlerRequest(req, res);
				});

	}).listen(port);

	//	setInterval(function(){sreadRedisHandler();},30);
	logger.info('Collector Server 10.200.91.120:'+ port +'/'+ Date());
}

/**
 * All requests entries.
 */
var handlerRequest = function(req, res){
  var actionInfo = route.getActionInfo(req.url, req.method);
    if(actionInfo.action){
        if( actionInfo.action != "querySummaryInfoData")
        {
            logger.warn("actionInfo:"+actionInfo.action + " controller: " + actionInfo.controller);
        }

        var controller = require('./'+workDir+'/controllers/'+actionInfo.controller);
        if(controller[actionInfo.action]){
            var ct = new controllerContext(req, res);
            controller[actionInfo.action].apply(ct, actionInfo.args);
        }else{
            handler500(req, res, 'Error: controller "' + actionInfo.controller + '" without action "' + actionInfo.action + '"')
        }
    }else{
            staticFileServer (req, res);
    }
};

/**
 * Context object for controller.
 */
var controllerContext = function(req, res){
    this.req = req;
    this.res = res;
    this.handler404 = handler404;
    this.handler500 = handler500;
};


controllerContext.prototype.render = function(viewName, context){
    viewEngine.render(this.req, this.res, viewName, context);
};

controllerContext.prototype.renderJson = function(json){
    viewEngine.renderJson(this.req, this.res, json);
};


controllerContext.prototype.responseDirect = function(status,content_type,data){
    viewEngine.responseDirect(this.req,this.res,status,content_type,data);
};

/**
 * Render engine in two modes.
 */
var viewEngine = {
	render:function(req,res,viewNames,ctx){
		var hfile = path.join(__dirname,workDir+'/views',viewNames[0]);
		var templates = fs.readFileSync(hfile,'utf-8');
		var jsfile = viewNames.length > 1 ? path.join(__dirname,'./'+workDir+'/views',viewNames[1]) : null;
		var js = jsfile != null ? fs.readFileSync(jsfile,'utf-8') : '';
	
	// Use ejs render views
	  try{
			var content = ejs.render(templates,ctx);
			var layout = fs.readFileSync(path.join(__dirname,'./'+workDir+'/views','layout.html'),'utf-8');
	    var output = ejs.render(layout,{script:js,body:content});
	    res.writeHead(200,{'Content-type' : 'text/html'});
			res.end(output);
	  }catch(err){
	      handler500(req, res, err);
	      return;
 	 }
  },
	responseDirect:function(req,res,status,content_type,data){
  	res.writeHead(status,{'content-type':content_type});
  	res.end(data);
  }
};

var handler404 = function(req, res){
	logger.info("404"+req.url);
	res.writeHead(404, {'Content-Type': 'text/plain'});
	res.end('Page Not Found');
};

var handler500 = function(req, res, err){
    res.writeHead(500, {'Content-Type': 'text/plain'});
	res.end(err);
};



/**
 * Static files handler.
 */
var staticFileServer = function(req, res, filePath){
	//return;
  if(!filePath){
  //filePath = path.join(__dirname, config.staticFileDir, url.parse(req.url).pathname);
	filePath = path.join(__dirname, url.parse(req.url).pathname);
  }

  fs.exists(filePath, function(exists) {
      if(!exists) {  
          handler404(req, res);  
          return;  
      }  

      fs.readFile(filePath, "binary", function(err, file) {  
          if(err) {  
              handler500(req, res, err);
              return;  
          }
          
          var ext = path.extname(filePath);
          ext = ext ? ext.slice(1) : 'html';
          res.writeHead(200, {'Content-Type': contentTypes[ext] || 'text/html'});
          res.write(file, "binary");
          res.end();
      });  
  });
};

/**
 * All content types.
 */
var contentTypes = {
  "aiff": "audio/x-aiff",
  "arj": "application/x-arj-compressed",
  "asf": "video/x-ms-asf",
  "asx": "video/x-ms-asx",
  "au": "audio/ulaw",
  "avi": "video/x-msvideo",
  "bcpio": "application/x-bcpio",
  "ccad": "application/clariscad",
  "cod": "application/vnd.rim.cod",
  "com": "application/x-msdos-program",
  "cpio": "application/x-cpio",
  "cpt": "application/mac-compactpro",
  "csh": "application/x-csh",
  "css": "text/css",
  "deb": "application/x-debian-package",
  "dl": "video/dl",
  "doc": "application/msword",
  "drw": "application/drafting",
  "dvi": "application/x-dvi",
  "dwg": "application/acad",
  "dxf": "application/dxf",
  "dxr": "application/x-director",
  "etx": "text/x-setext",
  "ez": "application/andrew-inset",
  "fli": "video/x-fli",
  "flv": "video/x-flv",
  "gif": "image/gif",
  "gl": "video/gl",
  "gtar": "application/x-gtar",
  "gz": "application/x-gzip",
  "hdf": "application/x-hdf",
  "hqx": "application/mac-binhex40",
  "html": "text/html",
  "ice": "x-conference/x-cooltalk",
  "ief": "image/ief",
  "igs": "model/iges",
  "ips": "application/x-ipscript",
  "ipx": "application/x-ipix",
  "jad": "text/vnd.sun.j2me.app-descriptor",
  "jar": "application/java-archive",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "js": "text/javascript",
  "json": "application/json",
  "latex": "application/x-latex",
  "lsp": "application/x-lisp",
  "lzh": "application/octet-stream",
  "m": "text/plain",
  "m3u": "audio/x-mpegurl",
  "man": "application/x-troff-man",
  "me": "application/x-troff-me",
  "midi": "audio/midi",
  "mif": "application/x-mif",
  "mime": "www/mime",
  "movie": "video/x-sgi-movie",
  "mp4": "video/mp4",
  "mpg": "video/mpeg",
  "mpga": "audio/mpeg",
  "ms": "application/x-troff-ms",
  "nc": "application/x-netcdf",
  "oda": "application/oda",
  "ogm": "application/ogg",
  "pbm": "image/x-portable-bitmap",
  "pdf": "application/pdf",
  "pgm": "image/x-portable-graymap",
  "pgn": "application/x-chess-pgn",
  "pgp": "application/pgp",
  "pm": "application/x-perl",
  "png": "image/png",
  "pnm": "image/x-portable-anymap",
  "ppm": "image/x-portable-pixmap",
  "ppz": "application/vnd.ms-powerpoint",
  "pre": "application/x-freelance",
  "prt": "application/pro_eng",
  "ps": "application/postscript",
  "qt": "video/quicktime",
  "ra": "audio/x-realaudio",
  "rar": "application/x-rar-compressed",
  "ras": "image/x-cmu-raster",
  "rgb": "image/x-rgb",
  "rm": "audio/x-pn-realaudio",
  "rpm": "audio/x-pn-realaudio-plugin",
  "rtf": "text/rtf",
  "rtx": "text/richtext",
  "scm": "application/x-lotusscreencam",
  "set": "application/set",
  "sgml": "text/sgml",
  "sh": "application/x-sh",
  "shar": "application/x-shar",
  "silo": "model/mesh",
  "sit": "application/x-stuffit",
  "skt": "application/x-koan",
  "smil": "application/smil",
  "snd": "audio/basic",
  "sol": "application/solids",
  "spl": "application/x-futuresplash",
  "src": "application/x-wais-source",
  "stl": "application/SLA",
  "stp": "application/STEP",
  "sv4cpio": "application/x-sv4cpio",
  "sv4crc": "application/x-sv4crc",
  "svg": "image/svg+xml",
  "swf": "application/x-shockwave-flash",
  "tar": "application/x-tar",
  "tcl": "application/x-tcl",
  "tex": "application/x-tex",
  "texinfo": "application/x-texinfo",
  "tgz": "application/x-tar-gz",
  "tiff": "image/tiff",
  "tr": "application/x-troff",
  "tsi": "audio/TSP-audio",
  "tsp": "application/dsptype",
  "tsv": "text/tab-separated-values",
  "txt": "text/plain",
  "unv": "application/i-deas",
  "ustar": "application/x-ustar",
  "vcd": "application/x-cdlink",
  "vda": "application/vda",
  "vivo": "video/vnd.vivo",
  "vrm": "x-world/x-vrml",
  "wav": "audio/x-wav",
  "wax": "audio/x-ms-wax",
  "wma": "audio/x-ms-wma",
  "wmv": "video/x-ms-wmv",
  "wmx": "video/x-ms-wmx",
  "wrl": "model/vrml",
  "wvx": "video/x-ms-wvx",
  "xbm": "image/x-xbitmap",
  "xlw": "application/vnd.ms-excel",
  "xml": "text/xml",
  "xpm": "image/x-xpixmap",
  "xwd": "image/x-xwindowdump",
  "xyz": "chemical/x-pdb",
  "zip": "application/zip"
};

var timely_share_rate = [];
var timely_overload_data = {};
//var timely_rtmfp_data = {};
exports.get_timely_data= function()
{
	logger.info("web worker:  get timely data !");
	return timely_share_rate;
};
	
exports.get_timely_overload_data = function()
{
	logger.info("web worker:  get timely overload data !");
	return timely_overload_data;
};
process.on('message', function(msg) {
//    logger.debug("received parent process message: " + JSON.stringify(msg));
//logger.info("web worker: "+JSON.stringify(msg));
    timely_share_rate = msg["timely_share_rate"];
    timely_overload_data = msg["timely_overload_data"];
});
process.on('uncaughtException',function(err) {
	logger.error("web work uncaught exception:  " + err + "\n" + err.stack);
});
var s_runPage = this.runPageServer(  );
steal({id: "./less_engine.js",ignore: true},function(){

    // only if rhino and we have less
    if(steal.isRhino && window.less) {
        // Some monkey patching of the LESS AST
        // For production builds we NEVER want the parser to add paths to a url(),
        // the CSS postprocessor is doing that already.
        /*(function(tree) {
            var oldProto = tree.URL.prototype;
            tree.URL = function (val, paths) {
                if (val.data) {
                    this.attrs = val;
                } else {
                    this.value = val;
                    this.paths = paths;
                }
            };
            tree.URL.prototype = oldProto;
            String.prototype.trim=function(){
                return this.replace(/^\s+|\s+$/g, '');
            };
            Array.isArray = function(o) {
                return Object.prototype.toString.call(o) === '[object Array]';
            };
            Array.prototype.reduce = function(callback, opt_initialValue){
                if (null === this || 'undefined' === typeof this) {
                    // At the moment all modern browsers, that support strict mode, have
                    // native implementation of Array.prototype.reduce. For instance, IE8
                    // does not support strict mode, so this check is actually useless.
                    throw new TypeError(
                        'Array.prototype.reduce called on null or undefined');
                }
                if ('function' !== typeof callback) {
                    throw new TypeError(callback + ' is not a function');
                }
                var index = 0, length = this.length >>> 0, value, isValueSet = false;
                if (1 < arguments.length) {
                    value = opt_initialValue;
                    isValueSet = true;
                }
                for ( ; length > index; ++index) {
                    if (!this.hasOwnProperty(index)) continue;
                    if (isValueSet) {
                        value = callback(value, this[index], index, this);
                    } else {
                        value = this[index];
                        isValueSet = true;
                    }
                }
                if (!isValueSet) {
                    throw new TypeError('Reduce of empty array with no initial value');
                }
                return value;
            };
        })(less.tree);*/
    }

    /**
     * @page steal.less steal.less
     * @parent stealjs
     * @plugin steal/less
     *
     * @signature `steal('path/to/filename.less')`
     *
     * @param {String} path the relative path from the current file to the coffee file.
     * You can pass multiple paths.
     * @return {steal} returns the steal function.
     *
     *
     * @body
     *
     * Lets you build and compile [http://lesscss.org/ Less ] css styles.
     * Less is an extension of CSS that adds variables, mixins, and quite a bit more.
     *
     * You can write css like:
     *
     *     @@brand_color: #4D926F;
     *     #header {
	    *       color: @@brand_color;
     *     }
     *     h2 {
	    *       color: @@brand_color;
     *     }
     *
     * ## Use
     *
     * First, create a less file like:
     *
     *     @@my_color red
     *
     *     body { color:  @@my_color; }
     *
     *
     * Save this in a file named `red.less`.
     *
     * Next, you have to add the less entry to the `stealconfig.js` file so it
     * looks like this:
     *
     *     steal.config({
	     *         ext: {
	     *             less: "steal/less/less.js"
	     *         }
	     *     });
     *
     * This will automatically load the Less parser when the Less file is
     * loaded. It's expected that all Less files end with `less`.
     *
     * You can steal the Less file like any other file:
     *
     *     steal('filename.less')
     *
     */

    var imports = "",
        env,
        envCreated = false,
        lessString,
        bound = false,
        parser,
        createImport,
        createStyle;

    createImport = function(path){
        return "@import \""+path+"\";\n";
    };

    createStyle = function(text){
        var tag = document.createElement('style');
        tag.setAttribute('type',"text/less");
        if ( tag.styleSheet ) { // IE
            tag.styleSheet.cssText = text;
        } else {
            (function( node ) {
                if ( tag.childNodes.length ) {
                    if ( tag.firstChild.nodeValue !== node.nodeValue ) {
                        tag.replaceChild(node, tag.firstChild);
                    }
                } else {
                    tag.appendChild(node);
                }
            })(document.createTextNode(text));
        }
        document.getElementsByTagName("head")[0].appendChild(tag);
    };

    parser = new less.Parser();

    steal.type("less", function(options, success, error){
        var src = options.src+"",
            base = "" + window.location,
            url = src.match(/([^\?#]*)/)[1];

        //set up imports for use in development mode
        //these are injected in to a parent less style block
        //and evaluated using less.refresh() below
        imports += createImport(options.id.path);

        if(steal.isRhino){
            url = Envjs.uri(url, base);
            lessString = createImport(url);

            less.env = 'development';

            parser.parse(lessString, function (e, tree) {
                if (e) {
                    console.log(e);
                    error();
                } else {
                    options.text = tree.toCSS({compress: true });
                    success();
                }
            });

        }else{
            if(!bound){
                bound = true;
                steal.one("end", function(){
                    createStyle(imports);
                    less.env = "production";
                    less.dumpLineNumbers = 'all';
                    less.refresh();
                });
            }
            options.text = "";
            success();
        }

    });
});
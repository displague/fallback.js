// The loader object handles asynchronously loading of all the files for the library. It acts as a middle man between
// the `require` function and our loader libraries. Loader libraries for example being `loaderImage.js`,
// `loaderStylesheet.js` and `loaderJavaScript.js`. Those individual libraries are treated as non-logic based loaders.
// Their sole purpose is to simply load a specific URL, then let us know whether it load successfully or not. Any and
// all logic which performs trying additional fallbacks and checks lives within the loader object.
var loader = {};

// Initialization function for our loader object.
loader.init = function() {
	// Automatically configure our library via attributes being set on any `script` elements on the page.
	loader.init.autoloader();
};

// If the attributes `base` or `data-base` are found on any of the `script` tags within the page when the library is
// loaded, automatically set the `base` variable for our configuration to that `value`. If the attributes `main` or
// `data-main` are found on any of the `script` tags when the library is loaded on the page, automatically load up that
// `value` as a module. If the `value` is a comma delimited string, we'll split on the comma and load each separately.
loader.init.autoloader = function() {
	// Fetch `base` and/or `data-base`.
	var base = me.normalizeStringSeries(loader.js.attributes('base'));

	// If our `attribute` exists, then configure it.
	if (base.length) {
		// Since `me.autoloader` will return an `Array` series, only use the first value of our `Array`.
		me.config({
			base: base.shift()
		});
	}

	// Fetch `main` and/or `data-main`.
	var main = me.normalizeStringSeries(loader.js.attributes('main'));

	// If our `attribute` exists, then `require` it.
	if (main.length) {
		me.require(main);
	}
};

// Attempt to load our module.
loader.boot = function(module) {
	// If we made it this far, we need to actually process the module in question.
	module.loader.working = true;

	// Set our start time for statistics.
	module.loader.timeStart = new Date().getTime();

	// Setup our temporary variables to use for our working URLs.
	module.loader.workingURLs = me.arrayClone(module.urls);

	// Make sure to clone our URLs array as we're going to be manipulating it.
	loader.urls(module);
};

// Patch for legacy browsers which sometimes fire off `onreadystatechange` instead of the `onload` callback. @ie
loader.onReadyStateChange = function(element, callback) {
	// Attach the event to the element.
	element.onreadystatechange = function() {
		if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
			// Explicity remove the callback after we receive it.
			// Some versions of IE tend to fire off multiple success events. @ie
			element.onreadystatechange = null;

			// Fire off our callback.
			callback();
		}
	};
};

// Load the URLs passed in for the module in question. This will run a loop through each of the URLs, attempting to
// load one at a time, only stopping when either all URLs have been exhausted or a URL has loaded successfully. Other
// specific checks that determine whether or not a library was actually loaded properly are defined within the loader
// scripts themselves.
loader.urls = function(module) {
	// Reference our working URLs.
	var urls = module.loader.workingURLs;

	// If we've exhausted all URLs available for the module, then the library has failed to load.
	if (!urls.length) {
		return loader.urls.failed(module);
	}

	// Shift our URL off of the `Array`, that way if we have to loop around, we don't retry the same URL again.
	var url = urls.shift();

	// Throw a log message to the end user.
	me.log(3, 'loader', 'Requesting to load `' + module.name + '` via `' + url + '`');

	// Call upon our specific loader script to load our URL.
	loader[module.identity].boot(module, url, loader.urls.success, loader.urls.failed, module.identity);
};

// Common operations to perform whether a module loaded successfully or not.
loader.urls.completed = function(module, success) {
	// Flag our module has having already attempted to load.
	module.loader.loaded = true;

	// Set our end time for statistics.
	module.loader.timeEnd = new Date().getTime();

	// Flag our module as no longer in a working/in progress state.
	module.loader.working = false;

	// Fire off all of our callbacks.
	me.module.invoke.callbacks(module.name, success);
};

// When a URL or module fails to load this function will be called.
loader.urls.failed = function(module, url) {
	// Legacy IE fires off the failed callback more than once, so we'll double check to see if we've already fired it. @ie
	if (me.indexOf(module.loader.failed, url) !== -1) {
		return;
	}

	// Setup our log message that we'll send to the end user.
	var message = '`' + module.name + '` failed to load ';

	// If there's no URL, then all URLs have been exhausted!
	if (!url) {
		loader.urls.completed(module, false);
		me.log(2, 'loader', message + 'module.');
		return;
	}

	// Reset the anonymous module name.
	me.define.anonymous.reset();

	// Let the end user know which specific URL failed to load.
	module.loader.failed.push(url);
	me.log(3, 'loader', message + 'for URL: ' + url);

	// Try the next URL in our URLs list.
	loader.urls(module);
};

// When a URL loads sucessfully this function will be called.
loader.urls.success = function(module, url, factory, predefined) {
	// We're going to store the name of the module we're attempting to load here. This way if the file that's loaded
	// happens to call the `define` function with an anonymous name, this is the name that we'll use for the definition.
	me.define.anonymous(module.name);

	// If our library was already loaded, we don't know what URL was successful, so we'll skip setting it.
	if (predefined === true) {
		me.log(3, 'loader', '`' + module.name + '` already loaded on the page; referencing.');
	} else {
		module.loader.success = url;
		me.log(3, 'loader', '`' + module.name + '` loaded successfully `' + url + '`.');
	}

	// If we have a `init` function, we'll run it now.
	if (me.isFunction(module.init)) {
		module.init();
	}

	// If we don't have a factory for our module, then there was no definition. Regardless of what our value is we'll
	// reference it here.
	if (!me.isDefined(module.factory)) {
		module.factory = factory;
		module.invoked = true;
	}

	// Wrap up the loader process and handle our callbacks.
	loader.urls.completed(module, true);
};

// Reference the module within the library.
me.loader = loader;

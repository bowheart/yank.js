(function(global) {
	// global container for all loaded modules
	var modules = {
		_modules: [],
		add: function(name) {
			this._modules.push({name: name})
		},
		addModule: function(name, module) {
			var obj = this.find(name)
			obj.module = module
		},
		find: function(name) {
			return this._modules.filter(function(module) {
				return module.name === name
			})[0]
		}
	}

	var addEventListener = function(el, eventName, handler) {
		el.addEventListener
			? el.addEventListener(eventName, handler)
			: el.attachEvent('on' + eventName, function() { handler.call(el) })
	}
	var triggerEvent = function(el, eventName, options) {
		var event = window.CustomEvent
			? new CustomEvent(eventName, options)
			: document.createEvent('CustomEvent')

		if (!window.CustomEvent) event.initCustomEvent(eventName, true, true, options)
		el.dispatchEvent(event)
	}

	var yank = {
		load: function(deps, callback) {
			new Component(deps, callback)
		},
		define: function(name, deps, callback) {
			new Module(name, deps, callback)
		},
		map: {}
	}



	var Component = function(deps, definition) {
		if (!Array.isArray(deps)) {
			if (typeof deps === 'string') deps = [deps]
			else if (typeof deps === 'function') {
				definition = deps
				deps = []
			}
			else throw new TypeError('dependencies param is of the wrong type.  Expected array or string, got ' + typeof deps)
		}
		this.deps = deps
		this.loadedDeps = []
		this.definition = definition
		this.init()
	}
	Component.prototype = {
		init: function() {
			if (this.deps.length) return this.loadDeps()
			this.kickstart()
		},

		addLoadedDep: function(dep) {
			this.loadedDeps.push(modules.find(dep))
		},
		kickstart: function() {
			this.definition.apply(this.definition, this.orderLoadedDeps())
		},
		loadDeps: function() {
			var _this = this
			this.deps.forEach(function(dep) {
				if (modules.find(dep)) {
					_this.addLoadedDep(dep)
					_this.kickstart()
					return
				}

				var file = (yank.map[dep] || dep) + '.js', // if the user has defined this dep in the map, use the route they specified
					script = document.createElement('script')

				script.src = file
				script.module = dep
				addEventListener(script, 'depLoaded', function(event) {
					_this.addLoadedDep(dep)
					_this.kickstart()
				})
				document.body.appendChild(script)
			})
		},
		orderLoadedDeps: function() {
			var _this = this,
				ordered = []

			this.deps.forEach(function(depName) {
				var module = _this.loadedDeps.filter(function(loadedDep) {
					return loadedDep.name === depName
				})[0].module
				ordered.push(module)
			})
			return ordered
		}
	}



	var Module = function(name, deps, definition) {
		if (typeof name !== 'string') {
			throw new TypeError('module name is of the wrong type.  Expected string, got ' + typeof name)
		}
		this.name = name
		this.el = [].slice.call(document.scripts).filter(function(script) {
			return script.module === name
		})[0]
		modules.add(name)
		Component.call(this, deps, definition)
	}
	Module.prototype = {
		kickstart: function() {
			if (this.loadedDeps.length < this.deps.length) return

			modules.addModule(this.name, this.definition.apply(this.definition, this.orderLoadedDeps()))
			triggerEvent(this.el, 'depLoaded')
		},
	}
	Object.setPrototypeOf(Module.prototype, Component.prototype) // Module extends Component



	// expose stuff
	global.yank = yank

	global.define = yank.define // an alias for convenience
})(window || module && module.exports)

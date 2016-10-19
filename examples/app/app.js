define('app', ['router', 'controller'], function(Router, Controller) {
	return {
		init: function() {
			console.log('app initialized')
			Router.init()
			Controller.init()

			yank.load('controller', function(Controller) {
				console.log('loaded controller again!')
				Controller.init()
			})
		}
	}
})

p2p$.ns('com.webp2p.tools.console');

p2p$.com.webp2p.tools.console.IpHelper = CdeBaseClass.extend_({

	ajaxId_ : 0,
	names_ : null,
	pendingIps_ : null,

	init : function(config) {
		this.names_ = {};
		this.pendingIps_ = [];
	},

	getNameByIp_ : function(ip, callback, scope) {
		if (ip.indexOf(':') >= 0) {
			ip = ip.substr(0, ip.indexOf(':'));
		}
		if (ip.substr(0, 1) == '*') {
			ip = ip.substr(1);
		}
		ip = p2p$.com.webp2p.core.utils.Utils.trim(ip);
		if (this.names_[ip]) {
			return this.names_[ip];
		}

		this.queryIp_(ip, callback, scope);
		return '...';
	},

	queryIp_ : function(ip, callback, scope) {
		if (this.ajaxId_) {
			for (var i = 0; i < this.pendingIps_.length; i++) {
				if (this.pendingIps_[i] == ip) {
					return;
				}
			}
			this.pendingIps_.push(ip);
			return;
		}
		this.queryNext_(ip, callback, scope);
	},

	queryNext_ : function(ip, callback, scope) {
		if (!ip && this.pendingIps_.length == 0) {
			return;
		}

		if (!ip) {
			ip = this.pendingIps_[0];
			this.pendingIps_.shift();
		}

		var delegate = this;
		this.ajaxId_ = $.ajax({
			url : 'http://10.176.30.32/?format=1&ajax=1&uip=' + ip + '&random=' + Math.random()
			//url : 'http://g3.letv.cn/?format=1&ajax=1&uip=' + ip + '&random=' + Math.random()
		}).done(function(data) {
			if (typeof (data) == 'string') {
				try {
					data = eval('(' + data + ')');
				} catch (e) {
				}
			}
			var name = (data.desc || '-');
			var trimValues = '中国-';
			if (name.substr(0, trimValues.length) == trimValues) {
				name = name.substr(trimValues.length);
			}
			delegate.names_[ip] = name;
			delegate.queryNext_(null, callback, scope);
			if (callback) {
				callback.call(scope);
			}
		}).fail(function() {
			delegate.names_[ip] = '-';
			delegate.queryNext_(null, callback, scope);
			if (callback) {
				callback.call(scope);
			}
		}).always(function() {
			delegate.ajaxId_ = 0;
		});
	}
});

p2p$.ns('com.webp2p.protocol.websocket');
p2p$.com.webp2p.protocol.websocket.ManagerStatic = {
	kTimerTypeTracker : 1,
	kTimerTypeSession : 2,
	kTimerTypeAsyncPeers : 3,
};

p2p$.com.webp2p.protocol.websocket.Manager = p2p$.com.webp2p.protocol.base.Manager.extend_({
	http_ : null,
	peers_ : null,
	selfInnerIp_ : "",
	selfInternetIp_ : "",
	exchangePeerIdsData_ : "",

	opened_ : false,
	upnpMapResultReported_ : false,
	upnpMapWaiting_ : false,
	activeTime_ : 0,
	protocolOpenedTime_ : 0,
	peerMaxConnectingTime_ : 0,
	trackerBeginQueryTime_ : 0,

	trackerRegisterEnabled_ : false,
	trackerRegistered_ : false,
	activeSessionCount_ : 0,
	trackerResponseStatus_ : 0,
	shareServerPort_ : 0,
	shareServerUpnpPort_ : 0,
	heartbeatInterval_ : 0,
	trackerTryTimes_ : 0,
	upnpMapTryTimes_ : 0,
	errorMap_:[],
	tag_:"com::webp2p::protocol::websocket::Manager",

	init : function(pool, evt) {
		this._super(pool, evt, p2p$.com.webp2p.protocol.base.PROTOCOL_TYPES.kProtocolTypeWebSocket);
		this.peers_ = new p2p$.com.common.Map();
		this.heartbeatInterval_ = 30; // seconds
		this.shareServerPort_ = 1443; // https port
		this.shareServerUpnpPort_ = 0;
		this.trackerTryTimes_ = 0;
		this.upnpMapTryTimes_ = 0;
		this.activeTime_ = 0;
		this.trackerRegisterEnabled_ = true;
		this.trackerRegistered_ = false;
		this.upnpMapResultReported_ = false;
		this.upnpMapWaiting_ = false;
		this.activeSessionCount_ = 0;
		this.trackerResponseStatus_ = 0;
		this.trackerBeginQueryTime_ = 0;
		this.peerMaxConnectingTime_ = 10 * 1000;
		this.errorMap_=[];
		this.http_ = null;
	},

	open : function() {
		this.close();
		this.opened_ = true;
		this.activeTime_ = this.global_.getMilliTime_();
		this.id_ = this.strings_.format("{0}{1}{2}{3}", Math.floor(Math.random() * (1000 + 1)), Math.floor(Math.random() * (1000 + 1)),
				Math.floor(Math.random() * (1000 + 1)), this.global_.getMilliTime_());
		if (this.pool_.getContext_().p2pHeartbeatInterval_ > 0) {
			this.heartbeatInterval_ = this.pool_.getContext_().p2pHeartbeatInterval_;
		}
		this.pool_.getContext_().p2pWebsocketPeerId_ = this.id_;
		this.sessionTimer_ = this.setTimeout_(p2p$.com.webp2p.protocol.websocket.ManagerStatic.kTimerTypeSession, this.sessionTimer_, 5000);
		this.queryFromTracker_();
		return true;
	},

	close : function() {
		this.opened_ = false;
		if (this.serverTimer_) {
			clearTimeout(this.serverTimer_);
			this.serverTimer_ = null;
		}

		if (this.sessionTimer_) {
			clearTimeout(this.sessionTimer_);
			this.sessionTimer_ = null;
		}
		if (this.http_ != null) {
			this.http_ = null;
		}
		// shareServer_->stop();
		// upnpService_->stop();
		// for( protocol::base::SessionPtrList::iterator itr = sessions_.begin(); itr != sessions_.end(); itr ++ )
		// {
		// protocol::base::SessionPtr &session = (*itr);
		// if( session.get() ) session->close();
		// }
		// sessions_.clear();
		//
		// asyncOpenPeers_.clear();
		// asyncClosePeers_.clear();
		for ( var n = 0; n < this.peers_.length; n++) {
			var elem = this.peers_.element(n);
			var peer = elem.value;
			peer.disconnect();
		}
		this.peers_.clear();
		//
		// return true;
	},

	getXmtepHeaders_ : function() {
		return "xMtepClientId="
				+ this.id_
				+ "&xMtepClientModule=h5"
				+ "&xMtepClientVersion="
				+ this.strings_.format("{0}.{1}.{2}", p2p$.com.selector.Module.kH5MajorVersion,
						p2p$.com.selector.Module.kH5MinorVersion, p2p$.com.selector.Module.kH5BuildNumber) + "&xMtepProtocolVersion=1.0"
				+ "&xMtepBusinessParams="
				+ encodeURIComponent("playType=" + this.pool_.getContext_().playType_ + "&p2pGroupId=" + this.pool_.getMetaData_().p2pGroupId_)
				+ "&xMtepOsPlatform=" + encodeURIComponent(this.pool_.getContext_().osType_) + "&xMtepHardwarePlatform=pc";
	},

	queryFromTracker_ : function() {
		if (this.http_ != null) {
			this.http_.log("cancel");
			this.http_.close();
			this.http_ = null;
		}

		this.activeTime_ = this.global_.getMilliTime_();

		var context = this.pool_.getContext_();
		// var terminalId = this.strings_.fromNumber(this.pool_.getContext_().terminalType_);
		var operateCode = "3"; // get peer list
		if (this.activeSessionCount_ >= this.pool_.getContext_().p2pMaxPeers_) {
			operateCode = "1"; // heartbeat
		}
        var userparam = {"root": { "langtype": "3" }};
		var url = new p2p$.com.common.Url();
		url.protocol_ = "http";
		url.host_ = this.pool_.getContext_().trackerServerHost_;
		url.file_ = "/cde";
		url.params_.set("termid", "2"); // terminalId;...
		url.params_.set("format", "1");
		url.params_.set("ver", context.playType_ + "." + context.moduleVersion_);
		url.params_.set("op", operateCode);
		url.params_.set("ckey", this.pool_.getMetaData_().p2pGroupId_);
		url.params_.set("outip", "0.0.0.0");
		url.params_.set("inip", "0.0.0.0");
		url.params_.set("pid", this.strings_.format("33-{0}-0-0", this.id_));
		url.params_.set("pos", this.strings_.fromNumber(this.pool_.getContext_().playingPosition_));
		url.params_.set("ispId", this.strings_.fromNumber(context.isp_));
		url.params_.set("neighbors", this.strings_.fromNumber(this.activeSessionCount_));
		url.params_.set("arealevel1", context.countryCode_);
		url.params_.set("arealevel2", this.strings_.fromNumber(context.province_));
		url.params_.set("arealevel3", this.strings_.fromNumber(context.city_));
		url.params_.set("expect", this.strings_.fromNumber(this.pool_.getContext_().p2pMaxPeers_ * 2));
		url.params_.set("userparam",this.strings_.base64Encode_(JSON.stringify(userparam)));

		var requestUrl = url.toString();
		this.trackerBeginQueryTime_ = this.global_.getMilliTime_();
		// set tracker timer
		this.serverTimer_ = this.setTimeout_(p2p$.com.webp2p.protocol.websocket.ManagerStatic.kTimerTypeTracker, this.serverTimer_,
				this.heartbeatInterval_ * 1000);
		this.http_ = new p2p$.com.loaders.HttpDownLoader({url_:requestUrl, scope_:this, type_:"json", tag_:"websocket::tracker"});
		this.http_.load_();
	},

	onHttpDownloadCompleted_ : function(downloader) {
		var handled = false;

		if (!this.opened_ || this.http_ != downloader) {
			// expired
			P2P_ULOG_INFO(P2P_ULOG_FMT("{0} Expired http complete for tag({1}), channel({2}), ignore",this.tag_,downloader.tag_, this.pool_
					.getMetaData_().storageId_));
			return handled;
		}

		this.http_ = null;
		P2P_ULOG_INFO(P2P_ULOG_FMT("{0} Http complete for tag({1}), channel({2}), response code({3}), details({4}), size({5})",this.tag_,downloader.tag_, this.pool_.getMetaData_().storageId_, downloader.responseCode_, downloader.responseDetails_, downloader.responseLength_));

		if (downloader.tag_ == "websocket::tracker") {
			handled = true;
			this.activeTime_ = this.global_.getMilliTime_();
			if (!downloader.successed_ || downloader.responseCode_ < 200 || downloader.responseCode_ >= 300) {
				// waiting for timeout and retry ...
				return handled;
			}

			if (this.pool_.getContext_().trackerServerConnectedTime_ <= 0) {
				this.pool_.getContext_().trackerServerConnectedTime_ = this.activeTime_ - this.trackerBeginQueryTime_;
			}
			// parse tracker data
			this.parseTrackerResponse_(downloader);
		}

		return handled;
	},

	parseTrackerResponse_ : function(downloader) {
		var peerResponseCount = 0;
		var newPeerCount = 0;
		// var previousSelfIp = this.selfInternetIp_;
		var result = downloader.responseData_;
		if (result == "" || result == null) {
			// if( this.gslbServerErrorCode_ <= 0 ) gslbServerErrorCode_ = 52001;
			return false;
		}

		if (!downloader.responseData_ == "") {

			this.trackerResponseStatus_ = result["status"];
			if (this.trackerResponseStatus_ != 200) {
				P2P_ULOG_ERROR(P2P_ULOG_FMT("{0} Tracker response status({1}), not 200, channel({2})",this.tag_,this.trackerResponseStatus_,
						this.pool_.getMetaData_().storageId_));
				return false;
			}

			this.selfInternetIp_ = result["host"] || "";
			var peerList = result["peerlist"] || [];
			for ( var n = 0; n < peerList.length; n++) {
				var peerItem = peerList[n];
				var itemId = peerItem["peerid"];
				var itemIp = peerItem["userip"];
				var itemPort = peerItem["pport"];
				if (itemPort == this.shareServerPort_ && itemIp == this.selfInnerIp_) {
					// self
					continue;
				}
				if (itemIp == "127.0.0.1" || itemIp == "0.0.0.0" || itemIp == "255.255.255.255") {
					// invalid ip address
					continue;
				}
				if(this.isDisabledIp_(itemIp))
				{
					//invalid ip address
					continue;
				}
				itemId = this.strings_.toLower_(itemId);
				var isFind = this.peers_.find(itemId);
				var info;
				if (!isFind) {
					if (this.peers_.size() >= this.maxActiveSession_ * 2) {
						break;
					}
					info = new p2p$.com.webp2p.protocol.websocket.Peer(this);
					this.peers_.set(itemId, info);
					newPeerCount++;
					info.fromServer_ = true;
				} else {
					info = this.peers_.get(itemId);
				}
				if (info != null) {
					info.fromServer_ = true;
					info.load(peerItem);
				}

			}
			peerResponseCount = peerList.length;
			this.pool_.getContext_().websocketTotalNodeCount_ = this.peers_.length;
		}

		var registering = false;
		if (this.trackerRegisterEnabled_ && !this.trackerRegistered_) {
			registering = true;
			this.trackerRegistered_ = true;
			this.protocolOpenedTime_ = this.global_.getMilliTime_();
			this.eventListener_.onProtocolManagerOpen_(this, 0);
		}

		if (newPeerCount > 0) {
			this.checkPeerSessions_();
		}
		P2P_ULOG_INFO(P2P_ULOG_FMT("{0} {1} tracker successfully, self internet ip({2}), load {3} peer(s), {4} peer(s) now, channel({5})",this.tag_,(registering ? "Register to" : "Query peer from"), this.selfInternetIp_, peerResponseCount, this.peers_.length,this.pool_.getMetaData_().storageId_));
	},
	isDisabledIp_:function(ip)
	{
		var exit_ = false;
		for(var i=0;i<this.errorMap_.length;i++)
		{
			if(this.errorMap_[i]==ip){
				exit_=true;
				P2P_ULOG_WARNING(P2P_ULOG_FMT("{0} ip({1}) isDisable!",this.tag_,ip));
				break;
			}
		}
		return exit_;
	},
	checkPeerSessions_ : function() {
		var nowTime = this.global_.getMilliTime_();
		var updatedPeerCount = 0;

		// clean connect failed peers
		for ( var n = 0; n < this.peers_.length; n++) {
			var elem = this.peers_.element(n);
			var peer = elem.value;
			if (!peer.isActive_(nowTime, this.peerMaxConnectingTime_) && (peer.totalConnectingTimes_ > 5 || peer.disconnectTimes_ > 3 || !peer.fromServer_)) {
				if (peer.session_ != null) {
					this.pool_.getContext_().websocketTotalNodeCount_ = this.peers_.size();
					this.eventListener_.onProtocolSessionClose_(peer.session_);
				}
				peer.disconnect();
				this.peers_.erase(elem.key);
				n--;
				updatedPeerCount++;
			}
		}

		this.activeSessionCount_ = 0;
		for ( var n = 0; n < this.peers_.length; n++) {
			var elem = this.peers_.element(n);
			var peer = elem.value;
			if (peer.session_ == null) {
				continue;
			}
			if (!peer.isActive_(nowTime, this.peerMaxConnectingTime_)) {
				this.pool_.getContext_().websocketTotalNodeCount_ = this.peers_.size();
				this.eventListener_.onProtocolSessionClose_(peer.session_);
				peer.disconnect();
				updatedPeerCount++;
			} else {
				this.activeSessionCount_++;
			}
		}

		//
		if (this.activeSessionCount_ >= this.maxActiveSession_) {
			return;
		}
		//
		var connectablePeers = [];
		for ( var n = 0; n < this.peers_.length; n++) {
			var elem = this.peers_.element(n);
			var peer = elem.value;
			if (peer.isActive_(nowTime, this.peerMaxConnectingTime_)) {
				continue;
			}
			if (!peer.fromServer_) {
				// passive peer
				continue;
			} else if (peer.lastConnectTime_ + 60 * 1000 > nowTime) {
				// sleep
				continue;
			}
			connectablePeers.push(peer);
		}

		for ( var n = 0; n < connectablePeers.length; n++) {
			var peer = connectablePeers[n];
			// try connect peer
			if (!peer.connect(this)) {
				// failed
				continue;
			}
			this.activeSessionCount_++;
			if (this.activeSessionCount_ >= this.maxActiveSession_) {
				break;
			}
		}
	},

	onTimeout_ : function(tag, timer, errorCode) {
		switch (tag) {
		case p2p$.com.webp2p.protocol.websocket.ManagerStatic.kTimerTypeTracker:
			this.onTrackerTimeout_();
			break;
		case p2p$.com.webp2p.protocol.websocket.ManagerStatic.kTimerTypeSession:
			this.onSessionTimeout_();
			break;
		case p2p$.com.webp2p.protocol.websocket.ManagerStatic.kTimerTypeAsyncPeers:
//			this.onAsyncPeersTimeout();
			break;
		default:
			break;
		}
	},

	onTrackerTimeout_ : function() {
		if (this.http_ != null) {
			this.http_.log("timeout");
			// http_->close();
			this.http_ = null;
		}

		if (!this.opened_) {
			return;
		}
		this.queryFromTracker_();
	},

	onSessionTimeout_ : function() {
		this.checkPeerSessions_();
		this.sessionTimer_ = this.setTimeout_(p2p$.com.webp2p.protocol.websocket.ManagerStatic.kTimerTypeSession, this.sessionTimer_, 5000);
	},

	onWebSocketOpen_ : function(evt, session) {
		this.status = true;
	},

	onWebSocketMessage_ : function(message, session) {
		if (!this.opened_) {
			return false;
		}
		if (!this.status) {
			return;
		}

		for ( var n = 0; n < this.peers_.length; n++) {
			var elem = this.peers_.element(n);
			var peer = elem.value;
			var me = this;
			if (session == peer.session_) {
				P2P_ULOG_TRACE(P2P_ULOG_FMT("{0} Active session({1}, {2}:{3}) message arrive",this.tag_,peer.id_, peer.internetIp_,peer.internetPort_));

				peer.activeTime_ = this.global_.getMilliTime_();

				var data = message.data;
				switch (typeof (data)) {
				case "string":
					if (false === session.openHashhand) {
						session.openHashhand = true;
						session.attchProperties_(JSON.parse(data));
						this.eventListener_.onProtocolSessionOpen_(session);
					}
					break;
				case "object":
					var fileReader = new FileReader();
					fileReader.onload = function() {
						var messageDecode = p2p$.com.webp2p.protocol.webrtc.Packet.decode(new Uint8Array(this.result), me.getType());
						me.getEventListener_().onProtocolSessionMessage_(session, messageDecode);
					};
					fileReader.readAsArrayBuffer(data);
					break;
				}
			}

		}
	},

	onWebSocketClose_ : function(evt, session) {
		if (!this.opened_) {
			return false;
		}

		for ( var n = 0; n < this.peers_.length; n++) {
			var elem = this.peers_.element(n);
			var peer = elem.value;
			if (session == peer.session_) {
				P2P_ULOG_TRACE(P2P_ULOG_FMT("{0} Session({1}, {2}:{3}) closed",this.tag_,peer.id_, peer.internetIp_, peer.internetPort_));
				this.pool_.getContext_().websocketTotalNodeCount_ = this.peers_.size();
				this.eventListener_.onProtocolSessionClose_(session);
				peer.disconnect();
				break;
			}
		}
		return true;
	},
    onWebSocketError_ : function(evt,session){
        if (!this.opened_) {
            return false;
        }
        //把当前节点添加到已经连接过得节点
		var exit_ = false;
		for(var i=0;i<this.errorMap_.length;i++)
		{
			if(this.errorMap_[i]==session.remoteIp_){
				exit_=true;
				break;
			}
		}
		if(!exit_){
			P2P_ULOG_INFO(P2P_ULOG_FMT("{0} add Invalid ip（{1}）",this.tag_,session.remoteIp_));
            this.errorMap_.push(session.remoteIp_);
		}
		this.onWebSocketClose_(evt,session);
	}
});

p2p$.ns('com.tools.console');

p2p$.com.tools.console.Channel = JClass.extend_({
	index : 0,
	parent : null,
	dom : null,
	elements_ : null,
	property : null,
	peers : null,
	peerHeaders_ : null,
	segments : null,
	pieces : null,
	utils_:null,

	init : function(data, videoStream) {
		this.property = data;
		this.videoStream_ = videoStream;
		this.utils_ = p2p$.com.utils.Utils;
	},

	create : function(index, parent) {
		this.index = index;
		if (this.dom) {
			this.destroy();
		}

		this.peerHeaders_ = [ {
			title : "名称",
			fieldIndex : "name"
		} ];

		this.peers = {};
		this.segments = {};
		this.pieces = [];
		this.parent = parent;
		this.dom = document.createElement("div");
		this.dom.setAttribute("id", "channel-"+this.property.id);
		this.dom.className="channel-item";
		this.parent.appendChild(this.dom);
		this.createElements_();
	},

	destroy : function() {
		if (this.dom) {
			this.dom.remove();
			this.dom = null;
		}
	},

	getTypeName_ : function() {
		switch (this.property.type) {
		case 'vod':
			return '点播';
		case 'live':
			return '直播';
		case 'stream':
			return '实时';
		case 'download':
			return '下载';
		default:
			return '未知';
		}
	},

	createElements_ : function() {
		var title_ = document.createElement("table");
		title_.className = "channel-title";
		var tr_ = document.createElement("tr");
		title_.appendChild(tr_);
		var td_,tds_=[];
		for(var i=0;i<3;i++){
            td_ = document.createElement("td");
            tr_.appendChild(td_);
            tds_.push(td_);
		}
		tr_ = document.createElement("tr");
        title_.appendChild(tr_);
        td_ = document.createElement("td");
        td_.setAttribute("colspan",3);
        tr_.appendChild(td_);
        tds_.push(td_);
		var a_=document.createElement("a");
		a_.setAttribute("href",this.utils_.format('http://{0}{1}', p2p$.com.tools.console.Index.host, (this.property.channelPlayUrl || '').replace(/debug=0/g, 'debug=1')));
		a_.setAttribute("title", "查看M3U8");
		a_.setAttribute("target","_blank");
		a_.innerHTML=this.utils_.format("{0}频道 {1}",this.getTypeName_(), this.index);
		tds_[0].appendChild(a_);
		var text_= document.createElement("div");
		text_.setAttribute("title",this.property.channelUrl);
		text_.innerText=this.utils_.htmlEscape_((this.property.directMetaMode ? this.property.channelUrl : this.property.gslbEncryptUrl)|| this.property.channelUrl);
		tds_[3].appendChild(text_)
		var close=document.createElement("a");
		close.setAttribute("title","关闭频道");
		close.className="click-link";
		close.innerHTML="X";
		tds_[2].appendChild(close);
		///////info
		var info_=document.createElement("div");
		info_.className="info";
		///////
		var statData_=document.createElement("table");
		statData_.className="stat";
		statData_.setAttribute("border", "0");
		statData_.innerHTML='<tr><td colspan="18" class="title">传输统计</td></tr>' + '<tr class="row">'
		+ '<td class="prefix">下载数据:</td><td class="value" colspan="4"></td>' + '<td class="prefix">上传数据:</td><td class="value" colspan="4"></td>'
		+ '<td class="prefix">P2P 下载率:</td><td class="value" colspan="1"></td>'
		+ '<td class="prefix" align="right">参数:</td><td class="value" colspan="2" title="Fetch Rate  % / 最大连接节点 / 紧急区时长 / P2P.P2P-UIC "></td>'
		+ '<td class="prefix">上传比:</td><td class="value" colspan="1"></td>' + '</tr><tr class="row">'
		+ '<td class="prefix protocol-cdn">CDN:</td> <td class="prefix2">下载:</td><td class="value"></td> '
		+ '<td class="prefix2"></td><td class="value" style="padding-right:20px;"></td>'
		+ '<td class="prefix protocol-webrtc">WebRTC:</td> <td class="prefix2">下载:</td><td class="value"></td> '
		+ '<td class="prefix2">上传:</td><td class="value" style="padding-right:20px;"></td>'
		+ '<td class="prefix protocol-websocket">SOCKET:</td> <td class="prefix2">下载:</td><td class="value"></td> '
		+ '<td class="prefix2">上传:</td><td class="value" style="padding-right:20px;"></td>' + '<td class="prefix"></td><td></td><td></td>'
		+ '</tr>';
		/////pieces
		var pieces_=document.createElement("div");
		pieces_.className="pieces";
		pieces_.innerHTML='<div class="switch-wrapper"><button class="switch-btn"></button></div>';
		/////segments
		var segments_=document.createElement("table");
		segments_.className="segments";
		segments_.innerHTML="<tr><td colspan='9' class='title'><span>分片(TS)列表 (从紧急区位置开始 5 个)</span><td></tr>"
					+ "<tr class='header'>" + "<th>ID</th> <th>大小</th> <th>开始时间</th> <th>时长 (s)</th> <th>平均码率</th> <th>下载速度</th> <th>最后下载时间</th>"
					+ "<th>等待 / 已下载 / PIECE</th> <th>完成比例</th>" + "</tr>";
		//////peers
		var peers_=document.createElement("table");
		peers_.className="peers";
		peers_.innerHTML="<tr class='title'><td colspan='13'>节点列表 (<span class='peer-type-stats'>...</span>)</td></tr>"
					+ "<tr class='header'>" + "<th>名称</th> <th>类型</th> <th>节点 ID / QoS</th> <th>IP 地址</th> <th>位置</th> <th>下载速度</th> "
					+ "<th>最后下载时间</th> <th>下载数据量</th> <th>下载 PIECE</th> <th>上传数据量</th> <th>上传 PIECE</th>" + "<th>队列 / 响应 / 请求 / 消息</th> <th>错误: 校验/所有</th>"
					+ "</tr>";
		this.elements_ = {
			title : title_,
			info : info_,
			statData :statData_,
			pieces : pieces_,
			segments : segments_,
			peers:peers_
		};
		for ( var name in this.elements_) {
			this.dom.appendChild(this.elements_[name]);
		}

		var delegate = this;
		var page = p2p$.com.tools.console.Index;
		var switchWrapper = this.elements_.pieces.getElementsByClassName("switch-wrapper")[0];
		var switchBtn = switchWrapper.getElementsByClassName("switch-btn")[0];
		switchBtn.onclick=function() {
			page.statusParams_.segmentStartWithPlayer_ = page.statusParams_.segmentStartWithPlayer_ ? 0 : 1;
			delegate.reset(switchBtn, page.statusParams_.segmentStartWithPlayer_);
			page.onTimer_();
		};
		this.reset(switchBtn, page.statusParams_.segmentStartWithPlayer_);

		var closeLink = this.elements_.title.getElementsByClassName("click-link")[0];//$(this.elements_.title.find(".click-link"));
		closeLink.onclick=function()
		{
			delegate.closeRemoteChannel_();
		}
	},

	reset : function(switchBtn, segmentStartWithPlayer_) {
		switchBtn.innerHTML=segmentStartWithPlayer_ ? '显示所有片段' : '从播放器位置显示';
		if (this.pieces) {
			for ( var i = 0; i < this.pieces.length; i++) {
				this.pieces[i].remove();
			}
		}
		this.pieces = [];

		if (this.peers) {
			for ( var id in this.peers) {
				this.peers[id].remove();
			}
			this.peers = {};
		}
	},

	update : function(data) {
		this.property = data;
		this.updateInfo_();
		this.updateStatData_();
		this.updatePieces_();
		this.updateSegments_();
		this.updatePeers_();
	},

	updateInfo_ : function() {
		var streamName = this.property.liveStreamId || '';
		if (this.property.type != 'live') {
			var channelParams = this.utils_.getUrlParams_(this.property.channelUrl);
			streamName = this.getVideoRateName_(channelParams['vtype']) || channelParams['rateid'];
		}

		// var gslbErrorDetails = this.property.gslbServerErrorDetails || this.getGslbErrorDetails_(this.property.gslbServerErrorCode,
		// this.property.gslbServerErrorDetails);
		var gslbErrorDetails = this.getGslbErrorDetails_(this.property.gslbServerErrorCode, this.property.gslbServerErrorDetails);

		var htmls = this.utils_.format('<table>' + '<tr><td class="prefix">频道 ID:</td><td class="name" title="{1}">{0}</td></tr>'
				+ '<tr><td class="prefix">创建时间:</td><td>{2}, <span class="extra">P2P Tracker:</span> {20}, '
				+ '  <span class="extra">Webrtc:</span> {21} <span class="extra" title="{22}">Peer ID:</span> {23}</td></tr>'
				+ '<tr><td class="prefix">最后活跃时间:</td><td>{3} <span class="extra">(与播放器交互)</span>, '
				+ '  HTTP: {17}, GSLB({31}): {18}/EC:{28}, M3U8({32}): {19}</td></tr>'
				+ '<tr><td class="prefix">打开耗时:</td><td>{4} ms <span class="extra">(GSLB + 第一次 M3U8)</span>, '
				+ '  {30} ms<span class="extra">(GSLB)</span>, '
            	+ '  {36} ms<span class="extra">(GSLB总耗时)</span></td></tr>'
				+ '<tr><td class="prefix">当前直播点:</td><td>{5} <span class="extra" title="GAP / M3U8刷新 / TS 跳跃 / 直播时延">(最新) GAP:</span> {29} 秒 '
				+ '  <span class="extra">GSLB 加载: </span>{24}, <span class="extra">重新调度: </span>{25} 分钟后</td></tr>'
				+ '<tr><td class="prefix">M3U8 信息 1:</td><td><span class="extra">加载: </span>{26}, 当前 {6} 个 TS，'
				+ '  <span class="extra">范围: </span>{7} ~ {8}, {9} 个已完成, {10} 个正在下载, {11} 个可见, 共 {12} 秒</td></tr>'
				+ '<tr><td class="prefix">M3U8 信息 2:</td><td>{13} 个 PIECE, <span class="extra">P2P Group ID:</span> {14}, '
				+ '  <span class="extra">Stream ID/Rate:</span> {27}</td></tr>'
				+ '<tr><td class="prefix">播放器:</td><td>正在请求 TS {15}, <span class="extra">第一次起播时间:</span> '
				+ '  {16}, UIC: {33}::{34}, <span title="P2P 正在下载 PIECE 数量">{35}P</span></tr>' + '</table>', this.property.id
				+ (this.property.context.drmEnabled ? ' - <i>DRM</i>' : '') + (this.property.paused ? ' - 已暂停' : '')/*0*/, this.property.selfRanges/*1*/,
				this.utils_.formatDate_('Y-m-d H:i:s', this.property.createTime)/*2*/, this.utils_.formatDate_(
						'Y-m-d H:i:s', this.property.activeTime)/*3*/, this.property.channelOpenedTime > 0 ? Math
						.round((this.property.channelOpenedTime - this.property.createTime)) : '-'/*4*/, this.utils_.formatDate_('Y-m-d H:i:s',
						this.property.livePlayTime * 1000)/*5*/, this.property.metaData.segmentCount/*6*/, this.property.metaData.segmentFirstId/*7*/,
				this.property.metaData.segmentLastId/*8*/, this.property.metaData.segmentCompletedCount/*9*/, this.property.metaData.segmentCompletingCount/*10*/,
				this.property.metaData.segmentDisplayCount/*11*/, Math.round(this.property.metaData.segmentDisplayDuration / 1000)/*12*/,
				this.property.metaData.pieceCount/*13*/, this.property.metaData.p2pGroupId/*14*/, this.property.urgentSegmentId + '/' + this.property.playerSegmentId/*15*/,
				this.utils_.formatDate_('Y-m-d H:i:s', this.property.mediaStartTime)/*16*/, this.utils_.format(
						'<span class="{0}">{1}</span>', this.property.metaResponseCode == 200 ? 'status-ok' : 'status-error', this.property.metaResponseCode)/*17*/,
				this.utils_.format('<span class="{0}">{1}</span>', this.property.gslbServerResponseCode == 200 ? 'status-ok'
						: 'status-error', this.property.gslbServerResponseCode)/*18*/, this.utils_.format('<span class="{0}">{1}</span>',
						this.property.metaServerResponseCode == 200 ? 'status-ok' : 'status-error', this.property.metaServerResponseCode)/*19*/,
				this.property.context ? this.property.context.gatherServerHost : '-'/*20*/,
				this.property.context ? this.property.context.webrtcServerHost : '-'/*21*/, this.property.context ? (this.property.context.p2pWebrtcPeerId || '...')
						: '-'/*22*/, this.property.context ? (this.property.context.p2pWebrtcPeerId || '...') : '-'/*23*/, this.utils_.formatDate_(
						'Y-m-d H:i:s', this.property.gslbLoadTime)/*24*/, this.property.gslbReloadInterval / 1000000 / 60/*25*/, this.utils_
						.formatDate_('Y-m-d H:i:s', this.property.metaLoadTime)/*26*/, streamName/*27*/, this.utils_.format(
						'<span class="{0}" title="Error Code">{1}</span>', this.property.gslbServerErrorCode == 0 ? 'status-ok' : 'status-error', [
								this.property.gslbServerErrorCode, gslbErrorDetails ].toString())/*28*/, (this.property.metaData.totalGapDuration / 1000) + ' / '
						+ (Math.round(this.property.playerFlushInterval / 1000) / 1000) + ' / ' + (this.property.liveSkipSegmentTime / 1000) + ' / '
						+ (this.property.livePlayOffset || '-')/*29*/, this.property.gslbConsumedTime ? ((this.property.gslbConsumedTime || 0)) : '-'/*30*/,
				this.property.context.gslbServerIp ? this.property.context.gslbServerIp : '...'/*31*/,
				this.property.context.metaServerIp ? this.property.context.metaServerIp : '...'/*32*/,
				typeof (this.property.urgentIncompleteCount) == 'number' ? this.property.urgentIncompleteCount : '-'/*33*/,
				typeof (this.property.urgentSegmentEndId) == 'number' ? this.property.urgentSegmentEndId : '-'/*34*/,
				typeof (this.property.otherPeerRequestCount) == 'number' ? this.property.otherPeerRequestCount : '-'/*35*/,this.property.gslbTotalUseTime/*36*/);
		this.elements_.info.innerHTML=htmls;
	},

	updateStatData_ : function() {
		if (!this.property.statData) {
			return;
		}

		var statChildren = this.elements_.statData.getElementsByClassName("row");
		var allStatDom = statChildren[0];
		var protocolsDom = statChildren[1];

		var uploadSuffix = '';
		if (this.property.context.p2pUploadLimit) {
			uploadSuffix = this.utils_.format('<span title="P2P 上传限制, I:初始值, A:平均值, N:目前值"> / I:{0}, A:{1}, N:{2}</span>',
					this.utils_.speed(this.property.context.p2pUploadThrottleInit, true), this.utils_.speed(
							this.property.context.p2pUploadThrottleAverage, true), this.utils_.speed(
							this.property.statData.restrictedSendSpeed, true));
		}

		var doms = allStatDom.getElementsByClassName("value");
		doms[0].innerHTML=this.utils_.size(this.property.statData.totalReceiveBytes);
		doms[1].innerHTML=(this.property.statData.totalSendBytes > 0 ? this.utils_.size(this.property.statData.totalSendBytes) : '-') + uploadSuffix;
		doms[2].innerHTML=(this.property.statData.shareReceiveRatio * 100).toFixed(1) + '%';
		doms[3].innerHTML=(this.property.context.p2pFetchRate * 100).toFixed(1) + '% / ' + this.property.context.p2pMaxPeers + ' / ' + (this.property.context.p2pUrgentSize || '-') + 's' + ' / ' + (this.property.context.p2pMaxParallelRequestPieces || '-') + '.'+(this.property.context.p2pMaxUrgentRequestPieces || '-');
		doms[4].innerHTML=((this.property.statData.shareSendRatio * 100).toFixed(1) + '%');

		protocolsDom.getElementsByClassName("protocol-cdn")[0].style.color='#aa0000';
		protocolsDom.getElementsByClassName("protocol-webrtc")[0].style.color=this.property.context.webrtcServerConnectedTime > 0 ? 'green' : '';
		protocolsDom.getElementsByClassName("protocol-webrtc")[0].setAttribute('title', this.property.context.p2pWebrtcPeerId + "\n" + this.property.selfRanges);

		var websocketName = protocolsDom.getElementsByClassName("protocol-websocket")[0];
		var upnpInfo = this.utils_.format(', UPNP: {0}, Port: {1}/{2}, {3}, {4}', this.property.context.upnpMapSuccess ? 'Yes' : 'No',
				this.property.context.upnpMappedInPort, this.property.context.upnpMappedOutPort, this.property.context.upnpMappedAddress,
				this.utils_.formatDate_('Y-m-d H:i:s', this.property.context.upnpMapCompleteTime / 1000));
		websocketName.style.color=this.property.context.trackerServerConnectedTime > 0 ? '#00bb00' : '';
		websocketName.setAttribute('title', this.property.context.p2pWebsocketPeerId + upnpInfo);

		var doms = protocolsDom.getElementsByClassName("value");
		for ( var type = 0; type < 4; type++) {
			var pdata = this.property.statData.protocols[type + 1];
			if (!pdata) {
				continue;
			}
			//
			var temp = type;
			if (type == 3) {
				temp = 1;
			}
			doms[temp * 2].innerHTML=this.utils_.format('{0}, {1}%', this.utils_.size(pdata.totalReceiveBytes),(pdata.shareReceiveRatio * 100).toFixed(1));
			if (temp > 0) // not cdn
			{
				doms[temp * 2 + 1].innerHTML=this.utils_.format('{0}, {1}%', this.utils_.size(pdata.totalSendBytes),(pdata.shareSendRatio * 100).toFixed(1));
			}
		}
	},

	updatePieces_ : function() {
		var pieceCount = 0;
		var page = p2p$.com.tools.console.Index;
		var segments = this.property.metaData.segments;
		for ( var i = 0; i < segments.length; i++) {
			var segment = segments[i];
			pieceCount += (segment.pieceCount + 1);
			if (pieceCount > 1000 && page.statusParams_.segmentStartWithPlayer_) {
				break;
			}
		}
		if (this.pieces.length < pieceCount) {
			while (this.pieces.length < pieceCount) {
				var el = document.createElement("div");
				el.className="piece-units";
				el.innerHTML="&nbsp;";
				this.pieces.push(el);
				this.elements_.pieces.appendChild(el);
			}
		}
		var pieceIndex = 0;
		for ( var i = 0; i < segments.length; i++) {
			var segment = segments[i];
			if (pieceIndex < this.pieces.length) {
				var dom = this.pieces[pieceIndex];
				dom.innerHTML=this.utils_.format('<span>{0}</span>', segment.id % 10000);
				dom.className=segment.discontinuity ? 'ts-discontinuity' : (segment.beginOfMeta ? 'ts-begin' : 'ts');
				dom.style.backgroundColor='';
				pieceIndex++;
			}
			for ( var j = 0; j < segment.pieces.length && pieceIndex < this.pieces.length; j++, pieceIndex++) {
				var piece = segment.pieces[j];
				var color = '#ddd';
				if (piece.completedTime > 0) {
					switch (piece.receiveProtocol) {
					case 1:
						color = '#aa0000';
						break;
					case 2:
					case 4:
						color = 'green';
						break;
					case 3:
						color = '#00aa00';
						break;
					default:
						color = '#000000';
						break;
					}
				} else if (piece.receiveStartTime > 0) {
					if (piece.receiveByStable) {
						color = 'blue';
					} else {
						color = 'orange';
					}
				} else if (piece.shareInRanges > 0) {
					color = '#ffdddd'; // pink';
				}
				var dom = this.pieces[pieceIndex];
				dom.innerHTML=piece.playedTime > 0 ? '*' : '&nbsp;';
				dom.className="piece-units";
				dom.style.backgroundColor=color;
				dom.setAttribute("title",this.utils_.format('{0}/{1}/{2}, Share In Ranges: {3}', segment.id, piece.type == 0 ? 'tn' : 'pn',
						piece.id, piece.shareInRanges));
			}
		}

		while (pieceIndex < this.pieces.length) {
			var dom = this.pieces[pieceIndex];
			dom.innerHTML='';
			dom.className="blank";
			dom.style.backgroundColor="";
			pieceIndex++;
		}
	},

	updateSegments_ : function() {
		for ( var id in this.segments) {
			var item = this.segments[id];
			item.__removeMarked = true;
		}

		var inPeusdoTime = true;
		var displayCount = 0;
		var segments = this.property.metaData.segments;
		for ( var i = 0; segments && i < segments.length && displayCount < 5; i++) {
			var info = segments[i];
			if (info.id < this.property.urgentSegmentId) {
				continue;
			}
			var dom = this.segments[info.id];
			if (!dom) {
				dom = document.createElement("tr");
				dom.className="row";
				dom.setAttribute("id","segment-item-"+info.id);
				dom.innerHTML='<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>';
				this.elements_.segments.appendChild(dom);
				this.segments[info.id] = dom;
			}
			dom.__removeMarked = false;
			// dom.css('background', info.completedSize >= info.size ? 'green' : '#000');
			displayCount++;

			var peusdoMark = '';
			if (this.property.livePseudoPlayTime > 0) {
				peusdoMark = inPeusdoTime ? ' *' : '';
				if (info.startTime > this.property.livePseudoPlayTime * 1000) {
					inPeusdoTime = false;
				}
			}

			var doms = dom.getElementsByTagName("td");
			doms[0].innerHTML=info.id; // + (info.id > 1000000 ? (' - ' + this.utils_.formatDate_('Y-m-d H:i:s', info.id * 1000))
			// :
			// ''));
			doms[1].innerHTML=this.utils_.size(info.size || 0);
			doms[2].innerHTML=(info.startTime > 86400000 ? this.utils_.formatDate_('Y-m-d H:i:s', info.startTime) : this.utils_.formatDuration_(info.startTime / 1000)) + peusdoMark;
			doms[3].innerHTML=info.duration / 1000;
			doms[4].innerHTML=info.size > 0 ? this.utils_.speed(info.size * 1000 / info.duration, true) : '-';
			doms[5].innerHTML=(info.receiveSpeed > 0) ? this.utils_.speed(info.receiveSpeed, true) : '-';
			doms[6].innerHTML=(info.lastReceiveTime && info.lastReceiveTime > 0) ? this.utils_.formatDate_('Y-m-d H:i:s', info.lastReceiveTime) : '-';
			doms[7].innerHTML=(info.pendingPieceCount || 0) + ' / ' + info.completedPieceCount + ' / ' + info.pieceCount;
			doms[8].innerHTML=Math.round(info.completedSize * 100 / info.size) + '%';
		}

		for ( var id in this.segments) {
			var item = this.segments[id];
			if (item.__removeMarked) {
				item.remove();
				delete this.segments[id];
			}
		}
	},

	updatePeers_ : function() {
		for ( var id in this.peers) {
			var item = this.peers[id];
			item.__removeMarked = true;
		}

		var ipHelper = p2p$.com.tools.console.Index.ipHelper_;
		var peerTypeCounts = {};
		var allPeers = this.property.stablePeers ? this.property.stablePeers.concat(this.property.otherPeers || []) : [];
		for ( var i = 0; i < allPeers.length; i++) {
			var info = allPeers[i];
			var dom = this.peers[info.remoteId];
			if (!dom) {
				dom = document.createElement("tr");
				dom.className="row";
				dom.setAttribute("id", "peer-item-"+info.remoteId);
				dom.innerHTML='<td></td> <td></td> <td></td> <td></td> <td></td> <td></td> <td></td>'
						+ '<td></td> <td></td> <td></td> <td></td> <td></td> <td></td>';
				this.elements_.peers.appendChild(dom);
				this.peers[info.remoteId] = dom;
			}
			dom.__removeMarked = false;

			peerTypeCounts[info.type] = (peerTypeCounts[info.type] || 0) + 1;

			var fullPeerName = info.name || info.remoteType || '';
			var displayPeerName = fullPeerName;
			if (displayPeerName.length > 10 && displayPeerName.indexOf('/') > 0) {
				var peerNames = displayPeerName.split('/');
				if (peerNames[0].length > 10) {
					peerNames[0] = peerNames[0].substr(0, 8) + '...';
				}
				displayPeerName = peerNames.join('/');
			}

			var doms = dom.getElementsByTagName("td");
			var col = 0;
			doms[col++].innerHTML=(displayPeerName);
			doms[0].setAttribute('title', fullPeerName);
			doms[col++].innerHTML=(info.type);
			doms[col].setAttribute('title', info.remoteId + "\n" + info.selfRanges);
			doms[col++].innerHTML=(info.type == 'cdn' ? ('QoS: ' + this.getQosFromUrl_(info.remoteId)) : info.remoteId.substr(0, 10) + "...");
			doms[col++].innerHTML=(info.remoteAddress == "Unknown" ? (info.remoteId.substr(0, 16) + "...") : info.remoteAddress);
			doms[col++].innerHTML=(ipHelper.getNameByIp_(info.remoteAddress, this.updatePeers_, this));
			doms[col++].innerHTML=(info.lastReceiveSpeed > 0 ? this.utils_.speed(info.lastReceiveSpeed, true) : '-');
			doms[col++].innerHTML=(this.utils_.formatDate_('Y-m-d H:i:s', info.lastReceiveTime));
			doms[col++].innerHTML=(this.utils_.size(info.totalReceiveBytes || 0));
			doms[col++].innerHTML=(info.totalReceivePieces);
			doms[col++].innerHTML=(this.utils_.size(info.totalSendBytes || 0));
			doms[col++].innerHTML=(info.totalSendPieces);
			var totalMessages = info.totalSendRanges + info.totalReceiveRanges + info.totalSendRequests + info.totalReceiveRequests + info.totalSendResponses
					+ info.totalReceiveResponses;
			var messageTitle = this.utils_.format('Range: {0}/{1}, Request: {2}/{3}, Response: {4}/{5}', info.totalSendRanges,
					info.totalReceiveRanges, info.totalSendRequests, info.totalReceiveRequests, info.totalSendResponses, info.totalReceiveResponses);
			doms[col].setAttribute('title', messageTitle);
			doms[col++].innerHTML=((info.pendingRequestCount || 0) + ' / ' + info.totalReceiveResponses + ' / ' + info.totalSendRequests + ' / ' + totalMessages);
			doms[col].style.color=(info.totalChecksumErrors > 0 || info.totalInvalidErrors > 0) ? 'red' : 'green';
			doms[col++].innerHTML=(info.totalChecksumErrors + ' / ' + info.totalInvalidErrors);
		}

		for ( var id in this.peers) {
			var item = this.peers[id];
			if (item.__removeMarked) {
				item.remove();
				delete this.peers[id];
			}
		}

		var peerStatText = '';
		for ( var orgType in peerTypeCounts) {
			var type = (orgType || '').toLowerCase();
			var count = peerTypeCounts[type];
			var nodeCount = this.property.context[type + 'TotalNodeCount'];
			if (peerStatText != '') {
				peerStatText += ', ';
			}
			peerStatText += this.utils_.format('{0}: {1}/{2} 个', type, count, (nodeCount > 10000 || !nodeCount) ? '-' : nodeCount);
		}
		var doms = this.elements_.peers.getElementsByClassName('peer-type-stats');
		doms[0].innerHTML=(peerStatText);
	},

	getQosFromUrl_ : function(url) {
		if (!url) {
			return '-';
		}
		var pos = url.indexOf('&qos=');
		if (pos < 0) {
			pos = url.indexOf('?qos=');
		}
		if (pos < 0) {
			return '-';
		}
		var end = url.indexOf('&', pos + 5);
		return url.substring(pos + 5, end);
	},

	getGslbErrorDetails_ : function(code, orgDetails) {
		var details = {
			'-1' : '等待中',
			0 : '正常',
			200 : 'HTTP 200',
			302 : 'HTTP Moved',
			400 : '无法计算出可用CDN节点',
			403 : '禁止访问',
			404 : '文件未找到',
			413 : '直播流名称不存在',
			414 : '用户所在国家不允许直播',
			415 : '用户所在省份不允许直播',
			416 : '请求的子平台ID不在保留平台,不允许直播',
			417 : '请求被配置为黑名单,不允许在此平台播放',
			418 : '请求参数不完整，缺少format,expect参数',
			419 : '请求参参数不合法,非法参数:platid, splatid',
			420 : '文件名错误, Base64解密到了错误的文件名',
			421 : '盗链请求, 被屏蔽',
			422 : '请求被服务器拒绝/屏蔽',
			423 : '请求参数不完整, 缺少tm,key,mmsid参数',
			424 : 'URL已过期',
			425 : 'URL校验不通过, MD5错误',
			426 : '请求参数不符合规范：format/expetct/platid/splatid',
			427 : '会员/付费的 token 验证失败',
			428 : 'LinkShell 防盗链时间过期',
			429 : 'LinkShell 防盗链验证失败',
			430 : '直播流在此平台不允许播放',
			431 : 'Cookie验证错误',
			432 : 'LinkShell防盗链验证,MAC被加入了黑名单'
		};
		return details[code] || orgDetails || '未知错误';
	},

	getVideoRateName_ : function(type) {
		var vtypes = {
			1 : 'flv_350',
			2 : '3gp_320X240',
			3 : 'flv_enp',
			4 : 'chinafilm_350',
			8 : 'flv_vip',
			9 : 'mp4',
			10 : 'flv_live',
			11 : 'union_low',
			12 : 'union_high',
			13 : 'mp4_800',
			16 : 'flv_1000',
			17 : 'flv_1300',
			18 : 'flv_720p',
			19 : 'mp4_1080p',
			20 : 'flv_1080p6m',
			21 : 'mp4_350',
			22 : 'mp4_1300',
			23 : 'mp4_800_db',
			24 : 'mp4_1300_db',
			25 : 'mp4_720p_db',
			26 : 'mp4_1080p6m_db',
			27 : 'flv_yuanhua',
			28 : 'mp4_yuanhua',
			29 : 'flv_720p_3d',
			30 : 'mp4_720p_3d',
			31 : 'flv_1080p6m_3d',
			32 : 'mp4_1080p6m_3d',
			33 : 'flv_1080p_3d',
			34 : 'mp4_1080p_3d',
			35 : 'flv_1080p3m',
			44 : 'flv_4k',
			45 : 'flv_4k_265',
			46 : 'flv_3m_3d',
			47 : 'h265_flv_800',
			48 : 'h265_flv_1300',
			49 : 'h265_flv_720p',
			50 : 'h265_flv_1080p',
			51 : 'mp4_720p',
			52 : 'mp4_1080p3m',
			53 : 'mp4_1080p6m',
			54 : 'mp4_4k',
			55 : 'mp4_4k_15m',
			57 : 'flv_180',
			58 : 'mp4_180',
			59 : 'mp4_4k_db',
			68 : 'baseline_marlin',
			69 : 'baseline_access',
			70 : '180_marlin',
			71 : '180_access',
			72 : '350_marlin',
			73 : '350_access',
			74 : '800_marlin',
			75 : '800_access',
			76 : '1300_marlin',
			77 : '1300_access',
			78 : '720p_marlin',
			79 : '720p_access',
			80 : '1080p3m_marlin',
			81 : '1080p3m_access',
			82 : '1080p6m_marlin',
			83 : '1080p6m_access',
			84 : '1080p15m_marlin',
			85 : '1080p15m_access',
			86 : '4k_marlin',
			87 : '4k_access',
			88 : '4k15m_marlin',
			89 : '4k15m_access',
			90 : '4k30m_marlin',
			91 : '4k30m_access',
			92 : '800_db_marlin',
			93 : '800_db_access',
			94 : '1300_db_marlin',
			95 : '1300_db_access',
			96 : '720p_db_marlin',
			97 : '720p_db_access',
			98 : '1080p3m_db_marlin',
			99 : '1080p3m_db_access',
			100 : '1080p6m_db_marlin',
			101 : '1080p6m_db_access',
			102 : '1080p15m_db_marlin',
			103 : '1080p15m_db_access',
			104 : '4k_db_marlin',
			105 : '4k_db_access',
			106 : '4k15m_db_marlin',
			107 : '4k15m_db_access',
			108 : '4k30m_db_marlin',
			109 : '4k30m_db_access',
			110 : '720p_3d_marlin',
			111 : '720p_3d_access',
			112 : '1080p3m_3d_marlin',
			113 : '1080p3m_3d_access',
			114 : '1080p6m_3d_marlin',
			115 : '1080p6m_3d_access',
			116 : '1080p15m_3d_marlin',
			117 : '1080p15m_3d_access',
			118 : '4k_3d_marlin',
			119 : '4k_3d_access',
			120 : '4k15m_3d_marlin',
			121 : '4k15m_3d_access',
			122 : '4k30m_3d_marlin',
			123 : '4k30m_3d_access',
			124 : 'mp4_180_logo',
			125 : 'mp4_350_logo',
			126 : 'mp4_800_logo'
		};
		return vtypes[type] || '';
	},

	closeRemoteChannel_ : function() {
		if (!confirm('停止后，播放器可能无法正常播放，确定关闭该频道吗？')) {
			return;
		}
		this.videoStream_.requestPlayStop_(this.property.channelUrl);
	}
});

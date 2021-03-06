h5$.nameSpace('com.p2p.ts2mp4');

h5$.com.p2p.ts2mp4.FileHandler = h5$.createClass(
{
	syncFound: false,
	pmtPID: 0,
	audioPID: 0,
	videoPID: 0,
	audioPES: null,
	videoPES: null,
	startTime:null,
	
	__ctor: function()
	{
		this.audioPES = new h5$.com.p2p.ts2mp4.Audio();
		this.videoPES = new h5$.com.p2p.ts2mp4.Video();
	},
	
	setStatus: function( message )
	{
		document.getElementById('status').innerHTML = message;
	},
	
	beginProcessFile: function( seek, seekTime )
	{
		this.syncFound = false;
	},

	inputBytesNeeded: function()
	{
		if(this.syncFound) return 187;
		else return 1;
	},
	//分析188字节第一个为0x47
	/**
	 * @params
	 * @input 解码数据
	 * @params 参数
	 * @fragmentSquenceNumber ts编号
	 * @encode 是否需要解码
	 */
	processFileSegment: function(input, params,fragmentSequenceNumber,encode)
	{
		var _usedBytes = 0;
		var _startTime;
		this.startTime = null;
		this.audioPES.reset();
		this.videoPES.reset();
		while(_usedBytes < input.length )
		{
			if(!this.syncFound)
			{
				if(_usedBytes + 1 > input.length ) return null;
				if(input[_usedBytes ++] == 0x47) this.syncFound = true;
			}
			else
			{
				if(_usedBytes + 187 > input.length ) return null;
				this.syncFound = false;
				var packet = new h5$.com.p2p.ts2mp4.ByteArray(input.subarray(_usedBytes, _usedBytes + 187));
				_startTime = this.processPacket(packet,encode);
				if(_startTime !== null&&this.startTime === null)
				{
					this.startTime = _startTime;
				}
				if(!encode&&this.startTime!==null)//如果不需要解码，只需计算出ts的开始时间即可
				{
					break;
				}
				_usedBytes += 187;
			}
		}
		if(!encode) return input;//无需解码

		this.flushFileSegment(input);

		/**
		var base64String = this.base64Uint8Array(this.videoPES._h264Data.data);
		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/saveBase64AsH264');
		var params = "data=" + encodeURIComponent(base64String);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.send(params);
		return;
		**/

		var handlerOptions = 
		{
			video:
			{
				info: this.videoPES._videoInfo,
				avcc: this.videoPES._avccData,
				items: this.videoPES._tags,
			},
			audio:
			{
				info: this.audioPES._audioInfo,
				aac: this.audioPES._aacData,
				items: this.audioPES._tags
			},
			fragmentSequenceNumber: fragmentSequenceNumber || 0,
			start:0,
			type:1
		};
		
		h5$.apply(handlerOptions.video.info, params || {});
		if( params)
		{
			if(params.duration)
			{	
				handlerOptions.audio.info.duration = Math.floor(params.duration * handlerOptions.audio.info.timeScale / 1000);
				var frameRate = Math.ceil(handlerOptions.audio.info.duration / handlerOptions.audio.items.length);
				handlerOptions.audio.info.duration = frameRate * handlerOptions.audio.items.length;
			}
			if(params.start)
			{
				handlerOptions.start=params.start;
			}
			if(params.type)
			{
				handlerOptions.type=params.type;
			}
		}
		
		
		var mp4Handler = new h5$.com.p2p.ts2mp4.toFMP4(handlerOptions);//Mp4Handler(handlerOptions);
		var data = mp4Handler.toBuffer();
		return data;
	},
	getMediaStreamAvccName: function()
	{
		var avcc = this.videoPES._avccData;
		var name = 'avc1.';
		for( var i = 0; i < 3; i ++ )
		{
			var byteValue = avcc.getByte(i + 1).toString(16);
			if( byteValue.length < 2 ) byteValue = ('0' + byteValue);
			name += byteValue;
		}
		return name;
	},
	
	base64Uint8Array: function( bytes )
	{
		var base64    = '';
		var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
		var byteLength    = bytes.byteLength;
		var byteRemainder = byteLength % 3;
		var mainLength    = byteLength - byteRemainder;
		var a, b, c, d;
		var chunk;
	 
		// Main loop deals with bytes in chunks of 3
		for (var i = 0; i < mainLength; i = i + 3)
		{
			// Combine the three bytes into a single integer
			chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
				 
			// Use bit masks to extract 6-bit segments from the triplet
			a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
			b = (chunk & 258048)   >> 12; // 258048 = (2^6 - 1) << 12
			c = (chunk & 4032)     >>  6; // 4032 = (2^6 - 1) << 6
			d = chunk & 63;               // 63 = 2^6 - 1
				 
			// Convert the raw binary segments to the appropriate ASCII encoding
			base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
		}
	 
		// Deal with the remaining bytes and padding
		if (byteRemainder == 1)
		{
			chunk = bytes[mainLength];
			a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2
			// Set the 4 least significant bits to zero
			b = (chunk & 3)   << 4; // 3 = 2^2 - 1	 
			base64 += encodings[a] + encodings[b] + '==';
		}
		else if (byteRemainder == 2)
		{
			chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
			a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
			b = (chunk & 1008)  >>  4; // 1008 = (2^6 - 1) << 4
			// Set the 2 least significant bits to zero
			c = (chunk & 15)    <<  2; // 15 = 2^4 - 1
			base64 += encodings[a] + encodings[b] + encodings[c] + '=';
		}

		return base64;
	},
		
	endProcessFile: function( input )
	{
		return null;	
	},
	//分析187字节
	processPacket: function(packet)
	{
		// decode rest of transport stream prefix (after the 0x47 flag byte)
		
		// top of second byte
		var value = packet.readUnsignedByte();		
		var tei = Boolean(value & 0x80);	// error indicator
		var pusi = Boolean(value & 0x40);	// payload unit start indication
		var tpri = Boolean(value & 0x20);	// transport priority indication
		
		// bottom of second byte and all of third
		value <<= 8;
		value += packet.readUnsignedByte();
		
		var pid = value & 0x1fff;	// packet ID
		
		// fourth byte
		value = packet.readUnsignedByte();
		var scramblingControl = (value >> 6) & 0x03;	// scrambling control bits
		var hasAF = Boolean(value & 0x20);	// has adaptation field
		var hasPD = Boolean(value & 0x10);	// has payload data
		var ccount = value & 0x0f;		// continuty count
		
		// technically hasPD without hasAF is an error, see spec
		
		if(hasAF)
		{
			// process adaptation field
			var afLen = packet.readUnsignedByte();
			
			// don't care about flags
			// don't care about clocks here
			packet.position += afLen;	// skip to end
		}
		
		if(hasPD)
		{
			return this.processES(pid, pusi, packet);
		}
		return null;
	},
	
	processES: function( pid, pusi, packet)
	{
		if(pid === 0)	// PAT
		{
			if(pusi) this.processPAT(packet);
		}
		else if(pid == this.pmtPID)
		{
			if(pusi) this.processPMT(packet);
		}
		else if(pid == this.audioPID)
		{
			this.audioPES.processES(pusi, packet);
		}
		else if(pid == this.videoPID)
		{
			return this.videoPES.processES(pusi, packet);
		}
		return null;	// ignore all other pids
	},
	
	processPAT: function( packet )
	{
		var pointer = packet.readUnsignedByte();
		var tableID = packet.readUnsignedByte();
		
		var sectionLen = packet.readUnsignedShort() & 0x03ff; // ignoring misc and reserved bits
		var remaining = sectionLen;
		
		packet.position += 5; // skip tsid + version/cni + sec# + last sec#
		remaining -= 5;
		
		while(remaining > 4)
		{
			packet.readUnsignedShort(); // program number
			this.pmtPID = packet.readUnsignedShort() & 0x1fff; // 13 bits
			remaining -= 4;			
			//return; // immediately after reading the first pmt ID, if we don't we get the LAST one
		}
		
		// and ignore the CRC (4 bytes)
	},
	
	processPMT: function( packet )
	{
		var pointer = packet.readUnsignedByte();
		var tableID = packet.readUnsignedByte();
		
		if (tableID != 0x02)
		{
			console.log("PAT pointed to PMT that isn't PMT");
			return; // don't try to parse it
		}
		var sectionLen = packet.readUnsignedShort() & 0x03ff; // ignoring section syntax and reserved
		var remaining = sectionLen;
		
		packet.position += 7; // skip program num, rserved, version, cni, section num, last section num, reserved, PCR PID
		remaining -= 7;
		
		var piLen = packet.readUnsignedShort() & 0x0fff;
		remaining -= 2;
		
		packet.position += piLen; // skip program info
		remaining -= piLen;
		
		while(remaining > 4)
		{
			var type = packet.readUnsignedByte();
			var pid = packet.readUnsignedShort() & 0x1fff;
			var esiLen = packet.readUnsignedShort() & 0x0fff;
			remaining -= 5;
			
			packet.position += esiLen;
			remaining -= esiLen;
			
			switch(type)
			{
				case 0x1b: // H.264 video
					this.videoPID = pid;
					break;
				case 0x0f: // AAC Audio / ADTS
					this.audioPID = pid;
					break;			
				// need to add MP3 Audio  (3 & 4)
				default:
					console.log("unsupported type " + type.toString(16) + " in PMT");
					break;
			}
		}
		
		// and ignore CRC
	},
	
	flushFileSegment: function( input )
	{
		this.videoPES.processES(false, null, true);
		this.audioPES.processES(false, null, true);
	}
});
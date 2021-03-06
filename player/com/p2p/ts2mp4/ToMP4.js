h5$.nameSpace("com.p2p.ts2mp4");
h5$.com.p2p.ts2mp4.toMP4 =  h5$.createClass({
	audio: null,
	video: null,
	fragmentSequenceNumber: 0,
	start:0,
	movieBoxSize: 0,
	dataOffset: 0,
	videoDataOffset: 0,
	videoDataSize: 0,
	audioDataOffset: 0,
	autioDataSize: 0,
	dataSize: 0,
	fileData: null,
	filetype:true,
	moofpos:0,
	type:1,
	videooffsetpos:[],
	audiooffsetpos:[],
	videoMoofoffset:[],
	audioMoofoffset:[],
	config:null,
	__ctor: function( configer )
	{
		if( Object.prototype.toString.call(configer) == '[object Object]' )
		{
			for( var name in configer )
			{
//				console.log(name,":",configer[name]);
				this[name] = configer[name];
			}
		}
		this.config = h5$.com.p2p.vo.Config;
	},
	toBuffer: function()
	{
		this.dataSize = 0;
		this.movieBoxSize = (this.video.items.length + this.audio.items.length) * 8 + 2000;
		var i;
		var item;
		for(i = 0; i < this.video.items.length; i ++ )
		{
			item = this.video.items[i];
			this.dataSize += item.data.length;
		}
		this.videoDataSize = this.dataSize;
		for(i = 0; i < this.audio.items.length; i ++ )
		{
			item = this.audio.items[i];
			this.dataSize += item.data.length;
		}
		this.autioDataSize = this.dataSize - this.videoDataSize;
		this.fileData = new Uint8Array(this.dataOffset + this.dataSize);
		var offset = 0;
		offset += this.writeFileType(this.fileData, offset);
		offset += this.writeFreeBlock(this.fileData, offset);
		offset += this.writeMovie(this.fileData, offset);
		offset += this.writeMediaData(this.fileData, offset);
		return this.fileData;
	},
	writeArrayBuffer: function( to, offset, from )
	{
		var i;
		if( from.className == 'WebP2P.ts2mp4.ByteArray' )
		{
			for(i = 0; i < from.length; i ++ )
			{
				to[offset + i] = from.getByte(i);
			}
		}
		else
		{
			for(i = 0; i < from.length; i ++ )
			{
				to[offset + i] = from[i];
			}
		}
		return from.length;
	},
	
	writeArrayString: function( to, offset, from )
	{
		for( var i = 0; i < from.length; i ++ )
		{
			to[offset + i] = from.charCodeAt(i);
		}
		return from.length;
	},
	
	writeArrayUint8: function( to, offset, from )
	{
		var position = offset;
		if( Object.prototype.toString.call(from) == '[object Array]' )
		{
			for( var i = 0; i < from.length; i ++ )
			{
				position += this.writeArrayUint8(to, position, from[i]);
			}
		}
		else
		{
			to[position ++] = from & 0xff;
		}
		return position - offset;
	},

	writeArrayUint16: function( to, offset, from )
	{
		var position = offset;
		if( Object.prototype.toString.call(from) == '[object Array]' )
		{
			for( var i = 0; i < from.length; i ++ )
			{
				position += this.writeArrayUint16(to, position, from[i]);
			}
		}
		else
		{
			to[position ++] = (from >> 8) & 0xff;
			to[position ++] = from & 0xff;
		}
		return position - offset;
	},
	
	writeArrayUint32: function( to, offset, from )
	{
		var position = offset;
		if( Object.prototype.toString.call(from) == '[object Array]' )
		{
			for( var i = 0; i < from.length; i ++ )
			{
				position += this.writeArrayUint32(to, position, from[i]);
			}
		}
		else
		{
			to[position ++] = (from >> 24) & 0xff;
			to[position ++] = (from >> 16) & 0xff;
			to[position ++] = (from >> 8) & 0xff;
			to[position ++] = from & 0xff;
		}
		return position - offset;
	},
	writeFileType: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "ftyp");
		size += this.writeArrayString(buffer, offset + size, "isom"); // major brand
		size += this.writeArrayUint32(buffer, offset + size, 1); // minor version
		size += this.writeArrayString(buffer, offset + size, "isommp42avc1"); // compatible brands
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeFreeBlock: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "free");
		size += this.writeArrayString(buffer,offset+size,"IsoMedia File Produced with GPAC 0.5.1-DEV-rev5528");
		size += this.writeArrayUint8(buffer,offset+size,0);
		this.writeArrayUint32(buffer,offset,size);
		return size;
	},
	
	writeMovie: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "moov");
		size += this.writeMovieHeader(buffer, offset + size);
		size += this.writeTrack(buffer, offset + size, true);
		size += this.writeTrack(buffer, offset + size, false);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeMovieHeader: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "mvhd");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, Math.round(new Date().getTime() / 1000) + 2082844800); // creation time
		size += this.writeArrayUint32(buffer, offset + size, Math.round(new Date().getTime() / 1000) + 2082844800); // modification time
		size += this.writeArrayUint32(buffer, offset + size, this.video.info.timeScale); // time scale
		size += this.writeArrayUint32(buffer, offset + size, this.video.info.duration); //Math.max(this.video.info.duration, this.audio.info.duration)); // duration
		size += this.writeArrayUint32(buffer, offset + size, 0x00010000); // rate
		size += this.writeArrayUint16(buffer, offset + size, 0x0100); // volume
		size += this.writeArrayUint16(buffer, offset + size, 0); // reserved
		size += this.writeArrayUint32(buffer, offset + size, [0, 0]); // reserved
		size += this.writeArrayUint32(buffer, offset + size, [0x00010000,0,0,0,0x00010000,0,0,0,0x40000000]); // unity matrix
		size += this.writeArrayUint32(buffer, offset + size, [0,0,0,0,0,0]); // pre defined
		size += this.writeArrayUint32(buffer, offset + size, 3); // next track id
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeMovieExtendBox:function(buffer,offset)
	{
		var size = 8;
		this.writeArrayString(buffer,offset+4,"mvex");
		size += this.writeMovieExtendHeader(buffer,offset+size);
		size += this.writeTrackExtend(buffer,offset+size,true);
		size += this.writeTrackExtend(buffer,offset+size,false);
//		size += this.writeTrackPrograme(buffer,offset+size,true);
//		size += this.writeTrackPrograme(buffer,offset+size,false);
		this.writeArrayUint32(buffer,offset,size);
		return size;
	},
	writeMovieExtendHeader:function(buffer,offset)
	{
		var size = 8;
		this.writeArrayString(buffer,offset+4,"mehd");
		size += this.writeArrayUint32(buffer,offset+size,0);
		size += this.writeArrayUint32(buffer,offset+size,this.fragmentSequenceNumber);//fregment_duration
//		console.log("-->duration:",this.video.info.duration);
		this.writeArrayUint32(buffer,offset,size);
		return size;
	},
	writeTrackExtend:function(buffer,offset,isVideo)
	{
		var media = isVideo ? this.video : this.audio;
		var dur = media.info.duration;///media.items.length;
		var samplesize = isVideo ? this.videoDataSize :this.autioDataSize;
		var size = 8;
		this.writeArrayString(buffer,offset+4,"trex");
		size += this.writeArrayUint32(buffer,offset+size,0);
		size += this.writeArrayUint32(buffer,offset+size,isVideo ? 1 : 2);//track_ID;
		size += this.writeArrayUint32(buffer,offset+size,1);//default_sample_description_index;
		size += this.writeArrayUint32(buffer,offset+size,Math.ceil(media.info.duration/media.items.length));//default_sample_duration;
		size += this.writeArrayUint32(buffer,offset+size,Math.ceil(samplesize/media.items.length));//default_sample_size;
		size += this.writeArrayUint32(buffer,offset+size,isVideo ? 0x10000:0x0);//default_sample_flags
//		console.log("-->trex:","dur=",Math.ceil(media.info.duration/media.items.length),",size=",Math.ceil(samplesize/media.items.length));
		this.writeArrayUint32(buffer,offset,size);
		return size;
	},
	writeTrackPrograme:function(buffer,offset,isVideo)
	{
		var size = 8;
		this.writeArrayString(buffer,offset+4,"trep");
		size += this.writeArrayUint32(buffer,offset+size,0);
		size += this.writeArrayUint32(buffer,offset+size,isVideo ? 1 : 2);//track_ID;
		this.writeArrayUint32(buffer,offset,size);
		return size;
	},
	
	writeTrack: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "trak");
		size += this.writeTrackHeader(buffer, offset + size, isVideo);
		size += this.writeMedia(buffer, offset + size, isVideo);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeEditBox: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "edts");
		size += this.writeEditListBox(buffer, offset + size, isVideo);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeEditListBox: function( buffer, offset, isVideo )
	{
		var size = 8;
		var info = isVideo ? this.video.info : this.audio.info;
		this.writeArrayString(buffer, offset + 4, "elst");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, 1); // entry count
		size += this.writeArrayUint32(buffer, offset + size, info.duration); // segment duration
		size += this.writeArrayUint32(buffer, offset + size, 0); // media time
		size += this.writeArrayUint16(buffer, offset + size, 1); // media rate integer
		size += this.writeArrayUint16(buffer, offset + size, 0); // media rate fraction
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeTrackHeader: function( buffer, offset, isVideo )
	{
		var size = 8;
		var info = isVideo ? this.video.info : this.audio.info;
		this.writeArrayString(buffer, offset + 4, "tkhd");
		size += this.writeArrayUint32(buffer, offset + size, 0x1); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, Math.round(new Date().getTime() / 1000) + 2082844800); // creation time
		size += this.writeArrayUint32(buffer, offset + size, Math.round(new Date().getTime() / 1000) + 2082844800); // modification time
		size += this.writeArrayUint32(buffer, offset + size, isVideo ? 1 : 2); // track id
		size += this.writeArrayUint32(buffer, offset + size, 0); // reserved
		size += this.writeArrayUint32(buffer, offset + size, info.duration); // duration
		size += this.writeArrayUint32(buffer, offset + size, [0, 0]); // reserved
		size += this.writeArrayUint16(buffer, offset + size, 0); // layer
		size += this.writeArrayUint16(buffer, offset + size, 0); // alternate group
		size += this.writeArrayUint16(buffer, offset + size, isVideo ? 0 : 0x0100); // volume
		size += this.writeArrayUint16(buffer, offset + size, 0); // reserved
		size += this.writeArrayUint32(buffer, offset + size, [0x00010000,0,0,0,0x00010000,0,0,0,0x40000000]); // unity matrix
		size += this.writeArrayUint32(buffer, offset + size, (info.width || 0) << 16); // width
		size += this.writeArrayUint32(buffer, offset + size, (info.height || 0) << 16); // height
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeMedia: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "mdia");
		size += this.writeMediaHeader(buffer, offset + size, isVideo);
		size += this.writeMediaHandlerRef(buffer, offset + size, isVideo);
		size += this.writeMediaInformation(buffer, offset + size, isVideo);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeMediaHeader: function( buffer, offset, isVideo )
	{
		var size = 8;
		var info = isVideo ? this.video.info : this.audio.info;
		this.writeArrayString(buffer, offset + 4, "mdhd");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, Math.round(new Date().getTime() / 1000) + 2082844800); // creation time
		size += this.writeArrayUint32(buffer, offset + size, Math.round(new Date().getTime() / 1000) + 2082844800); // modification time
		size += this.writeArrayUint32(buffer, offset + size, info.timeScale); // time scale
		size += this.writeArrayUint32(buffer, offset + size, info.duration); // duration
		size += this.writeArrayUint16(buffer, offset + size, 0x55C4); // language and pack und
		size += this.writeArrayUint16(buffer, offset + size, 0); // pre defined
		this.writeArrayUint32(buffer, offset, size);
//		console.log("-->",info.timeScale,",",info.duration);
		return size;
	},
	
	writeMediaHandlerRef: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "hdlr");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, 0); // pre defined
		size += this.writeArrayString(buffer, offset + size, isVideo ? "vide" : "soun"); // handler type
		size += this.writeArrayUint32(buffer, offset + size, [0, 0, 0]); // reserved
		size += this.writeArrayString(buffer, offset + size, isVideo ? "VideoHandler" : "SoundHandler"); // name
		size += this.writeArrayUint8(buffer, offset + size, 0); // end of name
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeMediaInformation: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "minf");
		if( isVideo )
		{
			size += this.writeVideoMediaHeader(buffer, offset + size);
		}
		else
		{
			size += this.writeAudioMediaHeader(buffer, offset + size);
		}
		size += this.writeDataInformation(buffer, offset + size, isVideo);
		size += this.writeSampleTable(buffer, offset + size, isVideo);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeVideoMediaHeader: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "vmhd");
		size += this.writeArrayUint32(buffer, offset + size, 0x1); // full box version and flags
		size += this.writeArrayUint16(buffer, offset + size, 0); // graphics mode
		size += this.writeArrayUint16(buffer, offset + size, [0,0,0]); // opcolors
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},

	writeAudioMediaHeader: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "smhd");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint16(buffer, offset + size, 0); // balance
		size += this.writeArrayUint16(buffer, offset + size, 0); // reserved
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},

	writeDataInformation: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "dinf");
		size += this.writeDataReference(buffer, offset + size, isVideo);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeDataReference: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "dref");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size,1); // entry count
		size += this.writeDataInfoUrl(buffer, offset + size, isVideo);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeDataInfoUrl: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "url ");
		size += this.writeArrayUint32(buffer, offset + size, 0x1); // full box version and flags
		size += this.writeArrayString(buffer, offset + size, "http://www.le.com"); 
		// empty location as same file
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeSampleTable: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "stbl");
		size += this.writeSampleDescription(buffer, offset + size, isVideo);
		size += this.writeSampleTimestamp(buffer, offset + size, isVideo);
//		if(isVideo )
//		{
//			size += this.writeSyncSample(buffer, offset + size);
//		}
		size += this.writeSampleToChunk(buffer, offset + size, isVideo);
		size += this.writeSampleSize(buffer, offset + size, isVideo);
		size += this.writeChunkOffset(buffer, offset + size, isVideo);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeSyncSample: function( buffer, offset )
	{
		var syncEntries = [];
		var i;
		var item;
		for(i = 0; i < this.video.items.length; i ++ )
		{
			item = this.video.items[i];
			item.sampleNumber = i + 1;
			if( item.isKeyFrame ) syncEntries.push(item);
		}
		
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "stss");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, syncEntries.length); // entry count
		for(i = 0; i < syncEntries.length; i ++ )
		{
			item = syncEntries[i];
			size += this.writeArrayUint32(buffer, offset + size, item.sampleNumber); // sample number
		}
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeSampleDescription: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "stsd");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, 1); // entry count
		if( isVideo )
		{
			size += this.writeVisualSampleEntry(buffer, offset + size);
		}
		else
		{
			size += this.writeAudioSampleEntry(buffer, offset + size);
		}
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeVisualSampleEntry: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "avc1");
		size += this.writeArrayUint8(buffer, offset + size, [0,0,0,0,0,0]); // reserved
		size += this.writeArrayUint16(buffer, offset + size, 1); // data reference index
		size += this.writeArrayUint16(buffer, offset + size, 0); // pre defined
		size += this.writeArrayUint16(buffer, offset + size, 0); // reserved
		size += this.writeArrayUint32(buffer, offset + size, [0,0,0]); // pre defined
		size += this.writeArrayUint16(buffer, offset + size, this.video.info.width); // width
		size += this.writeArrayUint16(buffer, offset + size, this.video.info.height); // height
		size += this.writeArrayUint32(buffer, offset + size, 0x00480000); // horiz resolution
		size += this.writeArrayUint32(buffer, offset + size, 0x00480000); // vert resolution
		size += this.writeArrayUint32(buffer, offset + size, 0); // reserved
		size += this.writeArrayUint16(buffer, offset + size, 1); // frame count
		for( var i = 0; i < 32; i ++ )
		{
			size += this.writeArrayUint8(buffer, offset + size, 0); // 32 bytes padding name
		}
		size += this.writeArrayUint16(buffer, offset + size, 0x0018); // depth
		size += this.writeArrayUint16(buffer, offset + size, 0xffff); // pre defined
		size += this.writeAVCDecoderConfiguration(buffer, offset + size);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeAVCDecoderConfiguration: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "avcC");
		if( this.video.avcc )
		{
			size += this.writeArrayBuffer(buffer, offset + size, this.video.avcc);
//			size += this.writeArrayUint32(buffer, offset + size,0xfcf8f800);
		}
		else
		{
			var sequences = [0x67,0x42,0xC0,0x15,0xD9,0x41,0xE0,0x8E,0x9A,0x80,0x80,0x80,0xA0,0x00,0x00,0x03,0x00,0x20,0x00,0x00,0x03,0x03,0xD1,0xE2,0xC5,0xCB];
			size += this.writeArrayUint8(buffer, offset + size, 1); // configuration version
			size += this.writeArrayUint8(buffer, offset + size, 0x42); // profile indication => baseline
			size += this.writeArrayUint8(buffer, offset + size, 0xC0); // profile compatibility
			size += this.writeArrayUint8(buffer, offset + size, 21); // level indication
			size += this.writeArrayUint8(buffer, offset + size, 0xFF); // length size minus one
			size += this.writeArrayUint8(buffer, offset + size, 0xE1); // num of sequence parameter sets
			size += this.writeArrayUint16(buffer, offset + size, sequences.length); // sequence size
			size += this.writeArrayUint8(buffer, offset + size, sequences); // sequence
			size += this.writeArrayUint8(buffer, offset + size, 1); // num of picture parameter sets
			size += this.writeArrayUint16(buffer, offset + size, 4); // picture size
			size += this.writeArrayUint8(buffer, offset + size, [0x68,0xC9,0x23,0xC8]); // picture
		}
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeAudioSampleEntry: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "mp4a");
		size += this.writeArrayUint8(buffer, offset + size, [0,0,0,0,0,0]); // reserved
		size += this.writeArrayUint16(buffer, offset + size, 1); // data reference index
		size += this.writeArrayUint32(buffer, offset + size, [0,0]); // reserved
		size += this.writeArrayUint16(buffer, offset + size,  this.audio.info.channelCount || 2); // channel count
		size += this.writeArrayUint16(buffer, offset + size, this.audio.info.sampleSize || 16); // sample size
		size += this.writeArrayUint16(buffer, offset + size, 0); // pre defined
		size += this.writeArrayUint16(buffer, offset + size, 0); // reserved
		size += this.writeArrayUint32(buffer, offset + size, this.audio.info.timeScale << 16); // sample rate
		size += this.writeAudioDecoderConfiguration(buffer, offset + size);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeAudioDecoderConfiguration: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "esds"); // Element Stream Descriptors
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeAudioEsDescriptionTag(buffer, offset + size); // unknown
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeAudioEsDescriptionTag: function( buffer, offset )
	{
		var size = 0;
		size += this.writeArrayUint8(buffer, offset + size, 0x03); // tag
		size += this.writeArrayUint8(buffer, offset + size, 0); // size
		size += this.writeArrayUint16(buffer, offset + size, 10); // ESID
		size += this.writeArrayUint8(buffer, offset + size, 0); // Stream Dependence Flag:1, URL Flag:1, OCR Stream Flag: 1, Stream Priority: 5
		size += this.writeAudioDecodeConfigDescriptionTag(buffer, offset + size);
		size += this.writeAudioSlConfigDescriptionTag(buffer, offset + size);
		this.writeArrayUint8(buffer, offset + 1, size - 2);
		return size;
	},
	
	writeAudioDecodeConfigDescriptionTag: function( buffer, offset )
	{
		var size = 0;
		size += this.writeArrayUint8(buffer, offset + size, 0x04); // tag
		size += this.writeArrayUint8(buffer, offset + size, 0); // size
		size += this.writeArrayUint8(buffer, offset + size, 0x40); // Object Type Id
		size += this.writeArrayUint8(buffer, offset + size, 0x14); // Stream Type = 0x05 << 2
		size += this.writeArrayUint8(buffer, offset + size, [0,0,0]); // Buffer Size DB
		size += this.writeArrayUint32(buffer, offset + size, this.autioDataSize * 8000 / this.audio.info.duration); // Max Bitrate
		size += this.writeArrayUint32(buffer, offset + size, this.autioDataSize * 8000 / this.audio.info.duration); // Avg Bitrate
		size += this.writeAudioDecodeSpecificDescriptionTag(buffer, offset + size);
		this.writeArrayUint8(buffer, offset + 1, size - 2);
		return size;
	},
	
	writeAudioDecodeSpecificDescriptionTag: function( buffer, offset )
	{
		var size = 0;
		size += this.writeArrayUint8(buffer, offset + size, 0x05); // tag
		size += this.writeArrayUint8(buffer, offset + size, 0); // size
		//size += this.writeArrayUint8(buffer, offset + size, [0x13,0x88,0x56,0xE5,0xA5,0x48,0x80]);
		if( this.audio.aac ) size += this.writeArrayBuffer(buffer, offset + size, this.audio.aac); // info
		else size += this.writeArrayUint16(buffer, offset + size, 0x1210); // info
		this.writeArrayUint8(buffer, offset + 1, size - 2);
		return size;
	},
	
	writeAudioSlConfigDescriptionTag: function( buffer, offset )
	{
		var size = 0;
		size += this.writeArrayUint8(buffer, offset + size, 0x06); // tag
		size += this.writeArrayUint8(buffer, offset + size, 0); // size
		size += this.writeArrayUint8(buffer, offset + size, 0x02); // predefined
		//size += this.writeArrayUint8(buffer, offset + size, 0); // flags
		this.writeArrayUint8(buffer, offset + 1, size - 2);
		return size;
	},
	
	writeSampleTimestamp: function( buffer, offset, isVideo )
	{
		var size = 8;
		var media = isVideo ? this.video : this.audio;
		var start = media.start;
		this.writeArrayString(buffer, offset + 4, "stts");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		if(this.type == 1)
		{			
			size += this.writeArrayUint32(buffer, offset + size, 1); // entry count
			size += this.writeArrayUint32(buffer, offset + size, media.items.length); // sample count
			size += this.writeArrayUint32(buffer, offset + size,Math.ceil(media.info.duration / media.items.length)); // sample delta
		}
		else
		{
			size += this.writeArrayUint32(buffer, offset + size, 0); // entry count
		}
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeSampleToChunk: function( buffer, offset, isVideo )
	{
		var size = 8;
		var media = isVideo ? this.video : this.audio;
		this.writeArrayString(buffer, offset + 4, "stsc");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		if(this.type == 1)
		{			
			size += this.writeArrayUint32(buffer, offset + size, 1); // entry count
			size += this.writeArrayUint32(buffer, offset + size, 1); // first chunk
			size += this.writeArrayUint32(buffer, offset + size, media.items.length); // samples per chunk
			size += this.writeArrayUint32(buffer, offset + size, 1); // sample description index
		}
		else
		{
			size += this.writeArrayUint32(buffer, offset + size, 0); // entry count
		}
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeSampleSize: function( buffer, offset, isVideo )
	{
		var size = 8;
		var media = isVideo ? this.video : this.audio;
		this.writeArrayString(buffer, offset + 4, "stsz");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, 0); // sample size
		if(this.type == 1)
		{	
			size += this.writeArrayUint32(buffer, offset + size, media.items.length); // sample count
			for( var i = 0; i < media.items.length; i ++ )
			{
				var item = media.items[i];
				size += this.writeArrayUint32(buffer, offset + size, item.data.length); // entry size
			}	
		}
		else
		{
			size += this.writeArrayUint32(buffer, offset + size, 0); //
		}
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeChunkOffset: function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "stco");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		if(this.type == 1)
		{
			size += this.writeArrayUint32(buffer, offset + size, 1); // entry count
			if(isVideo)
			{
				this.videooffsetpos.push(offset + size);
			}
			else
			{
				this.audiooffsetpos.push(offset + size);
			}
			size += this.writeArrayUint32(buffer, offset + size, 0); // chunk offset
		}
		else
		{
			size += this.writeArrayUint32(buffer, offset + size, 0); // entry count
		}
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeMoiveFragment: function( buffer, offset )
	{
		this.moofpos=offset;
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "moof");
		size += this.writeMoiveFragmentHeader(buffer, offset + size);
		if(this.type === 0)
		{
			size += this.writeTraf(buffer, offset + size, true);
			size += this.writeTraf(buffer, offset + size, false);
		}
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	
	writeMoiveFragmentHeader: function( buffer, offset )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "mfhd");
		size += this.writeArrayUint32(buffer, offset + size, 0); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, this.fragmentSequenceNumber++); // sequence number
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeTraf:function( buffer, offset, isVideo )
	{
		var size = 8;
		this.writeArrayString(buffer, offset + 4, "traf");
		size += this.writeTrafHeader(buffer, offset + size, isVideo);
		size += this.writeTrafdt(buffer, offset + size,isVideo);
		size += this.writeTrunHeader(buffer, offset + size, isVideo);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeTrafHeader:function(buffer, offset, isVideo)
	{
		var size = 8;
		var info = isVideo ? this.video.info : this.audio.info;
		var msize = isVideo ? this.videoDataSize : this.audioDataSize;
		this.writeArrayString(buffer, offset + 4, "tfhd");
		/**
		 * 0x000001 base-data-offset-present
		 * 0x000002 sample-description-index-present
		 * 0x000008 default-sample-duration-present
		 * 0x000010 default-sample-size-present
		 * 0x000020 default-sample-flags-present
		 * 0x010000 duration-is-empty
		 * 0x020000 default-base-is-moof
		 * */
		size += this.writeArrayUint32(buffer, offset + size, 0x020000); // full box version and flags
		size += this.writeArrayUint32(buffer, offset + size, isVideo ? 1 : 2); // track id
//		size += this.writeArrayUint32(buffer, offset + size, 0);//;
//		isVideo ? this.videooffsetpos.push(offset + size) : this.audiooffsetpos.push(offset + size);
//		size += this.writeArrayUint32(buffer, offset + size, 0);//base_data_offset;
//		if(!isVideo){
//			size += this.writeArrayUint32(buffer, offset + size, 0x02000000);
//		}
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeTrafdt:function(buffer, offset, isVideo)
	{
		var size = 8;
		var media = isVideo ? this.video : this.audio;
		
		this.writeArrayString(buffer, offset + 4, "tfdt");
		size += this.writeArrayUint32(buffer, offset + size, 0);
		//提取第一片时间
//		media.items.sort(function(a,b){return a.timestamp-b.timestamp;});
		var newItems = media.items.concat();
		newItems.sort(function(a,b){return a.timestamp-b.timestamp;});
		var timestamp = newItems[0].timestamp;
		var dttime = Math.ceil(timestamp*media.info.timeScale/1000);
		size += this.writeArrayUint32(buffer, offset + size,dttime);//sum duration
//		console.log("*toMp4:ts--time:",media.items[0].timestamp,dttime);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeTrunHeader:function(buffer, offset, isVideo)
	{
		var size = 8;
		var media = isVideo ? this.video : this.audio;
		var i;
		var item;
		this.writeArrayString(buffer, offset + 4, "trun");
		/*flags说明：
		 * 0x000001:data-offset-present
		 * 0x000004:first-sample-flags-present; this over-rides the default flags for the first sample only. This
makes it possible to record a group of frames where the first is a key and the rest are difference frames, without supplying explicit flags for every sample. If this flag and field are used, sample-flags shall not be present.
		 * 0x000100 sample-duration-present: 标示每一个sample有他自己的时长, 否则使用默认值.
		 * 0x000200 sample-size-present：每个sample拥有大小，否则使用默认值
		 * 0x000400 sample-flags-present：每个sample有他自己的标志，否则使用默认值
		 * 0x000800 sample-composition-time-offsets-present; 每个sample 有一个composition time offset
		 * */
		if(isVideo)
		{
			size += this.writeArrayUint32(buffer, offset + size, 0xe05);//flags//offset ,s-size
			size += this.writeArrayUint32(buffer, offset + size, media.items.length); // sample count
			this.videoMoofoffset.push(offset+size);//position
			size += this.writeArrayUint32(buffer, offset + size,0); //dat-offset
			size += this.writeArrayUint32(buffer, offset + size, 0x02000000); // first-sample-flag//
			var dur = Math.ceil(media.info.duration/media.items.length);
			for(i = 0; i < media.items.length; i ++ )
			{
				item = media.items[i];
//				console.log("-->time:",i,":",item.timestamp,",offset:",item.avcCompositionTimeOffset);
//				size += this.writeArrayUint32(buffer, offset + size, dur); // sample_size
				size += this.writeArrayUint32(buffer, offset + size, item.data.length); // sample_size
				if(item.isKeyFrame === true)
				{	
//					console.log("-->key:",item.frameType,"|",item.timestamp);
					size += this.writeArrayUint32(buffer, offset + size, 0x02000000);
				}
				else
				{
					size += this.writeArrayUint32(buffer, offset + size, 0x10000);
				}
				size += this.writeArrayUint32(buffer, offset + size, item.avcCompositionTimeOffset);
			}
		}
		else
		{
			size += this.writeArrayUint32(buffer, offset + size, 0x201);//flags//offset ,s-size
			size += this.writeArrayUint32(buffer, offset + size, media.items.length); // sample count
			this.audioMoofoffset.push(offset+size);//position
			size += this.writeArrayUint32(buffer, offset + size,0); //dat-offset
//			size += this.writeArrayUint32(buffer, offset + size, 0); // first-sample-flag//	
			for(i = 0; i < media.items.length; i ++ )
			{
				item = media.items[i];
//				console.log("size:",item.data.length);
//				if(this.start<0)
//				{
//					if(i<media.items.length-1)
//					{
//						dur = Math.ceil((media.items[i+1].timestamp - media.items[i].timestamp)*media.info.timeScale/1000);
//					}
//					else
//					{
//						dur = Math.ceil(media.info.duration+(media.items[0].timestamp-media.items[i-1].timestamp)*media.info.timeScale/1000);
//					}
////					console.log("-->time:",media.items[i].timestamp,",dur:",dur,"|",media.info.duration);
//					size += this.writeArrayUint32(buffer, offset + size, dur); // sample_duration
//				}
				size += this.writeArrayUint32(buffer, offset + size, item.data.length); // sample_size
			}
		}
		this.writeArrayUint32(buffer, offset, size);
//		console.log("--->trun:","|count:",media.items.length,"|dur:",this.audio.info.duration,"-",dur);
		return size;
	},
	writeMediaData: function( buffer, offset )
	{
		offset += this.writeArrayUint32(buffer, offset, this.dataSize + 8);
		offset += this.writeArrayString(buffer, offset, "mdat");
		var i,item;
		for(i = 0; i < this.video.items.length; i ++ )
		{
			item = this.video.items[i];
			item.dataOffset = offset;
			offset += this.writeArrayBuffer(buffer, offset, item.data);
		}
		for(i = 0; i < this.audio.items.length; i ++ )
		{
			item = this.audio.items[i];
			item.dataOffset = offset;
			offset += this.writeArrayBuffer(buffer, offset, item.data);
		}
		return offset;
	},
	writeRandom:function(buffer,offset)
	{
		console.log("-->增加文件最后标志！");
		var size = 8;
		offset += this.writeArrayString(buffer, offset+4, "mfra");
		size += this.writeRandomTrack(buffer, offset + size,true);
		size += this.writeRandomTrack(buffer, offset + size,false);
		size += this.writeRandomOffset(buffer, offset + size);
		this.writeArrayUint32(buffer, offset + size,size);
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeRandomTrack:function(buffer,offset,isVideo)
	{
		var size = 8;
		var media = isVideo ? this.video : this.audio;
		var dttime = Math.ceil(media.items[0].timestamp*media.info.timeScale/1000);
		offset += this.writeArrayString(buffer, offset+4, "tfra");
		size += this.writeArrayUint32(buffer, offset + size, 0);//version
		size += this.writeArrayUint32(buffer, offset + size, isVideo ? 1 : 2);//trackid
		size += this.writeArrayUint32(buffer, offset + size, 0);//size traf
		size += this.writeArrayUint32(buffer, offset + size, 1);//trun size
		size += this.writeArrayUint32(buffer, offset + size, dttime);
		size += this.writeArrayUint32(buffer, offset + size, this.moofpos);
		size += this.writeArrayUint8(buffer, offset + size, 0x01);//trafnum
		size += this.writeArrayUint8(buffer, offset + size, 0x01);//trunnum
		size += this.writeArrayUint8(buffer, offset + size, media.items.length);//trafnum
		this.writeArrayUint32(buffer, offset, size);
		return size;
	},
	writeRandomOffset:function(buffer,offset)
	{
		var size = 8;
		offset += this.writeArrayString(buffer, offset+4, "mfro");
		size += this.writeArrayUint32(buffer, offset + size, 0);//version
		size += this.writeArrayUint32(buffer, offset + size, 0);//version
		this.writeArrayUint32(buffer, offset, size);
		return size;
	}
});
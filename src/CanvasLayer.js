import L from 'leaflet';

export default L.Layer.extend({
	initialize: function (options) {
		L.setOptions(this, options);
	},

	onAdd: function (map) {
		if (!this._canvas) {
			this._div = L.DomUtil.create('div', 'leaflet-image-layer leaflet-zoom-animated', this.getPane());
			this._canvas1 = L.DomUtil.create('canvas', 'leaflet-canvas-overlay', this._div.parentNode);
			this._canvas = L.DomUtil.create('canvas', 'leaflet-canvas-overlay', this._div);
			this._canvas.style.zIndex = 1;
			this._setSize();
			this._canvasBox = this._canvas.getBoundingClientRect();
			L.DomEvent.on(this._canvas, 'mousemove', this._mousemove, this);

			const offscreen = this._canvas1.transferControlToOffscreen();
			this.options.dataManager.postMessage({
				cmd: 'addLayer',
				id: this.options.layerId,
				canvas: offscreen,
				dateBegin: this.options.dateBegin,
				dateEnd: this.options.dateEnd,
			}, [offscreen]);
		}

		// map.on('resize', this._setSize, this);

		this._rePaint();
	},

	_mousemove: function (ev) {
		  // tell the browser we're handling this event
		ev.preventDefault();
		ev.stopPropagation();

		mouseX = parseInt(ev.clientX - this._canvasBox.left);
		mouseY = parseInt(ev.clientY - this._canvasBox.top);

		console.log('_mousemove:', mouseX, mouseY, ev);
		// Put your mousemove stuff here
		// var newCursor;
		// for(var i=0;i<shapes.length;i++){
		// var s=shapes[i];
		// definePath(s.points);
		// if(ctx.isPointInPath(mouseX,mouseY)){
		  // newCursor=s.cursor;
		  // break;
		// }
		// }
	},

	_rePaint: function () {
		this.options.dataManager.postMessage({
			cmd: 'drawScreen',
			// id: this.options.layerId,
			width: this._canvas.width,
			height: this._canvas.height,
		});
	},

	getEvents: function () {
		let events = {
			viewreset: this._onresize
		};

		if (this._zoomAnimated) {
			events.zoomanim = this._animateZoom;
		}

		return events;
	},

	_setSize: function () {
		let mapSize = this._map.getSize();
		let min = this._map.containerPointToLayerPoint(mapSize).round();
		let size = new L.Bounds(min, min.add(mapSize).round()).getSize();
		this._canvas.width = size.x;
		this._canvas.height = size.y;
		this._canvas1.width = size.x;
		this._canvas1.height = size.y;
		console.log('_setSize', size);
	},
	rendered: function (bitmap) {
		L.DomUtil.setPosition(this._div, this._map._getMapPanePos().multiplyBy(-1));
		console.log('rendered', bitmap);
		if (bitmap) {
			let ctx = this._canvas.getContext('2d');
			ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
			ctx.drawImage(bitmap, 0, 0, this._canvas.width, this._canvas.height);
		}
	},
	_animateZoom: function (e) {
        let map = this._map;
		L.DomUtil.setTransform(this._div,
		    map._latLngBoundsToNewLayerBounds(map.getBounds(), e.zoom, e.center).min,
			map.getZoomScale(e.zoom)
		);
	},

	_onresize: function () {
		let size = this._map.getSize();

		this._canvas.width = size.x; this._canvas.height = size.y;
		this._rePaint();
	}
});
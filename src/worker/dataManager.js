import Renderer from './renderer2d.js';
import {VectorTile} from '@mapbox/vector-tile';
import Protobuf from 'pbf';

let canvas;
let cwidth, cheight;	

let abortController;

async function getBoxTiles(signal, bbox) {
	const [xmin, ymin, xmax, ymax] = bbox;
	const response = await fetch(`/box/${[xmin,ymin,xmax,ymax].map(v => v.toFixed(6)).join(',')}`, { signal });
	return response.json();
}

async function getTiles (zoom, bbox, bounds) {
	if (renderFlag) {
		console.log('отменить пред. rendering:', renderFlag, renderNum);
	}
	renderFlag = true;
	if (abortController) {
		abortController.abort();
	}
	abortController = new AbortController();	
	// const items = await getBoxTiles(abortController.signal, bbox);	
	let items = [
		{x: 2, y: 1, z: 3},
		{x: 9, y: 5, z: 4}
	];

	Promise.all(
		items.map(({x, y, z}) => {
			return fetch(`/tiles/${z}/${x}/${y}.pbf`)
			.then(res => res.blob())
			.then(blob => blob.arrayBuffer())
			.then(buf => {				
				const t = {};
				if (renderNum === moveendNum) {
					let tm = Date.now();
					const {layers} = new VectorTile(new Protobuf(buf));								
					Object.keys(layers).forEach(k => {
						const layer = layers[k];
						t[k] = { features: [], x, y, z, extent: layer.extent };
						for (let i = 0; i < layer.length; ++i) {
							const vf = layer.feature(i);							
							const coordinates = vf.loadGeometry();
							const path = new Path2D();
							coordinates[0].forEach((p, i) => {
								if (i) {
									path.lineTo(p.x, p.y);
								}
								else {
									path.moveTo(p.x, p.y);
								}
					

							});
							t[k].features.push({type: vf.type, path});							
						}					
					});				
					console.log(z, x, y, renderFlag, renderNum, moveendNum, 'parse pbf tm:', Date.now() - tm);
				}
				else {
					console.log('++++ отмена parse:', z, x, y, renderNum, moveendNum);
				}
				return t;
			});
		})
	)
	.then(tiles => {		
		if (renderNum === moveendNum) {

			const ctx = canvas.getContext("2d");
			// ctx.resetTransform();
			ctx.clearRect(0, 0, cwidth, cheight);
			let tm = Date.now();
			tiles.forEach(layers => {
				Object.keys(layers).forEach(k => {
					const {features, x, y, z, extent} = layers[k];				
					const tw = 1 << (8 + zoom - z);
					let x0 = x * tw - bounds.min.x;
					if (x0 + tw < 0) {
						x0 += Math.pow(2, z) * tw;
					}

					const y0 = y * tw - bounds.min.y;
					const sc = tw / extent;
					// console.log('offsetx:', x, y, z, extent, x0, y0, tw, sc);

					// ctx.transform(0.5, 0, 0, 0.5, 0, 220);
// ctx.lineWidth = 10;
// ctx.strokeRect(75, 140, 150, 110);
// ctx.fillRect(130, 190, 40, 60);

					ctx.save();
					ctx.resetTransform();
					ctx.beginPath();
					let region = new Path2D();
					region.rect(x0, y0, tw, tw);
					ctx.clip(region);
					ctx.transform(sc, 0, 0, sc, x0, y0);

					features.forEach(feature => {
						if (feature.type === 3) {															
							Renderer.render2dpbf(ctx, feature.path);
						}
					});
					ctx.restore();
				});
			});		
			console.log(renderFlag, renderNum, moveendNum, 'tm:', Date.now() - tm);
			bitmapToMain(canvas);
			console.log('transfer:', Date.now() - tm);
			renderFlag = false;
		}
		else {
			console.log('----- отмена rendering:', renderNum, moveendNum);
		}
		renderNum++;
	})
	.catch(() => {});
}

const bitmapToMain = canvas => {
	self.postMessage({
		cmd: 'rendered'
	});
	// var imageData = canvas.transferToImageBitmap();
	// self.postMessage({
		// cmd: 'rendered',
		// bitmap: imageData
	// }, [ imageData ]);
};

addEventListener('tilesLoaded', getTiles);

let renderFlag = false;
let renderNum = 1;
let moveendNum = 0;
onmessage = function(evt) {    
	const data = evt.data || {};
	const {cmd, zoom, bbox, bounds, width, height} = data;	
	switch(cmd) {
		case 'addLayer':
			canvas = data.canvas;
			break;
		case 'drawScreen':
			cwidth = width;
			cheight = height;
			//canvas = new OffscreenCanvas(width, height);
			break;
		case 'moveend':
			moveendNum++;
			getTiles(zoom, bbox, bounds);
			break;
		default:
			console.warn('Warning: Bad command ', data);
			break;
	}
};

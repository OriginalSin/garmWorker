import './index.css';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CanvasLayer from './CanvasLayer.js';

window.addEventListener('load', async () => {
    const map = L.map('map', {}).setView([55.45, 37.37], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const dataManager = new Worker("dataManager.js");
    
    const dateEnd = Math.floor(Date.now() / 1000);
    const testLayer = new CanvasLayer({
        // dateBegin: dateEnd - 24 * 60 * 60,
        // dateEnd,
        dataManager
    });

    testLayer.addTo(map);

    const moveend = () => {
        const zoom = map.getZoom();
        const sbbox = map.getBounds();
        const sw = sbbox.getSouthWest();
        const ne = sbbox.getNorthEast();
        const m1 = L.Projection.Mercator.project(L.latLng([sw.lat, sw.lng]));
        const m2 = L.Projection.Mercator.project(L.latLng([ne.lat, ne.lng]));
    
		dataManager.postMessage({
			cmd: 'moveend',
			zoom,
			bbox: [m1.x, m1.y, m2.x, m2.y],
            bounds: map.getPixelBounds(),
		});
	}; 
	map.on('moveend', moveend);
	dataManager.onmessage = msg => {
		 // console.log('Main dataManager', msg.data);
		const data = msg.data || {};
		const {cmd, layerId, tileKey} = data;
		switch(cmd) {
			case 'rendered':
				// if (data.bitmap) {
				requestAnimationFrame(() => {
					testLayer.rendered(data.bitmap);
				});
				// }
				break;
			default:
				console.warn('Warning: Bad message from worker ', data);
				break;
		}

	};
 	moveend();
});
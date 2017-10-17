import React, { Component } from 'react';

import * as esriLoader from 'esri-loader';
import '../styles/Map.css'

class Map extends Component {
  constructor(props) {
    super(props);

    this.state = {

    };
    esriLoader.bootstrap((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Map loaded')
        this.createMap();
      }
    }, {
      // use a specific version instead of latest 4.x
      url: 'https://js.arcgis.com/3.22/'
    })
  }


  createMap() {
    esriLoader.dojoRequire(['esri/map'], (Map) => {
      this.map = new Map('map-container', {
        basemap: 'topo',
        center: [-122.45, 37.75],
        zoom: 13
      });
      // new MapView({
      //   map: this.map,
      //   container: 'map-container',
      // });
      this.setState({
        loaded: true
      })
    });
  }

  clearGraphicLayer() {
    this.map.graphics.clear();
  }

  addMarker(data, title) {
    esriLoader.dojoRequire([
      'esri/symbols/SimpleMarkerSymbol',
      'dojo/_base/Color',
      'esri/graphic',
    ], (SimpleMarkerSymbol, Color, Graphic) => {
      const point = data.result.feature.geometry;
      const symbol = new SimpleMarkerSymbol()
        .setStyle('square')
        .setColor(new Color([255, 0, 0, 0.5]));
      const graphic = new Graphic(point, symbol);
      this.map.graphics.add(graphic);

      this.map.infoWindow.setTitle(title);
      this.map.infoWindow.setContent(data.result.name);
      this.map.infoWindow.show(data.result.feature.geometry);
    })
  }

  render() {
    return (
      <div id="map-container">
        {
          this.props.children.map(ch => React.cloneElement(ch, { map: this.map }))
        }
      </div>
    );
  }
}

export default Map;

import React, { Component } from 'react';

import * as esriLoader from 'esri-loader';
import '../styles/Map.css'

class Map extends Component {
  constructor(props) {
    super(props);

    this.state = {

    };
    this.stops = []
    // esriLoader.bootstrap((err) => {
    //   if (err) {
    //     console.error(err);
    //   } else {
    //     console.log('Map loaded')
    //     this.createMap();
    //   }
    // }, {
    //   // use a specific version instead of latest 4.x
    //   url: 'https://js.arcgis.com/3.22/'
    // })
  }
  componentDidMount() {
    this.createMap();
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
        .setStyle(SimpleMarkerSymbol.STYLE_CROSS)
        .setColor(new Color([255, 0, 0, 0.5]))
        .setSize(15);
      symbol.outline.setWidth(4);
      const graphic = new Graphic(point, symbol);
      const stop = this.map.graphics.add(graphic);
      this.stops.push(stop)
      this.map.infoWindow.setTitle(title);
      this.map.infoWindow.setContent(data.result.name);
      this.map.infoWindow.show(data.result.feature.geometry);
    })
  }

  hidePopup() {
    this.map.infoWindow.hide()
  }

  calculateRoute() {
    esriLoader.dojoRequire([
      'esri/tasks/RouteTask',
      'esri/tasks/RouteParameters',
      'esri/symbols/SimpleLineSymbol',
      'esri/tasks/FeatureSet',
      'dojo/_base/Color',
    ], (RouteTask, RouteParameters, SimpleLineSymbol, FeatureSet, Color) => {
      this.routeTask = new RouteTask('https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World');

      // setup the route parameters
      const routeParams = new RouteParameters();
      routeParams.stops = new FeatureSet();
      routeParams.outSpatialReference = {
        wkid: 102100
      };

      this.routeTask.on('solve-complete', (evt) => {
        const routeSymbol = new SimpleLineSymbol().setColor(new Color([0, 0, 255, 0.5])).setWidth(5);
        this.map.graphics.add(evt.result.routeResults[0].route.setSymbol(routeSymbol));
        this.hidePopup()
      });
      this.routeTask.on('error', (err) => {
        console.error(err)
      });
      this.stops.forEach(stop => routeParams.stops.features.push(stop))
      this.routeTask.solve(routeParams)
    });
  }

  render() {
    return (
      <div id="map-container">
        {
          this.props.children.map((ch, index) => React.cloneElement(ch, { map: this.map, index }))
        }
      </div>
    );
  }
}

export default Map;

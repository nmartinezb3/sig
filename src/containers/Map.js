import React, { Component } from 'react';

import * as esriLoader from 'esri-loader';
import '../styles/Map.css'

class Map extends Component {
  constructor(props) {
    super(props);

    this.state = {
      time: 1000,
    };
    this.stops = []
    this.addCar = this.addCar.bind(this)
    this.updateCarPosition = this.updateCarPosition.bind(this)
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
      this.setState({
        loaded: true
      })
    });
  }

  clearGraphicLayer() {
    this.map.graphics.clear();
  }

  // startNavigation(coordinates) {
  //   const i = 0
  //   // this.gps = new GPS(coordinates, speed)
  // }

  stopTimer() {
    clearInterval(this.timer)
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

  addCar(coordinates) {
    esriLoader.dojoRequire([
      'esri/geometry/Point', 'esri/symbols/SimpleMarkerSymbol',
      'esri/Color', 'esri/InfoTemplate', 'esri/graphic',
    ], (Point, SimpleMarkerSymbol, Color, InfoTemplate, Graphic) => {
      const pt = new Point(coordinates[0], coordinates[1], this.map.spatialReference)
      const sms = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CIRCLE).setColor(new Color([255, 0, 0, 0.5]));
      const attr = {Xcoord: coordinates[0], Ycoord: coordinates[1], Plant: 'Mesa Mint'};

      this.car = new Graphic(pt, sms, attr);

      this.map.graphics.add(this.car);
    })
  }

  removeCar() {
    this.map.graphics.remove(this.car)
  }

  updateCarPosition(coordinates) {
    esriLoader.dojoRequire([
      'esri/geometry/Point',
    ], (Point) => {
      const p = new Point(coordinates[0], coordinates[1], this.map.spatialReference)
      console.log('updating car', p)
      this.car.setGeometry(p)
      // this.car.show()
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
        const routeResult = evt.result.routeResults[0]
        this.map.graphics.add(routeResult.route.setSymbol(routeSymbol));
        this.hidePopup()
        // this.startNavigation(routeResult.route.geometry.paths)
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
        <div className="main">
          <div className="row">
            <div id="map-container" className="col-md-9">
            </div>
            <div className="col-md-3">
              <div className="childs-container">
                {
                  this.props.children.map((ch, index) => React.cloneElement(ch, { map: this.map, index }))
                }
            </div>
            </div>
          </div>
        </div>
    );
  }
}

export default Map;

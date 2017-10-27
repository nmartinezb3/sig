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
    this.addRoute = this.addRoute.bind(this)
    this.showBuffer = this.showBuffer.bind(this);
    this.doBuffer = this.doBuffer.bind(this);
  }

  componentDidMount() {
    this.createMap();
  }


  createMap() {
    esriLoader.dojoRequire([
      'esri/map',
      'esri/layers/FeatureLayer',
      'esri/layers/ArcGISTiledMapServiceLayer'
    ],(
      Map,
      FeatureLayer,
      ArcGISTiledMapServiceLayer,
    )=>{
      this.map = new Map('map-container', {
        basemap: "topo",
        center: [-97.00, 39.90],
        zoom: 5
      });

      var basemap = new ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer");

      var layerPoblacion = new FeatureLayer('https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer/3', {
        opacity: 0.5,
      });
      // var layerPoblacion = new FeatureLayer('https://services.arcgis.com/V6ZHFr6zdgNZuVG0/arcgis/rest/services/Landscape_Trees/FeatureServer/0');
      //this.map.addLayers([basemap, layerPoblacion]);

      //this.map.on("click", this.doBuffer);

      this.setState({
        loaded: true
      })
    });
  }

  clearGraphicLayer() {
    this.map.graphics.clear();
  }

  addRoute(route) {
    const extent = route.geometry.getExtent()
    this.map.setExtent(extent)
    esriLoader.dojoRequire(['esri/symbols/SimpleLineSymbol', 'esri/Color'], (SimpleLineSymbol, Color) => {
      const routeSymbol = new SimpleLineSymbol().setColor(new Color([0, 0, 255, 0.5])).setWidth(5);
      this.map.graphics.add(route.setSymbol(routeSymbol));
    })
  }

  addRouteAndPoints(route) {
    const extent = route.geometry.getExtent()
    this.map.setExtent(extent)
    esriLoader.dojoRequire(['esri/symbols/SimpleLineSymbol', 'esri/Color'], (SimpleLineSymbol, Color) => {
      const routeSymbol = new SimpleLineSymbol().setColor(new Color([0, 0, 255, 0.5])).setWidth(5);
      this.map.graphics.add(route.setSymbol(routeSymbol));
    })
  }

  stopTimer() {
    clearInterval(this.timer)
  }

  addMarker(data, title, onMarkerAdded) {
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
      const attr = {description: data.result.name, website: 'www.sig-grupo2-2017.com'};
      const graphic = new Graphic(point, symbol, attr);
      const stop = this.map.graphics.add(graphic);
      this.stops.push(stop)
      this.map.infoWindow.setTitle(title);
      this.map.infoWindow.setContent(data.result.name);
      this.map.infoWindow.show(data.result.feature.geometry);
      onMarkerAdded(graphic)
    })
  }

  addMarkerFromPreviousLocation(feature, title) {
    esriLoader.dojoRequire([
      'esri/symbols/SimpleMarkerSymbol',
      'dojo/_base/Color',
      'esri/graphic',
    ], (SimpleMarkerSymbol, Color, Graphic) => {
      const symbol = new SimpleMarkerSymbol()
        .setStyle(SimpleMarkerSymbol.STYLE_CROSS)
        .setColor(new Color([255, 0, 0, 0.5]))
        .setSize(15);
      symbol.outline.setWidth(4);
      const graphic = new Graphic(feature.geometry, symbol);
      const stop = this.map.graphics.add(graphic);
      this.stops.push(stop)
      this.map.infoWindow.setTitle(title);
      this.map.infoWindow.setContent(feature.attributes.description);
      this.map.infoWindow.show(feature.geometry);
      this.map.centerAt(feature.geometry);
    })
  }

  addMarkerFromCoordinates(coordinates, wkid) {
    esriLoader.dojoRequire([
      'esri/symbols/SimpleMarkerSymbol',
      'dojo/_base/Color',
      'esri/graphic',
      'esri/geometry/Point',
      'esri/SpatialReference'
    ], (SimpleMarkerSymbol, Color, Graphic, Point, SpatialReference) => {
      const symbol = new SimpleMarkerSymbol()
        .setStyle(SimpleMarkerSymbol.STYLE_CROSS)
        .setColor(new Color([255, 0, 0, 0.5]))
        .setSize(15);
      symbol.outline.setWidth(4);
      const point = new Point(coordinates, new SpatialReference({ wkid }));
      const graphic = new Graphic(point, symbol);
      const stop = this.map.graphics.add(graphic);
      this.stops.push(stop)
      // this.map.infoWindow.setTitle(title);
      // this.map.infoWindow.setContent('');
      // this.map.infoWindow.show(point);
      this.map.centerAt(point);
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

      this.doBuffer(pt);

      this.car = new Graphic(pt, sms, attr);

      this.map.graphics.add(this.car);
    })
  }

  showBuffer(bufferedGeometries){
    esriLoader.dojoRequire([
      'esri/symbols/SimpleFillSymbol',
      'esri/symbols/SimpleLineSymbol',
      'esri/Color',
      'esri/graphic',
    ], (SimpleFillSymbol, SimpleLineSymbol, Color, Graphic)=>{
      console.log("entro a la funcion");
      var symbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([0,0,255,0.65]), 2
        ),
        new Color([0,0,255,0.35])
      );
      console.log("se llego al for sin error");
      for (var geoPos in bufferedGeometries){
        var geometry = bufferedGeometries[geoPos];
        var graph = new Graphic(geometry, symbol);
        this.map.graphics.add(graph);
      }
    })
  }

  doBuffer(point){
    esriLoader.dojoRequire([
      'esri/tasks/BufferParameters',
      'esri/tasks/GeometryService',
    ], (BufferParameters, GeometryService) =>{
      var params = new BufferParameters();
      params.geometries = [ point ]; 
      params.distances = [ 10 ];
      params.outSpatialReference = this.map.spatialReference;
      params.unit = GeometryService.UNIT_KILOMETER;

      this.gsvc = new GeometryService('https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer');
      
      this.gsvc.buffer(params, this.showBuffer);

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
            <div id="map-container" className="col-md-8">
            </div>
            <div className="col-md-4">
              <div className="childs-container">
                {
                  this.props.children.map((ch, index) => React.cloneElement(ch, { map: this.map, key: index }))
                }
            </div>
            </div>
          </div>
        </div>
    );
  }
}

export default Map;

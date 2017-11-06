import React, { Component } from 'react';

import * as esriLoader from 'esri-loader';

import '../styles/Map.css'

class Map extends Component {
  constructor(props) {
    super(props);

    this.RADIO_BUFFER = 10;

    this.state = {
      time: 1000,
      condados: [],
    };

    this.stops = [];
    this.condadosAbarcados = [];
    this.condadosAbarcadosGraphics = [];
    this.addCar = this.addCar.bind(this);
    this.updateCarPosition = this.updateCarPosition.bind(this);
    this.addRoute = this.addRoute.bind(this);
    this.showBuffer = this.showBuffer.bind(this);
    this.doBuffer = this.doBuffer.bind(this);
    this.createGS = this.createGS.bind(this);
    this.removeCar = this.removeCar.bind(this);
    this.mostrarInfoCondados = this.mostrarInfoCondados.bind(this);
    this.calcularInterseccion = this.calcularInterseccion.bind(this);
    this.calcularAreas = this.calcularAreas.bind(this);
    this.printMap = this.printMap.bind(this)
  }

  componentDidMount() {
    this.createMap();
    this.createGS();
  }

  createGS() {
    this.props.loading(true)
    esriLoader.dojoRequire([
      'esri/tasks/GeometryService',
    ], (GeometryService) => {
      this.props.loading(false)

      this.gsvc = new GeometryService('https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer');
    });
  }

  createMap() {
    this.props.loading(true)
    esriLoader.dojoRequire([
      'esri/map',
      'esri/layers/FeatureLayer',
      'esri/layers/ArcGISTiledMapServiceLayer',
      'esri/InfoTemplate',
    ], (
      Map,
      FeatureLayer,
      ArcGISTiledMapServiceLayer,
      InfoTemplate
    ) => {
      this.map = new Map('map-container', {
        basemap: 'topo',
        center: [-97.00, 39.90],
        zoom: 5
      });

      const info = new InfoTemplate('Nombre: ${NAME}', 'Población Total: ${TOTPOP_CY}');
      this.layerPoblacion = new FeatureLayer('https://services.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer/3', {
        outFields: ['ID', 'NAME', 'TOTPOP_CY', 'LANDAREA'],
        infoTemplate: info
      });

      this.setState({
        loaded: true
      })
      this.props.loading(false)
    });
  }

  clearGraphicLayer() {
    this.map.graphics.clear();
    this.map.graphics.refresh()
  }

  addRoute(route) {
    const extent = route.geometry.getExtent()
    this.map.setExtent(extent)

    this.props.loading(true)
    esriLoader.dojoRequire(['esri/symbols/SimpleLineSymbol', 'esri/Color'], (SimpleLineSymbol, Color) => {
      const routeSymbol = new SimpleLineSymbol().setColor(new Color([0, 0, 255, 0.5])).setWidth(5);
      this.map.graphics.add(route.setSymbol(routeSymbol));
      this.map.setZoom(this.map.getZoom() - 1)
      this.props.loading(false)
    })
  }

  addRouteAndPoints(route) {
    this.props.loading(true)

    const extent = route.geometry.getExtent()
    this.map.setExtent(extent)
    esriLoader.dojoRequire(['esri/symbols/SimpleLineSymbol', 'esri/Color'], (SimpleLineSymbol, Color) => {
      const routeSymbol = new SimpleLineSymbol().setColor(new Color([0, 0, 255, 0.5])).setWidth(5);
      this.map.graphics.add(route.setSymbol(routeSymbol));
      this.props.loading(false)
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

  addMarkerFromCoordinates(coordinates, sr) {
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
      const point = new Point(coordinates)
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
    const this2 = this
    esriLoader.dojoRequire([
      'esri/geometry/Point', 'esri/symbols/SimpleMarkerSymbol',
      'esri/Color', 'esri/InfoTemplate', 'esri/graphic', 'esri/tasks/BufferParameters',
      'esri/tasks/GeometryService',
    ], (Point, SimpleMarkerSymbol, Color, InfoTemplate, Graphic, BufferParameters, GeometryService) => {
      const pt = new Point(coordinates[0], coordinates[1], this2.map.spatialReference)// , this2.map.spatialReference

      // update color from speed
      const percentage = (this2.props.speed / this2.props.maxTimer) * 100
      const color = this2.getColorForPercentage(percentage)
      const sms = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CIRCLE).setColor(new Color([...color, 0.5]));
      const attr = {Xcoord: coordinates[0], Ycoord: coordinates[1], Plant: 'Mesa Mint'};

      this2.doBuffer(pt, BufferParameters, GeometryService);

      this2.car = new Graphic(pt, sms, attr);
      this2.map.graphics.add(this2.car);
    })
  }

  showBuffer(bufferedGeometries) {
    esriLoader.dojoRequire([
      'esri/symbols/SimpleFillSymbol',
      'esri/symbols/SimpleLineSymbol',
      'esri/Color',
      'esri/graphic',
      'esri/tasks/query',
    ], (SimpleFillSymbol, SimpleLineSymbol, Color, Graphic, Query) => {
      const symbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([0, 0, 255, 0.65]), 1
        ),
        new Color([0, 0, 255, 0])
      );

      // borro buffer anterior
      this.map.graphics.remove(this.buffer);
      this.bufferGeometry = bufferedGeometries[0];
      this.buffer = new Graphic(this.bufferGeometry, symbol);
      this.map.graphics.add(this.buffer);

      const query = new Query();
      query.geometry = this.bufferGeometry;
      this.layerPoblacion.queryFeatures(query, this.mostrarInfoCondados);
    })
  }

  mostrarInfoCondados(response) {
    esriLoader.dojoRequire([
      'esri/symbols/SimpleFillSymbol',
      'esri/symbols/SimpleLineSymbol',
      'esri/Color',
      'esri/graphic',
    ], (SimpleFillSymbol, SimpleLineSymbol, Color, Graphic) => {
      var features = response.features;

      // Limpio condados mostrados anteriormente
      this.condadosAbarcadosGraphics.forEach(condado => this.map.graphics.remove(condado));

      const rellenoCondados = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
          SimpleLineSymbol.STYLE_SOLID,
          new Color([70, 255, 150, 0.65]), 2
        ),
        new Color([70, 255, 150, 0.35])
      );

      this.geometriaCondados = []; 
      this.condadosAbarcados = [];
      this.condadosAbarcadosGraphics = [];

      // Esto muestra los condados que va abarcando el buffer, el nombre y 
      // la poblacion total de cada uno
      features.forEach((feature) => {
        console.log(`Nombre: ${feature.attributes.NAME}`);
        console.log(`Poblacion total: ${feature.attributes.TOTPOP_CY}`);
        console.log('--------------------------------------------');
        const condado = new Graphic(feature.geometry, rellenoCondados);
        this.condadosAbarcados.push(feature);
        this.condadosAbarcadosGraphics.push(condado);
        this.geometriaCondados.push(feature.geometry);
        this.map.graphics.add(condado);
      });

      console.log('*****************************************');
      console.log('*****************************************');

      //Calculo la intersección de cada condado con el buffer
      this.gsvc.intersect(this.geometriaCondados, this.bufferGeometry, this.calcularInterseccion);
    });
  }

  // Calcula el area de la interseccion de cada condado con el buffer
  calcularInterseccion(geometries){    
    esriLoader.dojoRequire([
      'esri/tasks/BufferParameters',
      'esri/tasks/GeometryService',
      'esri/tasks/AreasAndLengthsParameters',
    ], (BufferParameters, GeometryService, AreasAndLengthsParameters) => {

      this.areasAndLengthParams = new AreasAndLengthsParameters();
      this.areasAndLengthParams.lengthUnit = GeometryService.UNIT_KILOMETER;
      this.areasAndLengthParams.areaUnit = GeometryService.UNIT_SQUARE_KILOMETERS;
      this.areasAndLengthParams.calculationType = "geodesic";
      this.areasAndLengthParams.polygons = geometries;
      this.gsvc.areasAndLengths(this.areasAndLengthParams, this.calcularAreas);

    });
  }


  calcularAreas(interseccionBuffer){
    var areasIntersectadas = interseccionBuffer.areas;
    let infoCondados = [];
    var i = 0;
    this.condadosAbarcados.forEach(condado => {
      const areaTotal = condado.attributes["LANDAREA"] * 2.59;
      let nuevoCondado = {
        nombre:  condado.attributes["NAME"], 
        area_total: areaTotal,
        poblacion_total: condado.attributes["TOTPOP_CY"],
        area_int: areasIntersectadas[i],
      };
      // nuevoCondado.nombre = condado.attributes["NAME"];
      // nuevoCondado.area_total = condado.attributes["LANDAREA"] * 2.59; //Esto es para convertir de millas cuadradas a km2
      // nuevoCondado.poblacion_total = condado.attributes["TOTPOP_CY"];
      // nuevoCondado.area_int = areasIntersectadas[i];
      nuevoCondado.poblacion_est = Math.round((nuevoCondado.area_int * nuevoCondado.poblacion_total) / nuevoCondado.area_total);

      infoCondados.push(nuevoCondado);

      //console.log(nombreCondado + "- Población Total: " + poblacionTotalCondado + " - Población Intersectada: " + poblacionIntersectadaCondado);
      i = i + 1;
    })
    this.setState({condados: infoCondados});
  }

  doBuffer(point) {
    esriLoader.dojoRequire([
      'esri/tasks/BufferParameters',
      'esri/tasks/GeometryService',
    ], (BufferParameters, GeometryService) => {
      const params = new BufferParameters();
      params.geometries = [point];
      params.distances = [this.RADIO_BUFFER];
      params.outSpatialReference = this.map.spatialReference;
      params.unit = GeometryService.UNIT_KILOMETER;

      this.gsvc.buffer(params, this.showBuffer);
    })
  }


  removeCar() {
    this.map.graphics.remove(this.car)
  }

  updateCarPosition(coordinates, shouldSetSpatialReference) {
    esriLoader.dojoRequire([
      'esri/geometry/Point',
      'esri/symbols/SimpleMarkerSymbol',
      'dojo/_base/Color',
    ], (Point, SimpleMarkerSymbol, Color) => {
      let p;
      if (shouldSetSpatialReference) {
        p = new Point(coordinates[0], coordinates[1])
      } else {
        p = new Point(coordinates[0], coordinates[1], this.map.spatialReference)
      }
      console.log('updating car', p)
      this.car.setGeometry(p)

      // update color from speed
      const percentage = (this.props.speed / this.props.maxTimer) * 100
      console.log('Percentage: ', percentage)
      const color = this.getColorForPercentage(percentage)
      console.log(color)
      const symbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_CIRCLE).setColor(new Color([...color, 0.5]));
      this.car.setSymbol(symbol);

      this.doBuffer(p);
    })
  }

  getColorForPercentage = (pct) => {
    const hslToRgb = (h, s, l) => {
      let r,
        g,
        b;

      if (s == 0) {
        r = g = b = l; // achromatic
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + (1 / 3));
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - (1 / 3));
      }

      return [Math.floor(r * 255), Math.floor(g * 255), Math.floor(b * 255)];
    }
    // as the function expects a value between 0 and 1, and red = 0° and green = 120°
    // we convert the input to the appropriate hue value
    const hue = (pct * 1.2) / 360;
    // we convert hsl to rgb (saturation 100%, lightness 50%)
    const rgb = hslToRgb(hue, 1, 0.5);
    // we format to css value and return
    return rgb;
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

  printMap() {
    this.props.loading(true)
    esriLoader.dojoRequire([
      'esri/tasks/PrintTask',
      'esri/tasks/PrintParameters',
      'esri/tasks/PrintTemplate'
    ], (PrintTask, PrintParameters, PrintTemplate) => {
      this.printTask = new PrintTask('http://sampleserver5.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task')
      const template = new PrintTemplate();
      // template.exportOptions = {
      //   width: 500,
      //   height: 400,
      //   dpi: 96
      // };
      template.format = 'PDF';
      template.preserveScale = false;

      const params = new PrintParameters();
      params.map = this.map;
      params.template = template;

      this.printTask.execute(params, (res) => {
        window.open(res.url, '_blank')
        this.props.loading(false)
      }, (error) => {
        this.props.loading(false)
      })
    })
  }

  render() {
    return (
        <div className="main">
            <div className="row">
                <div id="map-container" className="col-md-8">
                <i className="fa fa-print print-icon" aria-hidden="true" onClick={this.printMap}></i>
                </div>
                <div className="col-md-4">
                    <div className="childs-container">
                        {
                        this.props.children.map((ch, index) => React.cloneElement(ch, { map: this.map, key: index }))
                        }
                    </div>
                </div>
            </div>
            <div className="row">
                <div>
                    Condados abarcados:
                    {
                        this.state.condados.map((condado, index) => (
                            <h3> {condado.nombre} : {condado.poblacion_est} </h3>
                            // <p> Población total: {condado.attributes.poblacion_total} </p>
                            // <p>Área total: {condado.attributes.area_total}</p>
                            // <p>Área intersectada: {condado.attributes.area_int}</p>
                            // <p>Población estimada: {condado.attributes.poblacion_est}</p>
                        ))
                    }
                </div>
            </div>
        </div>
    );
  }
}

export default Map

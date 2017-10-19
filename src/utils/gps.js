import * as esriLoader from 'esri-loader';

class GPS {
  constructor() {
    this.iteration = 0
    this.getNewCoordinate = this.getNewCoordinate.bind(this)
  }

  setSpeed(speed) {
    this.speed = Number(speed)
    this.stop()
    this.start()
  }

  setCoordinates(coordinates) {
    this.coordinates = coordinates
  }

  getInterval() {
    return (this.distance / this.speed) * 3600000
  }

  getNewCoordinate() {
    if (this.coordinates.length > this.iteration) {
      const coordinate = this.coordinates[this.iteration]
      const isFirst = this.iteration === 0
      this.iteration += 1
      this.callback(coordinate, isFirst)
    } else {
      this.stop()
    }
  }

  start() {
    // this.getNewCoordinate()
    this.timer = setInterval(this.getNewCoordinate, this.getInterval())
  }

  stop() {
    clearInterval(this.timer)
  }

  startNavigation(stops, speed, coordinateCallback) {
    esriLoader.dojoRequire([
      'esri/tasks/RouteTask',
      'esri/tasks/RouteParameters',
      'esri/tasks/FeatureSet',
    ], (RouteTask, RouteParameters, FeatureSet) => {
      const routeTask = new RouteTask('https://route.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World');
      const routeParams = new RouteParameters();
      routeParams.stops = new FeatureSet();
      routeParams.outSpatialReference = {
        wkid: 102100
      };
      stops.forEach(stop => routeParams.stops.features.push(stop))
      const gpsThis = this
      routeTask.on('solve-complete', (evt) => {
        const routeResult = evt.result.routeResults[0]
        gpsThis.coordinates = routeResult.route.geometry.paths[0]
        gpsThis.distance = routeResult.route.attributes.Total_Kilometers
        gpsThis.speed = speed
        gpsThis.callback = coordinateCallback

        // start simulating gps
        gpsThis.start()
      });

      routeTask.on('error', (err) => {
        console.error(err)
      });
      routeTask.solve(routeParams)
    });
  }
}

export default GPS

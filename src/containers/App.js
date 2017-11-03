import React, { Component } from 'react';
import * as esriLoader from 'esri-loader';
import className from 'classnames'
import '../styles/App.css';
import Map from './Map'
import GeocodeSearchInput from '../components/GeocodeSearchInput'
import GPS from '../utils/gps'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      firstPoint: true,
      speed: 1000,
      stops: [],
      destinations: [],
      serverFeatures: [],
      serverRoutes: []
    }
    this.gps = new GPS()
    this.onChangeSpeed = this.onChangeSpeed.bind(this)
    this.startNavigation = this.startNavigation.bind(this)
    this.onSelectLocation = this.onSelectLocation.bind(this)
    this.onClickStartStopNavigation = this.onClickStartStopNavigation.bind(this)
    this.deleteOldDestinations = this.deleteOldDestinations.bind(this)
    this.loadFeatureServer = this.loadFeatureServer.bind(this)
    this.deleteOldRoutes = this.deleteOldRoutes.bind(this)
    this.onSelectPreviousRoute = this.onSelectPreviousRoute.bind(this)
  }
  componentWillMount() {
    esriLoader.bootstrap((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('ESRI loaded')
        this.login();
        this.loadFeatureServer()
      }
    }, {
      // use a specific version instead of latest 4.x
      url: 'https://js.arcgis.com/3.22/'
    })
  }

  loadFeatureServer() {
    esriLoader.dojoRequire(
      ['esri/layers/FeatureLayer',
        'esri/tasks/query'],
      (FeatureLayer, Query) => {
        this.featureLayer = new FeatureLayer('http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Events/FeatureServer/0')
        this.routesFeatureLayer = new FeatureLayer('http://sampleserver5.arcgisonline.com/arcgis/rest/services/LocalGovernment/Recreation/FeatureServer/1')

        const query = new Query();
        query.where = "website = 'www.sig-grupo2-2017.com'"
        query.outFields = ['*'];
        this.featureLayer.queryFeatures(
          query,
          (featureSet) => {
            const results = featureSet.features
            this.setState({
              serverFeatures: results
            })
          },
          (error) => {
            console.error(error)
          }
        );

        const routeQuery = new Query();
        routeQuery.where = 'trailtype = 19178'
        routeQuery.outFields = ['*'];
        this.routesFeatureLayer.queryFeatures(
          routeQuery,
          (featureSet) => {
            const results = featureSet.features
            //   .filter(feature => feature.attributes.notes && feature.attributes.notes.includes('--sig2017g2'))
            //   .map((feature) => {
            //     feature.attributes.notes = feature.attributes.notes.slice(0, -11)
            //     return feature
            //   })
            // debugger
            this.setState({
              serverRoutes: results
            })
          },
          (error) => {
            console.error(error)
          }
        );
      }
    )
  }

  login() {
    esriLoader.dojoRequire(
      ['esri/arcgis/OAuthInfo',
        'esri/IdentityManager'],
      (OAuthInfo, esriId) => {
        const info = new OAuthInfo({
          appId: 'oV9loJuupFSMCbK4',
          popup: false
        });
        esriId.registerOAuthInfos([info]);
        esriId.getCredential(`${info.portalUrl}/sharing`);
        esriId.checkSignInStatus(`${info.portalUrl}/sharing`).then(() => {

        }).otherwise(() => {

        });
      }
    )
  }

  onSelectLocation(data) {
    const { stops, destinations} = this.state
    stops.push(data.result.feature)
    destinations.push(data.result.name)
    this.setState({
      stops,
      destinations
    })
    this.refs.map.addMarker(data, 'Origen', (graphic) => {
      this.featureLayer.applyEdits(
        [graphic], null, null,
        (result) => {
          console.log(result)
        },
        (error) => {
          console.error(error)
        }
      );
    })
  }

  onSelectPreviousLocation(feature) {
    const { stops, destinations} = this.state
    stops.push(feature)
    destinations.push(feature.attributes.description)
    this.setState({
      stops,
      destinations
    })
    this.refs.map.addMarkerFromPreviousLocation(feature)
  }

  startNavigation() {
    this.refs.map.hidePopup()
    if (!this.hasSelectedAPreviousRoute) {
      // has selected origin and destination, must calculate route
      this.gps.startNavigation(
        this.state.stops, this.state.speed,
        (coordinate, isFirst) => {
          // on new coordinate
          if (isFirst) {
            this.refs.map.addCar(coordinate)
            this.setState({
              navigationActive: true
            })
          } else {
            this.refs.map.updateCarPosition(coordinate)
          }
          console.log(coordinate)
        },
        (route) => {
          // on route loaded
          this.setState({
            routeKm: route.attributes.Total_Kilometers,
            routeName: route.attributes.Name
          })
          this.routesFeatureLayer.applyEdits(
            [route], null, null,
            (result) => {
              // console.log(result)
              this.refs.map.addRoute(route)
            },
            (error) => {
              // console.error(error)
            }
          );
        },
        () => {
          // on finish navigation
          this.setState({
            navigationActive: false
          })
        }
      )
    } else {
      this.gps.startNavigationWithOldRoute(
        this.state.selectedRoute, this.state.speed,
        (coordinate, isFirst) => {
          // on new coordinate
          if (isFirst) {
            this.refs.map.addCar(coordinate)
            this.setState({
              navigationActive: true
            })
          } else {
            this.refs.map.updateCarPosition(coordinate, true)
          }
          console.log(coordinate)
        },
        () => {
          // on finish navigation
          this.setState({
            navigationActive: false,
            selectedRoute: undefined
          })
          this.hasSelectedAPreviousRoute = false
        }
      )
    }
  }

  onChangeSpeed(e) {
    this.gps.setSpeed(e.target.value)
    this.setState({speed: e.target.value})
  }

  onClickStartStopNavigation() {
    if (this.state.stops.length < 2) {
      return
    }
    if (this.state.navigationActive) {
      this.gps.stopNavigation()
      this.refs.map.clearGraphicLayer()
      this.setState({
        navigationActive: false
      })
    } else {
      this.startNavigation()
    }
  }

  deleteOldDestinations() {
    this.featureLayer.applyEdits(
      null, null, this.state.serverFeatures,
      (result) => {
        this.setState({
          serverFeatures: []
        })
        console.log(result)
      },
      (error) => {
        console.error(error)
      }
    );
  }

  deleteOldRoutes() {
    this.routesFeatureLayer.applyEdits(
      null, null, this.state.serverRoutes,
      (result) => {
        this.setState({
          serverRoutes: []
        })
        console.log(result)
      },
      (error) => {
        console.error(error)
      }
    );
  }

  onSelectPreviousRoute(route) {
    // debugger
    // this.setState({
    //   routeKm: route.attributes.Total_Kilometers,
    //   routeName: route.attributes.Name
    // })
    const sr = route.geometry.spatialReference
    const start = route.geometry.paths[0][0]
    const end = route.geometry.paths[0][route.geometry.paths[0].length - 1]
    this.refs.map.addMarkerFromCoordinates(end, sr)
    this.refs.map.addMarkerFromCoordinates(start, sr)
    this.refs.map.addRoute(route)
    this.setState({
      stops: [start, end],
      selectedRoute: route
    })
    this.hasSelectedAPreviousRoute = true
  }

  render() {
    return (
    <div className="app">
      <div className="header">
        SIG
      </div>
      <Map ref="map">
        <GeocodeSearchInput
          onSelectLocation={this.onSelectLocation}
          placeholder='Ingrese una ubicación'
        />

        <div className="old-destinations-container">
          {this.state.serverFeatures.length > 0 && (
            <div>
              <span>Destinos anteriores     </span>
              <i className="fa fa-trash pointer" aria-hidden="true" onClick={this.deleteOldDestinations}></i>
            </div>
          )}
        </div>

        <ul className="list-group old-destinations">
          {
            this.state.serverFeatures.map((f, index) => (
              <li className="list-group-item" key={index} >
                <div className='list-item-container'>
                  <span>{f.attributes.description}</span>
                  <i className="fa fa-plus pointer add-location" aria-hidden="true" onClick={() => this.onSelectPreviousLocation(f)}></i>
                </div>
              </li>
            ))
          }
        </ul>


        <div className="old-destinations-container">
          {this.state.serverRoutes.length > 0 && (
            <div>
              <span>Rutas anteriores     </span>
                <i className="fa fa-trash pointer" aria-hidden="true" onClick={this.deleteOldRoutes}></i>
            </div>
          )}
        </div>
        <ul className="old-destinations list-group">
          {
            this.state.serverRoutes.map((f, index) => (
              <li className="list-group-item" key={index} >
                <div className='list-item-container'>
                  <span>{f.attributes.notes}</span>
                  <i className="fa fa-plus pointer add-location" aria-hidden="true" onClick={() => this.onSelectPreviousRoute(f)}></i>
                </div>
              </li>
            ))
          }
      </ul>


        <div className="destinations">{this.state.stops.length > 0 && <span>Destinos seleccionados:</span>}</div>
        <ul className="list-group">
          {this.state.destinations.map((dest, index) => (
            <li className="list-group-item" key={index}>
              {dest}
            </li>
          ))}
        </ul>
        <button
          className={className({'btn btn-success start-navigation-button': true, disabled: this.state.stops.length < 2})}
          onClick={this.onClickStartStopNavigation}>
          {!this.state.navigationActive ? 'Iniciar navegación' : 'Parar navegación'}
        </button>
        <div className="speed">
          Velocidad:
          <input
            type="range"
            name="points"
            min="1"
            max="1000"
            value={this.state.speed}
            onChange={this.onChangeSpeed}
          />
        </div>
      </Map>
    </div>
    );
  }
}

export default App;

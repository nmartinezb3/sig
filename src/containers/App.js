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
      speed: 100000,
      stops: [],
      destinations: [],
      serverFeatures: []
    }
    this.gps = new GPS()
    this.onChangeSpeed = this.onChangeSpeed.bind(this)
    this.startNavigation = this.startNavigation.bind(this)
    this.onSelectLocation = this.onSelectLocation.bind(this)
    this.onClickStartStopNavigation = this.onClickStartStopNavigation.bind(this)
    this.deleteOldDestinations = this.deleteOldDestinations.bind(this)
    this.loadFeatureServer = this.loadFeatureServer.bind(this)
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
        routeQuery.where = '1 = 1'
        routeQuery.outFields = ['*'];
        this.routesFeatureLayer.queryFeatures(
          routeQuery,
          (featureSet) => {
            debugger
            const results = featureSet.features
            this.setState({
              serverRoutes: results
            })
          },
          (error) => {
            debugger
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
        this.refs.map.addRoute(route)
        debugger
        this.routesFeatureLayer.applyEdits(
          [route], null, null,
          (result) => {
            debugger
            console.log(result)
          },
          (error) => {
            debugger
            console.error(error)
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
              <button
                className="btn btn-danger"
                onClick={this.deleteOldDestinations}>
                Eliminar
              </button>
            </div>
          )}
        </div>
        <ul className="old-destinations">
          {
            this.state.serverFeatures.map((f, index) => (
              <li key={index} >
                <div>
                  <span>{f.attributes.description}</span>
                  <i className="fa fa-plus pointer add-location" aria-hidden="true" onClick={() => this.onSelectPreviousLocation(f)}></i>
                </div>
              </li>
            ))
          }
        </ul>
        <div className="destinations">{this.state.stops.length > 0 && <span>Destinos seleccionados:</span>}</div>
        <ul>
          {this.state.destinations.map((dest, index) => (
            <li key={index}>
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
            min="0"
            max="100000000"
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

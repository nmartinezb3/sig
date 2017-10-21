import React, { Component } from 'react';
import * as esriLoader from 'esri-loader';

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
      stops: []
    }
    this.gps = new GPS()
    this.onChangeSpeed = this.onChangeSpeed.bind(this)
    this.startNavigation = this.startNavigation.bind(this)
    this.onSelectLocation = this.onSelectLocation.bind(this)
  }
  componentWillMount() {
    esriLoader.bootstrap((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('ESRI loaded')
        this.login();
      }
    }, {
      // use a specific version instead of latest 4.x
      url: 'https://js.arcgis.com/3.22/'
    })
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
    const { stops } = this.state
    // const newData = JSON.parse(JSON.stringify(data))
    stops.push(data)
    this.setState({
      stops
    })
    this.refs.map.addMarker(data, 'Origen')
  }

  startNavigation() {
    this.refs.map.hidePopup()
    console.log(this.state.stops.map(s => s.result.feature.geometry))
    this.gps.startNavigation(this.state.stops, this.state.speed, (coordinate, isFirst) => {
      if (isFirst) {
        this.refs.map.addCar(coordinate)
      } else {
        this.refs.map.updateCarPosition(coordinate)
      }
      console.log(coordinate)
    })
  }

  onChangeSpeed(e) {
    this.gps.setSpeed(e.target.value)
    this.setState({speed: e.target.value})
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
        <div className="destinations">{this.state.stops.length > 0 && <span>Destinos:</span>}</div>
        <ul>
          {this.state.stops.map((stop, index) => (
            <li key={index}>
              {stop.result.name}
            </li>
          ))}
        </ul>
        <button className="btn btn-success start-navigation-button" onClick={this.startNavigation}>Iniciar navegación</button>
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

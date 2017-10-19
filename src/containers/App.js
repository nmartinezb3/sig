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
      speed: 100000
    }
    this.gps = new GPS()
    this.hasNewCoordinate = this.hasNewCoordinate.bind(this)
    this.onChangeSpeed = this.onChangeSpeed.bind(this)
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

  onSelectLocation = (data) => {
    if (!this.stops) {
      this.refs.map.addMarker(data, 'Origen')
      this.stops = [data.result.feature]
    } else {
      this.refs.map.addMarker(data, 'Destino')
      this.stops.push(data.result.feature)
      this.refs.map.hidePopup()
      this.gps.startNavigation(this.stops, this.state.speed, this.hasNewCoordinate)
    }
  }

  hasNewCoordinate(coordinate, isFirst) {
    if (isFirst) {
      this.refs.map.addCar(coordinate)
    } else {
      this.refs.map.updateCarPosition(coordinate)
    }
    console.log(coordinate)
  }

  onChangeSpeed(e) {
    this.gps.setSpeed(e.target.value)
    this.setState({speed: e.target.value})
  }

  render() {
    return (
    <div className="app">
      <Map ref="map">
        <GeocodeSearchInput
          index={1}
          onSelectLocation={this.onSelectLocation}
          placeholder='Ingrese un origen'
        />
        <GeocodeSearchInput
          index={2}
          onSelectLocation={this.onSelectLocation}
          placeholder='Ingrese un destino'

        />
        <input
          type="number"
          placeholder="Velocidad (km/h)"
          value={this.state.speed}
          onChange={this.onChangeSpeed}
        />
      </Map>
    </div>
    );
  }
}

export default App;

import React, { Component } from 'react';
import * as esriLoader from 'esri-loader';

import '../styles/App.css';
import Map from './Map'
import GeocodeSearchInput from '../components/GeocodeSearchInput'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      firstPoint: true,
    }
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
        console.log('asdsadasdklasldasl')
        esriId.getCredential(`${info.portalUrl}/sharing`);

        esriId.checkSignInStatus(`${info.portalUrl}/sharing`).then(() => {
          console.log('success login')
        }).otherwise(() => {
          console.log('error login')
        });
      }
    )
  }

  onSelectLocation = (data) => {
    if (this.state.firstPoint) {
      this.refs.map.addMarker(data, 'Origen')
      this.setState({
        firstPoint: false,
        origin: {
          geometry: data.result.feature.geometry,
          name: data.result.name
        }
      })
    } else {
      this.refs.map.addMarker(data, 'Destino')
      this.setState({
        destination: {
          geometry: data.result.feature.geometry,
          name: data.result.name
        }
      })
      this.refs.map.calculateRoute()
    }
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
      </Map>
    </div>
    );
  }
}

export default App;

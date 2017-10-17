import React, { Component } from 'react';
import '../styles/App.css';
import Map from './Map'
import GeocodeSearchInput from '../components/GeocodeSearchInput'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      firstPoint: true,
      searchPlaceholder: 'Ingrese Origen'
    }
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

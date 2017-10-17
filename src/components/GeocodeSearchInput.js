import React, { Component } from 'react';
import * as esriLoader from 'esri-loader';
import '../styles/GeocodeSearchInput.css'

class GeocodeSearchInput extends Component {
  constructor(props) {
    super(props);

    this.state = {

    };
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.map && nextProps.map) {
      this.setState({
        map: nextProps.map,
      })
      this.renderInput()
    }
  }

  renderInput() {
    esriLoader.dojoRequire(
      ['esri/dijit/Geocoder', 'dojo/dom'],
      (Geocoder, dom) => {
        const { map } = this.state
        this.geocoder = new Geocoder({
          map,
          autoComplete: true,
          arcgisGeocoder: {
            placeholder: this.props.placeholder
          },
        }, dom.byId(`geocode-search-input-${this.props.index}`));
        this.geocoder.startup();

        this.geocoder.on('select', this.props.onSelectLocation);
      }
    )
  }

  render() {
    return (
      <div className="geocode-search-input" style={{top: `${35 * this.props.index}px`, zIndex: `${3 - this.props.index}`}} >
        <div id={`geocode-search-input-${this.props.index}`}></div>
      </div>
    );
  }
}

export default GeocodeSearchInput;

import React, { Component } from 'react';
import * as esriLoader from 'esri-loader';
import '../styles/Map.css'

class Class extends Component {
  constructor(props) {
    super(props);

    this.state = {

    };
  }

  componentWillMount() {
    esriLoader.bootstrap((err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Map loaded')
        this.createMap();
      }
    });
  }

  createMap() {
    esriLoader.dojoRequire(['esri/Map', 'esri/views/MapView'], (Map, MapView) => {

      let myMap = new Map({
        basemap: 'streets'
      });

      let view = new MapView({
        map: myMap,
        container: "map-container",
      });

    });
  }


  render() {
    return (
      <div id="map-container"></div>
    );
  }

}

export default Class;

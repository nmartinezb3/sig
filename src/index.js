/* global document */
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';

import App from './containers/App';
import store from './reducers/index'


ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

import { applyMiddleware, createStore, combineReducers } from 'redux';
import main from './main';
import ReduxThunk from 'redux-thunk'

const reducers = combineReducers({
  main,
})


const store = createStore(
  reducers,
  applyMiddleware(ReduxThunk)
);

export default store;

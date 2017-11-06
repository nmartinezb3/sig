import * as ActionTypes from '../actions/ActionTypes'

const initialState = {
  loading: 0
}

const main = (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.LOADING:
      console.log(action.data)
      return {
        ...state,
        loading: action.data ? state.loading + 1 : state.loading - 1
      };
    default:
      return state;
  }
};

export default main;

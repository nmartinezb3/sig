import * as ActionTypes from '../actions/ActionTypes'

const initialState  = {

}

const main = (state = initialState, action) => {
    switch(action.type) {

        case ActionTypes.ACTION:
          return {
            ...state,
          };
        default:
            return state;
    }
};

export default main;

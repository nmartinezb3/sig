import {LOADING} from './ActionTypes'

export const loading = (bool) => {
  return {
    type: LOADING,
    data: bool
  }
}

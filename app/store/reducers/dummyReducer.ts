const initialState = {
  dummy: true
}

export default function dummyReducer(state = initialState, { type, payload }) {
  switch (type) {
    case 'DUMMY_ACTION':
      return { ...state, ...payload }

    default:
      return state
  }
}

import { combineReducers } from 'redux';
import usdcReducer from './usdcReducer';

const rootReducer = combineReducers({
    usdc: usdcReducer,
    // Add other reducers here as needed
});

export default rootReducer;

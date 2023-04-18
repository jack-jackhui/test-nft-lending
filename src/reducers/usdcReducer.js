import { DEPOSIT_USDC } from '../actions/usdcActions';
import { OPT_IN_USDC } from '../actions/optInToUSDC';

const initialState = {
    balance: 0,
    optIn: null,
    // Add other initial state properties as needed
};

const usdcReducer = (state = initialState, action) => {
    switch (action.type) {
        case DEPOSIT_USDC:
            return { ...state, balance: state.balance + action.payload.amount };
        case OPT_IN_USDC:
            return {
                ...state,
                optIn: action.payload,
            };
        // Add other action cases as needed
        default:
            return state;
    }
};

export default usdcReducer;

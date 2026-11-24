import * as React from 'react';
import CheckoutScreenView from './CheckoutScreenView';
import {useCheckoutScreenController} from './application/useCheckoutScreenController';
/** Screen composition only; cards own their complete visual flows. */
export default function CheckoutScreen(props:Parameters<typeof useCheckoutScreenController>[0]){
const model=useCheckoutScreenController(props);
return <CheckoutScreenView model={model}/>;
}

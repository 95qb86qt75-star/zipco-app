import * as React from 'react';
import ServiceCheckoutScreenView from './ServiceCheckoutScreenView';
import {useServiceCheckoutScreenController} from './application/useServiceCheckoutScreenController';
/** Screen composition only; cards own their complete visual flows. */
export default function ServiceCheckoutScreen(props:Parameters<typeof useServiceCheckoutScreenController>[0]){
const model=useServiceCheckoutScreenController(props);
return <ServiceCheckoutScreenView model={model}/>;
}

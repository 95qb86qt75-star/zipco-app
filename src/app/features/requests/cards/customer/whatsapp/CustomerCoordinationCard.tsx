import * as React from 'react';
import CustomerCoordinationCardView from './CustomerCoordinationCardView';
import {useCustomerCoordinationCardController} from './application/useCustomerCoordinationCardController';
/** Composition only; the view owns presentation and the controller owns commands. */
export default function CustomerCoordinationCard(props:Parameters<typeof useCustomerCoordinationCardController>[0]){
const model=useCustomerCoordinationCardController(props);
return <CustomerCoordinationCardView model={model}/>;
}
